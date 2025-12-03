
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
import { LogIn, User, MapPin, ShoppingBag, Home, Briefcase, Settings, X, Phone, Globe, LayoutGrid, Heart, List, LogOut, CheckCircle, Edit, Share2, Grid, Bookmark, Menu, Users, Database, Instagram, Facebook, Tag } from 'lucide-react';

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

// --- CLIENT PROFILE / MENU ---
const ClientProfile: React.FC<{ 
    user: AuthenticatedUser | null; 
    onClose: () => void; 
    onLogout: () => void;
    onNav: (target: string) => void;
    isAdmin: boolean;
}> = ({ user, onClose, onLogout, onNav, isAdmin }) => {
    const { t } = useLocalization();

    const MenuBtn = ({ icon: Icon, label, onClick, color }: any) => (
        <button onClick={onClick} className="w-full bg-gray-50 dark:bg-gray-800 p-3 rounded-xl flex items-center gap-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-700">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${color || 'bg-blue-100 text-blue-600'}`}>
                <Icon size={16}/>
            </div>
            <span className="font-bold text-sm dark:text-white">{label}</span>
        </button>
    );

    return (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 animate-slide-up flex flex-col overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white dark:bg-gray-900 z-10">
                <button onClick={onClose}><X className="dark:text-white"/></button>
                <span className="font-bold dark:text-white">{t('menu')}</span>
                {user && <button onClick={onLogout}><LogOut className="text-red-500" size={20}/></button>}
            </div>
            <div className="p-4">
                {user ? (
                    <>
                        <div className="flex items-center gap-6 mb-6">
                            <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-lg">
                                <img src={user.profile_image_url || `https://ui-avatars.com/api/?name=${user.name}`} className="w-full h-full object-cover"/>
                            </div>
                            <div className="flex-1">
                                <h1 className="font-bold text-lg dark:text-white">{user.name}</h1>
                                <p className="text-gray-500 text-sm">{user.accountType === 'PROVIDER' ? t('provider') : t('client')}</p>
                                <div className="flex gap-4 mt-2 text-center">
                                    <div><div className="font-bold dark:text-white">0</div><div className="text-[10px] text-gray-500">{t('posts')}</div></div>
                                    <div><div className="font-bold dark:text-white">0</div><div className="text-[10px] text-gray-500">{t('following')}</div></div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 mb-8">
                            <button className="flex-1 bg-gray-100 dark:bg-gray-800 dark:text-white py-2 rounded-lg font-bold text-xs">{t('edit')}</button>
                            <button className="flex-1 bg-gray-100 dark:bg-gray-800 dark:text-white py-2 rounded-lg font-bold text-xs">{t('share')}</button>
                        </div>
                    </>
                ) : (
                    <div className="text-center mb-8">
                         <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-2 flex items-center justify-center"><User size={32} className="text-gray-400"/></div>
                         <h3 className="font-bold dark:text-white">{t('guest')}</h3>
                         <button onClick={() => onNav('LOGIN')} className="mt-2 text-blue-600 font-bold text-sm underline">{t('loginTitle')}</button>
                    </div>
                )}
                
                <h3 className="font-bold text-sm text-gray-400 mb-3 uppercase">{t('menu')}</h3>
                <div className="grid grid-cols-1 gap-3">
                    <MenuBtn icon={ShoppingBag} label={t('shop')} onClick={() => onNav('STORE')} color="bg-orange-100 text-orange-600"/>
                    <MenuBtn icon={Home} label={t('realEstateTitle')} onClick={() => onNav('REAL_ESTATE')} color="bg-purple-100 text-purple-600"/>
                    <MenuBtn icon={Briefcase} label={t('jobBoardTitle')} onClick={() => onNav('JOBS')} color="bg-green-100 text-green-600"/>
                    <MenuBtn icon={Users} label={t('providerDirectory')} onClick={() => onNav('DIRECTORY')} color="bg-blue-100 text-blue-600"/>
                    {user && <MenuBtn icon={CheckCircle} label={t('myAppointments')} onClick={() => onNav('APPOINTMENTS')} color="bg-teal-100 text-teal-600"/>}
                    {isAdmin && <MenuBtn icon={Database} label={t('databaseSetupTitle')} onClick={() => onNav('DB')} color="bg-red-100 text-red-600"/>}
                </div>
            </div>
        </div>
    );
};

