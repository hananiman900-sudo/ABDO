
import React, { useState, useRef, useEffect } from 'react';
import { Message, Role, BookingDetails, AuthenticatedUser, Announcement, ProviderRegistrationDetails } from '../types';
import { getChatResponse } from '../services/geminiService';
import { useLocalization } from '../hooks/useLocalization';
import { supabase } from '../services/supabaseClient';
import QRCodeDisplay from './QRCodeDisplay';
import { Send, Bot, User as UserIcon, Loader2, Paperclip, X, Bell, Key, Save, ImageIcon } from 'lucide-react';

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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoadingUser) {
        if (currentUser) {
            setMessages([{ role: Role.BOT, text: t('welcomeBackMessage', { name: currentUser.name }) }]);
            fetchAnnouncements(currentUser.id);
        } else {
            setMessages([{ role: Role.BOT, text: t('welcomeMessage') }]);
        }
    }
   }, [isLoadingUser, currentUser, t]);


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
      
      const botResponseText = await getChatResponse(history, userMessage.text, language, imagePayload, currentUser?.id);

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
      const { data: providerData } = await supabase.from('providers').select('id').eq('name', details.provider).single();
      if (!providerData || !currentUser) throw new Error('Error');
      const { data: appointmentData, error } = await supabase.from('appointments').insert({ client_id: currentUser.id, provider_id: providerData.id }).select('id').single();
      if (error) throw error;
      const bookingDetails: BookingDetails = { ...details, appointmentId: appointmentData.id };
      setMessages(prev => [...prev, { role: Role.BOT, text: t('bookingSuccessMessage') }, { role: Role.SYSTEM, text: 'Booking', bookingDetails, isComponent: true }]);
    } catch (e) {
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
  };

   // Marquee logic
   const getMarqueeClass = () => language === 'ar' ? 'animate-marquee-rtl' : 'animate-marquee-ltr';

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

        <div className="flex flex-col gap-2 z-10 relative">
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
                   <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs text-red-500 hover:underline mt-2 block text-right">Get Key -></a>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 sm:p-4 bg-surface dark:bg-surfaceDark border-t border-gray-100 dark:border-gray-700">
        {imagePreviewUrl && (
          <div className="flex items-center gap-3 mb-3 bg-gray-50 dark:bg-gray-800 p-2 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
            <img src={imagePreviewUrl} alt="Preview" className="w-12 h-12 object-cover rounded-lg"/>
            <span className="text-xs text-gray-500 flex-1 truncate">{imageFile?.name}</span>
            <button onClick={removeImage} className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200">
              <X size={14} />
            </button>
          </div>
        )}
        
        <div className="flex items-end gap-2 relative">
          <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="p-3 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <Paperclip size={22} />
          </button>
          
          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center px-4 py-1 focus-within:ring-2 focus-within:ring-primary/30 transition-all border border-transparent focus-within:border-primary/50">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                placeholder={t('inputPlaceholder')}
                rows={1}
                className="w-full bg-transparent border-none focus:ring-0 text-gray-900 dark:text-gray-100 placeholder-gray-400 resize-none py-3 max-h-24"
                disabled={isLoading}
                style={{ minHeight: '44px' }}
              />
          </div>

          <button
            onClick={handleSend}
            disabled={isLoading || (input.trim() === '' && !imageFile)}
            className={`p-3 rounded-full shadow-lg transition-all duration-200 transform ${
                input.trim() || imageFile ? 'bg-primary text-white hover:scale-105 active:scale-95' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
            }`}
          >
            {isLoading ? <Loader2 className="animate-spin" size={22} /> : <Send size={22} className={language === 'ar' ? 'rotate-180' : ''} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
