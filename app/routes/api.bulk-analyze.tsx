import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { authenticate } from "../shopify.server";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface AnalysisResult {
  productId: string;
  currentTitle: string;
  suggestedTitle: string;
  currentDescription: string;
  suggestedDescription: string;
  suggestedTags?: string;
  metaTitle: string;
  metaDescription: string;
  altTextSuggestions: string[];
  keywords: string[];
  accessibilityScore: number;
  seoScore: number;
  flaggedIssues: string[];
  ready: boolean;
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
      const body = JSON.parse(bodyText);
      products = body.products;
      context = body.context || "";
      mode = body.mode || "analyze";
    } catch (e) {
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
          return json({ success: false, error: "Failed to fetch products", scannedIds: [] });
        }

        const rawProducts = responseJson.data.products.edges.map((edge: any) => edge.node);

        const scoredProducts = rawProducts.map((p: any) => {
          let urgency = 0;
          const reasons = [];

          if (!p.descriptionHtml || p.descriptionHtml.length < 50) {
            urgency += 40;
            reasons.push("Critical: Description Missing/Short");
          }
          const missingAlt = p.media?.nodes?.some((m: any) => !m.alt);
          if (missingAlt) {
            urgency += 30;
            reasons.push("Accessibility: Missing Alt Text");
          }
          if (p.title.match(/copy|untitled|test/i)) {
            urgency += 20;
            reasons.push("SEO: Generic Title");
          }

          return { id: p.id, title: p.title, urgency, reasons };
        });

        scoredProducts.sort((a: any, b: any) => b.urgency - a.urgency);
        const worstOffenders = scoredProducts.slice(0, 15);
        const productIds = worstOffenders.map((p: any) => p.id.split("/").pop());

        const scannedResults = worstOffenders.map((p: any) => ({
          id: p.id.split("/").pop(),
          title: p.title,
          urgency: p.urgency,
          reasons: p.reasons || []
        }));

        return json({
          success: true,
          analyzed: 0,
          ready: 0,
          flaggedForReview: 0,
          results: [],
          scannedIds: productIds,
          scannedResults
        });
      } catch (err) {
        return json({ success: false, error: "Scan failed: " + err, scannedIds: [] });
      }
    }

    if (!Array.isArray(products) || products.length === 0) {
      return json({ error: "No products provided" }, { status: 400 });
    }

    if (products.length > 20) {
      return json({ error: "Bulk limit exceeded: Maximum 20 products allowed per run." }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const results: AnalysisResult[] = [];

    for (const product of products) {
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
SYSTEM ROLE: PHOENIX FLOW EXECUTIVE ENGINE.

YOUR MISSION: Analyze this product for SEO (Title, Description) AND Accessibility (Alt Text).

COMMANDS:
1. TITLE/DESC: Generate a sales-optimized H1 Title and HTML Description.
2. VISUALS: Analyze the image and provide SEO Alt Text.
3. TAGS: Suggest up to 13 optimized tags for Etsy/Shopify.

BRAND SAFETY PROTOCOL: Conservative, Professional, Family-Friendly. No "woke" terms.

OUTPUT JSON STRUCTURE (Strict):
{
  "analysis": {
    "suggestedTitle": "...",
    "suggestedDescription": "...",
    "suggestedTags": "tag1, tag2",
    "metaTitle": "...",
    "metaDescription": "...",
    "altTextSuggestions": ["..."],
    "flaggedIssues": [],
    "seoScore": 85,
    "accessibilityScore": 90
  }
}

Product Data:
- Title: ${product.title}
- Description: ${product.descriptionHtml || ""}
- Context: ${context || "None"}
      `.trim();

      try {
        const contentParts: any[] = [prompt];
        if (imagePart) contentParts.push(imagePart);

        const geminiResult = await model.generateContent(contentParts);
        const response = await geminiResult.response;
        const analysisText = response.text();
        const analysisData = JSON.parse(analysisText);

        // Safety Fallback if analysisData is not structured correctly
        const analysis = analysisData.analysis || analysisData;

        const hasFlags = analysis.flaggedIssues?.length > 0;

        let cleanTitle = analysis.suggestedTitle || product.title;
        cleanTitle = cleanTitle.replace(/[^\w\s-]/gi, '').substring(0, 140);

        let plainDescription = analysis.suggestedDescription || product.description;
        if (plainDescription && /<[^>]+>/g.test(plainDescription)) {
          plainDescription = plainDescription
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '');
        }

        const tagString = analysis.suggestedTags || "";

        const result: AnalysisResult = {
          ...analysis,
          suggestedTitle: cleanTitle,
          suggestedDescription: plainDescription,
          suggestedTags: tagString,
          ready: !hasFlags && (!analysis.flaggedIssues || analysis.flaggedIssues.length === 0),
        };

        results.push(result);
      } catch (error: any) {
        console.error(`Error analyzing product ${product.title}:`, error);
      }
    }

    if (mode === "apply") {
      const applicableResults = results.filter((r) => r.ready && !r.flaggedIssues?.length);

      for (const result of applicableResults) {
        try {
          await admin.graphql(
            `#graphql
            mutation UpdateProduct($input: ProductInput!) {
              productUpdate(input: $input) {
                product { id }
              }
            }`,
            {
              variables: {
                input: {
                  id: result.productId,
                  title: result.suggestedTitle,
                  tags: result.suggestedTags ? result.suggestedTags.split(",").map((t: string) => t.trim()) : undefined,
                  descriptionHtml: result.suggestedDescription
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
