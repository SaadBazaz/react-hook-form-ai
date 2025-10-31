import type { AIProvider, AIResponse, AIProviderType } from './types';

type AutofillData = Record<string, string>;

// Chrome Built-in AI types
declare global {
  interface LanguageModelConstructor {
    availability(): Promise<'readily' | 'downloadable' | 'downloading' | 'unavailable'>;
    create(options?: {
      temperature?: number;
      topK?: number;
      signal?: AbortSignal;
      monitor?: (monitor: DownloadMonitor) => void;
      initialPrompts?: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
      }>;
    }): Promise<LanguageModelSession>;
  }

  interface DownloadMonitor {
    addEventListener(
      type: 'downloadprogress',
      listener: (event: { loaded: number }) => void
    ): void;
  }

  interface LanguageModelSession {
    prompt(input: string, options?: { signal?: AbortSignal }): Promise<string>;
    destroy(): void;
  }
}

interface AIProviderExecutor {
  suggestValue(
    fieldName: string,
    currentValue: string,
    formContext: Record<string, any>
  ): Promise<AIResponse | null>;
  
  autofill(
    fields: string[],
    formContext: Record<string, any>,
    onProgress?: (progress: number) => void
  ): Promise<AutofillData | null>;
  
  checkAvailability(): Promise<{
    available: boolean;
    status: string;
    needsDownload: boolean;
  }>;
}

/**
 * Chrome Built-in AI Provider
 */
class ChromeAIProvider implements AIProviderExecutor {
  async checkAvailability() {
    if (typeof window === 'undefined' || typeof LanguageModel === 'undefined') {
      return { available: false, status: 'unavailable', needsDownload: false };
    }

    try {
      const availability = await LanguageModel.availability();
      return {
        available: availability !== 'unavailable',
        status: availability,
        needsDownload: availability === 'downloadable',
      };
    } catch {
      return { available: false, status: 'error', needsDownload: false };
    }
  }

  async suggestValue(
    fieldName: string,
    currentValue: string,
    formContext: Record<string, any>
  ): Promise<AIResponse | null> {
    try {
      const prompt = `You are assisting with form completion. The user is filling out a field named "${fieldName}".

Current value: "${currentValue}"
Form context: ${JSON.stringify(formContext, null, 2)}

Based on the field name, current value, and form context, suggest an improved, corrected, or realistic completion for this field.

Rules:
- Respond with ONLY the suggested value
- No explanations or additional text
- If the current value is already good, return it as-is
- Make sure the suggestion is appropriate for the field name

Suggested value:`;

      const session = await LanguageModel.create();
      const result = await session.prompt(prompt);
      session.destroy();

      const cleaned = result.trim().replace(/^["']|["']$/g, '');
      return { suggestion: cleaned, provider: 'chrome' };
    } catch (err) {
      console.error('Chrome AI error:', err);
      return null;
    }
  }

  async autofill(
    fields: string[],
    formContext: Record<string, any>,
    onProgress?: (progress: number) => void
  ): Promise<AutofillData | null> {
    try {
      const prompt = `You are an intelligent form assistant. Generate realistic example values for a form.

Form fields: ${fields.join(', ')}
Context: ${JSON.stringify(formContext, null, 2)}

Generate realistic, appropriate values for each field based on the field names and context.
Output ONLY a valid JSON object with these exact field names as keys.

Example format:
{"name": "Alice Johnson", "email": "alice@example.com", "age": "29"}

JSON object:`;

      const session = await LanguageModel.create({
        monitor(m) {
          m.addEventListener('downloadprogress', (e) => {
            onProgress?.(e.loaded * 100);
          });
        },
      });

      const result = await session.prompt(prompt);
      session.destroy();

      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    } catch (err) {
      console.error('Chrome AI autofill error:', err);
      return null;
    }
  }
}

/**
 * OpenAI Provider
 */
class OpenAIProvider implements AIProviderExecutor {
  constructor(private config: Extract<AIProvider, { type: 'openai' }>) {}

  async checkAvailability() {
    return {
      available: !!this.config.apiKey,
      status: this.config.apiKey ? 'ready' : 'missing-api-key',
      needsDownload: false,
    };
  }

  async suggestValue(
    fieldName: string,
    currentValue: string,
    formContext: Record<string, any>
  ): Promise<AIResponse | null> {
    try {
      const apiUrl = this.config.apiUrl || 'https://api.openai.com/v1/chat/completions';
      const model = this.config.model || 'gpt-3.5-turbo';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          ...(this.config.organization && { 'OpenAI-Organization': this.config.organization }),
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a form completion assistant. Provide only the suggested value, no explanations.',
            },
            {
              role: 'user',
              content: `Field: ${fieldName}\nCurrent value: ${currentValue}\nContext: ${JSON.stringify(formContext)}\n\nSuggest an improved value:`,
            },
          ],
          temperature: 0.7,
          max_tokens: 100,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const suggestion = data.choices?.[0]?.message?.content?.trim();

      return suggestion ? { suggestion, provider: 'openai' } : null;
    } catch (err) {
      console.error('OpenAI error:', err);
      return null;
    }
  }

