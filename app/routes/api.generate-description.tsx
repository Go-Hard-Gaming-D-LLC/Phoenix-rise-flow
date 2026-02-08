/**
 * 🛡️ SHADOW'S FORGE: CORE LOGIC GATE
 * WARNING: DO NOT MODIFY WITHOUT EXPLICIT PERMISSION.
 * ROLE: Creative Batch Description Engine (Execution Only).
 * LIMIT: 5 Products per Burst.
 */
import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
import shopify from "../shopify.server";
import { getPrisma } from "../db.server";
import { generateAIContent } from "../gemini.server";
import { getUserTier } from "../utils/tierConfig";
import { canPerformAction, recordUsage } from "../utils/usageTracker";

// ✅ CLINICAL FIX: Interface definition for batch creative requests
interface DescriptionBatchPayload {
    products: Array<{ id: string; title: string; features?: string }>;
    userContext?: string;
}

export const action = async ({ request, context }: ActionFunctionArgs) => {
    // 1. AUTH & SECRETS: Verify Shopify session
    const { session } = await shopify.authenticate.admin(request);
    const db = getPrisma(context);

    // ✅ CLINICAL FIX: Pull Key from Edge Context to clear Error 2339
    const apiKey = context.cloudflare.env.GEMINI_API_KEY;
    if (!apiKey) return json({ error: "❌ Missing GEMINI_API_KEY." }, { status: 500 });

    // 2. DATA ACQUISITION: Parse payload and enforce safety limits
    const body = (await request.json()) as DescriptionBatchPayload;
    const { products, userContext } = body;

    if (!products || !Array.isArray(products)) {
        return json({ error: "Product array is required" }, { status: 400 });
    }

    // Safety clamp to the agreed 5-item burst limit
    const safeBatch = products.slice(0, 5);

    // 3. TIER & CONTEXT: Fetch merchant settings and check limits
    const config = await db.configuration.findUnique({ where: { shop: session.shop } });
    const userTier = await getUserTier(context, session.shop);
    const allowed = await canPerformAction(context, session.shop, userTier, 'description');
    
    if (!allowed.allowed) {
        return json({ error: allowed.reason || "Monthly limit reached" }, { status: 403 });
    }

    try {
        // 4. BATCH EXECUTION: Sequential generation for Edge stability
        const results = [];
        for (const product of safeBatch) {
            const result = await generateAIContent({
                contentType: "product_description",
                productDetails: `PRODUCT: ${product.title}. FEATURES: ${product.features || 'none'}. USER STRATEGY: ${userContext || 'none'}`,
                brandContext: config?.brandName || "your brand",
                identitySummary: config?.identitySummary || undefined,
                targetAudience: config?.targetAudience || "your ideal customer",
                usp: config?.usp || undefined,
                shop: session.shop,
                userTier,
                apiKey
            });

            results.push({
                productId: product.id,
                title: product.title,
                content: result.content || "Generation failed."
            });

            await recordUsage(context, session.shop, 'description', { productName: product.title });
        }

        return json({ success: true, results });

    } catch (error: any) {
        console.error("[SHADOW_FORGE] Description Engine Error:", error.message);
        return json({ success: false, error: "AI generation failed." }, { status: 500 });
    }
};