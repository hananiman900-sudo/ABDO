
import { GoogleGenAI } from "@google/genai";
import { Language } from "../types";
import { supabase } from "./supabaseClient";

const getSystemInstruction = (language: Language, providersList: string, upcomingAppointments: string, announcements: string) => {
  const commonInstructions = `
You are 'TangerConnect', a helpful AI assistant for the city of Tangier. Your responses should be concise, natural, and directly answer the user's question.

**Core Instructions:**
1.  **Registration Flow (for new users):**
    - New users can chat as guests for general inquiries. If a guest wants to perform an action that requires an account (like booking, creating a medical profile), you must guide them to register. You can suggest they use the "Login / Register" button in the app.
    - Alternatively, you can handle registration conversationally. If you do, your first step is to ask if they want to register as a 'Client' or a 'Service Provider'.
    - **If they choose Client:** Ask for their full name, phone number, and a password. Once you have these three details, respond ONLY with the following JSON structure.
\`\`\`json
{
  "action": "REGISTER_USER",
  "details": {
    "fullName": "...",
    "phone": "...",
    "password": "..."
  }
}
\`\`\`
    - **If they choose Provider:** Ask for their business name, service type, location, a desired username, a contact phone number (important for activation), and a password. Mention that there is a 50 DH subscription fee. Once you have these six details, respond ONLY with the following JSON structure.
\`\`\`json
{
  "action": "REGISTER_PROVIDER",
  "details": {
    "name": "...",
    "service": "...",
    "location": "...",
    "username": "...",
    "phone": "...",
    "password": "..."
  }
}
\`\`\`
2.  **Role Change (for existing clients):**
    - If a registered user (User ID is provided) asks to become a provider (e.g., "I want to be a provider", "change my status"), initiate the provider registration flow.
    - Inform them about the 50 DH fee.
    - Ask for service type, location, username, contact phone, and password.
    - Then, respond with the 'REGISTER_PROVIDER' JSON action as described above.

3.  **Appointment Reminders:** At the start of a conversation with a registered user, check the list of their upcoming appointments. If any appointment is within the next 24 hours, remind them in your first message. Example: "Welcome back, [Name]! Just a friendly reminder you have an appointment with [Provider] tomorrow."
4.  **Analyze User Input:** 
    - If the user uploads an image, analyze it for context (e.g., a dental problem suggests needing a dentist).
    - **If the user sends AUDIO:** Listen carefully to the request. The user might be speaking in Darija, Arabic, French, or English. Transcribe the intent internally and respond accordingly.
5.  **Recommend Services & Announcements:**
    - When a user asks for a service, check the list of available providers.
    - **Check the Announcements section.** If a provider has an active announcement (discount, news), MENTION IT to the user as a "Special Offer" or "Update".
    - **Do NOT list all providers.** Find 1-2 relevant providers.
    - Summarize the options conversationally.
6.  **Booking Flow:**
    - Offer to book appointments with a 19% discount.
    - To book, you already have the user's name and phone. Just confirm the booking.
    - Confirm the booking by responding ONLY with the following JSON structure.
\`\`\`json
{
  "action": "BOOKING_CONFIRMED",
  "details": {
    "name": "...",
    "phone": "...",
    "service": "...",
    "provider": "...",
    "location": "...",
    "discount": "19%"
  }
}
\`\`\`
7.  **Medical Follow-up Profile:**
    - If a user wants to track an appointment or create a medical file, engage in a conversation to get the details.
    - Ask for: provider's name, the date/time of the next appointment, and any notes or medication photos.
    - Once you have the details, respond ONLY with the following JSON structure.
\`\`\`json
{
  "action": "FOLLOW_UP_CREATED",
  "details": {
    "providerName": "...",
    "nextAppointmentDate": "YYYY-MM-DD HH:MM:SS",
    "notes": "..."
  }
}
\`\`\`
8.  **Health Inquiries:** Act like a preliminary triage nurse. Be empathetic. **Never give a definitive diagnosis.** Always recommend seeing a real doctor from the list.
`;

  const langMap = {
    [Language.AR]: {
      langName: "Moroccan Darija",
      prompt: `
${commonInstructions}
9.  **اللغة:** هضر بالدارجة المغربية. كون محترف وعاونو مزيان.

**المزودين لي كاينين:**
---
${providersList}
---
**إعلانات وعروض المزودين:**
---
${announcements}
---
**المواعيد الجاية ديال المستخدم:**
---
${upcomingAppointments}
---
`
    },
    [Language.EN]: {
      langName: "English",
      prompt: `
${commonInstructions}
9.  **Language:** Speak in English. Be professional and helpful.

**Available Providers:**
---
${providersList}
---
**Provider Announcements:**
---
${announcements}
---
**User's Upcoming Appointments:**
---
${upcomingAppointments}
---
`
    },
    [Language.FR]: {
      langName: "French",
      prompt: `
${commonInstructions}
9.  **Langue :** Parlez en français. Soyez professionnel et serviable.

**Fournisseurs disponibles :**
---
${providersList}
---
**Annonces des fournisseurs :**
---
${announcements}
---
**Rendez-vous à venir de l'utilisateur :**
---
${upcomingAppointments}
---
`
    }
  };
  return langMap[language].prompt;
};

