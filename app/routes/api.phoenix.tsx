import { json } from '@remix-run/node';
import type { ActionFunctionArgs } from '@remix-run/node';
import { authenticate } from '../shopify.server';
import { generatePhoenixContent } from '../gemini.server';

export const action = async ({ request }: ActionFunctionArgs) => {
    // 1. Authenticate the Shopify User
    const { admin } = await authenticate.admin(request);

    // 2. Parse the incoming JSON payload
    const { prompt } = await request.json();

    if (!prompt) {
        return json({ error: 'Prompt is required' }, { status: 400 });
    }

    try {
        // 3. Call the Phoenix/Gemini Logic
        const aiResponse = await generatePhoenixContent(prompt);

        // 4. Return the result to the frontend
        return json({ content: aiResponse });
    } catch (error) {
        return json({ error: 'Failed to generate content' }, { status: 500 });
    }
};
