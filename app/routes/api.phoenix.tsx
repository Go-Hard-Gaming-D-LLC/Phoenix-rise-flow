import { json } from '@remix-run/node';
import type { ActionFunctionArgs } from '@remix-run/node';
import { authenticate } from '../shopify.server';
import { generatePhoenixContent } from '../gemini.server';

export const action = async ({ request }: ActionFunctionArgs) => {
    // 1. Authenticate the Shopify User
    const { admin } = await authenticate.admin(request);

    let prompt = "";
    let context = "Shopify Product Editor";

    const contentType = request.headers.get("Content-Type");

    if (contentType?.includes("application/json")) {
        const data = await request.json();
        prompt = data.prompt;
        if (data.context) context = data.context;
    } else {
        const formData = await request.formData();
        prompt = formData.get("prompt") as string;
        const contextVal = formData.get("context") as string;
        if (contextVal) context = contextVal;
    }

    if (!prompt) {
        return json({ error: "Prompt is required" }, { status: 400 });
    }

    try {
        // 3. Call the Gemini Utility
        const aiResponse = await generatePhoenixContent(prompt, context);

        // 4. Return the result to the frontend
        return json({ success: true, content: aiResponse });
    } catch (error) {
        return json({ success: false, error: "AI Generation Failed" }, { status: 500 });
    }
};
