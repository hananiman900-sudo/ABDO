
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
    let apiKeys: string[] = config.API_KEYS || [];
    
    // Fallback if config is missing (using the keys you provided to ensure they work)
    if (!apiKeys || apiKeys.length === 0) {
        apiKeys = [
          'AIzaSyD0WW8wQ9IXKwPqENLJfUwiiL0NCWnDb48',
          'AIzaSyDPzeKphFk1yHnztG1RJ8nm4CBRbG_ILDU',
          'AIzaSyA9HwY4o-ecSguVOixMuo7vNZgWzFJZTSA',
          'AIzaSyB1-FA-Cuk1mxwU8sVE_LYyi_pqjcOqK94',
          'AIzaSyBRMjMrd5mfGDWLZSF-tEA7u_s3NG-bVvk'
        ];
    }

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

    // LOAD BALANCING LOGIC: Shuffle keys to distribute load
    // This creates a random order for this specific request
    const shuffledKeys = [...apiKeys].sort(() => 0.5 - Math.random());

    for (let i = 0; i < shuffledKeys.length; i++) {
        const apiKey = shuffledKeys[i];
        
        try {
            // Add a small delay for retries (except the first attempt) to avoid hitting Google's rate limiter too hard
            if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 1500));
            }

            const ai = new GoogleGenAI({ apiKey });
            
            // Note: Safety settings are implicit in the new SDK or handled via config if available.
            // We use standard generation here.
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: contents,
                config: { 
                    systemInstruction,
                    temperature: 0.7, // Add temperature for more stable responses
                },
            });
            
            // If successful, return immediately
            return response.text; 

        } catch (error: any) {
            console.warn(`[AI System] Key ${i+1}/${shuffledKeys.length} failed.`, error.message);
            
            // If this was the last key to try, return error
            if (i === shuffledKeys.length - 1) {
                return "⚠️ Server Busy: All AI models are currently at capacity. Please try again in a few seconds.";
            }
            // Otherwise loop continues to next key after a delay
        }
    }
    return "Error: Connection failure.";
};
