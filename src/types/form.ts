import {
  FieldValues,
  Path,
  UseFormReturn,
} from "react-hook-form";

/**
 * AI configuration options for the form
 */
export interface AIFormOptions {
  /** Enable AI features (default: true) */
  enabled?: boolean;
  /** API endpoint for AI fallback */
  apiUrl?: string;
  /** Debounce time in ms for AI suggestions (default: 500) */
  debounceMs?: number;
  /** Fields to exclude from AI processing */
  excludeFields?: string[];
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
}

export interface AIAssistantOptions {
  enabled?: boolean;
  formContext?: Record<string, any>;
  apiUrl?: string;
}

export type AutofillData = Record<string, string>;