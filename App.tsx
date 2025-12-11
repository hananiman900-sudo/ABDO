
import React, { useState, useEffect, useRef } from 'react';
import { UserView, Language, AuthenticatedUser, AccountType, Role, Offer, UrgentAd } from './types';
import Chatbot, { ChatProfileModal } from './components/Chatbot';
import ProviderPortal from './components/QRScanner';
import AppointmentsDrawer from './components/AppointmentsDrawer';
import DatabaseSetup from './components/DatabaseSetup';
import Store from './components/Store';
import { RealEstate } from './components/RealEstate';
import { JobBoard } from './components/JobBoard';
import { AdminDashboard } from './components/AdminDashboard'; // Import New Component
import { useLocalization, LocalizationProvider } from './hooks/useLocalization';
import { supabase } from './services/supabaseClient';
import { LogIn, User, MapPin, ShoppingBag, Home, Briefcase, Settings, X, Phone, Globe, LayoutGrid, Heart, List, LogOut, CheckCircle, Edit, Share2, Grid, Bookmark, Menu, Users, Database, Instagram, Facebook, Tag, Sparkles, MessageCircle, Calendar, Bell, Eye, EyeOff, Camera, Loader2, UserPlus, UserCheck, Megaphone, Clock, ArrowLeft, Moon, Sun, AlertCircle, Zap, Scan, BrainCircuit, ShieldCheck, Gem, RefreshCw } from 'lucide-react';

// --- CUSTOM TOAST NOTIFICATION ---
const ToastNotification: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-in">
            <div className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border ${type === 'success' ? 'bg-white text-green-700 border-green-100' : 'bg-white text-red-600 border-red-100'}`}>
                {type === 'success' ? <CheckCircle size={20} className="text-green-500 fill-green-100"/> : <AlertCircle size={20} className="text-red-500 fill-red-100"/>}
                <span className="font-bold text-sm">{message}</span>
            </div>
        </div>
    );
}

// --- NEW COMPONENT: PROVIDER PENDING VIEW ---
const ProviderPendingView: React.FC<{ user: AuthenticatedUser; onLogout: () => void; onCheckStatus: () => void }> = ({ user, onLogout, onCheckStatus }) => {
    const [checking, setChecking] = useState(false);
    
    const handleCheck = async () => {
        setChecking(true);
        await onCheckStatus();
        setTimeout(() => setChecking(false), 1000);
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden" dir="rtl">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-500/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2"></div>

            <div className="relative z-10 w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl animate-slide-up flex flex-col items-center">
                
                <div className="w-24 h-24 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full mb-6 flex items-center justify-center shadow-lg border-4 border-white/20">
                    <Clock size={48} className="text-white animate-pulse"/>
                </div>
                
                <h1 className="text-2xl font-black mb-2 text-center">مرحباً، {user.name}</h1>
                <p className="text-blue-200 text-sm text-center mb-8 px-4 leading-relaxed">
                    تم إنشاء حسابك بنجاح! نحن الآن بانتظار تفعيل حسابك من طرف الإدارة.
                </p>

                <div className="w-full space-y-3 mb-8">
                    <div className="bg-black/30 p-4 rounded-2xl flex items-center gap-4 border border-white/10 hover:bg-black/40 transition-colors">
                        <div className="bg-blue-500/20 p-2.5 rounded-xl text-blue-300"><BrainCircuit size={20}/></div>
                        <div>
                            <h3 className="font-bold text-sm text-white">الذكاء الاصطناعي (AI)</h3>
                            <p className="text-[10px] text-gray-300">رد آلي ذكي على استفسارات الزبناء 24/7.</p>
                        </div>
                    </div>
                    <div className="bg-black/30 p-4 rounded-2xl flex items-center gap-4 border border-white/10 hover:bg-black/40 transition-colors">
                        <div className="bg-purple-500/20 p-2.5 rounded-xl text-purple-300"><Scan size={20}/></div>
                        <div>
                            <h3 className="font-bold text-sm text-white">نظام QR Code</h3>
                            <p className="text-[10px] text-gray-300">تنظيم المواعيد والتحقق من الحجوزات.</p>
                        </div>
                    </div>
                    <div className="bg-black/30 p-4 rounded-2xl flex items-center gap-4 border border-white/10 hover:bg-black/40 transition-colors">
                        <div className="bg-green-500/20 p-2.5 rounded-xl text-green-300"><Megaphone size={20}/></div>
                        <div>
                            <h3 className="font-bold text-sm text-white">إشهارات وتنبيهات</h3>
                            <p className="text-[10px] text-gray-300">أرسل عروضاً وتنبيهات لجميع متابعيك.</p>
                        </div>
                    </div>
                </div>

                <div className="text-center w-full bg-gradient-to-r from-white/10 to-transparent p-4 rounded-2xl border border-white/10 mb-6">
                    <p className="text-xs text-gray-300 uppercase tracking-widest mb-1">ثمن الاشتراك الشهري</p>
                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400 drop-shadow-sm">
                        50 DH
                    </div>
                </div>
                
                <p className="text-[10px] text-center text-gray-400 mb-6">سيقوم المسؤول بالاتصال بك قريباً لتفعيل الخدمات.</p>

                <div className="w-full flex gap-3">
                    <button onClick={onLogout} className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2 text-sm">
                        <LogOut size={16}/> خروج
                    </button>
                    <button onClick={handleCheck} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm">
                        {checking ? <Loader2 size={16} className="animate-spin"/> : <RefreshCw size={16}/>} تحديث الحالة
                    </button>
                </div>
            </div>
            
            <div className="mt-8 flex items-center gap-2 opacity-50">
                <ShieldCheck size={14} className="text-green-400"/>
                <p className="text-[10px] text-white">TangerConnect Business Secure</p>
            </div>
        </div>
    );
}

// --- APP SETTINGS MODAL ---
const SettingsModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { t, language, setLanguage } = useLocalization();
    const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

    const toggleDarkMode = () => {
        if (isDark) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setIsDark(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDark(true);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 dark:text-gray-300"><X/></button>
                <h2 className="text-xl font-black mb-6 flex items-center gap-2 dark:text-white"><Settings className="text-gray-400"/> {t('menu')}</h2>
                
                <div className="space-y-6">
                    {/* Language Selector */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-1"><Globe size={14}/> Language</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {['ar', 'fr', 'en'].map((lang) => (
                                <button 
                                    key={lang}
                                    onClick={() => setLanguage(lang as Language)}
                                    className={`py-2 rounded-xl text-sm font-bold border transition-all ${language === lang ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}
                                >
                                    {lang === 'ar' ? 'العربية' : (lang === 'fr' ? 'Français' : 'English')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dark Mode Toggle */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-1"><Moon size={14}/> Appearance</h3>
                        <button 
                            onClick={toggleDarkMode}
                            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl border border-gray-200 dark:border-gray-600"
                        >
                            <span className="font-bold text-gray-700 dark:text-gray-200">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
                            <div className={`w-12 h-6 rounded-full p-1 flex items-center transition-colors ${isDark ? 'bg-blue-600 justify-end' : 'bg-gray-300 justify-start'}`}>
                                <div className="w-4 h-4 rounded-full bg-white shadow-sm"></div>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="mt-8 pt-4 border-t dark:border-gray-700 text-center">
                    <p className="text-xs text-gray-400">TangerConnect v2.1</p>
                </div>
            </div>
        </div>
    )
}

