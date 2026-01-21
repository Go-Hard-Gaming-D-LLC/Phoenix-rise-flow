import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google AI client
// Ensure GEMINI_API_KEY is set in your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const generatePhoenixContent = async (prompt: string) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is missing');
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Phoenix Flow Error:', error);
        throw error;
    }
};
