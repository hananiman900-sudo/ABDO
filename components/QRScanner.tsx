
import React, { useState, useRef, useEffect } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { BookingDetails, FollowUp, AuthenticatedUser, ProviderService, ProviderNotification } from '../types';
import { supabase } from '../services/supabaseClient';
import { CheckCircle, XCircle, Camera, Loader2, Upload, Send, LogOut, User, Calendar, FileText, Lock, Phone, X, RefreshCw, BarChart, History, Users, Edit, Trash, Smartphone, MessageCircle, MapPin, Briefcase, Save, Image as ImageIcon, Megaphone } from 'lucide-react';
import jsQR from 'jsqr';

// --- SUB-COMPONENTS ---

const RestrictedGuard: React.FC<{ isActive: boolean; children: React.ReactNode }> = ({ isActive, children }) => {
    const { t } = useLocalization();
    if (isActive) return <>{children}</>;
    return (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg m-4 animate-fade-in">
            <h3 className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2"><Lock size={18}/> {t('subscriptionExpired')}</h3>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">{t('accountLockedDesc')}</p>
            <button className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold shadow-sm">{t('renewNow')}</button>
        </div>
    );
};

const ProviderNotifications: React.FC<{ providerId: number }> = ({ providerId }) => {
    const { t } = useLocalization();
    const [notifications, setNotifications] = useState<ProviderNotification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifs = async () => {
            const { data } = await supabase.from('provider_notifications').select('*').eq('provider_id', providerId).order('created_at', { ascending: false }).limit(10);
            setNotifications(data || []);
            setLoading(false);
        };
        fetchNotifs();
        // Real-time subscription could go here
    }, [providerId]);

    const markAsRead = async (id: number) => {
        await supabase.from('provider_notifications').update({ is_read: true }).eq('id', id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    };

    if (loading) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-purple-500"/></div>;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 h-full">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 dark:text-white"><MessageCircle className="text-purple-500"/> {t('notifications')}</h3>
            {notifications.length === 0 ? (
                <p className="text-gray-400 text-center py-4 text-sm">{t('noNotifications')}</p>
            ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {notifications.map(n => (
                        <div key={n.id} className={`p-3 rounded-xl text-sm border ${n.is_read ? 'bg-gray-50 dark:bg-gray-700 border-transparent' : 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800'}`}>
                            <p className="dark:text-gray-200">{n.message}</p>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleTimeString()}</span>
                                {!n.is_read && <button onClick={() => markAsRead(n.id)} className="text-xs text-purple-600 font-bold hover:underline">Mark read</button>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ScanHistory: React.FC<{ providerId: number }> = ({ providerId }) => {
    const { t } = useLocalization();
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        const fetchHistory = async () => {
            const { data } = await supabase.from('scan_history').select('*').eq('provider_id', providerId).order('created_at', { ascending: false }).limit(5);
            setHistory(data || []);
        };
        fetchHistory();
    }, [providerId]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
             <h3 className="font-bold text-lg mb-4 flex items-center gap-2 dark:text-white"><History className="text-green-500"/> {t('scanHistory')}</h3>
             {history.length === 0 ? (
                 <p className="text-gray-400 text-center py-4 text-sm">{t('noNotifications')}</p>
             ) : (
                 <div className="space-y-3">
                     {history.map((h, i) => (
                         <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                             <div>
                                 <p className="font-bold text-sm dark:text-white">{h.client_name || 'Unknown'}</p>
                                 <p className="text-xs text-gray-500">{new Date(h.created_at).toLocaleDateString()}</p>
                             </div>
                             <div className="text-green-500 bg-green-100 dark:bg-green-900/30 p-1.5 rounded-full"><CheckCircle size={14}/></div>
                         </div>
                     ))}
                 </div>
             )}
        </div>
    );
};

const ClientList: React.FC<{ providerId: number }> = ({ providerId }) => {
    const { t } = useLocalization();
    const [clients, setClients] = useState<any[]>([]);
    
    useEffect(() => {
        const fetchClients = async () => {
            const { data } = await supabase.from('follows').select('clients(full_name, phone, profile_image_url)').eq('provider_id', providerId).limit(5);
            if(data) setClients(data.map((d:any) => d.clients));
        }
        fetchClients();
    }, [providerId]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 dark:text-white"><Users className="text-blue-500"/> {t('followers')}</h3>
            <div className="space-y-3">
                {clients.length === 0 ? <p className="text-center text-gray-400 text-sm">No followers yet</p> : 
                    clients.map((c, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 overflow-hidden">
                                {c.profile_image_url ? <img src={c.profile_image_url} className="w-full h-full object-cover"/> : c.full_name?.[0]}
                            </div>
                            <div>
                                <p className="font-bold text-sm dark:text-white">{c.full_name}</p>
                                <p className="text-xs text-gray-500">{c.phone}</p>
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    );
}

const AnnouncementManager: React.FC<{ providerId: number }> = ({ providerId }) => {
    const { t } = useLocalization();
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePost = async () => {
        if(!message.trim()) return;
        setLoading(true);
        await supabase.from('announcements').insert({ provider_id: providerId, message });
        setLoading(false);
        setMessage('');
        alert(t('success'));
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
             <h3 className="font-bold text-lg mb-4 flex items-center gap-2 dark:text-white"><Smartphone className="text-orange-500"/> {t('posts')}</h3>
             <textarea 
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={t('messagePlaceholder')}
                className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl mb-3 text-sm outline-none focus:ring-2 focus:ring-orange-500 dark:text-white resize-none"
                rows={3}
             />
             <button onClick={handlePost} disabled={loading} className="w-full bg-orange-500 text-white py-2 rounded-lg font-bold text-sm shadow-md active:scale-95 transition-transform">
                 {loading ? <Loader2 className="animate-spin mx-auto"/> : t('sendButton')}
             </button>
        </div>
    );
}

const ProfileManager: React.FC<{ provider: AuthenticatedUser }> = ({ provider }) => {
    const { t } = useLocalization();
    const [services, setServices] = useState<ProviderService[]>([]);
    const [newService, setNewService] = useState({ name: '', price: '', discount: '' });
    const [bio, setBio] = useState(provider.bio || '');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchServices();
    }, [provider.id]);

    const fetchServices = async () => {
        const { data } = await supabase.from('provider_services').select('*').eq('provider_id', provider.id);
        setServices(data || []);
    };

    const handleAddService = async () => {
        if(!newService.name || !newService.price) return;
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

    const handleSaveBio = async () => {
        await supabase.from('providers').update({ bio }).eq('id', provider.id);
        alert(t('savedSuccessfully'));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;
        setLoading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `provider_${provider.id}_${Date.now()}.${fileExt}`;
            const { error } = await supabase.storage.from('profiles').upload(fileName, file);
            if(error) throw error;
            const { data } = supabase.storage.from('profiles').getPublicUrl(fileName);
            await supabase.from('providers').update({ profile_image_url: data.publicUrl }).eq('id', provider.id);
            alert(t('savedSuccessfully'));
        } catch(e) {
            alert(t('uploadError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-bold text-xl mb-6 dark:text-white flex items-center gap-2"><Briefcase className="text-purple-600"/> {t('profileAndServices')}</h3>
            
            {/* Image & Bio */}
            <div className="mb-8 flex flex-col md:flex-row gap-6">
                <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-gray-100 mx-auto mb-2 overflow-hidden relative">
                        {loading ? <Loader2 className="animate-spin m-auto mt-8"/> : 
                         <img src={provider.profile_image_url || `https://ui-avatars.com/api/?name=${provider.name}&background=random`} className="w-full h-full object-cover"/>
                        }
                    </div>
                    <button onClick={() => fileInputRef.current?.click()} className="text-xs text-purple-600 font-bold hover:underline">{t('uploadProfileImage')}</button>
                    <input type="file" hidden ref={fileInputRef} onChange={handleImageUpload} />
                </div>
                <div className="flex-1 space-y-3">
                    <textarea 
                        value={bio} 
                        onChange={e => setBio(e.target.value)} 
                        placeholder={t('bioLabel')} 
                        className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-sm outline-none border border-gray-200 dark:border-gray-600 dark:text-white" 
                        rows={3}
                    />
                    <button onClick={handleSaveBio} className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg text-xs font-bold">{t('saveProfile')}</button>
                </div>
            </div>

            {/* Services List */}
            <div>
                <h4 className="font-bold mb-3 text-sm text-gray-500 uppercase">{t('services')}</h4>
                <div className="space-y-3 mb-4">
                    {services.map(s => (
                        <div key={s.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                            <div>
                                <p className="font-bold dark:text-white">{s.name}</p>
                                <p className="text-xs text-gray-500">{s.discount_price ? <span className="text-green-600">{s.discount_price} DH</span> : <span>{s.price} DH</span>}</p>
                            </div>
                            <button onClick={() => handleDeleteService(s.id)} className="text-red-400 hover:text-red-600"><Trash size={16}/></button>
                        </div>
                    ))}
                </div>
                
                {/* Add Service Form */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <input value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} placeholder={t('serviceName')} className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm outline-none dark:text-white col-span-2"/>
                    <input value={newService.price} onChange={e => setNewService({...newService, price: e.target.value})} type="number" placeholder={t('price')} className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm outline-none dark:text-white"/>
                    <input value={newService.discount} onChange={e => setNewService({...newService, discount: e.target.value})} type="number" placeholder={t('discountPrice')} className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm outline-none dark:text-white"/>
                </div>
                <button onClick={handleAddService} className="w-full py-2 bg-purple-600 text-white rounded-lg font-bold text-sm shadow-sm">{t('addService')}</button>
            </div>
        </div>
    );
};

const RequestAd: React.FC<{ providerId: number }> = ({ providerId }) => {
    const { t } = useLocalization();
    const [step, setStep] = useState(1);
    const [adData, setAdData] = useState({ message: '', image: '' });
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;
        setLoading(true);
        try {
            const fileName = `ad_req_${providerId}_${Date.now()}`;
            const { error } = await supabase.storage.from('announcement-images').upload(fileName, file);
            if(error) throw error;
            const { data } = supabase.storage.from('announcement-images').getPublicUrl(fileName);
            setAdData({...adData, image: data.publicUrl});
        } catch(e) { alert(t('uploadError')); }
        finally { setLoading(false); }
    }

    const submitRequest = async () => {
        setLoading(true);
        // We use system_announcements with active=false as a request
        const { error } = await supabase.from('system_announcements').insert({
            title: 'PAID AD REQUEST',
            message: `REQ from Provider ${providerId}: ${adData.message}`,
            image_url: adData.image,
            is_active: false // Needs Admin Approval
        });
        setLoading(false);
        if(!error) setStep(3);
    }

    if(step === 3) return (
        <div className="bg-green-50 p-6 rounded-2xl text-center">
            <CheckCircle size={48} className="mx-auto text-green-500 mb-4"/>
            <h3 className="font-bold text-green-700">{t('requestSent')}</h3>
            <p className="text-sm text-gray-600 mt-2">{t('waitForCall')}</p>
        </div>
    );

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-purple-100 dark:border-purple-900">
            <h4 className="font-bold flex items-center gap-2 dark:text-white mb-4"><Megaphone className="text-purple-500"/> {t('requestBoost')}</h4>
            
            {step === 1 ? (
                <div className="text-center">
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl mb-4">
                        <p className="font-bold text-2xl text-purple-600 dark:text-purple-400">{t('price50DH')}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">3 Days Duration</p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{t('boostDesc')}</p>
                    <button onClick={() => setStep(2)} className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold">{t('continue')}</button>
                </div>
            ) : (
                <div className="space-y-4">
                    <textarea placeholder={t('messageLabel')} value={adData.message} onChange={e => setAdData({...adData, message: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl outline-none dark:text-white"/>
                    <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 flex justify-center items-center gap-2">
                        {loading ? <Loader2 className="animate-spin"/> : <ImageIcon/>} Upload Image
                    </button>
                    <input type="file" hidden ref={fileInputRef} onChange={handleUpload}/>
                    {adData.image && <img src={adData.image} className="h-32 w-full object-cover rounded-xl"/>}
                    <button onClick={submitRequest} disabled={loading || !adData.message} className="w-full bg-green-500 text-white py-3 rounded-xl font-bold">{t('submitRequest')}</button>
                </div>
            )}
        </div>
    );
};

const QRScannerComponent: React.FC<{ providerId: number }> = ({ providerId }) => {
  const { t } = useLocalization();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [bookingData, setBookingData] = useState<any>(null);

  const startScan = async () => {
    setIsScanning(true);
    setScanResult(null);
    setVerificationStatus('idle');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        requestAnimationFrame(tick);
      }
    } catch (err) {
      console.error("Error opening camera", err);
      setIsScanning(false);
    }
  };

  const stopScan = () => {
    setIsScanning(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const tick = () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return;
    if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
        if (code) {
          handleScan(code.data);
          return;
        }
      }
    }
    requestAnimationFrame(tick);
  };

  const handleScan = async (data: string) => {
    stopScan();
    setScanResult(data);
    setVerificationStatus('loading');
    try {
        const parsed = JSON.parse(data);
        if(!parsed.appointmentId) throw new Error("Invalid QR");

        // Verify with Supabase
        const { data: appointment, error } = await supabase
            .from('appointments')
            .select('*, clients(*)')
            .eq('id', parsed.appointmentId)
            .eq('provider_id', providerId)
            .single();

        if (error || !appointment) {
            setVerificationStatus('error');
        } else {
            setBookingData(appointment);
            setVerificationStatus('success');
            
            // Record Scan History
            await supabase.from('scan_history').insert({
                provider_id: providerId,
                client_name: appointment.clients?.full_name || 'Guest',
                client_phone: appointment.clients?.phone || 'N/A'
            });
        }
    } catch (e) {
        setVerificationStatus('error');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col items-center">
        <h3 className="font-bold text-xl mb-6 dark:text-white flex items-center gap-2"><Camera className="text-purple-600"/> {t('qrScannerTitle')}</h3>
        
        {isScanning ? (
            <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden mb-4">
                <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 border-2 border-green-500/50 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-green-500 rounded-xl animate-pulse"/>
                </div>
                <button onClick={stopScan} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-bold">{t('cancel')}</button>
            </div>
        ) : (
            <div className="w-full text-center">
                {verificationStatus === 'idle' && (
                    <button onClick={startScan} className="w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-2xl flex flex-col items-center justify-center gap-4 hover:bg-gray-200 transition-colors">
                        <Camera size={48} className="text-gray-400"/>
                        <span className="font-bold text-gray-500">{t('scanWithCamera')}</span>
                    </button>
                )}
                
                {verificationStatus === 'loading' && <Loader2 className="animate-spin mx-auto text-purple-600" size={48}/>}
                
                {verificationStatus === 'success' && (
                    <div className="bg-green-50 p-6 rounded-2xl border border-green-100 animate-fade-in">
                        <CheckCircle size={48} className="text-green-500 mx-auto mb-4"/>
                        <h4 className="font-bold text-xl text-green-700 mb-2">{t('verificationSuccess')}</h4>
                        <p className="text-gray-600">{bookingData?.clients?.full_name}</p>
                        <p className="text-gray-500 text-sm">{new Date(bookingData?.created_at).toLocaleString()}</p>
                        <button onClick={() => setVerificationStatus('idle')} className="mt-4 text-green-700 font-bold underline">{t('scanWithCamera')}</button>
                    </div>
                )}
                
                {verificationStatus === 'error' && (
                    <div className="bg-red-50 p-6 rounded-2xl border border-red-100 animate-fade-in">
                        <XCircle size={48} className="text-red-500 mx-auto mb-4"/>
                        <h4 className="font-bold text-xl text-red-700 mb-2">{t('invalidQR')}</h4>
                        <button onClick={() => setVerificationStatus('idle')} className="mt-4 text-red-700 font-bold underline">{t('tryAgain')}</button>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

// --- MAIN PORTAL ---
interface ProviderPortalProps {
    provider: AuthenticatedUser;
    onLogout: () => void;
}

const ProviderPortal: React.FC<ProviderPortalProps> = ({ provider, onLogout }) => {
    const { t } = useLocalization();
    const isAdmin = provider.phone === '0617774846';
    
    // Stats State
    const [stats, setStats] = useState({ followers: 0, scans: 0, ads: 0 });

    useEffect(() => {
        const getStats = async () => {
            const { count: followers } = await supabase.from('follows').select('*', {count: 'exact', head: true}).eq('provider_id', provider.id);
            const { count: scans } = await supabase.from('scan_history').select('*', {count: 'exact', head: true}).eq('provider_id', provider.id);
            const { count: ads } = await supabase.from('announcements').select('*', {count: 'exact', head: true}).eq('provider_id', provider.id);
            setStats({ followers: followers || 0, scans: scans || 0, ads: ads || 0 });
        }
        getStats();
    }, [provider.id]);

    return (
        <div className="pb-32 px-4 bg-gray-50 dark:bg-gray-900 min-h-full">
            
            {/* 1. Instagram-Style Header */}
            <div className="pt-8 pb-6 bg-white dark:bg-gray-800 rounded-b-3xl shadow-sm mb-6 -mx-4 px-6 border-b dark:border-gray-700">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-purple-100 p-1">
                        <img 
                            src={provider.profile_image_url || `https://ui-avatars.com/api/?name=${provider.name}&background=random`} 
                            className="w-full h-full rounded-full object-cover"
                        />
                    </div>
                    <div className="flex-1 flex justify-around text-center">
                         <div>
                             <span className="block font-bold text-lg dark:text-white">{stats.followers}</span>
                             <span className="text-xs text-gray-500">{t('followers')}</span>
                         </div>
                         <div>
                             <span className="block font-bold text-lg dark:text-white">{stats.scans}</span>
                             <span className="text-xs text-gray-500">{t('totalScans')}</span>
                         </div>
                         <div>
                             <span className="block font-bold text-lg dark:text-white">{stats.ads}</span>
                             <span className="text-xs text-gray-500">{t('posts')}</span>
                         </div>
                    </div>
                </div>
                <div className="mt-4">
                    <h1 className="font-bold text-xl dark:text-white">{provider.name}</h1>
                    <p className="text-purple-600 text-sm font-medium">{provider.service_type}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{provider.bio || "No bio yet."}</p>
                </div>
                <div className="flex gap-2 mt-4">
                     <button className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-bold dark:text-white">{t('edit')} {t('profileAndServices')}</button>
                     <button onClick={onLogout} className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg"><LogOut size={18}/></button>
                </div>
            </div>

            {/* 2. Grid Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <RestrictedGuard isActive={provider.isActive !== false}>
                    <QRScannerComponent providerId={provider.id} />
                    <ProviderNotifications providerId={provider.id} />
                    <ScanHistory providerId={provider.id} />
                    <ClientList providerId={provider.id} />
                    <AnnouncementManager providerId={provider.id} />
                    <ProfileManager provider={provider} />
                    <RequestAd providerId={provider.id} />
                </RestrictedGuard>
            </div>
        </div>
    );
};

export default ProviderPortal;
