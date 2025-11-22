
import React, { useState, useRef, useEffect } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { BookingDetails, FollowUp, AuthenticatedUser } from '../types';
import { supabase } from '../services/supabaseClient';
import { CheckCircle, XCircle, Camera, Loader2, Upload, Send, LogOut, User, Calendar, FileText, Lock, Phone, X, RefreshCw, BarChart, History, Users, Edit, Trash, Smartphone, MessageCircle } from 'lucide-react';
import jsQR from 'jsqr';

interface ScannedAppointment extends BookingDetails {}

// --- Sub-Components ---

const RestrictedGuard: React.FC<{ provider: AuthenticatedUser; children: React.ReactNode; fallback?: React.ReactNode }> = ({ provider, children }) => {
    const { t } = useLocalization();
    const isValid = provider.isActive && provider.subscriptionEndDate && new Date(provider.subscriptionEndDate) > new Date();
    const [showModal, setShowModal] = useState(false);

    if (isValid) return <>{children}</>;

    return (
        <div className="relative" onClickCapture={(e) => { e.stopPropagation(); setShowModal(true); }}>
            <div className="pointer-events-none opacity-50 grayscale">{children}</div>
            {showModal && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-slide-up">
                        <Lock size={48} className="text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2 dark:text-white">{t('accountLocked')}</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">{t('accountRestricted')}</p>
                        <a href="tel:0617774846" className="block w-full bg-dark dark:bg-white dark:text-dark text-white py-3 rounded-xl font-bold mb-3">{t('callAdmin')}</a>
                        <button onClick={() => setShowModal(false)} className="text-sm text-gray-500 underline">{t('close')}</button>
                    </div>
                </div>
            )}
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

const ScanHistory: React.FC<{ providerId: number }> = ({ providerId }) => {
    const { t } = useLocalization();
    const [history, setHistory] = useState<any[]>([]);
    
    useEffect(() => {
        supabase.from('scan_history').select('*').eq('provider_id', providerId).order('created_at', { ascending: false }).limit(20)
        .then(({ data }) => setHistory(data || []));
    }, [providerId]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
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

    useEffect(() => {
        const fetchClients = async () => {
            const { data } = await supabase.from('follows').select('client_id, clients(full_name, phone)').eq('provider_id', providerId);
            if (data) setClients(data.map(d => d.clients));
        };
        fetchClients();
    }, [providerId]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-full">
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

const QRScannerComponent: React.FC<{ providerId: number }> = ({ providerId }) => {
    const { t } = useLocalization();
    const [scannedData, setScannedData] = useState<ScannedAppointment | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showScanner, setShowScanner] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const requestRef = useRef<number>();

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
                 <button onClick={() => setShowScanner(true)} className="w-full bg-dark text-white py-4 rounded-xl font-bold flex justify-center gap-2 hover:bg-black">
                     <Camera/> {t('scanWithCamera')}
                 </button>
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
                     <div>
                         <StatsComponent providerId={provider.id} />
                         <QRScannerComponent providerId={provider.id} />
                         <AnnouncementManager providerId={provider.id} />
                     </div>
                     <div className="space-y-6">
                         <ClientList providerId={provider.id} />
                         <ScanHistory providerId={provider.id} />
                     </div>
                 </div>
             </RestrictedGuard>
        </div>
    );
};

export default ProviderPortal;
