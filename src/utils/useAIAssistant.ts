type AutofillData = Record<string, string>;

interface AIAssistantOptions {
  enabled?: boolean;
  formContext?: Record<string, any>;
  apiUrl?: string; // Your server URL
}

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
  async function useChromeAI(prompt: string): Promise<string | null> {
    if (typeof window === "undefined" || !("ai" in window)) return null;
    const ai = (window as any).ai;

    if (!ai?.languageModel?.create) return null;

    try {
      const session = await ai.languageModel.create();
      const result = await session.prompt(prompt);
      return result;
    } catch (err) {
      console.error("Chrome AI error:", err);
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
    } catch (err) {
      console.error("Server AI error:", err);
      return null;
    }
  }

  // ------------------------------------------
  // Suggest Value (Field-specific)
  // ------------------------------------------
  async function suggestValue(name: string, value: string): Promise<void> {
    if (!enabled) return;

    const prompt = `
You are assisting with a form. The field name is "${name}".
Current value: "${value}".
Form context: ${JSON.stringify(formContext, null, 2)}.
Please suggest an improved, corrected, or realistic completion for this field.
Respond with ONLY the suggested value.
    `;

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
      console.log(`✨ AI suggestion for "${name}":`, result);
    } else {
      console.warn("No AI suggestion available.");
    }
  }

  // ------------------------------------------
  // Auto-fill (Form-wide)
  // ------------------------------------------
  async function autofill(fields: string[]): Promise<AutofillData> {
    if (!enabled) {
      return Object.fromEntries(fields.map((f) => [f, "AI disabled"])) as AutofillData;
    }

    const prompt = `
You are an intelligent form assistant.
Given a form with the following fields: ${fields.join(", ")},
and this context: ${JSON.stringify(formContext, null, 2)},
generate a realistic JSON object containing example values for each field.
Output only valid JSON. Example:
{"name": "Alice", "email": "alice@example.com", "age": "29"}.
    `;

    let result = await useChromeAI(prompt);
    
    if (result) {
      try {
        const parsed = JSON.parse(result);
        if (typeof parsed === "object" && parsed !== null) {
          return parsed;
        }
      } catch {
        console.warn("Chrome AI returned invalid JSON, trying server...");
      }
    }

    // Fallback to server
    const serverResult = await useServerAI('/api/autofill', {
      fields,
      formContext,
    });

    if (serverResult && typeof serverResult === 'object') {
      return serverResult as AutofillData;
    }

    console.warn("AI unavailable — using fallback mock values.");
    return Object.fromEntries(fields.map((f) => [f, `AI_${f}`])) as AutofillData;
  }

  return { suggestValue, autofill };
}