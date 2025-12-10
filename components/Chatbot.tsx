
import React, { useState, useRef, useEffect } from 'react';
import { Message, Role, AuthenticatedUser, SystemAnnouncement, UrgentAd, Offer } from '../types';
import { getChatResponse } from '../services/geminiService';
import { useLocalization } from '../hooks/useLocalization';
import { supabase } from '../services/supabaseClient';
import QRCodeDisplay from './QRCodeDisplay';
import { Send, Mic, Paperclip, Camera, Loader2, X, Globe, Search, ArrowLeft, MoreVertical, Calendar, Info, Phone, MapPin, Instagram, Facebook, Tag, UserPlus, UserCheck, Megaphone, Star, Check, ChevronDown, CheckCircle, StopCircle, Sparkles, Banknote, Clock } from 'lucide-react';

// ... (Existing Sub-components: UrgentTicker, BookingModal, ChatProfileModal remain unchanged)

export const UrgentTicker: React.FC = () => {
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

export const BookingModal: React.FC<{ provider: any; onClose: () => void; currentUser: AuthenticatedUser | null; onBooked: (details: any) => void; initialOffer?: Offer | null }> = ({ provider, onClose, currentUser, onBooked, initialOffer }) => {
    const { t } = useLocalization();
    const [offers, setOffers] = useState<Offer[]>([]);
    const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [guestName, setGuestName] = useState(''); 
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchOffers = async () => {
             const { data } = await supabase.from('provider_offers').select('*').eq('provider_id', provider.id);
             setOffers(data || []);
        }
        fetchOffers();
    }, [provider]);

    useEffect(() => { if(initialOffer) { setSelectedOffer(initialOffer); } }, [initialOffer]);

    const handleConfirm = async () => {
        if(!currentUser && !guestName.trim()) return alert("Please enter your name to book.");
        if(!date || !time) return alert("Please select date and time");
        setLoading(true);
        const appointmentId = Date.now();
        const clientName = currentUser ? currentUser.name : guestName; 
        if (currentUser) {
            await supabase.from('appointments').insert({ client_id: currentUser.id, provider_id: provider.id, created_at: new Date().toISOString() });
        }
        await supabase.from('provider_notifications').insert({ provider_id: provider.id, message: `New Booking: ${clientName} for ${selectedOffer?.title || 'General Visit'} on ${date} at ${time}`, type: 'BOOKING', status: 'pending' });
        const bookingDetails = { appointmentId, clientName: clientName, providerId: provider.id, provider: provider.name, service: provider.service_type, date: date, time: time, offerTitle: selectedOffer?.title, price: selectedOffer?.discount_price, message: `${t('bookingSuccessMessage')} ${t('keepQR')}` };
        onBooked(bookingDetails);
        setLoading(false);
    }
    return (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50"><h3 className="font-bold text-lg flex items-center gap-2"><Calendar className="text-blue-600"/> {t('bookAppointment')}</h3><button onClick={onClose}><X/></button></div>
                <div className="p-4 space-y-4">
                    {!currentUser && (<div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Your Name</label><input type="text" placeholder="Enter full name" value={guestName} onChange={e => setGuestName(e.target.value)} className="w-full p-2 border border-red-200 bg-red-50 rounded-lg text-sm outline-none focus:border-red-500"/></div>)}
                    <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">{t('selectOffer')}</label><div className="space-y-2 max-h-40 overflow-y-auto">{offers.map(offer => (<div key={offer.id} onClick={() => setSelectedOffer(offer === selectedOffer ? null : offer)} className={`p-3 border rounded-lg cursor-pointer flex justify-between items-center transition-all ${selectedOffer?.id === offer.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}><div><p className="font-bold text-sm">{offer.title}</p><p className="text-xs text-red-500 font-bold">{offer.discount_price} DH</p></div>{selectedOffer?.id === offer.id && <CheckCircle size={16} className="text-blue-600"/>}</div>))}{offers.length === 0 && <p className="text-xs text-gray-400 italic">No special offers available.</p>}</div></div>
                    <div className="flex gap-2"><div className="flex-1"><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border rounded-lg text-sm"/></div><div className="flex-1"><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Time</label><input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full p-2 border rounded-lg text-sm"/></div></div>
                    <button onClick={handleConfirm} disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2">{loading ? <Loader2 className="animate-spin"/> : <><Tag size={16}/> {t('bookAppointment')}</>}</button>
                </div>
            </div>
        </div>
    )
}

