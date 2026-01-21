import { json, type ActionFunctionArgs } from '@remix-run/node';
import { authenticate } from '../shopify.server';
import { generateProductDescription } from '../gemini.server';

export const action = async ({ request }: ActionFunctionArgs) => {
    // 1. Authenticate the request to ensure it comes from a logged-in Shopify merchant
    const { admin } = await authenticate.admin(request);

    // 2. Parse the incoming form data
    const formData = await request.formData();
    const productName = formData.get('productName') as string;
    const features = formData.get('features') as string;

    if (!productName) {
        return json({ error: 'Product name is required' }, { status: 400 });
    }

    try {
        // 3. Call the Phoenix/Gemini utility
        const generatedText = await generateProductDescription(
            productName,
            features ? features.split(',') : []
        );

        // 4. Return the result to the frontend
        return json({ description: generatedText });
    } catch (error) {
        return json({ error: 'AI generation failed' }, { status: 500 });
    }
};
