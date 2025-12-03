
import React, { useState, useEffect } from 'react';
import { UserView, Language, AuthenticatedUser, AccountType, Role } from './types';
import Chatbot from './components/Chatbot';
import ProviderPortal from './components/QRScanner';
import AppointmentsDrawer from './components/AppointmentsDrawer';
import DatabaseSetup from './components/DatabaseSetup';
import Store from './components/Store';
import { RealEstate } from './components/RealEstate';
import { JobBoard } from './components/JobBoard';
import { useLocalization, LocalizationProvider } from './hooks/useLocalization';
import { supabase } from './services/supabaseClient';
import { LogIn, User, MapPin, ShoppingBag, Home, Briefcase, Settings, X, Phone, Globe, LayoutGrid, Heart, List, LogOut, CheckCircle, Edit, Share2, Grid, Bookmark, Menu, Users, Database } from 'lucide-react';

// --- AUTH MODAL ---
const AuthModal: React.FC<{ isOpen: boolean; onClose: () => void; onLogin: (user: AuthenticatedUser) => void }> = ({ isOpen, onClose, onLogin }) => {
    const { t, language } = useLocalization();
    const [isRegister, setIsRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    // Note: formData.phone is used as a generic identifier (Phone OR Username) for login
    const [formData, setFormData] = useState({ phone: '', password: '', name: '', type: AccountType.CLIENT, service_type: '', username: '' });

    const handleSubmit = async () => {
        setLoading(true);
        try {
            if (isRegister) {
                const table = formData.type === AccountType.CLIENT ? 'clients' : 'providers';
                const payload: any = { phone: formData.phone, password: formData.password, [formData.type === AccountType.CLIENT ? 'full_name' : 'name']: formData.name };
                if (formData.type === AccountType.PROVIDER) {
                    payload.service_type = formData.service_type || 'General';
                    // Allow explicit username registration, fallback to phone if empty
                    payload.username = formData.username || formData.phone; 
                    payload.is_active = true;
                }
                const { error } = await supabase.from(table).insert(payload);
                if (error) throw error;
                // Auto login after register
                const query = supabase.from(table).select('*');
                if (formData.type === AccountType.PROVIDER) {
                    query.eq('username', payload.username);
                } else {
                    query.eq('phone', formData.phone);
                }
                const { data } = await query.single();
                
                if(data) onLogin({ id: data.id, name: data.full_name || data.name, accountType: formData.type, phone: data.phone, service_type: data.service_type, profile_image_url: data.profile_image_url, username: data.username });
            } else {
                let user: any = null;
                let type: AccountType = AccountType.CLIENT;
                
                // 1. Try finding in Clients table (Login by Phone only usually)
                const { data: client } = await supabase.from('clients').select('*').eq('phone', formData.phone).eq('password', formData.password).single();
                if (client) { 
                    user = client; 
                    type = AccountType.CLIENT; 
                }
                else {
                    // 2. Try finding in Providers table (Login by Phone OR Username)
                    // We check if the input matches phone OR username column
                    const { data: provider } = await supabase
                        .from('providers')
                        .select('*')
                        .eq('password', formData.password)
                        .or(`phone.eq.${formData.phone},username.eq.${formData.phone}`)
                        .single();
                        
                    if (provider) { 
                        user = provider; 
                        type = AccountType.PROVIDER; 
                    }
                }
                
                if (user) onLogin({ id: user.id, name: user.full_name || user.name, accountType: type, phone: user.phone, service_type: user.service_type, profile_image_url: user.profile_image_url, bio: user.bio, username: user.username });
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
                    <h2 className="text-2xl font-black mb-2 text-center dark:text-white">{isRegister ? t('registerTitle') : t('loginTitle')}</h2>
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
                        
                        {/* Login Input (Phone or Username) */}
                        <input 
                            type="text" 
                            placeholder={isRegister ? t('phone') : t('phoneOrUsername')} 
                            value={formData.phone} 
                            onChange={e => setFormData({...formData, phone: e.target.value})} 
                            className="w-full p-3 bg-gray-50 rounded-xl outline-none"
                        />
                        
                        <input type="password" placeholder={t('password')} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl outline-none"/>
                        <button onClick={handleSubmit} disabled={loading} className="w-full py-3 bg-black text-white font-bold rounded-xl">{loading ? t('loading') : (isRegister ? t('registerButton') : t('loginButton'))}</button>
                        <p className="text-center text-sm text-gray-500 mt-4 cursor-pointer hover:underline" onClick={() => setIsRegister(!isRegister)}>{isRegister ? t('loginTitle') : t('registerTitle')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- PROVIDER DIRECTORY ---
const ProviderDirectory: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { t } = useLocalization();
    const [providers, setProviders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if(isOpen) {
            const fetch = async () => {
                setLoading(true);
                const { data } = await supabase.from('providers').select('name, service_type, location, profile_image_url').eq('is_active', true);
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
                        <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600">
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
            // If provider login, show provider view by default
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

            {/* REMOVED BOTTOM NAVIGATION BAR */}

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
