
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
import { LogIn, User, MapPin, ShoppingBag, Home, Briefcase, Settings, X, Phone, Globe, LayoutGrid, Heart, List, LogOut, CheckCircle, Edit, Share2, Grid, Bookmark, Menu, Users, Database, Instagram, Facebook, Tag, Sparkles, MessageCircle, Calendar, Bell, Eye, EyeOff, Camera, Loader2, UserPlus, UserCheck, Megaphone, Clock, ArrowLeft } from 'lucide-react';

// --- AUTH MODAL (SEPARATED TABS) ---
const AuthModal: React.FC<{ isOpen: boolean; onClose: () => void; onLogin: (user: AuthenticatedUser) => void }> = ({ isOpen, onClose, onLogin }) => {
    const { t, language } = useLocalization();
    const [isRegister, setIsRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    // Default to CLIENT, user must explicitly switch to PROVIDER
    const [accountType, setAccountType] = useState<AccountType>(AccountType.CLIENT);
    
    const [formData, setFormData] = useState({ phone: '', password: '', name: '', service_type: '', username: '' });

    // Reset form when switching types
    useEffect(() => {
        setFormData({ phone: '', password: '', name: '', service_type: '', username: '' });
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
                
                if (accountType === AccountType.PROVIDER) {
                    payload.service_type = formData.service_type || 'General';
                    // If no username provided, use phone as username fallback
                    payload.username = formData.username || formData.phone; 
                    
                    // CRITICAL: New providers are INACTIVE until approved by Admin
                    // Exception: The specific Admin number stays active for fallback
                    payload.is_active = formData.phone === '0617774846'; 
                }
                
                const { error } = await supabase.from(table).insert(payload);
                if (error) throw error;
                
                if (accountType === AccountType.PROVIDER && payload.phone !== '0617774846') {
                    alert(t('accountPending'));
                    onClose();
                    setLoading(false);
                    return;
                }
                
                // Login immediately if client or admin
                const query = supabase.from(table).select('*');
                if (accountType === AccountType.PROVIDER) query.eq('username', payload.username);
                else query.eq('phone', formData.phone);
                
                const { data } = await query.single();
                if(data) {
                    onLogin({ 
                        id: data.id, 
                        name: data.full_name || data.name, 
                        accountType: accountType, 
                        phone: data.phone, 
                        service_type: data.service_type, 
                        profile_image_url: data.profile_image_url, 
                        username: data.username 
                    });
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
                    alert(t('errorMessage') + " (User not found in " + (accountType === AccountType.CLIENT ? "Client" : "Provider") + " database)");
                    setLoading(false);
                    return;
                }

                if (user.password !== formData.password) {
                     alert(t('passwordError')); 
                     setLoading(false); 
                     return;
                }

                // CHECK ACTIVE STATUS FOR PROVIDERS
                if (accountType === AccountType.PROVIDER && !user.is_active) {
                    alert(t('accountPending'));
                    setLoading(false);
                    return;
                }
                
                // Login Successful
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
                    visits_count: user.visits_count 
                });
            }
        } catch (e: any) { 
            alert(e.message || t('errorMessage')); 
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
                                <div key={p.id} onClick={() => setSelectedProvider(p)} className="bg-white p-4 rounded-2xl shadow-sm border hover:shadow-md transition-all cursor-pointer flex flex-col items-center text-center">
                                    <div className="w-16 h-16 rounded-full bg-gray-200 mb-3 overflow-hidden border">
                                        <img src={p.profile_image_url || `https://ui-avatars.com/api/?name=${p.name}`} className="w-full h-full object-cover"/>
                                    </div>
                                    <h3 className="font-bold text-sm truncate w-full">{p.name}</h3>
                                    <span className="text-xs text-blue-500 font-medium">{p.service_type}</span>
                                    <button className="mt-3 w-full py-1.5 bg-gray-100 rounded-lg text-xs font-bold text-gray-600 hover:bg-black hover:text-white transition-colors">{t('viewQRCode')}</button>
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

// --- CLIENT EDIT PROFILE MODAL ---
const EditClientProfileModal: React.FC<{ user: AuthenticatedUser; onClose: () => void; onUpdateUser: (updates: Partial<AuthenticatedUser>) => void }> = ({ user, onClose, onUpdateUser }) => {
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
            onClose();
        } else alert(t('errorMessage'));
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
}> = ({ user, onLogin, onLogout, isAdmin, onNav, onUpdateUser }) => {
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
                    <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 text-gray-600 rounded-lg"><Settings size={18}/></div>
                            <span className="font-bold">App Settings</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODALS */}
            {showEdit && <EditClientProfileModal user={user} onClose={() => setShowEdit(false)} onUpdateUser={onUpdateUser}/>}
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
    
    // New Admin Dashboard State
    const [showAdminDashboard, setShowAdminDashboard] = useState(false);

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

    if (user?.accountType === AccountType.PROVIDER && userView === UserView.PROVIDER) {
        return (
            <>
                <ProviderPortal provider={user} onLogout={toggleProviderView} onUpdateUser={handleUpdateUser} onNavTo={handleProviderNav} />
                {isAdmin && <AdminDashboard isOpen={showAdminDashboard} onClose={() => setShowAdminDashboard(false)} />}
            </>
        );
    }

    return (
        <div className={`flex flex-col h-screen bg-white ${language === 'ar' ? 'font-arabic' : 'font-sans'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            
            {/* NEW CLEAN HEADER - CONDITIONAL RENDERING */}
            {/* HIDE HEADER IF IN STORE TAB */}
            {!hideBottomNav && activeTab !== 'STORE' && (
                <div className="bg-white/90 backdrop-blur-md border-b border-gray-100 p-3 flex justify-between items-center z-20 h-16 sticky top-0 shadow-sm animate-fade-in">
                    
                    {/* Notification Bell */}
                    <div className="w-10">
                        <button onClick={() => user && setShowClientNotifs(true)} className="relative inline-block p-1">
                            <Bell size={24} className="text-gray-700"/>
                            {unreadNotifs > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse border border-white font-bold">{unreadNotifs}</span>}
                        </button>
                    </div>

                    {/* Logo - JUST TEXT AS REQUESTED */}
                    <div className="flex items-center justify-center">
                        <h1 className="font-black text-xl tracking-tight bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent">
                            Tanger<span className="font-light text-gray-400">IA</span>
                        </h1>
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
                {activeTab === 'PROFILE' && <ProfileTab user={user} onLogin={() => setShowAuth(true)} onLogout={handleLogout} isAdmin={isAdmin} onNav={handleNav} onUpdateUser={handleUpdateUser} />}
            </div>

            {/* BOTTOM NAVIGATION BAR */}
            {/* HIDE NAV IF IN STORE TAB OR CHAT */}
            {!hideBottomNav && activeTab !== 'STORE' && (
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
            <ProviderDirectory isOpen={showDirectory} onClose={() => setShowDirectory(false)} currentUser={user} />
            
            {/* NEW ADMIN DASHBOARD MODAL */}
            {isAdmin && <AdminDashboard isOpen={showAdminDashboard} onClose={() => setShowAdminDashboard(false)} />}
            
            {/* CLIENT NOTIFICATIONS MODAL */}
            {user && <ClientNotificationsModal isOpen={showClientNotifs} onClose={() => setShowClientNotifs(false)} userId={user.id} />}
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
