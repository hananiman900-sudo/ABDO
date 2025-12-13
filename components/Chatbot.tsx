
import React, { useState, useRef, useEffect } from 'react';
import { Message, Role, AuthenticatedUser, SystemAnnouncement, UrgentAd, Offer, AppCategory, AppSpecialty, ProviderAd } from '../types';
import { getChatResponse } from '../services/geminiService';
import { useLocalization } from '../hooks/useLocalization';
import { supabase } from '../services/supabaseClient';
import QRCodeDisplay from './QRCodeDisplay';
import { Send, Mic, Paperclip, Camera, Loader2, X, Globe, Search, ArrowLeft, MoreVertical, Calendar, Info, Phone, MapPin, Instagram, Facebook, Tag, UserPlus, UserCheck, Megaphone, Star, Check, ChevronDown, CheckCircle, StopCircle, Sparkles, Banknote, Clock, Zap, Bell, ChevronRight, RotateCcw, Stethoscope, Wrench, HardHat, Scissors, Utensils, Truck, GraduationCap, Gavel, Syringe, Home, Briefcase, Pill, MessageSquare } from 'lucide-react';

// ... (Existing Sub-components: BookingModal, ChatProfileModal remain unchanged)

// --- HELPER: GET CATEGORY ICON ---
const getProviderIcon = (serviceType: string, category: string) => {
    const term = (category || serviceType || '').toLowerCase();
    
    if (term.includes('طبيب') || term.includes('doctor') || term.includes('médecin') || term.includes('dentist')) return <Stethoscope size={24} className="text-white"/>;
    if (term.includes('ميكانيك') || term.includes('mechanic') || term.includes('plumb') || term.includes('electri')) return <Wrench size={24} className="text-white"/>;
    if (term.includes('بناء') || term.includes('construct') || term.includes('peintre') || term.includes('sbagh')) return <HardHat size={24} className="text-white"/>;
    if (term.includes('حلاق') || term.includes('barber') || term.includes('coiff') || term.includes('beauty')) return <Scissors size={24} className="text-white"/>;
    if (term.includes('مطعم') || term.includes('food') || term.includes('restaur') || term.includes('snack')) return <Utensils size={24} className="text-white"/>;
    if (term.includes('نقل') || term.includes('transport') || term.includes('driver')) return <Truck size={24} className="text-white"/>;
    if (term.includes('مدرسة') || term.includes('school') || term.includes('prof') || term.includes('teacher')) return <GraduationCap size={24} className="text-white"/>;
    if (term.includes('محامي') || term.includes('lawyer') || term.includes('avocat') || term.includes('aadoul')) return <Gavel size={24} className="text-white"/>;
    if (term.includes('مختبر') || term.includes('lab') || term.includes('analys')) return <Syringe size={24} className="text-white"/>;
    if (term.includes('عقار') || term.includes('real estate') || term.includes('immo') || term.includes('samsar')) return <Home size={24} className="text-white"/>;
    if (term.includes('صيدل') || term.includes('pharmacy')) return <Pill size={24} className="text-white"/>;
    
    return <Briefcase size={24} className="text-white"/>; // Default
};

// --- HELPER: RENDER AVATAR ---
const ProviderAvatar = ({ provider }: { provider: any }) => {
    if (provider.profile_image_url) {
        return <img src={provider.profile_image_url} className="w-full h-full object-cover"/>;
    }
    
    // Generate a consistent background color based on name length
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-teal-500', 'bg-pink-500'];
    const colorIndex = (provider.name?.length || 0) % colors.length;
    const bgColor = colors[colorIndex];

    return (
        <div className={`w-full h-full ${bgColor} flex items-center justify-center`}>
            {getProviderIcon(provider.service_type, provider.category)}
        </div>
    );
};

