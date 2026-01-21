import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the API client with the API key from environment variables
// Ensure GEMINI_API_KEY is set in your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Select the model (gemini-pro is standard for text, we are using 1.5-flash as requested)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function generatePhoenixContent(prompt: string, context: string = "") {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const fullPrompt = `
      Role: Shopify Store Assistant (Phoenix Flow)
      Context: ${context}
      Task: ${prompt}
      Format: Return clean HTML suitable for a Shopify product description.
    `;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new Error("Failed to generate content from Phoenix Flow.");
    }
}

export async function generateProductDescription(productName: string, features: string[]) {
    try {
        const prompt = `
      Act as a **Semrush and RankMath Certified SEO Expert & Conversion Copywriter**.
      
      **Goal:** Write a high-converting, SEO-optimized product description for: "${productName}".
      **Key Features provided:** ${features.join(', ')}.

      **Strategic Objective:** The merchant has a goal of **$50k Net Profit (post-COGS)** this year. Ideally positioning this product as a high-value contributor to that goal.

      **Task Guidelines:**
      1.  **Keyword Strategy (Semrush Style):**
          - Identify 3-5 high-volume, high-intent keywords relevant to this product niche.
          - Naturally integrate these keywords into the Title, Headers, and body text.
          - Do NOT keyword stuff. Maintain a RankMath Green Score readability (Flesch Reading Ease > 60).

      2.  **Conversion Copywriting (AIDA Framework):**
          - **Attention:** Start with a hook that addresses a specific customer pain point or desire.
          - **Interest/Desire:** Focus on *benefits* (emotional/lifestyle impact), not just raw features. Use sensory language.
          - **Action:** End with a strong Call-to-Action (CTA) regarding scarcity or value.

      3.  **Structure & Formatting (RankMath Style):**
          - **H1 Title:** Create a click-worthy, keyword-rich Product Title (max 60 chars).
          - **Meta Description:** Write a persuasive snippet (150-160 chars) designed to increase CTR on Google.
          - **Product Description Body:**
              - Use short, punchy paragraphs (2-3 sentences max).
              - Use *Bullet Points* for key features to improve scannability.
          - **"Why it Matters":** Briefly explain how this description targets specific buyer psychology to drive sales velocity.

      **Output Format:**
      Return the result as a structured HTML string suitable for a Shopify Description editor, including the <h1>, <meta name="description"> content proposal, and the main body.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw new Error('Failed to generate content from Phoenix Flow.');
    }
}
