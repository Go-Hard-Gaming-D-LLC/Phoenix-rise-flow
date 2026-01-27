import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  getUserTier, 
  hasReachedLimit, 
  canAccessFeature, 
  formatTierLimits 
} from "../utils/tierConfig";
import { sendDeveloperAlert } from "../utils/developerAlert";

// --- 1. CONFIGURATION & AI SETUP ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
// Use 'gemini-1.5-flash' for speed/cost.
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// --- 2. THE ACTION HANDLER (The Traffic Controller) ---
export const action = async ({ request }: ActionFunctionArgs) => {
  // A. Authenticate the Request & Get Admin Access (For Scanning)
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;

  // B. Parse the Input Data
  const formData = await request.formData();
  const actionType = formData.get("actionType") as string; // 'generate_desc', 'perform_scan', etc.
  const rightsConfirmed = formData.get("rightsConfirmed"); // "true" or "false"
  
  // Data for generation
  const productName = formData.get("productName") as string;
  const features = formData.get("features") ? JSON.parse(formData.get("features") as string) : [];
  const contentType = formData.get("contentType") as any; // 'music_video', 'product_ad'

  try {
    // --- 3. THE LEGAL SHIELD (Liability Protection) ---
    // If they are uploading/using audio, they MUST agree to rights
    if ((contentType === 'music_video' || contentType === 'song_showcase') && rightsConfirmed !== 'true') {
      return json({ 
        success: false, 
        error: "LEGAL REQUIREMENT: You must confirm you own the rights to this music." 
      }, { status: 403 });
    }

    // --- 4. THE BILLING GATEKEEPER (Stop Freeloaders) ---
    // Get their real tier from the DB
    const tier = await getUserTier(shop);
    
    // Map the action to a limit type
    let limitType: 'descriptionsPerMonth' | 'adsPerMonth' | 'musicVideosPerMonth' | null = null;
    
    if (actionType === 'generate_desc') limitType = 'descriptionsPerMonth';
    if (actionType === 'generate_ad' || contentType === 'product_ad') limitType = 'adsPerMonth';
    if (contentType === 'music_video') limitType = 'musicVideosPerMonth';

    // Check Limits (Skip limit check for 'perform_scan' - scans are usually free/unlimited or tier-gated by feature)
    if (limitType && hasReachedLimit(tier, limitType, 0)) { 
      // 🚨 ALERT: Send a signal that someone hit a wall
      await sendDeveloperAlert('LIMIT_REACHED', `Shop ${shop} hit ${limitType} limit on ${tier} plan.`);
      
      return json({ 
        success: false, 
        error: `Limit reached for your ${tier} plan. Please upgrade to continue.` 
      }, { status: 402 }); // 402 Payment Required
    }

    // --- 5. EXECUTE THE AI (Your Logic) ---
    let result;

    if (actionType === 'generate_desc') {
      result = await generatePhoenixContent(productName, features);
    } 
    else if (actionType === 'generate_alt_text') {
      result = await generateAltText(productName);
    }
    else if (actionType === 'perform_scan') {
      // ✅ THE DEEP SCANNER (Reads Real Shopify Data)
      
      // 1. Fetch Data from Shopify API
      const graphqlResponse = await admin.graphql(`
        query ShopScan {
          shop {
            name
            description
            primaryDomain { url }
          }
          shopPolicies {
            title
            body
          }
          products(first: 5) {
            edges {
              node {
                title
                descriptionHtml
              }
            }
          }
        }
      `);
      
      const shopData = await graphqlResponse.json();
      
      // 2. Feed Data to Gemini for Analysis
      const prompt = `
        [STRICT ANALYST MODE]
        Analyze this raw Shopify Store Data:
        ${JSON.stringify(shopData)}

        TASK:
        1. "brandIdentity": Summarize the brand voice, target audience, and USP based on their actual products and description.
        2. "trustAudit": Check the 'shopPolicies'. If 'Refund Policy' or 'Privacy Policy' is missing or too short (<100 words), flag it as a "Misrepresentation" risk (Google Merchant Center).

        OUTPUT JSON ONLY:
        {
          "brandIdentity": { "summary": "...", "targetAudience": "...", "usp": "..." },
          "trustAudit": [ { "issue": "Missing Refund Policy", "recommendation": "..." } ]
        }
      `;

      const scanResult = await model.generateContent(prompt);
      let cleanText = scanResult.response.text().replace(/```json|```/g, "").trim();
      result = JSON.parse(cleanText);
    }
    else if (actionType === 'generate_media') {
      result = await generateAIContent({
        contentType,
        shop,
        userTier: tier,
        productDetails: productName,
        brandContext: formData.get("brandContext") as string || "Our Brand",
        targetAudience: formData.get("targetAudience") as string || "General"
      });
    } else {
      throw new Error("Invalid Action Type");
    }

    // Success!
    return json({ success: true, data: result });

  } catch (error: any) {
    // --- 6. CRASH REPORTING ---
    console.error("❌ PHOENIX API ERROR:", error);
    await sendDeveloperAlert('ERROR', `API Crash: ${error.message}`, { shop, actionType });
    
    return json({ 
      success: false, 
      error: error.message || "System Error" 
    }, { status: 500 });
  }
};

// --- 7. HELPER FUNCTIONS (Your AI Logic) ---

export async function generatePhoenixContent(productName: string, features: string[]) {
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
  return result.response.text();
}

export async function generateAltText(productName: string) {
  try {
    const prompt = `Write a 125-character 'Answer-First' SEO alt-text for: ${productName}. No fluff.`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    return "High-quality product image for " + productName;
  }
}

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
  const { contentType, songTitle, productDetails, targetAudience, brandContext } = params;

  let prompt = "";

  // ... (Your Prompt Switch Logic) ...
  switch (contentType) {
    case "music_video":
      prompt = `
      [STRICT ACTION MODE] 
      ROLE: Music Video Director. 
      SONG: "${songTitle || 'Untitled'}". 
      TASK: Create 5 scenes optimized for 8-second loops.
      OUTPUT: Valid JSON Array.
      [
        { "scene": 1, "visual": "...", "camera": "Zoom In" }
      ]
      `;
      break;
    case "product_ad":
      prompt = `
      [STRICT ACTION MODE]
      ROLE: Ad Director for ${brandContext}
      PRODUCT: ${productDetails}
      AUDIENCE: ${targetAudience}
      TASK: Generate 3 high-converting ad concepts (JSON Array) optimized for 8-second loops.
      OUTPUT:
      [
        {
          "ad_concept": "Creative hook idea",
          "hook_text": "Opening line",
          "body_copy": "Persuasive copy",
          "canva_image_prompt": "Visual description"
        }
      ]
      `;
      break;
    default:
      prompt = `Generate content ideas for ${productDetails} (JSON).`;
  }

  const result = await model.generateContent(prompt);
  let text = result.response.text();
  
  // Clean JSON
  text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  
  try {
    return JSON.parse(text);
  } catch (e) {
    return { raw_text: text }; // Fallback if AI returns bad JSON
  }
}