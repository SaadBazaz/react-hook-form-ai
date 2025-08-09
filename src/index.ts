import { useForm, SubmitHandler } from 'react-hook-form';
import { enableAutoFill } from './ai/autofill';
import { generateFormSummary } from './ai/summarize';
import { FormData } from './types';

export const useFormAI = (options) => {
    const formMethods = useForm<FormData>(options);

    const { register, handleSubmit, setValue, watch } = formMethods;

    // Enable auto-fill feature
    enableAutoFill(watch, setValue);

    // Function to handle form submission
    const onSubmit: SubmitHandler<FormData> = (data) => {
        console.log('Form Data:', data);
        const summary = generateFormSummary(data);
        console.log('Form Summary:', summary);
    };

    return {
        ...formMethods,
        handleSubmit: (callback) => handleSubmit((data) => {
            onSubmit(data);
            callback(data);
        }),
        register,
    };
};