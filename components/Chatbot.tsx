
// ... imports ...
import React, { useState, useRef, useEffect } from 'react';
import { Message, Role, BookingDetails, AuthenticatedUser, Announcement, ProviderRegistrationDetails, SystemAnnouncement } from '../types';
import { getChatResponse } from '../services/geminiService';
import { useLocalization } from '../hooks/useLocalization';
import { supabase } from '../services/supabaseClient';
import QRCodeDisplay from './QRCodeDisplay';
import { Send, Bot, User as UserIcon, Loader2, Paperclip, X, Bell, Key, ArrowRight, Mic, Volume2, VolumeX, Camera, StopCircle, MapPin, XCircle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';

// ... BookingConfirmation ...
const BookingConfirmation: React.FC<{ details: BookingDetails }> = ({ details }) => {
  const { t } = useLocalization();
  
  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 max-w-xs mx-auto text-center my-2 animate-fade-in">
      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
         <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
      </div>
      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">{t('bookingConfirmedTitle')}</h3>
      <div className="text-left rtl:text-right text-sm text-gray-600 dark:text-gray-300 space-y-1 mb-4 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
          <p><span className="font-bold text-gray-800 dark:text-gray-200">{t('service')}:</span> {details.service}</p>
          <p><span className="font-bold text-gray-800 dark:text-gray-200">{t('with')}:</span> {details.provider}</p>
          <p><span className="font-bold text-gray-800 dark:text-gray-200">{t('location')}:</span> {details.location}</p>
          <p className="text-green-600 font-bold">{t('discountApplied')}: {details.discount}</p>
      </div>
      <QRCodeDisplay appointmentId={details.appointmentId} />
      <p className="mt-3 text-xs text-gray-400">{t('qrInstruction')}</p>
    </div>
  );
};

