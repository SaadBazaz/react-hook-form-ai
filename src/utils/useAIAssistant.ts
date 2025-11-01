import { useOptionalAIFormContext } from '../AIFormProvider';
import { executeAIProviders } from '../aiProviders';
import type { AIProvider, AIProviderType } from '../types';
import { useMemo } from 'react';

type AutofillData = Record<string, string>;

interface AIAssistantOptions {
  enabled?: boolean;
  formContext?: Record<string, any>;
  apiUrl?: string;
  providers?: AIProvider[];
  executionOrder?: AIProviderType[];
  fallbackOnError?: boolean;
}

/**
 * AI Assistant Hook — uses configured providers from AIFormProvider
 * or falls back to legacy Chrome AI + server setup.
 * Local options override provider context.
 */
export function useAIAssistant({
  enabled = true,
  formContext = {},
  apiUrl = 'http://localhost:3001',
  providers: localProviders,
  executionOrder: localOrder,
  fallbackOnError: localFallback,
}: AIAssistantOptions = {}) {
  const providerContext = useOptionalAIFormContext();

  // Merge context with local overrides (local takes precedence)
  const effectiveConfig = useMemo(() => {
    return {
      providers: localProviders ?? providerContext?.providers,
      executionOrder: localOrder ?? providerContext?.executionOrder,
      fallbackOnError: localFallback ?? providerContext?.fallbackOnError ?? true,
    };
  }, [localProviders, localOrder, localFallback, providerContext]);

  // ------------------------------------------
  // Suggest Value (Field-specific)
  // ------------------------------------------
  async function suggestValue(name: string, value: string): Promise<string | null> {
    if (!enabled) return null;

    if (effectiveConfig.providers && effectiveConfig.executionOrder) {
      const { result } = await executeAIProviders(
        effectiveConfig.providers,
        effectiveConfig.executionOrder,
        effectiveConfig.fallbackOnError,
        async (provider) => {
          const response = await provider.suggestValue(name, value, formContext);
          return response;
        }
      );

      if (result) {
        console.log(`AI suggestion for "${name}" from ${result.provider}:`, result.suggestion);
        return result.suggestion;
      }
    } else {
      // Legacy fallback: Chrome AI -> Server
      const legacyResult = await legacySuggestValue(name, value, formContext, apiUrl);
      return legacyResult;
    }

    console.warn('No AI suggestion available.');
    return null;
  }

  // ------------------------------------------
  // Auto-fill (Form-wide)
  // ------------------------------------------
  async function autofill(
    fields: string[],
    options?: { onDownloadProgress?: (progress: number) => void }
  ): Promise<AutofillData> {
    if (!enabled) {
      return Object.fromEntries(fields.map((f) => [f, 'AI disabled'])) as AutofillData;
    }

    if (effectiveConfig.providers && effectiveConfig.executionOrder) {
      const { result } = await executeAIProviders(
        effectiveConfig.providers,
        effectiveConfig.executionOrder,
        effectiveConfig.fallbackOnError,
        async (provider) => {
          const data = await provider.autofill(fields, formContext, options?.onDownloadProgress);
          return data;
        }
      );

      if (result) {
        return result;
      }
    } else {
      // Legacy fallback
      const legacyResult = await legacyAutofill(fields, formContext, apiUrl, options);
      return legacyResult;
    }

    console.warn('AI unavailable — using fallback mock values.');
    return Object.fromEntries(fields.map((f) => [f, `Example_${f}`])) as AutofillData;
  }

  // ------------------------------------------
  // Check Availability
  // ------------------------------------------
  async function checkAvailability(): Promise<{
    available: boolean;
    status: string;
    needsDownload: boolean;
  }> {
    if (effectiveConfig.providers && effectiveConfig.executionOrder && effectiveConfig.executionOrder.length > 0) {
      // Check first provider in execution order
      const firstProviderType = effectiveConfig.executionOrder[0];
      const firstProvider = effectiveConfig.providers.find(p => p.type === firstProviderType);
      
      if (firstProvider) {
        const { createAIProvider } = await import('../aiProviders');
        const provider = createAIProvider(firstProvider);
        return provider.checkAvailability();
      }
    }

    // Legacy Chrome AI check
    return legacyCheckAvailability();
  }

  return {
    suggestValue,
    autofill,
    checkAvailability,
  };
}

