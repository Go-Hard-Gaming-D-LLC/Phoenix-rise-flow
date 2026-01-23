import type { ActionFunctionArgs } from "@remix-run/node";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { authenticate } from "../shopify.server";

// Initialize Gemini with your API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const { admin } = await authenticate.admin(request);
    const body = await request.json();
    const { products, context, mode } = body;

    // --- PHASE 1: THE EXECUTIVE TRIAGE (SCAN MODE) ---
    if (mode === "scan") {
      const response = await admin.graphql(
        `#graphql
        query GetProducts {
          products(first: 50, sortKey: UPDATED_AT, reverse: true) {
            edges {
              node {
                id
                title
                descriptionHtml
                media(first: 5) { nodes { alt } }
              }
            }
          }
        }`
      );
      const responseJson = await response.json();
      const rawProducts = responseJson.data.products.edges.map((edge: any) => edge.node);

      const scoredProducts = rawProducts.map((p: any) => {
        let urgency = 0;
        const reasons = [];

        if (!p.descriptionHtml || p.descriptionHtml.length < 50) {
          urgency += 40;
          reasons.push("Critical: Description Missing/Short");
        }
        if (p.media?.nodes?.some((m: any) => !m.alt)) {
          urgency += 30;
          reasons.push("Accessibility: Missing Alt Text");
        }

        return { 
          id: String(p.id), // FIX ERROR 2322: Force String
          title: String(p.title), 
          urgency, 
          reasons 
        };
      });

      // Return the top 15 "Worst Offenders"
      const scannedResults = scoredProducts
        .sort((a: any, b: any) => b.urgency - a.urgency)
        .slice(0, 15);

      return Response.json({ success: true, scannedResults });
    }

    // --- PHASE 2: THE EXECUTIVE BURST (ANALYZE MODE) ---
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const results = [];
    for (const product of products) {
      const prompt = `
        SYSTEM ROLE: PHOENIX FLOW EXECUTIVE ENGINE.
        TASK: Analyze ${product.title} for SEO and Accessibility.
        CONSTRAINT: Output JSON strictly matching the internal schema. No conversation.
      `;

      const geminiResult = await model.generateContent(prompt);
      const analysisData = JSON.parse(geminiResult.response.text());

      results.push({
        productId: String(product.id), // FIX ERROR 2322
        ...analysisData
      });
    }

    return Response.json({ success: true, results });

  } catch (error: any) {
    console.error("Phoenix Engine Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};