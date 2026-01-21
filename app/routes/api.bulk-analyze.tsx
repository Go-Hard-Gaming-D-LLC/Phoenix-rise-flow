import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
// Fix: Use the stable SDK consistent with gemini.server.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { authenticate } from "../shopify.server";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Note: Schema definition for gemini-1.5-flash with structured output
// The @google/generative-ai SDK handles schemas slightly differently than @google/genai
// but we will use standard JSON prompting for maximum compatibility with 1.5-flash

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { admin } = await authenticate.admin(request);
    const { products, context = "", mode = "analyze" } = await request.json();

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
      const prompt = `
Analyze this Shopify product for accessibility, SEO optimization${context ? ", and Trend Alignment" : ""}.

Strategy / Trend Context: ${context || "Standard SEO optimization"}

Product Data:
- Title: ${product.title}
- Description: ${product.description || "No description"}
- Image Count: ${product.images?.length || 0}
- Current Alt Texts: ${product.images?.map((img: any) => img.alt || "missing").join(", ") || "none"}

Rules:
1. NEVER change core product meaning or category
2. Improve clarity, SEO, and accessibility
3. If a Strategy/Trend is provided, optimize the title/description to target that niche (Gap Analysis).
4. Flag any suggested change that alters product substance
5. Preserve all pricing, type, and availability info
6. Suggest alt texts for missing images
7. Identify any factual inconsistencies or missed trend opportunities.

Return analysis in JSON format with scores 0-100 and flagged issues list.
      `.trim();

      try {
        const response = await model.generateContent(prompt);
        const analysisText = response.response.text();
        const analysisData = JSON.parse(analysisText);

        // Determine if changes are safe to auto-apply
        const hasFlags = analysisData.analysis.flaggedIssues?.length > 0;
        const titleChanged = analysisData.analysis.suggestedTitle !== product.title;
        const descriptionChanged = analysisData.analysis.suggestedDescription !== product.description;

        const result: AnalysisResult = {
          ...analysisData.analysis,
          ready: !hasFlags && (titleChanged || descriptionChanged), // Ready to apply if no flags
        };

        results.push(result);
      } catch (error: any) {
        if (error.status === 429 || error.message?.includes("429") || error.message?.includes("Quota exceeded")) {
          console.error("Gemini Rate Limit Hit:", error);
          // Stop processing and return what we have, or error out
          throw new Error("Phoenix AI usage limit reached. Please try again in a moment.");
        }
        console.error(`Error analyzing product ${product.title}:`, error);
        // Push a placeholder failure result or continue? For now, continue loop.
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
