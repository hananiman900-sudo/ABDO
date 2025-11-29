
import React, { useState, useEffect, useRef } from 'react';
import { UserView, Language, AuthenticatedUser, AccountType } from './types';
import Chatbot from './components/Chatbot';
import ProviderPortal from './components/QRScanner';
import AppointmentsDrawer from './components/AppointmentsDrawer';
import DatabaseSetup from './components/DatabaseSetup';
import Store from './components/Store';
import { RealEstate } from './components/RealEstate';
import { JobBoard } from './components/JobBoard';
import { LocalizationProvider, useLocalization, translations } from './hooks/useLocalization';
import { supabase } from './services/supabaseClient';
import QRCodeDisplay from './components/QRCodeDisplay';
import { Globe, User as UserIcon, CheckSquare, Sun, Moon, LogIn, LogOut, X, CalendarDays, Database, AlertTriangle, CheckCircle2, Menu, Users, Bell, Phone, MapPin, Search, Heart, Briefcase, Star, MessageCircle, ShoppingBag, Eye, EyeOff, Megaphone, Headset, Instagram, Facebook, Link as LinkIcon, ArrowLeft, UserCheck, Home, UserPlus, FileText, ListPlus, UserMinus, RefreshCw, Key, Map, Clock, ChevronRight, Plus } from 'lucide-react';

const ScrollFixStyle = () => (
    <style>{`
        * { -webkit-tap-highlight-color: transparent; }
        .no-select { user-select: none; -webkit-user-select: none; }
        .scroll-container { touch-action: manipulation; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    `}</style>
);

const InputField = ({ icon: Icon, ...props }: any) => (
  <div className="relative">
    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 rtl:left-0 rtl:right-auto rtl:pl-3 rtl:pr-0">
      <Icon size={20} />
    </div>
    <input className="w-full pr-10 pl-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white rtl:pr-10 rtl:pl-4 text-right" dir="rtl" {...props} />
  </div>
);

const PasswordField = ({ icon: Icon, ...props }: any) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 rtl:left-0 rtl:right-auto rtl:pl-3 rtl:pr-0">
            <Icon size={20} />
        </div>
        <input 
            type={show ? "text" : "password"} 
            className="w-full pr-10 pl-10 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white rtl:pr-10 rtl:pl-10 text-right" 
            dir="rtl" 
            {...props} 
        />
        <button type="button" onClick={() => setShow(!show)} className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 hover:text-primary rtl:right-0 rtl:left-auto rtl:pr-3 rtl:pl-0">
            {show ? <EyeOff size={18}/> : <Eye size={18}/>}
        </button>
    </div>
  )
}

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
    useEffect(() => { setTimeout(onFinish, 2000); }, []);
    return (
        <div className="fixed inset-0 bg-surface dark:bg-dark z-[100] flex flex-col items-center justify-center animate-fade-in">
            <div className="relative mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl rotate-3 flex items-center justify-center shadow-glow">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                </div>
            </div>
            <h1 className="text-3xl font-bold text-dark dark:text-light tracking-tight">Tanger<span className="text-primary">Connect</span></h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">AI Powered City Assistant</p>
        </div>
    );
};

