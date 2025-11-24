
import React, { useState, useEffect, useRef } from 'react';
import { UserView, Language, AuthenticatedUser, AccountType } from './types';
import Chatbot from './components/Chatbot';
import ProviderPortal from './components/QRScanner';
import AppointmentsDrawer from './components/AppointmentsDrawer';
import DatabaseSetup from './components/DatabaseSetup';
import { LocalizationProvider, useLocalization, translations } from './hooks/useLocalization';
import { Globe, User as UserIcon, CheckSquare, Sun, Moon, LogIn, LogOut, X, CalendarDays, Database, AlertTriangle, CheckCircle2, Menu, Users, Bell, Phone, MapPin, Search, Heart, Briefcase, Star, MessageCircle } from 'lucide-react';
import { supabase } from './services/supabaseClient';

// --- New Components (Directory & Notifications) ---

const ProviderProfileModal: React.FC<{ provider: any; isOpen: boolean; onClose: () => void; isFollowing: boolean; onToggleFollow: () => void }> = ({ provider, isOpen, onClose, isFollowing, onToggleFollow }) => {
    const { t } = useLocalization();
    if (!isOpen || !provider) return null;

    const services = provider.provider_services || [];

    return (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full z-10"><X size={20}/></button>
                
                {/* Header Image Area */}
                <div className="h-32 bg-gradient-to-r from-primary to-secondary relative">
                    <div className="absolute -bottom-10 left-6">
                         <div className="w-24 h-24 rounded-2xl border-4 border-white dark:border-gray-800 bg-white dark:bg-gray-700 overflow-hidden shadow-lg">
                            {provider.profile_image_url ? (
                                <img src={provider.profile_image_url} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-600 text-3xl font-bold text-gray-400">
                                    {provider.name.charAt(0)}
                                </div>
                            )}
                         </div>
                    </div>
                </div>

                <div className="pt-12 px-6 pb-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-bold dark:text-white leading-none">{provider.name}</h2>
                            <p className="text-primary font-medium mt-1">{provider.service_type}</p>
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><MapPin size={14}/> {provider.location}</p>
                        </div>
                        <button 
                            onClick={onToggleFollow}
                            className={`px-5 py-2.5 rounded-full font-bold shadow-md transition-all flex items-center gap-2 ${isFollowing ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-primary text-white hover:bg-primaryDark'}`}
                        >
                            {isFollowing ? <><CheckCircle2 size={16}/> {t('unfollow')}</> : <>{t('follow')}</>}
                        </button>
                    </div>

                    {/* Bio */}
                    {provider.bio && (
                        <div className="mb-6 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                            <h4 className="font-bold text-sm mb-2 text-gray-500 uppercase">{t('about')}</h4>
                            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{provider.bio}</p>
                        </div>
                    )}

                    {/* Services & Offers */}
                    <div>
                         <h4 className="font-bold text-sm mb-3 text-gray-500 uppercase flex items-center gap-2"><Star size={16} className="text-yellow-500"/> {t('servicesAndOffers')}</h4>
                         <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                             {services.length > 0 ? services.map((s: any) => (
                                 <div key={s.id} className="flex justify-between items-center p-3 border border-gray-100 dark:border-gray-700 rounded-xl">
                                     <span className="font-medium dark:text-white text-sm">{s.name}</span>
                                     <div className="text-sm">
                                         {s.discount_price ? (
                                             <>
                                                <span className="line-through text-gray-400 mr-2 text-xs">{s.price} DH</span>
                                                <span className="font-bold text-green-600">{s.discount_price} DH</span>
                                             </>
                                         ) : (
                                             <span className="font-bold text-gray-700 dark:text-gray-300">{s.price} DH</span>
                                         )}
                                     </div>
                                 </div>
                             )) : <p className="text-sm text-gray-400 italic">No services listed yet.</p>}
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const ProviderDirectory: React.FC<{ isOpen: boolean; onClose: () => void; currentUser: AuthenticatedUser | null }> = ({ isOpen, onClose, currentUser }) => {
    const { t, language } = useLocalization();
    const [providers, setProviders] = useState<any[]>([]);
    const [followedIds, setFollowedIds] = useState<number[]>([]);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'all' | 'following'>('all');
    const [selectedProvider, setSelectedProvider] = useState<any>(null);

    useEffect(() => {
        if(isOpen) {
            // Fetch providers, only active ones with valid subscription
            const today = new Date().toISOString();
            supabase.from('providers')
                .select('*, provider_services(id, name, price, discount_price)')
                .eq('is_active', true)
                .gt('subscription_end_date', today) // IMPORTANT: Only show valid subscriptions
            .then(({data}) => setProviders(data || []));
            
            if(currentUser) {
                supabase.from('follows').select('provider_id').eq('client_id', currentUser.id)
                .then(({data}) => setFollowedIds(data?.map(d => d.provider_id) || []));
            }
        }
    }, [isOpen, currentUser]);

    const toggleFollow = async (providerId: number) => {
        if (!currentUser) return alert(t('loginTitle'));
        if (followedIds.includes(providerId)) {
            await supabase.from('follows').delete().match({ client_id: currentUser.id, provider_id: providerId });
            setFollowedIds(prev => prev.filter(id => id !== providerId));
        } else {
            await supabase.from('follows').insert({ client_id: currentUser.id, provider_id: providerId });
            setFollowedIds(prev => [...prev, providerId]);
        }
    };

    const filteredProviders = providers.filter(p => {
        const matchesSearch = 
            p.name.toLowerCase().includes(search.toLowerCase()) || 
            p.service_type.toLowerCase().includes(search.toLowerCase()) ||
            (p.provider_services && p.provider_services.some((s:any) => s.name.toLowerCase().includes(search.toLowerCase())));

        const matchesView = viewMode === 'all' || followedIds.includes(p.id);
        
        return matchesSearch && matchesView;
    });

    if(!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 w-full max-w-2xl h-[85vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                
                {/* Header with Search */}
                <div className="p-6 border-b dark:border-gray-700 bg-white dark:bg-gray-800 z-10">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-2xl dark:text-white">{t('providerDirectory')}</h3>
                        <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full"><X className="dark:text-white" size={20}/></button>
                    </div>
                    
                    <div className="relative mb-4">
                        <input 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('searchPlaceholder')}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border-none outline-none dark:text-white"
                        />
                        <Search className="absolute left-4 top-3.5 text-gray-400" size={20}/>
                    </div>

                    <div className="flex gap-2">
                        <button 
                            onClick={() => setViewMode('all')} 
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'all' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}
                        >
                            {t('allProviders')}
                        </button>
                        <button 
                            onClick={() => setViewMode('following')} 
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'following' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}
                        >
                            <Heart size={14} className={viewMode === 'following' ? 'fill-current' : ''}/> {t('myFollowing')}
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredProviders.map(p => (
                        <div 
                            key={p.id} 
                            onClick={() => setSelectedProvider(p)}
                            className="p-4 bg-white border border-gray-100 dark:bg-gray-700/50 dark:border-gray-600 rounded-2xl hover:shadow-lg transition-all cursor-pointer group"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xl font-bold text-gray-500 overflow-hidden shrink-0">
                                    {p.profile_image_url ? <img src={p.profile_image_url} className="w-full h-full object-cover"/> : p.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold dark:text-white truncate">{p.name}</h4>
                                    <p className="text-xs text-primary font-medium">{p.service_type}</p>
                                    <p className="text-xs text-gray-400 truncate mt-1 flex items-center gap-1"><MapPin size={10}/> {p.location}</p>
                                </div>
                            </div>
                            <div className="mt-4 flex justify-between items-center">
                                <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md">
                                    {p.provider_services?.length || 0} Services
                                </span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); toggleFollow(p.id); }}
                                    className={`p-2 rounded-full transition-colors ${followedIds.includes(p.id) ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-primary bg-gray-50'}`}
                                >
                                    <Heart size={18} className={followedIds.includes(p.id) ? 'fill-current' : ''} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredProviders.length === 0 && (
                        <div className="col-span-full text-center py-10 text-gray-400">
                            No active providers found matching your criteria.
                        </div>
                    )}
                </div>
            </div>

            <ProviderProfileModal 
                isOpen={!!selectedProvider} 
                onClose={() => setSelectedProvider(null)} 
                provider={selectedProvider} 
                isFollowing={selectedProvider ? followedIds.includes(selectedProvider.id) : false}
                onToggleFollow={() => selectedProvider && toggleFollow(selectedProvider.id)}
            />
        </div>
    );
};

