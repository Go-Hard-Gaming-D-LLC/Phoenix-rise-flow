// Validate API key at startup
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ CRITICAL: GEMINI_API_KEY is missing");
  throw new Error("GEMINI_API_KEY must be set in environment variables");
}
import { GoogleGenerativeAI } from '@google/generative-ai';

// ============================================================
// PART 1: THE SAFETY LAYER (Singleton Pattern)
// This prevents "Too Many Connections" errors during development
// ============================================================
let geminiClient: GoogleGenerativeAI | undefined;

function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    // Graceful fallback or error
    console.error("❌ GEMINI_API_KEY is missing from .env");
    throw new Error("GEMINI_API_KEY is not set.");
  }

  // Reuse existing client if available
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  return geminiClient;
}

// Initialize the model securely
const model = getGeminiClient().getGenerativeModel({ model: 'gemini-1.5-flash' });


// ============================================================
// PART 2: PHOENIX FLOW LOGIC (Your Prompts)
// ============================================================

/**
 * PHOENIX FLOW: THE EXECUTIVE CONTENT ENGINE
 * This replaces the "Teacher" prompts with "Worker" prompts.
 */
export async function generatePhoenixContent(productName: string, features: string[]) {
  try {
    const prompt = `
      [STRICT ACTION MODE - NO LECTURE]
      PRODUCT: ${productName}
      FEATURES: ${features.join(', ')}
      
      TASK: Generate high-converting Shopify HTML.
      STYLE: 2026 'Answer-First' (GEO optimized) + TikTok 'Authentic' Tone.
      
      OUTPUT STRUCTURE:
      - <h2>: Catchy, keyword-rich title.
      - <p>: Immediate hook addressing a pain point.
      - <ul>: 3-5 benefit-driven bullets (scannable).
      - <strong>: Urgency-based Call to Action.
      
      CONSTRAINT: Do not include Meta descriptions. Do not explain your choices. Return ONLY HTML.
    `;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("Phoenix Engine Error:", error);
    throw new Error("Engine stalled. Check API Key or Usage Limits.");
  }
}

/**
 * PHOENIX FLOW: VISUAL EXOSKELETON
 * This generates SEO-optimized Alt-Text for your 40-product scan.
 */
export async function generateAltText(productName: string) {
  try {
    const prompt = `Write a 125-character 'Answer-First' SEO alt-text for: ${productName}. No fluff.`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    return "High-quality product image for " + productName;
  }
}

/**
 * PHOENIX FLOW: MULTI-PURPOSE CONTENT GENERATOR
 * For music videos, product ads, and song showcases
 */
interface GenerateContentParams {
  contentType: "music_video" | "product_ad" | "song_showcase" | "general";
  songTitle?: string;
  productDetails?: string;
  targetAudience?: string;
  brandContext?: string;
}

export async function generateAIContent(params: GenerateContentParams) {
  const {
    contentType,
    songTitle,
    productDetails,
    targetAudience = "general audience",
    brandContext = "your brand"
  } = params;

  let prompt = "";

  switch (contentType) {
    case "music_video":
      prompt = `
[STRICT ACTION MODE - NO LECTURE]
ROLE: Music Video Director for ${brandContext}
SONG: "${songTitle || 'untitled track'}"

TASK: Generate 5 YouTube-optimized video scenes.
OUTPUT: Valid JSON array ONLY. No explanation.

[
  {
    "scene_number": 1,
    "timestamp": "0:00-0:15",
    "scene_description": "What viewers see",
    "canva_image_prompt": "Specific visual for Canva",
    "camera_movement": "pan/zoom/static",
    "mood_colors": "color palette",
    "text_overlay": "text to display"
  }
]
      `;
      break;

    case "product_ad":
      prompt = `
[STRICT ACTION MODE - NO LECTURE]
ROLE: Ad Director for ${brandContext}
PRODUCT: ${productDetails || 'product'}
AUDIENCE: ${targetAudience}

TASK: Generate 3 high-converting ad concepts.
OUTPUT: Valid JSON array ONLY. No explanation.

[
  {
    "ad_concept": "Creative hook idea",
    "hook_text": "Opening line (under 10 words)",
    "body_copy": "Persuasive copy (2-3 sentences)",
    "canva_image_prompt": "Visual description for Canva",
    "call_to_action": "CTA button text",
    "platform_optimization": "Best platform"
  }
]

Focus: Conversion, emotion, urgency. Answer-First style.
      `;
      break;

    case "song_showcase":
      prompt = `
[STRICT ACTION MODE - NO LECTURE]
ROLE: E-commerce Designer for ${brandContext}
SONG: "${songTitle || 'featured track'}"

TASK: Generate 4 product page image concepts.
OUTPUT: Valid JSON array ONLY. No explanation.

[
  {
    "image_type": "hero/lifestyle/detail/social_proof",
    "canva_image_prompt": "Visual for Canva",
    "purpose": "What this accomplishes",
    "text_elements": "Text overlays",
    "color_scheme": "Colors",
    "where_to_use": "Homepage/Product page"
  }
]
      `;
      break;

    default:
      prompt = `
[STRICT ACTION MODE - NO LECTURE]
CONTEXT: ${productDetails || 'General content'}
AUDIENCE: ${targetAudience}

TASK: Generate 5 versatile content ideas.
OUTPUT: Valid JSON array ONLY.

[
  {
    "content_idea": "Concept",
    "canva_image_prompt": "Visual prompt",
    "use_cases": ["YouTube", "Instagram", "Website"],
    "vibe": "mood"
  }
]
      `;
  }

  try {
    const result = await model.generateContent(prompt);
    let responseText = result.response.text();

    // Clean markdown code blocks
    responseText = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const content = JSON.parse(responseText);

    return {
      success: true,
      content,
      contentType,
      brandContext
    };
  } catch (error) {
    console.error("Phoenix Content Engine Error:", error);
    throw new Error(
      `Engine stalled: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * ignitePhoenix: Core function to interact with Gemini 1.5 Flash
 * Acts as the Merchant Co-Pilot for general queries and strategy.
 */
export async function ignitePhoenix(prompt: string, context: string = 'General Strategy') {
  try {
    // System prompting to define the persona
    const systemPrompt = `You are Phoenix Flow, a specialized Shopify Merchant Co-Pilot. Current Context: ${context}. Response format: Concise, actionable advice.`;

    // Using the existing model instance
    const result = await model.generateContent([systemPrompt, prompt]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Phoenix Engine Failure:', error);
    throw new Error('Failed to ignite Phoenix AI engine.');
  }
}

/**
 * analyzeProductData: specialized function for the Bulk Analyzer route
 * Scans product JSON for SEO and trend gaps.
 */
export async function analyzeProductData(productData: any) {
  try {
    const prompt = `
      Analyze the following Shopify product data based on current market trends and SEO best practices.
      Product Data: ${JSON.stringify(productData)}
      
      Output Requirements:
      1. Identify 3 missing high-value keywords.
      2. Rate the description effectiveness (1-10).
      3. Suggest one demographic targeting improvement.
      
      Return response as valid JSON.
    `;

    // Using the existing model instance
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Product Analysis Error:', error);
    return JSON.stringify({
      error: 'Analysis failed',
      missing_keywords: [],
      effectiveness_score: 0,
      demographic_improvement: "N/A"
    });
  }
}
