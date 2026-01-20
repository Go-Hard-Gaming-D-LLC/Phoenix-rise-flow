import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { GoogleGenAI, Type } from "@google/genai";
import { authenticate } from "../shopify.server";

// Initialize Gemini
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Schema for product analysis response
const productAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    analysis: {
      type: Type.OBJECT,
      properties: {
        productId: { type: Type.STRING, description: "Shopify product ID" },
        currentTitle: { type: Type.STRING, description: "Current product title" },
        suggestedTitle: { type: Type.STRING, description: "SEO-optimized title" },
        currentDescription: { type: Type.STRING, description: "Current product description" },
        suggestedDescription: { type: Type.STRING, description: "Improved description" },
        metaTitle: { type: Type.STRING, description: "Meta title for search" },
        metaDescription: { type: Type.STRING, description: "Meta description for search" },
        altTextSuggestions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Alt text suggestions for product images",
        },
        keywords: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "SEO keywords",
        },
        accessibilityScore: {
          type: Type.NUMBER,
          description: "Accessibility score 0-100",
        },
        seoScore: {
          type: Type.NUMBER,
          description: "SEO score 0-100",
        },
        flaggedIssues: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Issues that need manual review before applying",
        },
      },
      required: [
        "productId",
        "currentTitle",
        "suggestedTitle",
        "metaDescription",
        "accessibilityScore",
        "seoScore",
      ],
    },
  },
};

interface ProductAnalysisInput {
  productId: string;
  title: string;
  description: string;
  images: Array<{ alt?: string; src?: string }>;
}

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
    const { products, mode = "analyze" } = await request.json();

    if (!Array.isArray(products) || products.length === 0) {
      return json({ error: "No products provided" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: productAnalysisSchema,
      },
    });

    const results: AnalysisResult[] = [];

    // Analyze each product
    for (const product of products) {
      const prompt = `
Analyze this Shopify product for accessibility and SEO optimization.

Product Data:
- Title: ${product.title}
- Description: ${product.description || "No description"}
- Image Count: ${product.images?.length || 0}
- Current Alt Texts: ${product.images?.map((img: any) => img.alt || "missing").join(", ") || "none"}

Rules:
1. NEVER change core product meaning or category
2. ONLY improve clarity, SEO, and accessibility
3. Flag any suggested change that alters product substance
4. Preserve all pricing, type, and availability info
5. Suggest alt texts for missing images
6. Identify any factual inconsistencies

Return analysis in JSON format with scores 0-100 and flagged issues list.
      `.trim();

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
