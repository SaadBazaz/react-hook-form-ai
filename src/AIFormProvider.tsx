import React, { createContext, useContext, ReactNode } from 'react';
import type { AIProvider, AIFormContextValue, AIProviderType } from './types';

const AIFormContext = createContext<AIFormContextValue | null>(null);

export interface AIFormProviderProps {
  children: ReactNode;
  providers: AIProvider[];
  executionOrder?: AIProviderType[];
  fallbackOnError?: boolean;
  enabled?: boolean;
  debounceMs?: number;
  excludeFields?: string[];
}

export function AIFormProvider({
  children,
  providers,
  executionOrder,
  fallbackOnError = true,
  enabled = true,
  debounceMs = 800,
  excludeFields = [],
}: AIFormProviderProps) {
  const sortedProviders = React.useMemo(() => {
    if (executionOrder && executionOrder.length > 0) {
      return executionOrder;
    }
    
    return providers
      .filter(p => p.enabled !== false)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .map(p => p.type);
  }, [providers, executionOrder]);

  const contextValue: AIFormContextValue = {
    providers,
    executionOrder: sortedProviders,
    fallbackOnError,
    enabled,
    debounceMs,
    excludeFields,
  };

  return (
    <AIFormContext.Provider value={contextValue}>
      {children}
    </AIFormContext.Provider>
  );
}

export function useAIFormContext(): AIFormContextValue {
  const context = useContext(AIFormContext);
  
  if (!context) {
    throw new Error('useAIFormContext must be used within AIFormProvider');
  }
  
  return context;
}

export function useOptionalAIFormContext(): AIFormContextValue | null {
  return useContext(AIFormContext);
}
