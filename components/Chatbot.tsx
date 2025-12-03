
import React, { useState, useRef, useEffect } from 'react';
import { Message, Role, BookingDetails, AuthenticatedUser, SystemAnnouncement } from '../types';
import { getChatResponse } from '../services/geminiService';
import { useLocalization } from '../hooks/useLocalization';
import { supabase } from '../services/supabaseClient';
import QRCodeDisplay from './QRCodeDisplay';
import { Send, Bot, User as UserIcon, Loader2, Paperclip, X, Bell, Key, ArrowRight, Mic, Volume2, VolumeX, Camera, StopCircle, MapPin, XCircle, ChevronRight, Speaker } from 'lucide-react';

// --- SYSTEM AD CARD (Dismissible) ---
const SystemAdCard: React.FC<{ ad: SystemAnnouncement; onDismiss: () => void }> = ({ ad, onDismiss }) => {
    return (
        <div className="relative w-full mb-4 animate-fade-in px-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-purple-100 dark:border-purple-900 relative">
                <button onClick={onDismiss} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 z-20 hover:bg-black/70"><X size={14}/></button>
                <div className="h-40 bg-gray-200 relative">
                    <img src={ad.image_url || ad.images?.[0]} className="w-full h-full object-cover"/>
                    <span className="absolute bottom-2 left-2 bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase">Sponsored</span>
                </div>
                <div className="p-3">
                    <h4 className="font-bold text-sm dark:text-white">{ad.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{ad.message}</p>
                </div>
            </div>
        </div>
    );
};

const BookingConfirmation: React.FC<{ details: BookingDetails }> = ({ details }) => {
  const { t } = useLocalization();
  return (
    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm mt-2 border-r-4 border-green-500">
      <h4 className="font-bold text-green-600 dark:text-green-400 mb-2">{t('bookingConfirmedTitle')}</h4>
      <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
        <p><span className="font-semibold">{t('service')}:</span> {details.service}</p>
        <p><span className="font-semibold">{t('with')}:</span> {details.provider}</p>
        {details.discount && <p className="text-green-600 font-semibold">{t('discountApplied')}: {details.discount}</p>}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-600 flex justify-center">
         <QRCodeDisplay appointmentId={details.appointmentId} />
      </div>
    </div>
  );
};

// --- AUDIO HOOK ---
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
      } catch (err) { alert("Microphone access denied."); }
    };
  
    const stopRecording = () => {
      if (mediaRecorder.current && isRecording) {
        mediaRecorder.current.stop();
        setIsRecording(false);
      }
    };
    return { isRecording, audioData, startRecording, stopRecording, clearAudio: () => setAudioData(null) };
};

