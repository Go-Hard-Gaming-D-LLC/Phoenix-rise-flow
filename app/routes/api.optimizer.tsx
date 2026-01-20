import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { GoogleGenAI, Type } from "@google/genai";
import { authenticate } from "../shopify.server";

// Initialize Gemini
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Schema from Phoenix Rise index.tsx
const listingGradeSchema = {
  type: Type.OBJECT,
  properties: {
    listingGrade: {
      type: Type.OBJECT,
      properties: {
        originalTitle: { type: Type.STRING, description: "The original title of the product from the page." },
        score: { type: Type.NUMBER, description: "The numerical score from 1-100 based on Semrush SEO standards." },
        feedback: {
          type: Type.OBJECT,
          properties: {
            seo: { type: Type.STRING, description: "Critique of the current SEO based on Semrush guidelines." },
            description: { type: Type.STRING, description: "Feedback on product description persuasion." },
            photography: { type: Type.STRING, description: "Feedback on photography." },
            imageCheck: { type: Type.STRING, description: "Specific check: Main image MUST be white background (#FFFFFF). Secondary images MUST be lifestyle/in-use. Flag if this rule is violated." },
          },
          required: ['seo', 'description', 'photography', 'imageCheck'],
        },
        optimization: {
          type: Type.OBJECT,
          properties: {
            shopifyProductTitle: { type: Type.STRING, description: "Shopify H1 Title: Clear, descriptive, user-friendly." },
            shopifyMetaTitle: { type: Type.STRING, description: "Shopify Meta Title: STRICTLY under 60 characters. Format: Primary Keyword - USP | Brand." },
            shopifyMetaDescription: { type: Type.STRING, description: "Shopify Meta Description: 150-160 characters summary for Google search results." },
            shopifyTags: { type: Type.STRING, description: "Comma-separated list of tags for Shopify admin (e.g. 'tag1, tag2, tag3')." },
            etsyTitle: { type: Type.STRING, description: "Etsy Title: First 40 chars must contain the strongest keyword. Full 140 chars used. NO REPEATED WORDS." },
            etsyTags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Exactly 13 Etsy backend tags. Multi-word phrases preferred. No repeats."
            },
            optimizedDescription: { type: Type.STRING, description: "An optimized product description integrating the keywords." },
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "An array of 5-7 high-volume Semrush-style keywords."
            },
            photoTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "An array of 3 actionable photography tips."
            },
          },
          required: ['shopifyProductTitle', 'shopifyMetaTitle', 'shopifyMetaDescription', 'shopifyTags', 'etsyTitle', 'etsyTags', 'optimizedDescription', 'keywords', 'photoTips'],
        },
      },
      required: ['originalTitle', 'score', 'feedback', 'optimization'],
    },
  },
  required: ['listingGrade'],
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    await authenticate.admin(request);
    const { url, mode } = await request.json();

    if (!url) {
      return json({ error: "URL is required" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    // Fetch product content
    let productData = "";
    try {
      // Try to fetch JSON representation first (Shopify standard)
      const jsonUrl = url.includes('?') ? url.replace('?', '.js?') : `${url}.js`;
      const response = await fetch(jsonUrl);
      if (response.ok) {
        const data = await response.json();
        productData = JSON.stringify(data);
      } else {
        // Fallback to HTML
        const htmlResponse = await fetch(url);
        productData = await htmlResponse.text();
        // Truncate to avoid token limits if massive
        productData = productData.substring(0, 50000); 
      }
    } catch (e) {
      console.error("Fetch failed:", e);
      return json({ error: "Failed to fetch product URL. Ensure it is publicly accessible." }, { status: 400 });
    }

    const prompt = `
      Analyze this product listing data. Act as a SEMRUSH-Certified SEO Expert. 
      Strictly follow the guidelines from "Semrush Blog: Etsy SEO" and "Shopify SEO Checklist".

      Product Data (JSON or HTML):
      ${productData}

      STEP 1: **Identify the Core Keyword.** (High volume).
      
      STEP 2: **Shopify Optimization (Google Rules).**
         - GENERATE "shopifyProductTitle" (H1): Descriptive, natural, user-focused.
         - GENERATE "shopifyMetaTitle" (Title Tag): **STRICT < 60 Characters**. Format: [Core Keyword] - [Differentiator] | [Brand]. Do NOT go over 60 chars.
         - GENERATE "shopifyMetaDescription": **STRICT 150-160 characters**. Actionable summary for Google SERP, convincing users to click.
         - GENERATE "shopifyTags": A comma-separated string of relevant tags for the Shopify admin (e.g., "tag1, tag2, tag3").
      
      STEP 3: **Etsy Optimization (Semrush Rules).**
         - GENERATE "etsyTitle": **First 40 Characters are CRITICAL**. Put the strongest keyword first. Use the full 140 char limit.
         - **CRITICAL RULE:** Do NOT repeat words. Etsy de-duplicates. "Wall Art" and "Art for Wall" is wasted space. Use synonyms and distinct phrases separated by " | ".
         - GENERATE "etsyTags": Create exactly 13 tags. Focus on multi-word phrases (long-tail) as per Semrush advice.
      
      STEP 4: **Image Strategy Audit (Google Merchant Center Rules)**
         - **Main Image:** Check the first image. Does it have a white background (#FFFFFF)? If not, provide an "imageCheck" warning: "Urgent: Replace Main Image with White Background for Google Approval."
         - **Secondary Images:** Are there lifestyle shots? If only white background images exist, suggest: "Opportunity: Add beautified 'in-use' photos to boost sales."
         - **Trust Check:** Ensure no text overlays like "Sale" or logos are on the main image.

      STEP 5: Write a persuasive description.
      STEP 6: Provide 5-7 high-opportunity keywords.
      STEP 7: Provide 3 photography improvement tips (incorporating the White vs Lifestyle rule).

      Respond in JSON format according to the provided schema.
    `;

    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: listingGradeSchema,
      },
    });

    const responseText = result.text();
    const data = JSON.parse(responseText);

    return json(data);

  } catch (error) {
    console.error("Optimizer error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Optimization failed" },
      { status: 500 }
    );
  }
};
