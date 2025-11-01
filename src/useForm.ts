import {
  useForm as useReactHookForm,
  UseFormProps,
  FieldValues,
  Path,
  UseFormReturn,
  UseFormRegisterReturn,
} from "react-hook-form";
import { useAIAssistant } from "./utils/useAIAssistant";
import { useCallback, useRef, useState, useEffect } from "react";

/**
 * AI configuration options for the form
 */
export interface AIFormOptions {
  /** Enable AI features (default: true) */
  enabled?: boolean;
  /** API endpoint for AI fallback */
  apiUrl?: string;
  /** Debounce time in ms for AI suggestions (default: 800) */
  debounceMs?: number;
  /** Fields to exclude from AI processing */
  excludeFields?: string[];
  /** Auto-check availability on mount */
  autoCheckAvailability?: boolean;
}

/**
 * Extended return type with AI capabilities
 */
export interface UseFormAIReturn<T extends FieldValues> extends UseFormReturn<T> {
  /** AI feature enabled state */
  aiEnabled: boolean;
  /** Trigger AI autofill for all or specific fields */
  aiAutofill: (fields?: Path<T>[]) => Promise<void>;
  /** Get AI suggestion for a specific field */
  aiSuggest: (fieldName: Path<T>) => Promise<string | null>;
  /** Check if AI is currently processing */
  aiLoading: boolean;
  /** AI availability status */
  aiAvailability: {
    available: boolean;
    status: string;
    needsDownload: boolean;
  } | null;
  /** Refresh AI availability check */
  refreshAvailability: () => Promise<void>;
  /** Download progress (0-100) when model is downloading */
  aiDownloadProgress: number | null;
}

