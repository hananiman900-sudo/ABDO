
import { GoogleGenAI } from "@google/genai";
import { Language } from "../types";
import { supabase } from "./supabaseClient";

// --- DARIJA SYSTEM PROMPT ---
const MOROCCAN_SYSTEM_INSTRUCTION = `
Role: You are "TangerConnect AI", a smart, friendly assistant for services in Tangier, Morocco.
Language: Speak purely in Moroccan Darija (Maghribi). Use Latin script (e.g., 'kifach', 'mzyan') or Arabic script (الدارجة) based on the user's input script.
Personality: Helpful, polite, enthusiastic, slightly informal but professional.

Key Behaviors:
1.  **Greetings:** If the user says "Salam", "Hi", "Ahlan", reply warmly: "Wa 3alaykom Salam! Merhba bik f TangerConnect. Kifach n9der n3awnek lyoma?" (or equivalent in Arabic).
2.  **General Help:** If they say "Can you help?", "Momkin t3aweni", reply: "Darori! Ana hna bach nsa3dek tl9a ay khidma f Tanja (Tbib, Plombier, Immobilier...)."
3.  **Specific Provider Queries:** You will be provided with [CONTEXT DATA] about a specific professional. 
    *   INTEGRATE this data into your natural conversation. 
    *   Do NOT just dump the data. 
    *   If user asks "Chhal taman?" (Price?), look at 'Price Info'. If found, say: "Taman howa [Price]. Wach baghi takhod rdv?"
    *   If user asks "Fin kayn?" (Location?), look at 'Location Info'. If found, say: "Kayn f [Location]. N3tik localisation?"
    *   If information is MISSING in context, say politely: "Smahli, ma3ndich had lma3loma daba. Momkin tatasel bihom f Nmrra: [Phone]."

4.  **Handling Audio Transcripts:** If the input is a transcript of an audio message, treat it exactly like text. Understand the intent and reply in text.

5.  **Booking:** If user wants to book, guide them to click the "📅 حجز موعد" button if available, or ask for their name/time to generate a booking code.
`;

export const getChatResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string,
  language: Language,
  image?: { base64: string; mimeType: string; },
  audio?: { base64: string; mimeType: string; }, // NEW: Audio Input Support
  userId?: number,
  userName?: string,
  targetProvider?: any 
): Promise<string> => {
    
    // --- 1. HANDLE IMAGE LOCALLY (Feedback only) ---
    // In a real app, we'd send this to Gemini Vision, but for now we acknowledge receipt.
    if (image && !newMessage && !audio) {
        return "📸 wslat tswira! ghadi ychoufha lmohni 9rib.";
    }

    // --- 2. PREPARE CONTEXT & SYSTEM INSTRUCTION ---
    let systemInstruction = MOROCCAN_SYSTEM_INSTRUCTION;
    let providerContext = "";

    if (targetProvider) {
        // Construct a rich context string
        providerContext = `
        [CURRENT PROVIDER CONTEXT]
        Name: ${targetProvider.name}
        Service: ${targetProvider.service_type}
        Phone: ${targetProvider.phone}
        
        [SPECIFIC DATA - USE THIS TO ANSWER]:
        - Prices (Atmina): ${targetProvider.price_info || "Not specified (Goul lihom itaslo)"}
        - Location (Maw9i3): ${targetProvider.location_info || "Not specified"}
        - Hours (Taw9it): ${targetProvider.working_hours || "Not specified"}
        - Booking Rules: ${targetProvider.booking_info || "Not specified"}
        - Extra Details: ${targetProvider.custom_ai_instructions || ""}
        - Bio: ${targetProvider.bio || ""}
        `;
        
        systemInstruction += providerContext;
    } else {
        // General Assistant Mode - Inject Directory Data
        try {
            const { data } = await supabase.from('providers').select('name, service_type, location').limit(10);
            if (data) {
                const directorySummary = data.map(p => `- ${p.name} (${p.service_type}) f ${p.location}`).join('\n');
                systemInstruction += `\n[DIRECTORY SAMPLE]:\n${directorySummary}\n(If user asks for something else, say you can help find it).`;
            }
        } catch(e) {}
    }

    // --- 3. BUILD CONTENT PARTS ---
    const userParts: any[] = [];
    
    // Add Text
    if (newMessage) {
        userParts.push({ text: newMessage });
    }
    
    // Add Audio (Multimodal)
    if (audio) {
        userParts.push({
            inlineData: {
                mimeType: audio.mimeType,
                data: audio.base64
            }
        });
        // Hint to AI that this is an audio message
        userParts.push({ text: "[System: The user sent an audio message. Listen to it and reply in text.]" });
    }

    // Add Image (Multimodal)
    if (image) {
        userParts.push({
            inlineData: {
                mimeType: image.mimeType,
                data: image.base64
            }
        });
    }

    // Reduce context to save tokens (Last 5 turns)
    const limitedHistory = history.slice(-5); 
    const contents = [...limitedHistory, { role: 'user', parts: userParts }];

    try {
        // FIX: Use process.env.API_KEY exclusively as per GenAI guidelines.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // FIX: Updated to 'gemini-3-flash-preview' for multimodal support and followed guidelines for maxOutputTokens + thinkingBudget.
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview", 
            contents: contents,
            config: { 
                systemInstruction,
                maxOutputTokens: 300, // Fixed: Added thinkingBudget below because maxOutputTokens is set.
                thinkingConfig: { thinkingBudget: 100 },
                temperature: 0.7, // Higher temp for more natural/creative conversation
            },
        });
        
        return response.text || "Smahli, ma sma3tch mzyan. 3awd 9olha?"; 

    } catch (error: any) {
        console.error("AI Error:", error);
        return "⚠️ Kayn mochkil f itisal. Hawl mra khra.";
    }
};
