// Main exports
export { useForm } from './useForm';
export type {
  UseFormAIReturn,
  AIFormOptions
} from './useForm';

// Export AI assistant hook for advanced use cases
export { useAIAssistant } from './utils/useAIAssistant';

// Export AI Form Provider
export { AIFormProvider, useAIFormContext, useOptionalAIFormContext } from './AIFormProvider';
export type { AIFormProviderProps } from './AIFormProvider';

// Export AI types
export type {
  AIProviderType,
  AIProviderConfig,
  OpenAIConfig,
  CustomServerConfig,
  ChromeAIConfig,
  BrowserAIConfig,
  AIProvider,
  AIExecutionOrder,
  AIFormContextValue,
  AIResponse,
} from './types';

// Re-export everything from react-hook-form for convenience
export * from 'react-hook-form';

// Version info
export const version = '1.1.0';