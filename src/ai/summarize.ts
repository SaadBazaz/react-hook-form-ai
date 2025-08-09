export const generateFormSummary = async (formData: Record<string, any>): Promise<string> => {
    const prompt = `Summarize the following form data: ${JSON.stringify(formData)}`;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer YOUR_API_KEY`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 100
        })
    });

    if (!response.ok) {
        throw new Error('Failed to generate summary');
    }

    const data = await response.json();
    return data.choices[0].message.content;
};