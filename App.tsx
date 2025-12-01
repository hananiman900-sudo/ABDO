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
// FIXED IMPORTS: Removed non-existent icons
import { Globe, User as UserIcon, CheckSquare, Sun, Moon, LogIn, LogOut, X, CalendarDays, Database, AlertTriangle, CheckCircle2, Menu, Users, Bell, Phone, MapPin, Search, Heart, Briefcase, Star, MessageCircle, ShoppingBag, Eye, EyeOff, Megaphone, Headset, Instagram, Facebook, Link as LinkIcon, ArrowLeft, UserCheck, Home, UserPlus, FileText, ListPlus, UserMinus, RefreshCw, Key, Map, Clock, ChevronRight, Plus, Loader2, Camera, Save, Grid, Building2, LayoutGrid } from 'lucide-react';

// --- REUSABLE COMPONENTS ---

const InputField = ({ label, type = "text", value, onChange, placeholder, icon: Icon }: any) => (
  <div className="space-y-1">
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
        {Icon && <Icon size={18} />}
      </div>
      <input
        type={type}
        className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  </div>
);

const PasswordField = ({ label, value, onChange, placeholder }: any) => {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
          <Key size={18} />
        </div>
        <input
          type={show ? "text" : "password"}
          className="block w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
};

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary via-primaryDark to-dark flex flex-col items-center justify-center z-50 text-white animate-fade-in">
      <div className="relative">
        <div className="absolute inset-0 bg-white/20 blur-xl rounded-full animate-pulse"></div>
        <img src="https://upload.wikimedia.org/wikipedia/commons/d/d4/Tanger_Med_Port.jpg" alt="Tangier" className="w-32 h-32 rounded-full object-cover border-4 border-white/30 shadow-2xl relative z-10 mb-6" />
      </div>
      <h1 className="text-4xl font-black tracking-tighter mb-2">Tanger<span className="text-accent">Connect</span></h1>
      <p className="text-white/80 tracking-widest text-sm uppercase">AI City Assistant</p>
    </div>
  );
};