  async autofill(
    fields: string[],
    formContext: Record<string, any>
  ): Promise<AutofillData | null> {
    try {
      const apiUrl = this.config.apiUrl || 'https://api.openai.com/v1/chat/completions';
      const model = this.config.model || 'gpt-3.5-turbo';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          ...(this.config.organization && { 'OpenAI-Organization': this.config.organization }),
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a form autofill assistant. Return only valid JSON with field values.',
            },
            {
              role: 'user',
              content: `Generate realistic values for these form fields: ${fields.join(', ')}\nContext: ${JSON.stringify(formContext)}\n\nReturn JSON only:`,
            },
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      
      if (content) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
      return null;
    } catch (err) {
      console.error('OpenAI autofill error:', err);
      return null;
    }
  }
}

/**
 * Custom Server Provider
 */
class CustomServerProvider implements AIProviderExecutor {
  constructor(private config: Extract<AIProvider, { type: 'custom' | 'browser' }>) {}

  async checkAvailability() {
    try {
      const response = await fetch(`${this.config.apiUrl}/health`, {
        method: 'GET',
        headers: this.config.headers,
      });
      return {
        available: response.ok,
        status: response.ok ? 'ready' : 'unavailable',
        needsDownload: false,
      };
    } catch {
      return { available: false, status: 'unavailable', needsDownload: false };
    }
  }

  async suggestValue(
    fieldName: string,
    currentValue: string,
    formContext: Record<string, any>
  ): Promise<AIResponse | null> {
    try {
      const response = await fetch(`${this.config.apiUrl}/api/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
        },
        body: JSON.stringify({ fieldName, currentValue, formContext }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      return data.suggestion ? { suggestion: data.suggestion, provider: 'custom' } : null;
    } catch (err) {
      console.error('Custom server error:', err);
      return null;
    }
  }

  async autofill(
    fields: string[],
    formContext: Record<string, any>
  ): Promise<AutofillData | null> {
    try {
      const response = await fetch(`${this.config.apiUrl}/api/autofill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
        },
        body: JSON.stringify({ fields, formContext }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      return data.autofillData || null;
    } catch (err) {
      console.error('Custom server autofill error:', err);
      return null;
    }
  }
}

/**
 * Provider Factory
 */
export function createAIProvider(config: AIProvider): AIProviderExecutor {
  switch (config.type) {
    case 'chrome':
      return new ChromeAIProvider();
    case 'openai':
      return new OpenAIProvider(config);
    case 'custom':
    case 'browser':
      return new CustomServerProvider(config);
    default:
      throw new Error(`Unknown provider type: ${(config as any).type}`);
  }
}

/**
 * Execute AI providers in order with fallback
 */
export async function executeAIProviders<T>(
  providers: AIProvider[],
  executionOrder: AIProviderType[],
  fallbackOnError: boolean,
  executor: (provider: AIProviderExecutor) => Promise<T | null>
): Promise<{ result: T | null; provider: AIProviderType | null }> {
  for (const providerType of executionOrder) {
    const config = providers.find(p => p.type === providerType && p.enabled !== false);
    if (!config) continue;

    try {
      const provider = createAIProvider(config);
      const result = await executor(provider);
      
      if (result !== null) {
        return { result, provider: providerType };
      }
      
      if (!fallbackOnError) {
        return { result: null, provider: null };
      }
    } catch (err) {
      console.error(`Provider ${providerType} failed:`, err);
      if (!fallbackOnError) {
        return { result: null, provider: null };
      }
    }
  }

  return { result: null, provider: null };
}
