
import { GoogleGenAI } from "@google/genai";
import { Language } from "../types";
import { supabase } from "./supabaseClient";

// Do not initialize globally to prevent crash on load if key is missing
// const API_KEY = process.env.API_KEY;

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
4.  **Analyze User Input:** If the user uploads an image, analyze it for context (e.g., a dental problem suggests needing a dentist).
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
  userId?: number,
  announcementsText: string = ""
): Promise<string> => {
  try {
    // Check Environment Variable first (from index.html window.process)
    let API_KEY = '';
    
    // 1. Try the injected window.process (from index.html)
    if (typeof window !== 'undefined' && (window as any).process?.env?.API_KEY) {
      API_KEY = (window as any).process.env.API_KEY;
    }
    
    // 2. Try standard process.env (if build tool replaces it)
    if (!API_KEY && typeof process !== 'undefined' && process.env?.API_KEY) {
      API_KEY = process.env.API_KEY;
    }

    // 3. Try LocalStorage (user entered key)
    if (!API_KEY && typeof window !== 'undefined') {
        API_KEY = localStorage.getItem('gemini_api_key') || '';
    }

    if (!API_KEY) {
        console.error("API_KEY environment variable is not set");
        return "MISSING_API_KEY_ERROR";
    }
    
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const { data: providers, error: providersError } = await supabase
      .from('providers')
      .select('name, service_type, location');
    
    if (providersError) throw new Error("Failed to fetch provider data.");
    
    const providersListString = providers && providers.length > 0
        ? providers.map(p => 
            `- Provider: ${p.name}, Service: ${p.service_type}, Location: ${p.location}`
          ).join('\n')
        : "There are currently no service providers registered in the system. Inform the user about this and tell them to check back later.";

    let upcomingAppointmentsString = "None";
    if (userId) {
        const { data: appointments, error: appointmentsError } = await supabase
            .from('follow_ups')
            .select('next_appointment_date, providers(name)')
            .eq('client_id', userId)
            .gt('next_appointment_date', new Date().toISOString());

        if (appointments && appointments.length > 0) {
            upcomingAppointmentsString = appointments.map(a => 
                `- Appointment with ${a.providers.name} on ${new Date(a.next_appointment_date).toLocaleString()}`
            ).join('\n');
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

    const contents = [...history, { role: 'user', parts: userParts }];
    // Add user ID to system instruction context if available
    const finalSystemInstruction = userId 
        ? `${systemInstruction}\n\nUSER_CONTEXT: The current user's ID is ${userId}. They are a registered client.`
        : `${systemInstruction}\n\nUSER_CONTEXT: The user is not registered yet. You must guide them through the registration flow if they wish to book or create a profile.`;


    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: finalSystemInstruction,
      },
    });
    
    return response.text;
  } catch (error) {
    console.error("Error in generateContent:", error);
    return "سمح لينا، وقع شي مشكل فالاتصال بالذكاء الاصطناعي. عافاك تأكد من API Key.\n\nError connecting to AI service.";
  }
};
