
import React, { useState, useRef, useEffect } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { AuthenticatedUser, ProviderNotification, AdRequest } from '../types';
import { supabase } from '../services/supabaseClient';
import { CheckCircle, XCircle, Camera, Loader2, Upload, MessageCircle, History, Users, Megaphone, Settings, ArrowLeft, Image as ImageIcon, QrCode, Bell, User, LayoutGrid, FileText, Lock } from 'lucide-react';
import jsQR from 'jsqr';

// --- SUB-COMPONENTS (FULL SCREEN VIEWS) ---

const NotificationView: React.FC<{ providerId: number; onClose: () => void }> = ({ providerId, onClose }) => {
    const { t } = useLocalization();
    const [notifications, setNotifications] = useState<ProviderNotification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifs = async () => {
            const { data } = await supabase.from('provider_notifications').select('*').eq('provider_id', providerId).order('created_at', { ascending: false }).limit(20);
            setNotifications(data || []);
            setLoading(false);
        };
        fetchNotifs();
    }, [providerId]);

    const markAsRead = async (id: number) => {
        await supabase.from('provider_notifications').update({ is_read: true }).eq('id', id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    };

    return (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col animate-slide-up">
            <div className="p-4 border-b dark:border-gray-700 flex items-center gap-3">
                <button onClick={onClose}><ArrowLeft/></button>
                <h2 className="font-bold text-xl">{t('notifications')}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                {loading ? <Loader2 className="animate-spin mx-auto mt-10"/> : notifications.length === 0 ? <p className="text-center text-gray-400 mt-10">{t('noNotifications')}</p> : (
                    <div className="space-y-3">
                        {notifications.map(n => (
                            <div key={n.id} className={`p-4 rounded-xl border ${n.is_read ? 'bg-gray-50 dark:bg-gray-800' : 'bg-purple-50 dark:bg-purple-900/20 border-purple-200'}`}>
                                <p className="text-sm">{n.message}</p>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</span>
                                    {!n.is_read && <button onClick={() => markAsRead(n.id)} className="text-xs text-purple-600 font-bold">Mark Read</button>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

const HistoryView: React.FC<{ providerId: number; onClose: () => void }> = ({ providerId, onClose }) => {
    const { t } = useLocalization();
    const [history, setHistory] = useState<any[]>([]);
    useEffect(() => {
        const fetch = async () => {
            const { data } = await supabase.from('scan_history').select('*').eq('provider_id', providerId).order('created_at', { ascending: false });
            setHistory(data || []);
        }
        fetch();
    }, []);

    return (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col animate-slide-up">
            <div className="p-4 border-b dark:border-gray-700 flex items-center gap-3">
                <button onClick={onClose}><ArrowLeft/></button>
                <h2 className="font-bold text-xl">{t('scanHistory')}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {history.map((h, i) => (
                     <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                         <div>
                             <p className="font-bold text-sm dark:text-white">{h.client_name || 'Unknown'}</p>
                             <p className="text-xs text-gray-500">{new Date(h.created_at).toLocaleString()}</p>
                         </div>
                         <div className="text-green-500"><CheckCircle size={16}/></div>
                     </div>
                ))}
            </div>
        </div>
    );
}

const ClientsView: React.FC<{ providerId: number; onClose: () => void }> = ({ providerId, onClose }) => {
    const { t } = useLocalization();
    const [clients, setClients] = useState<any[]>([]);
    useEffect(() => {
        const fetch = async () => {
            const { data } = await supabase.from('follows').select('clients(full_name, phone, profile_image_url)').eq('provider_id', providerId);
            if(data) setClients(data.map((d:any) => d.clients));
        }
        fetch();
    }, []);

    return (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col animate-slide-up">
             <div className="p-4 border-b dark:border-gray-700 flex items-center gap-3">
                <button onClick={onClose}><ArrowLeft/></button>
                <h2 className="font-bold text-xl">{t('followers')}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {clients.map((c, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 overflow-hidden">
                            {c.profile_image_url ? <img src={c.profile_image_url} className="w-full h-full object-cover"/> : c.full_name?.[0]}
                        </div>
                        <div>
                            <p className="font-bold text-sm dark:text-white">{c.full_name}</p>
                            <p className="text-xs text-gray-500">{c.phone}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const AdsView: React.FC<{ providerId: number; onClose: () => void }> = ({ providerId, onClose }) => {
    const { t } = useLocalization();
    const [requests, setRequests] = useState<AdRequest[]>([]);
    const [newAd, setNewAd] = useState({ message: '', image: '' });
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        const { data } = await supabase.from('provider_ad_requests').select('*').eq('provider_id', providerId).order('created_at', { ascending: false });
        setRequests(data || []);
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;
        setLoading(true);
        try {
            const fileName = `req_${providerId}_${Date.now()}`;
            const { error } = await supabase.storage.from('announcement-images').upload(fileName, file);
            if(error) throw error;
            const { data } = supabase.storage.from('announcement-images').getPublicUrl(fileName);
            setNewAd(prev => ({ ...prev, image: data.publicUrl }));
        } catch(e) { alert(t('uploadError')); }
        finally { setLoading(false); }
    }

    const handleSubmit = async () => {
        if(!newAd.message) return;
        setLoading(true);
        // Using a dedicated table 'provider_ad_requests' is better, but falling back to instructions
        // Assuming table 'provider_ad_requests' exists from DatabaseSetup
        const { error } = await supabase.from('provider_ad_requests').insert({
            provider_id: providerId,
            message: newAd.message,
            image_url: newAd.image,
            status: 'pending'
        });
        
        if(error) alert(t('errorMessage'));
        else {
            setNewAd({ message: '', image: '' });
            alert(t('requestSent'));
            fetchRequests();
        }
        setLoading(false);
    }

    return (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col animate-slide-up">
            <div className="p-4 border-b dark:border-gray-700 flex items-center gap-3">
                <button onClick={onClose}><ArrowLeft/></button>
                <h2 className="font-bold text-xl">{t('requestBoost')}</h2>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto">
                 <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-xl">
                     <h3 className="font-bold text-pink-600 mb-2">Create New Request</h3>
                     <textarea value={newAd.message} onChange={e => setNewAd({...newAd, message: e.target.value})} placeholder={t('messageLabel')} className="w-full p-2 rounded-lg border dark:bg-gray-800 dark:text-white mb-2"/>
                     <button onClick={() => fileInputRef.current?.click()} className="w-full py-2 border border-dashed rounded-lg mb-2 text-sm text-gray-500 flex justify-center items-center gap-2">
                         {loading ? <Loader2 className="animate-spin"/> : <ImageIcon size={16}/>} Upload Image
                     </button>
                     <input type="file" ref={fileInputRef} hidden onChange={handleUpload}/>
                     {newAd.image && <img src={newAd.image} className="h-20 w-full object-cover rounded-lg mb-2"/>}
                     <button onClick={handleSubmit} disabled={loading} className="w-full bg-pink-600 text-white py-2 rounded-lg font-bold">{t('sendButton')}</button>
                 </div>
                 
                 <h3 className="font-bold mt-4">My Requests</h3>
                 {requests.map(r => (
                     <div key={r.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex justify-between">
                         <div className="flex gap-2">
                             {r.image_url && <img src={r.image_url} className="w-10 h-10 rounded object-cover"/>}
                             <div>
                                 <p className="text-sm font-semibold truncate w-40">{r.message}</p>
                                 <span className={`text-[10px] px-2 py-0.5 rounded-full ${r.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.status}</span>
                             </div>
                         </div>
                     </div>
                 ))}
            </div>
        </div>
    );
}

const QRScannerView: React.FC<{ providerId: number; onClose: () => void }> = ({ providerId, onClose }) => {
    const { t } = useLocalization();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [scanData, setScanData] = useState<any>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFileScan = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if(ctx) {
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height);
                    if(code) processCode(code.data);
                    else { setStatus('error'); }
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const startCamera = async () => {
        setIsScanning(true);
        setStatus('idle');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
                requestAnimationFrame(tick);
            }
        } catch (e) { setIsScanning(false); }
    };

    const tick = () => {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            const canvas = canvasRef.current;
            if (canvas) {
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height);
                    if (code) {
                        stopCamera();
                        processCode(code.data);
                    } else {
                        requestAnimationFrame(tick);
                    }
                }
            }
        } else {
            if(isScanning) requestAnimationFrame(tick);
        }
    };

    const stopCamera = () => {
        setIsScanning(false);
        if (videoRef.current && videoRef.current.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        }
    };

    const processCode = async (data: string) => {
        try {
            const parsed = JSON.parse(data);
            if(!parsed.appointmentId) throw new Error();
            
            // Log scan
            await supabase.from('scan_history').insert({
                provider_id: providerId,
                client_name: "Verified Client",
                client_phone: "N/A"
            });
            
            setScanData(parsed);
            setStatus('success');
        } catch (e) {
            setStatus('error');
        }
    };

    return (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col animate-slide-up">
            <div className="p-4 border-b dark:border-gray-700 flex items-center gap-3">
                <button onClick={() => { stopCamera(); onClose(); }}><ArrowLeft/></button>
                <h2 className="font-bold text-xl">{t('qrScannerTitle')}</h2>
            </div>
            <div className="p-6 flex flex-col items-center gap-6">
                
                {status === 'success' ? (
                    <div className="text-center p-8 bg-green-50 rounded-full">
                        <CheckCircle size={64} className="text-green-500 mx-auto mb-4"/>
                        <h3 className="font-bold text-2xl text-green-700">{t('verificationSuccess')}</h3>
                        <p className="mt-2 text-gray-600">ID: #{scanData?.appointmentId}</p>
                        <button onClick={() => setStatus('idle')} className="mt-6 px-6 py-2 bg-green-600 text-white rounded-full font-bold">Scan Next</button>
                    </div>
                ) : status === 'error' ? (
                    <div className="text-center p-8 bg-red-50 rounded-xl">
                        <XCircle size={64} className="text-red-500 mx-auto mb-4"/>
                        <h3 className="font-bold text-2xl text-red-700">{t('invalidQR')}</h3>
                        <button onClick={() => setStatus('idle')} className="mt-6 px-6 py-2 bg-red-600 text-white rounded-full font-bold">Try Again</button>
                    </div>
                ) : isScanning ? (
                    <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden">
                        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover"/>
                        <canvas ref={canvasRef} className="hidden"/>
                        <div className="absolute inset-0 border-4 border-green-500/50 flex items-center justify-center"><div className="w-48 h-48 border-2 border-green-400 animate-pulse rounded-lg"/></div>
                        <button onClick={stopCamera} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/20 text-white px-4 py-2 rounded-full backdrop-blur-md">Stop</button>
                    </div>
                ) : (
                    <div className="w-full space-y-4">
                        <button onClick={startCamera} className="w-full py-10 bg-gray-100 dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-4 hover:bg-gray-200 transition-colors">
                            <Camera size={48} className="text-purple-600"/>
                            <span className="font-bold text-lg">{t('scanWithCamera')}</span>
                        </button>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-gray-900 text-gray-500">OR</span></div>
                        </div>
                        <button onClick={() => fileRef.current?.click()} className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                            <Upload size={20}/> {t('uploadQRImage')}
                        </button>
                        <input type="file" ref={fileRef} hidden accept="image/*" onChange={handleFileScan}/>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- MAIN GRID DASHBOARD ---

const ProviderPortal: React.FC<{ provider: AuthenticatedUser; onLogout: () => void }> = ({ provider, onLogout }) => {
    const { t } = useLocalization();
    const [view, setView] = useState<'main' | 'notifications' | 'history' | 'clients' | 'ads' | 'scan'>('main');

    // Stats
    const [stats, setStats] = useState({ visits: 0, followers: 0 });
    useEffect(() => {
        const loadStats = async () => {
            const { count: v } = await supabase.from('scan_history').select('*', {count: 'exact', head: true}).eq('provider_id', provider.id);
            const { count: f } = await supabase.from('follows').select('*', {count: 'exact', head: true}).eq('provider_id', provider.id);
            setStats({ visits: v || 0, followers: f || 0 });
        }
        loadStats();
    }, []);

    const GridItem = ({ icon: Icon, label, color, onClick, badge }: any) => (
        <button onClick={onClick} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center gap-3 aspect-square hover:scale-105 transition-transform relative">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${color}`}>
                <Icon size={24}/>
            </div>
            <span className="font-bold text-sm dark:text-white text-center">{label}</span>
            {badge > 0 && <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{badge}</span>}
        </button>
    );

    return (
        <div className="p-4 pb-24 max-w-lg mx-auto">
            {/* Header Profile */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm mb-6 flex items-center gap-4 border border-gray-100 dark:border-gray-700">
                <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
                    <img src={provider.profile_image_url || `https://ui-avatars.com/api/?name=${provider.name}`} className="w-full h-full object-cover"/>
                </div>
                <div className="flex-1">
                    <h1 className="font-bold text-lg dark:text-white">{provider.name}</h1>
                    <p className="text-sm text-gray-500">{provider.service_type}</p>
                </div>
                <button onClick={onLogout} className="p-2 bg-red-50 text-red-500 rounded-full"><ArrowLeft size={20} className="rotate-180"/></button>
            </div>

            {/* Stats Row */}
            <div className="flex gap-4 mb-6">
                <div className="flex-1 bg-blue-500 text-white p-4 rounded-2xl shadow-lg shadow-blue-500/20">
                    <p className="text-3xl font-black">{stats.visits}</p>
                    <p className="text-xs opacity-80 uppercase font-bold">{t('totalScans')}</p>
                </div>
                <div className="flex-1 bg-purple-500 text-white p-4 rounded-2xl shadow-lg shadow-purple-500/20">
                    <p className="text-3xl font-black">{stats.followers}</p>
                    <p className="text-xs opacity-80 uppercase font-bold">{t('followers')}</p>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-2 gap-4">
                <GridItem icon={QrCode} label={t('qrScannerTitle')} color="bg-black" onClick={() => setView('scan')} />
                <GridItem icon={Bell} label={t('notifications')} color="bg-orange-500" onClick={() => setView('notifications')} badge={0} />
                <GridItem icon={History} label={t('scanHistory')} color="bg-green-500" onClick={() => setView('history')} />
                <GridItem icon={Users} label={t('followers')} color="bg-blue-500" onClick={() => setView('clients')} />
                <GridItem icon={Megaphone} label={t('requestBoost')} color="bg-pink-500" onClick={() => setView('ads')} />
                <GridItem icon={Settings} label={t('about')} color="bg-gray-500" onClick={() => {}} />
            </div>

            {/* Modals */}
            {view === 'scan' && <QRScannerView providerId={provider.id} onClose={() => setView('main')} />}
            {view === 'notifications' && <NotificationView providerId={provider.id} onClose={() => setView('main')} />}
            {view === 'history' && <HistoryView providerId={provider.id} onClose={() => setView('main')} />}
            {view === 'clients' && <ClientsView providerId={provider.id} onClose={() => setView('main')} />}
            {view === 'ads' && <AdsView providerId={provider.id} onClose={() => setView('main')} />}
        </div>
    );
};

export default ProviderPortal;