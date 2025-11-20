
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { BookingDetails, FollowUp, AuthenticatedUser } from '../types';
import { supabase } from '../services/supabaseClient';
import { CheckCircle, XCircle, Camera, Loader2, Upload, Send, LogOut, User, Calendar, FileText, Lock, Phone, X } from 'lucide-react';
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

    // Clean up camera on unmount or when scanner closes
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    // Start/Stop camera based on showScanner state
    useEffect(() => {
        if (showScanner) {
            startCamera();
        } else {
            stopCamera();
        }
    }, [showScanner]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Wait for video to be ready before starting scan loop
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().catch(e => console.error("Play error:", e));
                    requestRef.current = requestAnimationFrame(scanVideoFrame);
                };
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError(t('qrScannerInstruction')); // Fallback error message or "Use upload instead"
            setShowScanner(false);
        }
    };

    const stopCamera = () => {
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
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
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });

                if (code) {
                    handleScanResult({ text: code.data });
                    return; // Stop scanning loop
                }
            }
        }
        requestRef.current = requestAnimationFrame(scanVideoFrame);
    };

    const processQrCodeText = async (qrCodeText: string | undefined) => {
        if (!qrCodeText) {
            setError(t('invalidQR'));
            return;
        }
        try {
            const data = JSON.parse(qrCodeText);
            if (data.appointmentId && typeof data.appointmentId === 'number') {
                await verifyAppointment(data.appointmentId);
            } else { throw new Error('Invalid QR content'); }
        } catch (e) { setError(t('invalidQR')); }
    };
    
    const verifyAppointment = async (appointmentId: number) => {
        try {
            const { data, error: dbError } = await supabase
                .from('appointments')
                .select(`id, clients (full_name, phone), providers (name, service_type, location)`)
                .eq('id', appointmentId).single();
            if (dbError || !data) throw new Error(t('appointmentNotFound'));

            const verifiedDetails: ScannedAppointment = {
                appointmentId: data.id,
                name: data.clients.full_name,
                phone: data.clients.phone,
                service: data.providers.service_type,
                provider: data.providers.name,
                location: data.providers.location,
                discount: "19%",
            };
            setScannedData(verifiedDetails);
        } catch (e: any) { setError(e.message || t('invalidQR')); }
    }

    const handleScanResult = async (result: { text: string }) => {
        if (result && result.text) {
            setShowScanner(false); // UI update to hide scanner
            stopCamera(); // Stop the stream
            setIsVerifying(true);
            setError(null);
            setScannedData(null);
            await processQrCodeText(result.text);
            setIsVerifying(false);
        }
    };

    const handleUploadClick = () => { fileInputRef.current?.click(); };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (event.target) event.target.value = '';
        if (!file) return;

        setIsVerifying(true); setError(null); setScannedData(null);

        const processFile = async (fileToProcess: File) => {
            const image = new Image();
            image.src = URL.createObjectURL(fileToProcess);
            await image.decode();
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) {
                setError('Could not create canvas context');
                return;
            }
            canvas.width = image.width;
            canvas.height = image.height;
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code) { await processQrCodeText(code.data); } else { setError(t('qrNotDetected')); }
        };
        
        processFile(file).finally(() => setIsVerifying(false));
    };
    
    const resetScanner = () => {
        setScannedData(null);
        setError(null);
        setShowScanner(false);
    };

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex flex-col items-center text-center">
            <h3 className="text-xl font-bold text-dark dark:text-light mb-2">{t('qrScannerTitle')}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{t('qrScannerInstruction')}</p>
            {!showScanner && !scannedData && !error && !isVerifying && (
                 <>
                    <div className="flex flex-col sm:flex-row gap-4 w-full">
                        <button onClick={() => setShowScanner(true)} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-dark transition-colors text-lg"><Camera size={24} />{t('scanWithCamera')}</button>
                        <button onClick={handleUploadClick} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-white rounded-lg hover:bg-primary transition-colors text-lg"><Upload size={24} />{t('uploadQRCode')}</button>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" aria-hidden="true" />
                </>
            )}
            {showScanner && (
                <div className="relative w-full h-64 md:h-80 bg-black rounded-lg overflow-hidden border-4 border-gray-300 dark:border-gray-600 mb-4">
                     <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                     <div className="absolute inset-0 border-2 border-primary/50 pointer-events-none animate-pulse m-8 rounded-lg"></div>
                     <button 
                        onClick={() => setShowScanner(false)}
                        className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                     >
                        <X size={20} />
                     </button>
                </div>
            )}
            {isVerifying && (<div className="flex flex-col items-center justify-center gap-4 p-4"><Loader2 className="animate-spin text-primary" size={48} /><p className="text-lg text-gray-700 dark:text-gray-300">{t('verifying')}</p></div>)}
            {scannedData && (
                <div className="w-full mt-4 p-4 border-2 border-green-500 bg-green-50 dark:bg-gray-700/50 rounded-lg text-left text-gray-800 dark:text-gray-300">
                    <div className="flex items-center gap-3 mb-3"><CheckCircle className="text-green-600" size={32} /><h3 className="text-xl font-semibold text-green-800 dark:text-green-400">{t('verificationSuccess')}</h3></div>
                    <p><strong>{t('appointmentID')}:</strong> {scannedData.appointmentId}</p><p><strong>{t('clientName')}:</strong> {scannedData.name}</p><p><strong>{t('serviceBooked')}:</strong> {scannedData.service}</p><p><strong>{t('provider')}:</strong> {scannedData.provider}</p><p><strong>{t('discount')}:</strong> <span className="font-bold">{scannedData.discount}</span></p>
                    <button onClick={resetScanner} className="mt-4 w-full px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary transition-colors">{t('scanAnother')}</button>
                </div>
            )}
            {error && (
                <div className="w-full mt-4 p-4 border-2 border-red-500 bg-red-50 dark:bg-gray-700/50 rounded-lg text-gray-800 dark:text-gray-300">
                    <div className="flex items-center gap-3 mb-3"><XCircle className="text-red-600" size={32} /><h3 className="text-xl font-semibold text-red-800 dark:text-red-400">{t('verificationFailed')}</h3></div>
                    <p>{error}</p>
                    <button onClick={resetScanner} className="mt-4 w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">{t('tryAgain')}</button>
                </div>
            )}
        </div>
    );
};