export const ChatProfileModal: React.FC<{ provider: any; onClose: () => void; currentUser: AuthenticatedUser | null; onBookOffer?: (offer: Offer) => void }> = ({ provider, onClose, currentUser, onBookOffer }) => {
    const { t } = useLocalization();
    const [offers, setOffers] = useState<Offer[]>([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [stats, setStats] = useState({ followers: 0, posts: 0 });
    useEffect(() => {
        const fetch = async () => {
            const { data } = await supabase.from('provider_offers').select('*').eq('provider_id', provider.id);
            setOffers(data || []);
            setStats(prev => ({ ...prev, posts: data?.length || 0 }));
            const { count } = await supabase.from('follows').select('id', { count: 'exact' }).eq('provider_id', provider.id);
            setStats(prev => ({ ...prev, followers: count || 0 }));
            if(currentUser) {
                const { data: follow } = await supabase.from('follows').select('*').eq('client_id', currentUser.id).eq('provider_id', provider.id).single();
                setIsFollowing(!!follow);
            }
        }
        fetch();
    }, [provider, currentUser]);
    const handleFollow = async () => {
        if(!currentUser) return alert(t('loginRequired'));
        if(isFollowing) { await supabase.from('follows').delete().eq('client_id', currentUser.id).eq('provider_id', provider.id); setStats(prev => ({ ...prev, followers: prev.followers - 1 })); } 
        else { await supabase.from('follows').insert({ client_id: currentUser.id, provider_id: provider.id }); setStats(prev => ({ ...prev, followers: prev.followers + 1 })); }
        setIsFollowing(!isFollowing);
    }
    return (
        <div className="absolute inset-0 bg-white z-[60] flex flex-col animate-slide-up overflow-y-auto">
             <div className="p-4 bg-gray-50 border-b sticky top-0 flex items-center gap-3"><button onClick={onClose}><ArrowLeft/></button><h2 className="font-bold">{t('navProfile')}</h2></div>
             <div className="p-4">
                 <div className="flex flex-col items-center mb-6"><div className="w-24 h-24 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 to-purple-600 mb-2"><img src={provider.profile_image_url || `https://ui-avatars.com/api/?name=${provider.name}`} className="w-full h-full rounded-full border-4 border-white object-cover"/></div><h2 className="font-bold text-xl">{provider.name}</h2><p className="text-gray-500">{provider.service_type}</p><button onClick={handleFollow} className={`mt-3 px-8 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-sm transition-all ${isFollowing ? 'bg-gray-100 text-black border border-gray-300' : 'bg-blue-600 text-white'}`}>{isFollowing ? <UserCheck size={16}/> : <UserPlus size={16}/>}{isFollowing ? t('unfollow') : t('follow')}</button></div>
                 <div className="flex justify-center gap-8 mb-6 text-center"><div className="flex flex-col items-center"><div className="font-black text-xl">{stats.followers}</div><div className="text-xs text-gray-500 font-bold uppercase tracking-wide">{t('followers')}</div></div><div className="w-px bg-gray-200 h-10"></div><div className="flex flex-col items-center"><div className="font-black text-xl">{stats.posts}</div><div className="text-xs text-gray-500 font-bold uppercase tracking-wide">{t('offers')}</div></div></div>
                 <div className="space-y-4 mb-6"><h3 className="font-bold border-b pb-2">{t('bioLabel')}</h3><p className="text-sm text-gray-600 whitespace-pre-line">{provider.bio || "No bio available."}</p><h3 className="font-bold border-b pb-2">{t('socialLinks')}</h3><div className="flex gap-4 justify-center">{provider.social_links?.instagram && <a href={`https://instagram.com/${provider.social_links.instagram}`} className="text-pink-600 bg-pink-50 p-2 rounded-full"><Instagram/></a>}{provider.social_links?.facebook && <a href={`https://facebook.com/${provider.social_links.facebook}`} className="text-blue-600 bg-blue-50 p-2 rounded-full"><Facebook/></a>}{provider.social_links?.gps && <a href={`https://maps.google.com/?q=${provider.social_links.gps}`} className="text-green-600 bg-green-50 p-2 rounded-full"><MapPin/></a>}</div></div>
                 <h3 className="font-bold border-b pb-2 mb-4 flex items-center gap-2"><Tag size={18}/> {t('offers')}</h3>
                 {offers.length === 0 ? (<div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed"><Tag className="mx-auto mb-2 opacity-50"/><p className="text-sm">No active offers currently.</p></div>) : (<div className="grid grid-cols-2 gap-3">{offers.map(o => (<div key={o.id} className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">{o.image_url && <div className="h-24 bg-gray-100"><img src={o.image_url} className="w-full h-full object-cover"/></div>}<div className="p-3"><h4 className="font-bold text-sm truncate mb-1">{o.title}</h4><div className="flex gap-2 text-xs mb-3 items-center"><span className="line-through text-gray-400">{o.original_price}</span><span className="text-red-600 font-black text-sm">{o.discount_price} DH</span></div><button onClick={() => onBookOffer && onBookOffer(o)} className="w-full bg-black text-white py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform"><Calendar size={12}/> Book Now</button></div></div>))}</div>)}
             </div>
        </div>
    )
}

