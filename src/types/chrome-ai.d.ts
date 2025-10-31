export {};

declare global {
  interface LanguageModelConstructor {
    availability(): Promise<'readily' | 'downloadable' | 'downloading' | 'unavailable'>;
    params(): Promise<{
      defaultTopK: number;
      maxTopK: number;
      defaultTemperature: number;
      maxTemperature: number;
    }>;
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
    promptStreaming(input: string, options?: { signal?: AbortSignal }): ReadableStream;
    destroy(): void;
    clone(options?: { signal?: AbortSignal }): Promise<LanguageModelSession>;
    inputUsage: number;
    inputQuota: number;
  }

  const LanguageModel: LanguageModelConstructor;
}
