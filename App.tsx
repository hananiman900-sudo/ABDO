
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
import { LogIn, User, MapPin, ShoppingBag, Home, Briefcase, Settings, X, Phone, Globe, LayoutGrid, Heart, List, LogOut, CheckCircle, Edit, Share2, Grid, Bookmark, Menu, Users, Database, Instagram, Facebook, Tag, Sparkles, MessageCircle, Calendar, Bell } from 'lucide-react';

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
                if (user) onLogin({ id: user.id, name: user.full_name || user.name, accountType: type, phone: user.phone, service_type: user.service_type, profile_image_url: user.profile_image_url, bio: user.bio, username: user.username, social_links: user.social_links, followers_count: user.followers_count, visits_count: user.visits_count });
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

// --- SERVICES HUB (NEW EXPLORE TAB) ---
const ServicesHub: React.FC<{ onNav: (target: string) => void; isAdmin: boolean }> = ({ onNav, isAdmin }) => {
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
                
                {/* ADMIN DB BUTTON */}
                {isAdmin && (
                    <ServiceCard icon={Database} title={t('databaseSetupTitle')} color="bg-red-500" bg="bg-white" onClick={() => onNav('DB')}/>
                )}
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
    const [hideBottomNav, setHideBottomNav] = useState(false);
    
    // Notifications State
    const [unreadNotifs, setUnreadNotifs] = useState(0);

    // Modals
    const [showAuth, setShowAuth] = useState(false);
    const [showRealEstate, setShowRealEstate] = useState(false);
    const [showJobBoard, setShowJobBoard] = useState(false);
    const [showAppointments, setShowAppointments] = useState(false);
    const [showDB, setShowDB] = useState(false);
    const [showDirectory, setShowDirectory] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowSplash(false), 2500);
        const stored = localStorage.getItem('tanger_user');
        if (stored) {
            const u = JSON.parse(stored);
            setUser(u);
            if(u.accountType === AccountType.PROVIDER) setUserView(UserView.PROVIDER);
            fetchNotifications(u.id);
        }
        return () => clearTimeout(timer);
    }, []);

    const fetchNotifications = async (userId: number) => {
        // Fetch urgent ads from followed providers
        const { data: follows } = await supabase.from('follows').select('provider_id').eq('client_id', userId);
        if(follows && follows.length > 0) {
            const providerIds = follows.map(f => f.provider_id);
            const { count } = await supabase.from('urgent_ads').select('id', { count: 'exact' }).in('provider_id', providerIds).eq('is_active', true);
            setUnreadNotifs(count || 0);
        }
    }

    const handleLogin = (u: AuthenticatedUser) => {
        setUser(u);
        localStorage.setItem('tanger_user', JSON.stringify(u));
        setShowAuth(false);
        if(u.accountType === AccountType.PROVIDER) setUserView(UserView.PROVIDER);
        fetchNotifications(u.id);
    };

    // New function to update user state (e.g., when profile pic changes)
    const handleUpdateUser = (updates: Partial<AuthenticatedUser>) => {
        if (!user) return;
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem('tanger_user', JSON.stringify(updatedUser));
    };

    const handleLogout = () => { setUser(null); localStorage.removeItem('tanger_user'); setUserView(UserView.CLIENT); };
    const toggleProviderView = () => setUserView(prev => prev === UserView.PROVIDER ? UserView.CLIENT : UserView.PROVIDER);

    const handleNav = (target: string) => {
        switch(target) {
            case 'STORE': setActiveTab('STORE'); break; 
            case 'REAL_ESTATE': setShowRealEstate(true); break;
            case 'JOBS': setShowJobBoard(true); break;
            case 'APPOINTMENTS': setShowAppointments(true); break;
            case 'DB': setShowDB(true); break;
            case 'DIRECTORY': setShowDirectory(true); break;
            case 'ROOM': toggleProviderView(); break;
        }
    }

    if(showSplash) return <SplashScreen />;

    if (user?.accountType === AccountType.PROVIDER && userView === UserView.PROVIDER) {
        return <ProviderPortal provider={user} onLogout={toggleProviderView} onUpdateUser={handleUpdateUser} />;
    }

    const isAdmin = user?.phone === '0617774846';

    return (
        <div className={`flex flex-col h-screen bg-white ${language === 'ar' ? 'font-arabic' : 'font-sans'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            
            {/* NEW CLEAN HEADER - CONDITIONAL RENDERING */}
            {!hideBottomNav && (
                <div className="bg-white/90 backdrop-blur-md border-b border-gray-100 p-3 flex justify-between items-center z-20 h-16 sticky top-0 shadow-sm animate-fade-in">
                    
                    {/* Notification Bell */}
                    <div className="w-10">
                    <div className="relative inline-block">
                        <Bell size={24} className="text-gray-700"/>
                        {unreadNotifs > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">{unreadNotifs}</span>}
                    </div>
                    </div>

                    {/* Logo */}
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

                    {/* Login Button or User Avatar */}
                    <div className="w-10 flex justify-end">
                        {!user ? (
                            <button onClick={() => setShowAuth(true)} className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                                <LogIn size={16}/>
                            </button>
                        ) : (
                            <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200">
                                <img src={user.profile_image_url || `https://ui-avatars.com/api/?name=${user.name}`} className="w-full h-full object-cover"/>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-hidden relative bg-white">
                {activeTab === 'CHAT' && <Chatbot currentUser={user} onOpenAuth={() => setShowAuth(true)} onDiscover={() => setActiveTab('SERVICES')} onToggleNav={setHideBottomNav} />}
                {activeTab === 'STORE' && <div className="absolute inset-0 z-0"><Store isOpen={true} onClose={() => setActiveTab('CHAT')} currentUser={user} onOpenAuth={() => setShowAuth(true)} /></div>}
                {activeTab === 'SERVICES' && <ServicesHub onNav={handleNav} isAdmin={isAdmin} />}
                {activeTab === 'PROFILE' && <ProfileTab user={user} onLogin={() => setShowAuth(true)} onLogout={handleLogout} isAdmin={isAdmin} onNav={handleNav}/>}
            </div>

            {/* BOTTOM NAVIGATION BAR */}
            {!hideBottomNav && (
                <div className="bg-white border-t border-gray-100 pb-safe z-30 flex justify-around items-center h-16 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.05)] animate-slide-up">
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
            )}

            <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} onLogin={handleLogin} />
            <RealEstate isOpen={showRealEstate} onClose={() => setShowRealEstate(false)} currentUser={user} />
            <JobBoard isOpen={showJobBoard} onClose={() => setShowJobBoard(false)} currentUser={user} />
            <AppointmentsDrawer isOpen={showAppointments} onClose={() => setShowAppointments(false)} user={user} />
            <DatabaseSetup isOpen={showDB} onClose={() => setShowDB(false)} />
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