const AnnouncementSender: React.FC<{ providerId: number }> = ({ providerId }) => {
    const { t } = useLocalization();
    const [announcementMessage, setAnnouncementMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sendSuccess, setSendSuccess] = useState<string|null>(null);
    const [sendError, setSendError] = useState<string|null>(null);
    
    const handleSendAnnouncement = async () => {
        if (!announcementMessage.trim()) {
            setSendError(t('announcementValidationError'));
            return;
        }
        setIsSending(true);
        setSendError(null);
        setSendSuccess(null);
        try {
            const { error } = await supabase.from('announcements').insert({
                provider_id: providerId,
                message: announcementMessage.trim()
            });
            if (error) throw error;
            setSendSuccess(t('announcementSuccessMessage'));
            setAnnouncementMessage('');
        } catch(e) {
            setSendError(t('errorMessage'));
            console.error(e);
        } finally {
            setIsSending(false);
            setTimeout(() => { setSendSuccess(null); setSendError(null); }, 5000);
        }
    };
    
    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex flex-col items-center text-center">
            <h3 className="text-xl font-bold text-dark dark:text-light mb-2">{t('sendAnnouncementTitle')}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{t('sendAnnouncementDesc')}</p>
            <div className="w-full space-y-4">
                <div>
                    <label htmlFor="announcement-message" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white text-left rtl:text-right">{t('messageLabel')}</label>
                    <textarea id="announcement-message" rows={4} value={announcementMessage} onChange={(e) => setAnnouncementMessage(e.target.value)} className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" placeholder={t('messagePlaceholder')}></textarea>
                </div>
                <button onClick={handleSendAnnouncement} disabled={isSending} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-dark transition-colors text-lg disabled:bg-gray-400">
                    {isSending ? <Loader2 className="animate-spin" /> : <Send size={24} />}
                    {t('sendButton')}
                </button>
                {sendSuccess && <p className="mt-2 text-green-600 dark:text-green-400">{sendSuccess}</p>}
                {sendError && <p className="mt-2 text-red-600 dark:text-red-400">{sendError}</p>}
            </div>
        </div>
    );
};