// --- UPDATED URGENT TICKER (WHITE BG + COLORED LABEL + PRO TRANSITION) ---
export const UrgentTicker: React.FC<{ onClick: () => void; currentUser: AuthenticatedUser | null }> = ({ onClick, currentUser }) => {
    const { t } = useLocalization();
    const [ads, setAds] = useState<UrgentAd[]>([]);
    const [currentAdIndex, setCurrentAdIndex] = useState(0);
    
    // Modes: 'BRANDING' (Blue Label) or 'ADS' (Red Label)
    const [mode, setMode] = useState<'BRANDING' | 'ADS'>('BRANDING');
    const [animate, setAnimate] = useState(true); 

    // 1. Fetch Ads
    useEffect(() => {
        const fetch = async () => {
            if (!currentUser) return; 
            const { data } = await supabase.from('urgent_ads')
                .select('*, providers(name)')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(10);
            setAds(data as any || []);
        }
        fetch();
    }, [currentUser]);

    // 2. Loop Logic with Professional Timing
    useEffect(() => {
        let timer: any;

        const loop = () => {
            setAnimate(false); // Trigger exit animation

            setTimeout(() => {
                // Logic to switch content AFTER exit animation
                if (ads.length === 0) {
                    setMode('BRANDING');
                } else {
                    if (mode === 'BRANDING') {
                        setMode('ADS'); 
                    } else {
                        if (currentAdIndex < ads.length - 1) {
                            setCurrentAdIndex(prev => prev + 1);
                        } else {
                            setCurrentAdIndex(0);
                            setMode('BRANDING');
                        }
                    }
                }
                setAnimate(true); // Trigger entrance animation
            }, 600); // Wait for exit transition to finish
        };

        // Duration: 6 Seconds for Branding, 8 Seconds for Ads
        const duration = mode === 'BRANDING' ? 6000 : 8000;
        
        if (ads.length === 0) {
            setMode('BRANDING');
            return; 
        }

        timer = setInterval(loop, duration);
        return () => clearInterval(timer);

    }, [ads, mode, currentAdIndex]);

    return (
        <div onClick={onClick} className="bg-white border-b border-gray-100 shadow-sm z-10 flex items-stretch h-10 overflow-hidden relative cursor-pointer group">
            
            {/* 1. THE COLORED LABEL (Left/Right side) */}
            <div className={`${mode === 'BRANDING' ? 'bg-blue-600' : 'bg-red-600'} text-white px-3 flex items-center justify-center relative z-20 shrink-0 transition-colors duration-700 ease-in-out`}>
                
                {/* Icon & Text */}
                <div className="relative z-10 flex items-center gap-1 font-black text-xs transition-all duration-500">
                    {mode === 'BRANDING' ? (
                        <div className="flex items-center gap-1 animate-fade-in">
                            <Globe size={12} className="text-white"/>
                            <span>Tanger IA</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 animate-fade-in">
                            <Zap size={12} className="fill-yellow-300 text-yellow-300 animate-pulse"/>
                            <span>عاجل</span>
                        </div>
                    )}
                </div>

                {/* Slanted Edge (CSS Triangle) - Matches BG Color */}
                <div className={`absolute top-0 -right-3 w-0 h-0 border-t-[40px] ${mode === 'BRANDING' ? 'border-t-blue-600' : 'border-t-red-600'} border-r-[15px] border-r-transparent pointer-events-none rtl:hidden transition-colors duration-700`}></div>
                <div className={`absolute top-0 -left-3 w-0 h-0 border-t-[40px] ${mode === 'BRANDING' ? 'border-t-blue-600' : 'border-t-red-600'} border-l-[15px] border-l-transparent pointer-events-none ltr:hidden transition-colors duration-700`}></div>
            </div>

            {/* 2. THE CONTENT AREA (White BG) */}
            <div className="flex-1 flex items-center px-4 overflow-hidden relative bg-white">
                
                {/* 3. PROFESSIONAL TRANSITION CONTAINER */}
                <div 
                    className={`w-full transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform ${
                        animate ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
                    }`}
                >
                    {mode === 'BRANDING' ? (
                        <div className="flex items-center gap-2 w-full">
                            <span className="font-bold text-blue-600 text-xs">مساعدك الذكي:</span>
                            {/* Scrolling Text for Description */}
                            <div className="overflow-hidden relative w-full h-4">
                                <span className="absolute animate-marquee whitespace-nowrap text-xs text-gray-500 font-medium">
                                    مساعدك الذكي في طنجة • حجز مواعيد • صيدليات الحراسة • عقارات • وظائف • خدمات القرب • عروض حصرية
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 w-full">
                            {/* Provider Name Tag */}
                            <span className="font-black text-[10px] text-white bg-gray-800 px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                                {ads[currentAdIndex]?.providers?.name || 'مجهول'}
                            </span>
                            {/* Ad Message */}
                            <span className="text-xs font-bold text-gray-800 truncate flex-1">
                                {ads[currentAdIndex]?.message}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export const BookingModal: React.FC<{ provider: any; onClose: () => void; currentUser: AuthenticatedUser | null; onBooked: (details: any) => void; initialOffer?: Offer | null }> = ({ provider, onClose, currentUser, onBooked, initialOffer }) => {
    // ... same code ...
    const { t } = useLocalization();
    const [offers, setOffers] = useState<Offer[]>([]);
    const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [guestName, setGuestName] = useState(''); 
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchOffers = async () => { const { data } = await supabase.from('provider_offers').select('*').eq('provider_id', provider.id); setOffers(data || []); }
        fetchOffers();
    }, [provider]);

    useEffect(() => { if(initialOffer) { setSelectedOffer(initialOffer); } }, [initialOffer]);

    const handleConfirm = async () => {
        if(!currentUser && !guestName.trim()) return alert("Please enter your name to book.");
        if(!date || !time) return alert("Please select date and time");
        setLoading(true);
        const appointmentId = Date.now();
        const clientName = currentUser ? currentUser.name : guestName; 
        
        if (currentUser) { await supabase.from('appointments').insert({ client_id: currentUser.id, provider_id: provider.id, created_at: new Date().toISOString() }); }
        
        const offerText = selectedOffer ? `with Offer: ${selectedOffer.title}` : '';
        await supabase.from('provider_notifications').insert({ provider_id: provider.id, message: `New Booking: ${clientName} on ${date} at ${time} ${offerText}`, type: 'BOOKING', status: 'pending' });
        
        // Ensure bookingDetails contains everything needed for the QR and security checks
        const bookingDetails = { 
            appointmentId, 
            clientName: clientName, // Explicitly set clientName for Guest support in QR
            name: clientName, // For backwards compatibility
            providerId: provider.id, // CRITICAL FOR SECURITY CHECK
            provider: provider.name, 
            service: provider.service_type, 
            date: date, 
            time: time, 
            offerTitle: selectedOffer?.title, 
            price: selectedOffer?.discount_price, 
            message: `${t('bookingSuccessMessage')} ${t('keepQR')}` 
        };
        
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
    // ... same code ...
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
                 <div className="flex flex-col items-center mb-6">
                    <div className="w-24 h-24 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 to-purple-600 mb-2 overflow-hidden border-4 border-white shadow-lg">
                        <ProviderAvatar provider={provider} />
                    </div>
                    <h2 className="font-bold text-xl">{provider.name}</h2><p className="text-gray-500">{provider.service_type}</p><button onClick={handleFollow} className={`mt-3 px-8 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-sm transition-all ${isFollowing ? 'bg-gray-100 text-black border border-gray-300' : 'bg-blue-600 text-white'}`}>{isFollowing ? <UserCheck size={16}/> : <UserPlus size={16}/>}{isFollowing ? t('unfollow') : t('follow')}</button></div>
                 <div className="flex justify-center gap-8 mb-6 text-center"><div className="flex flex-col items-center"><div className="font-black text-xl">{stats.followers}</div><div className="text-xs text-gray-500 font-bold uppercase tracking-wide">{t('followers')}</div></div><div className="w-px bg-gray-200 h-10"></div><div className="flex flex-col items-center"><div className="font-black text-xl">{stats.posts}</div><div className="text-xs text-gray-500 font-bold uppercase tracking-wide">{t('offers')}</div></div></div>
                 <div className="space-y-4 mb-6"><h3 className="font-bold border-b pb-2">{t('bioLabel')}</h3><p className="text-sm text-gray-600 whitespace-pre-line">{provider.bio || "No bio available."}</p><h3 className="font-bold border-b pb-2">{t('socialLinks')}</h3><div className="flex gap-4 justify-center">{provider.social_links?.instagram && <a href={`https://instagram.com/${provider.social_links.instagram}`} className="text-pink-600 bg-pink-50 p-2 rounded-full"><Instagram/></a>}{provider.social_links?.facebook && <a href={`https://facebook.com/${provider.social_links.facebook}`} className="text-blue-600 bg-blue-50 p-2 rounded-full"><Facebook/></a>}{provider.social_links?.gps && <a href={`https://maps.google.com/?q=${provider.social_links.gps}`} className="text-green-600 bg-green-50 p-2 rounded-full"><MapPin/></a>}</div></div>
                 <h3 className="font-bold border-b pb-2 mb-4 flex items-center gap-2"><Tag size={18}/> {t('offers')}</h3>
                 {offers.length === 0 ? (<div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed"><Tag className="mx-auto mb-2 opacity-50"/><p className="text-sm">No active offers currently.</p></div>) : (<div className="grid grid-cols-2 gap-3">{offers.map(o => (<div key={o.id} className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">{o.image_url && <div className="h-24 bg-gray-100"><img src={o.image_url} className="w-full h-full object-cover"/></div>}<div className="p-3"><h4 className="font-bold text-sm truncate mb-1">{o.title}</h4><div className="flex gap-2 text-xs mb-3 items-center"><span className="line-through text-gray-400">{o.original_price}</span><span className="text-red-600 font-black text-sm">{o.discount_price} DH</span></div><button onClick={() => onBookOffer && onBookOffer(o)} className="w-full bg-black text-white py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform"><Calendar size={12}/> Book Now</button></div></div>))}</div>)}
             </div>
        </div>
    )
}

