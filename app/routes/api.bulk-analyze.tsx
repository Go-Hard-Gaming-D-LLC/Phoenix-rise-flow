import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { runGeminiAnalysis } from "../gemini.server"; // Your AI Brain
import db from "../db.server"; // Your Prisma database

export const action = async ({ request }: ActionFunctionArgs) => {
    const { admin, session } = await authenticate.admin(request);
    const formData = await request.formData();
    const mode = formData.get("mode"); // scan, analyze, or apply

    // --- MODE 1: SCAN (Triage) ---
    if (mode === "scan") {
        const response = await admin.graphql(`
      query { products(first: 50, reverse: true) { edges { node { id title description bodyHtml images(first: 1) { edges { node { altText } } } } } } }
    `);
        const data = await response.json();
        // Logic to find the "Worst Offenders" (Missing alt text, short descriptions, etc.)
        return json({ products: data.data.products.edges.map(e => e.node) });
    }

    // --- MODE 2: ANALYZE (Gemini Burst) ---
    if (mode === "analyze") {
        const productId = formData.get("productId");
        // 🛡️ Security Check: Verify the 15-product limit in DB
        const count = await db.optimizationHistory.count({ where: { shop: session.shop } });
        if (count >= 15) return json({ error: "Limit reached" }, { status: 403 });

        // Call your Gemini logic
        const analysis = await runGeminiAnalysis(productId);
        return json({ analysis });
    }

    // --- MODE 3: APPLY (Direct Push) ---
    if (mode === "apply") {
        const productId = formData.get("productId");
        const updateData = JSON.parse(formData.get("updateData") as string);
        // GraphQL Mutation to save directly to Shopify
        return json({ success: true });
    }

    return json({ error: "Invalid Mode" }, { status: 400 });
};