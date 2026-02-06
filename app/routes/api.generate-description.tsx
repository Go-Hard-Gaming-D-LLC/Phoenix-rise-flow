import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
import shopify from "../shopify.server";
import { getPrisma } from "../db.server";
import { generateAIContent } from "../gemini.server";
import { getUserTier } from "../utils/tierConfig";
import { resolveGeminiApiKey } from "../utils/env.server";
import { canPerformAction, recordUsage } from "../utils/usageTracker";

export const action = async ({ request, context }: ActionFunctionArgs) => {
    // 1. Authenticate with Shopify
    const { admin, session } = await shopify.authenticate.admin(request);
    const db = getPrisma(context);

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
    const userTier = await getUserTier(context, session.shop);
    const allowed = await canPerformAction(context, session.shop, userTier, 'description');
    if (!allowed.allowed) {
        return json({ error: allowed.reason || "Monthly limit reached" }, { status: 403 });
    }

    const apiKey = resolveGeminiApiKey(context, config?.geminiApiKey || undefined);

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
            userTier,
            apiKey
        });

        await recordUsage(context, session.shop, 'description', { productName });

        return json(result);

    } catch (error: any) {
        console.error("AI Error:", error.message);
        return json({
            success: false,
            error: "AI generation failed. Check your Gemini API quota and Cloudflare logs."
        }, { status: 500 });
    }
};