// ------------------------------------------
// Legacy Functions (for backward compatibility)
// ------------------------------------------

async function legacyCheckAvailability() {
  if (typeof window === 'undefined' || typeof (window as any).ai?.languageModel === 'undefined') {
    return {
      available: false,
      status: 'unavailable',
      needsDownload: false,
    };
  }

  try {
    const availability = await (window as any).ai.languageModel.availability();
    return {
      available: availability !== 'unavailable',
      status: availability,
      needsDownload: availability === 'downloadable',
    };
  } catch (err) {
    console.error('Error checking availability:', err);
    return {
      available: false,
      status: 'error',
      needsDownload: false,
    };
  }
}

async function legacySuggestValue(
  name: string,
  value: string,
  formContext: Record<string, any>,
  apiUrl: string
): Promise<string | null> {
  // Try Chrome AI first
  const chromeResult = await legacyUseChromeAI(
    `You are assisting with form completion. The user is filling out a field named "${name}".

Current value: "${value}"
Form context: ${JSON.stringify(formContext, null, 2)}

Based on the field name, current value, and form context, suggest an improved, corrected, or realistic completion for this field.

Rules:
- Respond with ONLY the suggested value
- No explanations or additional text
- If the current value is already good, return it as-is
- Make sure the suggestion is appropriate for the field name

Suggested value:`
  );

  if (chromeResult) {
    const cleaned = chromeResult.trim().replace(/^["']|["']$/g, '');
    console.log(`AI suggestion for "${name}":`, cleaned);
    return cleaned;
  }

  // Fallback to server
  try {
    const response = await fetch(`${apiUrl}/api/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fieldName: name, currentValue: value, formContext }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.suggestion || null;
    }
  } catch (err) {
    console.error('Server AI error:', err);
  }

  return null;
}

async function legacyAutofill(
  fields: string[],
  formContext: Record<string, any>,
  apiUrl: string,
  options?: { onDownloadProgress?: (progress: number) => void }
): Promise<AutofillData> {
  const prompt = `You are an intelligent form assistant. Generate realistic example values for a form.

Form fields: ${fields.join(', ')}
Context: ${JSON.stringify(formContext, null, 2)}

Generate realistic, appropriate values for each field based on the field names and context.
Output ONLY a valid JSON object with these exact field names as keys.

Example format:
{"name": "Alice Johnson", "email": "alice@example.com", "age": "29"}

JSON object:`;

  const result = await legacyUseChromeAI(prompt, options);

  if (result) {
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Chrome AI returned invalid JSON, trying server...', err);
    }
  }

  // Fallback to server
  try {
    const response = await fetch(`${apiUrl}/api/autofill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields, formContext }),
    });

    if (response.ok) {
      const data = await response.json();
      const parsed = typeof data.autofillData === 'string' 
        ? JSON.parse(data.autofillData) 
        : data.autofillData;
      
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed as AutofillData;
      }
    }
  } catch (err) {
    console.error('Server autofill error:', err);
  }

  return Object.fromEntries(fields.map((f) => [f, `Example_${f}`])) as AutofillData;
}

async function legacyUseChromeAI(
  prompt: string,
  options?: { onDownloadProgress?: (progress: number) => void }
): Promise<string | null> {
  if (typeof window === 'undefined' || typeof (window as any).ai?.languageModel === 'undefined') {
    return null;
  }

  try {
    const session = await (window as any).ai.languageModel.create({
      monitor(m: any) {
        m.addEventListener('downloadprogress', (e: any) => {
          options?.onDownloadProgress?.(e.loaded * 100);
        });
      },
    });

    const result = await session.prompt(prompt);
    session.destroy();

    return result;
  } catch (err) {
    console.error('Chrome AI error:', err);
    return null;
  }
}