// --- AUTH DRAWER ---
const AuthDrawer = ({ isOpen, onClose, onAuthSuccess, onDatabaseError }: any) => {
    const { t } = useLocalization();
    const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
    const [accountType, setAccountType] = useState<'CLIENT' | 'PROVIDER'>('CLIENT');
    
    // Form States
    const [formData, setFormData] = useState({ 
        phone: '', 
        username: '', // Explicit Username for Providers
        password: '', 
        fullName: '',
        // Provider Specific
        serviceName: '',
        serviceType: '',
        location: ''
    });
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset when opened
    useEffect(() => {
        if(isOpen) {
            setError(null);
            setMode('LOGIN');
            setAccountType('CLIENT');
            setFormData({ phone: '', username: '', password: '', fullName: '', serviceName: '', serviceType: '', location: '' });
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (mode === 'REGISTER') {
                 if (accountType === 'CLIENT') {
                     // CLIENT REGISTRATION
                     const { data, error } = await supabase.from('clients').insert([{ 
                         full_name: formData.fullName, 
                         phone: formData.phone, 
                         password: formData.password 
                     }]).select().single();
                     
                     if (error) throw error;
                     
                     localStorage.setItem('tangerconnect_user_id', data.id);
                     localStorage.setItem('tangerconnect_user_type', 'CLIENT');
                     onAuthSuccess({ id: data.id, name: data.full_name, accountType: AccountType.CLIENT, phone: data.phone });
                 } else {
                     // PROVIDER REGISTRATION
                     const { data, error } = await supabase.from('providers').insert([{ 
                         name: formData.serviceName, 
                         username: formData.username, // Explicit Username
                         phone: formData.phone,
                         password: formData.password,
                         service_type: formData.serviceType,
                         location: formData.location,
                         is_active: false // Requires Admin Approval/Payment
                     }]).select().single();

                     if (error) throw error;

                     alert("تم تسجيل الطلب بنجاح! حسابك في انتظار التفعيل.");
                     onAuthSuccess({ 
                         id: data.id, 
                         name: data.name, 
                         accountType: AccountType.PROVIDER, 
                         phone: data.phone,
                         isActive: false, 
                         subscriptionEndDate: null 
                    });
                 }
            } else {
                 // LOGIN LOGIC
                 if (accountType === 'CLIENT') {
                     // CLIENT LOGIN (Phone + Pass)
                     let { data: client, error } = await supabase.from('clients').select('*').eq('phone', formData.phone).eq('password', formData.password).maybeSingle();
                     
                     if (error || !client) throw new Error(t('loginFailed'));

                     localStorage.setItem('tangerconnect_user_id', client.id);
                     localStorage.setItem('tangerconnect_user_type', 'CLIENT');
                     onAuthSuccess({ id: client.id, name: client.full_name, accountType: AccountType.CLIENT, phone: client.phone });

                 } else {
                     // PROVIDER LOGIN (Username + Pass)
                     let { data: provider, error } = await supabase.from('providers').select('*').eq('username', formData.username).eq('password', formData.password).maybeSingle();
                     
                     if (error || !provider) throw new Error(t('providerLoginFailed'));

                     localStorage.setItem('tangerconnect_user_id', provider.id);
                     localStorage.setItem('tangerconnect_user_type', 'PROVIDER');
                     onAuthSuccess({ 
                         id: provider.id, 
                         name: provider.name, 
                         accountType: AccountType.PROVIDER, 
                         phone: provider.phone, 
                         isActive: provider.is_active, 
                         subscriptionEndDate: provider.subscription_end_date, 
                         bio: provider.bio, 
                         profile_image_url: provider.profile_image_url, 
                         social_links: provider.social_links 
                    });
                 }
            }
            onClose();
        } catch (err: any) {
            console.error(err);
            let msg = err.message || "Auth Failed";
            if(err.message?.includes('violates unique constraint')) msg = "المستخدم موجود بالفعل (Username or Phone taken)";
            setError(msg);
            if(err.code === '42P01') onDatabaseError();
        } finally {
            setIsLoading(false);
        }
    };

    if(!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
             <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl animate-slide-up overflow-hidden max-h-[90vh] overflow-y-auto">
                 
                 <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-10">
                     <X size={24}/>
                 </button>

                 <div className="text-center mb-6">
                     <h2 className="text-2xl font-bold dark:text-white">{mode === 'LOGIN' ? t('loginTitle') : t('registerTitle')}</h2>
                     <p className="text-sm text-gray-500 mt-1">
                        {mode === 'LOGIN' ? 'Welcome back to TangerConnect' : 'Join our community today'}
                     </p>
                 </div>
                 
                 {/* Mode Tabs */}
                 <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1 mb-4">
                     <button onClick={() => setMode('LOGIN')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'LOGIN' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary' : 'text-gray-500'}`}>
                         {t('loginButton')}
                     </button>
                     <button onClick={() => setMode('REGISTER')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'REGISTER' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary' : 'text-gray-500'}`}>
                         {t('registerButton')}
                     </button>
                 </div>

                 {/* Account Type Selection (Visible for BOTH Login & Register) */}
                 <div className="mb-6">
                     <p className="text-xs text-center text-gray-400 mb-2 font-bold uppercase">{t('accountType')}</p>
                     <div className="grid grid-cols-2 gap-3">
                         <button 
                            type="button"
                            onClick={() => setAccountType('CLIENT')}
                            className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${accountType === 'CLIENT' ? 'border-primary bg-blue-50 text-primary ring-2 ring-primary/20' : 'border-gray-200 dark:border-gray-600 text-gray-500'}`}
                         >
                             <UserIcon size={24}/>
                             <span className="font-bold">{t('client')}</span>
                         </button>
                         <button 
                            type="button"
                            onClick={() => setAccountType('PROVIDER')}
                            className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${accountType === 'PROVIDER' ? 'border-primary bg-blue-50 text-primary ring-2 ring-primary/20' : 'border-gray-200 dark:border-gray-600 text-gray-500'}`}
                         >
                             <Briefcase size={24}/>
                             <span className="font-bold">{t('provider')}</span>
                         </button>
                     </div>
                 </div>

                 {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm text-right flex items-center gap-2"><AlertTriangle size={16}/> {error}</div>}
                 
                 <form onSubmit={handleSubmit} className="space-y-4">
                     
                     {/* --- CLIENT FORM --- */}
                     {accountType === 'CLIENT' && (
                         <>
                            {mode === 'REGISTER' && (
                                <InputField icon={UserIcon} placeholder={t('fullName')} value={formData.fullName} onChange={(e: any) => setFormData({...formData, fullName: e.target.value})} required />
                            )}
                            <InputField icon={Phone} placeholder={t('phone')} value={formData.phone} onChange={(e: any) => setFormData({...formData, phone: e.target.value})} required />
                         </>
                     )}

                     {/* --- PROVIDER FORM --- */}
                     {accountType === 'PROVIDER' && (
                         <>
                             {mode === 'REGISTER' && (
                                 <>
                                    <InputField icon={Briefcase} placeholder="إسم النشاط التجاري (Business Name)" value={formData.serviceName} onChange={(e: any) => setFormData({...formData, serviceName: e.target.value})} required />
                                    <InputField icon={ListPlus} placeholder="نوع الخدمة (مثال: نجار، طبيب...)" value={formData.serviceType} onChange={(e: any) => setFormData({...formData, serviceType: e.target.value})} required />
                                    <InputField icon={MapPin} placeholder="الموقع (مثال: مسنانة، طنجة)" value={formData.location} onChange={(e: any) => setFormData({...formData, location: e.target.value})} required />
                                    <InputField icon={Phone} placeholder={t('phone')} value={formData.phone} onChange={(e: any) => setFormData({...formData, phone: e.target.value})} required />
                                 </>
                             )}
                             {/* Providers use Username for Login */}
                             <InputField icon={UserIcon} placeholder={t('username')} value={formData.username} onChange={(e: any) => setFormData({...formData, username: e.target.value})} required />
                         </>
                     )}

                     {/* Common Password Field */}
                     <PasswordField icon={CheckSquare} placeholder={t('password')} value={formData.password} onChange={(e: any) => setFormData({...formData, password: e.target.value})} required />
                     
                     <button type="submit" disabled={isLoading} className="w-full bg-primary text-white py-3 rounded-xl font-bold font-arabic shadow-lg shadow-primary/30 text-lg flex items-center justify-center gap-2 mt-4 hover:bg-primaryDark transition-colors">
                         {isLoading ? <RefreshCw className="animate-spin"/> : (mode === 'REGISTER' ? t('registerButton') : t('loginButton'))}
                     </button>
                 </form>
             </div>
        </div>
    );
};

// --- CLIENT PROFILE VIEW (INSTAGRAM STYLE + BOTTOM SHEET ON MOBILE) ---
const ClientProfile = ({ isOpen, onClose, user, onLogout, onToggleTheme, isDarkMode, onOpenDbSetup }: any) => {
    const { t } = useLocalization();
    const [activeTab, setActiveTab] = useState<'APPOINTMENTS' | 'FOLLOWING'>('APPOINTMENTS');
    const [followingCount, setFollowingCount] = useState(0);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [followedProviders, setFollowedProviders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        if(isOpen && user) {
            fetchData();
        }
    }, [isOpen, user]);

    const fetchData = async () => {
        setLoading(true);
        // Stats
        const { count } = await supabase.from('follows').select('id', { count: 'exact' }).eq('client_id', user.id);
        setFollowingCount(count || 0);

        // Appointments
        const { data: appData } = await supabase.from('appointments')
            .select('*, providers(name, service_type, location, phone)')
            .eq('client_id', user.id)
            .order('created_at', { ascending: false });
        setAppointments(appData || []);

        // Followed Providers
        const { data: followData } = await supabase.from('follows')
            .select('provider_id, providers(id, name, service_type, location, profile_image_url)')
            .eq('client_id', user.id);
        
        if (followData) {
            setFollowedProviders(followData.map((f: any) => f.providers));
        }
        setLoading(false);
    }

    // Helper for countdown
    const getTimeRemaining = (created_at: string) => {
        // Mock: Appointment is 3 days after creation
        const appDate = new Date(created_at);
        appDate.setDate(appDate.getDate() + 3);
        const now = new Date();
        const diff = appDate.getTime() - now.getTime();
        
        if(diff <= 0) return t('today');

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        return `${days} ${t('days')}, ${hours} ${t('hours')}`;
    }

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center md:p-4">
             {/* Backdrop */}
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
             
             {/* Modal Container - Bottom Sheet on Mobile, Centered on Desktop */}
             <div className="relative w-full h-[90vh] md:h-auto md:max-h-[85vh] md:max-w-md bg-white dark:bg-gray-900 rounded-t-[2.5rem] md:rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-slide-up">
                 
                 {/* Drag Handle for Mobile */}
                 <div className="w-full flex justify-center pt-3 pb-1 md:hidden bg-white dark:bg-gray-900 z-10">
                     <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                 </div>

                 {/* Header Nav */}
                 <div className="px-5 py-3 flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                     <h2 className="text-lg font-bold dark:text-white flex items-center gap-1">
                         {user.name} <CheckCircle2 size={16} className="text-blue-500"/>
                     </h2>
                     <div className="flex gap-2">
                         <button onClick={onOpenDbSetup} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300"><Database size={18}/></button>
                         <button onClick={onToggleTheme} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300">
                             {isDarkMode ? <Sun size={18}/> : <Moon size={18}/>}
                         </button>
                         <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"><X size={24} className="dark:text-white"/></button>
                     </div>
                 </div>

                 <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 pb-20">
                     {/* Instagram Style Header */}
                     <div className="px-6 pt-6 pb-4">
                         <div className="flex items-center gap-6 mb-4">
                             {/* Avatar */}
                             <div className="relative">
                                 <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600">
                                     <div className="w-full h-full bg-white dark:bg-gray-800 rounded-full p-0.5">
                                         <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                                             <UserIcon size={32} className="text-gray-400"/>
                                         </div>
                                     </div>
                                 </div>
                                 <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full border-2 border-white dark:border-gray-900">
                                     <Plus size={12} strokeWidth={4}/>
                                 </div>
                             </div>

                             {/* Stats */}
                             <div className="flex-1 flex justify-around text-center">
                                 <div onClick={() => setActiveTab('FOLLOWING')} className="cursor-pointer">
                                     <span className="block font-bold text-lg dark:text-white">{followingCount}</span>
                                     <span className="text-xs text-gray-500">{t('followingProviders')}</span>
                                 </div>
                                 <div onClick={() => setActiveTab('APPOINTMENTS')} className="cursor-pointer">
                                     <span className="block font-bold text-lg dark:text-white">{appointments.length}</span>
                                     <span className="text-xs text-gray-500">{t('upcomingAppointments')}</span>
                                 </div>
                             </div>
                         </div>

                         {/* Bio */}
                         <div className="mb-4">
                             <h1 className="font-bold text-base dark:text-white">{user.name}</h1>
                             <p className="text-sm text-gray-600 dark:text-gray-400">Client Account • TangerConnect</p>
                             <p className="text-sm text-blue-600 dark:text-blue-400 dir-ltr">{user.phone}</p>
                         </div>

                         {/* Action Buttons */}
                         <div className="flex gap-2">
                             <button className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-bold dark:text-white">Edit Profile</button>
                             <button onClick={onLogout} className="flex-1 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-sm font-bold">{t('logout')}</button>
                         </div>
                     </div>

                     {/* Tabs */}
                     <div className="flex border-t border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
                         <button 
                            onClick={() => setActiveTab('APPOINTMENTS')}
                            className={`flex-1 py-3 flex justify-center border-b-2 transition-colors ${activeTab === 'APPOINTMENTS' ? 'border-black dark:border-white text-black dark:text-white' : 'border-transparent text-gray-400'}`}
                         >
                             <CalendarDays size={24}/>
                         </button>
                         <button 
                            onClick={() => setActiveTab('FOLLOWING')}
                            className={`flex-1 py-3 flex justify-center border-b-2 transition-colors ${activeTab === 'FOLLOWING' ? 'border-black dark:border-white text-black dark:text-white' : 'border-transparent text-gray-400'}`}
                         >
                             <Users size={24}/>
                         </button>
                     </div>

                     {/* Content Grid */}
                     <div className="p-1">
                         {activeTab === 'APPOINTMENTS' ? (
                             <div className="space-y-2 p-2 animate-fade-in">
                                 {appointments.map(app => (
                                     <div key={app.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl flex justify-between items-center border border-gray-100 dark:border-gray-700">
                                         <div>
                                             <h4 className="font-bold text-sm dark:text-white">{app.providers?.name}</h4>
                                             <p className="text-xs text-gray-500">{app.providers?.service_type}</p>
                                             <div className="flex items-center gap-1 mt-1 text-xs text-orange-500 font-bold">
                                                 <Clock size={12}/> {getTimeRemaining(app.created_at)}
                                             </div>
                                         </div>
                                         <div className="bg-white dark:bg-gray-700 p-2 rounded-lg shadow-sm">
                                             <CalendarDays size={20} className="text-gray-400"/>
                                         </div>
                                     </div>
                                 ))}
                                 {appointments.length === 0 && (
                                     <div className="text-center py-10 text-gray-400">
                                         <CalendarDays size={40} className="mx-auto mb-2 opacity-20"/>
                                         <p className="text-sm">{t('noAppointments')}</p>
                                     </div>
                                 )}
                             </div>
                         ) : (
                             <div className="space-y-2 p-2 animate-fade-in">
                                 {followedProviders.map(prov => (
                                     <div key={prov.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors">
                                         <div className="flex items-center gap-3">
                                             <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                                                 {prov.profile_image_url ? (
                                                     <img src={prov.profile_image_url} className="w-full h-full object-cover"/>
                                                 ) : (
                                                     <UserIcon className="w-full h-full p-2 text-gray-400"/>
                                                 )}
                                             </div>
                                             <div>
                                                 <h4 className="font-bold text-sm dark:text-white">{prov.name}</h4>
                                                 <p className="text-xs text-gray-500">{prov.service_type}</p>
                                             </div>
                                         </div>
                                         <button className="px-4 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs font-bold dark:text-white">
                                             {t('followingProviders')}
                                         </button>
                                     </div>
                                 ))}
                                  {followedProviders.length === 0 && (
                                     <div className="text-center py-10 text-gray-400">
                                         <Users size={40} className="mx-auto mb-2 opacity-20"/>
                                         <p className="text-sm">Not following anyone.</p>
                                     </div>
                                 )}
                             </div>
                         )}
                     </div>
                 </div>
            </div>
        </div>
    )
}

// --- NOTIFICATION CENTER ---
const NotificationCenter = ({ isOpen, onClose, currentUser }: any) => {
    const { t } = useLocalization();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if(isOpen) fetchNotifications();
    }, [isOpen, currentUser]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            if (currentUser?.accountType === 'PROVIDER') {
                const { data } = await supabase.from('provider_notifications').select('*').eq('provider_id', currentUser.id).order('created_at', { ascending: false }).limit(20);
                setItems(data || []);
            } else {
                // Client Logic: Get followed providers first
                let providerIds: number[] = [];
                if(currentUser) {
                    const { data: follows } = await supabase.from('follows').select('provider_id').eq('client_id', currentUser.id);
                    if(follows) providerIds = follows.map(f => f.provider_id);
                }

                if(providerIds.length > 0) {
                     const { data } = await supabase.from('announcements')
                        .select('*, providers(name)')
                        .in('provider_id', providerIds)
                        .order('created_at', { ascending: false })
                        .limit(20);
                     setItems(data || []);
                } else {
                    const { data } = await supabase.from('system_announcements').select('*').eq('is_active', true).limit(5);
                    setItems(data || []);
                }
            }
        } catch(e) {
            console.warn("Notification fetch error (likely table missing)", e);
            setItems([]); // Graceful fallback
        } finally {
            setLoading(false);
        }
    }

    if(!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex justify-end">
            <div className="absolute inset-0" onClick={onClose} />
            <div className="bg-white dark:bg-gray-800 w-80 h-full relative z-10 shadow-2xl flex flex-col animate-slide-up">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                     <h3 className="font-bold flex items-center gap-2 dark:text-white"><Bell size={18}/> {t('notifications')}</h3>
                     <button onClick={onClose}><X size={20} className="dark:text-white"/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex justify-center py-10"><RefreshCw className="animate-spin text-gray-400"/></div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                             <Bell size={48} className="mx-auto mb-2 opacity-20"/>
                             <p>{t('noNotifications')}</p>
                             {!currentUser && <p className="text-xs mt-2">Login to see personalized alerts.</p>}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {items.map((item, i) => (
                                <div key={i} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl border border-gray-100 dark:border-gray-600">
                                    <div className="flex justify-between items-start mb-1">
                                         <span className="font-bold text-sm text-primary">{item.providers?.name || item.title || 'System'}</span>
                                         <span className="text-[10px] text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm dark:text-gray-200">{item.message}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- PROVIDER DIRECTORY & PROFILE (INSTAGRAM STYLE - FULL SCREEN UPDATE) ---
const ProviderDirectory = ({ isOpen, onClose, currentUser, onOpenAuth }: any) => {
    const { t } = useLocalization();
    const [providers, setProviders] = useState<any[]>([]);
    const [followedIds, setFollowedIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    
    // Detailed Profile View State
    const [selectedProvider, setSelectedProvider] = useState<any | null>(null);
    const [providerDetails, setProviderDetails] = useState<{services: any[], posts: any[], followerCount: number}>({ services: [], posts: [], followerCount: 0 });
    const [profileTab, setProfileTab] = useState<'SERVICES' | 'POSTS'>('SERVICES');
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        if(isOpen) {
            fetchProviders();
            if(currentUser?.accountType === 'CLIENT') fetchFollows();
        } else {
            setSelectedProvider(null);
            setSearch('');
        }
    }, [isOpen, currentUser]);

    useEffect(() => {
        if(selectedProvider) {
            fetchProviderDetails(selectedProvider.id);
        }
    }, [selectedProvider]);

    const fetchProviders = async () => {
        setLoading(true);
        const { data } = await supabase.from('providers')
            .select('id, name, service_type, location, profile_image_url, bio, social_links')
            .eq('is_active', true);
        setProviders(data || []);
        setLoading(false);
    }

    const fetchFollows = async () => {
        const { data } = await supabase.from('follows').select('provider_id').eq('client_id', currentUser.id);
        setFollowedIds(data?.map(d => d.provider_id) || []);
    }

    const fetchProviderDetails = async (providerId: number) => {
        setLoadingDetails(true);
        try {
            const { data: services } = await supabase.from('provider_services').select('*').eq('provider_id', providerId);
            const { data: posts } = await supabase.from('announcements').select('*').eq('provider_id', providerId).order('created_at', {ascending: false});
            const { count } = await supabase.from('follows').select('id', { count: 'exact' }).eq('provider_id', providerId);

            setProviderDetails({
                services: services || [],
                posts: posts || [],
                followerCount: count || 0
            });
        } catch(e) { console.error(e); }
        finally { setLoadingDetails(false); }
    }

    const toggleFollow = async (providerId: number) => {
        if(!currentUser) {
            onOpenAuth();
            return;
        }
        
        if (followedIds.includes(providerId)) {
            await supabase.from('follows').delete().eq('client_id', currentUser.id).eq('provider_id', providerId);
            setFollowedIds(prev => prev.filter(id => id !== providerId));
            if(selectedProvider && selectedProvider.id === providerId) {
                setProviderDetails(prev => ({...prev, followerCount: prev.followerCount - 1}));
            }
        } else {
            await supabase.from('follows').insert({ client_id: currentUser.id, provider_id: providerId });
            setFollowedIds(prev => [...prev, providerId]);
            if(selectedProvider && selectedProvider.id === providerId) {
                setProviderDetails(prev => ({...prev, followerCount: prev.followerCount + 1}));
            }
        }
    }

    const filtered = providers.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.service_type.toLowerCase().includes(search.toLowerCase()));

    if(!isOpen) return null;

    // --- RENDER: PROFILE VIEW (UPDATED TO FULL SCREEN) ---
    if (selectedProvider) {
        let social = { instagram: '', facebook: '', website: '', gps: '' };
        try { 
            if(selectedProvider.social_links) {
                social = typeof selectedProvider.social_links === 'string' ? JSON.parse(selectedProvider.social_links) : selectedProvider.social_links;
            }
        } catch(e){}

        return (
             <div className="fixed inset-0 bg-white dark:bg-gray-900 z-[70] flex flex-col animate-slide-up">
                 {/* Full Screen Mode */}
                    
                    {/* Profile Header (Nav) */}
                    <div className="p-4 flex items-center justify-between border-b dark:border-gray-700 bg-white dark:bg-gray-900 z-10 sticky top-0">
                        <button onClick={() => setSelectedProvider(null)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                            <ArrowLeft size={24} className="dark:text-white"/>
                        </button>
                        <h3 className="font-bold dark:text-white">{selectedProvider.name}</h3>
                        <div className="w-8"></div>
                    </div>

                    {/* Profile Content */}
                    <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
                        
                        {/* 1. Header Info */}
                        <div className="p-6 pb-2">
                             <div className="flex items-center gap-6 mb-6">
                                 {/* Avatar */}
                                 <div className="w-24 h-24 rounded-full border-2 border-primary p-0.5">
                                     <div className="w-full h-full rounded-full overflow-hidden bg-gray-200">
                                         {selectedProvider.profile_image_url ? (
                                             <img src={selectedProvider.profile_image_url} className="w-full h-full object-cover"/>
                                         ) : (
                                             <UserIcon className="w-full h-full p-6 text-gray-400"/>
                                         )}
                                     </div>
                                 </div>
                                 {/* Stats */}
                                 <div className="flex-1 flex justify-around text-center">
                                     <div>
                                         <span className="block font-bold text-xl dark:text-white">{providerDetails.followerCount}</span>
                                         <span className="text-sm text-gray-500">{t('followers')}</span>
                                     </div>
                                     <div>
                                         <span className="block font-bold text-xl dark:text-white">{providerDetails.posts.length}</span>
                                         <span className="text-sm text-gray-500">{t('posts')}</span>
                                     </div>
                                 </div>
                             </div>

                             {/* Bio & Details */}
                             <div className="mb-6">
                                 <h4 className="font-bold text-lg dark:text-white">{selectedProvider.service_type}</h4>
                                 <p className="text-base text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{selectedProvider.bio || t('noServices')}</p>
                                 <p className="text-sm text-gray-400 mt-2 flex items-center gap-1"><MapPin size={14}/> {selectedProvider.location}</p>
                             </div>

                             {/* Social Links */}
                             <div className="flex gap-3 mb-6">
                                 {social.instagram && (
                                     <a href={social.instagram} target="_blank" rel="noreferrer" className="p-3 bg-pink-50 text-pink-600 rounded-full hover:bg-pink-100 transition-colors"><Instagram size={24}/></a>
                                 )}
                                 {social.facebook && (
                                     <a href={social.facebook} target="_blank" rel="noreferrer" className="p-3 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"><Facebook size={24}/></a>
                                 )}
                                 {social.gps && (
                                     <a href={social.gps} target="_blank" rel="noreferrer" className="p-3 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors"><Map size={24}/></a>
                                 )}
                                 {social.website && (
                                     <a href={social.website} target="_blank" rel="noreferrer" className="p-3 bg-gray-50 text-gray-600 rounded-full hover:bg-gray-100 transition-colors"><LinkIcon size={24}/></a>
                                 )}
                                 <a href={`tel:${selectedProvider.phone || selectedProvider.username}`} className="p-3 bg-gray-50 text-gray-600 rounded-full hover:bg-gray-100 transition-colors ml-auto flex items-center gap-2 px-6 font-bold text-sm">
                                     <Phone size={18}/> {t('call')}
                                 </a>
                             </div>

                             {/* Action Buttons */}
                             <button 
                                onClick={() => toggleFollow(selectedProvider.id)}
                                className={`w-full py-3 rounded-xl font-bold text-base transition-all mb-6 ${followedIds.includes(selectedProvider.id) ? 'bg-gray-200 text-gray-700' : 'bg-blue-600 text-white shadow-md'}`}
                             >
                                 {followedIds.includes(selectedProvider.id) ? t('unfollow') : t('follow')}
                             </button>
                        </div>

                        {/* 2. Content Tabs */}
                        <div className="border-t border-b dark:border-gray-700 flex sticky top-[60px] bg-white dark:bg-gray-900 z-10">
                            <button 
                                onClick={() => setProfileTab('SERVICES')} 
                                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 ${profileTab === 'SERVICES' ? 'border-b-2 border-black dark:border-white text-black dark:text-white' : 'text-gray-400'}`}
                            >
                                <ListPlus size={18}/> {t('services')}
                            </button>
                            <button 
                                onClick={() => setProfileTab('POSTS')} 
                                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 ${profileTab === 'POSTS' ? 'border-b-2 border-black dark:border-white text-black dark:text-white' : 'text-gray-400'}`}
                            >
                                <Briefcase size={18}/> {t('posts')}
                            </button>
                        </div>

                        {/* 3. Grid Content */}
                        <div className="p-1 min-h-[300px] bg-gray-50 dark:bg-gray-900">
                             {loadingDetails ? (
                                 <div className="flex justify-center py-10"><RefreshCw className="animate-spin text-gray-400"/></div>
                             ) : profileTab === 'SERVICES' ? (
                                 <div className="grid grid-cols-1 gap-3 p-4">
                                     {providerDetails.services.length > 0 ? providerDetails.services.map(s => (
                                         <div key={s.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700 flex justify-between items-center shadow-sm">
                                             <div>
                                                 <span className="font-bold dark:text-white block text-lg">{s.name}</span>
                                                 {s.discount_price ? (
                                                     <div className="text-sm">
                                                         <span className="line-through text-red-400 mr-2">{s.price} DH</span>
                                                         <span className="font-bold text-green-600">{s.discount_price} DH</span>
                                                     </div>
                                                 ) : (
                                                     <span className="text-base font-bold text-gray-600 dark:text-gray-300">{s.price} DH</span>
                                                 )}
                                             </div>
                                             <button className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full"><ShoppingBag size={20}/></button>
                                         </div>
                                     )) : (
                                         <div className="text-center py-10 text-gray-400">
                                             <ShoppingBag size={48} className="mx-auto mb-2 opacity-20"/>
                                             <p>{t('noServices')}</p>
                                         </div>
                                     )}
                                 </div>
                             ) : (
                                 <div className="grid grid-cols-1 gap-4 p-4">
                                     {providerDetails.posts.length > 0 ? providerDetails.posts.map(p => (
                                         <div key={p.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl border dark:border-gray-700 shadow-sm">
                                             <p className="text-base dark:text-gray-200 mb-3 whitespace-pre-wrap">{p.message}</p>
                                             <span className="text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString()}</span>
                                         </div>
                                     )) : (
                                          <div className="text-center py-10 text-gray-400">
                                             <Briefcase size={48} className="mx-auto mb-2 opacity-20"/>
                                             <p>{t('noPosts')}</p>
                                         </div>
                                     )}
                                 </div>
                             )}
                        </div>
                    </div>
             </div>
        );
    }

    // --- RENDER: LIST VIEW ---
    return (
         <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
             <div className="absolute inset-0" onClick={onClose}/>
             <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-3xl h-[80vh] relative z-10 flex flex-col overflow-hidden shadow-2xl animate-slide-up">
                 <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700 flex justify-between items-center">
                     <h3 className="font-bold flex items-center gap-2 dark:text-white"><FileText className="text-blue-500"/> {t('providerDirectory')}</h3>
                     <button onClick={onClose}><X size={20} className="dark:text-white"/></button>
                 </div>
                 <div className="p-3 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                     <div className="relative">
                         <Search className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                         <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('searchProviderPlaceholder')} className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl outline-none dark:text-white"/>
                     </div>
                 </div>
                 <div className="flex-1 overflow-y-auto p-4">
                     {loading ? <div className="flex justify-center py-10"><RefreshCw className="animate-spin"/></div> : (
                         <div className="grid gap-3">
                             {filtered.map(p => (
                                 <div key={p.id} onClick={() => setSelectedProvider(p)} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                                     <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex-shrink-0 border border-gray-300">
                                         {p.profile_image_url ? <img src={p.profile_image_url} className="w-full h-full object-cover"/> : <UserIcon className="w-full h-full p-2 text-gray-400"/>}
                                     </div>
                                     <div className="flex-1 min-w-0">
                                         <h4 className="font-bold dark:text-white truncate">{p.name}</h4>
                                         <p className="text-xs text-gray-500">{p.service_type} • {p.location}</p>
                                     </div>
                                     <button 
                                        onClick={(e) => { e.stopPropagation(); toggleFollow(p.id); }}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all z-10 ${followedIds.includes(p.id) ? 'bg-gray-200 text-gray-600' : 'bg-blue-600 text-white shadow-md'}`}
                                     >
                                         {followedIds.includes(p.id) ? t('unfollow') : t('follow')}
                                     </button>
                                 </div>
                             ))}
                             {filtered.length === 0 && <p className="text-center text-gray-400">No providers found.</p>}
                         </div>
                     )}
                 </div>
             </div>
         </div>
    )
};

// --- APP COMPONENT ---

const App: React.FC = () => {
  const [view, setView] = useState<UserView>(UserView.CLIENT);
  const [language, setLanguage] = useState<Language>(Language.AR);
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  
  // Modal States
  const [showAuthDrawer, setShowAuthDrawer] = useState(false);
  const [showAppointmentsDrawer, setShowAppointmentsDrawer] = useState(false);
  const [showDbSetup, setShowDbSetup] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDirectory, setShowDirectory] = useState(false);
  const [showClientProfile, setShowClientProfile] = useState(false);
  
  // Feature Modals
  const [showStore, setShowStore] = useState(false);
  const [showRealEstate, setShowRealEstate] = useState(false);
  const [showJobBoard, setShowJobBoard] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined' && localStorage.theme) return localStorage.theme;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });

  const t = (key: any) => translations[key]?.[language] || key;

  useEffect(() => {
      if (theme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
  }, [theme]);

  // Auth Check
  useEffect(() => {
      const checkUser = async () => {
          const uid = localStorage.getItem('tangerconnect_user_id');
          const type = localStorage.getItem('tangerconnect_user_type');
          if(uid && type) {
              const table = type === 'CLIENT' ? 'clients' : 'providers';
              const { data } = await supabase.from(table).select('*').eq('id', uid).single();
              if(data) {
                  setCurrentUser({
                      id: data.id,
                      name: data.full_name || data.name,
                      accountType: type as AccountType,
                      phone: data.phone || data.username, // Fallback
                      isActive: data.is_active,
                      subscriptionEndDate: data.subscription_end_date,
                      social_links: data.social_links
                  });
                  setView(type === 'PROVIDER' ? UserView.PROVIDER : UserView.CLIENT);
              }
          }
          setIsLoadingUser(false);
      };
      checkUser();
  }, []);

  const handleLogout = () => { 
      localStorage.removeItem('tangerconnect_user_id'); 
      localStorage.removeItem('tangerconnect_user_type'); 
      setCurrentUser(null); 
      setView(UserView.CLIENT); 
      setMobileMenuOpen(false); 
  };
  
  const handleAuthSuccess = (user: AuthenticatedUser) => { 
      setCurrentUser(user); 
      setShowAuthDrawer(false); 
      if (user.accountType === AccountType.PROVIDER) setView(UserView.PROVIDER); 
      else setView(UserView.CLIENT); 
  };
  
  const handleProfileClick = () => {
      if (!currentUser) {
          setShowAuthDrawer(true);
          return;
      }
      if (currentUser.accountType === 'PROVIDER') {
          // Provider doesn't have a "Client Profile" modal, they have the main portal
          setMobileMenuOpen(!mobileMenuOpen); 
      } else {
          // Client opens specialized profile
          setShowClientProfile(true);
      }
  }


  // Header Component
  const Header = () => (
      <header className="fixed top-0 left-0 right-0 bg-surface/90 dark:bg-dark/90 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 z-40 transition-all duration-300">
        <div className="w-full md:max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
            
            {/* Left Side: Logo & Title */}
            <div className="flex items-center gap-2">
                <div className="bg-gradient-to-br from-primary to-secondary p-1.5 rounded-lg shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                </div>
                <h1 className="text-xl font-bold text-dark dark:text-white hidden sm:block tracking-tight">Tanger<span className="text-primary">Connect</span></h1>
            </div>

            {/* Right Side: Icons & Auth */}
            <div className="flex items-center gap-2">
                 
                 {/* Notifications */}
                 <button onClick={() => setShowNotifications(true)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full dark:hover:bg-gray-800 relative">
                     <Bell size={20}/>
                 </button>

                 {/* Directory (Users Listing) */}
                 <button onClick={() => setShowDirectory(true)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full dark:hover:bg-gray-800" title="Directory">
                     <FileText size={20}/>
                 </button>

                 {/* Feature Icons */}
                 <button onClick={() => setShowRealEstate(true)} className="p-2 text-gray-500 hover:bg-orange-50 hover:text-orange-600 rounded-full" title="Real Estate">
                    <Home size={20}/>
                 </button>
                 
                 <button onClick={() => setShowJobBoard(true)} className="p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-full" title="Jobs">
                    <Briefcase size={20}/>
                 </button>

                 <button onClick={() => setShowStore(true)} className="p-2 text-gray-500 hover:bg-purple-50 hover:text-purple-600 rounded-full" title="Store">
                    <ShoppingBag size={20}/>
                 </button>

                 {/* Language Switcher */}
                 <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 ml-1">
                    <button onClick={() => setLanguage(Language.AR)} className={`px-2 py-1 rounded-md text-[10px] font-bold ${language === Language.AR ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-500'}`}>AR</button>
                    <button onClick={() => setLanguage(Language.FR)} className={`px-2 py-1 rounded-md text-[10px] font-bold ${language === Language.FR ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-500'}`}>FR</button>
                    <button onClick={() => setLanguage(Language.EN)} className={`px-2 py-1 rounded-md text-[10px] font-bold ${language === Language.EN ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-500'}`}>EN</button>
                 </div>

                 {/* Login / Profile Button */}
                 <button 
                    onClick={handleProfileClick}
                    className={`ml-2 flex items-center gap-2 px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 ${currentUser ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-primary text-white hover:bg-primaryDark'}`}
                 >
                    {currentUser ? <UserCheck size={18}/> : <LogIn size={18}/>}
                    <span className="text-sm font-bold hidden sm:inline">{currentUser ? currentUser.name.split(' ')[0] : t('loginRegister')}</span>
                 </button>
            </div>
        </div>
        
        {/* Mobile Menu Expanded (Provider Only) */}
        {mobileMenuOpen && currentUser && currentUser.accountType === 'PROVIDER' && (
            <div className="absolute top-16 left-0 w-full bg-surface dark:bg-surfaceDark border-b border-gray-200 dark:border-gray-700 shadow-xl p-4 z-40 animate-fade-in">
                 <div className="flex justify-center gap-4 mb-4">
                     <button onClick={() => setShowDbSetup(true)} className="p-2 bg-gray-100 rounded-full"><Database size={20}/></button>
                     <a href="https://wa.me/212617774846" className="p-2 bg-green-100 text-green-600 rounded-full"><Headset size={20}/></a>
                 </div>

                 <button onClick={handleLogout} className="w-full py-3 bg-red-100 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2"><LogOut size={18}/> {t('logout')}</button>
            </div>
        )}
      </header>
  );

  if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

  return (
    <LocalizationProvider language={language}>
      <ScrollFixStyle />
      <div key={language} className={`h-screen bg-surface dark:bg-dark text-dark dark:text-light transition-colors duration-300 flex flex-col ${language === Language.AR ? 'font-arabic' : 'font-sans'}`} dir={language === Language.AR ? 'rtl' : 'ltr'}>
        <Header />
        
        <main className="flex-1 pt-16 md:pt-20 pb-0 md:pb-4 w-full md:max-w-6xl md:mx-auto md:px-4 flex flex-col overflow-hidden">
            {view === UserView.PROVIDER && currentUser?.accountType === AccountType.PROVIDER ? (
                <ProviderPortal provider={currentUser} onLogout={handleLogout} />
            ) : (
                <Chatbot currentUser={currentUser} setCurrentUser={setCurrentUser} isLoadingUser={isLoadingUser} />
            )}
        </main>

        {/* Global Modals */}
        <AuthDrawer isOpen={showAuthDrawer} onClose={() => setShowAuthDrawer(false)} onAuthSuccess={handleAuthSuccess} onDatabaseError={() => setShowDbSetup(true)} />
        <AppointmentsDrawer isOpen={showAppointmentsDrawer} onClose={() => setShowAppointmentsDrawer(false)} user={currentUser} />
        <NotificationCenter isOpen={showNotifications} onClose={() => setShowNotifications(false)} currentUser={currentUser} />
        <ProviderDirectory isOpen={showDirectory} onClose={() => setShowDirectory(false)} currentUser={currentUser} onOpenAuth={() => setShowAuthDrawer(true)} />
        
        {/* Client Profile Modal (Updated Props) */}
        <ClientProfile 
            isOpen={showClientProfile} 
            onClose={() => setShowClientProfile(false)} 
            user={currentUser}
            onLogout={() => { handleLogout(); setShowClientProfile(false); }}
            onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            isDarkMode={theme === 'dark'}
            onOpenDbSetup={() => setShowDbSetup(true)}
        />

        {/* Feature Modals */}
        <Store isOpen={showStore} onClose={() => setShowStore(false)} currentUser={currentUser} onOpenAuth={() => setShowAuthDrawer(true)} />
        <RealEstate isOpen={showRealEstate} onClose={() => setShowRealEstate(false)} currentUser={currentUser} />
        <JobBoard isOpen={showJobBoard} onClose={() => setShowJobBoard(false)} currentUser={currentUser} />
        
        <DatabaseSetup isOpen={showDbSetup} onClose={() => setShowDbSetup(false)} />
      </div>
    </LocalizationProvider>
  );
};

export default App;
