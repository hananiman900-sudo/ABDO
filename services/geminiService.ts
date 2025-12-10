
import { GoogleGenAI } from "@google/genai";
import { Language } from "../types";
import { supabase } from "./supabaseClient";

// --- LOCAL KEYWORD MATCHER ---
const findLocalMatch = (text: string, provider: any): string | null => {
    const lowerText = text.toLowerCase();
    
    // 1. PRICE DETECTION (الأثمنة)
    const priceKeywords = ['ثمن', 'سعر', 'بشحال', 'فلوك', 'price', 'prix', 'cost', 'money', 'argent', 'درهم', 'dh'];
    if (priceKeywords.some(k => lowerText.includes(k))) {
        return provider.price_info || "سمح ليا، المزود مازال ماحددش الأثمنة بالضبط. (Price info not set)";
    }

    // 2. LOCATION DETECTION (الموقع)
    const locKeywords = ['موقع', 'عنوان', 'فين', 'بلاصة', 'location', 'address', 'adresse', 'place', 'where', 'localisation', 'gps'];
    if (locKeywords.some(k => lowerText.includes(k))) {
        return provider.location_info || "العنوان غير متوفر حالياً. (Location not set)";
    }

    // 3. TIME DETECTION (التوقيت)
    const timeKeywords = ['وقت', 'ساعة', 'متى', 'وقتاش', 'time', 'hour', 'heure', 'open', 'close', 'ferme', 'حل', 'سد', 'توقيت', 'محلول'];
    if (timeKeywords.some(k => lowerText.includes(k))) {
        return provider.working_hours || "أوقات العمل غير محددة. (Hours not set)";
    }

    // 4. BOOKING DETAILS (الحجز)
    const bookKeywords = ['حجز', 'موعد', 'rendez', 'book', 'reservation', 'appointment', 'شروط'];
    if (bookKeywords.some(k => lowerText.includes(k))) {
        return provider.booking_info || "يمكنك حجز موعد عبر الضغط على أيقونة الرزنامة في الأعلى.";
    }

    return null; // No match found
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

    // --- 2. TRY LOCAL MATCHING FIRST (Hybrid System) ---
    if (targetProvider) {
        const localResponse = findLocalMatch(newMessage, targetProvider);
        if (localResponse) {
            // Return local response immediately, BYPASSING GOOGLE API
            return localResponse;
        }
    }

    // --- 3. FALLBACK: If no local match, use API (or generic response if key fails) ---
    // If you want to COMPLETELY disable API cost, you can remove the code below 
    // and just return a generic menu guidance.
    
    /* 
    // OPTIONAL: UNCOMMENT TO DISABLE API ENTIRELY
    return "مرحباً! أنا المساعد الآلي. يرجى اختيار أحد الأزرار أسفله (الأثمنة، الموقع، الحجز) للحصول على إجابة دقيقة.";
    */

    const limitedHistory = history.slice(-5); // Reduce context to minimum

    let providersContext = "No data";
    if (!targetProvider) {
        try {
            const { data } = await supabase.from('providers').select('name, service_type, location, id, bio, social_links').limit(10);
            if(data) providersContext = JSON.stringify(data);
        } catch(e) {}
    }

    let systemInstruction = "";

    if (targetProvider) {
        // Simple instructions for the API fallback
        const knowledgeBase = targetProvider.custom_ai_instructions || targetProvider.bio || 'Professional in Tangier';
        systemInstruction = `
        You are ${targetProvider.name}. 
        User asks: "${newMessage}".
        Based on: "${knowledgeBase}".
        Answer briefly in user's language.
        If unknown, say "Please call me directly."
        `;
    } else {
        systemInstruction = `You are TangerConnect. Help user find services in Tangier. Data: ${providersContext}`;
    }

    const userParts: any[] = [{ text: newMessage }];
    const contents = [...limitedHistory, { role: 'user', parts: userParts }];

    try {
        // USE HARDCODED KEY AS REQUESTED
        const apiKey = 'AIzaSyAYLry3mo4z-zkZ_6ykfsgPAnEZMv01NnM';

        const ai = new GoogleGenAI({ apiKey });
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: { 
                systemInstruction,
                maxOutputTokens: 100, // Limit output to save cost
            },
        });
        
        return response.text || "No response."; 

    } catch (error: any) {
        console.error("AI Error:", error);
        // Fallback if API fails
        return "⚠️ المرجو استخدام الأزرار المقترحة (الأثمنة، الموقع...) للحصول على إجابة فورية.";
    }
};