const NotificationCenter: React.FC<{ isOpen: boolean; onClose: () => void; currentUser: AuthenticatedUser | null }> = ({ isOpen, onClose, currentUser }) => {
    const { t } = useLocalization();
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        if(isOpen && currentUser) {
            const fetchNotifs = async () => {
                // 1. Announcements from followed providers
                const { data: follows } = await supabase.from('follows').select('provider_id').eq('client_id', currentUser.id);
                const providerIds = follows?.map(f => f.provider_id) || [];
                let announcements: any[] = [];
                if(providerIds.length > 0) {
                     const { data } = await supabase.from('announcements').select('*, providers(name)').in('provider_id', providerIds).order('created_at', {ascending: false}).limit(10);
                     announcements = data || [];
                }
                
                // 2. Appointment Reminders (Simulated logic: Appointments tomorrow)
                const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowStr = tomorrow.toISOString().split('T')[0];
                const { data: appts } = await supabase.from('follow_ups').select('*, providers(name)').eq('client_id', currentUser.id).gte('next_appointment_date', tomorrowStr).lt('next_appointment_date', new Date(tomorrow.getTime() + 86400000).toISOString());
                
                const merged = [
                    ...announcements.map(a => ({ type: 'ad', ...a })),
                    ...(appts || []).map(a => ({ type: 'reminder', ...a }))
                ];
                setNotifications(merged);
            };
            fetchNotifs();
        }
    }, [isOpen, currentUser]);

    if(!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end" onClick={onClose}>
             <div className="bg-white dark:bg-gray-800 w-80 h-full shadow-2xl p-4 overflow-y-auto" onClick={e => e.stopPropagation()}>
                 <div className="flex justify-between items-center mb-6">
                     <h3 className="font-bold text-xl dark:text-white">{t('notifications')}</h3>
                     <button onClick={onClose}><X className="dark:text-white"/></button>
                 </div>
                 <div className="space-y-4">
                     {notifications.map((n, i) => (
                         <div key={i} className={`p-4 rounded-xl border-l-4 ${n.type === 'ad' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'}`}>
                             <div className="flex items-center gap-2 mb-1">
                                 {n.type === 'ad' ? <Bell size={14} className="text-blue-500"/> : <CalendarDays size={14} className="text-yellow-500"/>}
                                 <span className="font-bold text-sm dark:text-white">{n.providers.name}</span>
                             </div>
                             <p className="text-sm text-gray-700 dark:text-gray-300">
                                 {n.type === 'ad' ? n.message : t('appointmentReminder', {provider: n.providers.name})}
                             </p>
                         </div>
                     ))}
                     {notifications.length === 0 && <p className="text-center text-gray-500">{t('noNotifications')}</p>}
                 </div>
             </div>
        </div>
    );
};


