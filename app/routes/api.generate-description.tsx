import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { GoogleGenerativeAI } from "@google/generative-ai";
import shopify from "../shopify.server";
import db from "../db.server";
import { generateAIContent } from "../gemini.server";
import { getUserTier } from "../utils/tierConfig";

export const action = async ({ request, context }: ActionFunctionArgs) => {
    // 1. Authenticate with Shopify
    const { admin, session } = await shopify.authenticate.admin(request);

    // 2. Initialize AI with Cloudflare context
    const env = (context as any).cloudflare?.env || (context as any).env || process.env;
    if (!env.GEMINI_API_KEY) {
        return json({ error: "API Key missing in environment. Ensure it is set in the Cloudflare Dashboard." }, { status: 500 });
    }

    // 3. Parse form data
    const formData = await request.formData();
    const productName = formData.get("productName") as string;
    const features = formData.get("features") as string;
    const userContext = formData.get("context") as string;

    if (!productName) {
        return json({ error: "Product name is required" }, { status: 400 });
    }

    // 4. Fetch Full Business Context from Database
    const config = await db.configuration.findUnique({
        where: { shop: session.shop }
    });

    // 5. Get User Tier for Rate Limiting
    const userTier = await getUserTier(session.shop);

    try {
        // 6. Call the Elite Phoenix Engine with Full Context
        // Note: The prompt is constructed to leverage the brand and target audience context stored in Prisma
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

        return json(result);

    } catch (error: any) {
        console.error("AI Error:", error.message);
        return json({
            success: false,
            error: "AI generation failed. Check your Gemini API quota and Cloudflare logs."
        }, { status: 500 });
    }
};