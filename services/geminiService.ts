
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
  userName?: string
): Promise<string> => {
    
    // FAILOVER SYSTEM: Get Keys from Config
    const config = (window as any).TANGER_CONFIG || {};
    const apiKeys: string[] = config.API_KEYS || [];
    
    if (!apiKeys || apiKeys.length === 0) return "System Error: No API Keys configured.";

    // Fetch Providers & User Stats if needed
    let providers = "No data";
    try {
        const { data } = await supabase.from('providers').select('name, service_type, location, id, bio, social_links');
        if(data) providers = JSON.stringify(data);
    } catch(e) {}

    const systemInstruction = `You are TangerConnect AI (طنجة كونكت), a helpful city assistant.
    Language: ${language} (Default to Arabic unless user speaks otherwise). 
    User: ${userName || 'Guest'}.
    
    TASKS:
    1. GENERAL: Help users with services, locations, and advice.
    2. PROVIDERS: You have access to a list of providers: ${providers}. Use this to recommend people. If a provider has social links or GPS, share them when asked.
    
    3. MEDICAL/DENTAL SCENARIO: 
       - If user says "My tooth hurts" or "I need a dentist":
       - Step 1: Ask "Can you describe the pain? Or upload a photo if visible?"
       - Step 2: If photo provided, say "Analyzing..." then "I see inflammation. I recommend seeing a dentist."
       - Step 3: Suggest nearest dentist from 'Providers Data'.
       - Step 4: Ask "Want to book an appointment?"
       - Step 5: If YES, generate booking JSON.
       
    4. BOOKING RESPONSE:
       If confirming a booking, DO NOT output text. Output strictly JSON:
       { "bookingConfirmed": true, "provider": "Name", "service": "Type", "message": "تم الحجز! المرجو إظهار هذا الرمز للطبيب." }
    
    Reply naturally in ${language}. Keep it short and helpful.
    `;

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
