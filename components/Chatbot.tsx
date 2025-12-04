
import React, { useState, useRef, useEffect } from 'react';
import { Message, Role, AuthenticatedUser, SystemAnnouncement, UrgentAd, Offer } from '../types';
import { getChatResponse } from '../services/geminiService';
import { useLocalization } from '../hooks/useLocalization';
import { supabase } from '../services/supabaseClient';
import QRCodeDisplay from './QRCodeDisplay';
import { Send, Mic, Paperclip, Camera, Loader2, X, Globe, Search, ArrowLeft, MoreVertical, Calendar, Info, Phone, MapPin, Instagram, Facebook, Tag } from 'lucide-react';

// --- SUB-COMPONENTS ---

// 1. URGENT TICKER
const UrgentTicker: React.FC = () => {
    const [ads, setAds] = useState<UrgentAd[]>([]);
    useEffect(() => {
        const fetch = async () => {
            const { data } = await supabase.from('urgent_ads').select('*, providers(name)').eq('is_active', true);
            setAds(data as any || []);
        }
        fetch();
    }, []);

    if(ads.length === 0) return null;

    return (
        <div className="bg-yellow-100 text-yellow-900 py-1 overflow-hidden whitespace-nowrap border-b border-yellow-200 z-10 shadow-sm">
            <div className="animate-marquee inline-block font-bold text-xs">
                {ads.map(ad => `📢 ${ad.providers?.name || 'Urgent'}: ${ad.message}  •  `)}
            </div>
        </div>
    );
}

// 2. SYSTEM ADS BANNER
const SystemAdCard: React.FC<{ ad: SystemAnnouncement; onDismiss: () => void }> = ({ ad, onDismiss }) => (
    <div className="w-full mb-4 px-4 relative mt-2">
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden relative">
            <button onClick={onDismiss} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 z-10"><X size={12}/></button>
            <img src={ad.image_url} className="w-full h-32 object-cover"/>
            <div className="p-2"><h4 className="font-bold text-sm">{ad.title}</h4><p className="text-xs text-gray-500">{ad.message}</p></div>
        </div>
    </div>
);

// 3. PROFILE DETAILS MODAL (Inside Chat)
const ChatProfileModal: React.FC<{ provider: any; onClose: () => void }> = ({ provider, onClose }) => {
    const { t } = useLocalization();
    const [offers, setOffers] = useState<Offer[]>([]);
    
    useEffect(() => {
        const fetch = async () => {
            const { data } = await supabase.from('provider_offers').select('*').eq('provider_id', provider.id);
            setOffers(data || []);
        }
        fetch();
    }, [provider]);

    return (
        <div className="absolute inset-0 bg-white z-[60] flex flex-col animate-slide-up overflow-y-auto">
             <div className="p-4 bg-gray-50 border-b sticky top-0 flex items-center gap-3">
                <button onClick={onClose}><ArrowLeft/></button>
                <h2 className="font-bold">{t('navProfile')}</h2>
             </div>
             <div className="p-4">
                 <div className="flex flex-col items-center mb-6">
                     <div className="w-24 h-24 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 to-purple-600 mb-2">
                        <img src={provider.profile_image_url || `https://ui-avatars.com/api/?name=${provider.name}`} className="w-full h-full rounded-full border-4 border-white object-cover"/>
                     </div>
                     <h2 className="font-bold text-xl">{provider.name}</h2>
                     <p className="text-gray-500">{provider.service_type}</p>
                 </div>

                 <div className="grid grid-cols-3 gap-2 mb-6 text-center">
                     <div className="bg-gray-50 p-2 rounded-lg"><div className="font-bold">{offers.length}</div><div className="text-[10px] text-gray-500">{t('offers')}</div></div>
                     <div className="bg-gray-50 p-2 rounded-lg"><div className="font-bold">{provider.followers_count || 0}</div><div className="text-[10px] text-gray-500">{t('followers')}</div></div>
                     <div className="bg-gray-50 p-2 rounded-lg"><div className="font-bold">{provider.visits_count || 0}</div><div className="text-[10px] text-gray-500">{t('visits')}</div></div>
                 </div>

                 <div className="space-y-4 mb-6">
                     <h3 className="font-bold border-b pb-2">{t('bioLabel')}</h3>
                     <p className="text-sm text-gray-600">{provider.bio || "No bio available."}</p>
                     
                     <h3 className="font-bold border-b pb-2">{t('socialLinks')}</h3>
                     <div className="flex gap-4">
                        {provider.social_links?.instagram && <a href={`https://instagram.com/${provider.social_links.instagram}`} className="text-pink-600"><Instagram/></a>}
                        {provider.social_links?.facebook && <a href={`https://facebook.com/${provider.social_links.facebook}`} className="text-blue-600"><Facebook/></a>}
                        {provider.social_links?.gps && <a href={`https://maps.google.com/?q=${provider.social_links.gps}`} className="text-green-600"><MapPin/></a>}
                     </div>
                 </div>

                 <h3 className="font-bold border-b pb-2 mb-4">{t('offers')}</h3>
                 <div className="grid grid-cols-2 gap-3">
                    {offers.map(o => (
                        <div key={o.id} className="border rounded-xl overflow-hidden shadow-sm">
                            {o.image_url && <img src={o.image_url} className="w-full h-24 object-cover"/>}
                            <div className="p-2">
                                <h4 className="font-bold text-xs truncate">{o.title}</h4>
                                <div className="flex gap-2 text-[10px]">
                                    <span className="line-through text-gray-400">{o.original_price}</span>
                                    <span className="text-red-600 font-bold">{o.discount_price} DH</span>
                                </div>
                            </div>
                        </div>
                    ))}
                 </div>
             </div>
        </div>
    )
}

