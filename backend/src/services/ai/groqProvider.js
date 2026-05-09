import { AIProvider } from './aiProviderInterface.js';
import { config } from '../../config/index.js';

// Polyfill missing browser APIs for pdf-parse/pdfjs-dist (must be before import)
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor() { this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0; }
  };
}
if (typeof globalThis.ImageData === 'undefined') {
  globalThis.ImageData = class ImageData {
    constructor(w, h) { this.width = w; this.height = h; this.data = new Uint8ClampedArray(w * h * 4); }
  };
}
if (typeof globalThis.Path2D === 'undefined') {
  globalThis.Path2D = class Path2D { };
}

/**
 * Model hierarchy for fallback
 * Order: Most capable → Fastest (fallback)
 * 
 * Consequences of fallback:
 * - llama-3.3-70b: Best quality analysis, detailed fixes, accurate job matching
 * - llama-4-scout-17b: Good quality, slightly less nuanced suggestions
 * - llama-3.1-8b: Fast but basic analysis, may miss subtle issues, simpler suggestions
 * 
 * Fallback triggers: Rate limit (429), model overloaded, temporary unavailability
 * 
 * Token estimates per analysis:
 * - Input: ~1500 tokens (resume + prompt)
 * - Output: ~500-800 tokens (JSON response)
 * - Total: ~2000-2300 tokens per request
 * 
 * Free tier capacity (14,400 req/day):
 * - Conservative: 200 analyses/day
 * - Optimistic: 300 analyses/day
 */
const MODEL_HIERARCHY = [
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    tier: 'premium',
    maxTokens: 1024, // Reduced from 2048 - JSON response needs ~500-800
  },
  {
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout 17B',
    tier: 'standard',
    maxTokens: 1024,
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B',
    tier: 'fallback',
    maxTokens: 1024,
  },
];

/**
 * Groq AI Provider
 * 
 * Uses Llama models via Groq's fast inference API with automatic fallback.
 * Free tier: 30 RPM, 14,400 requests/day (shared across models)
 * 
 * Note: Groq doesn't support multimodal PDF input,
 * so we parse PDF to text first using pdf-parse.
 */
class GroqProvider extends AIProvider {
  constructor() {
    super();
    this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    this.models = MODEL_HIERARCHY;
    this.PdfParseClass = null;
  }

  get name() {
    return 'Groq';
  }

  isConfigured() {
    return !!config.groqApiKey;
  }

  /**
   * Extract text from PDF buffer
   */
  async extractPdfText(pdfBuffer) {
    try {
      // Lazy load pdf-parse
      if (!this.PdfParseClass) {
        const pdfParseModule = await import('pdf-parse');
        this.PdfParseClass = pdfParseModule.PDFParse;
      }
      const parser = new this.PdfParseClass({ data: pdfBuffer });
      const result = await parser.getText();
      await parser.destroy();
      return result.text;
    } catch (error) {
      console.error('PDF parsing error:', error.message);
      throw new Error('Failed to parse PDF. Please ensure the file is a valid PDF.');
    }
  }

  /**
   * Build the analysis prompt - OPTIMIZED for minimal tokens
   * 
   * Token budget breakdown (target ~1500 tokens input):
   * - System prompt: ~30 tokens
   * - Resume text: ~800-1000 tokens (truncated to 2500 chars)
   * - Job list: ~150 tokens (10 jobs max)
   * - Prompt structure: ~100 tokens
   * - Output: ~500-800 tokens
   * 
   * Total per request: ~2000-2500 tokens
   * At 14,400 req/day limit: can handle 200-300 analyses/day comfortably
   */
  buildPrompt(request, resumeText) {
    const { targetRole, experienceLevel, locationPreference, jobs } = request;
    
    // Compact job list - limit to 10 jobs, minimal format
    const jobList = jobs.slice(0, 10).map((j, i) => 
      `${i + 1}.${j.title}@${j.company}`
    ).join('|');

    // Aggressive truncation - 2500 chars is enough for key resume sections
    // This saves ~500 tokens vs 4000 chars
    const truncatedResume = resumeText.length > 2500 
      ? resumeText.slice(0, 2500) + '...'
      : resumeText;

    // Ultra-compact prompt - every word counts
    return `Role:${targetRole}|Exp:${experienceLevel}|Loc:${locationPreference}

RESUME:
${truncatedResume}

JOBS:${jobList}

JSON only:{overallScore:0-100,fixes:[{section,issue,suggestion,priority}],matchedJobs:[{jobIndex,matchScore,reason}],extractedSkills:[],summary}
Max 4 fixes(high-impact),4 job matches.Be concise.`;
  }

