
import { GoogleGenAI } from "@google/genai";
import { Language } from "../types";
import { supabase } from "./supabaseClient";

// --- LOCAL KEYWORD MATCHER ---
const findLocalMatch = (text: string, provider: any): string | null => {
    const lowerText = text.toLowerCase();
    
    // 1. PRICE DETECTION (الأثمنة)
    const priceKeywords = ['ثمن', 'سعر', 'بشحال', 'فلوك', 'price', 'prix', 'cost', 'money', 'argent', 'درهم', 'dh'];
    if (priceKeywords.some(k => lowerText.includes(k))) {
        if (provider.price_info) return provider.price_info;
    }

    // 2. LOCATION DETECTION (الموقع)
    const locKeywords = ['موقع', 'عنوان', 'فين', 'بلاصة', 'location', 'address', 'adresse', 'place', 'where', 'localisation', 'gps'];
    if (locKeywords.some(k => lowerText.includes(k))) {
        if (provider.location_info) return provider.location_info;
    }

    // 3. TIME DETECTION (التوقيت)
    const timeKeywords = ['وقت', 'ساعة', 'متى', 'وقتاش', 'time', 'hour', 'heure', 'open', 'close', 'ferme', 'حل', 'سد', 'توقيت', 'محلول'];
    if (timeKeywords.some(k => lowerText.includes(k))) {
        if (provider.working_hours) return provider.working_hours;
    }

    // 4. BOOKING DETAILS (الحجز)
    const bookKeywords = ['حجز', 'موعد', 'rendez', 'book', 'reservation', 'appointment', 'شروط'];
    if (bookKeywords.some(k => lowerText.includes(k))) {
        if (provider.booking_info) return provider.booking_info;
    }

    return null; // No strict local match found, proceed to AI
};

export const getChatResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string,
  language: Language,
  image?: { base64: string; mimeType: string; },
  audio?: { base64: string; mimeType: string; },
  userId?: number,
  userName?: string,
  targetProvider?: any 
): Promise<string> => {
    
    // --- 1. HANDLE IMAGE LOCALLY (NO API) ---
    if (image) {
        return "📸 شكراً على الصورة. لقد تم استلامها وسيطلع عليها المهني قريباً.\n(Image received successfully)";
    }

    // --- 2. TRY LOCAL MATCHING FIRST (Hybrid System - Strict Fields) ---
    if (targetProvider) {
        const localResponse = findLocalMatch(newMessage, targetProvider);
        if (localResponse) {
            // Return local response immediately, BYPASSING GOOGLE API
            return localResponse;
        }
    }

    // --- 3. PREPARE CONTEXT FOR AI ---
    let systemInstruction = "";

    if (targetProvider) {
        // Combine all knowledge sources
        const knowledgeBase = `
        Provider Name: ${targetProvider.name}
        Service Type: ${targetProvider.service_type}
        
        [STRUCTURED INFO]:
        Prices: ${targetProvider.price_info || "Not specified"}
        Location: ${targetProvider.location_info || "Not specified"}
        Hours: ${targetProvider.working_hours || "Not specified"}
        Booking Rules: ${targetProvider.booking_info || "Not specified"}
        
        [ADDITIONAL INFO / KNOWLEDGE BASE]:
        ${targetProvider.custom_ai_instructions || ""}
        ${targetProvider.bio || ""}
        `;

        systemInstruction = `
        You are an AI assistant for "${targetProvider.name}".
        
        CONTEXT DATA:
        ${knowledgeBase}

        INSTRUCTIONS:
        1. The [ADDITIONAL INFO] section contains sentences separated by periods/dots (.).
        2. When answering, SEARCH the [ADDITIONAL INFO] for the specific sentence that matches the user's question.
        3. EXTRACT and output ONLY that relevant sentence/section.
        4. DO NOT dump all information. Be precise and brief.
        5. If the answer is found in [STRUCTURED INFO], use that.
        6. If the answer is not in the context, say "Please contact us directly for this information" in the user's language.
        7. Respond in the same language as the user (mostly Arabic/Darija or French).
        `;
    } else {
        // General Assistant Logic
        try {
            const { data } = await supabase.from('providers').select('name, service_type, location').limit(15);
            const directory = data ? JSON.stringify(data) : "No directory data.";
            systemInstruction = `You are TangerConnect, a helpful city assistant for Tangier. Help users find services.
            Directory Data: ${directory}
            Keep answers short and helpful.`;
        } catch(e) {}
    }

    const limitedHistory = history.slice(-5); // Reduce context to save tokens
    const userParts: any[] = [{ text: newMessage }];
    const contents = [...limitedHistory, { role: 'user', parts: userParts }];

    try {
        const apiKey = 'AIzaSyAYLry3mo4z-zkZ_6ykfsgPAnEZMv01NnM'; // Hardcoded as per environment constraint

        const ai = new GoogleGenAI({ apiKey });
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: { 
                systemInstruction,
                maxOutputTokens: 150, // Short responses
                temperature: 0.3, // Lower temperature for more deterministic/factual retrieval
            },
        });
        
        return response.text || "No response."; 

    } catch (error: any) {
        console.error("AI Error:", error);
        return "⚠️ المرجو استخدام الأزرار المقترحة (الأثمنة، الموقع...) للحصول على إجابة دقيقة.";
    }
};
