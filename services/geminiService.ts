
import { GoogleGenAI } from "@google/genai";
import { Language } from "../types";
import { supabase } from "./supabaseClient";

// Haversine Formula to calculate distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

const getSystemInstruction = (language: Language, providersList: string, upcomingAppointments: string, announcements: string, userContext: string, userLocationString: string) => {
  const commonInstructions = `
You are 'TangerConnect', a helpful AI assistant for the city of Tangier. Your responses should be concise, natural, and directly answer the user's question.

**Core Instructions:**
1.  **Registration Flow:** Handle client/provider registration.
2.  **Appointment Reminders:** Remind users of upcoming appointments.
3.  **Analyze Input:** Handle text, images, and audio.
4.  **Recommend Services & Announcements:**
    - When a user asks for a service, check the list of available providers.
    - Use the **Distance** information provided to recommend the nearest provider.
    - Explicitly mention the distance (e.g., "Dr. X is 300 meters away").
    - Provide the Google Maps link if available.
    - **CHECK FOR OFFERS:** If a provider service has a 'Discount Price', YOU MUST mention it. (e.g. "Dr. X has Teeth Whitening for 1500DH instead of 2000DH").
    - Mention active announcements/discounts.
5.  **Booking Flow:** 
    - Offer to book appointments with a discount.
    - **IMPORTANT:** When you confirm a booking, you **MUST** return the JSON in the EXACT format below. Do NOT use any other key like "BOOKING_CONFIRMED" at the root level.
\`\`\`json
{
  "action": "BOOKING_CONFIRMED",
  "details": {
    "name": "User Name",
    "phone": "User Phone",
    "service": "Service Name",
    "provider": "Provider Name",
    "location": "Provider Location",
    "discount": "Price/Discount details"
  }
}
\`\`\`
6.  **Medical Follow-up:** Create follow-ups with JSON 'FOLLOW_UP_CREATED'.
7.  **Geolocation:** 
    - User Location: ${userLocationString}
    - If the user asks for the nearest provider, prioritize by distance.

**USER CONTEXT:**
${userContext}
`;

  const langMap = {
    [Language.AR]: {
      langName: "Moroccan Darija",
      prompt: `
${commonInstructions}
8.  **اللغة:** هضر بالدارجة المغربية. 
    - استعمل معلومات المسافة باش تنصح الكليان (مثلاً: "كاين الطبيب فلان قريب ليك بـ 200 متر").
    - **العروض:** ضروري تذكر التخفيضات يلا كانت (مثلاً: "عندهم برومو ف تبييض الأسنان ب 1500 درهم").
    - استعمل وصف الخدمات وال Bio باش تجاوب بدقة.

**المزودين (مع المسافة والخدمات والعروض):**
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
8.  **Language:** Speak in English.
    - Use distance info to recommend nearest providers.
    - **OFFERS:** You must mention discounts if listed in the services.
    - Use detailed service info and Bio.

**Available Providers (with Distance & Services):**
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
8.  **Langue :** Parlez en français.
    - Utilisez les informations de distance pour recommander les fournisseurs les plus proches.
    - **OFFRES:** Mentionnez impérativement les réductions si elles existent.
    - Utilisez les informations détaillées sur les services et la Bio.

**Fournisseurs disponibles (avec Distance & Services) :**
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
  userName?: string,
  userPhone?: string,
  announcementsText: string = "",
  userLocation?: { lat: number, lng: number }
): Promise<string> => {
    // Access configuration from global window object
    // Using TANGER_CONFIG to avoid Vercel/bundlers stripping 'process.env'
    const config = (window as any).TANGER_CONFIG || (window as any).process?.env || {};
    
    // Support multiple keys for redundancy
    let apiKeys: string[] = [];
    if (config.API_KEYS && Array.isArray(config.API_KEYS)) {
        // Filter out placeholders or empty strings
        apiKeys = config.API_KEYS.filter((k: string) => k && k.length > 20 && !k.includes('PLACE_YOUR_KEY'));
    } else if (config.API_KEY) {
        apiKeys = [config.API_KEY];
    }

    if (apiKeys.length === 0) {
        console.error("No valid API Keys found in config.");
        return "System Error: No valid API Key configured in index.html";
    }

    // --- PREPARE DATA ONCE ---
    let providersListString = "Information unavailable.";
    let userLocationString = "User location not available (GPS off).";

    if (userLocation) {
        userLocationString = `User Coordinates: ${userLocation.lat}, ${userLocation.lng}`;
    }

    try {
        // Fetch providers with their services
        const { data: providers, error: providersError } = await supabase
        .from('providers')
        .select(`
            id, name, service_type, location, latitude, longitude, bio, 
            provider_services (name, price, discount_price)
        `);
        
        if (!providersError && providers) {
             // Process providers: calculate distance and format string
             const processedProviders = providers.map((p: any) => {
                 let distString = "Distance unknown";
                 let distVal = 999999;
                 
                 if (userLocation && p.latitude && p.longitude) {
                     const km = calculateDistance(userLocation.lat, userLocation.lng, p.latitude, p.longitude);
                     distVal = km;
                     if (km < 1) {
                         distString = `${Math.round(km * 1000)} meters away`;
                     } else {
                         distString = `${km.toFixed(2)} km away`;
                     }
                 }

                 const servicesStr = p.provider_services && p.provider_services.length > 0
                    ? p.provider_services.map((s: any) => {
                        if (s.discount_price) {
                            return `[OFFER: ${s.name} for ${s.discount_price}DH (was ${s.price}DH)]`;
                        }
                        return `[${s.name}: ${s.price}DH]`;
                    }).join(', ')
                    : "General Services";

                 return {
                     ...p,
                     distVal,
                     info: `- Name: ${p.name} (${p.service_type})\n  Location: ${p.location}\n  GPS Distance: ${distString}\n  Bio: ${p.bio || 'N/A'}\n  Services & Offers: ${servicesStr}\n  Map Link: https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`
                 };
             });

             // Sort by distance if location is available
             if (userLocation) {
                 processedProviders.sort((a, b) => a.distVal - b.distVal);
             }

             providersListString = processedProviders.map((p: any) => p.info).join('\n\n');
        }
    } catch (e) {}

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
        } catch (e) {}
    }

    const userContextString = userId 
      ? `Registered Client. ID: ${userId}, Name: ${userName || 'Unknown'}, Phone: ${userPhone || 'Unknown'}.` 
      : `Guest User (Not registered).`;

    const systemInstruction = getSystemInstruction(language, providersListString, upcomingAppointmentsString, announcementsText, userContextString, userLocationString);
    
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

    // --- FAILOVER LOGIC LOOP ---
    // Will try Key 1, then Key 2, ..., then Key 10
    for (let i = 0; i < apiKeys.length; i++) {
        const apiKey = apiKeys[i];
        try {
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: contents,
                config: {
                    systemInstruction: systemInstruction,
                },
            });
            return response.text; // Success! Return immediately.

        } catch (error: any) {
            const errString = JSON.stringify(error) + (error.message || "");
            const isQuotaError = (
                errString.includes('429') || 
                errString.includes('RESOURCE_EXHAUSTED') ||
                errString.includes('quota')
            );

            // If it's a quota error and we have more keys, continue loop
            if (isQuotaError && i < apiKeys.length - 1) {
                console.log(`Key ${i + 1} exhausted. Switching to backup key ${i + 2}...`);
                continue;
            }

            // If it's a different error (e.g. invalid request) OR we are out of keys
            console.error(`API Error on Key ${i + 1}:`, error);
            
            if (i === apiKeys.length - 1) {
                if (isQuotaError) {
                     return "⚠️ **عذراً، لقد انتهت حصة الاستخدام المجانية لجميع المفاتيح (All Keys Exhausted).**\n\nالسيرفر عليه ضغط كبير دابا. عافاك حاول غدا.";
                }
                return `سمح لينا، وقع شي مشكل فالاتصال بالذكاء الاصطناعي.\nSorry, I encountered an error connecting to the AI service.\n\n${error.message || ''}`;
            }
        }
    }

    return "Unexpected Error.";
};
