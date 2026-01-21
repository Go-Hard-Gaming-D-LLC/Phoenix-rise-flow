import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
// Fix: Use the stable SDK consistent with gemini.server.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { authenticate } from "../shopify.server";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Note: Schema definition for gemini-1.5-flash with structured output

interface AnalysisResult {
  productId: string;
  currentTitle: string;
  suggestedTitle: string;
  currentDescription: string;
  suggestedDescription: string;
  metaTitle: string;
  metaDescription: string;
  altTextSuggestions: string[];
  keywords: string[];
  accessibilityScore: number;
  seoScore: number;
  flaggedIssues: string[];
  ready: boolean; // true if safe to auto-apply, false if needs review
}

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { admin } = await authenticate.admin(request);

    let products, context, mode;
    try {
      const bodyText = await request.text();
      // Try parsing as JSON first
      const body = JSON.parse(bodyText);
      products = body.products;
      context = body.context || "";
      mode = body.mode || "analyze";
    } catch (e) {
      // Fallback: If JSON parse fails, maybe it's empty or malformed, default to empty
      console.warn("Failed to parse request body as JSON", e);
      products = [];
      mode = "analyze";
    }

    // MODE: SCAN (Auto-Load Products)
    if (mode === "scan") {
      try {
        // SMART SCAN: Fetch 50, triage locally, return top 15 worst offenders
        const response = await admin.graphql(
          `#graphql
          query GetProducts {
            products(first: 50, sortKey: UPDATED_AT, reverse: true) {
              edges {
                node {
                  id
                  title
                  descriptionHtml
                  media(first: 5) {
                    nodes {
                      alt
                    }
                  }
                }
              }
            }
          }`
        );
        const responseJson = await response.json();

        if (!responseJson.data?.products?.edges) {
          console.error("Scan Error: Invalid GraphQL response", JSON.stringify(responseJson));
          return json({ success: false, error: "Failed to fetch products from Shopify", scannedIds: [] });
        }

        const rawProducts = responseJson.data.products.edges.map((edge: any) => edge.node);

        // HEURISTIC SCORING (The "Triage" Layer)
        const scoredProducts = rawProducts.map((p: any) => {
          let urgency = 0;
          const reasons = [];

          // 1. Missing Description?
          if (!p.descriptionHtml || p.descriptionHtml.length < 50) {
            urgency += 40;
            reasons.push("Critical: Description Missing/Short");
          }
          // 2. Missing Alt Text?
          const missingAlt = p.media?.nodes?.some((m: any) => !m.alt);
          if (missingAlt) {
            urgency += 30;
            reasons.push("Accessibility: Missing Alt Text");
          }
          // 3. Generic/Bad Title?
          if (p.title.match(/copy|untitled|test/i)) {
            urgency += 20;
            reasons.push("SEO: Generic Title");
          }

          return { id: p.id, title: p.title, urgency, reasons };
        });

        // Sort by urgency (Highest first) and take top 15
        scoredProducts.sort((a: any, b: any) => b.urgency - a.urgency);
        const worstOffenders = scoredProducts.slice(0, 15);

        const productIds = worstOffenders.map((p: any) => p.id.split("/").pop());

        // Prepare detailed results for the frontend to display WHY they were picked
        const scannedResults = worstOffenders.map((p: any) => {
          const reasons = [];
          if (p.urgency >= 40) reasons.push("Missing Description");
          if (p.urgency >= 30 && p.urgency < 40) reasons.push("Missing Alt Text");
          if (p.urgency >= 20 && p.urgency < 30) reasons.push("Generic Title");

          // Ensure we catch overlaps if urgency is sum (Wait, current logic is strict if-else for urgency sum? No, need to refine)
          // Re-evaluating reasons based on original props would be cleaner but let's stick to the heuristic. 
          // Better: Add reasons during scoring.
          return {
            id: p.id.split("/").pop(),
            title: p.title,
            urgency: p.urgency,
            reasons: p.reasons || []
          };
        });

        console.log(`Smart Scan complete. Filtered 50 -> Top ${productIds.length} worst offenders.`);

        return json({
          success: true,
          analyzed: 0,
          ready: 0,
          flaggedForReview: 0,
          results: [],
          scannedIds: productIds,
          scannedResults // Pass full metadata
        });
      } catch (err) {
        console.error("Scan Exception:", err);
        return json({ success: false, error: "Scan failed: " + err, scannedIds: [] });
      }
    }

    if (!Array.isArray(products) || products.length === 0) {
      return json({ error: "No products provided" }, { status: 400 });
    }

    // ENFORCE LIMIT: Max 20 products per run (Safety Buffer)
    if (products.length > 20) {
      return json({ error: "Bulk limit exceeded: Maximum 20 products allowed per run." }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Using the cost-effective Gemini 1.5 Flash model
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      // We are relying on the prompt to enforce JSON structure for maximum compatibility 
      // across different SDK versions.
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const results: AnalysisResult[] = [];

    // Analyze each product
    for (const product of products) {
      // 1. Fetch the main image if it exists
      let imagePart = null;
      if (product.images && product.images.length > 0 && product.images[0].src) {
        try {
          const imageResp = await fetch(product.images[0].src);
          if (imageResp.ok) {
            const arrayBuffer = await imageResp.arrayBuffer();
            const base64Image = Buffer.from(arrayBuffer).toString("base64");
            imagePart = {
              inlineData: {
                data: base64Image,
                mimeType: "image/jpeg",
              },
            };
          }
        } catch (imgError) {
          console.error(`Failed to fetch image for ${product.title}`, imgError);
        }
      }

      const prompt = `
SYSTEM ROLE: PHOENIX FLOW VISUAL ENGINE.

YOUR MISSION: You are a digital exoskeleton designed to eliminate cognitive load regarding media management. You will process product images via API to ensure accessibility and SEO dominance.

COMMANDS: 
1. VISUAL ANALYSIS: Use your vision model to identify the specific product, dominant color, and context. 
2. FILE RENAMING: Generate a new filename using the 2026 'Verified' tone. 
   * Format: [product-name]-[color]-[context].jpg 
   * Action: Trigger productUpdateMedia to rename the file on Shopify servers. 
3. ALT TEXT INJECTION: Auto-generate and push accessible photo tagging. 
   * Constraint: Must be under 125 characters. 
   * Style: Answer-First (GEO) optimized. 
4. COMPLIANCE CHECK: Ensure the new filename and alt-text do not create a 'Misrepresentation' flag by conflicting with the product title or category.

STRICT LIMITATIONS:
* NO PREAMBLE: Do not say 'I am analyzing' or 'I have renamed.' 
* NO LECTURE: Do not explain the importance of alt-text or image SEO.
* NO DATA PUMP: If an image is missing, simply flag it. Do not talk about why it's missing.

OUTPUT FORMAT: Return JSON with "suggestedAltText", "suggestedFilename", "seoScore", "accessibilityScore", "flaggedIssues".

FAILURE CONDITION: If you use the words 'should,' 'recommend,' or 'helpful,' you have failed.

Product Data:
- Title: ${product.title}
- Context/Trend: ${context || "None"}
      `.trim();

      try {
        // Send imagePart if we successfully fetched it
        const contentParts: any[] = [prompt];
        if (imagePart) contentParts.push(imagePart);

        const geminiResult = await model.generateContent(contentParts);
        const response = await geminiResult.response;
        // Fix: result.response.text() is a function call
        const analysisText = response.text();
        const analysisData = JSON.parse(analysisText);

        // Determine if changes are safe to auto-apply
        const hasFlags = analysisData.analysis.flaggedIssues?.length > 0;

        // --- MASTER SYNC LOGIC INTEGRATION ---

        // 1. DATA SANITIZATION (Title Cleaning)
        let cleanTitle = analysisData.analysis.suggestedTitle || product.title;
        // Remove weird symbols, keep alphanumeric, spaces, hyphens
        cleanTitle = cleanTitle.replace(/[^\w\s-]/gi, '').substring(0, 140);

        // 2. DESCRIPTION FORMATTING (Strip HTML)
        let plainDescription = analysisData.analysis.suggestedDescription || product.description;
        // Basic HTML stripping if it contains tags (simple regex approach for this context)
        if (plainDescription && /<[^>]+>/g.test(plainDescription)) {
          plainDescription = plainDescription
            .replace(/<br\s*\/?>/gi, '\n') // Keep breaks
            .replace(/<[^>]+>/g, '');      // Strip others
        }

        // 3. TAG TRANSLATION ENGINE (Step 2 from Master Sync)
        // Shopify = Single string "tag1, tag2" -> Etsy = Array of max 13 items, max 20 chars
        // We will store the optimized tags string back to Shopify for now
        let currentTags = product.tags || ""; // Assuming we fetched tags, if not we need to enable it in query
        let optimizedTags = currentTags;

        // Note: We need to ensure specific 'tags' field is fetched in GraphQL query first.
        // For now, assuming standard behavior, but if tags are missing, we skip this.

        const titleChanged = cleanTitle !== product.title;
        const descriptionChanged = plainDescription !== product.description;
        const newAlt = analysisData.analysis.altTextSuggestions && analysisData.analysis.altTextSuggestions.length > 0;

        const result: AnalysisResult = {
          ...analysisData.analysis,
          suggestedTitle: cleanTitle, // Force cleaned title
          suggestedDescription: plainDescription, // Force cleaned description
          ready: !hasFlags && (titleChanged || descriptionChanged || newAlt),
        };

        results.push(result);
      } catch (error: any) {
        if (error.status === 429 || error.message?.includes("429") || error.message?.includes("Quota exceeded")) {
          console.error("Gemini Rate Limit Hit:", error);
          throw new Error("Phoenix AI usage limit reached. Please try again in a moment.");
        }
        console.error(`Error analyzing product ${product.title}:`, error);
      }
    }

    // If mode is "apply" and all are ready, apply changes
    if (mode === "apply") {
      const applicableResults = results.filter((r) => r.ready && !r.flaggedIssues?.length);

      for (const result of applicableResults) {
        try {
          await admin.graphql(
            `#graphql
            mutation UpdateProduct($input: ProductInput!) {
              productUpdate(input: $input) {
                product {
                  id
                  title
                }
              }
            }`,
            {
              variables: {
                input: {
                  id: result.productId,
                  title: result.suggestedTitle,
                  metafields: [
                    {
                      namespace: "custom",
                      key: "seo_description",
                      value: result.metaDescription,
                      type: "single_line_text_field",
                    },
                  ],
                },
              },
            }
          );
        } catch (error) {
          console.error(`Failed to update product ${result.productId}:`, error);
        }
      }
    }

    return json({
      success: true,
      analyzed: results.length,
      ready: results.filter((r) => r.ready).length,
      flaggedForReview: results.filter((r) => !r.ready).length,
      results,
    });
  } catch (error) {
    console.error("Bulk analysis error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
};
