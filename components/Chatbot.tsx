
import React, { useState, useRef, useEffect } from 'react';
import { Message, Role, BookingDetails, AuthenticatedUser, SystemAnnouncement, UrgentAd } from '../types';
import { getChatResponse } from '../services/geminiService';
import { useLocalization } from '../hooks/useLocalization';
import { supabase } from '../services/supabaseClient';
import QRCodeDisplay from './QRCodeDisplay';
import { Send, Mic, Paperclip, Camera, Loader2, X, Zap } from 'lucide-react';

const SystemAdCard: React.FC<{ ad: SystemAnnouncement; onDismiss: () => void }> = ({ ad, onDismiss }) => (
    <div className="w-full mb-4 px-4 relative">
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden relative">
            <button onClick={onDismiss} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 z-10"><X size={12}/></button>
            <img src={ad.image_url} className="w-full h-32 object-cover"/>
            <div className="p-2"><h4 className="font-bold text-sm">{ad.title}</h4><p className="text-xs text-gray-500">{ad.message}</p></div>
        </div>
    </div>
);

const Chatbot: React.FC<{ currentUser: AuthenticatedUser | null; onOpenAuth: () => void }> = ({ currentUser, onOpenAuth }) => {
    const { t, language } = useLocalization();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [systemAds, setSystemAds] = useState<SystemAnnouncement[]>([]);
    const [urgentAds, setUrgentAds] = useState<UrgentAd[]>([]);

    useEffect(() => {
        if(messages.length===0) setMessages([{ role: Role.BOT, text: t('welcomeMessage') }]);
        
        // Fetch System Ads
        const fetchAds = async () => {
            const { data } = await supabase.from('system_announcements').select('*').eq('is_active', true);
            if(data) setSystemAds(data);
        }
        
        // Fetch Urgent Ticker Ads
        const fetchUrgent = async () => {
            const { data } = await supabase.from('urgent_ads').select('*, providers(name)').eq('is_active', true);
            setUrgentAds(data as any || []);
        }

        fetchAds();
        fetchUrgent();
    }, []);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const handleSend = async () => {
        if((!input.trim() && !preview) || isLoading) return;
        const userMsg: Message = { role: Role.USER, text: input, imageUrl: preview || undefined };
        setMessages(prev => [...prev, userMsg]);
        setInput(''); setPreview(null);
        setIsLoading(true);

        try {
            const history = messages.filter(m => !m.isComponent).map(m => ({ role: m.role === Role.USER ? 'user' : 'model', parts: [{ text: m.text }] }));
            const responseText = await getChatResponse(history, userMsg.text, language, preview ? { base64: preview.split(',')[1], mimeType: 'image/jpeg' } : undefined, undefined, currentUser?.id, currentUser?.name);
            
            // Check for JSON booking
            try {
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if(jsonMatch) {
                    const data = JSON.parse(jsonMatch[0]);
                    if(data.bookingConfirmed) {
                        setMessages(prev => [...prev, { role: Role.BOT, text: data.message, bookingDetails: { ...data, appointmentId: Date.now() }, isComponent: true }]);
                        setIsLoading(false); return;
                    }
                }
            } catch(e) {}
            
            setMessages(prev => [...prev, { role: Role.BOT, text: responseText }]);
        } catch(e) { setMessages(prev => [...prev, { role: Role.BOT, text: t('errorMessage') }]); } 
        finally { setIsLoading(false); }
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(file) {
            const reader = new FileReader();
            reader.onload = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    }

    return (
        <div className="flex flex-col h-full bg-[#efeae2]">
            {/* URGENT TICKER */}
            {urgentAds.length > 0 && (
                <div className="bg-yellow-300 text-black py-1 overflow-hidden whitespace-nowrap border-b border-yellow-400 z-10 shadow-sm">
                    <div className="animate-marquee inline-block font-bold text-xs">
                        {urgentAds.map(ad => `📢 ${ad.providers?.name || 'Urgent'}: ${ad.message}  •  `)}
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto py-4">
                {systemAds.map(ad => <SystemAdCard key={ad.id} ad={ad} onDismiss={() => setSystemAds(prev => prev.filter(a => a.id !== ad.id))}/>)}
                {messages.map((m, i) => (
                    <div key={i} className={`flex mb-2 px-4 ${m.role === Role.USER ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded-xl max-w-[80%] text-sm shadow-sm ${m.role === Role.USER ? 'bg-[#005c4b] text-white rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                            {m.imageUrl && <img src={m.imageUrl} className="rounded mb-2 max-w-full"/>}
                            <p>{m.text}</p>
                            {m.bookingDetails && (
                                <div className="mt-2 bg-white/10 p-2 rounded">
                                    <p className="font-bold text-xs">Booking Confirmed: {m.bookingDetails.appointmentId}</p>
                                    <div className="mt-2 flex justify-center"><QRCodeDisplay appointmentId={m.bookingDetails.appointmentId}/></div>
                                </div>
                            )}
                            <div className={`text-[10px] text-right mt-1 ${m.role === Role.USER ? 'text-green-100' : 'text-gray-400'}`}>{new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex px-4 justify-start">
                         <div className="bg-white p-2 rounded-xl rounded-tl-none shadow-sm"><Loader2 size={16} className="animate-spin text-gray-400"/></div>
                    </div>
                )}
                <div ref={messagesEndRef}/>
            </div>

            {/* WhatsApp Input */}
            <div className="p-2 bg-[#f0f2f5] flex items-end gap-2">
                <div className="flex-1 bg-white rounded-2xl flex items-center p-1 shadow-sm border">
                    <button onClick={() => fileRef.current?.click()} className="p-2 text-gray-400"><Paperclip/></button>
                    <input type="file" ref={fileRef} hidden onChange={handleFile} accept="image/*"/>
                    <textarea 
                        value={input} 
                        onChange={e => setInput(e.target.value)} 
                        placeholder={t('inputPlaceholder')} 
                        rows={1} 
                        className="flex-1 border-none focus:ring-0 resize-none max-h-20 py-3 text-sm outline-none"
                    />
                    <button className="p-2 text-gray-400"><Camera/></button>
                </div>
                <button 
                    onClick={handleSend} 
                    className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all ${input.trim() || preview ? 'bg-[#0088cc] text-white' : 'bg-[#00a884] text-white'}`}
                >
                    {input.trim() || preview ? <Send size={20} className={language === 'ar' ? 'rotate-180 ml-1' : 'mr-1'}/> : <Mic size={24}/>}
                </button>
            </div>
            {preview && <div className="absolute bottom-16 left-2 w-20 h-20 bg-white p-1 shadow-lg rounded"><img src={preview} className="w-full h-full object-cover"/><button onClick={() => setPreview(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><X size={12}/></button></div>}
        </div>
    );
};

export default Chatbot;