/**
 * Enhanced useForm — wraps react-hook-form with AI autofill + suggestions.
 * Supports Chrome Built-in AI and server API fallback.
 * 
 * @example
 * ```tsx
 * const form = useForm<FormData>({
 *   ai: {
 *     enabled: true,
 *     apiUrl: 'http://localhost:3001',
 *     excludeFields: ['password'],
 *     debounceMs: 800
 *   }
 * });
 * 
 * // Check availability
 * useEffect(() => {
 *   if (form.aiAvailability?.needsDownload) {
 *     console.log('AI model needs download - user interaction required');
 *   }
 * }, [form.aiAvailability]);
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
    debounceMs = 800,
    excludeFields = [],
    autoCheckAvailability = true,
  } = aiOptions || {};

  const form = useReactHookForm<T>(rhfOptions);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDownloadProgress, setAiDownloadProgress] = useState<number | null>(null);
  const [aiAvailability, setAiAvailability] = useState<{
    available: boolean;
    status: string;
    needsDownload: boolean;
  } | null>(null);
  
  // Track debounce timers
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Get current form values for context
  const formValues = form.watch();

  // Initialize AI assistant with form context
  const ai = useAIAssistant({
    enabled: aiEnabled,
    formContext: formValues,
    apiUrl,
  });

  // Check availability on mount
  useEffect(() => {
    if (autoCheckAvailability && aiEnabled) {
      void refreshAvailability();
    }
    
    // Cleanup debounce timers on unmount
    return () => {
      debounceTimers.current.forEach(timer => clearTimeout(timer));
      debounceTimers.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiEnabled, autoCheckAvailability]);

  /**
   * Refresh AI availability status
   */
  const refreshAvailability = useCallback(async () => {
    try {
      const status = await ai.checkAvailability();
      setAiAvailability(status);
      
      if (status.needsDownload) {
        console.log('Chrome AI model requires download. User interaction needed to start download.');
      } else if (status.status === 'downloading') {
        console.log('Chrome AI model is currently downloading...');
      } else if (status.available) {
        console.log('Chrome AI is ready to use!');
      }
    } catch (err) {
      console.error('Failed to check AI availability:', err);
      setAiAvailability({
        available: false,
        status: 'error',
        needsDownload: false
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Enhanced register that integrates AI suggestions on blur
   */
  const registerWithAI = useCallback(
    <TFieldName extends Path<T>>(
      name: TFieldName,
      rules?: Parameters<UseFormReturn<T>["register"]>[1]
    ): UseFormRegisterReturn<TFieldName> => {
      const baseRegister = form.register<TFieldName>(name, rules as Parameters<typeof form.register<TFieldName>>[1]);

      if (!aiEnabled || excludeFields.includes(String(name))) {
        return baseRegister;
      }

      const enhancedRegister: UseFormRegisterReturn<TFieldName> = {
        ...baseRegister,
        onBlur: async (e: any) => {
          // Call original onBlur first
          await baseRegister.onBlur?.(e);

          // Clear existing timer for this field
          const timerId = debounceTimers.current.get(String(name));
          if (timerId) clearTimeout(timerId);

          // Set new debounced timer
          const newTimer = setTimeout(async () => {
            const value = e?.target?.value;
            
            // Only suggest if there's a value
            if (value && value.trim().length > 0) {
              try {
                const suggestion = await ai.suggestValue(String(name), value);
                
                // Optionally auto-apply suggestion or show it to user
                if (suggestion && suggestion !== value) {
                  console.log(`💡 Suggestion for "${String(name)}": ${suggestion}`);
                  // You could add logic here to show the suggestion to the user
                  // and let them accept/reject it
                }
              } catch (err) {
                console.error(`Error getting suggestion for ${String(name)}:`, err);
              }
            }
          }, debounceMs);

          debounceTimers.current.set(String(name), newTimer);
        },
      };

      return enhancedRegister;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, aiEnabled, excludeFields, debounceMs]
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

      // Check if AI is available
      if (aiAvailability && !aiAvailability.available) {
        console.warn(`AI is not available. Status: ${aiAvailability.status}`);
        if (aiAvailability.needsDownload) {
          console.log('Attempting to trigger model download...');
        }
        // Continue anyway to attempt download or use fallback
      }

      setAiLoading(true);
      setAiDownloadProgress(null);

      try {
        // Get all registered field names
        const currentValues = form.getValues();
        const targetFields = fields || (Object.keys(currentValues) as Path<T>[]);
        
        // Filter out excluded fields
        const fieldsToFill = targetFields.filter(
          field => !excludeFields.includes(String(field))
        );

        if (fieldsToFill.length === 0) {
          console.warn('No fields to autofill');
          return;
        }

        const autofillData = await ai.autofill(fieldsToFill.map(String), {
          onDownloadProgress: (progress) => {
            setAiDownloadProgress(progress);
          },
        });
        
        // Apply autofilled values
        for (const [name, value] of Object.entries(autofillData)) {
          if (fieldsToFill.some(f => String(f) === name)) {
            form.setValue(name as Path<T>, value as any, {
              shouldDirty: true,
              shouldValidate: true,
              shouldTouch: true,
            });
          }
        }
        
        console.log('✅ Autofill completed successfully');
      } catch (error) {
        console.error('AI autofill failed:', error);
        throw error;
      } finally {
        setAiLoading(false);
        setAiDownloadProgress(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, aiEnabled, excludeFields, aiAvailability]
  );

  /**
   * Get AI suggestion for a specific field
   */
  const aiSuggest = useCallback(
    async (fieldName: Path<T>): Promise<string | null> => {
      if (!aiEnabled) {
        console.warn('AI is disabled');
        return null;
      }

      setAiLoading(true);

      try {
        const currentValue = form.getValues(fieldName);
        const suggestion = await ai.suggestValue(
          String(fieldName), 
          String(currentValue || '')
        );
        
        return suggestion;
      } catch (error) {
        console.error('AI suggest failed:', error);
        return null;
      } finally {
        setAiLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, aiEnabled]
  );

  return {
    ...form,
    register: registerWithAI as UseFormReturn<T>["register"],
    aiEnabled,
    aiAutofill,
    aiSuggest,
    aiLoading,
    aiAvailability,
    refreshAvailability,
    aiDownloadProgress,
  };
}