  /**
   * Check if error is retryable (should fallback to next model)
   */
  isRetryableError(status, errorData) {
    // Rate limit exceeded
    if (status === 429) return true;
    // Model overloaded or temporarily unavailable
    if (status === 503 || status === 502) return true;
    // Specific error codes from Groq
    const errorCode = errorData?.error?.code;
    if (errorCode === 'rate_limit_exceeded') return true;
    if (errorCode === 'model_overloaded') return true;
    if (errorCode === 'service_unavailable') return true;
    return false;
  }

  /**
   * Make API call to Groq with a specific model
   */
  async callModel(modelConfig, prompt) {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelConfig.id,
        messages: [
          {
            role: 'system',
            content: 'Resume analyst. JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2, // Lower = more consistent, fewer tokens wasted on creativity
        max_tokens: modelConfig.maxTokens,
        response_format: { type: 'json_object' },
      }),
    });

    return response;
  }

  /**
   * Analyze resume using Groq API with automatic model fallback
   */
  async analyzeResume(request) {
    if (!this.isConfigured()) {
      throw new Error('Groq API key not configured');
    }

    const { pdfBuffer, jobs } = request;
    
    // Parse PDF to text
    const resumeText = await this.extractPdfText(pdfBuffer);
    
    if (!resumeText || resumeText.trim().length < 100) {
      throw new Error('Could not extract sufficient text from PDF. Please ensure the PDF is not image-based.');
    }

    const prompt = this.buildPrompt(request, resumeText);
    
    let lastError = null;
    let usedModel = null;

    // Try each model in hierarchy
    for (let i = 0; i < this.models.length; i++) {
      const modelConfig = this.models[i];
      usedModel = modelConfig;

      try {
        console.log(`[Groq] Attempting analysis with ${modelConfig.name} (${modelConfig.tier})`);
        
        const response = await this.callModel(modelConfig, prompt);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          // Check if we should try next model
          if (this.isRetryableError(response.status, errorData) && i < this.models.length - 1) {
            console.warn(`[Groq] ${modelConfig.name} unavailable (${response.status}), falling back to ${this.models[i + 1].name}`);
            lastError = new Error(errorData.error?.message || `Model ${modelConfig.id} unavailable`);
            continue; // Try next model
          }
          
          // Non-retryable error or last model
          throw new Error(errorData.error?.message || `Groq API error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        const tokensUsed = data.usage?.total_tokens || 0;

        if (!text) {
          throw new Error('Empty response from Groq');
        }

        // Parse JSON response
        let parsed;
        try {
          const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
          parsed = JSON.parse(cleanedText);
        } catch (parseError) {
          console.error('Failed to parse Groq response:', text);
          // Try next model on parse failure (might be model-specific issue)
          if (i < this.models.length - 1) {
            console.warn(`[Groq] ${modelConfig.name} returned invalid JSON, trying ${this.models[i + 1].name}`);
            continue;
          }
          throw new Error('Failed to parse AI response. Please try again.');
        }

        // Map job indices to actual job data
        const matchedJobs = (parsed.matchedJobs || []).map(match => {
          const job = jobs[match.jobIndex - 1];
          if (!job) return null;
          return {
            jobId: job._id?.toString() || job.id,
            title: job.title,
            company: job.company,
            matchScore: match.matchScore,
            reason: match.reason,
          };
        }).filter(Boolean);

        // Log success with model info
        if (i > 0) {
          console.log(`[Groq] Analysis completed with fallback model: ${modelConfig.name}`);
        } else {
          console.log(`[Groq] Analysis completed with primary model: ${modelConfig.name}`);
        }

        return {
          overallScore: parsed.overallScore || 50,
          fixes: parsed.fixes || [],
          matchedJobs,
          extractedSkills: parsed.extractedSkills || [],
          summary: parsed.summary || 'Analysis complete.',
          tokensUsed,
          // Include model info for transparency
          modelUsed: modelConfig.name,
          modelTier: modelConfig.tier,
        };

      } catch (error) {
        lastError = error;
        
        // If this is not the last model and error might be model-specific, continue
        if (i < this.models.length - 1 && !error.message.includes('API key')) {
          console.warn(`[Groq] ${modelConfig.name} failed: ${error.message}, trying next model`);
          continue;
        }
        
        // Last model or critical error
        throw error;
      }
    }

    // All models failed
    console.error('[Groq] All models exhausted:', lastError);
    throw lastError || new Error('All AI models are currently unavailable. Please try again later.');
  }
}

// Singleton instance
let instance = null;

export const getGroqProvider = () => {
  if (!instance) {
    instance = new GroqProvider();
  }
  return instance;
};
