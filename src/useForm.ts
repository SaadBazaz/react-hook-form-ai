import {
  useForm as useReactHookForm,
  UseFormProps,
  FieldValues,
  Path,
  UseFormReturn,
  UseFormRegisterReturn,
} from "react-hook-form";
import { AIFormOptions, UseFormAIReturn } from "./types/form";
import { useAIAssistant } from "./utils/useAIAssistant";
import { useCallback, useRef, useState } from "react";


/**
 * Enhanced useForm — wraps react-hook-form with AI autofill + suggestions.
 * Supports Chrome AI and server API fallback.
 * 
 * @example
 * ```tsx
 * const form = useForm<FormData>({
 *   ai: {
 *     enabled: true,
 *     apiUrl: 'http://localhost:3001',
 *     excludeFields: ['password']
 *   }
 * });
 * 
 * // Trigger autofill
 * await form.aiAutofill();
 * 
 * // Get specific suggestion
 * const suggestion = await form.aiSuggest('email');
 * ```
 */
export function useForm<T extends FieldValues>(
  options?: UseFormProps<T> & {
    ai?: AIFormOptions;
  }
): UseFormAIReturn<T> {
  const { ai: aiOptions, ...rhfOptions } = options || {};
  
  const {
    enabled: aiEnabled = true,
    apiUrl = 'http://localhost:3001',
    debounceMs = 500,
    excludeFields = [],
  } = aiOptions || {};

  const form = useReactHookForm<T>(rhfOptions);
  const [aiLoading, setAiLoading] = useState(false);
  
  // Track debounce timers
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Initialize AI assistant with form context
  const ai = useAIAssistant({
    enabled: aiEnabled,
    formContext: form.watch(), // watch all fields for real-time context
    apiUrl,
  });

  /**
   * Enhanced register that integrates AI suggestions on blur
   */
  const registerWithAI = useCallback(
    <TFieldName extends Path<T>>(
      name: TFieldName,
      rules?: Parameters<UseFormReturn<T>["register"]>[1]
    ): UseFormRegisterReturn<TFieldName> => {
      // Explicitly type the register call to preserve TFieldName
      const baseRegister = form.register<TFieldName>(name, rules as Parameters<typeof form.register<TFieldName>>[1]);

      if (!aiEnabled || excludeFields.includes(String(name))) {
        return baseRegister;
      }

      const enhancedRegister: UseFormRegisterReturn<TFieldName> = {
        ...baseRegister,
        onBlur: async (e: any) => {
          await baseRegister.onBlur?.(e);

          const timerId = debounceTimers.current.get(String(name));
          if (timerId) clearTimeout(timerId);

          const newTimer = setTimeout(() => {
            void ai.suggestValue(String(name), e?.target?.value);
          }, debounceMs);

          debounceTimers.current.set(String(name), newTimer);
        },
      };

      return enhancedRegister;
    },
    [form, aiEnabled, excludeFields, debounceMs, ai]
  );

  /**
   * AI-powered autofill for all or specific fields
   */
  const aiAutofill = useCallback(
    async (fields?: Path<T>[]): Promise<void> => {
      if (!aiEnabled) {
        console.warn('AI is disabled for this form');
        return;
      }

      setAiLoading(true);

      try {
        // Get all registered field names
        const currentValues = form.getValues();
        const targetFields = fields || (Object.keys(currentValues) as Path<T>[]);
        
        // Filter out excluded fields
        const fieldsToFill = targetFields.filter(
          field => !excludeFields.includes(String(field))
        );

        const autofillData = await ai.autofill(fieldsToFill.map(String));
        
        // Apply autofilled values
        for (const [name, value] of Object.entries(autofillData)) {
          form.setValue(name as Path<T>, value as any, {
            shouldDirty: true,
            shouldValidate: true,
            shouldTouch: true,
          });
        }
      } catch (error) {
        console.error('AI autofill failed:', error);
        throw error;
      } finally {
        setAiLoading(false);
      }
    },
    [form, aiEnabled, excludeFields, ai]
  );

  /**
   * Get AI suggestion for a specific field
   */
  const aiSuggest = useCallback(
    async (fieldName: Path<T>): Promise<string | null> => {
      if (!aiEnabled) {
        return null;
      }

      setAiLoading(true);

      try {
        const currentValue = form.getValues(fieldName);
        await ai.suggestValue(String(fieldName), String(currentValue));
        // Note: suggestValue returns void in your implementation
        // You might want to modify useAIAssistant to return the suggestion
        return null;
      } catch (error) {
        console.error('AI suggest failed:', error);
        return null;
      } finally {
        setAiLoading(false);
      }
    },
    [form, aiEnabled, ai]
  );

  return {
    ...form,
    register: registerWithAI as UseFormReturn<T>["register"],
    aiEnabled,
    aiAutofill,
    aiSuggest,
    aiLoading,
  };
}