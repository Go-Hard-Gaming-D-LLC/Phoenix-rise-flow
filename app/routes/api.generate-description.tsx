import { json, type ActionFunctionArgs } from "@remix-run/node";
import shopify from "../shopify.server";
import { generateAIContent } from "./api.phoenix";
import { getUserTier } from "../utils/tierConfig";

export const action = async ({ request }: ActionFunctionArgs) => {
    // 1. Authenticate with Shopify
    const { admin, session } = await shopify.authenticate.admin(request);

    // 2. Parse form data
    const formData = await request.formData();
    const productName = formData.get("productName") as string;
    const features = formData.get("features") as string;

    if (!productName) {
        return json({ error: "Product name is required" }, { status: 400 });
    }

    // Get User Tier for Rate Limiting
    const userTier = await getUserTier(session.shop);

    try {
        // 3. Call the Gemini content generator via Phoenix Engine
        const result = await generateAIContent({
            contentType: "product_ad",
            productDetails: `${productName}: ${features}`,
            targetAudience: "General Shoppers",
            shop: session.shop,
            userTier
        });

        // 4. Return the result to the frontend
        return json(result);

    } catch (error: any) {
        console.error("AI Error:", error.message);
        return json({
            success: false,
            error: "AI generation failed"
        }, { status: 500 });
    }
};