// --- MAIN CHATBOT COMPONENT ---

const Chatbot: React.FC<{ currentUser: AuthenticatedUser | null; onOpenAuth: () => void; onDiscover: () => void }> = ({ currentUser, onOpenAuth, onDiscover }) => {
    const { t, language } = useLocalization();
    
    // VIEW STATE: 'LIST' (WhatsApp Home) or 'CHAT' (Conversation)
    const [view, setView] = useState<'LIST' | 'CHAT'>('LIST');
    const [selectedChat, setSelectedChat] = useState<any | null>(null); // null = Tanger IA (General) or Provider Object
    
    // Data
    const [providers, setProviders] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [systemAds, setSystemAds] = useState<SystemAnnouncement[]>([]);

    // Chat Logic
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);

    // Profile Modal Inside Chat
    const [showProfile, setShowProfile] = useState(false);

    useEffect(() => {
        const fetchProviders = async () => {
            const { data } = await supabase.from('providers').select('*').eq('is_active', true);
            setProviders(data || []);
        }
        const fetchAds = async () => {
            const { data } = await supabase.from('system_announcements').select('*').eq('is_active', true);
            if(data) setSystemAds(data);
        }
        fetchProviders();
        fetchAds();
    }, []);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, view]);

    // Handle opening a chat
    const openChat = (provider: any | null) => {
        setSelectedChat(provider);
        setMessages([]); // Reset messages for new session (In a real app, fetch history)
        setView('CHAT');
        setShowProfile(false);
    };

    const handleSend = async () => {
        if((!input.trim() && !preview) || isLoading) return;
        const userMsg: Message = { role: Role.USER, text: input, imageUrl: preview || undefined };
        setMessages(prev => [...prev, userMsg]);
        setInput(''); setPreview(null);
        setIsLoading(true);

        try {
            const history = messages.filter(m => !m.isComponent).map(m => ({ role: m.role === Role.USER ? 'user' : 'model', parts: [{ text: m.text }] }));
            
            // Pass selectedChat (provider) to AI service
            const responseText = await getChatResponse(
                history, 
                userMsg.text, 
                language, 
                preview ? { base64: preview.split(',')[1], mimeType: 'image/jpeg' } : undefined, 
                undefined, 
                currentUser?.id, 
                currentUser?.name,
                selectedChat // This is the KEY update: Passing the provider context
            );
            
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

    // --- VIEW 1: WHATSAPP STYLE CHAT LIST ---
    if (view === 'LIST') {
        const filteredProviders = providers.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.service_type.toLowerCase().includes(searchTerm.toLowerCase()));
        
        return (
            <div className="flex flex-col h-full bg-white relative">
                <UrgentTicker />
                
                {/* Search Bar */}
                <div className="p-4 border-b">
                    <div className="bg-gray-100 rounded-full flex items-center px-4 py-2">
                        <Search size={18} className="text-gray-400"/>
                        <input 
                            placeholder={t('search')} 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none outline-none flex-1 ml-2 text-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {/* Tanger IA (Pinned) */}
                    <div onClick={() => openChat(null)} className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
                            <Globe size={28}/>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="font-bold text-gray-900">Tanger IA</h3>
                                <span className="text-[10px] text-gray-400">Now</span>
                            </div>
                            <p className="text-sm text-gray-500 line-clamp-1">{t('appDesc')}</p>
                        </div>
                    </div>

                    {/* Providers List */}
                    {filteredProviders.map(p => (
                        <div key={p.id} onClick={() => openChat(p)} className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                            <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden border border-gray-100 relative">
                                <img src={p.profile_image_url || `https://ui-avatars.com/api/?name=${p.name}`} className="w-full h-full object-cover"/>
                                <span className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className="font-bold text-gray-900">{p.name}</h3>
                                    <span className="text-[10px] text-gray-400">Online</span>
                                </div>
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                    <span className="font-semibold text-blue-600">{p.service_type}:</span> 
                                    Tap to chat
                                </p>
                            </div>
                        </div>
                    ))}
                    {filteredProviders.length === 0 && searchTerm && (
                        <p className="text-center text-gray-400 py-10">No providers found.</p>
                    )}
                </div>
            </div>
        );
    }

    // --- VIEW 2: CONVERSATION WINDOW ---
    return (
        <div className="flex flex-col h-full bg-[#EFE7DD] relative"> {/* WhatsApp Background Color */}
            <UrgentTicker />

            {/* Chat Header */}
            <div className="bg-white p-2 border-b flex items-center gap-2 shadow-sm z-20">
                <button onClick={() => setView('LIST')} className="p-2"><ArrowLeft size={20}/></button>
                
                <div onClick={() => selectedChat && setShowProfile(true)} className="flex items-center gap-3 flex-1 cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border">
                         {selectedChat ? (
                             <img src={selectedChat.profile_image_url || `https://ui-avatars.com/api/?name=${selectedChat.name}`} className="w-full h-full object-cover"/>
                         ) : (
                             <div className="w-full h-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white"><Globe size={20}/></div>
                         )}
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">{selectedChat ? selectedChat.name : 'Tanger IA'}</h3>
                        <p className="text-[10px] text-green-600 font-bold">Online</p>
                    </div>
                </div>

                <div className="flex gap-1 text-blue-600">
                    <button onClick={() => selectedChat && setShowProfile(true)} className="p-2 hover:bg-gray-100 rounded-full"><Info size={20}/></button>
                    <button onClick={() => handleSend()} className="p-2 hover:bg-gray-100 rounded-full"><Calendar size={20}/></button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#EFE7DD] relative">
                {/* Background Pattern Overlay if needed, but solid color is cleaner */}
                
                {systemAds.map(ad => <SystemAdCard key={ad.id} ad={ad} onDismiss={() => setSystemAds(prev => prev.filter(a => a.id !== ad.id))}/>)}

                {/* Empty State for New Chat */}
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-center opacity-60">
                         <div className="bg-[#DCF8C6] p-4 rounded-full mb-2"><Globe className="text-green-600"/></div>
                         <p className="text-xs bg-[#FFF5C4] p-2 rounded shadow-sm text-gray-700">
                             {selectedChat 
                                ? `You are now chatting with ${selectedChat.name}. Ask about appointments or services.`
                                : t('welcomeMessage')
                             }
                         </p>
                    </div>
                )}

                {messages.map((m, i) => (
                    <div key={i} className={`flex mb-2 ${m.role === Role.USER ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-2 px-3 rounded-lg max-w-[80%] text-sm shadow-sm relative ${m.role === Role.USER ? 'bg-[#dcf8c6] text-gray-900 rounded-tr-none' : 'bg-white text-gray-900 rounded-tl-none'}`}>
                            {m.imageUrl && <img src={m.imageUrl} className="rounded mb-2 max-w-full"/>}
                            <p className="leading-relaxed whitespace-pre-line">{m.text}</p>
                            
                            {m.bookingDetails && (
                                <div className="mt-2 bg-gray-50 p-2 rounded border border-gray-200">
                                    <p className="font-bold text-xs text-center">Booking ID: {m.bookingDetails.appointmentId}</p>
                                    <div className="mt-2 flex justify-center"><QRCodeDisplay appointmentId={m.bookingDetails.appointmentId}/></div>
                                </div>
                            )}

                            <div className="text-[9px] text-gray-400 text-right mt-1 flex justify-end items-center gap-1">
                                {new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                            </div>
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                     <div className="flex justify-start mb-2">
                        <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm"><Loader2 size={16} className="animate-spin text-gray-400"/></div>
                     </div>
                )}
                <div ref={messagesEndRef}/>
            </div>

            {/* Input Area */}
            <div className="p-2 bg-white flex items-end gap-2 pb-safe border-t">
                <div className="flex-1 bg-gray-100 rounded-3xl flex items-center p-1.5 px-3">
                    <button onClick={() => fileRef.current?.click()} className="p-2 text-gray-400 hover:text-gray-600"><Paperclip size={20}/></button>
                    <input type="file" ref={fileRef} hidden onChange={handleFile} accept="image/*"/>
                    <textarea 
                        value={input} 
                        onChange={e => setInput(e.target.value)} 
                        placeholder={t('inputPlaceholder')} 
                        rows={1} 
                        className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-20 py-3 text-sm outline-none text-gray-800"
                        onKeyDown={e => {
                             if(e.key === 'Enter' && !e.shiftKey) {
                                 e.preventDefault();
                                 handleSend();
                             }
                        }}
                    />
                    <button className="p-2 text-gray-400 hover:text-gray-600"><Camera size={20}/></button>
                </div>
                <button 
                    onClick={handleSend} 
                    className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${input.trim() || preview ? 'bg-blue-600 text-white' : 'bg-green-500 text-white'}`}
                >
                    {input.trim() || preview ? <Send size={20} className={language === 'ar' ? 'rotate-180 ml-1' : 'mr-1'}/> : <Mic size={24}/>}
                </button>
            </div>

            {preview && (
                <div className="absolute bottom-20 left-4 w-32 h-32 bg-white p-2 shadow-2xl rounded-xl border z-30">
                    <img src={preview} className="w-full h-full object-cover rounded-lg"/>
                    <button onClick={() => setPreview(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md"><X size={14}/></button>
                </div>
            )}

            {/* Profile Overlay Modal */}
            {showProfile && selectedChat && (
                <ChatProfileModal provider={selectedChat} onClose={() => setShowProfile(false)} />
            )}
        </div>
    );
};

export default Chatbot;
