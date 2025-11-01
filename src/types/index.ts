export interface FormData {
    [key: string]: any;
}

export interface AutoFillOptions {
    context?: string;
    userInput?: string;
}

export interface SummaryOptions {
    includeDetails?: boolean;
}

export interface AIFormFeatures {
    enableAutoFill: (options: AutoFillOptions) => void;
    generateFormSummary: (data: FormData, options?: SummaryOptions) => string;
}

export * from "./form";
export * from "./chrome-ai";
export * from "./ai";