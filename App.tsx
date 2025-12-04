
import React, { useState, useEffect } from 'react';
import { UserView, Language, AuthenticatedUser, AccountType, Role, Offer } from './types';
import Chatbot from './components/Chatbot';
import ProviderPortal from './components/QRScanner';
import AppointmentsDrawer from './components/AppointmentsDrawer';
import DatabaseSetup from './components/DatabaseSetup';
import Store from './components/Store';
import { RealEstate } from './components/RealEstate';
import { JobBoard } from './components/JobBoard';
import { useLocalization, LocalizationProvider } from './hooks/useLocalization';
import { supabase } from './services/supabaseClient';
import { LogIn, User, MapPin, ShoppingBag, Home, Briefcase, Settings, X, Phone, Globe, LayoutGrid, Heart, List, LogOut, CheckCircle, Edit, Share2, Grid, Bookmark, Menu, Users, Database, Instagram, Facebook, Tag, Sparkles, MessageCircle, Calendar } from 'lucide-react';

// --- AUTH MODAL ---
const AuthModal: React.FC<{ isOpen: boolean; onClose: () => void; onLogin: (user: AuthenticatedUser) => void }> = ({ isOpen, onClose, onLogin }) => {
    const { t, language } = useLocalization();
    const [isRegister, setIsRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ phone: '', password: '', name: '', type: AccountType.CLIENT, service_type: '', username: '' });

    const handleSubmit = async () => {
        setLoading(true);
        try {
            if (isRegister) {
                const table = formData.type === AccountType.CLIENT ? 'clients' : 'providers';
                const payload: any = { phone: formData.phone, password: formData.password, [formData.type === AccountType.CLIENT ? 'full_name' : 'name']: formData.name };
                if (formData.type === AccountType.PROVIDER) {
                    payload.service_type = formData.service_type || 'General';
                    payload.username = formData.username || formData.phone; 
                    payload.is_active = true;
                }
                const { error } = await supabase.from(table).insert(payload);
                if (error) throw error;
                const query = supabase.from(table).select('*');
                if (formData.type === AccountType.PROVIDER) query.eq('username', payload.username);
                else query.eq('phone', formData.phone);
                const { data } = await query.single();
                if(data) onLogin({ id: data.id, name: data.full_name || data.name, accountType: formData.type, phone: data.phone, service_type: data.service_type, profile_image_url: data.profile_image_url, username: data.username });
            } else {
                let user: any = null;
                let type: AccountType = AccountType.CLIENT;
                const { data: client } = await supabase.from('clients').select('*').eq('phone', formData.phone).eq('password', formData.password).single();
                if (client) { user = client; type = AccountType.CLIENT; }
                else {
                    const { data: provider } = await supabase.from('providers').select('*').eq('password', formData.password).or(`phone.eq.${formData.phone},username.eq.${formData.phone}`).single();
                    if (provider) { user = provider; type = AccountType.PROVIDER; }
                }
                if (user) onLogin({ id: user.id, name: user.full_name || user.name, accountType: type, phone: user.phone, service_type: user.service_type, profile_image_url: user.profile_image_url, bio: user.bio, username: user.username, social_links: user.social_links, followers_count: user.followers_count });
                else alert(t('errorMessage'));
            }
        } catch (e: any) { alert(e.message || t('errorMessage')); } finally { setLoading(false); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400"><X/></button>
                <div className="p-8">
                    <h2 className="text-2xl font-black mb-2 text-center dark:text-white flex items-center justify-center gap-2"><LogIn/> {isRegister ? t('registerTitle') : t('loginTitle')}</h2>
                    <div className="space-y-4">
                        {isRegister && (
                            <>
                                <div className="flex gap-2">
                                    <button onClick={() => setFormData({...formData, type: AccountType.CLIENT})} className={`flex-1 py-2 rounded-lg font-bold text-sm border-2 ${formData.type === AccountType.CLIENT ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-500'}`}>{t('client')}</button>
                                    <button onClick={() => setFormData({...formData, type: AccountType.PROVIDER})} className={`flex-1 py-2 rounded-lg font-bold text-sm border-2 ${formData.type === AccountType.PROVIDER ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-500'}`}>{t('provider')}</button>
                                </div>
                                <input placeholder={t('fullName')} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl outline-none"/>
                                {formData.type === AccountType.PROVIDER && (
                                    <>
                                        <input placeholder={t('username')} value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl outline-none"/>
                                        <input placeholder="Service Type (e.g. Doctor)" value={formData.service_type} onChange={e => setFormData({...formData, service_type: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl outline-none"/>
                                    </>
                                )}
                            </>
                        )}
                        <input type="text" placeholder={isRegister ? t('phone') : t('phoneOrUsername')} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl outline-none"/>
                        <input type="password" placeholder={t('password')} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl outline-none"/>
                        <button onClick={handleSubmit} disabled={loading} className="w-full py-3 bg-black text-white font-bold rounded-xl">{loading ? t('loading') : (isRegister ? t('registerButton') : t('loginButton'))}</button>
                        <p className="text-center text-sm text-gray-500 mt-4 cursor-pointer hover:underline" onClick={() => setIsRegister(!isRegister)}>{isRegister ? t('loginTitle') : t('registerTitle')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- PUBLIC PROVIDER PROFILE (INSTAGRAM STYLE FOR CLIENTS) ---
// Note: This is now mostly handled inside Chatbot.tsx but kept for Directory usage
const PublicProviderProfile: React.FC<{ provider: AuthenticatedUser; onClose: () => void }> = ({ provider, onClose }) => {
    const { t } = useLocalization();
    const [offers, setOffers] = useState<Offer[]>([]);

    useEffect(() => {
        const fetchOffers = async () => {
            const { data } = await supabase.from('provider_offers').select('*').eq('provider_id', provider.id);
            setOffers(data || []);
        }
        fetchOffers();
    }, []);

    return (
        <div className="fixed inset-0 bg-white z-[70] flex flex-col animate-slide-up overflow-y-auto">
            <div className="p-4 border-b flex items-center gap-3 sticky top-0 bg-white z-10">
                <button onClick={onClose}><X/></button>
                <h2 className="font-bold text-lg">{provider.name}</h2>
            </div>
            <div className="p-4">
                <div className="flex items-center gap-6 mb-4">
                     <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-0.5">
                        <img src={provider.profile_image_url || `https://ui-avatars.com/api/?name=${provider.name}`} className="w-full h-full rounded-full border-2 border-white object-cover"/>
                     </div>
                     <div className="flex-1 flex justify-around text-center">
                         <div><div className="font-bold text-lg">{offers.length}</div><div className="text-xs text-gray-500">{t('offers')}</div></div>
                         <div><div className="font-bold text-lg">{provider.followers_count || 0}</div><div className="text-xs text-gray-500">{t('followers')}</div></div>
                     </div>
                </div>
                <div>
                    <h2 className="font-bold">{provider.name}</h2>
                    <p className="text-gray-500 text-sm">{provider.service_type}</p>
                    <p className="text-sm whitespace-pre-line mt-1">{provider.bio}</p>
                    {provider.social_links && (
                        <div className="flex gap-3 mt-2">
                             {provider.social_links.instagram && <a href={`https://instagram.com/${provider.social_links.instagram}`} target="_blank" className="text-pink-600"><Instagram size={18}/></a>}
                             {provider.social_links.facebook && <a href={`https://facebook.com/${provider.social_links.facebook}`} target="_blank" className="text-blue-600"><Facebook size={18}/></a>}
                             {provider.social_links.gps && <a href={`https://maps.google.com/?q=${provider.social_links.gps}`} target="_blank" className="text-green-600"><MapPin size={18}/></a>}
                        </div>
                    )}
                </div>
                <button className="w-full bg-blue-500 text-white font-bold py-2 rounded-lg mt-6 mb-6">Follow</button>
                
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Tag size={20}/> {t('offers')}</h3>
                <div className="grid grid-cols-2 gap-3">
                    {offers.map(o => (
                        <div key={o.id} className="border rounded-xl overflow-hidden shadow-sm">
                            {o.image_url && <img src={o.image_url} className="w-full h-32 object-cover"/>}
                            <div className="p-2">
                                <h4 className="font-bold text-sm truncate">{o.title}</h4>
                                <div className="flex gap-2 text-xs">
                                    <span className="line-through text-gray-400">{o.original_price} DH</span>
                                    <span className="text-red-600 font-bold">{o.discount_price} DH</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {offers.length === 0 && <p className="col-span-2 text-center text-gray-400">{t('noPosts')}</p>}
                </div>
            </div>
        </div>
    )
}

// --- PROVIDER DIRECTORY ---
const ProviderDirectory: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { t } = useLocalization();
    const [providers, setProviders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<AuthenticatedUser | null>(null);

    useEffect(() => {
        if(isOpen) {
            const fetch = async () => {
                setLoading(true);
                const { data } = await supabase.from('providers').select('*').eq('is_active', true);
                setProviders(data || []);
                setLoading(false);
            }
            fetch();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-lg h-[80vh] rounded-3xl flex flex-col overflow-hidden animate-slide-up">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 dark:bg-gray-700">
                    <h2 className="font-bold text-lg dark:text-white flex items-center gap-2"><Users className="text-blue-500"/> {t('providerDirectory')}</h2>
                    <button onClick={onClose}><X className="dark:text-white"/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? <p className="text-center text-gray-500">{t('loading')}</p> : providers.map((p, i) => (
                        <div key={i} onClick={() => setSelectedProvider(p)} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600 cursor-pointer hover:bg-gray-100">
                             <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                                 <img src={p.profile_image_url || `https://ui-avatars.com/api/?name=${p.name}`} className="w-full h-full object-cover"/>
                             </div>
                             <div>
                                 <h4 className="font-bold dark:text-white">{p.name}</h4>
                                 <p className="text-xs text-gray-500 dark:text-gray-400">{p.service_type}</p>
                                 <p className="text-[10px] text-gray-400 flex items-center gap-1"><MapPin size={10}/> {p.location}</p>
                             </div>
                        </div>
                    ))}
                    {!loading && providers.length === 0 && <p className="text-center text-gray-400">{t('noPosts')}</p>}
                </div>
            </div>
            {selectedProvider && <PublicProviderProfile provider={selectedProvider} onClose={() => setSelectedProvider(null)} />}
        </div>
    );
};

// --- SERVICES HUB (NEW EXPLORE TAB) ---
const ServicesHub: React.FC<{ onNav: (target: string) => void }> = ({ onNav }) => {
    const { t } = useLocalization();
    
    const ServiceCard = ({ icon: Icon, title, color, bg, onClick }: any) => (
        <button onClick={onClick} className={`${bg} border border-transparent hover:border-${color.split('-')[1]}-200 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-sm active:scale-95 transition-all`}>
            <div className={`w-14 h-14 rounded-full ${color} text-white flex items-center justify-center shadow-md`}>
                <Icon size={28}/>
            </div>
            <span className="font-bold text-gray-800 text-sm">{title}</span>
        </button>
    );

    return (
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 pb-20">
            <div className="mb-6">
                <h2 className="text-2xl font-black text-gray-900">{t('servicesHubTitle')}</h2>
                <p className="text-gray-500 text-sm">{t('servicesHubDesc')}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <ServiceCard icon={Home} title={t('realEstateTitle')} color="bg-purple-500" bg="bg-white" onClick={() => onNav('REAL_ESTATE')}/>
                <ServiceCard icon={Briefcase} title={t('jobBoardTitle')} color="bg-green-500" bg="bg-white" onClick={() => onNav('JOBS')}/>
                <ServiceCard icon={Users} title={t('providerDirectory')} color="bg-blue-500" bg="bg-white" onClick={() => onNav('DIRECTORY')}/>
                <ServiceCard icon={Calendar} title={t('myAppointments')} color="bg-teal-500" bg="bg-white" onClick={() => onNav('APPOINTMENTS')}/>
            </div>
        </div>
    );
}

// --- PROFILE TAB ---
const ProfileTab: React.FC<{ 
    user: AuthenticatedUser | null; 
    onLogin: () => void; 
    onLogout: () => void;
    isAdmin: boolean;
    onNav: (target: string) => void;
}> = ({ user, onLogin, onLogout, isAdmin, onNav }) => {
    const { t } = useLocalization();

    if (!user) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50 pb-20">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4 shadow-inner">
                    <User size={48} className="text-gray-400"/>
                </div>
                <h2 className="text-xl font-bold mb-2">{t('guest')}</h2>
                <p className="text-gray-500 text-center mb-6 max-w-xs">{t('appDesc')}</p>
                <button onClick={onLogin} className="px-8 py-3 bg-black text-white rounded-full font-bold shadow-lg active:scale-95 transition-transform">{t('loginRegister')}</button>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto bg-gray-50 pb-20">
            <div className="bg-white p-6 border-b shadow-sm mb-4">
                <div className="flex items-center gap-4">
                     <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-lg">
                        <img src={user.profile_image_url || `https://ui-avatars.com/api/?name=${user.name}`} className="w-full h-full object-cover"/>
                    </div>
                    <div>
                        <h2 className="font-bold text-xl">{user.name}</h2>
                        <p className="text-sm text-gray-500">{user.accountType === 'PROVIDER' ? t('provider') : t('client')}</p>
                        <p className="text-xs text-gray-400 mt-1">{user.phone}</p>
                    </div>
                </div>
                <div className="flex gap-2 mt-6">
                    <button className="flex-1 py-2 bg-gray-100 rounded-lg font-bold text-xs">{t('editProfile')}</button>
                    <button onClick={onLogout} className="flex-1 py-2 bg-red-50 text-red-500 rounded-lg font-bold text-xs flex items-center justify-center gap-1"><LogOut size={14}/> {t('logout')}</button>
                </div>
            </div>

            <div className="p-4">
                <h3 className="font-bold text-gray-400 text-xs uppercase mb-3">{t('menu')}</h3>
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    {user.accountType === 'PROVIDER' && (
                         <div className="p-4 border-b flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => onNav('ROOM')}>
                             <div className="flex items-center gap-3">
                                 <div className="p-2 bg-black text-white rounded-lg"><LayoutGrid size={18}/></div>
                                 <span className="font-bold">{t('controlRoom')}</span>
                             </div>
                             <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                         </div>
                    )}
                    {isAdmin && (
                        <div className="p-4 border-b flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => onNav('DB')}>
                             <div className="flex items-center gap-3">
                                 <div className="p-2 bg-red-100 text-red-600 rounded-lg"><Database size={18}/></div>
                                 <span className="font-bold">{t('databaseSetupTitle')}</span>
                             </div>
                         </div>
                    )}
                    <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 text-gray-600 rounded-lg"><Settings size={18}/></div>
                            <span className="font-bold">App Settings</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- SPLASH SCREEN ---
const SplashScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center animate-fade-in">
             <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-xl mb-6 animate-slide-up">
                 <Globe size={48} className="animate-spin-slow"/>
             </div>
             <h1 className="text-2xl font-black text-gray-900 tracking-tight animate-pulse">Tanger IA</h1>
             <p className="text-gray-400 text-sm mt-2">Connect. Smart. Easy.</p>
        </div>
    );
}

// --- MAIN APP CONTENT ---
const AppContent: React.FC = () => {
    const { t, language, setLanguage } = useLocalization();
    const [user, setUser] = useState<AuthenticatedUser | null>(null);
    const [userView, setUserView] = useState<UserView>(UserView.CLIENT);
    const [showSplash, setShowSplash] = useState(true);
    const [activeTab, setActiveTab] = useState<'CHAT' | 'STORE' | 'SERVICES' | 'PROFILE'>('CHAT');
    
    // Modals (Still used for sub-features)
    const [showAuth, setShowAuth] = useState(false);
    const [showRealEstate, setShowRealEstate] = useState(false);
    const [showJobBoard, setShowJobBoard] = useState(false);
    const [showAppointments, setShowAppointments] = useState(false);
    const [showDB, setShowDB] = useState(false);
    const [showDirectory, setShowDirectory] = useState(false);

    useEffect(() => {
        // Splash Timer
        const timer = setTimeout(() => setShowSplash(false), 2500);

        const stored = localStorage.getItem('tanger_user');
        if (stored) {
            const u = JSON.parse(stored);
            setUser(u);
            if(u.accountType === AccountType.PROVIDER) setUserView(UserView.PROVIDER);
        }
        return () => clearTimeout(timer);
    }, []);

    const handleLogin = (u: AuthenticatedUser) => {
        setUser(u);
        localStorage.setItem('tanger_user', JSON.stringify(u));
        setShowAuth(false);
        if(u.accountType === AccountType.PROVIDER) setUserView(UserView.PROVIDER);
    };

    const handleLogout = () => { setUser(null); localStorage.removeItem('tanger_user'); setUserView(UserView.CLIENT); };

    // This allows providers to "Exit" the control room and see the app as a client
    const toggleProviderView = () => setUserView(prev => prev === UserView.PROVIDER ? UserView.CLIENT : UserView.PROVIDER);

    // Navigation Handler
    const handleNav = (target: string) => {
        switch(target) {
            case 'STORE': setActiveTab('STORE'); break; // Switch to Store Tab
            case 'REAL_ESTATE': setShowRealEstate(true); break;
            case 'JOBS': setShowJobBoard(true); break;
            case 'APPOINTMENTS': setShowAppointments(true); break;
            case 'DB': setShowDB(true); break;
            case 'DIRECTORY': setShowDirectory(true); break;
            case 'ROOM': toggleProviderView(); break;
        }
    }

    if(showSplash) return <SplashScreen />;

    // RENDER PROVIDER CONTROL ROOM (Full Screen Override)
    if (user?.accountType === AccountType.PROVIDER && userView === UserView.PROVIDER) {
        return <ProviderPortal provider={user} onLogout={toggleProviderView} />;
    }

    // RENDER CLIENT APP (Bottom Nav Layout)
    return (
        <div className={`flex flex-col h-screen bg-white ${language === 'ar' ? 'font-arabic' : 'font-sans'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            
            {/* NEW CLEAN HEADER */}
            <div className="bg-white/90 backdrop-blur-md border-b border-gray-100 p-3 flex justify-between items-center z-20 h-16 sticky top-0 shadow-sm">
                
                {/* Language Switcher */}
                <div className="w-10">
                    <button onClick={() => setLanguage(language === Language.AR ? Language.FR : Language.AR)} className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all">{language.toUpperCase()}</button>
                </div>

                {/* Styled Professional Logo */}
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 transform rotate-3">
                         <Sparkles size={20} className="text-white fill-white"/>
                    </div>
                    <div className="flex flex-col leading-none">
                        <h1 className="font-black text-xl tracking-tight bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent">
                            Tanger<span className="font-light text-gray-400">IA</span>
                        </h1>
                    </div>
                </div>

                {/* Login Button (Icon Only) */}
                <div className="w-10 flex justify-end">
                    {!user && (
                         <button onClick={() => setShowAuth(true)} className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                             <LogIn size={16}/>
                         </button>
                    )}
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-hidden relative bg-white">
                {activeTab === 'CHAT' && <Chatbot currentUser={user} onOpenAuth={() => setShowAuth(true)} onDiscover={() => setActiveTab('SERVICES')} />}
                {/* We render Store as a modal-like view but inside the tab structure */}
                {activeTab === 'STORE' && <div className="absolute inset-0 z-0"><Store isOpen={true} onClose={() => setActiveTab('CHAT')} currentUser={user} onOpenAuth={() => setShowAuth(true)} /></div>}
                {activeTab === 'SERVICES' && <ServicesHub onNav={handleNav} />}
                {activeTab === 'PROFILE' && <ProfileTab user={user} onLogin={() => setShowAuth(true)} onLogout={handleLogout} isAdmin={user?.phone === '0617774846'} onNav={handleNav}/>}
            </div>

            {/* BOTTOM NAVIGATION BAR */}
            <div className="bg-white border-t border-gray-100 pb-safe z-30 flex justify-around items-center h-16 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.05)]">
                <button onClick={() => setActiveTab('CHAT')} className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeTab === 'CHAT' ? 'text-blue-600' : 'text-gray-400'}`}>
                    <MessageCircle size={24} className={activeTab === 'CHAT' ? 'fill-blue-100' : ''} />
                    <span className="text-[10px] font-bold">{t('navChat')}</span>
                </button>
                <button onClick={() => setActiveTab('STORE')} className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeTab === 'STORE' ? 'text-orange-600' : 'text-gray-400'}`}>
                    <ShoppingBag size={24} className={activeTab === 'STORE' ? 'fill-orange-100' : ''} />
                    <span className="text-[10px] font-bold">{t('navStore')}</span>
                </button>
                <button onClick={() => setActiveTab('SERVICES')} className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeTab === 'SERVICES' ? 'text-purple-600' : 'text-gray-400'}`}>
                    <LayoutGrid size={24} className={activeTab === 'SERVICES' ? 'fill-purple-100' : ''} />
                    <span className="text-[10px] font-bold">{t('navExplore')}</span>
                </button>
                <button onClick={() => setActiveTab('PROFILE')} className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeTab === 'PROFILE' ? 'text-black' : 'text-gray-400'}`}>
                    {user?.profile_image_url ? (
                        <img src={user.profile_image_url} className={`w-6 h-6 rounded-full object-cover border-2 ${activeTab === 'PROFILE' ? 'border-black' : 'border-transparent'}`}/>
                    ) : (
                        <User size={24} className={activeTab === 'PROFILE' ? 'fill-gray-200' : ''} />
                    )}
                    <span className="text-[10px] font-bold">{t('navProfile')}</span>
                </button>
            </div>

            {/* OVERLAY MODALS (Launched from Services Hub) */}
            <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} onLogin={handleLogin} />
            <RealEstate isOpen={showRealEstate} onClose={() => setShowRealEstate(false)} currentUser={user} />
            <JobBoard isOpen={showJobBoard} onClose={() => setShowJobBoard(false)} currentUser={user} />
            <AppointmentsDrawer isOpen={showAppointments} onClose={() => setShowAppointments(false)} user={user} />
            <DatabaseSetup isOpen={showDB} onClose={() => setShowDB(false)} />
            <ProviderDirectory isOpen={showDirectory} onClose={() => setShowDirectory(false)} />
        </div>
    );
};

const App: React.FC = () => {
    return (
        <LocalizationProvider>
            <AppContent />
        </LocalizationProvider>
    );
};

export default App;
