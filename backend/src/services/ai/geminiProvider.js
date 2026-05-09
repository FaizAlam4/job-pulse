import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider } from './aiProviderInterface.js';
import { config } from '../../config/index.js';

/**
 * Google Gemini AI Provider
 * 
 * Uses Gemini 1.5 Flash for cost-effective resume analysis.
 * Free tier: 15 RPM, 1M tokens/day
 * 
 * Gemini can read PDFs natively via multimodal input.
 */
class GeminiProvider extends AIProvider {
  constructor() {
    super();
    this.client = null;
    this.model = null;
    
    if (this.isConfigured()) {
      this.client = new GoogleGenerativeAI(config.geminiApiKey);
      this.model = this.client.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.3, // Lower = more consistent output
          topP: 0.8,
          maxOutputTokens: 2048,
        },
      });
    }
  }

  get name() {
    return 'Gemini';
  }

  isConfigured() {
    return !!config.geminiApiKey;
  }

  /**
   * Build the analysis prompt
   * Optimized for minimal tokens while maintaining quality
   */
  buildPrompt(request) {
    const { targetRole, experienceLevel, locationPreference, jobs } = request;
    
    // Compact job list (only essential fields)
    const jobList = jobs.slice(0, 15).map((j, i) => 
      `${i + 1}. ${j.title} @ ${j.company} (${j.location})`
    ).join('\n');

    return `Analyze this resume for a ${targetRole} position (${experienceLevel} years exp, ${locationPreference} preference).

JOBS TO MATCH:
${jobList}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "overallScore": <0-100>,
  "fixes": [
    {"section": "<Summary|Skills|Experience|Education|Format>", "issue": "<problem>", "suggestion": "<fix>", "priority": "<high|medium|low>"}
  ],
  "matchedJobs": [
    {"jobIndex": <1-15>, "matchScore": <0-100>, "reason": "<why match>"}
  ],
  "extractedSkills": ["skill1", "skill2"],
  "summary": "<2 sentence overall assessment>"
}

Rules:
- Max 5 fixes, prioritize high-impact
- Max 5 job matches, highest scores first
- Be specific and actionable
- Focus on ATS optimization`;
  }

  /**
   * Analyze resume using Gemini's multimodal capabilities
   */
  async analyzeResume(request) {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key not configured');
    }

    const { pdfBuffer, jobs } = request;
    const prompt = this.buildPrompt(request);

    try {
      // Gemini multimodal input: PDF as inline data
      const result = await this.model.generateContent([
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: pdfBuffer.toString('base64'),
          },
        },
        { text: prompt },
      ]);

      const response = result.response;
      const text = response.text();
      
      // Extract JSON from response (handle potential markdown wrapping)
      let jsonStr = text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonStr);

      // Map job indices back to actual job data
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

      // Calculate tokens used (approximate)
      const tokensUsed = response.usageMetadata?.totalTokenCount || 
        Math.ceil((prompt.length + text.length) / 4);

      return {
        fixes: parsed.fixes || [],
        matchedJobs,
        overallScore: parsed.overallScore || 0,
        extractedSkills: parsed.extractedSkills || [],
        summary: parsed.summary || '',
        tokensUsed,
      };
    } catch (error) {
      console.error('Gemini API error:', error.message);
      
      // Handle specific Gemini errors
      if (error.message?.includes('SAFETY')) {
        throw new Error('Resume content flagged by safety filters. Please try again.');
      }
      if (error.message?.includes('RATE_LIMIT')) {
        throw new Error('AI rate limit exceeded. Please try again in a minute.');
      }
      if (error.message?.includes('quota')) {
        throw new Error('AI quota exceeded. Please try again tomorrow.');
      }
      
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }
}

// Singleton instance
let instance = null;

export const getGeminiProvider = () => {
  if (!instance) {
    instance = new GeminiProvider();
  }
  return instance;
};

export default GeminiProvider;
