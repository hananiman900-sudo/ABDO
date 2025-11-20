
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { BookingDetails, FollowUp, AuthenticatedUser } from '../types';
import { supabase } from '../services/supabaseClient';
import { CheckCircle, XCircle, Camera, Loader2, Upload, Send, LogOut, User, Calendar, FileText, Lock, Phone, X, RefreshCw } from 'lucide-react';
import jsQR from 'jsqr';

interface ScannedAppointment extends BookingDetails {}

const QRScannerComponent: React.FC = () => {
    const { t } = useLocalization();
    const [scannedData, setScannedData] = useState<ScannedAppointment | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showScanner, setShowScanner] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
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
        } catch (err) {
            setError(t('qrScannerInstruction'));
            setShowScanner(false);
        }
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

    const processQrCodeText = async (qrCodeText: string) => {
        try {
            const data = JSON.parse(qrCodeText);
            if (data.appointmentId) await verifyAppointment(data.appointmentId);
            else throw new Error('Invalid');
        } catch (e) { setError(t('invalidQR')); }
    };
    
    const verifyAppointment = async (appointmentId: number) => {
        try {
            const { data } = await supabase.from('appointments').select(`id, clients (full_name, phone), providers (name, service_type, location)`).eq('id', appointmentId).single();
            if (!data) throw new Error('NotFound');
            setScannedData({
                appointmentId: data.id,
                name: data.clients.full_name,
                phone: data.clients.phone,
                service: data.providers.service_type,
                provider: data.providers.name,
                location: data.providers.location,
                discount: "19%",
            });
        } catch (e) { setError(t('invalidQR')); }
    }

    const handleScanResult = async (result: { text: string }) => {
        setShowScanner(false); stopCamera();
        setIsVerifying(true); setError(null); setScannedData(null);
        await processQrCodeText(result.text);
        setIsVerifying(false);
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setIsVerifying(true); setError(null); setScannedData(null);
        const process = async () => {
            const img = new Image(); img.src = URL.createObjectURL(file); await img.decode();
            const cvs = document.createElement('canvas'); const ctx = cvs.getContext('2d');
            cvs.width = img.width; cvs.height = img.height; ctx?.drawImage(img, 0,0);
            const code = jsQR(ctx?.getImageData(0,0,cvs.width,cvs.height).data as any, cvs.width, cvs.height);
            if (code) await processQrCodeText(code.data); else setError(t('qrNotDetected'));
        };
        process().finally(() => setIsVerifying(false));
    };
    
    const reset = () => { setScannedData(null); setError(null); setShowScanner(false); };

    return (
        <div className="p-8 bg-surface dark:bg-surfaceDark rounded-3xl shadow-soft flex flex-col items-center text-center border border-white/20">
            <h3 className="text-2xl font-bold text-dark dark:text-light mb-2">{t('qrScannerTitle')}</h3>
            <p className="text-gray-500 mb-8 text-sm">{t('qrScannerInstruction')}</p>
            
            {!showScanner && !scannedData && !error && !isVerifying && (
                 <>
                    <div className="flex flex-col sm:flex-row gap-4 w-full">
                        <button onClick={() => setShowScanner(true)} className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-dark text-white rounded-2xl hover:bg-black transition-transform active:scale-95 shadow-lg">
                            <Camera size={24} />
                            <span className="font-bold">{t('scanWithCamera')}</span>
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gray-100 text-dark rounded-2xl hover:bg-gray-200 transition-transform active:scale-95">
                            <Upload size={24} />
                            <span className="font-bold">{t('uploadQRCode')}</span>
                        </button>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                </>
            )}

            {showScanner && (
                <div className="relative w-full aspect-square sm:aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl">
                     <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                     {/* Scanner Overlay */}
                     <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-64 h-64 border-2 border-white/50 rounded-3xl relative">
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary -mt-1 -ml-1 rounded-tl-lg"></div>
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary -mt-1 -mr-1 rounded-tr-lg"></div>
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary -mb-1 -ml-1 rounded-bl-lg"></div>
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary -mb-1 -mr-1 rounded-br-lg"></div>
                            <div className="absolute inset-0 bg-primary/10 animate-pulse"></div>
                        </div>
                     </div>
                     <button onClick={() => setShowScanner(false)} className="absolute top-4 right-4 bg-black/50 text-white p-3 rounded-full hover:bg-black/80 backdrop-blur-md">
                        <X size={24} />
                     </button>
                </div>
            )}

            {isVerifying && (<div className="py-12 flex flex-col items-center animate-fade-in"><Loader2 className="animate-spin text-primary mb-4" size={48} /><p className="font-bold text-gray-600">{t('verifying')}</p></div>)}
            
            {scannedData && (
                <div className="w-full animate-slide-up">
                    <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl text-left rtl:text-right relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><CheckCircle size={100} className="text-green-600"/></div>
                        <div className="flex items-center gap-3 mb-4 relative z-10">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center text-green-600 dark:text-green-300">
                                <CheckCircle size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-green-800 dark:text-green-300">{t('verificationSuccess')}</h3>
                        </div>
                        <div className="space-y-2 text-gray-700 dark:text-gray-300 relative z-10 text-sm">
                            <p className="flex justify-between border-b border-green-200 dark:border-green-800/50 pb-1"><span>{t('appointmentID')}:</span> <span className="font-mono font-bold">#{scannedData.appointmentId}</span></p>
                            <p className="flex justify-between border-b border-green-200 dark:border-green-800/50 pb-1"><span>{t('clientName')}:</span> <span className="font-bold">{scannedData.name}</span></p>
                            <p className="flex justify-between border-b border-green-200 dark:border-green-800/50 pb-1"><span>{t('serviceBooked')}:</span> <span>{scannedData.service}</span></p>
                            <p className="flex justify-between border-b border-green-200 dark:border-green-800/50 pb-1"><span>{t('discount')}:</span> <span className="font-bold text-green-600">{scannedData.discount}</span></p>
                        </div>
                    </div>
                    <button onClick={reset} className="mt-6 w-full px-6 py-4 bg-dark text-white rounded-xl font-bold hover:bg-black transition-colors shadow-lg flex items-center justify-center gap-2">
                        <RefreshCw size={20} /> {t('scanAnother')}
                    </button>
                </div>
            )}

            {error && (
                <div className="w-full animate-fade-in">
                    <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-center">
                        <XCircle className="text-red-500 mx-auto mb-3" size={48} />
                        <h3 className="text-lg font-bold text-red-700 dark:text-red-300 mb-1">{t('verificationFailed')}</h3>
                        <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>
                        <button onClick={reset} className="w-full px-4 py-3 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-xl font-bold hover:bg-red-200 transition-colors">
                            {t('tryAgain')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const AnnouncementSender: React.FC<{ providerId: number }> = ({ providerId }) => {
    const { t } = useLocalization();
    const [announcementMessage, setAnnouncementMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [status, setStatus] = useState<{type: 'success'|'error', msg: string} | null>(null);
    
    const handleSend = async () => {
        if (!announcementMessage.trim()) return;
        setIsSending(true); setStatus(null);
        try {
            const { error } = await supabase.from('announcements').insert({ provider_id: providerId, message: announcementMessage.trim() });
            if (error) throw error;
            setStatus({ type: 'success', msg: t('announcementSuccessMessage') });
            setAnnouncementMessage('');
        } catch(e) { setStatus({ type: 'error', msg: t('errorMessage') }); } 
        finally { setIsSending(false); setTimeout(() => setStatus(null), 5000); }
    };
    
    return (
        <div className="p-6 bg-surface dark:bg-surfaceDark rounded-3xl shadow-soft border border-white/20 text-center">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-600">
                <Send size={24} />
            </div>
            <h3 className="text-xl font-bold text-dark dark:text-light mb-2">{t('sendAnnouncementTitle')}</h3>
            <p className="text-gray-500 mb-6 text-sm">{t('sendAnnouncementDesc')}</p>
            <div className="space-y-3">
                <textarea 
                    rows={3} 
                    value={announcementMessage} 
                    onChange={(e) => setAnnouncementMessage(e.target.value)} 
                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none resize-none text-sm transition-all"
                    placeholder={t('messagePlaceholder')}
                ></textarea>
                <button onClick={handleSend} disabled={isSending || !announcementMessage} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primaryDark transition-colors disabled:opacity-50 shadow-lg shadow-primary/20">
                    {isSending ? <Loader2 className="animate-spin" /> : t('sendButton')}
                </button>
                {status && <p className={`text-sm font-bold ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{status.msg}</p>}
            </div>
        </div>
    );
};

const FollowUpList: React.FC<{ providerId: number }> = ({ providerId }) => {
    const { t } = useLocalization();
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        supabase.from('follow_ups').select('*, clients(full_name, phone)').eq('provider_id', providerId).order('next_appointment_date', { ascending: true })
        .then(({ data }) => { setFollowUps(data as FollowUp[] || []); setIsLoading(false); });
    }, [providerId]);
    
    return (
        <div className="bg-surface dark:bg-surfaceDark rounded-3xl shadow-soft border border-white/20 overflow-hidden flex flex-col h-full max-h-[600px]">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                <h3 className="text-xl font-bold text-dark dark:text-light">{t('clientFollowUps')}</h3>
                <p className="text-sm text-gray-500">{t('clientFollowUpsDesc')}</p>
            </div>
            <div className="overflow-y-auto p-4 space-y-3 flex-1">
                {isLoading ? <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div> : 
                followUps.length === 0 ? <div className="text-center text-gray-400 py-10 flex flex-col items-center"><Calendar size={40} className="mb-2 opacity-20"/>{t('noFollowUps')}</div> : 
                followUps.map(fu => (
                    <div key={fu.id} className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <div className="font-bold text-dark dark:text-light flex items-center gap-2"><User size={16} className="text-primary"/> {fu.clients.full_name}</div>
                            <div className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg font-mono">{new Date(fu.next_appointment_date).toLocaleDateString()}</div>
                        </div>
                        <div className="text-sm text-gray-500 mb-2 flex items-center gap-2"><Phone size={14}/> {fu.clients.phone}</div>
                        <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-xl text-sm text-gray-700 dark:text-gray-300 border border-yellow-100 dark:border-yellow-800/30">
                            <FileText size={14} className="inline mr-1 text-yellow-600"/> {fu.notes}
                        </div>
                    </div>
                ))}
            </div>
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
    const daysLeft = provider.subscriptionEndDate ? Math.ceil((new Date(provider.subscriptionEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

    return (
        <div className="w-full flex flex-col gap-6 relative pb-20">
            <div className="bg-gradient-to-r from-dark to-gray-800 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">{t('welcomeProvider', {name: provider.name})}</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${isValid ? 'bg-green-400' : 'bg-red-500 animate-pulse'}`}></div>
                        <span className="text-sm font-medium opacity-90">
                            {isValid ? t('daysRemaining', { days: daysLeft }) : (provider.isActive ? t('statusExpired') : t('statusPending'))}
                        </span>
                    </div>
                </div>
                <button onClick={onLogout} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold backdrop-blur-sm transition-colors flex items-center gap-2">
                    <LogOut size={16} /> {t('logout')}
                </button>
            </div>

            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-500 ${!isValid ? 'blur-sm pointer-events-none opacity-50' : ''}`}>
                <div className="space-y-6">
                    <QRScannerComponent />
                    <AnnouncementSender providerId={provider.id} />
                </div>
                <FollowUpList providerId={provider.id} />
            </div>

            {!isValid && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
                    <div className="bg-surface dark:bg-surfaceDark border border-red-100 dark:border-red-900 rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center animate-slide-up">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock size={32} className="text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-dark dark:text-light mb-2">{t('accountLocked')}</h2>
                        <p className="text-gray-500 mb-6">{t('accountLockedDesc')}</p>
                        <a href="tel:0617774846" className="block w-full py-3 bg-dark text-white rounded-xl font-bold hover:bg-black transition-colors mb-3 shadow-lg">
                            {t('callAdmin')}
                        </a>
                        <button onClick={onLogout} className="text-sm text-gray-500 hover:text-dark underline">{t('logout')}</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProviderPortal;
