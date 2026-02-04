import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { GoogleGenerativeAI } from "@google/generative-ai";
import shopify from "../shopify.server";
import db from "../db.server";

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || ""); // Moved inside action

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const { session } = await shopify.authenticate.admin(request);

  // Initialize AI with context (Cloudflare) or fallback
  const env = (context as any).cloudflare?.env || (context as any).env || process.env;
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || "");

  // Fetch store configuration from Prisma
  const config = await db.configuration.findUnique({ where: { shop: session.shop } });
  const brandContext = config?.brandName || "your brand";

  // Get request body to determine content type
  const body = await request.json();
  const { contentType, songTitle, productDetails, targetAudience } = body;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  let prompt = "";

  // Generate different prompts based on content type
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

Make scenes visually striking and YouTube-optimized for maximum engagement.
      `;
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

Focus on conversion, emotion, and urgency.
      `;
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

Create visuals that sell the song's emotion and value.
      `;
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
]
      `;
  }

  try {
    const result = await model.generateContent(prompt);
    let responseText = result.response.text();

    // Clean up response - remove markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const content = JSON.parse(responseText);

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