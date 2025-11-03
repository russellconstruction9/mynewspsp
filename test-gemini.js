// Test script to verify Gemini API integration
import { getChatResponse } from './services/geminiService.js';

// Simple test function
const testGeminiAPI = async () => {
    console.log('Testing Gemini API...');
    
    try {
        // Test with a simple message
        const testMessages = [
            { role: 'user', content: 'Hello, can you help me test the API?' }
        ];
        
        const result = await getChatResponse(testMessages, null);
        console.log('✅ Success! Response:', result.text);
        console.log('Tokens used:', result.tokensUsed);
        
    } catch (error) {
        console.error('❌ Error testing Gemini API:', error);
        console.error('Error details:', error.message);
        
        // Check if it's an API key issue
        if (error.message.includes('API key')) {
            console.error('🔑 API Key Issue: Make sure VITE_GEMINI_API_KEY is set correctly');
        }
        
        // Check if it's a network issue
        if (error.message.includes('fetch')) {
            console.error('🌐 Network Issue: Check internet connection');
        }
    }
};

// Call the test if running in browser console
if (typeof window !== 'undefined') {
    window.testGeminiAPI = testGeminiAPI;
    console.log('💡 Run testGeminiAPI() in the console to test the API');
}

export { testGeminiAPI };