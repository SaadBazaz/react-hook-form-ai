import { AIAssistantOptions, AutofillData } from "../types";

/**
 * AI Assistant Hook — uses Chrome Built-in AI when available,
 * falls back to your Express server otherwise.
 */
export function useAIAssistant({
  enabled = true,
  formContext = {},
  apiUrl = 'http://localhost:3001',
}: AIAssistantOptions = {}) {
  // ------------------------------------------
  // Chrome Built-in AI (Primary)
  // ------------------------------------------
  async function useChromeAI(
    prompt: string,
    options?: { 
      onDownloadProgress?: (progress: number) => void;
      signal?: AbortSignal;
    }
  ): Promise<string | null> {
    if (typeof window === "undefined" || typeof LanguageModel === "undefined") {
      return null;
    }

    try {
      // Check availability first
      const availability = await LanguageModel.availability();
      
      if (availability === 'unavailable') {
        console.log('Chrome AI is unavailable on this device');
        return null;
      }

      if (availability === 'downloadable') {
        console.log('Chrome AI model needs to be downloaded. User interaction required.');
        // Continue to trigger download
      }

      if (availability === 'downloading') {
        console.log('Chrome AI model is currently downloading...');
      }

      // Create session with download monitoring
      const session = await LanguageModel.create({
        monitor(m) {
          m.addEventListener('downloadprogress', (e) => {
            const progress = e.loaded * 100;
            console.log(`Downloaded ${progress.toFixed(2)}%`);
            options?.onDownloadProgress?.(progress);
          });
        },
        signal: options?.signal,
      });
      
      // Use prompt method
      const result = await session.prompt(prompt, { signal: options?.signal });
      
      // Clean up session when done
      session.destroy();
      
      return result;
    } catch (err: any) {
      console.error("Chrome AI error:", err.message || err);
      return null;
    }
  }

  // ------------------------------------------
  // Server API Fallback
  // ------------------------------------------
  async function useServerAI(
    endpoint: string,
    body: Record<string, any>
  ): Promise<string | null> {
    try {
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      return data.suggestion || data.autofillData || null;
    } catch (err: any) {
      console.error("Server AI error:", err.message || err);
      return null;
    }
  }

  // ------------------------------------------
  // Suggest Value (Field-specific)
  // ------------------------------------------
  async function suggestValue(name: string, value: string): Promise<string | null> {
    if (!enabled) return null;

    // Improved prompt with clearer instructions
    const prompt = `You are assisting with form completion. The user is filling out a field named "${name}".

Current value: "${value}"
Form context: ${JSON.stringify(formContext, null, 2)}

Based on the field name, current value, and form context, suggest an improved, corrected, or realistic completion for this field.

Rules:
- Respond with ONLY the suggested value
- No explanations or additional text
- If the current value is already good, return it as-is
- Make sure the suggestion is appropriate for the field name

Suggested value:`;

    let result = await useChromeAI(prompt);
    
    if (!result) {
      // Fallback to server
      result = await useServerAI('/api/suggest', {
        fieldName: name,
        currentValue: value,
        formContext,
      });
    }

    if (result) {
      // Clean up the result (remove quotes, trim whitespace)
      const cleaned = result.trim().replace(/^["']|["']$/g, '');
      console.log(`✨ AI suggestion for "${name}":`, cleaned);
      return cleaned;
    }
    
    console.warn("No AI suggestion available.");
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
      return Object.fromEntries(fields.map((f) => [f, "AI disabled"])) as AutofillData;
    }

    const prompt = `You are an intelligent form assistant. Generate realistic example values for a form.

Form fields: ${fields.join(", ")}
Context: ${JSON.stringify(formContext, null, 2)}

Generate realistic, appropriate values for each field based on the field names and context.
Output ONLY a valid JSON object with these exact field names as keys.

Example format:
{"name": "Alice Johnson", "email": "alice@example.com", "age": "29"}

JSON object:`;

    let result = await useChromeAI(prompt, {
      onDownloadProgress: options?.onDownloadProgress,
    });
    
    if (result) {
      try {
        // Try to extract JSON from the response
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (typeof parsed === "object" && parsed !== null) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn("Chrome AI returned invalid JSON, trying server...", err);
      }
    }

    // Fallback to server
    const serverResult = await useServerAI('/api/autofill', {
      fields,
      formContext,
    });

    if (serverResult) {
      try {
        const parsed = typeof serverResult === 'string' 
          ? JSON.parse(serverResult) 
          : serverResult;
        
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed as AutofillData;
        }
      } catch (err) {
        console.error("Failed to parse server response:", err);
      }
    }

    console.warn("AI unavailable — using fallback mock values.");
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
    if (typeof window === "undefined" || typeof LanguageModel === "undefined") {
      return {
        available: false,
        status: 'unavailable',
        needsDownload: false
      };
    }

    try {
      const availability = await LanguageModel.availability();
      
      return {
        available: availability !== 'unavailable',
        status: availability,
        needsDownload: availability === 'downloadable'
      };
    } catch (err) {
      console.error("Error checking availability:", err);
      return {
        available: false,
        status: 'error',
        needsDownload: false
      };
    }
  }

  return { 
    suggestValue, 
    autofill,
    checkAvailability 
  };
}