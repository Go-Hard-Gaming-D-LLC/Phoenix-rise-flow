/**
 * 🛡️ SHADOW'S FORGE: CORE LOGIC GATE
 * WARNING: DO NOT MODIFY THIS FILE WITHOUT EXPLICIT PERMISSION.
 * This file governs the clinical PHOENIX FLOW EXECUTIVE ENGINE (CONTENT BURST).
 * Authorized Deployment: ironphoenixflow.com
 */
import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { authenticate } from "../shopify.server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getPrisma } from "../db.server";
import { getUserTier } from "../utils/tierConfig";
import { canPerformAction, recordUsage } from "../utils/usageTracker";

export const action = async ({ request, context }: ActionFunctionArgs) => {
  // 1. AUTH & SECRETS: Verify the Shopify Admin session
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const db = getPrisma(context);

  // ✅ CLINICAL FIX: Resolve Key directly from Edge Context to avoid Error 2339
  const apiKey = context.cloudflare.env.GEMINI_API_KEY;
  if (!apiKey) {
    return json({ 
      error: "❌ SHADOW'S FORGE: Missing GEMINI_API_KEY in Cloudflare Secrets." 
    }, { status: 500 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  // 2. USAGE VERIFICATION: Checks tier-based limits before AI ignition
  const userTier = await getUserTier(context, shop);
  const allowed = await canPerformAction(context, shop, userTier, "description");
  if (!allowed.allowed) {
    return json({ error: allowed.reason || "Monthly limit reached" }, { status: 403 });
  }

  try {
    // 3. FETCH: Strictly limited to 5 products for Edge stability
    const response = await admin.graphql(
      `#graphql
      query fetchBatch {
        products(first: 5, query: "-tag:content-locked") {
          edges {
            node {
              id
              title
              descriptionHtml
              handle
            }
          }
        }
      }`
    );

    const responseJson: any = await response.json();
    const products = responseJson.data?.products?.edges?.map((e: any) => e.node) || [];

    if (products.length === 0) {
      return json({ status: "IDLE", message: "No unoptimized products found." });
    }

    const report: any[] = [];

    // 4. SEQUENTIAL BURST: Parallel execution on small 5-item set
    await Promise.all(products.map(async (product: any) => {
      const productStringId = String(product.id);

      const prompt = `
        Analyze this Shopify Product:
        Title: ${product.title}
        Desc: ${product.descriptionHtml}

        Task: Generate an Optimized H1 Title and a Persuasive Description(HTML).
        Constraints:
        1. Title: User-focused, descriptive, clean.
        2. Description: 2 sentences max, sales-driven.
        3. Output JSON: { "title": "...", "descriptionHtml": "..." }
        `;

      try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        // Sanitization of JSON output
        const cleanJson = text.replace(/```json\n?|```/g, "").trim();
        const aiData = JSON.parse(cleanJson);

        // 5. UPDATE SHOPIFY: Writing Optimized Content
        await admin.graphql(
          `#graphql
          mutation productUpdate($input: ProductInput!) {
            productUpdate(input: $input) {
              product { id }
            }
          }`,
          {
            variables: {
              input: {
                id: productStringId,
                title: String(aiData.title),
                descriptionHtml: String(aiData.descriptionHtml)
              }
            }
          }
        );

        // 6. LOCK: Tagging to prevent re-optimization
        await admin.graphql(
          `#graphql
          mutation addTags($id: ID!, $tags: [String!]!) {
            tagsAdd(id: $id, tags: $tags) {
              node { id }
            }
          }`,
          {
            variables: {
              id: productStringId,
              tags: ["content-locked"]
            }
          }
        );

        report.push({ id: productStringId, status: "OPTIMIZED", title: aiData.title });

      } catch (e) {
        console.error(`Failed ID ${productStringId}: `, e);
        report.push({ id: productStringId, status: "FAILED" });
      }
    }));

    // 7. TELEMETRY: Recording action in usage tracker
    await recordUsage(context, shop, "description", { type: "executive_burst" });

    return json({
      mode: "scan",
      count: products.length,
      report
    });

  } catch (error) {
    console.error("Content Burst Error:", error);
    return json({ error: "Batch failed" }, { status: 500 });
  }
};