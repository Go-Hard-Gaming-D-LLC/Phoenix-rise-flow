import { GoogleGenerativeAI } from '@google/generative-ai';
import { canPerformAction, recordUsage } from "../utils/usageTracker";

// Initialize with your API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
  shop: string;
  userTier: string;
}

export async function generateAIContent(params: GenerateContentParams) {
  const {
    contentType,
    songTitle,
    productDetails,
    targetAudience = "general audience",
    brandContext = "your brand",
    shop,
    userTier
  } = params;

  // Map to Usage Tracker action types
  let actionType: 'description' | 'ad' | 'music_video' = 'description';
  if (contentType === 'music_video') actionType = 'music_video';
  if (contentType === 'product_ad') actionType = 'ad';

  // 1. Check Rate Limits / Quotas
  const permission = await canPerformAction(shop, userTier, actionType);
  if (!permission.allowed) {
    throw new Error(`Rate Limit Exceeded: ${permission.reason}`);
  }

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

    // 2. Record Usage
    await recordUsage(shop, actionType, {
      contentType,
      itemCount: Array.isArray(content) ? content.length : 1,
      productDetails: productDetails?.substring(0, 50)
    });

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