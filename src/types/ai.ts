/**
 * AI Provider Types
 */

export type AIProviderType = 'chrome' | 'openai' | 'custom' | 'browser';

export interface AIProviderConfig {
  type: AIProviderType;
  enabled?: boolean;
  apiKey?: string;
  apiUrl?: string;
  model?: string;
  priority?: number;
}

export interface OpenAIConfig extends AIProviderConfig {
  type: 'openai';
  apiKey: string;
  apiUrl?: string;
  model?: string;
  organization?: string;
}

export interface CustomServerConfig extends AIProviderConfig {
  type: 'custom';
  apiUrl: string;
  headers?: Record<string, string>;
}

export interface ChromeAIConfig extends AIProviderConfig {
  type: 'chrome';
}

export interface BrowserAIConfig extends AIProviderConfig {
  type: 'browser';
  apiUrl: string;
  headers?: Record<string, string>;
}

export type AIProvider = OpenAIConfig | CustomServerConfig | ChromeAIConfig | BrowserAIConfig;

export interface AIExecutionOrder {
  providers: AIProviderType[];
  fallbackOnError?: boolean;
}

export interface AIFormContextValue {
  providers: AIProvider[];
  executionOrder: AIProviderType[];
  fallbackOnError: boolean;
  enabled: boolean;
  debounceMs: number;
  excludeFields: string[];
}

export interface AIResponse {
  suggestion: string;
  provider: AIProviderType;
  confidence?: number;
}
