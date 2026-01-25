import { json, type ActionFunctionArgs } from "@remix-run/node";
import { GoogleGenerativeAI } from "@google/generative-ai";
import shopify from "../shopify.server";
import db from "../db.server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { session, admin } = await shopify.authenticate.admin(request);
    const body = await request.json();
    const { products, mode } = body;

    // --- SECURITY BLOCKADE: CHECK LIFETIME USAGE ---
    // This prevents "Amazon-style" free-tier rotation hacks.
    const usageCount = await db.optimizationHistory.count({
      where: { 
        shop: session.shop,
        status: "success"
      }
    });

    const FREE_TIER_LIMIT = 15; // Set your strict limit here

    // --- PHASE 1: THE EXECUTIVE TRIAGE (SCAN MODE) ---
    // We allow scanning so they can see their errors (The "Hook"), 
    // but we block the actual AI generation if they are over the limit.
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
      
      const scannedResults = rawProducts.map((p: any) => {
          let urgency = 0;
          const reasons: string[] = [];
          if (!p.descriptionHtml || p.descriptionHtml.length < 50) { urgency += 40; reasons.push("Critical: Description Missing/Short"); }
          if (p.media?.nodes?.some((m: any) => !m.alt)) { urgency += 30; reasons.push("Accessibility: Missing Alt Text"); }
          
          return {
            id: String(p.id),
            title: String(p.title),
            urgency,
            reasons
          };
        })
        .sort((a: any, b: any) => b.urgency - a.urgency)
        .slice(0, 15);
      
      return json({ 
        success: true, 
        scannedResults,
        remainingCredits: Math.max(0, FREE_TIER_LIMIT - usageCount) 
      });
    }

    // --- PHASE 2: THE EXECUTIVE BURST (ANALYZE MODE) ---
    // HARD BLOCKADE: Stop the AI if they've exhausted their lifetime free credits.
    if (usageCount >= FREE_TIER_LIMIT) {
      return json({ 
        error: "LIMIT_REACHED", 
        message: "Lifetime free credits exhausted. Please upgrade to Phoenix Tier to continue." 
      }, { status: 403 });
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return json({ error: "Products required" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const results = [];
    
    for (const product of products) {
      const startTime = Date.now();
      try {
        const prompt = `[STRICT ACTION MODE] PRODUCT: ${product.title}. TASK: Generate optimized_description, alt_text, and canva_image_prompt. OUTPUT: JSON ONLY.`;
        
        const geminiResult = await model.generateContent(prompt);
        let analysisText = geminiResult.response.text().replace(/```json\n?|```/g, "").trim();
        
        const analysisData = JSON.parse(analysisText);

        // PERSISTENCE: Record the hit immediately
        await db.optimizationHistory.create({
          data: {
            shop: session.shop,
            productId: String(product.id),
            productName: product.title,
            optimizationType: "bulk_analysis",
            optimizedContent: JSON.stringify(analysisData),
            status: "success",
            processingTimeMs: Date.now() - startTime
          }
        });
        
        results.push({ productId: String(product.id), ...analysisData });
        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit buffer
        
      } catch (e: any) {
        await db.optimizationHistory.create({
          data: {
            shop: session.shop,
            productId: String(product.id),
            productName: product.title,
            optimizationType: "bulk_analysis",
            optimizedContent: "{}",
            status: "failed",
            errorMessage: e.message
          }
        });
      }
    }
    
    return json({ success: true, results });
    
  } catch (error: any) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
};