export const getChatResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string,
  language: Language,
  image?: { base64: string; mimeType: string; },
  audio?: { base64: string; mimeType: string; },
  userId?: number,
  announcementsText: string = ""
): Promise<string> => {
  try {
    // FIX: Properly access API Key from window object if process is undefined in browser
    const apiKey = (window as any).process?.env?.API_KEY;
    if (!apiKey) throw new Error("API Key missing. Check index.html configuration.");

    const ai = new GoogleGenAI({ apiKey });

    // FIX: Graceful degradation for Supabase errors
    // If tables don't exist yet, we shouldn't crash the whole AI request.
    let providersListString = "Information unavailable.";
    try {
        const { data: providers, error: providersError } = await supabase
        .from('providers')
        .select('name, service_type, location');
        
        if (!providersError && providers) {
             providersListString = providers.length > 0
                ? providers.map(p => `- Provider: ${p.name}, Service: ${p.service_type}, Location: ${p.location}`).join('\n')
                : "No registered providers yet.";
        } else {
            console.warn("Provider fetch skipped or failed (ignoring for chat):", providersError?.message);
        }
    } catch (e) {
        console.warn("Supabase access failed", e);
    }

    let upcomingAppointmentsString = "None";
    if (userId) {
        try {
            const { data: appointments } = await supabase
                .from('follow_ups')
                .select('next_appointment_date, providers(name)')
                .eq('client_id', userId)
                .gt('next_appointment_date', new Date().toISOString());

            if (appointments && appointments.length > 0) {
                upcomingAppointmentsString = appointments.map(a => 
                    `- Appointment with ${a.providers.name} on ${new Date(a.next_appointment_date).toLocaleString()}`
                ).join('\n');
            }
        } catch (e) {
             console.warn("Appointments fetch skipped", e);
        }
    }

    const systemInstruction = getSystemInstruction(language, providersListString, upcomingAppointmentsString, announcementsText);
    
    const userParts: any[] = [];
    if (newMessage) userParts.push({ text: newMessage });
    
    if (image) {
      userParts.push({
        inlineData: {
          data: image.base64,
          mimeType: image.mimeType,
        },
      });
    }

    if (audio) {
        userParts.push({
            inlineData: {
                data: audio.base64,
                mimeType: audio.mimeType
            }
        });
    }

    const contents = [...history, { role: 'user', parts: userParts }];
    const finalSystemInstruction = userId 
        ? `${systemInstruction}\n\nUSER_CONTEXT: The current user's ID is ${userId}. They are a registered client.`
        : `${systemInstruction}\n\nUSER_CONTEXT: The user is not registered yet.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: finalSystemInstruction,
      },
    });
    
    return response.text;
  } catch (error: any) {
    console.error("Error in generateContent:", error);
    let detail = "";
    if (error.message) detail = `Details: ${error.message}`;
    return `سمح لينا، وقع شي مشكل فالاتصال بالذكاء الاصطناعي.\nSorry, I encountered an error connecting to the AI service.\n\n${detail}`;
  }
};
