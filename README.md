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

`react-hook-form-ai` is a wrapper package over [React Hook Form](https://react-hook-form.com/) that integrates AI features such as auto-fill and form summarization using the browser's built-in LLM. This package is designed to be a complete drop-in replacement for React Hook Form while maintaining backward compatibility.

### Features


- **Auto-fill**: Pulls user's auto-fill data from Chrome, prompts user to generate the form with AI.
- **Form Summarization**: Provides a concise overview of the filled form data using AI.
- **Grammar Suggestions**: Suggests grammar fixes in the form
- Uses Chrome's [built-in AI](https://developer.chrome.com/docs/ai/built-in-apis) features as the LLM backend - No need to host any infra!
- If you still want to use another LLM backend, this follows the OpenAI API specification. So you can plug-and-play any backend
- Want to learn more about React-Hook-Form's features? Read their [README](https://github.com/react-hook-form/react-hook-form#features).

### Install

```bash
npm install react-hook-form-ai
```

### Quickstart

```jsx
import { useForm } from 'react-hook-form-ai'; // <- Notice how only the import changes!

function App() {
  const {
    register,
    handleSubmit,
    useAI = true, // <- `true` by default
    formState: { errors },
  } = useForm();

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <input {...register('firstName')} />
      <input {...register('lastName', { required: true })} />
      {errors.lastName && <p>Last name is required.</p>}
      <input {...register('age', { pattern: /\d+/ })} />
      {errors.age && <p>Please enter number for age.</p>}
      <input type="submit" />
    </form>
  );
}
```

Learn more about React-Hook-Form. This library only adds the _AI_ part.


### Contributors

Thanks go to the wonderful people behind React-Hook-Form. I just connected the dots.