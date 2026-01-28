import { json, type ActionFunctionArgs } from "@vercel/remix";
import { authenticate } from "../shopify.server";
import {
  getUserTier,
  hasReachedLimit
} from "../utils/tierConfig";
import { sendDeveloperAlert } from "../utils/developerAlert";
// ✅ IMPORT THE BRAIN
import {
  generatePhoenixContent,
  generateAltText,
  generateAIContent,
  ignitePhoenix
} from "../gemini.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  // A. Authenticate
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;

  // B. Parse Inputs
  const formData = await request.formData();
  const actionType = formData.get("actionType") as string;
  const rightsConfirmed = formData.get("rightsConfirmed");
  const productName = formData.get("productName") as string;
  const features = formData.get("features") ? JSON.parse(formData.get("features") as string) : [];
  const contentType = formData.get("contentType") as any;

  try {
    // --- 1. BILLING & LEGAL CHECKS ---
    // Liability Check for Media
    if ((contentType === 'music_video' || contentType === 'song_showcase') && rightsConfirmed !== 'true') {
      return json({ success: false, error: "Legal confirmation required." }, { status: 403 });
    }

    // Tier Limits Check
    const tier = await getUserTier(shop);
    let limitType: any = null;
    if (actionType === 'generate_desc') limitType = 'descriptionsPerMonth';
    if (actionType === 'generate_ad' || contentType === 'product_ad') limitType = 'adsPerMonth';

    if (limitType && hasReachedLimit(tier, limitType, 0)) {
      // 🚨 Soft Alert: Log it, but don't wake the developer up at 3AM
      console.warn(`[Limit Reached] Shop ${shop} hit ${limitType} limit.`);
      return json({ success: false, error: "Plan limit reached. Upgrade required." }, { status: 402 });
    }

    // --- 2. EXECUTE AI (Delegating to gemini.server.ts) ---
    let result;

    if (actionType === 'generate_desc') {
      result = await generatePhoenixContent(productName, features);
    }
    else if (actionType === 'generate_alt_text') {
      result = await generateAltText(productName);
    }
    else if (actionType === 'generate_media') {
      result = await generateAIContent({
        contentType,
        shop: shop,
        userTier: tier,
        productDetails: productName,
        brandContext: formData.get("brandContext") as string || "Our Brand",
        targetAudience: formData.get("targetAudience") as string || "General Audience"
      });
    }
    else if (actionType === 'perform_scan') {
      // ✅ DEEP SCANNER: Fetches Real Data, then asks Gemini to analyze
      const graphqlResponse = await admin.graphql(`
        query ShopScan {
          shop { name, description, primaryDomain { url } }
          shopPolicies { title, body }
          products(first: 5) { edges { node { title, descriptionHtml } } }
        }
      `);
      const shopData = await graphqlResponse.json();

      const prompt = `
        [STRICT JSON ANALYST]
        Analyze this shop data: ${JSON.stringify(shopData)}
        Return JSON with "brandIdentity" (summary, usp) and "trustAudit" (policy gaps).
      `;

      const rawText = await ignitePhoenix(prompt, "Senior Data Analyst");
      const cleanText = rawText.replace(/```json|```/g, "").trim();
      result = JSON.parse(cleanText);
    }
    else {
      throw new Error("Invalid Action Type");
    }

    return json({ success: true, data: result });

  } catch (error: any) {
    console.error("❌ PHOENIX API ERROR:", error);

    // --- 3. ROBUST ERROR HANDLING (The Shock Absorber) ---

    // Check for Rate Limits (429) or Specific "Usage Limits" error from our brain file
    const isRateLimit =
      error.status === 429 ||
      error.message?.includes("429") ||
      error.message?.includes("quota") ||
      error.message?.includes("Usage Limits"); // Matches the error thrown in gemini.server.ts

    if (isRateLimit) {
      console.warn(`[Gemini Rate Limit] Shop ${shop} is hitting the ceiling.`);
      return json({
        success: false,
        error: "⚠️ High Traffic: The AI is currently overwhelmed. Please try again in 30 seconds."
      }, { status: 429 });
    }

    // For real crashes, alert the dev
    await sendDeveloperAlert('ERROR', `API Crash: ${error.message}`, { shop, actionType });

    return json({
      success: false,
      error: error.message || "System Error"
    }, { status: 500 });
  }
};