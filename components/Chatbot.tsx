
import React, { useState, useRef, useEffect } from 'react';
import { Message, Role, BookingDetails, AuthenticatedUser, Announcement, ProviderRegistrationDetails } from '../types';
import { getChatResponse } from '../services/geminiService';
import { useLocalization } from '../hooks/useLocalization';
import { supabase } from '../services/supabaseClient';
import QRCodeDisplay from './QRCodeDisplay';
import { Send, Bot, User as UserIcon, Loader2, Paperclip, X, Bell, Key, ArrowRight, Mic, Volume2, VolumeX, Camera, StopCircle } from 'lucide-react';

const BookingConfirmation: React.FC<{ details: BookingDetails }> = ({ details }) => {
  const { t } = useLocalization();
  
  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 max-w-xs mx-auto text-center my-2">
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

interface ChatbotProps {
    currentUser: AuthenticatedUser | null;
    setCurrentUser: (user: AuthenticatedUser | null) => void;
    isLoadingUser: boolean;
}

const Chatbot: React.FC<ChatbotProps> = ({ currentUser, setCurrentUser, isLoadingUser }) => {
  const { t, language } = useLocalization();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [userApiKey, setUserApiKey] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // --- Chat History Persistence ---
  useEffect(() => {
    // Load chat history
    if (!isLoadingUser) {
        const storageKey = currentUser ? `chat_history_${currentUser.id}` : 'chat_history_guest';
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            setMessages(JSON.parse(saved));
        } else {
             if (currentUser) {
                setMessages([{ role: Role.BOT, text: t('welcomeBackMessage', { name: currentUser.name }) }]);
            } else {
                setMessages([{ role: Role.BOT, text: t('welcomeMessage') }]);
            }
        }
        if (currentUser) fetchAnnouncements(currentUser.id);
    }
  }, [isLoadingUser, currentUser, t]);

  useEffect(() => {
      // Save chat history whenever messages change
      if (messages.length > 0 && !isLoadingUser) {
          const storageKey = currentUser ? `chat_history_${currentUser.id}` : 'chat_history_guest';
          localStorage.setItem(storageKey, JSON.stringify(messages));
      }
  }, [messages, currentUser, isLoadingUser]);
  // --------------------------------

  const fetchAnnouncements = async (userId: number) => {
    const { data: followUps } = await supabase.from('follow_ups').select('provider_id').eq('client_id', userId);
    const { data: appointments } = await supabase.from('appointments').select('provider_id').eq('client_id', userId);

    const providerIds = [...new Set([
        ...(followUps || []).map(f => f.provider_id),
        ...(appointments || []).map(a => a.provider_id)
    ])];

    if (providerIds.length > 0) {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const { data } = await supabase
        .from('announcements')
        .select(`*, providers (name)`)
        .in('provider_id', providerIds)
        .gt('created_at', threeDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (data) setAnnouncements(data as Announcement[]);
    }
  };


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, showApiKeyInput]);

  const saveApiKey = () => {
    if (userApiKey.trim().startsWith('AIza')) {
      localStorage.setItem('gemini_api_key', userApiKey.trim());
      setShowApiKeyInput(false);
      setMessages(prev => [...prev, { role: Role.BOT, text: "تم حفظ مفتاح API بنجاح! دابا تقدر تهضر معايا.\n\nAPI Key saved successfully!" }]);
    } else {
      alert("Invalid API Key.");
    }
  };

  // --- Audio Logic ---
  const startListening = () => {
      if (isListening) {
          recognitionRef.current?.stop();
          setIsListening(false);
          return;
      }

      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
          alert("Browser does not support speech recognition. Try Google Chrome.");
          return;
      }

      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = language === 'ar' ? 'ar-MA' : language === 'fr' ? 'fr-FR' : 'en-US';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onstart = () => {
          setIsListening(true);
          if (navigator.vibrate) navigator.vibrate(100); // Feedback
      };
      
      recognitionRef.current.onend = () => setIsListening(false);
      
      recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(prev => prev + (prev ? ' ' : '') + transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
              alert("Microphone access denied. Please allow microphone permissions in your browser settings (click the lock icon in the address bar).");
          } else if (event.error === 'no-speech') {
              // Ignore no-speech errors, just stop listening
          } else {
              alert("Speech recognition error: " + event.error);
          }
      };

      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Recognition start failed", e);
      }
  };

  const speakText = (text: string) => {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel(); // Stop previous
      
      // Simple cleanup to remove markdown chars roughly before speaking
      const cleanText = text.replace(/\*/g, '').replace(/`/g, ''); 
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = language === 'ar' ? 'ar-SA' : language === 'fr' ? 'fr-FR' : 'en-US';
      
      // Improve Arabic voice if available
      if (language === 'ar') {
          const voices = window.speechSynthesis.getVoices();
          const arabicVoice = voices.find(v => v.lang.includes('ar'));
          if (arabicVoice) utterance.voice = arabicVoice;
      }

      utterance.onend = () => setIsSpeaking(false);
      utterance.onstart = () => setIsSpeaking(true);
      
      window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
  }
  // -------------------


  const handleSend = async () => {
    if ((input.trim() === '' && !imageFile) || isLoading) return;
    
    const userMessage: Message = { 
        role: Role.USER, 
        text: input, 
        imageUrl: imagePreviewUrl
    };
    setMessages(prev => [...prev, userMessage]);
    
    let imagePayload: { base64: string; mimeType: string; } | undefined = undefined;
    if (imageFile) {
      imagePayload = await fileToBase64(imageFile);
    }

    setInput('');
    removeImage();
    setIsLoading(true);

    try {
      const history = messages
        .filter(msg => !msg.isComponent)
        .map(msg => ({
          role: msg.role === Role.USER ? 'user' : 'model',
          parts: [{ text: msg.text }],
      }));
      
      // Pass announcements to Gemini
      const announcementText = announcements.length > 0 
        ? announcements.map(a => `${a.providers.name}: ${a.message}`).join('\n') 
        : "";

      const botResponseText = await getChatResponse(history, userMessage.text, language, imagePayload, currentUser?.id, announcementText);

      if (botResponseText === "MISSING_API_KEY_ERROR") {
        setShowApiKeyInput(true);
        setMessages(prev => [...prev, { 
            role: Role.BOT, 
            text: "عافاك دخل API Key ديال Google Gemini باش نقدر نجاوبك. (aistudio.google.com)" 
        }]);
        setIsLoading(false);
        return;
      }

      let parsedJson = null;
      const jsonMatch = botResponseText.match(/```json\n([\s\S]*?)\n```/);
      try {
        let jsonString = jsonMatch && jsonMatch[1] ? jsonMatch[1] : botResponseText.trim().startsWith('{') ? botResponseText : null;
        if (jsonString) parsedJson = JSON.parse(jsonString);
      } catch (e) {}

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
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: Role.BOT, text: t('errorMessage') }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistration = async (details: any) => {
    try {
        const { data, error } = await supabase.from('clients').insert({ full_name: details.fullName, phone: details.phone, password: details.password }).select().single();
        if (error) throw error;
        localStorage.setItem('tangerconnect_user_id', data.id.toString());
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
      // 1. Find Provider
      const { data: providerData } = await supabase.from('providers').select('id').ilike('name', `%${details.provider}%`).limit(1).maybeSingle();
      if (!providerData || !currentUser) throw new Error('Provider not found or User not logged in');
      
      // 2. Insert Appointment
      const { data: appointmentData, error } = await supabase.from('appointments').insert({ client_id: currentUser.id, provider_id: providerData.id }).select('id').single();
      
      if (error) throw error;
      
      // 3. Confirm in Chat
      const bookingDetails: BookingDetails = { ...details, appointmentId: appointmentData.id };
      setMessages(prev => [...prev, { role: Role.BOT, text: t('bookingSuccessMessage') }, { role: Role.SYSTEM, text: 'Booking', bookingDetails, isComponent: true }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: Role.BOT, text: t('errorMessage') }]);
    }
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
    } catch(e) {
        setMessages(prev => [...prev, { role: Role.BOT, text: t('errorMessage') }]);
    }
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
    setImageFile(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

   // Marquee logic
   const getMarqueeClass = () => language === 'ar' ? 'animate-marquee-rtl' : 'animate-marquee-ltr';
   
   // Input Bar Logic
   const hasContent = input.trim().length > 0 || imageFile !== null;

  return (
    <div className="flex flex-col w-full h-[calc(100vh-140px)] bg-surface dark:bg-surfaceDark rounded-3xl shadow-2xl border border-white/20 overflow-hidden relative">
        {/* Marquee Styles */}
        <style>{`
            @keyframes marquee-ltr { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
            @keyframes marquee-rtl { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
            .animate-marquee-ltr { display: inline-block; white-space: nowrap; animation: marquee-ltr 30s linear infinite; }
            .animate-marquee-rtl { display: inline-block; white-space: nowrap; animation: marquee-rtl 30s linear infinite; }
        `}</style>

        {announcements.length > 0 && (
            <div className="w-full bg-yellow-400/90 backdrop-blur-sm text-yellow-900 text-sm h-8 flex items-center relative overflow-hidden z-20 shadow-sm">
                <div className="bg-red-600 text-white px-3 h-full flex items-center font-bold z-10 shadow-md text-xs absolute left-0 top-0">
                    {t('breakingNews')}
                </div>
                <div className="w-full overflow-hidden relative pl-28">
                    <div className={`${getMarqueeClass()} w-full`}>
                        {announcements.map((ann) => (
                            <span key={ann.id} className="inline-flex items-center mx-6">
                                <Bell className="w-3 h-3 mr-1" />
                                <span className="font-bold underline mx-1">{ann.providers.name}:</span> 
                                <span>{ann.message}</span>
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        )}
        
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F0F2F5] dark:bg-[#111B21] scroll-smooth relative"
      >
        {/* Chat Background Pattern overlay */}
        <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.03] pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')]"></div>

        <div className="flex flex-col gap-2 z-10 relative pb-4">
          {messages.map((msg, index) => {
            if (msg.isComponent && msg.bookingDetails) {
              return <BookingConfirmation key={index} details={msg.bookingDetails} />;
            }
            const isUser = msg.role === Role.USER;
            const isBot = msg.role === Role.BOT;
            
            return (
              <div key={index} className={`flex items-end gap-2 group mb-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-md ${isBot ? 'bg-gradient-to-br from-secondary to-primary' : 'bg-gray-400 dark:bg-gray-600'}`}>
                    {isBot ? <Bot size={18} /> : <UserIcon size={18} />}
                </div>

                {/* Bubble */}
                <div className={`relative max-w-[85%] sm:max-w-[75%] px-4 py-2.5 shadow-sm text-sm leading-relaxed
                    ${isUser 
                        ? 'bg-primary text-white rounded-2xl rounded-tr-none' 
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-2xl rounded-tl-none'
                    }`}
                >
                  {msg.imageUrl && (
                    <div className="mb-2 rounded-lg overflow-hidden">
                        <img src={msg.imageUrl} alt="Uploaded" className="w-full h-auto object-cover"/>
                    </div>
                  )}
                  {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                  {isBot && (
                      <div className="flex justify-end mt-1">
                          <button 
                            onClick={() => isSpeaking ? stopSpeaking() : speakText(msg.text)} 
                            className="text-gray-400 hover:text-primary p-1 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Read text"
                          >
                             {isSpeaking ? <VolumeX size={16} className="animate-pulse text-primary"/> : <Volume2 size={16}/>}
                          </button>
                      </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {isLoading && (
            <div className="flex items-end gap-2">
               <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-white shadow-md">
                   <Bot size={18} />
               </div>
               <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
              </div>
            </div>
          )}
          
          {showApiKeyInput && (
             <div className="mx-4 my-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl animate-fade-in">
                   <h4 className="font-bold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2"><Key size={16}/> API Key Required</h4>
                   <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={userApiKey}
                            onChange={(e) => setUserApiKey(e.target.value)}
                            placeholder="AIza..."
                            className="flex-1 p-2 text-sm border border-red-300 rounded-lg dark:bg-gray-800 dark:border-red-700 outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <button onClick={saveApiKey} className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 shadow-md">Save</button>
                   </div>
                   <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs text-red-500 hover:underline mt-2 flex items-center justify-end gap-1">
                      Get Key <ArrowRight size={12} />
                   </a>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* WhatsApp-style Input Area */}
      {/* Force LTR direction for the input bar container so Mic is always on the right */}
      <div dir="ltr" className="p-2 bg-surface dark:bg-surfaceDark border-t border-gray-100 dark:border-gray-700 flex items-end gap-2 w-full max-w-full">
        
        {/* Main Pill Container (Input + Attachments) */}
        <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-[24px] flex items-end shadow-sm relative px-2 overflow-hidden">
            
             {imagePreviewUrl && (
                <div className="absolute bottom-full left-0 mb-2 ml-2 bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-600 shadow-lg animate-slide-up z-20">
                    <div className="relative">
                        <img src={imagePreviewUrl} alt="Preview" className="w-20 h-20 object-cover rounded-lg"/>
                        <button onClick={removeImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-sm">
                            <X size={12} />
                        </button>
                    </div>
                </div>
            )}

            {/* Text Area - Respects app language for text alignment */}
            <textarea
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                placeholder={isListening ? t('listening') || "Listening..." : t('inputPlaceholder')}
                rows={1}
                className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400 resize-none py-3 px-4 max-h-32 outline-none text-base"
                disabled={isLoading}
                style={{ minHeight: '48px' }} 
            />

            {/* Attachments Inside Pill (Always on the Right side of the pill due to LTR container) */}
            <div className="flex items-center pb-2 pr-1 gap-1 flex-none">
                {/* Paperclip triggers file selection */}
                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                
                {/* Camera triggers Environment Camera */}
                <input type="file" ref={cameraInputRef} onChange={handleImageChange} accept="image/*" capture="environment" className="hidden" />
                
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="p-2 text-gray-400 hover:text-primary transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Attach Image"
                >
                    <Paperclip size={20} className="rotate-45" />
                </button>
                <button
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isLoading}
                    className="p-2 text-gray-400 hover:text-primary transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Open Camera"
                >
                    <Camera size={20} />
                </button>
            </div>
        </div>

        {/* Round Action Button (Mic or Send) - Always on Right */}
        <button
            onClick={hasContent ? handleSend : startListening}
            disabled={isLoading}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex-none
                ${isListening 
                    ? 'bg-red-500 animate-pulse text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
        >
            {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
            ) : hasContent ? (
                <Send size={20} className={language === 'ar' ? 'rotate-180' : ''} />
            ) : isListening ? (
                <StopCircle size={24} />
            ) : (
                <Mic size={20} />
            )}
        </button>

      </div>
    </div>
  );
};

export default Chatbot;