// --- SYSTEM AD CARD COMPONENT (SINGLE IMAGE, NO SLIDER) ---
const SystemAdCard: React.FC<{ ad: SystemAnnouncement; onDismiss: () => void }> = ({ ad, onDismiss }) => {
    // Priority to image_url or first image in array, basically revert to single image view
    const displayImage = (ad.images && ad.images.length > 0) ? ad.images[0] : ad.image_url;
    const [expanded, setExpanded] = useState(false);
    
    // Truncate logic
    const MAX_LENGTH = 100;
    const isLongText = ad.message.length > MAX_LENGTH;
    const displayText = expanded ? ad.message : (isLongText ? ad.message.substring(0, MAX_LENGTH) + '...' : ad.message);

    return (
        <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-primary/20 overflow-hidden mb-4 relative animate-fade-in mx-auto max-w-sm mt-4">
            <button onClick={onDismiss} className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 z-20"><X size={16}/></button>
            
            {/* Single Image */}
            {displayImage && (
                <div className="relative h-48 w-full bg-gray-100">
                    <img src={displayImage} className="w-full h-full object-cover" alt="Ad"/>
                </div>
            )}

            <div className="p-4">
                <h4 className="font-bold text-lg dark:text-white mb-1">{ad.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 transition-all duration-300">
                    {displayText}
                </p>
                {isLongText && (
                    <button 
                        onClick={() => setExpanded(!expanded)} 
                        className="text-primary text-xs font-bold mt-2 flex items-center gap-1 hover:underline"
                    >
                        {expanded ? <><ChevronUp size={12}/> Read Less</> : <><ChevronDown size={12}/> Read More</>}
                    </button>
                )}
            </div>
        </div>
    );
};


// ... ChatbotProps ...
interface ChatbotProps {
    currentUser: AuthenticatedUser | null;
    setCurrentUser: (user: AuthenticatedUser | null) => void;
    isLoadingUser: boolean;
}

// ... Chatbot Component ...
const Chatbot: React.FC<ChatbotProps> = ({ currentUser, setCurrentUser, isLoadingUser }) => {
  // ... hooks and state ...
  const { t, language } = useLocalization();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [systemAds, setSystemAds] = useState<SystemAnnouncement[]>([]); 
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // ... effects (location, persistence, announcements) ...
  useEffect(() => {
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
              (position) => { setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }); },
              (error) => { console.log("Location access denied or error", error); }
          );
      }
  }, []);

  useEffect(() => {
    if (!isLoadingUser) {
        const storageKey = currentUser ? `chat_history_${currentUser.id}` : 'chat_history_guest';
        const saved = localStorage.getItem(storageKey);
        if (saved) { setMessages(JSON.parse(saved)); } else { if (currentUser) { setMessages([{ role: Role.BOT, text: t('welcomeBackMessage', { name: currentUser.name }) }]); } else { setMessages([{ role: Role.BOT, text: t('welcomeMessage') }]); } }
        if (currentUser) fetchAnnouncements(currentUser.id);
        fetchSystemAds(); 
    }
  }, [isLoadingUser, currentUser, t]);

  useEffect(() => { if (messages.length > 0 && !isLoadingUser) { const storageKey = currentUser ? `chat_history_${currentUser.id}` : 'chat_history_guest'; localStorage.setItem(storageKey, JSON.stringify(messages)); } }, [messages, currentUser, isLoadingUser]);

  const fetchAnnouncements = async (userId: number) => {
    const { data: followUps } = await supabase.from('follow_ups').select('provider_id').eq('client_id', userId);
    const { data: appointments } = await supabase.from('appointments').select('provider_id').eq('client_id', userId);
    const providerIds = [...new Set([...(followUps || []).map(f => f.provider_id), ...(appointments || []).map(a => a.provider_id)])];
    if (providerIds.length > 0) {
      const threeDaysAgo = new Date(); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const { data } = await supabase.from('announcements').select(`*, providers (name)`).in('provider_id', providerIds).gt('created_at', threeDaysAgo.toISOString()).order('created_at', { ascending: false });
      if (data) setAnnouncements(data as Announcement[]);
    }
  };

  const fetchSystemAds = async () => {
      const { data } = await supabase.from('system_announcements').select('*').eq('is_active', true).order('created_at', { ascending: false });
      if (data) setSystemAds(data as SystemAnnouncement[]);
  }

  const dismissSystemAd = (id: number) => {
      setSystemAds(prev => prev.filter(ad => ad.id !== id));
  }

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };
  useEffect(scrollToBottom, [messages, isRecording, systemAds.length]); 

  // ... Audio and TTS functions ...
  const startRecording = async () => {
      if (navigator.vibrate) navigator.vibrate(50);
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];
          mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) { audioChunksRef.current.push(event.data); } };
          mediaRecorder.onstop = async () => {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              await handleSendAudio(audioBlob);
              stream.getTracks().forEach(track => track.stop());
          };
          mediaRecorder.start();
          setIsRecording(true);
      } catch (err) { console.error("Error accessing microphone:", err); alert(t('errorMessage') + " (Microphone access denied)"); }
  };
  const stopRecording = () => { if (mediaRecorderRef.current && isRecording) { if (navigator.vibrate) navigator.vibrate([50, 50, 50]); mediaRecorderRef.current.stop(); setIsRecording(false); } };
  const handleSendAudio = async (audioBlob: Blob) => {
       const reader = new FileReader();
       reader.readAsDataURL(audioBlob);
       reader.onloadend = async () => {
           const base64Audio = (reader.result as string).split(',')[1];
           const mimeType = audioBlob.type || 'audio/webm';
           const userMessage: Message = { role: Role.USER, text: "🎤 Audio Message" };
           setMessages(prev => [...prev, userMessage]);
           setIsLoading(true);
           await processGeminiRequest(userMessage, undefined, { base64: base64Audio, mimeType });
       };
  };
  const speakText = (text: string) => {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel(); 
      const cleanText = text.replace(/```[\s\S]*?```/g, '').replace(/\{[\s\S]*?\}/g, '').replace(/[\*\#\`\_\-]/g, '').trim();
      if (!cleanText) return;
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = language === 'ar' ? 'ar-SA' : language === 'fr' ? 'fr-FR' : 'en-US';
      if (language === 'ar') { const voices = window.speechSynthesis.getVoices(); const arabicVoice = voices.find(v => v.lang.includes('ar')); if (arabicVoice) utterance.voice = arabicVoice; }
      utterance.onend = () => setIsSpeaking(false);
      utterance.onstart = () => setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
  };
  const stopSpeaking = () => { window.speechSynthesis.cancel(); setIsSpeaking(false); }

  // ... Send logic ...
  const handleSend = async () => {
    if ((input.trim() === '' && !imageFile) || isLoading) return;
    const userMessage: Message = { role: Role.USER, text: input, imageUrl: imagePreviewUrl };
    setMessages(prev => [...prev, userMessage]);
    let imagePayload: { base64: string; mimeType: string; } | undefined = undefined;
    if (imageFile) { imagePayload = await fileToBase64(imageFile); }
    setInput(''); removeImage(); setIsLoading(true);
    await processGeminiRequest(userMessage, imagePayload, undefined);
  };

  const processGeminiRequest = async (userMessage: Message, imagePayload?: { base64: string; mimeType: string; }, audioPayload?: { base64: string; mimeType: string; }) => {
    try {
      const history = messages.filter(msg => !msg.isComponent).map(msg => ({ role: msg.role === Role.USER ? 'user' : 'model', parts: [{ text: msg.text }], }));
      const announcementText = announcements.length > 0 ? announcements.map(a => `${a.providers.name}: ${a.message}`).join('\n') : "";
      const botResponseText = await getChatResponse(history, userMessage.text, language, imagePayload, audioPayload, currentUser?.id, currentUser?.name, currentUser?.phone, announcementText, userLocation);
      
      let parsedJson = null;
      try {
          const jsonMatch = botResponseText.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch && jsonMatch[1]) { parsedJson = JSON.parse(jsonMatch[1]); } else {
              const startIndex = botResponseText.indexOf('{');
              const endIndex = botResponseText.lastIndexOf('}');
              if (startIndex !== -1 && endIndex !== -1) { const potentialJson = botResponseText.substring(startIndex, endIndex + 1); parsedJson = JSON.parse(potentialJson); }
          }
      } catch (e) { console.warn("Failed to parse JSON from response", e); }

      if (parsedJson) {
          if (parsedJson.BOOKING_CONFIRMED) {
              const d = parsedJson.BOOKING_CONFIRMED;
              parsedJson = { action: 'BOOKING_CONFIRMED', details: { name: d.client_name || d.name || 'Unknown', phone: d.client_phone || d.phone || 'Unknown', service: d.service || 'General Service', provider: d.provider_name || d.provider || 'Provider', location: d.location || 'Tangier', discount: d.price || d.discount || 'Standard Price' } };
          } else if (parsedJson.REGISTER_USER) { parsedJson = { action: 'REGISTER_USER', details: parsedJson.REGISTER_USER };
          } else if (parsedJson.REGISTER_PROVIDER) { parsedJson = { action: 'REGISTER_PROVIDER', details: parsedJson.REGISTER_PROVIDER };
          } else if (parsedJson.FOLLOW_UP_CREATED) { parsedJson = { action: 'FOLLOW_UP_CREATED', details: parsedJson.FOLLOW_UP_CREATED }; }
      }

      if (parsedJson && parsedJson.action) {
        switch (parsedJson.action) {
          case 'REGISTER_USER': await handleRegistration(parsedJson.details); break;
          case 'REGISTER_PROVIDER': await handleProviderRegistration(parsedJson.details); break;
          case 'BOOKING_CONFIRMED': await handleBooking(parsedJson.details); break;
          case 'FOLLOW_UP_CREATED': await handleFollowUp(parsedJson.details); break;
          default: setMessages(prev => [...prev, { role: Role.BOT, text: t('errorMessage') }]);
        }
      } else {
        setMessages(prev => [...prev, { role: Role.BOT, text: botResponseText }]);
        if (audioPayload) speakText(botResponseText);
      }
    } catch (error) { setMessages(prev => [...prev, { role: Role.BOT, text: t('errorMessage') }]); } finally { setIsLoading(false); }
  };

  // ... Handlers ...
  const handleRegistration = async (details: any) => {
    try {
        const { data, error } = await supabase.from('clients').insert({ full_name: details.fullName, phone: details.phone, password: details.password }).select().single();
        if (error) throw error;
        localStorage.setItem('tangerconnect_user_id', data.id.toString()); localStorage.setItem('tangerconnect_user_type', 'CLIENT');
        // @ts-ignore
        setCurrentUser({id: data.id, name: data.full_name, accountType: 'CLIENT', phone: data.phone });
        setMessages(prev => [...prev, { role: Role.BOT, text: t('registrationSuccessMessage') }]);
    } catch (error: any) {
        let errorMessage = t('registrationFailed');
        if (error.message.includes('clients_phone_key')) errorMessage = t('phoneExistsError');
        setMessages(prev => [...prev, { role: Role.BOT, text: errorMessage }]);
    }
  };

  const handleProviderRegistration = async (details: ProviderRegistrationDetails) => {
    try {
        const { error } = await supabase.from('providers').insert({ name: details.name, service_type: details.service, location: details.location, username: details.username }).single();
        if (error) throw error;
        setMessages(prev => [...prev, { role: Role.BOT, text: t('providerRegistrationSuccessMessage') }]);
    } catch (error: any) {
        let errorMessage = t('registrationFailed');
        if (error.message.includes('providers_username_key')) errorMessage = t('usernameExistsError');
        setMessages(prev => [...prev, { role: Role.BOT, text: errorMessage }]);
    }
  };

  const handleBooking = async (details: any) => {
    try {
      let { data: providerData } = await supabase.from('providers').select('id').ilike('name', `${details.provider}`).limit(1).maybeSingle();
      if (!providerData) { ({ data: providerData } = await supabase.from('providers').select('id').ilike('name', `%${details.provider}%`).limit(1).maybeSingle()); }
      
      let targetProviderId = providerData?.id;
      if (!targetProviderId) { console.warn("Provider match failed for:", details.provider); if (!currentUser) throw new Error('User not logged in'); }

      let appointmentId = 0;
      
      if (currentUser && targetProviderId) {
          const { data: appointmentData, error } = await supabase.from('appointments').insert({ client_id: currentUser.id, provider_id: targetProviderId }).select('id').single();
          if (error) throw error;
          appointmentId = appointmentData.id;

          // --- NEW: SEND NOTIFICATION TO PROVIDER WITH BOOKING ID ---
          const notificationMsg = `New Booking: ${details.name} for ${details.service}`;
          await supabase.from('provider_notifications').insert({
              provider_id: targetProviderId,
              message: notificationMsg,
              type: 'BOOKING',
              status: 'pending',
              booking_id: appointmentId // Link for scan confirmation
          });
      } else {
           appointmentId = Math.floor(Math.random() * 10000);
      }
      
      const bookingDetails: BookingDetails = { ...details, appointmentId: appointmentId };
      setMessages(prev => [...prev, { role: Role.BOT, text: t('bookingSuccessMessage') }, { role: Role.SYSTEM, text: 'Booking', bookingDetails, isComponent: true }]);
      speakText(t('bookingSuccessMessage'));

    } catch (e) { console.error(e); setMessages(prev => [...prev, { role: Role.BOT, text: t('errorMessage') }]); }
  };

  const handleFollowUp = async (details: any) => {
    if (!currentUser) return;
    try {
        const { data: providerData } = await supabase.from('providers').select('id').ilike('name', `%${details.providerName}%`).limit(1).maybeSingle();
        if (!providerData) throw new Error('Provider not found');
        let medication_image_url;
        if (imageFile) {
            const filePath = `${currentUser.id}/medication_${Date.now()}`;
            await supabase.storage.from('medication-images').upload(filePath, imageFile);
            const { data } = supabase.storage.from('medication-images').getPublicUrl(filePath);
            medication_image_url = data.publicUrl;
        }
        await supabase.from('follow_ups').insert({ client_id: currentUser.id, provider_id: providerData.id, next_appointment_date: details.nextAppointmentDate, notes: details.notes, medication_image_url });
        setMessages(prev => [...prev, { role: Role.BOT, text: t('followUpSuccessMessage') }]);
    } catch(e) { setMessages(prev => [...prev, { role: Role.BOT, text: t('errorMessage') }]); }
  };

  const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve({ base64: (reader.result as string).split(',')[1], mimeType: (reader.result as string).split(';')[0].split(':')[1] });
      reader.onerror = reject;
    });
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) { setImageFile(file); setImagePreviewUrl(URL.createObjectURL(file)); }
  };

  const removeImage = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(null); setImagePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

   const getMarqueeClass = () => language === 'ar' ? 'animate-marquee-rtl' : 'animate-marquee-ltr';
   const hasContent = input.trim().length > 0 || imageFile !== null;

  return (
    <div className="flex flex-col w-full h-full bg-surface dark:bg-surfaceDark relative">
        <style>{` @keyframes marquee-ltr { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } } @keyframes marquee-rtl { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } } .animate-marquee-ltr { display: inline-block; white-space: nowrap; animation: marquee-ltr 30s linear infinite; } .animate-marquee-rtl { display: inline-block; white-space: nowrap; animation: marquee-rtl 30s linear infinite; } `}</style>
        {announcements.length > 0 && (
            <div className="w-full bg-yellow-400/90 backdrop-blur-sm text-yellow-900 text-sm h-8 flex items-center relative overflow-hidden z-20 shadow-sm">
                <div className="bg-red-600 text-white px-3 h-full flex items-center font-bold z-10 shadow-md text-xs absolute left-0 top-0">{t('breakingNews')}</div>
                <div className="w-full overflow-hidden relative pl-28"><div className={`${getMarqueeClass()} w-full`}>{announcements.map((ann) => (<span key={ann.id} className="inline-flex items-center mx-6"><Bell className="w-3 h-3 mr-1" /><span className="font-bold underline mx-1">{ann.providers.name}:</span><span>{ann.message}</span></span>))}</div></div>
            </div>
        )}
      
      {/* Messages Area - Takes remaining space */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 bg-[#F0F2F5] dark:bg-[#111B21] scroll-smooth relative pb-20">
        <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.03] pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')]"></div>
        <div className="flex flex-col gap-2 z-10 relative">
          
          {messages.map((msg, index) => {
            if (msg.isComponent && msg.bookingDetails) { return <BookingConfirmation key={index} details={msg.bookingDetails} />; }
            const isUser = msg.role === Role.USER; const isBot = msg.role === Role.BOT;
            return (
              <div key={index} className={`flex items-end gap-2 group mb-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar only for bot */}
                {isBot && <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-md bg-gradient-to-br from-secondary to-primary`}><Bot size={18} /></div>}
                <div className={`relative max-w-[85%] sm:max-w-[75%] px-3 py-2 shadow-sm text-sm leading-relaxed ${isUser ? 'bg-[#005c4b] text-white rounded-lg rounded-tr-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg rounded-tl-none'}`}>
                  {msg.imageUrl && ( <div className="mb-2 rounded-lg overflow-hidden"><img src={msg.imageUrl} alt="Uploaded" className="w-full h-auto object-cover"/></div> )}
                  {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                  {/* Read Aloud button small overlay */}
                  {isBot && ( <button onClick={() => isSpeaking ? stopSpeaking() : speakText(msg.text)} className="absolute -bottom-5 right-0 text-gray-400 hover:text-primary p-1"><Volume2 size={12}/></button> )}
                </div>
              </div>
            );
          })}
          {isLoading && ( <div className="flex items-end gap-2"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-white shadow-md"><Bot size={18} /></div><div className="bg-white dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none shadow-sm"><div className="flex gap-1"><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span></div></div></div> )}
          
          {/* SYSTEM ADS - Rendered at bottom of chat */}
          {systemAds.map(ad => (
              <SystemAdCard key={ad.id} ad={ad} onDismiss={() => dismissSystemAd(ad.id)} />
          ))}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Bar - WhatsApp Style - Fixed Bottom */}
      <div dir="ltr" className="absolute bottom-0 left-0 right-0 p-2 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2 z-30">
        
        {/* Attachment & Camera */}
        {!isRecording && (
           <div className="flex gap-1">
               <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
               <input type="file" ref={cameraInputRef} onChange={handleImageChange} accept="image/*" capture="environment" className="hidden" />
               <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400"><Paperclip size={22} /></button>
               <button onClick={() => cameraInputRef.current?.click()} disabled={isLoading} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400"><Camera size={22} /></button>
           </div>
        )}

        {/* Input Field Area */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-full flex items-center shadow-sm px-4 py-2 relative border border-gray-200 dark:border-gray-700">
             {imagePreviewUrl && ( 
                 <div className="absolute bottom-full left-0 mb-2 ml-2 bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-600 shadow-lg animate-slide-up z-20">
                     <div className="relative">
                         <img src={imagePreviewUrl} alt="Preview" className="w-20 h-20 object-cover rounded-lg"/>
                         <button onClick={removeImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-sm"><X size={12} /></button>
                     </div>
                 </div> 
             )}
            
            {isRecording ? (
                 <div className="flex-1 flex items-center gap-2 text-red-500 font-bold animate-pulse">
                     <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div> Recording...
                 </div>
            ) : (
                <textarea 
                    dir={language === 'ar' ? 'rtl' : 'ltr'} 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}} 
                    placeholder="" 
                    rows={1} 
                    className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400 resize-none max-h-32 outline-none py-1 text-base" 
                    disabled={isLoading}
                    style={{ minHeight: '24px' }}
                />
            )}
        </div>

        {/* Mic / Send Button */}
        <button 
            onClick={hasContent ? handleSend : (isRecording ? stopRecording : startRecording)} 
            disabled={isLoading} 
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all duration-200 transform active:scale-95 flex-none ${isRecording ? 'bg-red-500 text-white' : 'bg-[#005c4b] text-white'}`}
        >
            {isLoading ? ( <Loader2 className="animate-spin" size={20} /> ) : hasContent ? ( <Send size={20} className={language === 'ar' ? 'rotate-180' : ''} /> ) : isRecording ? ( <Send size={20} className={language === 'ar' ? 'rotate-180' : ''} /> ) : ( <Mic size={20} /> )}
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