// --- AUTH COMPONENT ---
const AuthDrawer = ({ isOpen, onClose, onLogin, onRegister }: any) => {
    const { t } = useLocalization();
    const [isRegistering, setIsRegistering] = useState(false);
    const [accountType, setAccountType] = useState<AccountType>(AccountType.CLIENT);
    
    // Form State
    const [phone, setPhone] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    
    // Provider Specific
    const [serviceName, setServiceName] = useState('');
    const [serviceType, setServiceType] = useState('General');
    const [location, setLocation] = useState('');
    
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        if (isRegistering) {
           await onRegister({ phone, username, password, fullName, accountType, serviceName, serviceType, location });
        } else {
           await onLogin({ phone, username, password, accountType });
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative z-10 animate-slide-up flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-primaryDark p-6 text-white text-center relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white"><X/></button>
                    <h2 className="text-2xl font-black mb-1">{isRegistering ? t('registerTitle') : t('loginTitle')}</h2>
                    <p className="text-white/80 text-sm">{t('welcomeMessage').split('!')[0]}!</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    
                    {/* Role Selection */}
                    <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                        <button 
                           onClick={() => setAccountType(AccountType.CLIENT)}
                           className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${accountType === AccountType.CLIENT ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'text-gray-500'}`}
                        >
                            {t('client')}
                        </button>
                        <button 
                           onClick={() => setAccountType(AccountType.PROVIDER)}
                           className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${accountType === AccountType.PROVIDER ? 'bg-white dark:bg-gray-700 shadow-sm text-purple-600' : 'text-gray-500'}`}
                        >
                            {t('provider')}
                        </button>
                    </div>

                    {/* Inputs */}
                    {isRegistering && <InputField label={t('fullName')} value={fullName} onChange={(e:any) => setFullName(e.target.value)} icon={UserIcon} placeholder="John Doe" />}
                    
                    {/* Provider needs Username, Client needs Phone for Login */}
                    {accountType === AccountType.PROVIDER ? (
                        <InputField label={t('username')} value={username} onChange={(e:any) => setUsername(e.target.value)} icon={UserCheck} placeholder="username123" />
                    ) : (
                        <InputField label={t('phone')} value={phone} onChange={(e:any) => setPhone(e.target.value)} icon={Phone} placeholder="06XXXXXXXX" />
                    )}

                    {/* Registration Extras */}
                    {isRegistering && accountType === AccountType.PROVIDER && (
                        <>
                             <InputField label={t('serviceName')} value={serviceName} onChange={(e:any) => setServiceName(e.target.value)} icon={Briefcase} placeholder="Dr. Smith Clinic" />
                             <InputField label={t('location')} value={location} onChange={(e:any) => setLocation(e.target.value)} icon={MapPin} placeholder="Tangier Center" />
                        </>
                    )}

                    <PasswordField label={t('password')} value={password} onChange={(e:any) => setPassword(e.target.value)} placeholder="••••••••" />

                    {/* Action Button */}
                    <button 
                        onClick={handleSubmit} 
                        disabled={loading}
                        className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 flex justify-center items-center gap-2
                        ${accountType === AccountType.PROVIDER ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/30' : 'bg-primary hover:bg-primaryDark shadow-primary/30'}`}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (isRegistering ? t('registerButton') : t('loginButton'))}
                    </button>

                    {/* Toggle Mode */}
                    <div className="text-center">
                        <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm font-bold text-gray-500 hover:text-primary transition-colors">
                            {isRegistering ? t('loginRegister').split(' / ')[0] : t('registerTitle')}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

// --- CLIENT PROFILE VIEW ---
const ClientProfile = ({ isOpen, onClose, user, onLogout, onToggleTheme, isDarkMode, onOpenDbSetup, onUpdateUser }: any) => {
    const { t } = useLocalization();
    const [activeTab, setActiveTab] = useState<'APPOINTMENTS' | 'FOLLOWING'>('APPOINTMENTS');
    const [followingCount, setFollowingCount] = useState(0);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [followedProviders, setFollowedProviders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ fullName: '', bio: '' });
    const [imageLoading, setImageLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if(isOpen && user) {
            fetchData();
            setEditData({ fullName: user.name || '', bio: user.bio || '' });
            setIsEditing(false);
        }
    }, [isOpen, user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch Follows safely
            const { count } = await supabase.from('follows').select('*', { count: 'exact' }).eq('client_id', user.id);
            setFollowingCount(count || 0);

            // Fetch Appointments
            const { data: appData } = await supabase.from('appointments').select('*, providers(name, service_type, location)').eq('client_id', user.id);
            setAppointments(appData || []);

            // Fetch Followed Providers List
            const { data: followData } = await supabase.from('follows').select('providers(*)').eq('client_id', user.id);
            if(followData) setFollowedProviders(followData.map((f:any) => f.providers));
        } catch(e) { console.log("Profile fetch err", e); }
        finally { setLoading(false); }
    }

    const handleSaveProfile = async () => {
        if(!user) return;
        const { error } = await supabase.from('clients').update({ full_name: editData.fullName, bio: editData.bio }).eq('id', user.id);
        if(!error) {
            if(onUpdateUser) onUpdateUser({ ...user, name: editData.fullName, bio: editData.bio });
            setIsEditing(false);
        } else {
            alert(t('errorMessage'));
        }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file || !user) return;
        
        setImageLoading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `client_${user.id}_${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('profiles').upload(fileName, file);
            if (uploadError) throw uploadError;
            
            const { data } = supabase.storage.from('profiles').getPublicUrl(fileName);
            
            await supabase.from('clients').update({ profile_image_url: data.publicUrl }).eq('id', user.id);
            
            if(onUpdateUser) onUpdateUser({ ...user, profile_image_url: data.publicUrl });
        } catch(e) {
            alert(t('uploadError'));
        } finally {
            setImageLoading(false);
        }
    }

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center md:p-4">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
             
             <div className="relative w-full h-[90vh] md:h-auto md:max-h-[85vh] md:max-w-md bg-white dark:bg-gray-900 rounded-t-[2.5rem] md:rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-slide-up">
                 
                 {/* Header Gradient */}
                 <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600 relative">
                      <button onClick={onClose} className="absolute top-4 right-4 bg-black/20 text-white p-2 rounded-full hover:bg-black/40"><X size={20}/></button>
                 </div>

                 <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 pb-20 -mt-12 rounded-t-[2.5rem] relative z-10">
                     <div className="px-6 pt-0 pb-4">
                         {/* Avatar & Stats Row */}
                         <div className="flex justify-between items-end -mt-10 mb-4 px-2">
                             {/* Avatar */}
                             <div className="relative cursor-pointer" onClick={() => isEditing && fileInputRef.current?.click()}>
                                 <div className="w-24 h-24 rounded-full p-1 bg-white dark:bg-gray-900 shadow-xl">
                                     <div className="w-full h-full rounded-full overflow-hidden relative bg-gray-200">
                                         {user.profile_image_url ? (
                                             <img src={user.profile_image_url} className="w-full h-full object-cover"/>
                                         ) : (
                                             <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100 dark:bg-gray-800"><UserIcon size={32}/></div>
                                         )}
                                         {imageLoading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="animate-spin text-white"/></div>}
                                     </div>
                                 </div>
                                 {isEditing && (
                                     <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full border-2 border-white dark:border-gray-900 z-10 shadow-sm">
                                         <Camera size={14} />
                                     </div>
                                 )}
                                 <input type="file" hidden ref={fileInputRef} onChange={handleImageUpload} accept="image/*" />
                             </div>

                             {/* Stats */}
                             <div className="flex gap-6 mb-2">
                                <div className="text-center" onClick={() => setActiveTab('FOLLOWING')}>
                                    <p className="font-black text-xl dark:text-white">{followingCount}</p>
                                    <p className="text-xs text-gray-500 font-bold">{t('followingProviders')}</p>
                                </div>
                                <div className="text-center" onClick={() => setActiveTab('APPOINTMENTS')}>
                                    <p className="font-black text-xl dark:text-white">{appointments.length}</p>
                                    <p className="text-xs text-gray-500 font-bold">{t('upcomingAppointments')}</p>
                                </div>
                             </div>
                         </div>

                         {/* Name & Bio */}
                         <div className="mb-6 px-2">
                             {isEditing ? (
                                 <div className="space-y-3">
                                     <input value={editData.fullName} onChange={e => setEditData({...editData, fullName: e.target.value})} className="w-full font-bold text-xl bg-gray-50 dark:bg-gray-800 p-2 rounded-lg dark:text-white border-none outline-none" placeholder={t('fullName')}/>
                                     <textarea value={editData.bio} onChange={e => setEditData({...editData, bio: e.target.value})} className="w-full text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded-lg dark:text-white border-none outline-none resize-none" rows={2} placeholder="Add a bio..."/>
                                     <div className="flex gap-2">
                                         <button onClick={handleSaveProfile} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold text-sm">{t('save')}</button>
                                         <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-bold text-sm dark:text-white">{t('cancel')}</button>
                                     </div>
                                 </div>
                             ) : (
                                 <>
                                     <h2 className="text-2xl font-bold dark:text-white">{user.name}</h2>
                                     <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{user.bio || "No bio yet."}</p>
                                     <button onClick={() => setIsEditing(true)} className="mt-4 w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white py-2 rounded-lg font-bold text-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                         {t('edit')} {t('myProfile')}
                                     </button>
                                 </>
                             )}
                         </div>

                         {/* Tabs Header */}
                         <div className="flex border-b border-gray-200 dark:border-gray-800 mb-4">
                             <button onClick={() => setActiveTab('APPOINTMENTS')} className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'APPOINTMENTS' ? 'border-black dark:border-white text-black dark:text-white' : 'border-transparent text-gray-400'}`}>
                                 <CalendarDays size={18} className="mx-auto mb-1"/>
                             </button>
                             <button onClick={() => setActiveTab('FOLLOWING')} className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'FOLLOWING' ? 'border-black dark:border-white text-black dark:text-white' : 'border-transparent text-gray-400'}`}>
                                 <Users size={18} className="mx-auto mb-1"/>
                             </button>
                         </div>

                         {/* Content Grid */}
                         <div className="grid grid-cols-1 gap-4">
                             {activeTab === 'APPOINTMENTS' ? (
                                 appointments.length > 0 ? appointments.map((app) => (
                                     <div key={app.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl flex items-center justify-between border border-gray-100 dark:border-gray-700">
                                         <div>
                                             <h4 className="font-bold dark:text-white">{app.providers?.service_type}</h4>
                                             <p className="text-xs text-gray-500">{app.providers?.name}</p>
                                             <p className="text-[10px] text-gray-400 mt-1">{new Date(app.created_at).toLocaleDateString()}</p>
                                         </div>
                                         <div className="text-right">
                                             <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-md text-xs font-bold mb-1">Confirmed</div>
                                             <QRCodeDisplay appointmentId={app.id} />
                                         </div>
                                     </div>
                                 )) : <p className="text-center text-gray-400 py-10 text-sm">{t('noAppointments')}</p>
                             ) : (
                                 followedProviders.length > 0 ? followedProviders.map((prov) => (
                                     <div key={prov.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                                          <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold">
                                              {prov.profile_image_url ? <img src={prov.profile_image_url} className="w-full h-full rounded-full object-cover"/> : prov.name?.[0]}
                                          </div>
                                          <div>
                                              <h4 className="font-bold text-sm dark:text-white">{prov.name}</h4>
                                              <p className="text-xs text-gray-500">{prov.service_type}</p>
                                          </div>
                                     </div>
                                 )) : <p className="text-center text-gray-400 py-10 text-sm">Not following anyone yet.</p>
                             )}
                         </div>
                     </div>
                 </div>
                 
                 {/* Footer Settings */}
                 <div className="absolute bottom-0 w-full bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700 p-4 flex justify-between items-center z-20">
                     <div className="flex gap-2">
                        <button onClick={onToggleTheme} className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm text-gray-600 dark:text-gray-300">
                            {isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}
                        </button>
                        <button onClick={onOpenDbSetup} className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm text-gray-600 dark:text-gray-300">
                            <Database size={20}/>
                        </button>
                     </div>
                     <button onClick={onLogout} className="flex items-center gap-2 text-red-500 font-bold text-sm px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                         <LogOut size={16}/> {t('logout')}
                     </button>
                 </div>
            </div>
        </div>
    )
}

// --- PROVIDER DIRECTORY MODAL ---
const ProviderDirectory = ({ isOpen, onClose, currentUser }: any) => {
    const { t } = useLocalization();
    const [providers, setProviders] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [selectedProvider, setSelectedProvider] = useState<any | null>(null);
    const [activeTab, setActiveTab] = useState<'SERVICES' | 'POSTS'>('SERVICES');
    const [loading, setLoading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);

    useEffect(() => {
        if (isOpen) fetchProviders();
    }, [isOpen]);

    useEffect(() => {
        if(selectedProvider && currentUser) checkFollowStatus();
    }, [selectedProvider, currentUser]);

    const fetchProviders = async () => {
        setLoading(true);
        const { data } = await supabase.from('providers').select('*, provider_services(*), announcements(*)').eq('is_active', true);
        setProviders(data || []);
        setLoading(false);
    }

    const checkFollowStatus = async () => {
        const { data } = await supabase.from('follows').select('*').eq('client_id', currentUser.id).eq('provider_id', selectedProvider.id).single();
        setIsFollowing(!!data);
    }

    const handleFollow = async () => {
        if(!currentUser) return;
        if(isFollowing) {
            await supabase.from('follows').delete().eq('client_id', currentUser.id).eq('provider_id', selectedProvider.id);
            setIsFollowing(false);
        } else {
            await supabase.from('follows').insert({ client_id: currentUser.id, provider_id: selectedProvider.id });
            setIsFollowing(true);
        }
    }

    const filtered = providers.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.service_type.toLowerCase().includes(search.toLowerCase()));

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-100 dark:bg-gray-900 w-full max-w-4xl h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-slide-up">
                
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700 flex justify-between items-center">
                     <h2 className="text-xl font-bold dark:text-white flex items-center gap-2"><LayoutGrid className="text-purple-600"/> {t('providerDirectory')}</h2>
                     <button onClick={onClose}><X className="dark:text-white"/></button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {selectedProvider ? (
                        <div className="bg-white dark:bg-gray-900 min-h-full">
                             {/* Profile Header */}
                             <div className="p-6 text-center border-b dark:border-gray-800 relative">
                                 <button onClick={() => setSelectedProvider(null)} className="absolute top-4 left-4 text-gray-500 bg-gray-100 dark:bg-gray-800 p-2 rounded-full"><ArrowLeft/></button>
                                 <div className="w-24 h-24 mx-auto bg-purple-100 rounded-full mb-4 overflow-hidden border-4 border-white shadow-lg">
                                     {selectedProvider.profile_image_url ? (
                                         <img src={selectedProvider.profile_image_url} className="w-full h-full object-cover"/>
                                     ) : (
                                         <div className="w-full h-full flex items-center justify-center text-purple-600 font-bold text-3xl">{selectedProvider.name[0]}</div>
                                     )}
                                 </div>
                                 <h1 className="text-2xl font-black dark:text-white mb-1">{selectedProvider.name}</h1>
                                 <p className="text-purple-600 font-bold text-sm mb-4">{selectedProvider.service_type}</p>
                                 
                                 {/* Stats Row */}
                                 <div className="flex justify-center gap-8 mb-6 border-y border-gray-100 dark:border-gray-800 py-4">
                                     <div className="text-center">
                                         <span className="block font-bold text-lg dark:text-white">1.2k</span>
                                         <span className="text-xs text-gray-500">Followers</span>
                                     </div>
                                     <div className="text-center">
                                         <span className="block font-bold text-lg dark:text-white">4.8</span>
                                         <span className="text-xs text-gray-500">Rating</span>
                                     </div>
                                     <div className="text-center">
                                         <span className="block font-bold text-lg dark:text-white">{selectedProvider.provider_services?.length || 0}</span>
                                         <span className="text-xs text-gray-500">Services</span>
                                     </div>
                                 </div>

                                 {/* Action Buttons */}
                                 <div className="flex justify-center gap-3 mb-6">
                                     <button 
                                        onClick={handleFollow}
                                        className={`px-8 py-2 rounded-lg font-bold text-sm transition-colors ${isFollowing ? 'bg-gray-100 text-black dark:bg-gray-700 dark:text-white' : 'bg-blue-600 text-white'}`}
                                     >
                                         {isFollowing ? t('unfollow') : t('follow')}
                                     </button>
                                     <button className="px-8 py-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white rounded-lg font-bold text-sm">Message</button>
                                 </div>
                                 
                                 {/* Social Links */}
                                 <div className="flex justify-center gap-4 text-gray-400">
                                     <Instagram size={20} className="hover:text-pink-600 cursor-pointer"/>
                                     <Facebook size={20} className="hover:text-blue-600 cursor-pointer"/>
                                     <Globe size={20} className="hover:text-green-600 cursor-pointer"/>
                                     <MapPin size={20} className="hover:text-red-600 cursor-pointer"/>
                                 </div>
                             </div>

                             {/* Tabs */}
                             <div className="flex border-b dark:border-gray-800">
                                 <button onClick={() => setActiveTab('SERVICES')} className={`flex-1 py-4 font-bold text-sm ${activeTab === 'SERVICES' ? 'border-b-2 border-black dark:border-white text-black dark:text-white' : 'text-gray-400'}`}>{t('services')}</button>
                                 <button onClick={() => setActiveTab('POSTS')} className={`flex-1 py-4 font-bold text-sm ${activeTab === 'POSTS' ? 'border-b-2 border-black dark:border-white text-black dark:text-white' : 'text-gray-400'}`}>{t('posts')}</button>
                             </div>

                             {/* Content */}
                             <div className="p-4 bg-gray-50 dark:bg-gray-900">
                                 {activeTab === 'SERVICES' ? (
                                     <div className="space-y-3">
                                         {selectedProvider.provider_services?.map((s:any) => (
                                             <div key={s.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex justify-between items-center">
                                                 <span className="font-bold dark:text-white">{s.name}</span>
                                                 <div className="text-right">
                                                     {s.discount_price && <span className="text-xs text-gray-400 line-through mr-2">{s.price} DH</span>}
                                                     <span className="font-bold text-green-600">{s.discount_price || s.price} DH</span>
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                 ) : (
                                     <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                         {selectedProvider.announcements?.map((a:any) => (
                                             <div key={a.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm aspect-square flex items-center justify-center text-center">
                                                 <p className="text-sm dark:text-gray-300 line-clamp-4">{a.message}</p>
                                             </div>
                                         ))}
                                     </div>
                                 )}
                             </div>
                        </div>
                    ) : (
                        <div className="p-4">
                            <div className="relative mb-6">
                                <Search className="absolute left-3 top-3 text-gray-400" size={20}/>
                                <input 
                                    value={search} 
                                    onChange={e => setSearch(e.target.value)} 
                                    placeholder={t('searchProviderPlaceholder')} 
                                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm outline-none dark:text-white"
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filtered.map(p => (
                                    <div key={p.id} onClick={() => setSelectedProvider(p)} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow">
                                        <div className="w-16 h-16 bg-purple-100 dark:bg-gray-700 rounded-full overflow-hidden shrink-0">
                                            {p.profile_image_url ? <img src={p.profile_image_url} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center font-bold text-purple-600 text-xl">{p.name[0]}</div>}
                                        </div>
                                        <div>
                                            <h3 className="font-bold dark:text-white text-lg">{p.name}</h3>
                                            <p className="text-purple-600 text-sm font-medium">{p.service_type}</p>
                                            <p className="text-gray-400 text-xs mt-1 flex items-center gap-1"><MapPin size={10}/> {p.location}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// GLOBAL ERROR BOUNDARY for "White Screen" catch
interface ErrorBoundaryProps {
    children: React.ReactNode;
}
interface ErrorBoundaryState {
    hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError(error: any) { return { hasError: true }; }
    componentDidCatch(error: any, errorInfo: any) { console.error("Uncaught error:", error, errorInfo); }
    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-screen p-10 bg-gray-50 text-center">
                    <AlertTriangle size={48} className="text-red-500 mb-4"/>
                    <h2 className="text-xl font-bold mb-2">Oops, something went wrong.</h2>
                    <p className="text-gray-500 mb-6">The application encountered an unexpected error.</p>
                    <button 
                        onClick={() => { localStorage.clear(); window.location.reload(); }} 
                        className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-red-600 transition-colors"
                    >
                        Reset Application
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

// --- MAIN APP COMPONENT (Renamed logic to MainContent) ---

const MainContent: React.FC = () => {
  const { t, language } = useLocalization();
  
  // State
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  
  // Drawer States
  const [showAuth, setShowAuth] = useState(false);
  const [showAppointments, setShowAppointments] = useState(false);
  const [showDbSetup, setShowDbSetup] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [showRealEstate, setShowRealEstate] = useState(false);
  const [showJobBoard, setShowJobBoard] = useState(false);
  const [showDirectory, setShowDirectory] = useState(false);
  const [showClientProfile, setShowClientProfile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Load Session with Safe Parsing
  useEffect(() => {
    const safeLoad = () => {
        try {
            const session = localStorage.getItem('tanger_user');
            const theme = localStorage.getItem('tanger_theme');
            
            if (session) {
                try {
                    const parsedUser = JSON.parse(session);
                    // Validate minimal user structure
                    if (parsedUser && typeof parsedUser === 'object' && parsedUser.id) {
                        setCurrentUser(parsedUser);
                    } else {
                        // Invalid structure
                        localStorage.removeItem('tanger_user');
                    }
                } catch (e) {
                    // JSON error
                    localStorage.removeItem('tanger_user');
                }
            }
            if (theme === 'dark') {
                setIsDarkMode(true);
                document.documentElement.classList.add('dark');
            }
        } catch(e) {
            console.error("Storage critical failure", e);
            // Last resort: clear everything if access fails
            localStorage.clear();
        }
        setLoading(false);
    }
    safeLoad();
  }, []);

  const handleToggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('tanger_theme', newTheme ? 'dark' : 'light');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('tanger_user');
    setShowMobileMenu(false);
  };

  const handleLogin = async (creds: any) => {
      let table = creds.accountType === AccountType.PROVIDER ? 'providers' : 'clients';
      let query = supabase.from(table).select('*');
      
      if(creds.accountType === AccountType.PROVIDER) query = query.eq('username', creds.username);
      else query = query.eq('phone', creds.phone);

      const { data, error } = await query.eq('password', creds.password).single();

      if (error || !data) {
          alert('Invalid credentials');
          return;
      }
      
      const user = { ...data, accountType: creds.accountType };
      setCurrentUser(user);
      localStorage.setItem('tanger_user', JSON.stringify(user));
      setShowAuth(false);
  };

  const handleRegister = async (details: any) => {
      let table = details.accountType === AccountType.PROVIDER ? 'providers' : 'clients';
      let payload: any = { phone: details.phone, password: details.password };
      
      if(details.accountType === AccountType.PROVIDER) {
          payload = { ...payload, name: details.fullName, username: details.username, service_type: details.serviceType, location: details.location };
      } else {
          payload = { ...payload, full_name: details.fullName };
      }

      const { data, error } = await supabase.from(table).insert(payload).select().single();
      
      if(error) {
          alert('Registration failed: ' + error.message);
      } else {
          alert(t('registrationSuccessMessage'));
          const user = { ...data, accountType: details.accountType };
          setCurrentUser(user);
          localStorage.setItem('tanger_user', JSON.stringify(user));
          setShowAuth(false);
      }
  }

  const handleUpdateUser = (updatedUser: AuthenticatedUser) => {
      setCurrentUser(updatedUser);
      localStorage.setItem('tanger_user', JSON.stringify(updatedUser));
  }

  if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

  return (
      <div className={`h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
        
        {/* --- PROFESSIONAL HEADER --- */}
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800 h-16 flex items-center justify-between px-4 md:px-8">
            <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg">T</div>
                 <span className="font-bold text-lg tracking-tight dark:text-white">Tanger<span className="text-blue-600">Connect</span></span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
                 <button onClick={() => setShowDirectory(true)} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors">{t('providerDirectory')}</button>
                 <button onClick={() => setShowRealEstate(true)} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors">{t('realEstateTitle')}</button>
                 <button onClick={() => setShowJobBoard(true)} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors">{t('jobBoardTitle')}</button>
                 <button onClick={() => setShowStore(true)} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors">{t('storeManager')}</button>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
                 <button onClick={handleToggleTheme} className="hidden md:flex p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300">
                     {isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}
                 </button>
                 
                 {currentUser ? (
                     currentUser.accountType === AccountType.CLIENT ? (
                         <button onClick={() => setShowClientProfile(true)} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 transition-colors">
                             <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-300">
                                 {currentUser.profile_image_url ? <img src={currentUser.profile_image_url} className="w-full h-full object-cover"/> : <UserIcon size={16} className="m-1 text-gray-500"/>}
                             </div>
                             <span className="text-sm font-bold dark:text-white max-w-[80px] truncate">{currentUser.name || currentUser.full_name}</span>
                         </button>
                     ) : (
                         <div className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full text-xs font-bold">Provider</div>
                     )
                 ) : (
                     <button onClick={() => setShowAuth(true)} className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-transform">
                         {t('loginButton')}
                     </button>
                 )}
                 
                 {/* Mobile Menu Toggle */}
                 <button onClick={() => setShowMobileMenu(true)} className="md:hidden p-2 -mr-2 text-gray-600 dark:text-white">
                     <Menu size={24}/>
                 </button>
            </div>
        </header>

        {/* --- MAIN CONTENT AREA --- */}
        <main className="flex-1 overflow-y-auto relative">
             {currentUser?.accountType === AccountType.PROVIDER ? (
                 <ProviderPortal provider={currentUser} onLogout={handleLogout} />
             ) : (
                 <Chatbot 
                    currentUser={currentUser} 
                    onOpenAuth={() => setShowAuth(true)}
                 />
             )}
        </main>

        {/* --- MOBILE FULLSCREEN MENU --- */}
        {showMobileMenu && (
            <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-900 flex flex-col animate-fade-in">
                <div className="p-4 flex justify-between items-center border-b dark:border-gray-800">
                    <span className="font-bold text-xl dark:text-white">{t('menu')}</span>
                    <button onClick={() => setShowMobileMenu(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full"><X/></button>
                </div>
                <div className="flex-1 p-6 grid grid-cols-2 gap-4 content-start overflow-y-auto">
                    <button onClick={() => { setShowDirectory(true); setShowMobileMenu(false); }} className="aspect-square bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex flex-col items-center justify-center gap-2 border border-purple-100 dark:border-purple-800">
                        <LayoutGrid size={32} className="text-purple-600"/>
                        <span className="font-bold text-sm dark:text-white text-center">{t('providerDirectory')}</span>
                    </button>
                    <button onClick={() => { setShowRealEstate(true); setShowMobileMenu(false); }} className="aspect-square bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex flex-col items-center justify-center gap-2 border border-orange-100 dark:border-orange-800">
                        <Home size={32} className="text-orange-600"/>
                        <span className="font-bold text-sm dark:text-white text-center">{t('realEstateTitle')}</span>
                    </button>
                    <button onClick={() => { setShowJobBoard(true); setShowMobileMenu(false); }} className="aspect-square bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex flex-col items-center justify-center gap-2 border border-blue-100 dark:border-blue-800">
                        <Briefcase size={32} className="text-blue-600"/>
                        <span className="font-bold text-sm dark:text-white text-center">{t('jobBoardTitle')}</span>
                    </button>
                    <button onClick={() => { setShowStore(true); setShowMobileMenu(false); }} className="aspect-square bg-green-50 dark:bg-green-900/20 rounded-2xl flex flex-col items-center justify-center gap-2 border border-green-100 dark:border-green-800">
                        <ShoppingBag size={32} className="text-green-600"/>
                        <span className="font-bold text-sm dark:text-white text-center">{t('storeManager')}</span>
                    </button>
                    
                    <button onClick={handleToggleTheme} className="col-span-2 p-4 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-between">
                        <span className="font-bold dark:text-white">Dark Mode</span>
                        {isDarkMode ? <Sun/> : <Moon/>}
                    </button>
                    
                    {currentUser && (
                         <button onClick={handleLogout} className="col-span-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 font-bold flex items-center justify-center gap-2 mt-4">
                             <LogOut/> {t('logout')}
                         </button>
                    )}
                </div>
            </div>
        )}

        {/* --- MODALS & DRAWERS --- */}
        <AuthDrawer 
            isOpen={showAuth} 
            onClose={() => setShowAuth(false)} 
            onLogin={handleLogin} 
            onRegister={handleRegister} 
        />
        
        <ClientProfile 
             isOpen={showClientProfile} 
             onClose={() => setShowClientProfile(false)} 
             user={currentUser}
             onLogout={handleLogout}
             onToggleTheme={handleToggleTheme}
             isDarkMode={isDarkMode}
             onOpenDbSetup={() => setShowDbSetup(true)}
             onUpdateUser={handleUpdateUser}
        />

        <ProviderDirectory 
             isOpen={showDirectory}
             onClose={() => setShowDirectory(false)}
             currentUser={currentUser}
        />

        <AppointmentsDrawer 
            isOpen={showAppointments} 
            onClose={() => setShowAppointments(false)} 
            user={currentUser} 
        />
        
        <DatabaseSetup 
            isOpen={showDbSetup} 
            onClose={() => setShowDbSetup(false)} 
        />
        
        <Store 
            isOpen={showStore} 
            onClose={() => setShowStore(false)} 
            currentUser={currentUser} 
            onOpenAuth={() => setShowAuth(true)}
        />
        
        <RealEstate 
            isOpen={showRealEstate}
            onClose={() => setShowRealEstate(false)}
            currentUser={currentUser}
        />

        <JobBoard 
            isOpen={showJobBoard}
            onClose={() => setShowJobBoard(false)}
            currentUser={currentUser}
        />
      </div>
  );
};

// --- APP WRAPPER (Providers) ---
const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <LocalizationProvider language={Language.AR}>
                <MainContent />
            </LocalizationProvider>
        </ErrorBoundary>
    );
}

export default App;