
import { GoogleGenAI } from "@google/genai";
import { Language } from "../types";
import { supabase } from "./supabaseClient";

export const getChatResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string,
  language: Language,
  image?: { base64: string; mimeType: string; },
  audio?: { base64: string; mimeType: string; },
  userId?: number,
  userName?: string,
  targetProvider?: any // New parameter to pass the specific provider context
): Promise<string> => {
    
    // 1. OPTIMIZATION: Limit history to last 10 turns to save API Quota (Tokens)
    // This prevents "Resource Exhausted" errors on long chats
    const limitedHistory = history.slice(-10);

    // Fetch Providers List (only if we are in general mode)
    let providersContext = "No data";
    if (!targetProvider) {
        try {
            const { data } = await supabase.from('providers').select('name, service_type, location, id, bio, social_links').limit(20);
            if(data) providersContext = JSON.stringify(data);
        } catch(e) {}
    }

    // DYNAMIC SYSTEM INSTRUCTION
    let systemInstruction = "";

    if (targetProvider) {
        // PERSONA MODE: AI acts as the specific Provider
        
        // Prefer Custom Instructions if available
        const knowledgeBase = targetProvider.custom_ai_instructions || targetProvider.bio || 'I am a professional in Tangier.';
        
        systemInstruction = `
        ROLE: You are ${targetProvider.name}, a ${targetProvider.service_type} based in Tangier.
        CURRENT USER: You are talking to ${userName || 'a guest'}.
        LANGUAGE: Respond in the same language/dialect as the user (Darija, Arabic, French, or English).

        YOUR KNOWLEDGE BASE (Internal Info):
        """
        ${knowledgeBase}
        """

        CRITICAL BEHAVIOR RULES:
        1. **BE HUMAN & NATURAL:** Be warm, professional, and concise.
        2. **ANSWER ONLY THE QUESTION:** Do not list services unless asked.
        3. **UNKNOWN INFO:** If asked something not in your Knowledge Base, say you don't know and ask for their phone number.
        4. **SUGGESTIONS:** At the very end of your response, you MUST provide 3 short, relevant follow-up questions the user might want to ask next based on your Knowledge Base.
        
        FORMATTING OUPUT:
        - Put the main response text first.
        - If confirming a booking, output JSON: { "bookingConfirmed": true, ... }
        - If NOT booking, at the very end, on a new line, write:
          SUGGESTIONS|Option 1|Option 2|Option 3
          (Example: SUGGESTIONS|كم الثمن؟|أين الموقع؟|حجز موعد)
        `;
    } else {
        // GENERAL MODE: City Assistant
        systemInstruction = `
        ROLE: You are TangerConnect AI (طنجة كونكت), a helpful, friendly local assistant for Tangier city.
        LANGUAGE: Respond in the same language/dialect as the user.

        AVAILABLE PROVIDERS DATA:
        ${providersContext}

        BEHAVIOR RULES:
        1. **BE HELPFUL:** Answer questions about Tangier services naturally.
        2. **RECOMMENDATIONS:** Recommend specific names from the data if asked.
        3. **CONCISENESS:** Keep answers short.
        
        FORMATTING:
        At the end, suggest 3 relevant actions on a new line:
        SUGGESTIONS|Option 1|Option 2|Option 3
        `;
    }

    const userParts: any[] = [{ text: newMessage }];
    if (image) userParts.push({ inlineData: { data: image.base64, mimeType: image.mimeType } });

    const contents = [...limitedHistory, { role: 'user', parts: userParts }];

    try {
        const apiKey = 'AIzaSyAYLry3mo4z-zkZ_6ykfsgPAnEZMv01NnM';

        if (!apiKey) {
            console.error("API Key is missing");
            return "⚠️ عذراً، مفتاح API غير موجود.";
        }
        
        const ai = new GoogleGenAI({ apiKey });
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: { 
                systemInstruction,
                temperature: 0.7,
            },
        });
        
        return response.text || "No response generated."; 

    } catch (error: any) {
        console.error("AI Error Detailed:", error);
        // User friendly error map
        if (error.message?.includes('429')) return "⚠️ الضغط كبير على الخادم (Busy). يرجى الانتظار قليلاً.";
        return `⚠️ عذراً، هناك مشكلة في الاتصال. (${error.message || 'Unknown'})`;
    }
};
