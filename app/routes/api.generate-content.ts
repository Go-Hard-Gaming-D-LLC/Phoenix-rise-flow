/**
 * 🛡️ SHADOW'S FORGE: CORE LOGIC GATE
 * WARNING: DO NOT MODIFY THIS FILE WITHOUT EXPLICIT PERMISSION.
 * This file governs the clinical AI Content Generation for Music and Ads.
 * Authorized Deployment: ironphoenixflow.com
 */
import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { GoogleGenerativeAI } from "@google/generative-ai";
import shopify from "../shopify.server";
import { getPrisma } from "../db.server";
import { getUserTier } from "../utils/tierConfig";
import { canPerformAction, recordUsage } from "../utils/usageTracker";

interface GenerateContentBody {
  contentType: string;
  songTitle?: string;
  productDetails?: string;
  targetAudience?: string;
}

export const action = async ({ request, context }: ActionFunctionArgs) => {
  // 1. AUTH HANDSHAKE: Validates the Shopify Admin session
  const { session } = await shopify.authenticate.admin(request);
  const db = getPrisma(context);

  // ✅ CLINICAL FIX: Resolve Key from Edge Context to avoid Error 2339
  const apiKey = context.cloudflare.env.GEMINI_API_KEY;
  if (!apiKey) {
    return json({ 
      success: false, 
      error: "❌ SHADOW'S FORGE: Missing GEMINI_API_KEY in Cloudflare Secrets." 
    }, { status: 500 });
  }

  // Fetch store configuration for brand context from Prisma
  const config = await db.configuration.findUnique({ where: { shop: session.shop } });
  const genAI = new GoogleGenerativeAI(apiKey);
  const brandContext = config?.brandName || "your brand";

  // 2. USAGE VERIFICATION: Checks tier-based limits before AI ignition
  const body = (await request.json()) as GenerateContentBody;
  const { contentType, songTitle, productDetails, targetAudience } = body;
  const userTier = await getUserTier(context, session.shop);
  
  const actionType =
    contentType === "music_video" ? "music_video" :
    contentType === "product_ad" ? "ad" : "description";
    
  const allowed = await canPerformAction(context, session.shop, userTier, actionType);
  if (!allowed.allowed) {
    return json({ success: false, error: allowed.reason || "Monthly limit reached" }, { status: 403 });
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  let prompt = "";

  // 3. PROMPT ENGINE: Detailed directives for YouTube and Canva optimization
  switch (contentType) {
    case "music_video":
      prompt = `
SYSTEM ROLE: Music Video Director for ${brandContext}

CONTEXT: Creating YouTube music video for "${songTitle || 'untitled track'}"

TASK: Generate 5 compelling video scene descriptions optimized for:
- YouTube engagement and retention
- Visual storytelling that matches the song's mood
- Canva-friendly image creation

OUTPUT FORMAT: Valid JSON array with this exact structure:
[
  {
    "scene_number": 1,
    "timestamp": "0:00-0:15",
    "scene_description": "Detailed description of what viewers see",
    "canva_image_prompt": "Specific visual prompt for Canva image generation",
    "camera_movement": "pan left / zoom in / static / etc",
    "mood_colors": "color palette for this scene",
    "text_overlay": "any text/lyrics to display"
  }
]

Make scenes visually striking and YouTube-optimized for maximum engagement.`;
      break;

    case "product_ad":
      prompt = `
SYSTEM ROLE: Ad Creative Director for ${brandContext}

CONTEXT: Creating product advertisement for: ${productDetails || 'music/merchandise'}
TARGET AUDIENCE: ${targetAudience || 'music lovers and collectors'}

TASK: Generate 3 high-converting ad concepts for social media (Facebook, Instagram, TikTok)

OUTPUT FORMAT: Valid JSON array:
[
  {
    "ad_concept": "Main creative idea",
    "hook_text": "Attention-grabbing opening line (under 10 words)",
    "body_copy": "Persuasive ad copy (2-3 sentences)",
    "canva_image_prompt": "Visual description for Canva design",
    "call_to_action": "Clear CTA button text",
    "platform_optimization": "Best suited for which platform"
  }
]

Focus on conversion, emotion, and urgency.`;
      break;

    case "song_showcase":
      prompt = `
SYSTEM ROLE: E-commerce Visual Designer for ${brandContext}

CONTEXT: Creating product page visuals for song: "${songTitle || 'featured track'}"

TASK: Generate 4 product showcase image concepts for your website store

OUTPUT FORMAT: Valid JSON array:
[
  {
    "image_type": "hero / lifestyle / detail / social_proof",
    "canva_image_prompt": "Detailed visual description for Canva",
    "purpose": "What this image accomplishes",
    "text_elements": "Any text overlays or callouts",
    "color_scheme": "Recommended colors",
    "where_to_use": "Homepage / Product page / Gallery / etc"
  }
]

Create visuals that sell the song's emotion and value.`;
      break;

    default:
      prompt = `
SYSTEM ROLE: Content Creator for ${brandContext}

TASK: Generate 5 versatile content ideas for multiple uses (videos, ads, product pages)

OUTPUT FORMAT: Valid JSON array:
[
  {
    "content_idea": "Brief concept description",
    "canva_image_prompt": "Visual prompt for Canva",
    "use_cases": ["YouTube", "Instagram", "Website"],
    "vibe": "energetic / moody / inspiring / etc"
  }
]`;
  }

  try {
    const result = await model.generateContent(prompt);
    let responseText = result.response.text();

    // 4. SANITIZATION: Clean up response - remove markdown code blocks
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const content = JSON.parse(responseText);

    // 5. TELEMETRY: Recording action in usage tracker
    await recordUsage(context, session.shop, actionType, {
      contentType,
      songTitle,
      productDetails
    });

    return json({
      success: true,
      content,
      contentType,
      brandContext
    });

  } catch (error) {
    console.error("Content generation error:", error);
    return json({
      success: false,
      error: "Failed to generate content. Please try again.",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
};