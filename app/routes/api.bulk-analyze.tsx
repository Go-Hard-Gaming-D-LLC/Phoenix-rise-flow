import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
// IMPORT THE FUNCTIONS THAT ACTUALLY EXIST
import { analyzeProductData, generateJSONLD } from "../gemini.server";
import { sendDeveloperAlert } from "../utils/developerAlert"; // Developer Alert Import
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    const { admin, session } = await authenticate.admin(request);
    const formData = await request.formData();
    const mode = formData.get("mode");

    // --- MODE 1: SCAN (The Triage) ---
    if (mode === "scan") {
        const response = await admin.graphql(`
      query { products(first: 20, reverse: true) { edges { node { id title bodyHtml variants(first: 1) { edges { node { price } } } } } } }
    `);
        const data = await response.json();
        return json({ products: data.data.products.edges.map((e: any) => e.node) });
    }

    // --- MODE 2: ANALYZE (Using analyzeProductData) ---
    if (mode === "analyze") {
        const productJson = formData.get("productJson"); // Pass the raw product data
        const shop = session.shop;

        // 🛡️ Security Blockade (15-limit)
        const count = await db.optimizationHistory.count({ where: { shop } });
        if (count >= 15) {
            await sendDeveloperAlert('LIMIT_REACHED', `Shop ${shop} reached Phoenix Limit.`);
            return json({ error: "Phoenix Limit Reached" }, { status: 403 });
        }

        // Calling the function that exists in your gemini.server.ts
        const analysis = await analyzeProductData(JSON.parse(productJson as string));

        // Also generate the Schema Shield (JSON-LD) to fix GMC flags
        const schema = await generateJSONLD(analysis.optimized_title, "19.99");

        return json({ analysis, schema });
    }

    return json({ error: "Invalid Mode" }, { status: 400 });
};