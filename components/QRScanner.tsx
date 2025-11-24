
import React, { useState, useRef, useEffect } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { BookingDetails, FollowUp, AuthenticatedUser, ProviderService, ProviderNotification } from '../types';
import { supabase } from '../services/supabaseClient';
import { CheckCircle, XCircle, Camera, Loader2, Upload, Send, LogOut, User, Calendar, FileText, Lock, Phone, X, RefreshCw, BarChart, History, Users, Edit, Trash, Smartphone, MessageCircle, MapPin, Briefcase, Save, Image as ImageIcon, Map, Bell, Clock, AlertTriangle } from 'lucide-react';
import jsQR from 'jsqr';

interface ScannedAppointment extends BookingDetails {}

// --- Sub-Components ---

const RestrictedGuard: React.FC<{ provider: AuthenticatedUser; children: React.ReactNode }> = ({ provider, children }) => {
    const { t } = useLocalization();
    const [daysRemaining, setDaysRemaining] = useState(0);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (provider.subscriptionEndDate) {
            const end = new Date(provider.subscriptionEndDate);
            const now = new Date();
            const diff = end.getTime() - now.getTime();
            const days = Math.ceil(diff / (1000 * 3600 * 24));
            setDaysRemaining(days);
            setIsExpired(days <= 0);
        } else {
            setIsExpired(true);
        }
    }, [provider.subscriptionEndDate]);

    if (isExpired) {
         return (
             <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-xl border-2 border-red-100">
                 <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
                    <Lock size={48} className="text-red-500" />
                 </div>
                 <h3 className="text-2xl font-bold mb-2 dark:text-white text-red-600">{t('subscriptionExpired')}</h3>
                 <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-sm">{t('accountLockedDesc')}</p>
                 <a href="https://wa.me/212617774846" target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-green-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-600 shadow-lg shadow-green-200">
                     <MessageCircle size={24} /> {t('renewNow')}
                 </a>
                 <div className="mt-4 text-sm font-bold text-gray-400">Admin: 0617774846</div>
             </div>
         );
    }

    return (
        <div className="relative">
             {daysRemaining <= 4 && (
                 <div className="mb-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 p-4 rounded-xl flex items-center gap-3">
                     <AlertTriangle className="text-amber-500 flex-shrink-0" />
                     <div>
                         <p className="font-bold text-amber-800 dark:text-amber-300">{t('subscriptionWarning')}</p>
                         <p className="text-xs text-amber-700 dark:text-amber-400">{t('daysLeft', {days: daysRemaining})}</p>
                     </div>
                 </div>
             )}
            {children}
        </div>
    );
};

const StatsComponent: React.FC<{ providerId: number }> = ({ providerId }) => {
    const { t } = useLocalization();
    const [count, setCount] = useState(0);
    useEffect(() => {
        const fetchStats = async () => {
            const today = new Date().toISOString().split('T')[0];
            const { count } = await supabase.from('scan_history').select('id', { count: 'exact' }).eq('provider_id', providerId).gte('created_at', today);
            setCount(count || 0);
        };
        fetchStats();
    }, [providerId]);

    return (
        <div className="bg-gradient-to-br from-primary to-primaryDark text-white p-6 rounded-3xl shadow-lg mb-6">
            <h4 className="text-lg font-bold flex items-center gap-2 opacity-90"><BarChart size={20}/> {t('statistics')}</h4>
            <div className="mt-2">
                <span className="text-4xl font-bold">{count}</span>
                <span className="text-sm opacity-80 ml-2">{t('clientsToday')}</span>
            </div>
        </div>
    );
};

