<div align="center">
        <a href="https://github.com/SaadBazaz/react-hook-form-ai" title="React Hook Form AI - Simple React forms validation, combined with the power of AI">
            <img src="https://raw.githubusercontent.com/SaadBazaz/react-hook-form-ai/master/docs/logo.png" alt="React Hook AI Form Logo - React hook custom hook for form validation, with AI" />
        </a>
</div>

<div align="center">

[![npm downloads](https://img.shields.io/npm/dm/react-hook-form-ai.svg?style=for-the-badge)](https://www.npmjs.com/package/react-hook-form-ai)
[![npm](https://img.shields.io/npm/dt/react-hook-form-ai.svg?style=for-the-badge)](https://www.npmjs.com/package/react-hook-form-ai)
[![npm](https://img.shields.io/npm/l/react-hook-form-ai?style=for-the-badge)](https://github.com/SaadBazaz/react-hook-form-ai/blob/master/LICENSE)
<!-- [![Discord](https://img.shields.io/discord/754891658327359538.svg?style=for-the-badge&label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/yYv7GZ8) -->

</div>

A drop-in replacement for React Hook Form with AI-powered autofill and field suggestions. Supports Chrome Built-in AI, OpenAI, and custom AI providers with automatic fallback.

### Features

- **AI-Powered Autofill**: Generate realistic form data using AI
- **Smart Field Suggestions**: Get AI suggestions for individual fields with debounced blur events
- **Multiple Provider Support**: Chrome Built-in AI, OpenAI, Custom Server, or Browser AI
- **Provider Fallback**: Automatic fallback to next provider on failure
- **Download Progress**: Monitor Chrome AI model download progress
- **Availability Checking**: Check AI availability before use
- **Global Configuration**: Configure providers once with AIFormProvider
- **Full TypeScript Support**: Complete type definitions included
- **Drop-in Replacement**: 100% compatible with React Hook Form API

### Install

```bash
npm install react-hook-form-ai
# or
pnpm add react-hook-form-ai
# or
yarn add react-hook-form-ai
```

### Quickstart

```tsx
import { useForm } from 'react-hook-form-ai';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  age: number;
}

function App() {
  const {
    register,
    handleSubmit,
    aiAutofill,
    aiLoading,
    aiAvailability,
    formState: { errors },
  } = useForm<FormData>();

  const handleAutofill = async () => {
    try {
      await aiAutofill();
    } catch (error) {
      console.error('Autofill failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <input {...register('firstName')} placeholder="First Name" />
      <input {...register('lastName', { required: true })} placeholder="Last Name" />
      {errors.lastName && <p>Last name is required.</p>}
      <input {...register('email')} placeholder="Email" type="email" />
      <input {...register('age', { pattern: /\d+/ })} placeholder="Age" />
      {errors.age && <p>Please enter number for age.</p>}
      
      <button 
        type="button" 
        onClick={handleAutofill}
        disabled={aiLoading || !aiAvailability?.available}
      >
        {aiLoading ? 'Filling...' : 'AI Autofill'}
      </button>
      
      {aiAvailability && !aiAvailability.available && (
        <p>AI is not available. Status: {aiAvailability.status}</p>
      )}
      
      <input type="submit" />
    </form>
  );
}
```

Learn more about [React Hook Form](https://react-hook-form.com/). This library only adds the _AI_ part.

## Provider Configuration

### Using AIFormProvider (Global Configuration)

The `AIFormProvider` component allows you to configure AI providers globally for your entire application or a specific part of your component tree. This is the recommended approach for most applications.

```tsx
import { AIFormProvider } from 'react-hook-form-ai';
import App from './App';

function Root() {
  return (
    <AIFormProvider
      providers={[
        { type: 'chrome', priority: 10 },
        { 
          type: 'openai', 
          apiKey: 'sk-...', 
          model: 'gpt-3.5-turbo',
          priority: 5 
        },
        {
          type: 'custom',
          apiUrl: 'https://your-api.com',
          priority: 1
        }
      ]}
      executionOrder={['chrome', 'openai', 'custom']}
      fallbackOnError={true}
    >
      <App />
    </AIFormProvider>
  );
}
```

**Configuration Options:**

- `providers`: Array of AI provider configurations (required)
- `executionOrder`: Array specifying the order to try providers. If not provided, providers are sorted by priority (highest first)
- `fallbackOnError`: When `true`, automatically tries the next provider if one fails (default: `true`)
- `enabled`: Globally enable/disable AI features (default: `true`)
- `debounceMs`: Debounce time in milliseconds for AI suggestions (default: `800`)
- `excludeFields`: Array of field names to exclude from AI processing (default: `[]`)

### Chrome Built-in AI Provider

The Chrome Built-in AI provider uses Chrome's experimental on-device AI capabilities. This provider is privacy-friendly as all processing happens locally in the browser.

```tsx
{
  type: 'chrome',
  priority: 10  // Optional: higher priority = tried first
}
```

**Features:**
- ✅ No API key required
- ✅ Browser-based and privacy-friendly
- ✅ Free to use
- ⚠️ Requires Chrome 139+ with AI features enabled and Chrome Origin Tials Token
- ⚠️ May require downloading the AI model on first use

**Note:** The AI model download requires user interaction. Use `aiAvailability` and `aiDownloadProgress` to handle the download flow gracefully.

### OpenAI Provider

The OpenAI provider connects to OpenAI's API for AI-powered form features.

```tsx
{
  type: 'openai',
  apiKey: 'sk-...', // Required: Your OpenAI API key
  model: 'gpt-3.5-turbo', // Optional: defaults to 'gpt-3.5-turbo'
  organization: 'org-...', // Optional: Your OpenAI organization ID
  apiUrl: 'https://api.openai.com/v1/chat/completions', // Optional: custom API URL for proxies
  priority: 5
}
```

**Supported Models:**
- `gpt-3.5-turbo` (default) - Fast and cost-effective
- `gpt-4` - More accurate but slower and more expensive
- `gpt-4-turbo` - Balance of speed and accuracy

**Custom API URL:**
You can use a custom `apiUrl` to route requests through a proxy or use OpenAI-compatible APIs:

```tsx
{
  type: 'openai',
  apiKey: 'sk-...',
  apiUrl: 'https://your-proxy.com/v1/chat/completions',
  model: 'gpt-3.5-turbo'
}
```

### Custom Server Provider

The Custom Server provider allows you to connect to your own AI backend or any custom API endpoint.

```tsx
{
  type: 'custom',
  apiUrl: 'https://your-api.com',
  headers: {
    'Authorization': 'Bearer your-token',
    'X-Custom-Header': 'value'
  },
  priority: 1
}
```

**Required API Endpoints:**

Your custom server must implement these endpoints:

#### 1. Health Check
```
GET /health
Response: 200 OK
```

#### 2. Field Suggestion
```
POST /api/suggest
Content-Type: application/json

Request Body:
{
  "fieldName": "email",
  "currentValue": "john@",
  "formContext": { "firstName": "John", "lastName": "Doe" }
}

Response:
{
  "suggestion": "john@example.com"
}
```

#### 3. Form Autofill
```
POST /api/autofill
Content-Type: application/json

Request Body:
{
  "fields": ["firstName", "lastName", "email"],
  "formContext": {}
}

Response:
{
  "autofillData": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com"
  }
}
```

### Local Configuration (Per-Form Override)

You can override global provider settings for individual forms by passing options to the `useForm` hook:

```tsx
import { useForm } from 'react-hook-form-ai';

function MyForm() {
  const { register, aiAutofill } = useForm({
    ai: {
      enabled: true,
      providers: [
        { type: 'openai', apiKey: 'sk-...', priority: 10 }
      ],
      executionOrder: ['openai'],
      fallbackOnError: false,
      debounceMs: 500,
      excludeFields: ['password', 'creditCard']
    }
  });

  return (
    <form>
      <input {...register('username')} />
      <input {...register('password')} type="password" />
      <button type="button" onClick={() => aiAutofill()}>
        AI Autofill
      </button>
    </form>
  );
}
```

**Local options override global settings:**
- `enabled`: Enable/disable AI for this form only
- `providers`: Use different providers for this form
- `executionOrder`: Custom provider order for this form
- `fallbackOnError`: Override fallback behavior
- `debounceMs`: Custom debounce timing
- `excludeFields`: Fields to exclude from AI processing (e.g., passwords, credit cards)

## API Reference

### UseFormAIReturn Interface

The `useForm` hook returns all standard React Hook Form properties plus the following AI-specific properties:

#### `aiEnabled: boolean`

Indicates whether AI features are enabled for this form instance.

```tsx
const { aiEnabled } = useForm({ ai: { enabled: true } });
console.log(aiEnabled); // true
```

#### `aiAutofill: (fields?: string[]) => Promise<void>`

Triggers AI-powered autofill for all form fields or specific fields.

**Parameters:**
- `fields` (optional): Array of field names to autofill. If omitted, all fields are autofilled.

**Returns:** `Promise<void>` - Resolves when autofill is complete, rejects on error.

**Example:**
```tsx
const { aiAutofill } = useForm<FormData>();

// Autofill all fields
await aiAutofill();

// Autofill specific fields only
await aiAutofill(['firstName', 'lastName']);
```

#### `aiSuggest: (fieldName: string) => Promise<string | null>`

Gets an AI suggestion for a specific field based on its current value and form context.

**Parameters:**
- `fieldName`: The name of the field to get a suggestion for

**Returns:** `Promise<string | null>` - The suggested value, or `null` if no suggestion is available

**Example:**
```tsx
const { aiSuggest, setValue } = useForm<FormData>();

const suggestion = await aiSuggest('email');
if (suggestion) {
  setValue('email', suggestion);
}
```

#### `aiLoading: boolean`

Indicates whether an AI operation (autofill or suggest) is currently in progress.

**Example:**
```tsx
const { aiLoading, aiAutofill } = useForm();

<button onClick={() => aiAutofill()} disabled={aiLoading}>
  {aiLoading ? 'Filling...' : 'AI Autofill'}
</button>
```

#### `aiAvailability: { available: boolean; status: string; needsDownload: boolean } | null`

Provides information about AI availability status. This is particularly useful for Chrome Built-in AI which may require model download.

**Properties:**
- `available`: `true` if AI is ready to use
- `status`: Current status string (`'readily'`, `'downloadable'`, `'downloading'`, `'unavailable'`, `'error'`)
- `needsDownload`: `true` if the AI model needs to be downloaded (Chrome AI only)

**Example:**
```tsx
const { aiAvailability, aiAutofill } = useForm();

if (aiAvailability?.needsDownload) {
  // User interaction required to start download
  return <button onClick={() => aiAutofill()}>Download AI Model & Autofill</button>;
}

if (!aiAvailability?.available) {
  return <p>AI unavailable: {aiAvailability?.status}</p>;
}
```

#### `refreshAvailability: () => Promise<void>`

Manually refreshes the AI availability status. Useful after user interactions or when checking if a download has completed.

**Returns:** `Promise<void>` - Resolves when availability check is complete

**Example:**
```tsx
const { refreshAvailability, aiAvailability } = useForm();

useEffect(() => {
  const interval = setInterval(async () => {
    if (aiAvailability?.status === 'downloading') {
      await refreshAvailability();
    }
  }, 2000);
  
  return () => clearInterval(interval);
}, [aiAvailability?.status]);
```

#### `aiDownloadProgress: number | null`

Download progress percentage (0-100) when the Chrome AI model is being downloaded. `null` when not downloading.

**Example:**
```tsx
const { aiDownloadProgress } = useForm();

{aiDownloadProgress !== null && (
  <div>
    <progress value={aiDownloadProgress} max={100} />
    <span>{aiDownloadProgress}% downloaded</span>
  </div>
)}
```

### AIFormOptions Interface

Configuration options for AI features, passed to the `useForm` hook via the `ai` property.

```tsx
interface AIFormOptions {
  enabled?: boolean;
  apiUrl?: string;
  debounceMs?: number;
  excludeFields?: string[];
  autoCheckAvailability?: boolean;
  providers?: AIProvider[];
  executionOrder?: AIProviderType[];
  fallbackOnError?: boolean;
}
```

#### Configuration Properties

**`enabled?: boolean`**
- **Default:** `true`
- Enable or disable AI features for this form
- **Example:** `{ ai: { enabled: false } }`

**`apiUrl?: string`**
- **Default:** `'http://localhost:3001'`
- Fallback API endpoint for custom server provider
- **Example:** `{ ai: { apiUrl: 'https://api.example.com' } }`

**`debounceMs?: number`**
- **Default:** `800`
- Debounce time in milliseconds for AI suggestions on field blur
- **Example:** `{ ai: { debounceMs: 500 } }`

**`excludeFields?: string[]`**
- **Default:** `[]`
- Array of field names to exclude from AI processing (e.g., passwords, credit cards)
- **Example:** `{ ai: { excludeFields: ['password', 'ssn', 'creditCard'] } }`

**`autoCheckAvailability?: boolean`**
- **Default:** `true`
- Automatically check AI availability when the form mounts
- **Example:** `{ ai: { autoCheckAvailability: false } }`

**`providers?: AIProvider[]`**
- **Default:** Inherited from `AIFormProvider` or `undefined`
- Override AI providers for this specific form
- **Example:** `{ ai: { providers: [{ type: 'openai', apiKey: 'sk-...' }] } }`

**`executionOrder?: AIProviderType[]`**
- **Default:** Inherited from `AIFormProvider` or sorted by priority
- Override the order in which providers are tried
- **Example:** `{ ai: { executionOrder: ['chrome', 'openai'] } }`

**`fallbackOnError?: boolean`**
- **Default:** `true`
- Automatically try the next provider if one fails
- **Example:** `{ ai: { fallbackOnError: false } }`

**Complete Example:**
```tsx
const form = useForm<FormData>({
  ai: {
    enabled: true,
    debounceMs: 500,
    excludeFields: ['password', 'creditCard'],
    autoCheckAvailability: true,
    providers: [
      { type: 'chrome', priority: 10 },
      { type: 'openai', apiKey: 'sk-...', priority: 5 }
    ],
    executionOrder: ['chrome', 'openai'],
    fallbackOnError: true
  }
});
```

### AIProvider Type Definitions

The library supports multiple AI provider types, each with its own configuration interface.

#### `AIProviderType`

Union type of all supported provider types:

```tsx
type AIProviderType = 'chrome' | 'openai' | 'custom' | 'browser';
```

#### `ChromeAIConfig`

Configuration for Chrome Built-in AI provider.

```tsx
interface ChromeAIConfig {
  type: 'chrome';
  enabled?: boolean;
  priority?: number;
}
```

**Example:**
```tsx
const chromeProvider: ChromeAIConfig = {
  type: 'chrome',
  priority: 10
};
```

**Properties:**
- `type`: Must be `'chrome'`
- `enabled`: Optional. Set to `false` to disable this provider
- `priority`: Optional. Higher values are tried first (default: 0)

#### `OpenAIConfig`

Configuration for OpenAI API provider.

```tsx
interface OpenAIConfig {
  type: 'openai';
  apiKey: string;
  apiUrl?: string;
  model?: string;
  organization?: string;
  enabled?: boolean;
  priority?: number;
}
```

**Example:**
```tsx
const openaiProvider: OpenAIConfig = {
  type: 'openai',
  apiKey: 'sk-...',
  model: 'gpt-4',
  organization: 'org-...',
  priority: 5
};
```

**Properties:**
- `type`: Must be `'openai'`
- `apiKey`: **Required.** Your OpenAI API key
- `apiUrl`: Optional. Custom API endpoint (default: OpenAI's API)
- `model`: Optional. Model to use (default: `'gpt-3.5-turbo'`)
- `organization`: Optional. Your OpenAI organization ID
- `enabled`: Optional. Set to `false` to disable this provider
- `priority`: Optional. Higher values are tried first (default: 0)

#### `CustomServerConfig`

Configuration for custom AI server provider.

```tsx
interface CustomServerConfig {
  type: 'custom';
  apiUrl: string;
  headers?: Record<string, string>;
  enabled?: boolean;
  priority?: number;
}
```

**Example:**
```tsx
const customProvider: CustomServerConfig = {
  type: 'custom',
  apiUrl: 'https://your-api.com',
  headers: {
    'Authorization': 'Bearer token',
    'X-Custom-Header': 'value'
  },
  priority: 1
};
```

**Properties:**
- `type`: Must be `'custom'`
- `apiUrl`: **Required.** Your custom API endpoint
- `headers`: Optional. Custom HTTP headers for requests
- `enabled`: Optional. Set to `false` to disable this provider
- `priority`: Optional. Higher values are tried first (default: 0)

#### `BrowserAIConfig`

Configuration for browser-based AI provider.

```tsx
interface BrowserAIConfig {
  type: 'browser';
  apiUrl: string;
  headers?: Record<string, string>;
  enabled?: boolean;
  priority?: number;
}
```

**Example:**
```tsx
const browserProvider: BrowserAIConfig = {
  type: 'browser',
  apiUrl: 'https://browser-ai.example.com',
  priority: 3
};
```

**Properties:**
- `type`: Must be `'browser'`
- `apiUrl`: **Required.** Browser AI service endpoint
- `headers`: Optional. Custom HTTP headers for requests
- `enabled`: Optional. Set to `false` to disable this provider
- `priority`: Optional. Higher values are tried first (default: 0)

#### `AIProvider` Union Type

The `AIProvider` type is a union of all provider configuration types:

```tsx
type AIProvider = ChromeAIConfig | OpenAIConfig | CustomServerConfig | BrowserAIConfig;
```

**Usage in AIFormProvider:**
```tsx
const providers: AIProvider[] = [
  { type: 'chrome', priority: 10 },
  { type: 'openai', apiKey: 'sk-...', model: 'gpt-4', priority: 5 },
  { type: 'custom', apiUrl: 'https://api.example.com', priority: 1 }
];

<AIFormProvider providers={providers}>
  <App />
</AIFormProvider>
```

## Advanced Examples

### Multi-Provider Setup with Fallback

This example demonstrates how to configure multiple AI providers with priority-based execution and automatic fallback when a provider fails.

```tsx
import { AIFormProvider, useForm } from 'react-hook-form-ai';

// Root component with provider configuration
function Root() {
  return (
    <AIFormProvider
      providers={[
        // Chrome AI: Highest priority, free and privacy-friendly
        { 
          type: 'chrome', 
          priority: 10 
        },
        // OpenAI: Fallback option with good accuracy
        { 
          type: 'openai', 
          apiKey: process.env.REACT_APP_OPENAI_KEY || '',
          model: 'gpt-3.5-turbo',
          priority: 5 
        },
        // Custom server: Lowest priority fallback
        {
          type: 'custom',
          apiUrl: 'https://your-ai-backend.com',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_CUSTOM_TOKEN}`
          },
          priority: 1
        }
      ]}
      executionOrder={['chrome', 'openai', 'custom']}
      fallbackOnError={true}
    >
      <App />
    </AIFormProvider>
  );
}

// Form component that uses the configured providers
function App() {
  const { 
    register, 
    handleSubmit, 
    aiAutofill, 
    aiLoading,
    aiAvailability 
  } = useForm<{
    name: string;
    email: string;
    company: string;
  }>();

  const [error, setError] = React.useState<string | null>(null);

  const handleAutofill = async () => {
    setError(null);
    try {
      // Will try Chrome first, then OpenAI, then Custom if previous ones fail
      await aiAutofill();
    } catch (err) {
      setError('All AI providers failed. Please fill the form manually.');
      console.error('Autofill error:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit(data => console.log(data))}>
      <input {...register('name')} placeholder="Full Name" />
      <input {...register('email')} placeholder="Email" type="email" />
      <input {...register('company')} placeholder="Company" />
      
      <button 
        type="button" 
        onClick={handleAutofill}
        disabled={aiLoading || !aiAvailability?.available}
      >
        {aiLoading ? 'Filling...' : 'AI Autofill'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {aiAvailability && !aiAvailability.available && (
        <p>AI Status: {aiAvailability.status}</p>
      )}
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

**How Fallback Works:**

1. **Chrome AI is tried first** (priority: 10)
   - If Chrome AI is unavailable or fails, automatically falls back to OpenAI
   
2. **OpenAI is tried second** (priority: 5)
   - If OpenAI fails (e.g., API key invalid, rate limit), falls back to Custom server
   
3. **Custom server is tried last** (priority: 1)
   - If all providers fail, the promise rejects and you can handle the error

**Benefits:**
- Free Chrome AI when available
- Reliable fallback to cloud providers
- Graceful degradation
- No single point of failure

### Field-Level AI Suggestions

This example shows how to use AI suggestions for individual fields, with custom debounce timing and field exclusions for sensitive data.

```tsx
import { useForm } from 'react-hook-form-ai';
import { useState } from 'react';

interface ProfileForm {
  username: string;
  email: string;
  bio: string;
  password: string;
  website: string;
}

function ProfileEditor() {
  const { 
    register, 
    handleSubmit, 
    aiSuggest, 
    setValue,
    watch 
  } = useForm<ProfileForm>({
    ai: {
      enabled: true,
      debounceMs: 500, // Faster suggestions (default is 800ms)
      excludeFields: ['password'], // Never send password to AI
      providers: [
        { type: 'chrome', priority: 10 },
        { type: 'openai', apiKey: process.env.REACT_APP_OPENAI_KEY || '', priority: 5 }
      ]
    }
  });

  const [suggestions, setSuggestions] = useState<Record<string, string>>({});
  const [loadingField, setLoadingField] = useState<string | null>(null);

  // Get AI suggestion for a specific field
  const getSuggestion = async (fieldName: keyof ProfileForm) => {
    setLoadingField(fieldName);
    try {
      const suggestion = await aiSuggest(fieldName);
      if (suggestion) {
        setSuggestions(prev => ({ ...prev, [fieldName]: suggestion }));
      }
    } catch (error) {
      console.error(`Failed to get suggestion for ${fieldName}:`, error);
    } finally {
      setLoadingField(null);
    }
  };

  // Accept a suggestion and apply it to the field
  const acceptSuggestion = (fieldName: keyof ProfileForm) => {
    const suggestion = suggestions[fieldName];
    if (suggestion) {
      setValue(fieldName, suggestion);
      setSuggestions(prev => {
        const updated = { ...prev };
        delete updated[fieldName];
        return updated;
      });
    }
  };

  const currentValues = watch();

  return (
    <form onSubmit={handleSubmit(data => console.log(data))}>
      <div>
        <label>Username</label>
        <input {...register('username')} placeholder="johndoe" />
        <button 
          type="button" 
          onClick={() => getSuggestion('username')}
          disabled={loadingField === 'username'}
        >
          {loadingField === 'username' ? '...' : '✨ Suggest'}
        </button>
        {suggestions.username && (
          <div style={{ background: '#f0f0f0', padding: '8px', margin: '4px 0' }}>
            <strong>Suggestion:</strong> {suggestions.username}
            <button type="button" onClick={() => acceptSuggestion('username')}>
              ✓ Accept
            </button>
            <button type="button" onClick={() => setSuggestions(prev => {
              const updated = { ...prev };
              delete updated.username;
              return updated;
            })}>
              ✗ Dismiss
            </button>
          </div>
        )}
      </div>

      <div>
        <label>Email</label>
        <input {...register('email')} placeholder="john@example.com" type="email" />
        <button 
          type="button" 
          onClick={() => getSuggestion('email')}
          disabled={loadingField === 'email'}
        >
          {loadingField === 'email' ? '...' : '✨ Suggest'}
        </button>
        {suggestions.email && (
          <div style={{ background: '#f0f0f0', padding: '8px', margin: '4px 0' }}>
            <strong>Suggestion:</strong> {suggestions.email}
            <button type="button" onClick={() => acceptSuggestion('email')}>
              ✓ Accept
            </button>
            <button type="button" onClick={() => setSuggestions(prev => {
              const updated = { ...prev };
              delete updated.email;
              return updated;
            })}>
              ✗ Dismiss
            </button>
          </div>
        )}
      </div>

      <div>
        <label>Bio</label>
        <textarea {...register('bio')} placeholder="Tell us about yourself..." rows={4} />
        <button 
          type="button" 
          onClick={() => getSuggestion('bio')}
          disabled={loadingField === 'bio'}
        >
          {loadingField === 'bio' ? '...' : '✨ Improve with AI'}
        </button>
        {suggestions.bio && (
          <div style={{ background: '#f0f0f0', padding: '8px', margin: '4px 0' }}>
            <strong>Improved version:</strong>
            <p>{suggestions.bio}</p>
            <button type="button" onClick={() => acceptSuggestion('bio')}>
              ✓ Accept
            </button>
            <button type="button" onClick={() => setSuggestions(prev => {
              const updated = { ...prev };
              delete updated.bio;
              return updated;
            })}>
              ✗ Dismiss
            </button>
          </div>
        )}
      </div>

      <div>
        <label>Password</label>
        <input 
          {...register('password')} 
          type="password" 
          placeholder="Enter secure password" 
        />
        {/* No AI suggestion button for password - it's excluded */}
        <small style={{ color: '#666' }}>
          🔒 Password is excluded from AI processing for security
        </small>
      </div>

      <div>
        <label>Website</label>
        <input {...register('website')} placeholder="https://example.com" />
        <button 
          type="button" 
          onClick={() => getSuggestion('website')}
          disabled={loadingField === 'website'}
        >
          {loadingField === 'website' ? '...' : '✨ Suggest'}
        </button>
        {suggestions.website && (
          <div style={{ background: '#f0f0f0', padding: '8px', margin: '4px 0' }}>
            <strong>Suggestion:</strong> {suggestions.website}
            <button type="button" onClick={() => acceptSuggestion('website')}>
              ✓ Accept
            </button>
            <button type="button" onClick={() => setSuggestions(prev => {
              const updated = { ...prev };
              delete updated.website;
              return updated;
            })}>
              ✗ Dismiss
            </button>
          </div>
        )}
      </div>

      <button type="submit">Save Profile</button>
    </form>
  );
}
```

**Key Features:**

- **Custom Debounce:** Set to 500ms for faster suggestions (default is 800ms)
- **Field Exclusion:** Password field is excluded from AI processing for security
- **User Control:** Users can review suggestions before accepting them
- **Context-Aware:** AI considers other field values when making suggestions
- **Individual Field Targeting:** Get suggestions for specific fields on demand

**Use Cases:**
- Improving email formatting based on username
- Enhancing bio text for better readability
- Suggesting professional website URLs
- Formatting names consistently

### Chrome AI Download Handling

Chrome's Built-in AI requires downloading a language model (~1-2GB) on first use. This example shows how to handle the download flow gracefully with progress tracking.

```tsx
import { useForm } from 'react-hook-form-ai';
import { useEffect, useState } from 'react';

interface FormData {
  name: string;
  email: string;
  message: string;
}

function ContactForm() {
  const { 
    register, 
    handleSubmit, 
    aiAutofill, 
    aiLoading,
    aiAvailability,
    refreshAvailability,
    aiDownloadProgress 
  } = useForm<FormData>({
    ai: {
      providers: [{ type: 'chrome', priority: 10 }],
      autoCheckAvailability: true
    }
  });

  const [downloadStarted, setDownloadStarted] = useState(false);

  // Poll availability during download
  useEffect(() => {
    if (aiAvailability?.status === 'downloading') {
      const interval = setInterval(async () => {
        await refreshAvailability();
      }, 2000); // Check every 2 seconds

      return () => clearInterval(interval);
    }
  }, [aiAvailability?.status, refreshAvailability]);

  const handleAutofillClick = async () => {
    // If model needs download, this will trigger the download
    if (aiAvailability?.needsDownload) {
      setDownloadStarted(true);
    }
    
    try {
      await aiAutofill();
    } catch (error) {
      console.error('Autofill failed:', error);
    }
  };

  // Render different UI based on availability status
  const renderAIStatus = () => {
    if (!aiAvailability) {
      return <p>Checking AI availability...</p>;
    }

    switch (aiAvailability.status) {
      case 'readily':
        return (
          <button 
            type="button" 
            onClick={handleAutofillClick}
            disabled={aiLoading}
          >
            {aiLoading ? 'Filling...' : '✨ AI Autofill'}
          </button>
        );

      case 'downloadable':
        return (
          <div>
            <button 
              type="button" 
              onClick={handleAutofillClick}
              disabled={aiLoading}
            >
              📥 Download AI Model & Autofill
            </button>
            <p style={{ fontSize: '0.9em', color: '#666' }}>
              First-time setup: ~1-2GB download required
            </p>
          </div>
        );

      case 'downloading':
        return (
          <div>
            <p>Downloading AI model...</p>
            {aiDownloadProgress !== null && (
              <div>
                <progress 
                  value={aiDownloadProgress} 
                  max={100}
                  style={{ width: '100%', height: '20px' }}
                />
                <p>{Math.round(aiDownloadProgress)}% complete</p>
              </div>
            )}
            <small style={{ color: '#666' }}>
              This is a one-time download. Please keep this tab open.
            </small>
          </div>
        );

      case 'unavailable':
        return (
          <div>
            <p style={{ color: '#999' }}>
              ❌ Chrome AI is not available in this browser
            </p>
            <small>
              Requires Chrome 127+ with AI features enabled.
              <br />
              Visit <a href="chrome://flags/#optimization-guide-on-device-model" target="_blank">
                chrome://flags/#optimization-guide-on-device-model
              </a> to enable.
            </small>
          </div>
        );

      case 'error':
        return (
          <div>
            <p style={{ color: '#d00' }}>⚠️ AI availability check failed</p>
            <button type="button" onClick={() => refreshAvailability()}>
              🔄 Retry
            </button>
          </div>
        );

      default:
        return <p>Unknown AI status: {aiAvailability.status}</p>;
    }
  };

  return (
    <form onSubmit={handleSubmit(data => console.log(data))}>
      <h2>Contact Us</h2>
      
      <div>
        <label>Name</label>
        <input {...register('name')} placeholder="Your name" />
      </div>

      <div>
        <label>Email</label>
        <input {...register('email')} placeholder="your@email.com" type="email" />
      </div>

      <div>
        <label>Message</label>
        <textarea {...register('message')} placeholder="Your message..." rows={5} />
      </div>

      <div style={{ margin: '20px 0', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
        {renderAIStatus()}
      </div>

      <button type="submit">Send Message</button>
    </form>
  );
}
```

**Best Practices:**

1. **Check availability on mount** - Use `autoCheckAvailability: true` (default)
2. **Show download progress** - Display `aiDownloadProgress` during download
3. **Require user interaction** - Chrome requires user action to start download
4. **Poll during download** - Use `refreshAvailability()` to update status
5. **Provide fallback** - Configure alternative providers for unsupported browsers
6. **Clear messaging** - Explain the one-time download requirement

**Download Requirements:**
- ⚠️ Requires user interaction (button click) to start download
- ⚠️ Download size: ~1-2GB (one-time only)
- ⚠️ User must keep the tab open during download
- ✅ Model is cached locally after download
- ✅ Subsequent uses are instant

## Browser Compatibility

### Chrome Built-in AI Requirements

The Chrome Built-in AI provider requires **Chrome version 127 or higher** with experimental AI features enabled. This provider offers privacy-friendly, on-device AI processing at no cost.

#### Enabling Chrome AI

1. **Update Chrome:** Ensure you're running Chrome 139 or later
2. **Enable AI Features:** Visit `chrome://flags/#optimization-guide-on-device-model` and set it to "Enabled"
3. **Restart Browser:** Relaunch Chrome for changes to take effect

#### Handling the `needsDownload` State

When `aiAvailability.needsDownload` is `true`, you should:

1. **Inform the user** about the one-time download requirement
2. **Require user action** - provide a clear button to trigger the download
3. **Display progress** using `aiDownloadProgress` during download
4. **Keep user informed** - explain they need to keep the tab open

**Example:**
```tsx
const { aiAvailability, aiDownloadProgress, aiAutofill } = useForm({
  ai: { providers: [{ type: 'chrome' }] }
});

if (aiAvailability?.needsDownload) {
  return (
    <div>
      <p>Chrome AI requires a one-time model download (~1-2GB)</p>
      <button onClick={() => aiAutofill()}>
        📥 Download AI Model & Start
      </button>
    </div>
  );
}

if (aiAvailability?.status === 'downloading') {
  return (
    <div>
      <p>Downloading AI model... Please keep this tab open.</p>
      <progress value={aiDownloadProgress || 0} max={100} />
      <p>{Math.round(aiDownloadProgress || 0)}% complete</p>
    </div>
  );
}
```

#### Fallback for Unsupported Browsers

For browsers that don't support Chrome AI, configure fallback providers to ensure your forms remain functional:

```tsx
<AIFormProvider
  providers={[
    { type: 'chrome', priority: 10 },      // Try Chrome AI first
    { type: 'openai', apiKey: 'sk-...', priority: 5 },  // Fallback to OpenAI
    { type: 'custom', apiUrl: 'https://your-api.com', priority: 1 }  // Final fallback
  ]}
  fallbackOnError={true}
>
  <App />
</AIFormProvider>
```

**Fallback Behavior:**
- If Chrome AI is unavailable, the library automatically tries the next provider in the execution order
- Users on unsupported browsers (Safari, Firefox, older Chrome) will seamlessly use alternative providers
- No code changes needed - fallback is automatic when `fallbackOnError={true}`

#### Checking Availability Programmatically

You can check AI availability and handle different states in your component:

```tsx
const { aiAvailability, refreshAvailability } = useForm();

useEffect(() => {
  // Check availability on mount
  refreshAvailability();
}, []);

if (!aiAvailability) {
  return <p>Checking AI availability...</p>;
}

if (aiAvailability.status === 'unavailable') {
  return (
    <div>
      <p>Chrome AI is not available in this browser.</p>
      <p>Using fallback AI provider...</p>
    </div>
  );
}

if (aiAvailability.available) {
  return <button onClick={() => aiAutofill()}>✨ AI Autofill</button>;
}
```

**Recommendation:** Always configure at least one fallback provider (OpenAI or Custom Server) to ensure your forms work across all browsers.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to get started, coding standards, and the pull request process.

## Credits

This library is built on top of the excellent [React Hook Form](https://react-hook-form.com/) library. All credit for the core form management functionality goes to the React Hook Form team. This library simply adds AI-powered features on top of their solid foundation.

## Resources

- [React Hook Form Documentation](https://react-hook-form.com/get-started) - Learn about the underlying form library
- [Chrome Built-in AI Documentation](https://developer.chrome.com/docs/ai/built-in) - Official Chrome AI documentation
- [Contributing Guide](CONTRIBUTING.md) - How to contribute to this project

## License

MIT © [Saad Bazaz](https://github.com/SaadBazaz)

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.