const Chatbot: React.FC<{ currentUser: AuthenticatedUser | null; onOpenAuth: () => void }> = ({ currentUser, onOpenAuth }) => {
  const { t, language } = useLocalization();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<{ base64: string; mimeType: string } | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [systemAds, setSystemAds] = useState<SystemAnnouncement[]>([]);

  // Audio
  const { isRecording, audioData, startRecording, stopRecording, clearAudio } = useAudioRecorder();

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, systemAds]);

  useEffect(() => {
    if (messages.length === 0) setMessages([{ role: Role.BOT, text: t('welcomeMessage') }]);
    const fetchAds = async () => {
        const { data } = await supabase.from('system_announcements').select('*').eq('is_active', true);
        if(data) setSystemAds(data);
    }
    fetchAds();
  }, [currentUser]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setSelectedImage({ base64, mimeType: file.type });
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage && !audioData) || isLoading) return;
    const userMsg: Message = { role: Role.USER, text: input, imageUrl: previewUrl || undefined };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.filter(m => !m.isComponent).map(m => ({ role: m.role === Role.USER ? 'user' : 'model', parts: [{ text: m.text }] }));
      const responseText = await getChatResponse(history, userMsg.text, language, selectedImage, audioData || undefined, currentUser?.id, currentUser?.name);
      
      setSelectedImage(undefined); setPreviewUrl(null); clearAudio();
      
      // Check JSON for Booking
      try {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
              const data = JSON.parse(jsonMatch[0]);
              if (data.bookingConfirmed) {
                   setMessages(prev => [...prev, {
                       role: Role.BOT, text: data.message || t('bookingSuccessMessage'),
                       bookingDetails: { ...data, appointmentId: Date.now() }, isComponent: true
                   }]);
                   setIsLoading(false); return;
              }
          }
      } catch(e) {}

      setMessages(prev => [...prev, { role: Role.BOT, text: responseText }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: Role.BOT, text: t('errorMessage') }]);
    } finally { setIsLoading(false); }
  };

  return (
    <div className="flex flex-col h-full bg-[#E5DDD5] dark:bg-gray-900 relative">
      <div className="flex-1 overflow-y-auto pt-4 pb-20 scrollbar-thin scrollbar-thumb-gray-300">
        <div className="max-w-2xl mx-auto px-4 space-y-3">
            {systemAds.map(ad => (
                <SystemAdCard key={ad.id} ad={ad} onDismiss={() => setSystemAds(prev => prev.filter(a => a.id !== ad.id))} />
            ))}

            {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === Role.USER ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-2xl max-w-[85%] text-sm shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] ${msg.role === Role.USER ? 'bg-[#005C4B] text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 dark:text-gray-100 rounded-tl-none'}`}>
                        {msg.imageUrl && <img src={msg.imageUrl} className="rounded-lg mb-2 max-w-full"/>}
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                        {msg.bookingDetails && <BookingConfirmation details={msg.bookingDetails} />}
                        <div className={`text-[10px] mt-1 flex justify-end ${msg.role === Role.USER ? 'text-green-100' : 'text-gray-400'}`}>
                            {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                    </div>
                </div>
            ))}
            {isLoading && <div className="flex justify-start"><div className="bg-white p-3 rounded-xl rounded-tl-none shadow-sm"><Loader2 size={16} className="animate-spin text-gray-400"/></div></div>}
            <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - WhatsApp Style */}
      <div className="bg-[#F0F2F5] dark:bg-gray-900 p-2 fixed bottom-0 w-full z-30 pb-safe">
        {previewUrl && <div className="absolute bottom-full left-0 bg-gray-100 w-full p-2"><img src={previewUrl} className="h-16 w-16 object-cover rounded"/></div>}
        
        <div className="max-w-3xl mx-auto flex items-end gap-2 px-1">
             <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl flex items-center shadow-sm border border-gray-100 dark:border-gray-700 p-1">
                 <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"><Paperclip size={22}/></button>
                 <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageSelect}/>
                 
                 <textarea 
                    value={input} 
                    onChange={e => setInput(e.target.value)} 
                    placeholder={isRecording ? t('recording') : t('inputPlaceholder')} 
                    className="w-full bg-transparent border-none focus:ring-0 p-3 max-h-24 resize-none dark:text-white placeholder-gray-400 text-sm" 
                    rows={1}
                    dir="auto"
                 />
                 <button className="p-2 text-gray-400"><Camera size={22}/></button>
             </div>

             <div className="mb-0.5">
                 {input.trim() || previewUrl ? (
                     <button onClick={handleSend} className="w-12 h-12 bg-[#005C4B] hover:bg-[#008f72] text-white rounded-full shadow-md flex items-center justify-center transition-all transform hover:scale-105 active:scale-95">
                         <Send size={20} className={language === 'ar' ? 'rotate-180 ml-1' : 'mr-1'}/>
                     </button>
                 ) : (
                     <button onClick={isRecording ? stopRecording : startRecording} className={`w-12 h-12 rounded-full shadow-md text-white flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-[#005C4B]'}`}>
                         {isRecording ? <StopCircle size={20}/> : <Mic size={24}/>}
                     </button>
                 )}
             </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
