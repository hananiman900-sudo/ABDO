
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
        // STRICT INSTRUCTION: Use bio only
        systemInstruction = `You are ${targetProvider.name}, a ${targetProvider.service_type}.
        Language: ${language}.
        
        YOUR KNOWLEDGE BASE IS STRICTLY THIS BIO: "${targetProvider.bio || 'I am a professional in Tangier.'}"
        
        BEHAVIOR:
        1. Answer strictly based on your BIO.
        2. If user asks about appointments, ask for preferred date/time.
        3. Once agreed, output JSON for booking.
        
        BOOKING JSON FORMAT:
        { "bookingConfirmed": true, "provider": "${targetProvider.name}", "service": "${targetProvider.service_type}", "message": "Booking Confirmed! Please show this QR code." }
        `;
    } else {
        // GENERAL MODE: City Assistant
        systemInstruction = `You are TangerConnect AI (طنجة كونكت).
        Language: ${language}.
        
        TASKS:
        1. Help with Tangier city services.
        2. Recommend providers from this list: ${providersContext}.
        
        3. MEDICAL/DENTAL SCENARIO: 
           - If user says "My tooth hurts", ask for a photo.
           - If photo provided, analyze and suggest a dentist from the list.
           
        4. BOOKING RESPONSE:
           If confirming a booking, output STRICTLY JSON:
           { "bookingConfirmed": true, "provider": "Name", "service": "Type", "message": "Booking Confirmed." }
        `;
    }

    const userParts: any[] = [{ text: newMessage }];
    if (image) userParts.push({ inlineData: { data: image.base64, mimeType: image.mimeType } });

    const contents = [...history, { role: 'user', parts: userParts }];

    // LOAD BALANCING & FAILOVER LOGIC
    // 1. Pick a RANDOM start index to distribute load across all 5 keys
    // This prevents Key #1 from hitting the rate limit while Key #5 is idle.
    const startIndex = Math.floor(Math.random() * apiKeys.length);

    for (let i = 0; i < apiKeys.length; i++) {
        // Calculate the actual index using modulo to wrap around
        const index = (startIndex + i) % apiKeys.length;
        const apiKey = apiKeys[index];

        try {
            console.log(`[AI System] Attempting with Key #${index + 1} (Start: ${startIndex})`);
            
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: contents,
                config: { systemInstruction },
            });
            
            // If successful, return immediately
            return response.text; 

        } catch (error: any) {
            console.warn(`[AI System] Key #${index + 1} failed. Trying next...`, error);
            
            // If this was the last key to try, return error
            if (i === apiKeys.length - 1) {
                return "⚠️ Server Busy: All AI models are currently at capacity. Please try again in a few seconds.";
            }
        }
    }
    return "Error: Connection failure.";
};
