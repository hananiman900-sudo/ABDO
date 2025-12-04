
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
    
    // FAILOVER SYSTEM: Get Keys from Config
    const config = (window as any).TANGER_CONFIG || {};
    const apiKeys: string[] = config.API_KEYS || [];
    
    if (!apiKeys || apiKeys.length === 0) return "System Error: No API Keys configured.";

    // Fetch Providers List (only if we are in general mode, otherwise we know who we are talking to)
    let providersContext = "No data";
    if (!targetProvider) {
        try {
            const { data } = await supabase.from('providers').select('name, service_type, location, id, bio, social_links');
            if(data) providersContext = JSON.stringify(data);
        } catch(e) {}
    }

    // DYNAMIC SYSTEM INSTRUCTION
    let systemInstruction = "";

    if (targetProvider) {
        // PERSONA MODE: AI acts as the specific Provider
        systemInstruction = `You are ${targetProvider.name}, a professional ${targetProvider.service_type} located in ${targetProvider.location}, Tangier.
        Language: ${language}.
        User: ${userName || 'Guest'}.
        
        Your Goal: Answer questions about your service, your offers, and help the user book an appointment.
        Bio: ${targetProvider.bio || 'Not available'}.
        
        BEHAVIOR:
        - Be professional, polite, and helpful.
        - If the user asks for an appointment, ask for their preferred time/date.
        - Once details are clear, output a JSON for booking.
        
        BOOKING JSON FORMAT:
        If the user agrees to book, output STRICTLY this JSON (no other text):
        { "bookingConfirmed": true, "provider": "${targetProvider.name}", "service": "${targetProvider.service_type}", "message": "تم تأكيد الموعد مع ${targetProvider.name}. المرجو إظهار الرمز عند الوصول." }
        `;
    } else {
        // GENERAL MODE: City Assistant
        systemInstruction = `You are TangerConnect AI (طنجة كونكت), a helpful city assistant.
        Language: ${language} (Default to Arabic). 
        User: ${userName || 'Guest'}.
        
        TASKS:
        1. GENERAL: Help users with services, locations, and advice in Tangier.
        2. PROVIDERS: You have access to a list of providers: ${providersContext}. Recommend them when asked.
        
        3. MEDICAL/DENTAL SCENARIO: 
           - If user says "My tooth hurts", ask for a photo.
           - If photo provided, analyze and suggest a dentist from the list.
           - Suggest booking via the specific dentist's chat.
           
        4. BOOKING RESPONSE:
           If confirming a booking, output STRICTLY JSON:
           { "bookingConfirmed": true, "provider": "Name", "service": "Type", "message": "تم الحجز! المرجو إظهار هذا الرمز." }
        
        Reply naturally in ${language}.
        `;
    }

    const userParts: any[] = [{ text: newMessage }];
    if (image) userParts.push({ inlineData: { data: image.base64, mimeType: image.mimeType } });

    const contents = [...history, { role: 'user', parts: userParts }];

    // ROUND ROBIN / FAILOVER LOGIC
    for (let i = 0; i < apiKeys.length; i++) {
        const apiKey = apiKeys[i];
        try {
            console.log(`Attempting with Key #${i + 1}`);
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: contents,
                config: { systemInstruction },
            });
            return response.text; // Success, return immediately
        } catch (error) {
            console.warn(`Key #${i + 1} failed. Trying next...`, error);
            if (i === apiKeys.length - 1) return "Error: All AI services are currently busy. Please try again later.";
        }
    }
    return "Error: Connection failure.";
};
