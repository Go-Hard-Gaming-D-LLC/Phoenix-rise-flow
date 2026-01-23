import { GoogleGenerativeAI } from '@google/generative-ai';

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