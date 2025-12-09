
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
        1. **BE HUMAN & NATURAL:** Do NOT act like a robot reading a script. Be warm, professional, and concise.
        2. **ANSWER ONLY THE QUESTION:** If the user asks "Where are you?", ONLY give the location. Do NOT list your services or prices unless asked.
        3. **DO NOT DUMP INFO:** Never copy/paste the entire "Knowledge Base". Use it only as a reference to find facts.
        4. **UNKNOWN INFO:** If the user asks something not in your Knowledge Base, say nicely that you don't know and ask for their phone number to call them back.
        5. **booking:** If the user wants an appointment, ask for their preferred date/time. Once agreed, output the JSON below.

        JSON FORMAT FOR BOOKING (Only output this when booking is confirmed):
        { "bookingConfirmed": true, "provider": "${targetProvider.name}", "service": "${targetProvider.service_type}", "message": "Booking Confirmed! Please show this QR code." }
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
        2. **RECOMMENDATIONS:** If a user needs a service (e.g., "I need a plumber"), look at the PROVIDERS DATA and recommend specific names.
        3. **MEDICAL:** If user says "My tooth hurts", suggest they visit a dentist from the list (if available).
        4. **CONCISENESS:** Keep answers short and direct. Do not write long paragraphs.

        JSON FORMAT (Only if you confirm a booking on behalf of a provider):
        { "bookingConfirmed": true, "provider": "Name", "service": "Type", "message": "Booking Confirmed." }
        `;
    }

    const userParts: any[] = [{ text: newMessage }];
    if (image) userParts.push({ inlineData: { data: image.base64, mimeType: image.mimeType } });

    const contents = [...history, { role: 'user', parts: userParts }];

    try {
        // DIRECTLY USING THE PROVIDED API KEY TO PREVENT CONNECTION ERRORS
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
                temperature: 0.7, // Slightly higher for more natural/creative responses
            },
        });
        
        return response.text || "No response generated."; 

    } catch (error: any) {
        console.error("AI Error Detailed:", error);
        return `⚠️ عذراً، هناك مشكلة في الاتصال بالخادم. (Error: ${error.message || 'Unknown'})`;
    }
};
