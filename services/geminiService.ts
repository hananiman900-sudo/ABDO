
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
  userPhone?: string,
  announcementsText: string = "",
  userLocation?: { lat: number, lng: number }
): Promise<string> => {
    
    // 1. Get Keys
    const config = (window as any).TANGER_CONFIG || (window as any).process?.env || {};
    let apiKeys: string[] = config.API_KEYS || [config.API_KEY];
    if (!apiKeys || apiKeys.length === 0) return "System Error: No API Key.";

    // 2. Context
    let providersListString = "Info unavailable.";
    try {
        const { data } = await supabase.from('providers').select('name, service_type, location, id');
        if(data) providersListString = JSON.stringify(data);
    } catch(e) {}

    const systemInstruction = `You are TangerConnect AI, a smart assistant for Tangier.
    Language: ${language}. User: ${userName || 'Guest'}.
    Providers: ${providersListString}.
    
    ROLE:
    1. Help users find services (Doctors, Plumbers, etc.).
    2. VISUAL ANALYSIS: If a user has a problem (e.g., toothache), ask them to upload a photo. Analyze the photo and suggest the nearest specialist.
    3. BOOKING: If a user wants to visit a provider, Offer to "Book Appointment".
    
    IMPORTANT JSON OUTPUT FOR BOOKING:
    If the user confirms they want to book/visit a provider, you MUST return a JSON object ONLY:
    {
      "bookingConfirmed": true,
      "provider": "Provider Name",
      "service": "Service Name",
      "location": "Location",
      "discount": "10% Off",
      "message": "Appointment Confirmed! Show this QR code."
    }
    
    Otherwise, reply naturally in ${language}.
    `;

    const userParts: any[] = [];
    if (newMessage) userParts.push({ text: newMessage });
    if (image) userParts.push({ inlineData: { data: image.base64, mimeType: image.mimeType } });
    if (audio) userParts.push({ inlineData: { data: audio.base64, mimeType: audio.mimeType } });

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