// SplashScreen Component
const SplashScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onFinish, 500); // Allow fade out animation to finish
    }, 2500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  if (!visible) return null;

  return (
    <div className={`fixed inset-0 z-[100] bg-gradient-to-br from-primaryDark to-primary flex flex-col items-center justify-center transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="relative w-32 h-32 mb-6">
        <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
        <div className="relative bg-white rounded-full p-6 shadow-2xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
      </div>
      <h1 className="text-4xl font-bold text-white tracking-tight animate-fade-in font-sans">
        Tanger<span className="text-accent">Connect</span>
      </h1>
      <p className="text-primary/20 text-sm mt-2 font-medium tracking-widest uppercase animate-pulse">AI Assistant</p>
    </div>
  );
};

const RegistrationSuccessModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t } = useLocalization();
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-surface dark:bg-surfaceDark rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center border border-gray-100 dark:border-gray-700 transform transition-all scale-100">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-dark dark:text-light mb-3 font-arabic">{t('registrationSuccessTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-8 text-base leading-relaxed">
                    {t('providerRegistrationSuccessMessage')}
                </p>
                <button 
                    onClick={onClose} 
                    className="w-full px-6 py-3.5 bg-primary hover:bg-primaryDark text-white rounded-xl transition-all font-bold text-base shadow-lg shadow-primary/30 active:scale-95"
                >
                    {t('backToApp')}
                </button>
            </div>
        </div>
    );
};

// FIX: Moved InputField outside to prevent re-rendering and focus loss
const InputField = ({ label, value, onChange, type = "text", placeholder = "" }: any) => (
    <div className="mb-4">
        <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>
        <input 
            type={type} 
            value={value} 
            onChange={(e) => onChange(e.target.value)} 
            placeholder={placeholder}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-700/50 dark:border-gray-600 dark:text-white transition-all outline-none" 
            required 
        />
    </div>
);

const AuthDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthenticatedUser) => void;
  onDatabaseError: () => void;
}> = ({ isOpen, onClose, onAuthSuccess, onDatabaseError }) => {
  const { t } = useLocalization();
  const [isRegister, setIsRegister] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>(AccountType.CLIENT);
  
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | React.ReactNode>('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Client fields
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  
  // Provider fields
  const [businessName, setBusinessName] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [location, setLocation] = useState('');
  const [username, setUsername] = useState('');
  const [providerPhone, setProviderPhone] = useState('');
  
  const drawerRef = useRef<HTMLDivElement>(null);

  const handleSpecificError = (err: any) => {
      console.error("Auth Error:", err); 
      const message = (err.message || '').toLowerCase();
      const code = err.code || '';
      const isSchemaError = message.includes('relation') || message.includes('column') || message.includes('schema cache');
      const isRLSError = code === '42501' || message.includes('row-level security');

      if (message.includes('clients_phone_key')) {
          setError(t('phoneExistsError'));
      } else if (message.includes('providers_username_key')) {
          setError(t('usernameExistsError'));
      } else if (message.includes("'is_active' column")) {
           setError(
                <span>
                    {t('missingIsActiveColumn')} {' '}
                    <button onClick={onDatabaseError} className="font-bold underline text-secondary hover:text-primary">
                        {t('clickHereForInstructions')}
                    </button>
                </span>
            );
      } else if (isRLSError) {
           setError(
                <span>
                    {t('rlsError')} {' '}
                    <button onClick={onDatabaseError} className="font-bold underline text-secondary hover:text-primary">
                        {t('clickHereForInstructions')}
                    </button>
                </span>
            );
      } else if (isSchemaError) {
           const errorMessageKey = message.includes('schema cache') 
            ? 'databaseSchemaErrorWithCache' 
            : 'databaseSchemaError';
           setError(
                <span>
                    {t(errorMessageKey as any)} {' '}
                    <button onClick={onDatabaseError} className="font-bold underline text-secondary hover:text-primary">
                        {t('clickHereForInstructions')}
                    </button>
                </span>
            );
      } else {
          setError(t('registrationFailed'));
      }
  }

  const handleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      if (accountType === AccountType.CLIENT) {
        if (!phone || !password) { setError(t('allFieldsRequired')); setIsLoading(false); return; }
        const { data, error } = await supabase
          .from('clients')
          .select('id, full_name, phone')
          .eq('phone', phone)
          .eq('password', password)
          .single();
        if (error || !data) throw error || new Error('Invalid credentials');
        localStorage.setItem('tangerconnect_user_id', data.id.toString());
        localStorage.setItem('tangerconnect_user_type', AccountType.CLIENT);
        onAuthSuccess({ id: data.id, name: data.full_name, accountType: AccountType.CLIENT, phone: data.phone });
      } else {
        if (!username || !password) { setError(t('allFieldsRequired')); setIsLoading(false); return; }
        const { data, error } = await supabase
          .from('providers')
          .select('id, name, username, is_active, subscription_end_date')
          .eq('username', username)
          .eq('password', password)
          .single();
          
        if (error || !data) throw error || new Error('Invalid credentials');

        localStorage.setItem('tangerconnect_user_id', data.id.toString());
        localStorage.setItem('tangerconnect_user_type', AccountType.PROVIDER);
        onAuthSuccess({ 
            id: data.id, 
            name: data.name, 
            accountType: AccountType.PROVIDER, 
            username: data.username,
            isActive: data.is_active,
            subscriptionEndDate: data.subscription_end_date
        });
      }
    } catch (e: any) {
       handleSpecificError(e);
    } finally {
        setIsLoading(false);
    }
  };
  const handleRegister = async () => {
    setError('');
    setIsLoading(true);
    try {
      if (accountType === AccountType.CLIENT) {
        if (!fullName || !phone || !password) { setError(t('allFieldsRequired')); setIsLoading(false); return; }
        const { data, error } = await supabase
          .from('clients')
          .insert({ full_name: fullName, phone: phone, password: password })
          .select('id, full_name, phone')
          .single();
        if (error || !data) throw error;
        localStorage.setItem('tangerconnect_user_id', data.id.toString());
        localStorage.setItem('tangerconnect_user_type', AccountType.CLIENT);
        onAuthSuccess({ id: data.id, name: data.full_name, accountType: AccountType.CLIENT, phone: data.phone });
      } else {
        if(!businessName || !serviceType || !location || !username || !password || !providerPhone) { setError(t('allFieldsRequired')); setIsLoading(false); return; }
        
        const { data, error } = await supabase
          .from('providers')
          .insert({ 
              name: businessName, 
              service_type: serviceType, 
              location: location, 
              username: username, 
              password: password,
              phone: providerPhone,
              is_active: false 
          })
          .select('id, name, username')
          .single();
          
        if (error || !data) throw error;
        setShowSuccessModal(true);
      }
    } catch (e: any) {
       handleSpecificError(e);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) handleRegister();
    else handleLogin();
  };
  

  const renderClientFields = () => (
    <>
      {isRegister && <InputField label={t('fullName')} value={fullName} onChange={setFullName} />}
      <InputField label={t('phone')} value={phone} onChange={setPhone} type="tel" placeholder="06..." />
    </>
  );

  const renderProviderFields = () => (
    <>
       {isRegister && (
         <>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 mb-5 rounded-xl">
                <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                    <div>
                        <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400">{t('subscriptionNoticeTitle')}</h3>
                        <p className="mt-1 text-xs text-amber-700 dark:text-amber-300 leading-relaxed">{t('subscriptionNoticeDesc')}</p>
                        <div className="mt-2 font-bold text-sm text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/40 inline-block px-2 py-1 rounded-md">
                            {t('subscriptionFee')}
                        </div>
                    </div>
                </div>
            </div>

            <InputField label={t('businessName')} value={businessName} onChange={setBusinessName} />
            <InputField label={t('serviceType')} value={serviceType} onChange={setServiceType} />
            <InputField label={t('location')} value={location} onChange={setLocation} />
            <InputField label={t('phone')} value={providerPhone} onChange={setProviderPhone} type="tel" />
         </>
       )}
       <InputField label={t('username')} value={username} onChange={setUsername} />
    </>
  );

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-end sm:items-center" onClick={onClose}>
      <div 
        ref={drawerRef}
        className="bg-surface dark:bg-surfaceDark rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto animate-slide-up sm:animate-fade-in" 
        onClick={(e) => e.stopPropagation()}
      >
        
        <div className="p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-dark dark:text-light">
                    {isRegister ? t('registerTitle') : t('loginTitle')}
                </h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <X size={24} className="text-gray-500" />
                </button>
            </div>

            <div className="mb-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl flex">
                <button onClick={() => setAccountType(AccountType.CLIENT)} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${accountType === AccountType.CLIENT ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
                    {t('client')}
                </button>
                <button onClick={() => setAccountType(AccountType.PROVIDER)} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${accountType === AccountType.PROVIDER ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
                    {t('provider')}
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {accountType === AccountType.CLIENT ? renderClientFields() : renderProviderFields()}
              <InputField label={t('password')} value={password} onChange={setPassword} type="password" />
              
              {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-300 text-sm rounded-lg text-center">{error}</div>}
              
              <button type="submit" disabled={isLoading} className="w-full text-white bg-primary hover:bg-primaryDark font-bold rounded-xl text-base px-5 py-3.5 text-center shadow-lg shadow-primary/25 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? t('loading') : (isRegister ? t('registerButton') : t('loginButton'))}
              </button>
            </form>

            <div className="mt-6 text-center pt-4 border-t border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isRegister ? t('haveAccount') : t('noAccount')}{' '}
                <button onClick={() => setIsRegister(!isRegister)} className="font-bold text-secondary hover:text-primary transition-colors">
                  {isRegister ? t('loginButton') : t('registerButton')}
                </button>
              </p>
            </div>
        </div>
      </div>
    </div>
    {showSuccessModal && (
        <RegistrationSuccessModal 
            onClose={() => {
                setShowSuccessModal(false);
                onClose();
            }} 
        />
    )}
    </>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<UserView>(UserView.CLIENT);
  const [language, setLanguage] = useState<Language>(Language.AR);
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [showAuthDrawer, setShowAuthDrawer] = useState(false);
  const [showAppointmentsDrawer, setShowAppointmentsDrawer] = useState(false);
  const [showDbSetup, setShowDbSetup] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  
  // New Drawers & State
  const [showProviderDirectory, setShowProviderDirectory] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined' && localStorage.theme) return localStorage.theme;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });

  const t = (key: keyof typeof translations) => {
    return translations[key]?.[language] || translations[key]?.[Language.EN] || key;
  };

  useEffect(() => {
    const checkUser = async () => {
      setIsLoadingUser(true);
      const userId = localStorage.getItem('tangerconnect_user_id');
      const userType = localStorage.getItem('tangerconnect_user_type');
      
      if (userId && userType) {
        try {
          if (userType === AccountType.CLIENT) {
            const { data, error } = await supabase.from('clients').select('id, full_name, phone').eq('id', parseInt(userId, 10)).single();
            if (error) throw error;
            if (data) setCurrentUser({ id: data.id, name: data.full_name, accountType: AccountType.CLIENT, phone: data.phone });
          } else if (userType === AccountType.PROVIDER) {
            const { data, error } = await supabase.from('providers').select('id, name, username, is_active, subscription_end_date, bio, profile_image_url').eq('id', parseInt(userId, 10)).single();
            if (data) {
                setCurrentUser({ 
                    id: data.id, 
                    name: data.name, 
                    accountType: AccountType.PROVIDER, 
                    username: data.username, 
                    isActive: data.is_active,
                    subscriptionEndDate: data.subscription_end_date,
                    bio: data.bio,
                    profile_image_url: data.profile_image_url
                });
                setView(UserView.PROVIDER);
            }
          }
        } catch (error) {
          console.error("Session check failed", error);
        }
      }
      setIsLoadingUser(false);
    };
    checkUser();
  }, []);

  // Fetch Notification Count for Client
  useEffect(() => {
      if(currentUser?.accountType === AccountType.CLIENT) {
           const fetchCount = async () => {
               const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
               const tomorrowStr = tomorrow.toISOString().split('T')[0];
               
               const { count: apptCount } = await supabase.from('follow_ups').select('id', {count: 'exact'})
               .eq('client_id', currentUser.id)
               .gte('next_appointment_date', tomorrowStr)
               .lt('next_appointment_date', new Date(tomorrow.getTime() + 86400000).toISOString());

               // For demo: randomly add 1-3 "new announcements" since we don't have a read-status table
               const randomAnnouncements = Math.floor(Math.random() * 2); 
               
               setNotificationCount((apptCount || 0) + randomAnnouncements);
           }
           fetchCount();
      }
  }, [currentUser]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === Language.AR ? 'rtl' : 'ltr';
    document.body.className = language === Language.AR ? 'font-arabic' : 'font-sans';
  }, [language]);
  
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  
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

  const Header = () => {
    const { t } = useLocalization();
    
    let statusBadge = null;
    if (currentUser?.accountType === AccountType.PROVIDER) {
        const isValid = currentUser.isActive && currentUser.subscriptionEndDate && new Date(currentUser.subscriptionEndDate) > new Date();
        statusBadge = (
             <span className={`ml-2 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                 isValid 
                 ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' 
                 : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
             }`}>
                 {isValid ? t('statusActive') : t('statusPending')}
             </span>
        );
    }

    return (
      <header className="fixed top-0 left-0 right-0 bg-surface/80 dark:bg-dark/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 z-40 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
            {/* Logo & Title */}
            <div className="flex items-center gap-2.5">
                <div className="bg-gradient-to-br from-primary to-secondary p-1.5 rounded-lg shadow-lg shadow-primary/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                </div>
                <h1 className="text-lg md:text-xl font-bold text-dark dark:text-light tracking-tight">
                    Tanger<span className="text-primary">Connect</span>
                </h1>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
                {currentUser ? (
                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 pl-1 pr-4 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                        <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm overflow-hidden">
                             {currentUser.profile_image_url ? (
                                <img src={currentUser.profile_image_url} className="w-full h-full object-cover" />
                             ) : (
                                currentUser.name.charAt(0).toUpperCase()
                             )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-dark dark:text-light leading-none">{currentUser.name}</span>
                            <span className="text-[10px] text-gray-500 uppercase">{currentUser.accountType}</span>
                        </div>
                        {statusBadge}
                    </div>
                ) : (
                    <button onClick={() => setShowAuthDrawer(true)} className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-full hover:bg-primaryDark transition-all shadow-md shadow-primary/20 font-medium text-sm">
                        <LogIn size={16} /> {t('loginRegister')}
                    </button>
                )}

                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

                {currentUser?.accountType === AccountType.CLIENT && (
                    <>
                        <button onClick={() => setShowProviderDirectory(true)} className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-full transition-colors relative" title={t('providerDirectory')}>
                            <Users size={20} />
                        </button>
                        <button onClick={() => setShowNotifications(true)} className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-full transition-colors relative" title={t('notifications')}>
                            <Bell size={20} />
                            {notificationCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">{notificationCount}</span>}
                        </button>
                        <button onClick={() => setShowAppointmentsDrawer(true)} className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-full transition-colors" title={t('myAppointments')}>
                            <CalendarDays size={20} />
                        </button>
                    </>
                )}
                
                <button onClick={() => setShowDbSetup(true)} className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-full transition-colors">
                    <Database size={20} />
                </button>

                <button onClick={toggleTheme} className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-full transition-colors">
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>

                <div className="relative group">
                    <button className="flex items-center gap-1 p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-full transition-colors">
                        <Globe size={20} />
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden hidden group-hover:block animate-fade-in">
                        {[Language.AR, Language.EN, Language.FR].map(lang => (
                            <button key={lang} onClick={() => setLanguage(lang)} className={`w-full text-left rtl:text-right px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${language === lang ? 'text-primary font-bold' : 'text-gray-600 dark:text-gray-300'}`}>
                                {lang === Language.AR ? 'العربية' : lang === Language.EN ? 'English' : 'Français'}
                            </button>
                        ))}
                    </div>
                </div>

                <button onClick={() => setView(view === UserView.CLIENT ? UserView.PROVIDER : UserView.CLIENT)} className="ml-2 flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary hover:bg-secondary hover:text-white rounded-full transition-all font-medium text-sm">
                    {view === UserView.CLIENT ? <CheckSquare size={16} /> : <UserIcon size={16} />}
                    <span>{view === UserView.CLIENT ? t('providerView') : t('clientView')}</span>
                </button>

                {currentUser && (
                     <button onClick={handleLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors">
                        <LogOut size={20} />
                    </button>
                )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
                {currentUser?.accountType === AccountType.CLIENT && (
                     <button onClick={() => setShowNotifications(true)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-primary relative">
                        <Bell size={20} />
                         {notificationCount > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>}
                     </button>
                )}
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-dark dark:text-light hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
            <div className="md:hidden absolute top-16 left-0 w-full bg-surface dark:bg-surfaceDark border-b border-gray-200 dark:border-gray-800 shadow-2xl animate-slide-up z-50">
                <div className="p-4 space-y-4">
                    {currentUser ? (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                             <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg overflow-hidden">
                                {currentUser.profile_image_url ? <img src={currentUser.profile_image_url} className="w-full h-full object-cover"/> : currentUser.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="font-bold text-dark dark:text-light">{currentUser.name}</div>
                                <div className="text-xs text-gray-500">{currentUser.accountType}</div>
                            </div>
                            {statusBadge}
                        </div>
                    ) : (
                         <button onClick={() => {setShowAuthDrawer(true); setMobileMenuOpen(false);}} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20">
                            <LogIn size={18} /> {t('loginRegister')}
                        </button>
                    )}
                    
                    {currentUser?.accountType === AccountType.CLIENT && (
                        <>
                        <button onClick={() => {setShowProviderDirectory(true); setMobileMenuOpen(false);}} className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl text-sm text-gray-600 dark:text-gray-300">
                            <Users size={18}/> {t('providerDirectory')}
                        </button>
                        <button onClick={() => {setShowAppointmentsDrawer(true); setMobileMenuOpen(false);}} className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl text-sm text-gray-600 dark:text-gray-300">
                            <CalendarDays size={18}/> {t('myAppointments')}
                        </button>
                        </>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                         <button onClick={() => {setView(view === UserView.CLIENT ? UserView.PROVIDER : UserView.CLIENT); setMobileMenuOpen(false);}} className="flex items-center justify-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-xl font-medium text-sm text-dark dark:text-light">
                            {view === UserView.CLIENT ? <CheckSquare size={18} className="text-secondary" /> : <UserIcon size={18} className="text-secondary" />}
                            <span>{view === UserView.CLIENT ? t('providerView') : t('clientView')}</span>
                        </button>
                        <button onClick={toggleTheme} className="flex items-center justify-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-xl font-medium text-sm text-dark dark:text-light">
                            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700 rounded-xl">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2"><Globe size={18} /> Language</span>
                        <select value={language} onChange={(e) => setLanguage(e.target.value as Language)} className="bg-transparent font-bold text-primary outline-none">
                            <option value={Language.AR}>العربية</option>
                            <option value={Language.EN}>English</option>
                            <option value={Language.FR}>Français</option>
                        </select>
                    </div>

                    <button onClick={() => {setShowDbSetup(true); setMobileMenuOpen(false);}} className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl text-sm text-gray-600 dark:text-gray-300 transition-colors">
                        <Database size={18} /> {t('databaseSetupTitle')}
                    </button>

                    {currentUser && (
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl font-bold text-sm">
                            <LogOut size={18} /> {t('logout')}
                        </button>
                    )}
                </div>
            </div>
        )}
      </header>
    );
  };

  const ProviderLoginPrompt = () => {
    const { t } = useLocalization();
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
            <UserIcon size={40} className="text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-dark dark:text-light mb-3">{t('providerLoginTitle')}</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs mx-auto">{t('pleaseLoginAsProvider')}</p>
        <button onClick={() => setShowAuthDrawer(true)} className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl hover:bg-primaryDark transition-all shadow-lg shadow-primary/20 font-bold">
            <LogIn size={20} />
            {t('loginRegister')}
        </button>
      </div>
    );
  };

  const TechSupportButton = () => {
      const { t } = useLocalization();
      return (
          <a 
            href="https://wa.me/212617774846" 
            target="_blank" 
            rel="noreferrer"
            className="fixed bottom-6 right-6 z-30 bg-green-500 text-white p-3 rounded-full shadow-lg shadow-green-500/30 hover:bg-green-600 hover:scale-110 transition-all flex items-center gap-2 group"
          >
              <MessageCircle size={24} />
              <span className="hidden group-hover:block whitespace-nowrap font-bold text-sm pr-2">{t('techSupport')}</span>
          </a>
      );
  };

  if (showSplash) {
      return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <LocalizationProvider language={language}>
      <DatabaseSetup isOpen={showDbSetup} onClose={() => setShowDbSetup(false)} />
      <AuthDrawer 
        isOpen={showAuthDrawer} 
        onClose={() => setShowAuthDrawer(false)} 
        onAuthSuccess={handleAuthSuccess}
        onDatabaseError={() => {
            setShowAuthDrawer(false);
            setShowDbSetup(true);
        }}
      />
      <ProviderDirectory isOpen={showProviderDirectory} onClose={() => setShowProviderDirectory(false)} currentUser={currentUser}/>
      <NotificationCenter isOpen={showNotifications} onClose={() => setShowNotifications(false)} currentUser={currentUser}/>
      
       {currentUser?.accountType === AccountType.CLIENT && (
         <AppointmentsDrawer 
            isOpen={showAppointmentsDrawer} 
            onClose={() => setShowAppointmentsDrawer(false)} 
            user={currentUser} 
        />
      )}
      <div className="bg-light dark:bg-dark min-h-screen flex flex-col relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none z-0"></div>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-secondary/10 rounded-full blur-3xl pointer-events-none z-0"></div>
        <div className="absolute top-40 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none z-0"></div>

        <Header />
        
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 pt-20 pb-6 z-10 flex flex-col">
          {view === UserView.CLIENT ? (
            <Chatbot 
              currentUser={currentUser} 
              setCurrentUser={setCurrentUser} 
              isLoadingUser={isLoadingUser}
            />
          ) : view === UserView.PROVIDER && currentUser?.accountType === AccountType.PROVIDER ? (
                 <ProviderPortal provider={currentUser} onLogout={handleLogout} />
          ) : (
            <ProviderLoginPrompt />
          )}
        </main>
        
        <TechSupportButton />
        
        <footer className="w-full py-6 text-center text-gray-400 dark:text-gray-600 text-xs z-10">
          <p>&copy; 2025 {t('appName')} - Built for Tangier</p>
        </footer>
      </div>
    </LocalizationProvider>
  );
};

export default App;