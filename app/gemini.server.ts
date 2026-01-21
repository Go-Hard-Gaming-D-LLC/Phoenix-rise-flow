import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the API client with the API key from environment variables
// Ensure GEMINI_API_KEY is set in your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Select the model (gemini-pro is standard for text, we are using 1.5-flash as requested)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export const generatePhoenixContent = async (prompt: string) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is missing');
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Phoenix Flow Error:', error);
        throw error;
    }
};

export async function generateProductDescription(productName: string, features: string[]) {
    try {
        const prompt = `Write a compelling Shopify product description for "${productName}". Features: ${features.join(', ')}. Keep it SEO-friendly and under 200 words.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw new Error('Failed to generate content from Phoenix Flow.');
    }
}