// --- MAIN APP CONTENT ---
const AppContent: React.FC = () => {
    const { t, language, setLanguage } = useLocalization();
    const [user, setUser] = useState<AuthenticatedUser | null>(null);
    const [userView, setUserView] = useState<UserView>(UserView.CLIENT);
    
    // Modals
    const [showAuth, setShowAuth] = useState(false);
    const [showStore, setShowStore] = useState(false);
    const [showRealEstate, setShowRealEstate] = useState(false);
    const [showJobBoard, setShowJobBoard] = useState(false);
    const [showAppointments, setShowAppointments] = useState(false);
    const [showDB, setShowDB] = useState(false);
    const [showClientProfile, setShowClientProfile] = useState(false);
    const [showDirectory, setShowDirectory] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('tanger_user');
        if (stored) {
            const u = JSON.parse(stored);
            setUser(u);
            if(u.accountType === AccountType.PROVIDER) setUserView(UserView.PROVIDER);
        }
    }, []);

    const handleLogin = (u: AuthenticatedUser) => {
        setUser(u);
        localStorage.setItem('tanger_user', JSON.stringify(u));
        setShowAuth(false);
        if(u.accountType === AccountType.PROVIDER) setUserView(UserView.PROVIDER);
    };

    const handleLogout = () => { setUser(null); localStorage.removeItem('tanger_user'); setUserView(UserView.CLIENT); setShowClientProfile(false); };

    // This allows providers to "Exit" the control room and see the app as a client
    const toggleProviderView = () => setUserView(prev => prev === UserView.PROVIDER ? UserView.CLIENT : UserView.PROVIDER);

    // Navigation Handler
    const handleNav = (target: string) => {
        setShowClientProfile(false); // Close menu
        switch(target) {
            case 'STORE': setShowStore(true); break;
            case 'REAL_ESTATE': setShowRealEstate(true); break;
            case 'JOBS': setShowJobBoard(true); break;
            case 'APPOINTMENTS': setShowAppointments(true); break;
            case 'DB': setShowDB(true); break;
            case 'DIRECTORY': setShowDirectory(true); break;
            case 'LOGIN': setShowAuth(true); break;
        }
    }

    // RENDER PROVIDER CONTROL ROOM
    if (user?.accountType === AccountType.PROVIDER && userView === UserView.PROVIDER) {
        return <ProviderPortal provider={user} onLogout={toggleProviderView} />;
    }

    // RENDER CLIENT APP
    return (
        <div className={`flex flex-col h-screen ${language === 'ar' ? 'font-arabic' : 'font-sans'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 p-3 flex justify-between items-center z-20 shadow-sm h-16">
                <div className="flex items-center gap-2">
                    {/* NEW SPLASH LOGO */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg ring-2 ring-white">
                        <Globe size={20} className="animate-spin-slow"/>
                    </div>
                    <h1 className="font-bold text-lg dark:text-white hidden sm:block">Tanger<span className="text-cyan-600">Connect</span></h1>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => setLanguage(language === Language.AR ? Language.FR : Language.AR)} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-xs font-bold bg-gray-50">{language.toUpperCase()}</button>
                    {user?.accountType === AccountType.PROVIDER && (
                        <button onClick={toggleProviderView} className="px-3 py-1.5 bg-black text-white rounded-full text-xs font-bold shadow-md flex items-center gap-1"><LayoutGrid size={12}/> {t('controlRoom')}</button>
                    )}
                    
                    {/* UPDATED PROFILE BUTTON WITH NAME AND IMAGE */}
                    <button onClick={() => setShowClientProfile(true)} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full pl-1 pr-3 py-1 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden shadow-sm">
                            {user?.profile_image_url ? (
                                <img src={user.profile_image_url} className="w-full h-full object-cover"/>
                            ) : (
                                <User size={18} className="text-gray-500 dark:text-gray-400"/>
                            )}
                        </div>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-200 max-w-[80px] truncate">
                            {user?.name?.split(' ')[0] || t('guest')}
                        </span>
                    </button>
                </div>
            </div>

            <div className="flex-1 relative overflow-hidden">
                <Chatbot currentUser={user} onOpenAuth={() => setShowAuth(true)} />
            </div>

            <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} onLogin={handleLogin} />
            <Store isOpen={showStore} onClose={() => setShowStore(false)} currentUser={user} onOpenAuth={() => setShowAuth(true)} />
            <RealEstate isOpen={showRealEstate} onClose={() => setShowRealEstate(false)} currentUser={user} />
            <JobBoard isOpen={showJobBoard} onClose={() => setShowJobBoard(false)} currentUser={user} />
            <AppointmentsDrawer isOpen={showAppointments} onClose={() => setShowAppointments(false)} user={user} />
            <DatabaseSetup isOpen={showDB} onClose={() => setShowDB(false)} />
            <ProviderDirectory isOpen={showDirectory} onClose={() => setShowDirectory(false)} />
            
            {showClientProfile && (
                <ClientProfile 
                    user={user} 
                    onClose={() => setShowClientProfile(false)} 
                    onLogout={handleLogout} 
                    onNav={handleNav}
                    isAdmin={user?.phone === '0617774846'}
                />
            )}
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