const ProviderNotifications: React.FC<{ providerId: number }> = ({ providerId }) => {
    const { t } = useLocalization();
    const [notifs, setNotifs] = useState<ProviderNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifs = async () => {
        const { data } = await supabase.from('provider_notifications').select('*').eq('provider_id', providerId).order('created_at', { ascending: false }).limit(20);
        if (data) {
            setNotifs(data as ProviderNotification[]);
            setUnreadCount(data.filter((n: any) => !n.is_read).length);
        }
    };

    useEffect(() => { fetchNotifs(); }, [providerId]);

    const markAsRead = async (id: number) => {
        await supabase.from('provider_notifications').update({ is_read: true }).eq('id', id);
        fetchNotifs();
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 relative max-h-96 overflow-y-auto">
             <div className="absolute top-6 right-6 flex items-center gap-2">
                {unreadCount > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>}
            </div>
            <h4 className="font-bold mb-4 flex items-center gap-2 dark:text-white"><Bell size={20}/> {t('providerNotifications')}</h4>
            <div className="space-y-3">
                {notifs.map(n => (
                    <div key={n.id} onClick={() => markAsRead(n.id)} className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${n.is_read ? 'bg-gray-50 dark:bg-gray-700' : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800'}`}>
                         <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${n.is_read ? 'bg-gray-300' : 'bg-blue-500'}`}></div>
                         <div>
                             <p className="text-sm dark:text-white">{n.message}</p>
                             <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                         </div>
                    </div>
                ))}
                {notifs.length === 0 && <p className="text-center text-gray-400 text-sm py-4">{t('noNotifications')}</p>}
            </div>
        </div>
    );
};

const ScanHistory: React.FC<{ providerId: number }> = ({ providerId }) => {
    const { t } = useLocalization();
    const [history, setHistory] = useState<any[]>([]);
    
    useEffect(() => {
        supabase.from('scan_history').select('*').eq('provider_id', providerId).order('created_at', { ascending: false }).limit(20)
        .then(({ data }) => {
             setHistory(data || []);
        });
    }, [providerId]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 relative">
            <h4 className="font-bold mb-4 flex items-center gap-2 dark:text-white"><History size={20}/> {t('scanHistory')}</h4>
            <div className="space-y-3">
                {history.map(h => (
                    <div key={h.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <div>
                            <p className="font-bold text-sm dark:text-white">{h.client_name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{h.client_phone}</p>
                        </div>
                        <div className="text-xs text-gray-400">{new Date(h.created_at).toLocaleDateString()}</div>
                    </div>
                ))}
                {history.length === 0 && <p className="text-center text-gray-400 text-sm py-4">{t('noNotifications')}</p>}
            </div>
        </div>
    );
};

const ClientList: React.FC<{ providerId: number }> = ({ providerId }) => {
    const { t } = useLocalization();
    const [clients, setClients] = useState<any[]>([]);
    const [newCount, setNewCount] = useState(0);

    useEffect(() => {
        const fetchClients = async () => {
            const { data } = await supabase.from('follows').select('client_id, created_at, clients(full_name, phone)').eq('provider_id', providerId);
            if (data) {
                setClients(data.map(d => d.clients));
                const today = new Date().toISOString().split('T')[0];
                setNewCount(data.filter(d => d.created_at >= today).length);
            }
        };
        fetchClients();
    }, [providerId]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-full relative">
            <div className="absolute top-6 right-6 flex items-center gap-2">
                {newCount > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{newCount} New</span>}
            </div>
            <h4 className="font-bold mb-4 flex items-center gap-2 dark:text-white"><Users size={20}/> {t('followers')}</h4>
            <div className="space-y-3 max-h-80 overflow-y-auto">
                {clients.map((c, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <div>
                            <p className="font-bold text-sm dark:text-white">{c.full_name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{c.phone}</p>
                        </div>
                        <div className="flex gap-2">
                            <a href={`tel:${c.phone}`} className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200"><Phone size={16}/></a>
                            <a href={`https://wa.me/${c.phone.replace(/^0/, '212')}`} target="_blank" rel="noreferrer" className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600"><MessageCircle size={16}/></a>
                        </div>
                    </div>
                ))}
                {clients.length === 0 && <p className="text-center text-gray-400 text-sm py-4">{t('noFollowUps')}</p>}
            </div>
        </div>
    );
};

const AnnouncementManager: React.FC<{ providerId: number }> = ({ providerId }) => {
    const { t } = useLocalization();
    const [ads, setAds] = useState<any[]>([]);
    const [message, setMessage] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isSending, setIsSending] = useState(false);

    const fetchAds = async () => {
        const { data } = await supabase.from('announcements').select('*').eq('provider_id', providerId).order('created_at', { ascending: false });
        setAds(data || []);
    };

    useEffect(() => { fetchAds(); }, [providerId]);

    const handleSend = async () => {
        if (!message.trim()) return;
        setIsSending(true);
        if (editingId) {
            await supabase.from('announcements').update({ message }).eq('id', editingId);
        } else {
            await supabase.from('announcements').insert({ provider_id: providerId, message });
        }
        setMessage(''); setEditingId(null); setIsSending(false); fetchAds();
    };

    const handleDelete = async (id: number) => {
        if(confirm(t('delete') + '?')) {
            await supabase.from('announcements').delete().eq('id', id);
            fetchAds();
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h4 className="font-bold mb-4 flex items-center gap-2 dark:text-white"><Send size={20}/> {t('sendAnnouncementTitle')}</h4>
            <div className="flex gap-2 mb-6">
                <input 
                    value={message} 
                    onChange={e => setMessage(e.target.value)} 
                    placeholder={t('messagePlaceholder')}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-xl px-4 outline-none dark:text-white"
                />
                <button onClick={handleSend} disabled={isSending} className="bg-primary text-white p-3 rounded-xl hover:bg-primaryDark">
                    {isSending ? <Loader2 className="animate-spin"/> : <Send size={20}/>}
                </button>
            </div>
            <h5 className="text-sm font-bold mb-2 text-gray-500">{t('myActiveAds')}</h5>
            <div className="space-y-2">
                {ads.map(ad => (
                    <div key={ad.id} className="flex justify-between items-center p-3 border border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/30">
                        <p className="text-sm dark:text-gray-300 truncate flex-1">{ad.message}</p>
                        <div className="flex gap-1 ml-2">
                            <button onClick={() => { setMessage(ad.message); setEditingId(ad.id); }} className="p-1 text-blue-500"><Edit size={16}/></button>
                            <button onClick={() => handleDelete(ad.id)} className="p-1 text-red-500"><Trash size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ProfileManager: React.FC<{ provider: AuthenticatedUser }> = ({ provider }) => {
    const { t, language } = useLocalization();
    const [bio, setBio] = useState(provider.bio || '');
    const [services, setServices] = useState<ProviderService[]>([]);
    const [newService, setNewService] = useState({ name: '', price: '', discount: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [successMsg, setSuccessMsg] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Tangier Neighborhoods
    const neighborhoods = t('neighborhoods').split(',').map(s => s.trim());

    const fetchServices = async () => {
        const { data } = await supabase.from('provider_services').select('*').eq('provider_id', provider.id);
        setServices(data || []);
    };

    useEffect(() => { 
        fetchServices(); 
        supabase.from('follows').select('id', { count: 'exact' }).eq('provider_id', provider.id)
        .then(({count}) => setFollowerCount(count || 0));
    }, [provider.id]);

    const showSuccess = (msg: string) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 3000);
    }

    const handleUpdateProfile = async () => {
        setIsLoading(true);
        await supabase.from('providers').update({ bio }).eq('id', provider.id);
        setIsLoading(false);
        showSuccess(t('savedSuccessfully'));
    };

    const handleNeighborhoodSelect = async (neighborhood: string) => {
        const newLocation = `${neighborhood}, Tanger`;
        await supabase.from('providers').update({ location: newLocation }).eq('id', provider.id);
        showSuccess(t('savedSuccessfully'));
    }

    const handleSetLocation = () => {
        setLocationLoading(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    await supabase.from('providers').update({ latitude, longitude }).eq('id', provider.id);
                    setLocationLoading(false);
                    showSuccess(t('locationSet'));
                }, 
                (error) => {
                    setLocationLoading(false);
                    console.error("GPS Error:", error);
                    let errMsg = t('locationError');
                    if (error.code === 1) errMsg = t('gpsPermissionDenied');
                    else if (error.code === 2) errMsg = t('gpsUnavailable');
                    else if (error.code === 3) errMsg = t('gpsTimeout');
                    alert(errMsg);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            alert(t('locationError'));
            setLocationLoading(false);
        }
    };

    const handleAddService = async () => {
        if (!newService.name || !newService.price) return;
        await supabase.from('provider_services').insert({
            provider_id: provider.id,
            name: newService.name,
            price: parseFloat(newService.price),
            discount_price: newService.discount ? parseFloat(newService.discount) : null
        });
        setNewService({ name: '', price: '', discount: '' });
        fetchServices();
    };

    const handleDeleteService = async (id: number) => {
        await supabase.from('provider_services').delete().eq('id', id);
        fetchServices();
    };
    
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;
        
        setImageLoading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${provider.id}_${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;
            
            // Try uploading to 'profiles' bucket first
            const { error: uploadError } = await supabase.storage.from('profiles').upload(filePath, file);
            
            if (uploadError) {
                console.error("Upload error:", uploadError);
                throw uploadError;
            }

            const { data } = supabase.storage.from('profiles').getPublicUrl(filePath);
            
            await supabase.from('providers').update({ profile_image_url: data.publicUrl }).eq('id', provider.id);
            showSuccess(t('savedSuccessfully'));
        } catch(e: any) { 
            console.error(e);
            alert(t('uploadError') + ` (${e.message})`);
        } finally {
            setImageLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
        }
    };

    const handleRemoveImage = async () => {
         await supabase.from('providers').update({ profile_image_url: null }).eq('id', provider.id);
         showSuccess(t('savedSuccessfully'));
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-full relative">
            {successMsg && (
                <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in z-10">
                    <CheckCircle size={16}/> {successMsg}
                </div>
            )}

            <h4 className="font-bold mb-4 flex items-center gap-2 dark:text-white"><Briefcase size={20}/> {t('profileAndServices')}</h4>
            
            <div className="flex items-center gap-4 mb-6 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                 <div className="text-center">
                     <span className="block text-2xl font-bold text-primary">{followerCount}</span>
                     <span className="text-xs text-gray-500">{t('followers')}</span>
                 </div>
                 <div className="w-px h-10 bg-gray-200 dark:bg-gray-600"></div>
                 <div className="flex-1">
                     <p className="text-sm font-bold dark:text-white">{provider.name}</p>
                     <p className="text-xs text-gray-500">{provider.service_type}</p>
                 </div>
            </div>

            {/* Location */}
            <div className="mb-6 space-y-2">
                <label className="text-xs font-bold text-gray-500">{t('location')}</label>
                <select onChange={(e) => handleNeighborhoodSelect(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl dark:text-white outline-none">
                    <option value="">{t('selectNeighborhood')}</option>
                    {neighborhoods.map((n, i) => <option key={i} value={n}>{n}</option>)}
                </select>
                <button onClick={handleSetLocation} disabled={locationLoading} className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-bold flex justify-center gap-2 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400">
                    {locationLoading ? <Loader2 className="animate-spin"/> : <MapPin/>} {t('setLocation')}
                </button>
            </div>

            {/* Bio & Image */}
            <div className="mb-6">
                <label className="text-xs font-bold text-gray-500 block mb-2">{t('bioLabel')}</label>
                <textarea 
                    value={bio} 
                    onChange={e => setBio(e.target.value)} 
                    className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl dark:text-white"
                    rows={3}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                    <button onClick={() => fileInputRef.current?.click()} disabled={imageLoading} className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center gap-1 text-gray-600 dark:text-gray-300">
                        {imageLoading ? <Loader2 size={14} className="animate-spin"/> : <ImageIcon size={14}/>} {imageLoading ? t('uploading') : t('uploadProfileImage')}
                    </button>
                    {/* ... remove and save buttons ... */}
                    <button onClick={handleRemoveImage} className="text-xs px-3 py-1.5 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center gap-1 text-red-600 dark:text-red-400">
                         <Trash size={14}/> {t('removeImage')}
                    </button>
                    <input type="file" ref={fileInputRef} hidden onChange={handleImageUpload} accept="image/*"/>
                    
                    <button onClick={handleUpdateProfile} disabled={isLoading} className="ml-auto px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm flex items-center gap-1">
                        {isLoading ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} {t('saveProfile')}
                    </button>
                </div>
            </div>

            {/* Services */}
            <div>
                <h5 className="font-bold text-sm mb-2 dark:text-white">{t('addService')}</h5>
                <div className="grid grid-cols-3 gap-2 mb-2">
                    <input placeholder={t('serviceName')} value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} className="col-span-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm"/>
                    <input placeholder={t('price')} type="number" value={newService.price} onChange={e => setNewService({...newService, price: e.target.value})} className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm"/>
                    <input placeholder={t('discountPrice')} type="number" value={newService.discount} onChange={e => setNewService({...newService, discount: e.target.value})} className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm"/>
                    <button onClick={handleAddService} className="bg-primary text-white rounded-lg flex items-center justify-center"><Send size={16}/></button>
                </div>

                <div className="space-y-2 mt-4 max-h-40 overflow-y-auto">
                    {services.map(s => (
                        <div key={s.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-100 dark:border-gray-700">
                            <div>
                                <div className="font-bold text-sm dark:text-white">{s.name}</div>
                                <div className="text-xs">
                                    <span className="line-through text-red-400 mr-2">{s.price} DH</span>
                                    <span className="font-bold text-green-600">{s.discount_price || s.price} DH</span>
                                </div>
                            </div>
                            <button onClick={() => handleDeleteService(s.id)} className="text-red-500"><Trash size={14}/></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const QRScannerComponent: React.FC<{ providerId: number }> = ({ providerId }) => {
    const { t } = useLocalization();
    const [scannedData, setScannedData] = useState<ScannedAppointment | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showScanner, setShowScanner] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const requestRef = useRef<number>();
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { return () => stopCamera(); }, []);
    useEffect(() => { if (showScanner) startCamera(); else stopCamera(); }, [showScanner]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().catch(e => console.error(e));
                    requestRef.current = requestAnimationFrame(scanVideoFrame);
                };
            }
        } catch (err) { setError(t('errorMessage')); setShowScanner(false); }
    };

    const stopCamera = () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        if (videoRef.current && videoRef.current.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const scanVideoFrame = () => {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
                if (code) { handleScanResult({ text: code.data }); return; }
            }
        }
        requestRef.current = requestAnimationFrame(scanVideoFrame);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
                    if (code) {
                        handleScanResult({ text: code.data });
                    } else {
                        setError(t('qrNotDetected'));
                    }
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleScanResult = async (result: { text: string }) => {
        setShowScanner(false); stopCamera(); setIsVerifying(true); setError(null);
        try {
            const data = JSON.parse(result.text);
            if (!data.appointmentId) throw new Error('Invalid');
            const { data: appt } = await supabase.from('appointments').select(`id, clients (full_name, phone), providers (name, service_type)`).eq('id', data.appointmentId).single();
            if (!appt) throw new Error('NotFound');
            
            setScannedData({
                appointmentId: appt.id,
                name: appt.clients.full_name,
                phone: appt.clients.phone,
                service: appt.providers.service_type,
                provider: appt.providers.name,
                location: "",
                discount: "19%",
            });

            // Archive Scan
            await supabase.from('scan_history').insert({
                provider_id: providerId,
                client_name: appt.clients.full_name,
                client_phone: appt.clients.phone
            });

        } catch (e) { setError(t('invalidQR')); }
        finally { setIsVerifying(false); }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 text-center mb-6">
             <h3 className="text-xl font-bold dark:text-white mb-4">{t('qrScannerTitle')}</h3>
             {!showScanner && !scannedData && (
                 <div className="space-y-3">
                     <button onClick={() => setShowScanner(true)} className="w-full bg-dark text-white py-3 rounded-xl font-bold flex justify-center gap-2 hover:bg-black">
                         <Camera/> {t('scanWithCamera')}
                     </button>
                     <p className="text-sm text-gray-400">- OR -</p>
                     <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
                     <button onClick={() => fileInputRef.current?.click()} className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white py-3 rounded-xl font-bold flex justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600">
                         <Upload/> {t('uploadQRImage')}
                     </button>
                 </div>
             )}
             {showScanner && (
                 <div className="relative w-full aspect-square bg-black rounded-xl overflow-hidden">
                     <video ref={videoRef} className="w-full h-full object-cover"/>
                     <button onClick={() => setShowScanner(false)} className="absolute top-2 right-2 bg-white/20 p-2 rounded-full text-white"><X/></button>
                 </div>
             )}
             {scannedData && (
                 <div className="bg-green-50 p-4 rounded-xl mt-4 text-left dark:bg-green-900/20 dark:text-white">
                     <div className="flex items-center gap-2 mb-2 text-green-600 font-bold"><CheckCircle/> {t('verificationSuccess')}</div>
                     <p><b>{t('clientName')}:</b> {scannedData.name}</p>
                     <p><b>{t('discount')}:</b> {scannedData.discount}</p>
                     <button onClick={() => setScannedData(null)} className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg">{t('scanAnother')}</button>
                 </div>
             )}
             {error && <div className="text-red-500 mt-4 font-bold">{error} <button onClick={() => setError(null)} className="underline ml-2">{t('tryAgain')}</button></div>}
             {isVerifying && <Loader2 className="animate-spin mx-auto mt-4 text-primary"/>}
        </div>
    );
};


interface ProviderPortalProps {
    provider: AuthenticatedUser;
    onLogout: () => void;
}

const ProviderPortal: React.FC<ProviderPortalProps> = ({ provider, onLogout }) => {
    const { t } = useLocalization();
    const isValid = provider.isActive && provider.subscriptionEndDate && new Date(provider.subscriptionEndDate) > new Date();

    return (
        <div className="pb-20">
             <div className="flex justify-between items-center mb-6">
                 <div>
                     <h2 className="text-2xl font-bold text-dark dark:text-white">{t('welcomeProvider', {name: provider.name})}</h2>
                     <span className={`text-xs font-bold px-2 py-1 rounded-full ${isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                         {isValid ? t('statusActive') : t('statusPending')}
                     </span>
                 </div>
                 <button onClick={onLogout} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full"><LogOut size={20} className="text-gray-600 dark:text-white"/></button>
             </div>

             <RestrictedGuard provider={provider}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-6">
                         <StatsComponent providerId={provider.id} />
                         <ProviderNotifications providerId={provider.id} />
                         <QRScannerComponent providerId={provider.id} />
                         <ProfileManager provider={provider} />
                     </div>
                     <div className="space-y-6">
                         <AnnouncementManager providerId={provider.id} />
                         <ClientList providerId={provider.id} />
                         <ScanHistory providerId={provider.id} />
                     </div>
                 </div>
             </RestrictedGuard>
        </div>
    );
};

export default ProviderPortal;