// --- AUTH MODAL (SEPARATED TABS) ---
const AuthModal: React.FC<{ isOpen: boolean; onClose: () => void; onLogin: (user: AuthenticatedUser) => void; notify: (msg: string, type: 'success'|'error') => void }> = ({ isOpen, onClose, onLogin, notify }) => {
    const { t, language } = useLocalization();
    const [isRegister, setIsRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    // Default to CLIENT, user must explicitly switch to PROVIDER
    const [accountType, setAccountType] = useState<AccountType>(AccountType.CLIENT);
    
    const [formData, setFormData] = useState({ phone: '', password: '', name: '', service_type: '', username: '', location: '' });

    // Reset form when switching types
    useEffect(() => {
        setFormData({ phone: '', password: '', name: '', service_type: '', username: '', location: '' });
        setIsRegister(false); 
    }, [accountType]);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Determine table based on explicitly selected tab
            const table = accountType === AccountType.CLIENT ? 'clients' : 'providers';

            if (isRegister) {
                // REGISTRATION LOGIC
                const payload: any = { phone: formData.phone, password: formData.password, [accountType === AccountType.CLIENT ? 'full_name' : 'name']: formData.name };
                
                // Logic to enforce strict active status
                const isProvider = accountType === AccountType.PROVIDER;
                const isAdmin = formData.phone === '0617774846';
                
                // Providers are FALSE unless admin, Clients are TRUE
                let forcedActiveStatus = true; 
                if (isProvider) {
                    forcedActiveStatus = isAdmin ? true : false;
                }

                if (isProvider) {
                    payload.service_type = formData.service_type || 'General';
                    // If no username provided, use phone as username fallback
                    payload.username = formData.username || formData.phone; 
                    payload.location = formData.location || 'Tangier'; // Default location to fix NOT NULL constraint
                    
                    // CRITICAL: Force NEW providers to be INACTIVE (explicitly set false)
                    payload.is_active = forcedActiveStatus; 
                }
                
                const { error, data: insertedData } = await supabase.from(table).insert(payload).select().single();
                if (error) throw error;
                
                // Login immediately
                const newUser: AuthenticatedUser = { 
                    id: insertedData?.id || Date.now(), 
                    name: formData.name, 
                    accountType: accountType, 
                    phone: formData.phone, 
                    service_type: payload.service_type, 
                    username: payload.username,
                    isActive: forcedActiveStatus // Use the explicitly calculated boolean
                };

                onLogin(newUser);

                if (isProvider && !forcedActiveStatus) {
                    // Do NOT show success toast. 
                    // The app will immediately render ProviderPendingView.
                } else {
                    notify(t('success'), 'success');
                }

            } else {
                // LOGIN LOGIC (Strictly checks the selected table)
                let query = supabase.from(table).select('*');
                
                if (accountType === AccountType.PROVIDER) {
                    // Providers can login with phone OR username
                    query = query.or(`phone.eq.${formData.phone},username.eq.${formData.phone}`);
                } else {
                    // Clients login with phone
                    query = query.eq('phone', formData.phone);
                }

                const { data: user, error } = await query.single();

                if (error || !user) {
                    notify(t('errorMessage') + " (User not found)", 'error');
                    setLoading(false);
                    return;
                }

                if (user.password !== formData.password) {
                     notify(t('passwordError'), 'error'); 
                     setLoading(false); 
                     return;
                }

                // Login Successful
                notify(t('success'), 'success');
                onLogin({ 
                    id: user.id, 
                    name: user.full_name || user.name, 
                    accountType: accountType, 
                    phone: user.phone, 
                    service_type: user.service_type, 
                    profile_image_url: user.profile_image_url, 
                    bio: user.bio, 
                    username: user.username, 
                    social_links: user.social_links, 
                    followers_count: user.followers_count, 
                    visits_count: user.visits_count,
                    isActive: user.is_active, // Important: pass the DB value
                    subscriptionEndDate: user.subscription_end_date
                });
            }
        } catch (e: any) { 
            notify(e.message || t('errorMessage'), 'error'); 
        } finally { 
            setLoading(false); 
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"><X/></button>
                
                {/* TOP TABS - CLEAR SEPARATION */}
                <div className="flex border-b">
                    <button 
                        onClick={() => setAccountType(AccountType.CLIENT)}
                        className={`flex-1 py-4 text-center font-bold text-sm transition-colors flex flex-col items-center gap-2 ${accountType === AccountType.CLIENT ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-gray-50 text-gray-500'}`}
                    >
                        <User size={20} />
                        {t('client')} (Zobana2)
                    </button>
                    <button 
                        onClick={() => setAccountType(AccountType.PROVIDER)}
                        className={`flex-1 py-4 text-center font-bold text-sm transition-colors flex flex-col items-center gap-2 ${accountType === AccountType.PROVIDER ? 'bg-white text-purple-600 border-b-2 border-purple-600' : 'bg-gray-50 text-gray-500'}`}
                    >
                        <Briefcase size={20} />
                        {t('provider')} (Mihani)
                    </button>
                </div>

                <div className="p-8 overflow-y-auto">
                    <h2 className="text-xl font-black mb-6 text-center dark:text-white flex items-center justify-center gap-2">
                         {isRegister ? t('registerTitle') : t('loginTitle')}
                         <span className={`text-xs px-2 py-1 rounded-full ${accountType === AccountType.CLIENT ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                             {accountType === AccountType.CLIENT ? t('client') : t('provider')}
                         </span>
                    </h2>

                    <div className="space-y-4">
                        {isRegister && (
                            <>
                                <input placeholder={t('fullName')} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl outline-none border focus:border-black transition-colors"/>
                                {accountType === AccountType.PROVIDER && (
                                    <>
                                        <input placeholder={t('username')} value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl outline-none border focus:border-black transition-colors"/>
                                        <input placeholder="Service Type (e.g. Doctor, Plumber)" value={formData.service_type} onChange={e => setFormData({...formData, service_type: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl outline-none border focus:border-black transition-colors"/>
                                        <input placeholder="Location (e.g. City Center)" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl outline-none border focus:border-black transition-colors"/>
                                    </>
                                )}
                            </>
                        )}
                        
                        <input 
                            type="text" 
                            placeholder={accountType === AccountType.PROVIDER ? t('phoneOrUsername') : t('phone')} 
                            value={formData.phone} 
                            onChange={e => setFormData({...formData, phone: e.target.value})} 
                            className="w-full p-3 bg-gray-50 rounded-xl outline-none border focus:border-black transition-colors"
                        />
                        
                        {/* PASSWORD INPUT */}
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                placeholder={t('password')} 
                                value={formData.password} 
                                onChange={e => setFormData({...formData, password: e.target.value})} 
                                className="w-full p-3 bg-gray-50 rounded-xl outline-none pr-10 border focus:border-black transition-colors" 
                                style={{ direction: 'ltr' }}
                            />
                            <button 
                                onClick={() => setShowPassword(!showPassword)} 
                                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 z-10"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                            </button>
                        </div>

                        <button 
                            onClick={handleSubmit} 
                            disabled={loading} 
                            className={`w-full py-3 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform flex justify-center items-center gap-2 ${accountType === AccountType.CLIENT ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                        >
                            {loading ? <Loader2 className="animate-spin"/> : (isRegister ? t('registerButton') : t('loginButton'))}
                        </button>
                        
                        <div className="relative py-2">
                             <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                             <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Or</span></div>
                        </div>

                        <button 
                            onClick={() => setIsRegister(!isRegister)}
                            className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            {isRegister ? t('loginTitle') : t('registerTitle')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- CLIENT NOTIFICATIONS DRAWER ---
const ClientNotificationsModal: React.FC<{ isOpen: boolean; onClose: () => void; userId: number }> = ({ isOpen, onClose, userId }) => {
    const { t } = useLocalization();
    const [ads, setAds] = useState<UrgentAd[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if(isOpen) fetchAds();
    }, [isOpen]);

    const fetchAds = async () => {
        setLoading(true);
        // 1. Get followed providers
        const { data: follows } = await supabase.from('follows').select('provider_id').eq('client_id', userId);
        
        if (follows && follows.length > 0) {
            const providerIds = follows.map(f => f.provider_id);
            // 2. Fetch Active Ads from these providers
            const { data } = await supabase
                .from('urgent_ads')
                .select('*, providers(name, profile_image_url)')
                .in('provider_id', providerIds)
                .eq('is_active', true)
                .order('created_at', { ascending: false });
            
            setAds(data as any || []);
        } else {
            setAds([]);
        }
        setLoading(false);
    };

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[70] flex justify-end animate-fade-in">
            <div className="w-full max-w-sm bg-white h-full animate-slide-up flex flex-col shadow-2xl">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg flex items-center gap-2"><Bell className="text-red-500"/> {t('notifications')}</h3>
                    <button onClick={onClose}><X/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                    {loading ? <div className="flex justify-center p-10"><Loader2 className="animate-spin"/></div> : (
                        ads.length === 0 ? <p className="text-center text-gray-400 py-10">{t('noNotifications')}</p> : (
                            ads.map(ad => (
                                <div key={ad.id} className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-red-500">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                                            <img src={(ad as any).providers?.profile_image_url || `https://ui-avatars.com/api/?name=${(ad as any).providers?.name}`} className="w-full h-full object-cover"/>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm">{(ad as any).providers?.name}</h4>
                                            <p className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10}/> {new Date(ad.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-800 font-medium">{ad.message}</p>
                                </div>
                            ))
                        )
                    )}
                </div>
            </div>
        </div>
    )
}

// --- PROVIDER DIRECTORY MODAL ---
const ProviderDirectory: React.FC<{ isOpen: boolean; onClose: () => void; currentUser: AuthenticatedUser | null }> = ({ isOpen, onClose, currentUser }) => {
    const { t } = useLocalization();
    const [providers, setProviders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<any | null>(null);

    useEffect(() => {
        if(isOpen) fetchProviders();
    }, [isOpen]);

    const fetchProviders = async () => {
        setLoading(true);
        const { data } = await supabase.from('providers').select('*').eq('is_active', true);
        setProviders(data || []);
        setLoading(false);
    }

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-0 md:p-4">
            <div className="bg-gray-100 dark:bg-gray-900 w-full h-full md:h-[90vh] md:max-w-4xl md:rounded-3xl flex flex-col overflow-hidden animate-slide-up relative">
                 <div className="bg-white dark:bg-gray-800 p-4 flex justify-between items-center shadow-sm border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold dark:text-white flex items-center gap-2 text-blue-600"><Users/> {t('providerDirectory')}</h2>
                    <button onClick={onClose}><X className="dark:text-white"/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    {loading ? <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500"/></div> : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {providers.map(p => (
                                <div key={p.id} onClick={() => setSelectedProvider(p)} className="bg-white p-4 rounded-2xl shadow-sm border hover:shadow-md transition-all cursor-pointer flex flex-col items-center text-center h-full">
                                    <div className="w-16 h-16 rounded-full bg-gray-200 mb-3 overflow-hidden border shrink-0">
                                        <img src={p.profile_image_url || `https://ui-avatars.com/api/?name=${p.name}`} className="w-full h-full object-cover"/>
                                    </div>
                                    <h3 className="font-bold text-sm truncate w-full">{p.name}</h3>
                                    <span className="text-xs text-blue-500 font-medium mb-1 truncate w-full block">{p.service_type}</span>
                                    
                                    {/* Description / Bio Truncated to keep height uniform */}
                                    <p className="text-[10px] text-gray-400 line-clamp-2 mb-2 flex-1 w-full text-center">
                                        {p.bio || "No bio available."}
                                    </p>

                                    <button className="mt-auto w-full py-1.5 bg-gray-100 rounded-lg text-xs font-bold text-gray-600 hover:bg-black hover:text-white transition-colors">{t('viewQRCode')}</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {selectedProvider && (
                    <ChatProfileModal provider={selectedProvider} onClose={() => setSelectedProvider(null)} currentUser={currentUser} />
                )}
            </div>
        </div>
    )
}

// --- SERVICES HUB ---
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

// --- CLIENT EDIT PROFILE MODAL ---
const EditClientProfileModal: React.FC<{ user: AuthenticatedUser; onClose: () => void; onUpdateUser: (updates: Partial<AuthenticatedUser>) => void; notify: (m: string, t: any) => void }> = ({ user, onClose, onUpdateUser, notify }) => {
    const { t } = useLocalization();
    const [name, setName] = useState(user.name);
    const [bio, setBio] = useState(user.bio || '');
    const [image, setImage] = useState(user.profile_image_url || '');
    const [loading, setLoading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;
        setLoading(true);
        try {
             const fileName = `client_${user.id}_${Date.now()}`;
             await supabase.storage.from('profiles').upload(fileName, file);
             const { data } = supabase.storage.from('profiles').getPublicUrl(fileName);
             setImage(data.publicUrl);
        } catch(e) {} finally { setLoading(false); }
    }

    const handleSave = async () => {
        setLoading(true);
        // Table differs based on account type
        const table = user.accountType === AccountType.PROVIDER ? 'providers' : 'clients';
        const updates: any = { bio, profile_image_url: image };
        if(user.accountType === AccountType.CLIENT) updates.full_name = name;
        else updates.name = name;
        
        const { error } = await supabase.from(table).update(updates).eq('id', user.id);
        
        if(!error) {
            onUpdateUser({ name, bio, profile_image_url: image });
            notify(t('success'), 'success');
            onClose();
        } else notify(t('errorMessage'), 'error');
        setLoading(false);
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
             <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
                 <h2 className="font-bold text-lg">{t('editProfile')}</h2>
                 <div className="flex justify-center">
                    <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden relative cursor-pointer" onClick={() => fileRef.current?.click()}>
                        {image ? <img src={image} className="w-full h-full object-cover"/> : <Camera className="absolute inset-0 m-auto text-gray-400"/>}
                        {loading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="animate-spin text-white"/></div>}
                    </div>
                    <input type="file" ref={fileRef} hidden onChange={handleUpload}/>
                 </div>
                 <input value={name} onChange={e => setName(e.target.value)} placeholder={t('fullName')} className="w-full p-2 border rounded-lg"/>
                 <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder={t('bioLabel')} className="w-full p-2 border rounded-lg h-24"/>
                 <div className="flex gap-2">
                     <button onClick={onClose} className="flex-1 py-2 bg-gray-100 rounded-lg">{t('cancel')}</button>
                     <button onClick={handleSave} className="flex-1 py-2 bg-black text-white rounded-lg font-bold">{t('save')}</button>
                 </div>
             </div>
        </div>
    )
}

// --- SUGGESTED PROVIDERS CAROUSEL ---
const SuggestedProviders: React.FC<{ currentUser: AuthenticatedUser; onOpenProfile: (provider: any) => void }> = ({ currentUser, onOpenProfile }) => {
    const { t } = useLocalization();
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [followedState, setFollowedState] = useState<Record<number, boolean>>({});

    useEffect(() => {
        const fetch = async () => {
            // 1. Get IDs followed by user
            const { data: follows } = await supabase.from('follows').select('provider_id').eq('client_id', currentUser.id);
            const followedIds = follows?.map(f => f.provider_id) || [];
            
            // 2. Fetch providers NOT in that list (limit 10)
            let query = supabase.from('providers').select('*').eq('is_active', true).limit(10);
            if(followedIds.length > 0) {
                // Not ideal for huge datasets but works for < 1000 items logic with .not.in
                query = query.not('id', 'in', `(${followedIds.join(',')})`);
            }
            const { data } = await query;
            setSuggestions(data || []);
        }
        fetch();
    }, [currentUser]);

    const handleFollowClick = async (providerId: number) => {
        const isFollowed = followedState[providerId];
        setFollowedState(prev => ({ ...prev, [providerId]: !isFollowed }));
        
        if (isFollowed) {
             // Unfollow
             await supabase.from('follows').delete().eq('client_id', currentUser.id).eq('provider_id', providerId);
        } else {
             // Follow
             await supabase.from('follows').insert({ client_id: currentUser.id, provider_id: providerId });
        }
    };

    if(suggestions.length === 0) return null;

    return (
        <div className="mb-6">
            <h3 className="font-bold text-gray-800 text-sm mb-3 px-1">{t('suggestedProviders')}</h3>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1">
                {suggestions.map(p => (
                    <div key={p.id} className="w-28 flex flex-col items-center bg-white p-3 rounded-xl border shadow-sm shrink-0">
                        <div className="w-14 h-14 rounded-full bg-gray-200 mb-2 overflow-hidden border cursor-pointer" onClick={() => onOpenProfile(p)}>
                            <img src={p.profile_image_url || `https://ui-avatars.com/api/?name=${p.name}`} className="w-full h-full object-cover"/>
                        </div>
                        <h4 className="font-bold text-xs truncate w-full text-center">{p.name}</h4>
                        <p className="text-[10px] text-gray-500 truncate w-full text-center mb-2">{p.service_type}</p>
                        <button 
                            onClick={() => handleFollowClick(p.id)}
                            className={`w-full py-1 text-[10px] font-bold rounded-full transition-colors ${followedState[p.id] ? 'bg-gray-100 text-black border' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                        >
                            {followedState[p.id] ? t('unfollow') : t('follow')}
                        </button>
                    </div>
                ))}
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
    onUpdateUser: (u: Partial<AuthenticatedUser>) => void;
    notify: (msg: string, type: 'success' | 'error') => void;
    onOpenSettings: () => void;
}> = ({ user, onLogin, onLogout, isAdmin, onNav, onUpdateUser, notify, onOpenSettings }) => {
    const { t } = useLocalization();
    const [showEdit, setShowEdit] = useState(false);
    const [viewingProvider, setViewingProvider] = useState<any | null>(null);

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
            {/* User Info Header */}
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
                    <button onClick={() => setShowEdit(true)} className="flex-1 py-2 bg-gray-100 rounded-lg font-bold text-xs">{t('editProfile')}</button>
                    <button onClick={onLogout} className="flex-1 py-2 bg-red-50 text-red-500 rounded-lg font-bold text-xs flex items-center justify-center gap-1"><LogOut size={14}/> {t('logout')}</button>
                </div>
            </div>

            <div className="p-4">
                
                {/* SUGGESTED PROVIDERS */}
                {user.accountType === 'CLIENT' && (
                    <SuggestedProviders currentUser={user} onOpenProfile={setViewingProvider}/>
                )}

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
                    
                    {/* APP SETTINGS - LINKED TO MODAL */}
                    <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={onOpenSettings}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 text-gray-600 rounded-lg"><Settings size={18}/></div>
                            <span className="font-bold">App Settings</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODALS */}
            {showEdit && <EditClientProfileModal user={user} onClose={() => setShowEdit(false)} onUpdateUser={onUpdateUser} notify={notify}/>}
            {viewingProvider && <ChatProfileModal provider={viewingProvider} onClose={() => setViewingProvider(null)} currentUser={user} />}
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
    const [showClientNotifs, setShowClientNotifs] = useState(false);

    // Modals
    const [showAuth, setShowAuth] = useState(false);
    const [showRealEstate, setShowRealEstate] = useState(false);
    const [showJobBoard, setShowJobBoard] = useState(false);
    const [showAppointments, setShowAppointments] = useState(false);
    const [showDB, setShowDB] = useState(false);
    const [showDirectory, setShowDirectory] = useState(false); 
    const [showSettings, setShowSettings] = useState(false);
    
    // New Admin Dashboard State
    const [showAdminDashboard, setShowAdminDashboard] = useState(false);

    // Custom Toast State
    const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
    };

    // DARK MODE INIT
    useEffect(() => {
        const theme = localStorage.getItem('theme');
        if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

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

    // REAL-TIME NOTIFICATION SUBSCRIPTION
    useEffect(() => {
        if (!user) return;
        
        // Listen for new urgent ads
        const subscription = supabase
            .channel('public:urgent_ads')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'urgent_ads' }, payload => {
                // When a new ad is inserted, we re-check if we follow this provider
                fetchNotifications(user.id);
            })
            .subscribe();

        return () => { supabase.removeChannel(subscription); }
    }, [user]);

    const fetchNotifications = async (userId: number) => {
        // Fetch urgent ads from followed providers
        const { data: follows } = await supabase.from('follows').select('provider_id').eq('client_id', userId);
        if(follows && follows.length > 0) {
            const providerIds = follows.map(f => f.provider_id);
            // Count active ads from providers I follow
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

    const handleCheckStatus = async () => {
        if (!user) return;
        
        // STRICT CHECK: Fetch from Database to get current state
        const { data, error } = await supabase
            .from('providers')
            .select('is_active, subscription_end_date')
            .eq('id', user.id)
            .single();

        if (error || !data) {
             showToast("خطأ في الاتصال. المرجو المحاولة لاحقاً.", "error");
             return;
        }

        if (data.is_active === true) {
            // Status is confirmed ACTIVE in Database
            handleUpdateUser({ 
                isActive: true,
                subscriptionEndDate: data.subscription_end_date
            });
            showToast("تم تفعيل حسابك بنجاح! مرحباً بك.", "success");
        } else {
            // Status is NOT Active
            showToast("حسابك لا يزال قيد المراجعة. المرجو الانتظار.", "error");
            // Ensure local state remains false
            if (user.isActive !== false) {
                handleUpdateUser({ isActive: false });
            }
        }
    }

    const handleLogout = () => { setUser(null); localStorage.removeItem('tanger_user'); setUserView(UserView.CLIENT); };
    const toggleProviderView = () => setUserView(prev => prev === UserView.PROVIDER ? UserView.CLIENT : UserView.PROVIDER);

    // CRITICAL: Handle Provider Navigation (from Portal to Services/DB/Admin)
    const handleProviderNav = (target: string) => {
        if (target === 'ADMIN_DASHBOARD') {
            setShowAdminDashboard(true);
            return;
        }

        // Switch to client view
        setUserView(UserView.CLIENT);
        // Switch to Services tab
        setActiveTab('SERVICES');
        // Open DB Modal if requested
        if (target === 'DB') {
            setShowDB(true);
        }
    };

    const handleNav = (target: string) => {
        switch(target) {
            case 'STORE': setActiveTab('STORE'); break; 
            case 'REAL_ESTATE': setShowRealEstate(true); break;
            case 'JOBS': setShowJobBoard(true); break;
            case 'APPOINTMENTS': setShowAppointments(true); break;
            case 'DB': setShowDB(true); break;
            case 'DIRECTORY': setShowDirectory(true); break; // Triggers the modal
            case 'ROOM': toggleProviderView(); break;
        }
    }
    
    // Check for admin rights
    const isAdmin = user?.phone === '0617774846';

    if(showSplash) return <SplashScreen />;

    // --- PROVIDER VIEW LOGIC (UPDATED WITH STRICT BLOCK) ---
    // If user is a PROVIDER and is INACTIVE, they must see the Pending View ONLY.
    // They cannot access anything else (Client View, etc.)
    if (user?.accountType === AccountType.PROVIDER && !user.isActive) {
        return <ProviderPendingView user={user} onLogout={handleLogout} onCheckStatus={handleCheckStatus} />;
    }

    // Normal Provider View Logic (If Active)
    if (user?.accountType === AccountType.PROVIDER && userView === UserView.PROVIDER) {
        return (
            <>
                <ProviderPortal provider={user} onLogout={toggleProviderView} onUpdateUser={handleUpdateUser} onNavTo={handleProviderNav} />
                {isAdmin && <AdminDashboard isOpen={showAdminDashboard} onClose={() => setShowAdminDashboard(false)} />}
            </>
        );
    }

    return (
        <div className={`flex flex-col h-screen bg-gray-50 dark:bg-gray-900 ${language === 'ar' ? 'font-arabic' : 'font-sans'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            
            {/* WRAPPER FOR LARGE SCREENS - RESPONSIVENESS */}
            <div className="mx-auto w-full max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl h-full flex flex-col bg-white dark:bg-black shadow-2xl overflow-hidden relative border-x border-gray-100 dark:border-gray-800">

                {/* NEW CLEAN HEADER - CONDITIONAL RENDERING */}
                {/* HIDE HEADER IF IN CHAT (Chatbot has its own header) */}
                {activeTab !== 'CHAT' && (
                    <div className="bg-white dark:bg-gray-800 px-4 py-3 flex justify-between items-center border-b dark:border-gray-700 shadow-sm sticky top-0 z-30">
                        <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                                 <Globe size={16}/>
                             </div>
                             <h1 className="font-bold text-lg dark:text-white">Tanger IA</h1>
                        </div>
                        <div className="flex items-center gap-3">
                             {/* Notifications Bell */}
                             {user && (
                                <button onClick={() => setShowClientNotifs(true)} className="relative p-2 text-gray-500 dark:text-gray-300">
                                    <Bell size={20} />
                                    {unreadNotifs > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>}
                                </button>
                             )}
                             
                             <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-300 transition-colors">
                                 <Settings size={20}/>
                             </button>

                             {user ? (
                                 <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden cursor-pointer border border-gray-300 dark:border-gray-600" onClick={() => setActiveTab('PROFILE')}>
                                     <img src={user.profile_image_url || `https://ui-avatars.com/api/?name=${user.name}`} className="w-full h-full object-cover"/>
                                 </div>
                             ) : (
                                 <button onClick={() => setShowAuth(true)} className="px-4 py-1.5 bg-black dark:bg-white dark:text-black text-white rounded-full font-bold text-xs shadow-md active:scale-95 transition-transform flex items-center gap-1">
                                     <LogIn size={12}/> {t('loginButton')}
                                 </button>
                             )}
                        </div>
                    </div>
                )}

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-hidden relative">
                    {activeTab === 'CHAT' && <Chatbot currentUser={user} onOpenAuth={() => setShowAuth(true)} onDiscover={() => setActiveTab('SERVICES')} onToggleNav={(hidden) => setHideBottomNav(hidden)} onOpenNotifications={() => setShowClientNotifs(true)} />}
                    {activeTab === 'STORE' && <Store isOpen={true} onClose={() => setActiveTab('CHAT')} currentUser={user} onOpenAuth={() => setShowAuth(true)} onGoToProfile={() => setActiveTab('PROFILE')} notify={showToast} />}
                    {activeTab === 'SERVICES' && <ServicesHub onNav={handleNav} isAdmin={isAdmin}/>}
                    {activeTab === 'PROFILE' && <ProfileTab user={user} onLogin={() => setShowAuth(true)} onLogout={handleLogout} isAdmin={isAdmin} onNav={handleNav} onUpdateUser={handleUpdateUser} notify={showToast} onOpenSettings={() => setShowSettings(true)}/>}
                </div>

                {/* BOTTOM NAVIGATION (Only show if not hidden by chat view) */}
                {!hideBottomNav && (
                    <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 flex justify-around items-center pb-safe pt-2 px-2 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.05)] z-40">
                        <button onClick={() => setActiveTab('CHAT')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'CHAT' ? 'text-blue-600 dark:text-blue-400 font-bold scale-105' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}>
                            <MessageCircle size={24} className={activeTab === 'CHAT' ? 'fill-blue-100 dark:fill-blue-900' : ''}/>
                            <span className="text-[10px]">{t('navChat')}</span>
                        </button>
                        <button onClick={() => setActiveTab('STORE')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'STORE' ? 'text-orange-600 dark:text-orange-400 font-bold scale-105' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}>
                            <ShoppingBag size={24} className={activeTab === 'STORE' ? 'fill-orange-100 dark:fill-orange-900' : ''}/>
                            <span className="text-[10px]">{t('navStore')}</span>
                        </button>
                        <button onClick={() => setActiveTab('SERVICES')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'SERVICES' ? 'text-purple-600 dark:text-purple-400 font-bold scale-105' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}>
                            <LayoutGrid size={24} className={activeTab === 'SERVICES' ? 'fill-purple-100 dark:fill-purple-900' : ''}/>
                            <span className="text-[10px]">{t('navExplore')}</span>
                        </button>
                        <button onClick={() => setActiveTab('PROFILE')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'PROFILE' ? 'text-green-600 dark:text-green-400 font-bold scale-105' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}>
                            <User size={24} className={activeTab === 'PROFILE' ? 'fill-green-100 dark:fill-green-900' : ''}/>
                            <span className="text-[10px]">{t('navProfile')}</span>
                        </button>
                    </div>
                )}
            </div>

            {/* GLOBAL MODALS */}
            <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} onLogin={handleLogin} notify={showToast} />
            <RealEstate isOpen={showRealEstate} onClose={() => setShowRealEstate(false)} currentUser={user}/>
            <JobBoard isOpen={showJobBoard} onClose={() => setShowJobBoard(false)} currentUser={user} notify={showToast}/>
            <AppointmentsDrawer isOpen={showAppointments} onClose={() => setShowAppointments(false)} user={user}/>
            <DatabaseSetup isOpen={showDB} onClose={() => setShowDB(false)}/>
            <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)}/>
            
            {/* DIRECTORY & NOTIFICATIONS */}
            <ProviderDirectory isOpen={showDirectory} onClose={() => setShowDirectory(false)} currentUser={user} />
            {user && <ClientNotificationsModal isOpen={showClientNotifs} onClose={() => setShowClientNotifs(false)} userId={user.id} />}

            {/* GLOBAL TOAST */}
            {toast && <ToastNotification message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}

export default function App() {
  return (
    <LocalizationProvider>
      <AppContent />
    </LocalizationProvider>
  );
}
