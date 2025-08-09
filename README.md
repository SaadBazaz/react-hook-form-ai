# react-hook-form-ai

`react-hook-form-ai` is a wrapper package over [React Hook Form](https://react-hook-form.com/) that integrates AI features such as auto-fill and form summarization using the browser's built-in LLM. This package is designed to be a complete drop-in replacement for React Hook Form while maintaining backward compatibility.

## Features

- **Auto-fill**: Automatically fills form fields based on user input and context using AI.
- **Form Summarization**: Provides a concise overview of the filled form data using AI.

## Installation

To install the package, run:

```bash
npm install react-hook-form-ai
```

## Usage

Here’s a simple example of how to use `react-hook-form-ai` in your React application:

```javascript
import { useForm } from 'react-hook-form-ai';

function MyForm() {
  const { register, handleSubmit, enableAutoFill, generateFormSummary } = useForm();

  const onSubmit = data => {
    console.log(data);
    const summary = generateFormSummary(data);
    console.log(summary);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} placeholder="Name" />
      <input {...register('email')} placeholder="Email" />
      <button type="button" onClick={enableAutoFill}>Auto-fill</button>
      <button type="submit">Submit</button>
    </form>
  );
}
```

## API Reference

### `useForm()`

- Returns an object containing methods and properties to manage the form.

#### Methods

- `register(name: string)`: Registers an input field.
- `handleSubmit(onSubmit: Function)`: Handles form submission.
- `enableAutoFill()`: Enables the auto-fill feature.
- `generateFormSummary(data: Object)`: Generates a summary of the form data.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.