const FollowUpList: React.FC<{ providerId: number }> = ({ providerId }) => {
    const { t } = useLocalization();
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFollowUps = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('follow_ups')
                .select('*, clients(full_name, phone)')
                .eq('provider_id', providerId)
                .order('next_appointment_date', { ascending: true });
            
            if (data) {
                setFollowUps(data as FollowUp[]);
            }
            setIsLoading(false);
        };
        fetchFollowUps();
    }, [providerId]);
    
    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-dark dark:text-light mb-2">{t('clientFollowUps')}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{t('clientFollowUpsDesc')}</p>
            {isLoading ? (
                 <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin text-primary" size={32} /></div>
            ) : followUps.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-10">{t('noFollowUps')}</p>
            ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {followUps.map(fu => (
                        <div key={fu.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div className="flex items-center gap-3 mb-2">
                                <User className="text-secondary" />
                                <span className="font-bold text-dark dark:text-light">{fu.clients.full_name}</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">{fu.clients.phone}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 mb-2">
                                <Calendar className="text-primary" size={16} />
                                <span>{t('nextAppointment')}: {new Date(fu.next_appointment_date).toLocaleString()}</span>
                            </div>
                            <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                                <FileText className="text-primary mt-1" size={16} />
                                <p className="flex-1 whitespace-pre-wrap"><strong>{t('notes')}:</strong> {fu.notes}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

interface ProviderPortalProps {
    provider: AuthenticatedUser;
    onLogout: () => void;
}

const ProviderPortal: React.FC<ProviderPortalProps> = ({ provider, onLogout }) => {
    const { t } = useLocalization();

    // Calculate if subscription is valid
    const isSubscriptionValid = React.useMemo(() => {
        if (!provider.isActive) return false;
        if (!provider.subscriptionEndDate) return false; // Assuming date is required for validity if active
        return new Date(provider.subscriptionEndDate) > new Date();
    }, [provider]);
    
    // Calculate days left
    const daysLeft = React.useMemo(() => {
        if (!provider.subscriptionEndDate) return 0;
        const diff = new Date(provider.subscriptionEndDate).getTime() - new Date().getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }, [provider.subscriptionEndDate]);

    return (
        <div className="w-full max-w-4xl mx-auto mt-8 flex flex-col gap-8 relative">
            <div className="flex justify-between items-center">
                <div className="flex flex-col">
                    <h2 className="text-2xl font-bold text-dark dark:text-light flex items-center gap-2">
                        {t('welcomeProvider', {name: provider.name})}
                    </h2>
                    {isSubscriptionValid ? (
                        <span className="text-sm font-bold text-green-600 dark:text-green-400 mt-1">
                            {t('daysRemaining', { days: daysLeft })}
                        </span>
                    ) : (
                         <span className="text-sm font-bold text-red-600 dark:text-red-400 mt-1">
                            {provider.isActive ? t('statusExpired') : t('statusPending')}
                        </span>
                    )}
                </div>
                <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-dark dark:text-light rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                    <LogOut size={18} />
                    {t('logout')}
                </button>
            </div>

            {/* Main Content - Blurred if Locked */}
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 items-start transition-all duration-300 ${!isSubscriptionValid ? 'blur-md pointer-events-none select-none opacity-50' : ''}`}>
                <div className="flex flex-col gap-8">
                    <QRScannerComponent />
                    <AnnouncementSender providerId={provider.id} />
                </div>
                <FollowUpList providerId={provider.id} />
            </div>

            {/* Locked Overlay */}
            {!isSubscriptionValid && (
                <div className="absolute inset-0 z-50 flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 border-2 border-red-500 rounded-xl shadow-2xl p-8 max-w-md text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Lock size={40} className="text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-4">{t('accountLocked')}</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg">
                            {t('accountLockedDesc')}
                        </p>
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-6 border border-gray-300 dark:border-gray-600">
                             <div className="flex items-center justify-center gap-2 text-xl font-bold text-dark dark:text-light">
                                <Phone className="text-secondary" />
                                <span>0617774846</span>
                             </div>
                        </div>
                         <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('callAdmin')}</p>
                         <button onClick={onLogout} className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-dark dark:text-light rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium">
                            {t('logout')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProviderPortal;
