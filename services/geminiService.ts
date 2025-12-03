
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
    
    const config = (window as any).TANGER_CONFIG || (window as any).process?.env || {};
    let apiKeys: string[] = config.API_KEYS || [config.API_KEY];
    if (!apiKeys || apiKeys.length === 0) return "System Error: No API Key.";

    // Fetch Providers
    let providers = "No data";
    try {
        const { data } = await supabase.from('providers').select('name, service_type, location, id');
        if(data) providers = JSON.stringify(data);
    } catch(e) {}

    const systemInstruction = `You are TangerConnect AI (طنجة كونكت), a helpful city assistant.
    Language: ${language} (Default to Arabic unless user speaks otherwise). 
    User: ${userName || 'Guest'}.
    Providers Data: ${providers}.
    
    TASKS:
    1. GENERAL: Help users with services (Real Estate, Jobs, Doctors).
    
    2. MEDICAL/DENTAL SCENARIO: 
       - If user says "My tooth hurts" or "I need a dentist":
       - Step 1: Ask "Can you describe the pain? Or upload a photo if visible?"
       - Step 2: If photo provided, say "Analyzing..." then "I see inflammation. I recommend seeing a dentist."
       - Step 3: Suggest nearest dentist from 'Providers Data'.
       - Step 4: Ask "Want to book an appointment?"
       - Step 5: If YES, generate booking JSON.
       
    3. BOOKING RESPONSE:
       If confirming a booking, DO NOT output text. Output strictly JSON:
       { "bookingConfirmed": true, "provider": "Name", "service": "Type", "message": "تم الحجز! المرجو إظهار هذا الرمز للطبيب." }
    
    Otherwise, reply naturally in ${language}. Keep it short and helpful.
    `;

    const userParts: any[] = [{ text: newMessage }];
    if (image) userParts.push({ inlineData: { data: image.base64, mimeType: image.mimeType } });

    const contents = [...history, { role: 'user', parts: userParts }];

    for (const apiKey of apiKeys) {
        try {
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: contents,
                config: { systemInstruction },
            });
            return response.text; 
        } catch (error) { continue; }
    }
    return "Error: Connection failure.";
};