// --- MAIN CHATBOT COMPONENT ---

const Chatbot: React.FC<{ currentUser: AuthenticatedUser | null; onOpenAuth: () => void; onDiscover: () => void; onToggleNav: (hidden: boolean) => void }> = ({ currentUser, onOpenAuth, onDiscover, onToggleNav }) => {
    const { t, language } = useLocalization();
    const [view, setView] = useState<'LIST' | 'CHAT'>('LIST');
    const [selectedChat, setSelectedChat] = useState<any | null>(null); 
    const [providers, setProviders] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [showProfile, setShowProfile] = useState(false);
    const [showBooking, setShowBooking] = useState(false);
    const [systemAds, setSystemAds] = useState<SystemAnnouncement[]>([]);
    const [currentAdIndex, setCurrentAdIndex] = useState(0);
    const [preSelectedOffer, setPreSelectedOffer] = useState<Offer | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]); // Smart Chips

    // Speech Recognition Reference
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const fetchProviders = async () => { const { data } = await supabase.from('providers').select('*').eq('is_active', true); setProviders(data || []); }
        const fetchAds = async () => { const { data } = await supabase.from('system_announcements').select('*').eq('is_active', true); setSystemAds(data || []); }
        fetchProviders(); fetchAds();
    }, []);

    useEffect(() => {
        if(systemAds.length <= 1) return;
        const timer = setInterval(() => { setCurrentAdIndex(prev => (prev + 1) % systemAds.length); }, 4000);
        return () => clearInterval(timer);
    }, [systemAds]);

    useEffect(() => { onToggleNav(view === 'CHAT'); }, [view]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, view, suggestions]);

    // LOAD HISTORY WHEN CHAT OPENS
    useEffect(() => {
        if (view === 'CHAT' && currentUser) {
            const loadHistory = async () => {
                let query = supabase.from('chat_history').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: true });
                if (selectedChat) query = query.eq('provider_id', selectedChat.id);
                else query = query.is('provider_id', null);

                const { data } = await query;
                if (data) {
                    const formatted: Message[] = data.map((msg: any) => ({
                        role: msg.role === 'USER' ? Role.USER : Role.BOT,
                        text: msg.text || '',
                        imageUrl: msg.image_url,
                    }));
                    setMessages(formatted);
                } else {
                    setMessages([]);
                }
            };
            loadHistory();
        } else if (view === 'CHAT' && !currentUser) {
            setMessages([]);
        }
        
        // Initial Suggestions
        if(view === 'CHAT') {
            if (selectedChat) {
                const dynamicSuggestions = ['📅 حجز موعد'];
                if (selectedChat.price_info) dynamicSuggestions.unshift('💰 الأثمنة');
                if (selectedChat.location_info) dynamicSuggestions.push('📍 الموقع');
                if (selectedChat.working_hours) dynamicSuggestions.push('🕒 التوقيت');
                if (selectedChat.booking_info) dynamicSuggestions.push('📝 شروط الحجز');
                setSuggestions(dynamicSuggestions);
            } else {
                setSuggestions(['🏥 أبحث عن طبيب', '🔧 أحتاج سباك', '🏠 سمسار عقارات']);
            }
        }
    }, [view, selectedChat, currentUser]);


    const openChat = (provider: any | null) => {
        setSelectedChat(provider);
        setView('CHAT');
        setShowProfile(false);
        setShowBooking(false);
    };

    const handleChipClick = async (text: string) => {
        setInput(text);
        
        if (selectedChat) {
            let localAnswer = null;
            if (text === '💰 الأثمنة' && selectedChat.price_info) localAnswer = selectedChat.price_info;
            if (text === '📍 الموقع' && selectedChat.location_info) localAnswer = selectedChat.location_info;
            if (text === '🕒 التوقيت' && selectedChat.working_hours) localAnswer = selectedChat.working_hours;
            if (text === '📝 شروط الحجز' && selectedChat.booking_info) localAnswer = selectedChat.booking_info;
            
            if (text === '📅 حجز موعد') {
                 setPreSelectedOffer(null); 
                 setShowBooking(true);
                 return;
            }

            if (localAnswer) {
                const userMsg: Message = { role: Role.USER, text: text };
                setMessages(prev => [...prev, userMsg]);
                setInput('');
                setIsLoading(true);
                setTimeout(async () => {
                    const botMsg: Message = { role: Role.BOT, text: localAnswer as string };
                    setMessages(prev => [...prev, botMsg]);
                    setIsLoading(false);
                    if (currentUser) {
                        await supabase.from('chat_history').insert([
                            { user_id: currentUser.id, provider_id: selectedChat.id, role: 'USER', text: text },
                            { user_id: currentUser.id, provider_id: selectedChat.id, role: 'BOT', text: localAnswer }
                        ]);
                    }
                }, 600);
                return;
            }
        }
        setTimeout(() => handleSend(text), 100);
    }

    const handleSend = async (manualText?: string) => {
        const textToSend = manualText || input;
        if((!textToSend.trim() && !preview) || isLoading) return;
        
        const userMsg: Message = { role: Role.USER, text: textToSend, imageUrl: preview || undefined };
        setMessages(prev => [...prev, userMsg]);
        setInput(''); setPreview(null);
        setSuggestions([]); 
        setIsLoading(true);

        if (currentUser) {
            await supabase.from('chat_history').insert({
                user_id: currentUser.id,
                provider_id: selectedChat ? selectedChat.id : null,
                role: 'USER',
                text: userMsg.text,
                image_url: userMsg.imageUrl
            });
        }

        try {
            const history = messages.filter(m => !m.isComponent).map(m => ({ role: m.role === Role.USER ? 'user' : 'model', parts: [{ text: m.text }] }));
            
            const responseText = await getChatResponse(
                history, 
                userMsg.text, 
                language, 
                userMsg.imageUrl ? { base64: userMsg.imageUrl.split(',')[1], mimeType: 'image/jpeg' } : undefined, 
                undefined, 
                currentUser?.id, 
                currentUser?.name,
                selectedChat 
            );
            
            let displayText = responseText;
            const suggestionMatch = responseText.match(/SUGGESTIONS\|(.*)/);
            
            if (suggestionMatch) {
                displayText = responseText.replace(suggestionMatch[0], '').trim();
                const rawOptions = suggestionMatch[1].split('|');
                setSuggestions(rawOptions.map(o => o.trim()).filter(o => o.length > 0));
            } else {
                // Keep persistent hybrid suggestions if no new ones
                if(selectedChat) {
                    // Logic to restore original chips if not specified
                }
            }

            let botMsg: Message = { role: Role.BOT, text: displayText };

            try {
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if(jsonMatch) {
                    const data = JSON.parse(jsonMatch[0]);
                    if(data.bookingConfirmed) {
                        botMsg = { role: Role.BOT, text: data.message, bookingDetails: { ...data, appointmentId: Date.now() }, isComponent: true };
                    }
                }
            } catch(e) {}
            
            setMessages(prev => [...prev, botMsg]);

            if (currentUser) {
                await supabase.from('chat_history').insert({
                    user_id: currentUser.id,
                    provider_id: selectedChat ? selectedChat.id : null,
                    role: 'BOT',
                    text: botMsg.text
                });
            }

        } catch(e) { 
            setMessages(prev => [...prev, { role: Role.BOT, text: t('errorMessage') }]); 
        } 
        finally { setIsLoading(false); }
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(file) {
            const reader = new FileReader();
            reader.onload = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    }

    // --- NEW WEB SPEECH API IMPLEMENTATION ---
    const toggleRecording = () => {
        if (isRecording) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setIsRecording(false);
        } else {
            // Start Recording
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            
            if (!SpeechRecognition) {
                alert("Your browser does not support voice recognition.");
                return;
            }

            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false; // Stop after one sentence
            recognitionRef.current.lang = 'ar-MA'; // Target Moroccan Arabic if possible, or 'ar'
            recognitionRef.current.interimResults = false;

            recognitionRef.current.onstart = () => {
                setIsRecording(true);
            };

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                if (transcript) {
                    setInput(transcript);
                    // Optional: Auto Send
                    // setTimeout(() => handleSend(transcript), 500); 
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech Error", event.error);
                setIsRecording(false);
            };

            recognitionRef.current.onend = () => {
                setIsRecording(false);
            };

            recognitionRef.current.start();
        }
    }

    const handleBookingConfirmed = (details: any) => {
        setShowBooking(false);
        const msg = { role: Role.BOT, text: details.message, bookingDetails: details, isComponent: true };
        setMessages(prev => [...prev, msg]);
        if(currentUser) {
            supabase.from('chat_history').insert({
                user_id: currentUser.id,
                provider_id: selectedChat ? selectedChat.id : null,
                role: 'BOT',
                text: details.message
            });
        }
    }

    const handleBookFromProfile = (offer: Offer) => {
        setPreSelectedOffer(offer);
        setShowProfile(false);
        setShowBooking(true);
    }

    // --- VIEW 1: CHAT LIST ---
    if (view === 'LIST') {
        const filteredProviders = providers.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.service_type.toLowerCase().includes(searchTerm.toLowerCase()));
        const currentAd = systemAds[currentAdIndex];
        const handleAdClick = async () => {
            if(!currentAd) return;
            const p = providers.find(prov => prov.name === currentAd.title);
            if(p) openChat(p);
            else openChat(null); 
        }

        return (
            <div className="flex flex-col h-full bg-white relative">
                <UrgentTicker />
                <div className="p-4 pb-2">
                    <div className="bg-gray-100 rounded-full flex items-center px-4 py-2">
                        <Search size={18} className="text-gray-400"/>
                        <input placeholder={t('search')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none flex-1 ml-2 text-sm"/>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pb-20">
                    {!searchTerm && currentAd && (
                        <div onClick={handleAdClick} className="flex items-center gap-4 p-4 cursor-pointer bg-yellow-50/50 hover:bg-yellow-50 border-b border-yellow-100 transition-all duration-500">
                            <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 to-orange-500 relative shrink-0"><img src={currentAd.image_url} className="w-full h-full rounded-full border-2 border-white object-cover"/><div className="absolute -bottom-1 -right-1 bg-yellow-400 text-white rounded-full p-1 border border-white"><Star size={10} fill="white"/></div></div>
                            <div className="flex-1 min-w-0"><div className="flex justify-between items-center mb-1"><h3 className="font-bold text-gray-900 truncate">{currentAd.title}</h3><span className="text-[10px] font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full uppercase tracking-wide">{t('sponsored')}</span></div><p className="text-sm text-gray-600 line-clamp-1 flex items-center gap-1 animate-fade-in">{currentAd.message}</p></div>
                        </div>
                    )}
                    <div onClick={() => openChat(null)} className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shrink-0"><Globe size={28}/></div>
                        <div className="flex-1 min-w-0"><div className="flex justify-between items-center mb-1"><h3 className="font-bold text-gray-900">Tanger IA</h3><span className="text-[10px] text-gray-400">Now</span></div><p className="text-sm text-gray-500 line-clamp-1">{t('appDesc')}</p></div>
                    </div>
                    {filteredProviders.map(p => (
                        <div key={p.id} onClick={() => openChat(p)} className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                            <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden border border-gray-100 relative shrink-0"><img src={p.profile_image_url || `https://ui-avatars.com/api/?name=${p.name}`} className="w-full h-full object-cover"/><span className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span></div>
                            <div className="flex-1 min-w-0"><div className="flex justify-between items-center mb-1"><h3 className="font-bold text-gray-900 truncate">{p.name}</h3><span className="text-[10px] text-gray-400">Online</span></div><p className="text-sm text-gray-500 flex items-center gap-1 truncate"><span className="font-semibold text-blue-600">{p.service_type}</span></p></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // --- VIEW 2: CONVERSATION WINDOW ---
    return (
        <div className="flex flex-col h-full bg-[#EFE7DD] relative">
            <UrgentTicker />
            <div className="bg-white py-3 px-2 border-b flex items-center gap-2 shadow-sm z-20">
                <button onClick={() => setView('LIST')} className="p-2"><ArrowLeft size={20}/></button>
                <div onClick={() => selectedChat && setShowProfile(true)} className="flex items-center gap-3 flex-1 cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border">
                         {selectedChat ? (<img src={selectedChat.profile_image_url || `https://ui-avatars.com/api/?name=${selectedChat.name}`} className="w-full h-full object-cover"/>) : (<div className="w-full h-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white"><Globe size={20}/></div>)}
                    </div>
                    <div><h3 className="font-bold text-sm">{selectedChat ? selectedChat.name : 'Tanger IA'}</h3><p className="text-[10px] text-green-600 font-bold">Online</p></div>
                </div>
                <div className="flex gap-1 text-blue-600">
                    <button onClick={() => selectedChat && setShowProfile(true)} className="p-2 hover:bg-gray-100 rounded-full"><Info size={20}/></button>
                    {selectedChat && (<button onClick={() => { setPreSelectedOffer(null); setShowBooking(true); }} className="p-2 hover:bg-blue-50 rounded-full bg-blue-100 text-blue-600"><Calendar size={20}/></button>)}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-[#EFE7DD] relative">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-center opacity-60">
                         <div className="bg-[#DCF8C6] p-4 rounded-full mb-2"><Globe className="text-green-600"/></div>
                         <p className="text-xs bg-[#FFF5C4] p-2 rounded shadow-sm text-gray-700">{selectedChat ? `You are now chatting with ${selectedChat.name}.` : t('welcomeMessage')}</p>
                    </div>
                )}
                {messages.map((m, i) => (
                    <div key={i} className={`flex mb-2 ${m.role === Role.USER ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-2 px-3 rounded-lg max-w-[80%] text-sm shadow-sm relative ${m.role === Role.USER ? 'bg-[#dcf8c6] text-gray-900 rounded-tr-none' : 'bg-white text-gray-900 rounded-tl-none'}`}>
                            {m.imageUrl && <img src={m.imageUrl} className="rounded mb-2 max-w-full"/>}
                            <p className="leading-relaxed whitespace-pre-line">{m.text}</p>
                            {m.bookingDetails && (<div className="mt-2 bg-gray-50 p-2 rounded border border-gray-200"><p className="font-bold text-xs text-center">Booking ID: {m.bookingDetails.appointmentId}</p><div className="mt-2 flex justify-center"><QRCodeDisplay appointmentId={m.bookingDetails.appointmentId} bookingData={m.bookingDetails} /></div></div>)}
                            <div className="text-[9px] text-gray-400 text-right mt-1 flex justify-end items-center gap-1">{new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                        </div>
                    </div>
                ))}
                {isLoading && (<div className="flex justify-start mb-2"><div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm"><Loader2 size={16} className="animate-spin text-gray-400"/></div></div>)}
                <div ref={messagesEndRef}/>
            </div>
            
            {/* SMART SUGGESTION CHIPS */}
            {suggestions.length > 0 && !isLoading && (
                <div className="p-2 bg-[#EFE7DD] flex gap-2 overflow-x-auto no-scrollbar">
                    {suggestions.map((chip, i) => (
                        <button 
                            key={i} 
                            onClick={() => handleChipClick(chip)}
                            className="bg-white border border-gray-200 text-blue-600 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm whitespace-nowrap hover:bg-blue-50 transition-colors flex items-center gap-1"
                        >
                            <Sparkles size={12} className="text-yellow-500"/> {chip}
                        </button>
                    ))}
                </div>
            )}

            <div className="p-2 bg-white flex items-end gap-2 pb-safe border-t">
                <div className="flex-1 bg-gray-100 rounded-3xl flex items-center p-1.5 px-3">
                    <button onClick={() => fileRef.current?.click()} className="p-2 text-gray-400 hover:text-gray-600"><Paperclip size={20}/></button>
                    <input type="file" ref={fileRef} hidden onChange={handleFile} accept="image/*"/>
                    <input type="file" ref={cameraInputRef} hidden accept="image/*" capture="environment" onChange={handleFile} />
                    <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={isRecording ? "تحدث الآن (Listening)..." : t('inputPlaceholder')} rows={1} className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-20 py-3 text-sm outline-none text-gray-800" onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}/>
                    <button onClick={() => cameraInputRef.current?.click()} className="p-2 text-gray-400 hover:text-gray-600"><Camera size={20}/></button>
                </div>
                <button onClick={() => { if(input.trim() || preview) handleSend(); else toggleRecording(); }} className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${input.trim() || preview ? 'bg-blue-600 text-white' : (isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-green-500 text-white')}`}>{input.trim() || preview ? <Send size={20} className={language === 'ar' ? 'rotate-180 ml-1' : 'mr-1'}/> : (isRecording ? <StopCircle size={24}/> : <Mic size={24}/>)}</button>
            </div>
            {preview && (<div className="absolute bottom-20 left-4 w-32 h-32 bg-white p-2 shadow-2xl rounded-xl border z-30"><img src={preview} className="w-full h-full object-cover rounded-lg"/><button onClick={() => setPreview(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md"><X size={14}/></button></div>)}
            {showProfile && selectedChat && <ChatProfileModal provider={selectedChat} onClose={() => setShowProfile(false)} currentUser={currentUser} onBookOffer={handleBookFromProfile} />}
            {showBooking && selectedChat && <BookingModal provider={selectedChat} onClose={() => setShowBooking(false)} currentUser={currentUser} onBooked={handleBookingConfirmed} initialOffer={preSelectedOffer} />}
        </div>
    );
};

export default Chatbot;
