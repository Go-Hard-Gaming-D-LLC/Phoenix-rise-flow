import { json, type ActionFunctionArgs } from "@remix-run/node";
import shopify from "../shopify.server";
import db from "../db.server";
import { generateAIContent } from "../gemini.server";
import { getUserTier } from "../utils/tierConfig";

export const action = async ({ request }: ActionFunctionArgs) => {
    // 1. Authenticate with Shopify
    const { admin, session } = await shopify.authenticate.admin(request);

    // 2. Parse form data
    const formData = await request.formData();
    const productName = formData.get("productName") as string;
    const features = formData.get("features") as string;
    const userContext = formData.get("context") as string; // Optional user-provided context

    if (!productName) {
        return json({ error: "Product name is required" }, { status: 400 });
    }

    // 3. Fetch Full Business Context from Database
    const config = await db.configuration.findUnique({
        where: { shop: session.shop }
    });

    // 4. Get User Tier for Rate Limiting
    const userTier = await getUserTier(session.shop);

    try {
        // 5. Call the Elite Phoenix Engine with Full Context 
        const result = await generateAIContent({
            contentType: "product_description",
            productDetails: `PRODUCT: ${productName}. FEATURES: ${features}. USER STRATEGY: ${userContext || 'none'}`,
            brandContext: config?.brandName || "your brand",
            identitySummary: config?.identitySummary || undefined,
            targetAudience: config?.targetAudience || "your ideal customer",
            usp: config?.usp || undefined,
            shop: session.shop,
            userTier
        });

        // 6. Return the result to the frontend
        return json(result);

    } catch (error: any) {
        console.error("AI Error:", error.message);
        return json({
            success: false,
            error: "AI generation failed"
        }, { status: 500 });
    }
};