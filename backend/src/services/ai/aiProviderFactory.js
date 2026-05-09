/**
 * AI Provider Factory
 * 
 * Centralizes AI provider selection. To swap providers:
 * 1. Set AI_PROVIDER env var (gemini, openai, claude, etc.)
 * 2. Ensure the provider's API key is configured
 * 
 * Currently supported:
 * - gemini (default) - Google Gemini 1.5 Flash (free tier: 15 RPM)
 * 
 * To add a new provider:
 * 1. Create provider file in /services/ai/
 * 2. Import and add to providers map below
 * 3. Add API key to config
 */

import { getGeminiProvider } from './geminiProvider.js';
import { getGroqProvider } from './groqProvider.js';
import { config } from '../../config/index.js';

// Provider registry - add new providers here
const providers = {
  gemini: getGeminiProvider,
  groq: getGroqProvider,
  // openai: () => getOpenAIProvider(),  // Future: OpenAI GPT-4
  // claude: () => getClaudeProvider(),  // Future: Anthropic Claude
  // local: () => getLocalProvider(),    // Future: Ollama/local models
};

/**
 * Get the configured AI provider
 * @returns {import('./aiProviderInterface.js').AIProvider}
 */
export const getAIProvider = () => {
  const providerName = config.aiProvider || 'gemini';
  const getProvider = providers[providerName.toLowerCase()];
  
  if (!getProvider) {
    console.warn(`Unknown AI provider: ${providerName}, falling back to Gemini`);
    return providers.gemini();
  }
  
  const provider = getProvider();
  
  if (!provider.isConfigured()) {
    throw new Error(`AI provider '${providerName}' is not configured. Please set the API key.`);
  }
  
  return provider;
};

/**
 * Check if any AI provider is available
 * @returns {boolean}
 */
export const isAIAvailable = () => {
  try {
    const provider = getAIProvider();
    return provider.isConfigured();
  } catch {
    return false;
  }
};

/**
 * List available providers
 * @returns {Array<{name: string, configured: boolean}>}
 */
export const listProviders = () => {
  return Object.entries(providers).map(([name, getProvider]) => {
    try {
      const provider = getProvider();
      return { name, configured: provider.isConfigured() };
    } catch {
      return { name, configured: false };
    }
  });
};

export default { getAIProvider, isAIAvailable, listProviders };
