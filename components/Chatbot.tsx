
import React, { useState, useRef, useEffect } from 'react';
import { Message, Role, BookingDetails, AuthenticatedUser, Announcement, ProviderRegistrationDetails } from '../types';
import { getChatResponse } from '../services/geminiService';
import { useLocalization } from '../hooks/useLocalization';
import { supabase } from '../services/supabaseClient';
import QRCodeDisplay from './QRCodeDisplay';
import { Send, Bot, User as UserIcon, Loader2, Paperclip, X, Bell } from 'lucide-react';

const BookingConfirmation: React.FC<{ details: BookingDetails }> = ({ details }) => {
  const { t } = useLocalization();
  
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border-2 border-primary max-w-sm mx-auto text-center text-dark dark:text-light">
      <h3 className="text-xl font-bold mb-4">{t('bookingConfirmedTitle')}</h3>
      <p className="mb-2"><strong>{t('name')}:</strong> {details.name}</p>
      <p className="mb-2"><strong>{t('service')}:</strong> {details.service} {t('with')} {details.provider}</p>
      <p className="mb-2"><strong>{t('location')}:</strong> {details.location}</p>
      <p className="mb-4 text-green-600 font-semibold">{t('discountApplied')}: {details.discount}</p>
      <QRCodeDisplay appointmentId={details.appointmentId} />
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{t('qrInstruction')}</p>
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const { data: followUps, error: followUpError } = await supabase
      .from('follow_ups')
      .select('provider_id')
      .eq('client_id', userId);
    
    const { data: appointments, error: appointmentError } = await supabase
      .from('appointments')
      .select('provider_id')
      .eq('client_id', userId);

    if (followUpError || appointmentError) {
      console.error('Error fetching user providers:', followUpError || appointmentError);
      return;
    }
    
    const providerIds = [...new Set([
        ...(followUps || []).map(f => f.provider_id),
        ...(appointments || []).map(a => a.provider_id)
    ])];

    if (providerIds.length > 0) {
      // Calculate date 3 days ago
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const { data, error } = await supabase
        .from('announcements')
        .select(`*, providers (name)`)
        .in('provider_id', providerIds)
        .gt('created_at', threeDaysAgo.toISOString()) // Filter: created in last 3 days
        .order('created_at', { ascending: false });

      if (data) {
        setAnnouncements(data as Announcement[]);
      }
    }
  };


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

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

      let parsedJson = null;
      const jsonMatch = botResponseText.match(/```json\n([\s\S]*?)\n```/);
      
      try {
        let jsonString;
        if (jsonMatch && jsonMatch[1]) {
            jsonString = jsonMatch[1];
        } else if (botResponseText.trim().startsWith('{')) { // Fallback for raw JSON
            jsonString = botResponseText;
        }

        if (jsonString) {
            parsedJson = JSON.parse(jsonString);
        }
      } catch (e) {
          // Not valid JSON, will be treated as a regular message below
      }

      if (parsedJson && parsedJson.action) {
        switch (parsedJson.action) {
          case 'REGISTER_USER':
            await handleRegistration(parsedJson.details);
            break;
          case 'REGISTER_PROVIDER':
            await handleProviderRegistration(parsedJson.details);
            break;
          case 'BOOKING_CONFIRMED':
            await handleBooking(parsedJson.details);
            break;
          case 'FOLLOW_UP_CREATED':
            await handleFollowUp(parsedJson.details);
            break;
          default:
            console.error(`Unhandled action: ${parsedJson.action}`);
            setMessages(prev => [...prev, { role: Role.BOT, text: t('errorMessage') }]);
        }
      } else {
        setMessages(prev => [...prev, { role: Role.BOT, text: botResponseText }]);
      }
    } catch (error) {
      console.error('Error in handleSend:', error);
      const errorMessage: Message = { role: Role.BOT, text: t('errorMessage') };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistration = async (details: { fullName: string; phone: string; password: string }) => {
    try {
        const { data, error } = await supabase
          .from('clients')
          .insert({ full_name: details.fullName, phone: details.phone, password: details.password })
          .select('id, full_name, phone')
          .single();

        if (error) throw error;
        
        localStorage.setItem('tangerconnect_user_id', data.id.toString());
        // @ts-ignore - setCurrentUser expects AuthenticatedUser, we are creating it here
        setCurrentUser({id: data.id, name: data.full_name, accountType: 'CLIENT', phone: data.phone });
        setMessages(prev => [...prev, { role: Role.BOT, text: t('registrationSuccessMessage') }]);
    } catch (error: any) {
        console.error("Supabase registration error:", error);
        let errorMessage = t('registrationFailed');
        const message = error.message || '';
        if (message.includes('clients_phone_key')) {
            errorMessage = t('phoneExistsError');
        } else if (message.toLowerCase().includes('relation "clients" does not exist')) {
            errorMessage = t('clientsTableMissingError');
        }
        setMessages(prev => [...prev, { role: Role.BOT, text: errorMessage }]);
    }
  };

  const handleProviderRegistration = async (details: ProviderRegistrationDetails) => {
    try {
        const { data, error } = await supabase
          .from('providers')
          .insert({ name: details.name, service_type: details.service, location: details.location, username: details.username })
          .select()
          .single();

        if (error) throw error;
        
        setMessages(prev => [...prev, { role: Role.BOT, text: t('providerRegistrationSuccessMessage') }]);
    } catch (error: any) {
        console.error("Supabase provider registration error:", error);
        let errorMessage = t('registrationFailed');
        const message = error.message || '';
        if (message.includes('providers_username_key')) {
            errorMessage = t('usernameExistsError');
        } else if (message.toLowerCase().includes('relation "providers" does not exist')) {
            errorMessage = t('providersTableMissingError');
        }
        setMessages(prev => [...prev, { role: Role.BOT, text: errorMessage }]);
    }
  };

  const handleBooking = async (details: Omit<BookingDetails, 'appointmentId'>) => {
    try {
      const { data: providerData } = await supabase.from('providers').select('id').eq('name', details.provider).single();
      if (!providerData) throw new Error('Provider not found');
      if (!currentUser) throw new Error('User not logged in');

      const { data: appointmentData, error } = await supabase
        .from('appointments')
        .insert({ client_id: currentUser.id, provider_id: providerData.id })
        .select('id').single();

      if (error || !appointmentData) throw error || new Error("Failed to create appointment");
      
      const bookingDetails: BookingDetails = { ...details, appointmentId: appointmentData.id };
      
      setMessages(prev => [
        ...prev, 
        { role: Role.BOT, text: t('bookingSuccessMessage') },
        { role: Role.SYSTEM, text: 'Booking Component', bookingDetails, isComponent: true }
      ]);
    } catch (e) {
      console.error("Failed to save booking", e);
      setMessages(prev => [...prev, { role: Role.BOT, text: t('errorMessage') }]);
    }
  };

  const handleFollowUp = async (details: { providerName: string; nextAppointmentDate: string; notes: string; }) => {
    if (!currentUser) return;
    try {
        // Fix: Use ilike for fuzzy matching and capture error
        const { data: providerData, error: providerError } = await supabase
            .from('providers')
            .select('id')
            .ilike('name', `%${details.providerName}%`)
            .limit(1)
            .maybeSingle();
            
        if (providerError) {
             console.error("Provider fetch error (RLS or Schema):", providerError);
             throw new Error('Database error fetching provider');
        }
        
        if (!providerData) {
             console.error(`Provider not found: ${details.providerName}`);
             throw new Error('Provider not found');
        }
        
        let medication_image_url;
        if (imageFile) {
            const filePath = `${currentUser.id}/medication_${Date.now()}`;
            const { error: uploadError } = await supabase.storage.from('medication-images').upload(filePath, imageFile);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('medication-images').getPublicUrl(filePath);
            medication_image_url = data.publicUrl;
        }

        const { error } = await supabase.from('follow_ups').insert({
            client_id: currentUser.id,
            provider_id: providerData.id,
            next_appointment_date: details.nextAppointmentDate,
            notes: details.notes,
            medication_image_url
        });
        if (error) throw error;
        setMessages(prev => [...prev, { role: Role.BOT, text: t('followUpSuccessMessage') }]);
        
    } catch(e) {
        console.error("Failed to save follow-up", e);
        setMessages(prev => [...prev, { role: Role.BOT, text: t('errorMessage') }]);
    }
  };

  const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        const mimeType = result.split(';')[0].split(':')[1];
        resolve({ base64, mimeType });
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Helper to determine animation class based on language
  const getMarqueeClass = () => {
      if (language === 'ar') return 'animate-marquee-rtl'; // Moves Left to Right (starts off-screen Left)
      return 'animate-marquee-ltr'; // Moves Right to Left (starts off-screen Right)
  };

  return (
    <div className="flex flex-col w-full max-w-6xl h-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden relative">
        {/* CSS for Marquee Animation */}
        <style>{`
            @keyframes marquee-ltr {
                0% { transform: translateX(100%); }
                100% { transform: translateX(-100%); }
            }
            /* For Arabic: Move from Left to Right (appear from Left) as requested */
            @keyframes marquee-rtl {
                0% { transform: translateX(-100%); } 
                100% { transform: translateX(100%); }
            }
            .animate-marquee-ltr {
                display: inline-block;
                white-space: nowrap;
                animation: marquee-ltr 30s linear infinite;
            }
            .animate-marquee-rtl {
                display: inline-block;
                white-space: nowrap;
                animation: marquee-rtl 30s linear infinite;
            }
            .animate-marquee-ltr:hover, .animate-marquee-rtl:hover {
                animation-play-state: paused;
            }
        `}</style>

        {announcements.length > 0 && (
            <div className="w-full bg-yellow-300 border-b border-yellow-400 h-10 flex relative overflow-hidden">
                 {/* Red Badge - Fixed to Far Left regardless of language direction as requested */}
                <div className="bg-red-600 text-white px-4 flex items-center justify-center font-bold z-20 shadow-md whitespace-nowrap h-full absolute left-0 top-0">
                    <span className="animate-pulse">{t('breakingNews')}</span>
                </div>

                {/* Marquee Container - Padding Left to accommodate the badge */}
                <div className="w-full h-full flex items-center overflow-hidden relative pl-36">
                    <div className={`${getMarqueeClass()} w-full`}>
                        {announcements.map((ann, index) => (
                            <span key={ann.id} className="inline-flex items-center mx-8 text-yellow-900">
                                <Bell className="inline-block mr-2 rtl:ml-2" size={18} />
                                <span className="font-extrabold underline mx-1 text-black">{ann.providers.name}:</span> 
                                <span className="font-medium">{ann.message}</span>
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        )}
        
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex flex-col gap-4">
          {messages.map((msg, index) => {
            if (msg.isComponent && msg.bookingDetails) {
              return <BookingConfirmation key={index} details={msg.bookingDetails} />;
            }
            const isUser = msg.role === Role.USER;
            const isBot = msg.role === Role.BOT;
            
            return (
              <div key={index} className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {isBot && <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white flex-shrink-0"><Bot size={20} /></div>}
                <div className="flex flex-col gap-1">
                   {isBot && <span className="text-xs text-gray-600 dark:text-gray-400 ltr:ml-1 rtl:mr-1">{t('appName')}</span>}
                  <div
                    className={`max-w-xl p-3 rounded-xl max-h-[70vh] overflow-y-auto ${
                      isUser ? 'bg-primary text-white rounded-br-none' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
                    }`}
                  >
                    {msg.imageUrl && (
                      <img src={msg.imageUrl} alt={t('uploadImage')} className="rounded-lg mb-2 max-w-xs max-h-48 object-cover"/>
                    )}
                    {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                  </div>
                </div>
                {isUser && <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-dark dark:text-light flex-shrink-0"><UserIcon size={20} /></div>}
              </div>
            );
          })}
          {isLoading && (
            <div className="flex items-start gap-3 justify-start">
               <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white flex-shrink-0"><Bot size={20} /></div>
               <div className="max-w-md p-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 flex items-center">
                <Loader2 size={20} className="animate-spin text-primary" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        {imagePreviewUrl && (
          <div className="relative w-24 h-24 mb-2 p-1 border border-gray-300 rounded-lg">
            <img src={imagePreviewUrl} alt="Image preview" className="w-full h-full object-cover rounded"/>
            <button 
              onClick={removeImage} 
              className="absolute -top-2 -right-2 rtl:-left-2 rtl:-right-auto bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              aria-label={t('removeImage')}
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
            aria-hidden="true"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="p-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            aria-label={t('uploadImage')}
          >
            <Paperclip />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('inputPlaceholder')}
            className="flex-1 p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || (input.trim() === '' && !imageFile)}
            className="p-3 bg-primary text-white rounded-lg disabled:bg-gray-400 hover:bg-dark transition-colors flex items-center justify-center w-12 h-12"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