// --- MAIN CHATBOT COMPONENT ---

const Chatbot: React.FC<{ currentUser: AuthenticatedUser | null; onOpenAuth: () => void; onDiscover: () => void; onToggleNav: (hidden: boolean) => void; onOpenNotifications: () => void }> = ({ currentUser, onOpenAuth, onDiscover, onToggleNav, onOpenNotifications }) => {
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
    const [preSelectedOffer, setPreSelectedOffer] = useState<Offer | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    
    // Unread counts state
    const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});

    // --- FILTER STATE (WhatsApp Style Drill Down) ---
    const [filterLevel, setFilterLevel] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
    const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null);

    // Fetched Lists
    const [fetchedCategories, setFetchedCategories] = useState<AppCategory[]>([]);
    const [fetchedSpecialties, setFetchedSpecialties] = useState<AppSpecialty[]>([]);
    const neighborhoods = t('neighborhoods').split(',').map(s => s.trim());

    // Speech Recognition Reference
    const recognitionRef = useRef<any>(null);

    // Initial Data Fetch
    useEffect(() => {
        const init = async () => {
            // 1. Fetch active providers
            const { data: pData } = await supabase.from('providers').select('*').eq('is_active', true);
            
            // 2. Fetch latest ad timestamp for each provider (for sorting)
            // Note: Since Supabase basic query doesn't do complex joins easily in one go without a view,
            // we will fetch all active ads and map them.
            const { data: adsData } = await supabase.from('provider_ads')
                .select('provider_id, created_at')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            // Create a map of provider_id -> latest_ad_date
            const lastAdMap: Record<number, string> = {};
            if (adsData) {
                adsData.forEach(ad => {
                    if (!lastAdMap[ad.provider_id]) {
                        lastAdMap[ad.provider_id] = ad.created_at;
                    }
                });
            }

            // 3. Process Providers with sorting logic
            let processedProviders = pData || [];
            processedProviders = processedProviders.map(p => ({
                ...p,
                last_ad_at: lastAdMap[p.id] || null // Attach ad date or null
            }));

            // SORT: 
            // - Providers with ads first (sorted by ad date desc)
            // - Providers without ads second (sorted by visits or name)
            processedProviders.sort((a, b) => {
                // If both have ads, compare dates
                if (a.last_ad_at && b.last_ad_at) {
                    return new Date(b.last_ad_at).getTime() - new Date(a.last_ad_at).getTime();
                }
                // If A has ad, A comes first
                if (a.last_ad_at) return -1;
                // If B has ad, B comes first
                if (b.last_ad_at) return 1;
                
                // If neither has ad, sort by visits count (desc)
                return (b.visits_count || 0) - (a.visits_count || 0);
            });

            setProviders(processedProviders);

            // Categories & Specialties
            const { data: cData } = await supabase.from('app_categories').select('*').order('name');
            setFetchedCategories(cData || []);

            const { data: sData } = await supabase.from('app_specialties').select('*').order('name');
            setFetchedSpecialties(sData || []);
            
            // Calculate Unread Badges (If User logged in)
            if (currentUser && processedProviders) {
                calculateUnreadBadges(currentUser.id);
            }
        }
        init();
    }, [currentUser]);

    const calculateUnreadBadges = async (userId: number) => {
        // 1. Get ALL active ads
        const { data: allAds } = await supabase.from('provider_ads').select('id, provider_id').eq('is_active', true);
        if (!allAds) return;

        // 2. Get views for this user
        const { data: myViews } = await supabase.from('ad_views').select('ad_id').eq('user_id', userId);
        const viewedAdIds = new Set(myViews?.map(v => v.ad_id) || []);

        // 3. Count unread
        const counts: Record<number, number> = {};
        allAds.forEach(ad => {
            if (!viewedAdIds.has(ad.id)) {
                counts[ad.provider_id] = (counts[ad.provider_id] || 0) + 1;
            }
        });
        setUnreadCounts(counts);
    };

    useEffect(() => { onToggleNav(view === 'CHAT'); }, [view]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, view, suggestions]);

    // LOAD HISTORY & ADS WHEN CHAT OPENS
    useEffect(() => {
        if (view === 'CHAT' && currentUser) {
            const loadHistory = async () => {
                let query = supabase.from('chat_history').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: true });
                if (selectedChat) query = query.eq('provider_id', selectedChat.id);
                else query = query.is('provider_id', null);

                const { data } = await query;
                if (data) {
                    const formatted: Message[] = data.map((msg: any) => {
                        let bookingDetails = undefined;
                        let isComponent = false;

                        // Try to parse booking details from text if it's a JSON string
                        // This allows the QR code to persist across reloads
                        if (msg.role === 'BOT' && msg.text && msg.text.startsWith('{"appointmentId"')) {
                             try {
                                 bookingDetails = JSON.parse(msg.text);
                                 isComponent = true;
                                 // Override the raw text with the user-friendly message for display
                                 // But we still pass bookingDetails to the renderer
                                 return {
                                     role: Role.BOT,
                                     text: bookingDetails.message || "Booking Details",
                                     bookingDetails: bookingDetails,
                                     isComponent: true
                                 };
                             } catch (e) {
                                 // If parsing fails, just treat as text
                             }
                        }

                        return {
                            role: msg.role === 'USER' ? Role.USER : Role.BOT,
                            text: msg.text || '',
                            imageUrl: msg.image_url,
                        }
                    });
                    setMessages(formatted);
                } else {
                    setMessages([]);
                }
            };
            loadHistory();
        } else if (view === 'CHAT' && !currentUser) {
            setMessages([]);
        }
        
        if(view === 'CHAT') {
            if (selectedChat) {
                // SUGGESTIONS
                const dynamicSuggestions = ['📅 حجز موعد'];
                if (selectedChat.price_info) dynamicSuggestions.unshift('💰 الأثمنة');
                if (selectedChat.location_info) dynamicSuggestions.push('📍 الموقع');
                if (selectedChat.working_hours) dynamicSuggestions.push('🕒 التوقيت');
                if (selectedChat.booking_info) dynamicSuggestions.push('📝 شروط الحجز');
                setSuggestions(dynamicSuggestions);

                // --- MODIFIED: FETCH & DISPLAY ALL ACTIVE ADS (STORIES) AT THE BOTTOM ---
                const fetchAndMarkAds = async () => {
                    // Fetch ALL ACTIVE ads for this provider (ordered oldest to newest to appear in sequence)
                    const { data: ads } = await supabase.from('provider_ads')
                        .select('*')
                        .eq('provider_id', selectedChat.id)
                        .eq('is_active', true)
                        .order('created_at', { ascending: true }); 

                    if (ads && ads.length > 0 && currentUser) {
                        
                        // 1. Check for unread ones just to update the "Read" status in DB (clear badge)
                        const { data: views } = await supabase.from('ad_views')
                            .select('ad_id')
                            .eq('user_id', currentUser.id)
                            .in('ad_id', ads.map(a => a.id));
                        
                        const viewedIds = new Set(views?.map(v => v.ad_id) || []);
                        const unreadAds = ads.filter(a => !viewedIds.has(a.id));

                        if (unreadAds.length > 0) {
                            // Mark unread ads as read in DB
                            const inserts = unreadAds.map(ad => ({ user_id: currentUser.id, ad_id: ad.id }));
                            await supabase.from('ad_views').insert(inserts);
                            
                            // Update local badge state immediately
                            setUnreadCounts(prev => ({...prev, [selectedChat.id]: 0}));
                        }

                        // 2. DISPLAY ALL ADS (Persist them in chat view)
                        // We filter out any duplicate "WelcomeAd" that might already be in the state to avoid double rendering
                        setMessages(prev => {
                            const existingAdIds = new Set(prev.filter(m => m.isWelcomeAd && (m as any)._adId).map(m => (m as any)._adId));
                            
                            const newAdMessages = ads
                                .filter(ad => !existingAdIds.has(ad.id))
                                .map(ad => ({
                                    role: Role.BOT,
                                    text: ad.message,
                                    imageUrl: ad.image_url,
                                    isWelcomeAd: true,
                                    _adId: ad.id // Internal helper ID
                                }));
                            
                            return [...prev, ...newAdMessages];
                        });
                    }
                };
                
                // Add a small delay to ensure history loads first
                setTimeout(fetchAndMarkAds, 500);

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

    // --- FILTER HANDLERS ---
    const handleCategorySelect = (catName: string) => {
        setSelectedCategory(catName);
        
        // Find if this category has specialties
        const catObj = fetchedCategories.find(c => c.name === catName);
        const hasSpecs = catObj && fetchedSpecialties.some(s => s.category_id === catObj.id);

        if (hasSpecs) {
            setFilterLevel(1); // Go to Specialties
        } else {
            setFilterLevel(2); // Go directly to Neighborhoods
        }
    };

    const handleSpecialtySelect = (spec: string) => {
        setSelectedSpecialty(spec);
        setFilterLevel(2); // Go to Neighborhoods
    };

    const handleNeighborhoodSelect = (hood: string) => {
        setSelectedNeighborhood(hood);
        // Filter is complete, list updates automatically below
    };

    const resetFilters = () => {
        setFilterLevel(0);
        setSelectedCategory(null);
        setSelectedSpecialty(null);
        setSelectedNeighborhood(null);
    };

    // --- RENDER FILTER CHIPS ---
    const renderFilterChips = () => {
        if (filterLevel === 0) {
            // Show Categories
            return (
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 px-1">
                    {fetchedCategories.length > 0 ? fetchedCategories.map(cat => (
                        <button key={cat.id} onClick={() => handleCategorySelect(cat.name)} className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-bold whitespace-nowrap border border-gray-200 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                            {cat.name}
                        </button>
                    )) : (
                        <p className="text-xs text-gray-400 p-2">Loading categories...</p>
                    )}
                </div>
            );
        } else if (filterLevel === 1) {
            // Show Specialties based on Selected Category
            const catObj = fetchedCategories.find(c => c.name === selectedCategory);
            const currentSpecs = catObj ? fetchedSpecialties.filter(s => s.category_id === catObj.id) : [];

            return (
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 px-1 items-center">
                    <button onClick={() => setFilterLevel(0)} className="p-1.5 bg-gray-200 rounded-full mr-2 shrink-0"><ArrowLeft size={12}/></button>
                    {currentSpecs.map(spec => (
                        <button key={spec.id} onClick={() => handleSpecialtySelect(spec.name)} className="px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold whitespace-nowrap border border-blue-200">
                            {spec.name}
                        </button>
                    ))}
                </div>
            );
        } else if (filterLevel === 2) {
            // Show Neighborhoods
            // Determine Back Button Logic: Go back to specialties (1) if they exist, else categories (0)
            const catObj = fetchedCategories.find(c => c.name === selectedCategory);
            const hasSpecs = catObj && fetchedSpecialties.some(s => s.category_id === catObj.id);
            const backLevel = hasSpecs ? 1 : 0;

            return (
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 px-1 items-center">
                    <button onClick={() => setFilterLevel(backLevel)} className="p-1.5 bg-gray-200 rounded-full mr-2 shrink-0"><ArrowLeft size={12}/></button>
                    <button onClick={() => setSelectedNeighborhood(null)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border ${selectedNeighborhood === null ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>الكل</button>
                    {neighborhoods.map(hood => (
                        <button key={hood} onClick={() => handleNeighborhoodSelect(hood)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-colors ${selectedNeighborhood === hood ? 'bg-green-600 text-white border-green-600' : 'bg-gray-100 text-gray-700 hover:bg-green-50'}`}>
                            {hood}
                        </button>
                    ))}
                </div>
            );
        }
    };

    // Filter Logic Implementation
    const filteredProviders = providers.filter(p => {
        // 1. Search Term
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.service_type.toLowerCase().includes(searchTerm.toLowerCase());
        
        // 2. Category Filter
        let matchesCategory = true;
        if (selectedCategory) {
            matchesCategory = p.category === selectedCategory || (!p.category && p.service_type === selectedCategory); // Fallback for old data
        }

        // 3. Specialty Filter
        let matchesSpecialty = true;
        if (selectedSpecialty) {
            matchesSpecialty = p.specialty === selectedSpecialty;
        }

        // 4. Neighborhood Filter
        let matchesNeighborhood = true;
        if (selectedNeighborhood) {
            matchesNeighborhood = p.neighborhood === selectedNeighborhood || p.location.includes(selectedNeighborhood);
        }

        return matchesSearch && matchesCategory && matchesSpecialty && matchesNeighborhood;
    });


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
            const history = messages.filter(m => !m.isComponent && !m.isWelcomeAd).map(m => ({ role: m.role === Role.USER ? 'user' : 'model', parts: [{ text: m.text }] }));
            
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

    const toggleRecording = () => {
        if (isRecording) {
            if (recognitionRef.current) recognitionRef.current.stop();
            setIsRecording(false);
        } else {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (!SpeechRecognition) { alert("Your browser does not support voice recognition."); return; }
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false; 
            recognitionRef.current.lang = 'ar-MA'; 
            recognitionRef.current.interimResults = false;
            recognitionRef.current.onstart = () => setIsRecording(true);
            recognitionRef.current.onresult = (event: any) => { const transcript = event.results[0][0].transcript; if (transcript) setInput(transcript); };
            recognitionRef.current.onerror = () => setIsRecording(false);
            recognitionRef.current.onend = () => setIsRecording(false);
            recognitionRef.current.start();
        }
    }

    const handleBookingConfirmed = async (details: any) => {
        setShowBooking(false);
        const msg = { role: Role.BOT, text: details.message, bookingDetails: details, isComponent: true };
        setMessages(prev => [...prev, msg]);
        
        if(currentUser) {
            // Save as JSON string to persist the component details including appointmentId
            const persistedData = JSON.stringify(details);
            
            await supabase.from('chat_history').insert({
                user_id: currentUser.id,
                provider_id: selectedChat ? selectedChat.id : null,
                role: 'BOT',
                text: persistedData // Save structured data
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
        return (
            <div className="flex flex-col h-full bg-white relative">
                
                {/* URGENT TICKER (Hidden if in chat) */}
                <UrgentTicker onClick={onOpenNotifications} currentUser={currentUser} />
                
                <div className="p-4 pb-2">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-gray-100 rounded-full flex items-center px-4 py-2 flex-1">
                            <Search size={18} className="text-gray-400"/>
                            <input placeholder={t('search')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none flex-1 ml-2 text-sm"/>
                        </div>
                        {selectedCategory && (
                            <button onClick={resetFilters} className="p-2 bg-red-100 rounded-full text-red-500 shadow-sm animate-fade-in"><RotateCcw size={18}/></button>
                        )}
                    </div>

                    {/* NEW FILTER CHIPS (Drill Down) */}
                    {renderFilterChips()}
                </div>

                <div className="flex-1 overflow-y-auto pb-20">
                    <div onClick={() => openChat(null)} className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shrink-0"><Globe size={28}/></div>
                        <div className="flex-1 min-w-0"><div className="flex justify-between items-center mb-1"><h3 className="font-bold text-gray-900">Tanger IA</h3><span className="text-[10px] text-gray-400">Now</span></div><p className="text-sm text-gray-500 line-clamp-1">{t('appDesc')}</p></div>
                    </div>
                    
                    {filteredProviders.length === 0 && <p className="text-center text-gray-400 py-10">No providers found matching filters.</p>}

                    {filteredProviders.map(p => {
                        const unreadCount = unreadCounts[p.id] || 0;
                        return (
                            <div key={p.id} onClick={() => openChat(p)} className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                                <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden border border-gray-100 relative shrink-0">
                                    <ProviderAvatar provider={p} />
                                    <span className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <h3 className="font-bold text-gray-900 truncate">{p.name}</h3>
                                        <div className="flex flex-col items-end">
                                            {p.last_ad_at ? (
                                                <span className="text-[10px] text-green-600 font-bold">New Story</span>
                                            ) : (
                                                <span className="text-[10px] text-gray-400">Online</span>
                                            )}
                                            {unreadCount > 0 && (
                                                <span className="bg-green-600 text-white text-[10px] font-bold px-1.5 h-4 min-w-[16px] rounded-full flex items-center justify-center mt-1">
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 flex items-center gap-1 truncate">
                                        <span className="font-semibold text-blue-600">{p.service_type}</span>
                                        {p.neighborhood && <span className="text-[10px] bg-gray-100 px-1 rounded text-gray-600">📍 {p.neighborhood}</span>}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // --- VIEW 2: CONVERSATION WINDOW ---
    return (
        <div className="flex flex-col h-full bg-[#EFE7DD] relative">
            
            {/* URGENT TICKER HIDDEN IN CHAT VIEW AS REQUESTED */}
            
            <div className="bg-white py-3 px-2 border-b flex items-center gap-2 shadow-sm z-20">
                <button onClick={() => setView('LIST')} className="p-2"><ArrowLeft size={20}/></button>
                <div onClick={() => selectedChat && setShowProfile(true)} className="flex items-center gap-3 flex-1 cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border">
                         {selectedChat ? (<ProviderAvatar provider={selectedChat} />) : (<div className="w-full h-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white"><Globe size={20}/></div>)}
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
                        {m.isWelcomeAd ? (
                            // --- WELCOME AD STYLE (PERSISTENT STORY) ---
                            <div className="w-full max-w-[85%] bg-white rounded-xl overflow-hidden shadow-md border border-pink-200 mb-4 transform transition-all hover:scale-[1.01]">
                                <div className="bg-pink-50 p-2 flex items-center gap-2 border-b border-pink-100">
                                    <MessageSquare size={14} className="text-pink-600"/>
                                    <span className="text-[10px] font-bold text-pink-600 uppercase tracking-wide">قصة جديدة (Story)</span>
                                </div>
                                {m.imageUrl && (
                                    <div className="w-full h-48 bg-gray-100 relative">
                                        <img src={m.imageUrl} className="w-full h-full object-cover" alt="Welcome"/>
                                    </div>
                                )}
                                <div className="p-3 bg-white">
                                    <p className="text-sm font-bold text-gray-800 leading-relaxed whitespace-pre-line">{m.text}</p>
                                </div>
                            </div>
                        ) : (
                            <div className={`p-2 px-3 rounded-lg max-w-[80%] text-sm shadow-sm relative ${m.role === Role.USER ? 'bg-[#dcf8c6] text-gray-900 rounded-tr-none' : 'bg-white text-gray-900 rounded-tl-none'}`}>
                                {m.imageUrl && <img src={m.imageUrl} className="rounded mb-2 max-w-full"/>}
                                <p className="leading-relaxed whitespace-pre-line">{m.text}</p>
                                {m.bookingDetails && (<div className="mt-2 bg-gray-50 p-2 rounded border border-gray-200"><p className="font-bold text-xs text-center">Booking ID: {m.bookingDetails.appointmentId}</p><div className="mt-2 flex justify-center"><QRCodeDisplay appointmentId={m.bookingDetails.appointmentId} bookingData={m.bookingDetails} /></div></div>)}
                                <div className="text-[9px] text-gray-400 text-right mt-1 flex justify-end items-center gap-1">{new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                            </div>
                        )}
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
