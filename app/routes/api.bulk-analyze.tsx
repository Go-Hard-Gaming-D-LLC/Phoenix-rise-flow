import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { authenticate } from "../shopify.server";
// IMPORT THE FUNCTIONS THAT ACTUALLY EXIST
import { analyzeProductData, generateJSONLD } from "../gemini.server";
import { sendDeveloperAlert } from "../utils/developerAlert"; // Developer Alert Import
import { getUserTier, canAccessFeature, hasReachedLimit } from "../utils/tierConfig"; // Tier Logic
import db from "../db.server";

export const action = async ({ request, context }: ActionFunctionArgs) => {
    const { admin, session } = await authenticate.admin(request);
    const env = (context as any).cloudflare?.env || (context as any).env || process.env;
    const apiKey = env.GEMINI_API_KEY;

    const formData = await request.formData();
    const mode = formData.get("mode");

    // --- MODE 1: SCAN (The Triage) ---
    if (mode === "scan") {
        const response = await admin.graphql(`
      query { products(first: 5, reverse: true) { edges { node { id title bodyHtml variants(first: 1) { edges { node { price } } } } } } }
    `);
        const data = await response.json();
        return json({ products: data.data.products.edges.map((e: any) => e.node) });
    }

    // --- MODE 2: ANALYZE (Using analyzeProductData) ---
    if (mode === "analyze") {
        const productJson = formData.get("productJson"); // Pass the raw product data
        const shop = session.shop;

        // 1. Get Tier & Check Feature Access
        const userTier = await getUserTier(shop);
        if (!canAccessFeature(userTier, 'bulk_analyzer')) {
            return json({ error: "Please upgrade to Starter to use Bulk Analyzer" }, { status: 403 });
        }

        // 2. Check Monthly Limits
        const firstOfOfMonth = new Date();
        firstOfOfMonth.setDate(1);
        firstOfOfMonth.setHours(0, 0, 0, 0);

        // WARNING: db.server.ts must be configured with a Cloudflare-compatible driver (e.g. Prisma Accelerate or D1)
        // for this to work in production on Cloudflare Workers.
        const currentUsage = await db.optimizationHistory.count({
            where: { shop, createdAt: { gte: firstOfOfMonth } }
        });

        if (hasReachedLimit(userTier, 'descriptionsPerMonth', currentUsage)) {
            await sendDeveloperAlert('LIMIT_REACHED', `Shop ${shop} limit hit: ${currentUsage} / ${userTier}`);
            return json({ error: "Monthly limit reached" }, { status: 403 });
        }

        // Calling the function that exists in your gemini.server.ts
        const analysis = await analyzeProductData(JSON.parse(productJson as string));

        // Also generate the Schema Shield (JSON-LD) to fix GMC flags
        const schema = await generateJSONLD(analysis.optimized_title, "19.99", "USD", apiKey);

        return json({ analysis, schema });
    }

    return json({ error: "Invalid Mode" }, { status: 400 });
};