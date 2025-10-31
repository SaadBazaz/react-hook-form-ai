export {};

declare global {
  interface Window {
    ai?: {
      languageModel?: {
        create: () => Promise<{
          prompt: (text: string) => Promise<string>;
        }>;
      };
      translation?: any;
      summarization?: any;
    };
  }
}
