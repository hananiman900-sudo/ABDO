
import React, { useState, useRef, useEffect } from 'react';
import { Message, Role, BookingDetails, AuthenticatedUser, SystemAnnouncement } from '../types';
import { getChatResponse } from '../services/geminiService';
import { useLocalization } from '../hooks/useLocalization';
import { supabase } from '../services/supabaseClient';
import QRCodeDisplay from './QRCodeDisplay';
import { Send, Bot, User as UserIcon, Loader2, Paperclip, X, Bell, Key, ArrowRight, Mic, Volume2, VolumeX, Camera, StopCircle, MapPin, XCircle, ChevronRight } from 'lucide-react';

// --- SYSTEM AD CARD ---
const SystemAdCard: React.FC<{ ad: SystemAnnouncement; onDismiss: () => void }> = ({ ad, onDismiss }) => {
    const [currentImg, setCurrentImg] = useState(0);
    const images = ad.images && ad.images.length > 0 ? ad.images : (ad.image_url ? [ad.image_url] : []);
    
    return (
        <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-purple-100 dark:border-purple-900 overflow-hidden mb-4 relative animate-fade-in mx-auto max-w-sm mt-4 group">
            <button onClick={onDismiss} className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 z-20"><X size={16}/></button>
            <div className="absolute top-2 left-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-20 uppercase tracking-wider">Sponsored</div>
            
            {images.length > 0 && (
                <div className="relative h-48 w-full bg-gray-100">
                    <img src={images[currentImg]} className="w-full h-full object-cover" alt="Ad"/>
                    {images.length > 1 && (
                        <div className="absolute bottom-2 left-0 w-full flex justify-center gap-1">
                            {images.map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === currentImg ? 'bg-white' : 'bg-white/50'}`}/>)}
                        </div>
                    )}
                    {images.length > 1 && (
                        <button onClick={(e) => { e.stopPropagation(); setCurrentImg((p) => (p + 1) % images.length); }} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white p-1 rounded-full"><ChevronRight size={16}/></button>
                    )}
                </div>
            )}

            <div className="p-4">
                <h4 className="font-bold text-lg dark:text-white mb-1">{ad.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{ad.message}</p>
            </div>
        </div>
    );
};

const BookingConfirmation: React.FC<{ details: BookingDetails }> = ({ details }) => {
  const { t } = useLocalization();
  return (
    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm mt-2 border-l-4 border-green-500">
      <h4 className="font-bold text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
        <CheckCircle2 size={18} />
        {t('bookingConfirmedTitle')}
      </h4>
      <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
        <p><span className="font-semibold">{t('service')}:</span> {details.service}</p>
        <p><span className="font-semibold">{t('with')}:</span> {details.provider}</p>
        <p className="flex items-center gap-1"><MapPin size={12}/> {details.location}</p>
        {details.discount && (
          <p className="text-green-600 font-semibold">{t('discountApplied')}: {details.discount}</p>
        )}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-600">
        <p className="text-xs text-center text-gray-500 mb-2">{t('qrInstruction')}</p>
        <div className="flex justify-center">
            <QRCodeDisplay appointmentId={details.appointmentId} />
        </div>
      </div>
    </div>
  );
};

// --- AUDIO RECORDER HOOK ---
const useAudioRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioData, setAudioData] = useState<{ base64: string; mimeType: string } | null>(null);
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const chunks = useRef<Blob[]>([]);
  
    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder.current = new MediaRecorder(stream);
        chunks.current = [];
  
        mediaRecorder.current.ondataavailable = (e) => chunks.current.push(e.data);
        mediaRecorder.current.onstop = () => {
          const blob = new Blob(chunks.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            setAudioData({ base64, mimeType: 'audio/webm' });
          };
        };
  
        mediaRecorder.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        alert("Microphone access denied or not available.");
      }
    };
  
    const stopRecording = () => {
      if (mediaRecorder.current && isRecording) {
        mediaRecorder.current.stop();
        setIsRecording(false);
      }
    };
  
    const clearAudio = () => setAudioData(null);
  
    return { isRecording, audioData, startRecording, stopRecording, clearAudio };
};

import { CheckCircle2 } from 'lucide-react';

interface ChatbotProps {
  currentUser: AuthenticatedUser | null;
  onOpenAuth: () => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ currentUser, onOpenAuth }) => {
  const { t, language } = useLocalization();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<{ base64: string; mimeType: string } | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [systemAds, setSystemAds] = useState<SystemAnnouncement[]>([]);

  // Audio Recorder
  const { isRecording, audioData, startRecording, stopRecording, clearAudio } = useAudioRecorder();

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, systemAds]);

  // Initial Greeting & Ads Fetch
  useEffect(() => {
    const init = async () => {
        if (messages.length === 0) {
            const welcomeText = currentUser 
                ? t('welcomeBackMessage', { name: currentUser.name || currentUser.full_name || '' }) + t('welcomeMessage').replace(t('welcomeMessage').split('!')[0] + '!', '')
                : t('welcomeMessage');
            
            setMessages([{ role: Role.BOT, text: welcomeText }]);
        }
        
        // Fetch Ads
        const { data } = await supabase.from('system_announcements').select('*').eq('is_active', true).order('created_at', { ascending: false });
        if(data) setSystemAds(data);
    }
    init();
  }, [currentUser, t, language]);

  // Handle Text-to-Speech
  useEffect(() => {
    if ('speechSynthesis' in window) {
       window.speechSynthesis.cancel();
    }
  }, [language]);

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    // Remove emojis and markdown for cleaner speech
    const cleanText = text.replace(/[*#]/g, '').replace(/https?:\/\/\S+/g, 'link');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'ar' ? 'ar-SA' : (language === 'fr' ? 'fr-FR' : 'en-US');
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        setSelectedImage({
          base64: base64Data,
          mimeType: file.type
        });
        setPreviewUrl(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearAttachments = () => {
    setSelectedImage(undefined);
    setPreviewUrl(null);
    clearAudio();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage && !audioData) || isLoading) return;

    const userMsg: Message = { role: Role.USER, text: input, imageUrl: previewUrl || undefined };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Prepare History
    const history = messages
        .filter(m => !m.isComponent)
        .map(m => ({
            role: m.role === Role.USER ? 'user' : 'model',
            parts: [{ text: m.text }]
        }));

    // Get Provider Announcements context
    let announcementsText = "";
    try {
        const { data: announcements } = await supabase
            .from('announcements')
            .select('message, providers(name)')
            .order('created_at', { ascending: false })
            .limit(5);
        if (announcements) {
            announcementsText = announcements.map((a: any) => `${a.providers?.name}: ${a.message}`).join('. ');
        }
    } catch (e) {}
    
    // Check user location
    let userLoc = undefined;
    if (currentUser?.latitude && currentUser?.longitude) {
        userLoc = { lat: currentUser.latitude, lng: currentUser.longitude };
    }

    try {
      const responseText = await getChatResponse(
          history, 
          userMsg.text, 
          language, 
          selectedImage,
          audioData || undefined,
          currentUser?.id,
          currentUser?.name || currentUser?.full_name,
          currentUser?.phone,
          announcementsText,
          userLoc
      );
      
      clearAttachments();

      // Check for JSON (Booking)
      let botMsg: Message;
      try {
        // Attempt to extract JSON if present
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const jsonStr = jsonMatch[0];
            const data = JSON.parse(jsonStr);
            if (data.bookingConfirmed) {
                // It's a booking
                const bookingDetails: BookingDetails = {
                    name: data.name,
                    phone: data.phone,
                    service: data.service,
                    provider: data.provider,
                    location: data.location,
                    discount: data.discount,
                    appointmentId: data.appointmentId || Date.now() // Fallback ID
                };
                 
                 // Save to DB
                 if (currentUser) {
                     // In a real app, you'd find the provider_id by name match or handle ID in LLM
                     // For demo, we just show the card. Saving to DB logic ideally happens via tool calling or strict ID handling.
                 }

                botMsg = {
                    role: Role.BOT,
                    text: data.message || t('bookingSuccessMessage'),
                    bookingDetails: bookingDetails,
                    isComponent: true
                };
            } else {
                botMsg = { role: Role.BOT, text: responseText };
            }
        } else {
            botMsg = { role: Role.BOT, text: responseText };
        }
      } catch (e) {
        botMsg = { role: Role.BOT, text: responseText };
      }

      setMessages(prev => [...prev, botMsg]);
      speak(botMsg.text);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: Role.BOT, text: t('errorMessage') }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 relative">
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="max-w-2xl mx-auto space-y-6">
            {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === Role.USER ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start max-w-[85%] ${msg.role === Role.USER ? 'flex-row-reverse' : 'flex-row'} gap-3 animate-slide-up`}>
                
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === Role.USER ? 'bg-primary' : 'bg-white dark:bg-gray-800'}`}>
                    {msg.role === Role.USER ? <UserIcon size={16} className="text-white"/> : <Bot size={18} className="text-primary"/>}
                </div>

                {/* Bubble */}
                <div className={`p-4 rounded-2xl shadow-sm relative group text-sm leading-relaxed ${
                    msg.role === Role.USER 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-white dark:bg-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700'
                }`}>
                    {msg.imageUrl && (
                        <img src={msg.imageUrl} alt="Uploaded" className="max-w-full h-auto rounded-lg mb-2 border border-white/20" />
                    )}
                    
                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {msg.bookingDetails && <BookingConfirmation details={msg.bookingDetails} />}
                    
                    {/* Speak Button for Bot */}
                    {msg.role === Role.BOT && (
                        <button 
                            onClick={() => isSpeaking ? stopSpeaking() : speak(msg.text)}
                            className="absolute -right-8 top-1 text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            {isSpeaking ? <VolumeX size={16}/> : <Volume2 size={16}/>}
                        </button>
                    )}
                </div>
                </div>
            </div>
            ))}
            
            {/* System Ads inserted at the bottom of the feed */}
            {systemAds.length > 0 && (
                <div className="mt-8 pt-4 border-t border-dashed border-gray-200 dark:border-gray-800">
                    <p className="text-center text-xs text-gray-400 mb-4 uppercase tracking-widest">{t('activeAds')}</p>
                    {systemAds.map(ad => (
                         <SystemAdCard key={ad.id} ad={ad} onDismiss={() => setSystemAds(prev => prev.filter(a => a.id !== ad.id))} />
                    ))}
                </div>
            )}

            {isLoading && (
                <div className="flex justify-start">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-tl-none border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
                        <Bot size={18} className="text-primary"/>
                        <div className="flex gap-1">
                            <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                            <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 p-3 md:p-4 fixed bottom-0 w-full z-30">
        
        {/* Attachments Preview */}
        {(previewUrl || audioData) && (
            <div className="absolute bottom-full left-0 w-full bg-gray-50 dark:bg-gray-900 p-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-3 animate-slide-up">
                {previewUrl && (
                    <div className="relative h-16 w-16 rounded-lg overflow-hidden border border-gray-300">
                        <img src={previewUrl} className="h-full w-full object-cover" />
                        <button onClick={clearAttachments} className="absolute top-0 right-0 bg-red-500 text-white p-0.5"><X size={12}/></button>
                    </div>
                )}
                {audioData && (
                    <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs font-bold border border-red-100">
                        <Mic size={14}/> Audio Recorded
                        <button onClick={clearAttachments}><X size={14}/></button>
                    </div>
                )}
            </div>
        )}

        <div className="max-w-3xl mx-auto flex items-end gap-2">
            
            {/* Attachment Buttons */}
            <div className="flex pb-2 gap-1">
                <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="p-2 text-gray-400 hover:text-primary transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    <Paperclip size={20} />
                </button>
                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-2 transition-colors rounded-full ${isRecording ? 'text-red-500 bg-red-50 animate-pulse' : 'text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                    {isRecording ? <StopCircle size={20}/> : <Mic size={20}/>}
                </button>
                <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="md:hidden p-2 text-gray-400 hover:text-primary transition-colors rounded-full"
                >
                    <Camera size={20} />
                </button>
            </div>

            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageSelect} 
            />

            {/* Text Input */}
            <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center p-1 border border-transparent focus-within:border-primary/30 transition-colors">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder={isRecording ? "Recording..." : t('inputPlaceholder')}
                    disabled={isRecording}
                    className="w-full bg-transparent border-none focus:ring-0 text-sm p-3 max-h-32 resize-none dark:text-white placeholder-gray-400"
                    rows={1}
                />
            </div>

            {/* Send Button */}
            <button
                onClick={handleSend}
                disabled={isLoading || (!input.trim() && !selectedImage && !audioData)}
                className="p-3 bg-primary hover:bg-primaryDark disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl shadow-md transition-all active:scale-95 disabled:scale-100 disabled:shadow-none mb-0.5"
            >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className={language === 'ar' ? 'rotate-180' : ''} />}
            </button>
        </div>
        
        {/* Not Logged In Hint */}
        {!currentUser && (
            <div className="text-center mt-2">
                <button onClick={onOpenAuth} className="text-xs text-primary font-bold hover:underline">
                    {t('loginRequired')}
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default Chatbot;
