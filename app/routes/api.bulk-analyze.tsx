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
    const { products, context = "", mode = "analyze" } = await request.json();

    // MODE: SCAN (Auto-Load Products)
    if (mode === "scan") {
      const response = await admin.graphql(
        `#graphql
        query GetProducts {
          products(first: 10, sortKey: CREATED_AT, reverse: true) {
            edges {
              node {
                id
              }
            }
          }
        }`
      );
      const responseJson = await response.json();
      const productIds = responseJson.data.products.edges.map((edge: any) => edge.node.id.split("/").pop());

      return json({
        success: true,
        analyzed: 0,
        ready: 0,
        flaggedForReview: 0,
        results: [],
        scannedIds: productIds
      });
    }

    if (!Array.isArray(products) || products.length === 0) {
      return json({ error: "No products provided" }, { status: 400 });
    }

    // ENFORCE LIMIT: Max 10 products per bulk run
    if (products.length > 10) {
      return json({ error: "Bulk limit exceeded: Maximum 10 products allowed per run." }, { status: 400 });
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
User Context: Developer has severe cognitive/memory load issues. Do not require manual data entry.
PRIMARY DIRECTIVE: Automate Image SEO and Accessibility via Shopify API.
EXECUTION PROTOCOL:
1. IMAGE VISION: Identify the subject, color, and context (e.g., "Men's blue hiking boot on a trail").
2. ALT TEXT INJECTION: Apply a 125-character "Answer-First" alt tag.
   Format: "[Product Name] - [Action/Context] - [Key Feature]."
3. COMPLIANCE: Ensure the alt text matches the Triple Crown (aligns with product title and context).

Product Data:
- Title: ${product.title}
- Context/Trend: ${context || "None"}

Rules:
1. NEVER change core product meaning.
2. Be concise. NO LECTURES.
3. If no image is provided, base it on the Title.

Return analysis in JSON format with scores 0-100 and flagged issues list.
      `.trim();

      try {
        // Send imagePart if we successfully fetched it
        const contentParts: any[] = [prompt];
        if (imagePart) contentParts.push(imagePart);

        const result = await model.generateContent(contentParts);
        const response = await result.response;
        // Fix: result.response.text() is a function call
        const analysisText = response.text();
        const analysisData = JSON.parse(analysisText);

        // Determine if changes are safe to auto-apply
        const hasFlags = analysisData.analysis.flaggedIssues?.length > 0;
        const titleChanged = analysisData.analysis.suggestedTitle !== product.title;
        const descriptionChanged = analysisData.analysis.suggestedDescription !== product.description;
        // Check if Alt text suggestions are new
        const newAlt = analysisData.analysis.altTextSuggestions && analysisData.analysis.altTextSuggestions.length > 0;

        const result: AnalysisResult = {
          ...analysisData.analysis,
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
