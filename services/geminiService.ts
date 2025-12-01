
import { GoogleGenAI } from "@google/genai";
import { Language } from "../types";
import { supabase } from "./supabaseClient";

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function deg2rad(deg: number) { return deg * (Math.PI / 180); }

export const getChatResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string,
  language: Language,
  image?: { base64: string; mimeType: string; },
  audio?: { base64: string; mimeType: string; },
  userId?: number,
  userName?: string,
  userPhone?: string,
  announcementsText: string = "",
  userLocation?: { lat: number, lng: number }
): Promise<string> => {
    
    // 1. Get Keys from Window Config
    const config = (window as any).TANGER_CONFIG || (window as any).process?.env || {};
    let apiKeys: string[] = [];
    
    // Ensure we get the array of keys
    if (config.API_KEYS && Array.isArray(config.API_KEYS) && config.API_KEYS.length > 0) {
        apiKeys = config.API_KEYS.filter((k: string) => k && k.length > 10);
    } else if (config.API_KEY) {
        apiKeys = [config.API_KEY];
    }

    if (apiKeys.length === 0) return "System Error: No valid API Key configured in index.html";

    // 2. Prepare Context
    let providersListString = "Info unavailable.";
    try {
        const { data } = await supabase.from('providers').select('name, service_type, location, latitude, longitude, provider_services(name,price,discount_price)');
        if(data) providersListString = JSON.stringify(data);
    } catch(e) {}

    const systemInstruction = `You are TangerConnect AI, a helpful city assistant for Tangier, Morocco. 
    Language: ${language} (Reply in this language). 
    User: ${userName || 'Guest'}. 
    Providers Data: ${providersListString}. 
    Announcements: ${announcementsText}.
    
    Your goal is to help users find services, book appointments, and answer questions about Tangier.
    Be polite, concise, and helpful.
    `;

    const userParts: any[] = [];
    if (newMessage) userParts.push({ text: newMessage });
    if (image) userParts.push({ inlineData: { data: image.base64, mimeType: image.mimeType } });
    if (audio) userParts.push({ inlineData: { data: audio.base64, mimeType: audio.mimeType } });

    const contents = [...history, { role: 'user', parts: userParts }];

    // 3. FAIL-SAFE ROTATION LOOP
    // Iterate through all keys. Return immediately on success. Catch errors and continue to next key.
    for (let i = 0; i < apiKeys.length; i++) {
        const apiKey = apiKeys[i];
        
        try {
            // console.log(`Attempting Gemini Request with Key Index: ${i + 1}/${apiKeys.length}`);
            
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: contents,
                config: { systemInstruction },
            });
            
            // If we get here, it worked! Return immediately.
            return response.text; 

        } catch (error: any) {
            console.warn(`Key #${i + 1} Failed:`, error.message || error);
            
            // If this was the last key, and it failed, then we are truly out of options.
            if (i === apiKeys.length - 1) {
                console.error("All 5 API keys exhausted.");
                return language === 'ar' 
                    ? "⚠️ عذراً، نواجه ضغطاً كبيراً على السيرفرات حالياً. المرجو المحاولة بعد دقيقة." 
                    : "⚠️ Server busy (Rate Limit). Please try again in a moment.";
            }
            
            // If not the last key, loop continues to next 'i' automatically.
        }
    }

    return "Error: Unknown connection failure.";
};
