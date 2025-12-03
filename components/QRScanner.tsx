
import React, { useState, useRef, useEffect } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { AuthenticatedUser, ProviderNotification, AdRequest } from '../types';
import { supabase } from '../services/supabaseClient';
import { CheckCircle, XCircle, Camera, Loader2, Upload, MessageCircle, History, Users, Megaphone, Settings, ArrowLeft, Image as ImageIcon, QrCode, Bell, User, LayoutGrid, FileText, Lock, LogOut, Grid, Bookmark, Heart, Plus } from 'lucide-react';
import jsQR from 'jsqr';

// --- SUB-COMPONENTS (FULL SCREEN VIEWS) ---

const NotificationView: React.FC<{ providerId: number; onClose: () => void }> = ({ providerId, onClose }) => {
    const { t } = useLocalization();
    const [notifications, setNotifications] = useState<ProviderNotification[]>([]);
    
    useEffect(() => {
        const fetch = async () => {
            const { data } = await supabase.from('provider_notifications').select('*').eq('provider_id', providerId).order('created_at', { ascending: false });
            setNotifications(data || []);
        }
        fetch();
    }, []);

    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col animate-slide-up">
            <div className="p-4 border-b flex items-center gap-3">
                <button onClick={onClose}><ArrowLeft/></button>
                <h2 className="font-bold text-xl">{t('notifications')}</h2>
            </div>
            <div className="p-4 space-y-2">
                {notifications.map(n => (
                    <div key={n.id} className="p-4 bg-gray-50 rounded-xl border flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <p className="text-sm">{n.message}</p>
                    </div>
                ))}
                {notifications.length === 0 && <p className="text-center text-gray-500 mt-10">{t('noNotifications')}</p>}
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
        <div className="fixed inset-0 bg-white z-50 flex flex-col animate-slide-up">
            <div className="p-4 border-b flex items-center gap-3">
                <button onClick={onClose}><ArrowLeft/></button>
                <h2 className="font-bold text-xl">{t('scanHistory')}</h2>
            </div>
            <div className="p-4 space-y-2">
                {history.map((h, i) => (
                     <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                         <div><p className="font-bold text-sm">{h.client_name}</p><p className="text-xs text-gray-500">{new Date(h.created_at).toLocaleDateString()}</p></div>
                         <CheckCircle size={16} className="text-green-500"/>
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
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => { fetchRequests(); }, []);
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
            await supabase.storage.from('announcement-images').upload(fileName, file);
            const { data } = supabase.storage.from('announcement-images').getPublicUrl(fileName);
            setNewAd(prev => ({ ...prev, image: data.publicUrl }));
        } catch(e) {} finally { setLoading(false); }
    }

    const handleSubmit = async () => {
        if(!newAd.message) return;
        setLoading(true);
        await supabase.from('provider_ad_requests').insert({ provider_id: providerId, message: newAd.message, image_url: newAd.image, status: 'pending' });
        setNewAd({ message: '', image: '' });
        alert(t('requestSent'));
        fetchRequests();
        setLoading(false);
    }

    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col animate-slide-up">
            <div className="p-4 border-b flex items-center gap-3">
                <button onClick={onClose}><ArrowLeft/></button>
                <h2 className="font-bold text-xl">{t('requestBoost')}</h2>
            </div>
            <div className="p-4 space-y-4">
                 <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                     <textarea value={newAd.message} onChange={e => setNewAd({...newAd, message: e.target.value})} placeholder={t('messageLabel')} className="w-full p-2 rounded-lg border mb-2"/>
                     <button onClick={() => fileRef.current?.click()} className="w-full py-2 border border-dashed rounded-lg mb-2 bg-white flex justify-center gap-2 text-gray-500"><ImageIcon size={18}/> {t('uploadQRImage')}</button>
                     <input type="file" ref={fileRef} hidden onChange={handleUpload}/>
                     {newAd.image && <img src={newAd.image} className="h-20 w-full object-cover rounded-lg mb-2"/>}
                     <button onClick={handleSubmit} disabled={loading} className="w-full bg-purple-600 text-white py-2 rounded-lg font-bold">{t('sendButton')}</button>
                 </div>
                 {requests.map(r => (
                     <div key={r.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                         <div className="flex gap-2 items-center">
                             {r.image_url && <img src={r.image_url} className="w-10 h-10 rounded object-cover"/>}
                             <p className="text-sm font-semibold">{r.message}</p>
                         </div>
                         <span className="text-[10px] bg-yellow-100 px-2 py-1 rounded-full">{r.status}</span>
                     </div>
                 ))}
            </div>
        </div>
    );
}

const QRScannerView: React.FC<{ providerId: number; onClose: () => void }> = ({ providerId, onClose }) => {
    const { t } = useLocalization();
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width; canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if(ctx) {
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0,0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height);
                    if(code) processCode(code.data); else setStatus('error');
                }
            };
            img.src = ev.target?.result as string;
        };
        reader.readAsDataURL(file);
    }

    const processCode = async (data: string) => {
        try {
            const parsed = JSON.parse(data);
            if(!parsed.appointmentId) throw new Error();
            
            // Log visit logic
            await supabase.from('scan_history').insert({ provider_id: providerId, client_name: "Client #" + parsed.appointmentId, client_phone: "Verified" });
            
            setStatus('success');
        } catch(e) { setStatus('error'); }
    };

    return (
        <div className="fixed inset-0 bg-black text-white z-50 flex flex-col animate-slide-up">
            <div className="p-4 flex justify-between items-center">
                <button onClick={onClose}><ArrowLeft/></button>
                <span className="font-bold">{t('qrScannerTitle')}</span>
                <div/>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
                {status === 'success' ? (
                    <div className="text-center"><CheckCircle size={80} className="text-green-500 mx-auto"/><h2 className="text-2xl font-bold mt-4">{t('verificationSuccess')}</h2><button onClick={() => setStatus('idle')} className="mt-6 bg-white text-black px-6 py-2 rounded-full font-bold">Next</button></div>
                ) : status === 'error' ? (
                     <div className="text-center"><XCircle size={80} className="text-red-500 mx-auto"/><h2 className="text-2xl font-bold mt-4">{t('invalidQR')}</h2><button onClick={() => setStatus('idle')} className="mt-6 bg-white text-black px-6 py-2 rounded-full font-bold">Try Again</button></div>
                ) : (
                    <>
                        <div className="w-full aspect-square border-2 border-white/20 rounded-xl relative overflow-hidden flex items-center justify-center bg-gray-900">
                             <div className="absolute inset-0 animate-pulse bg-green-500/10"></div>
                             <p className="text-gray-400 text-sm">Camera Active</p>
                        </div>
                        <p className="text-center text-gray-400 text-sm">Align QR code within frame</p>
                        <div className="w-full pt-10 border-t border-gray-800">
                            <button onClick={() => fileRef.current?.click()} className="w-full bg-white text-black py-4 rounded-xl font-bold flex items-center justify-center gap-2"><ImageIcon/> {t('uploadQRImage')}</button>
                            <input type="file" ref={fileRef} hidden accept="image/*" onChange={handleFile}/>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// --- INSTAGRAM STYLE PORTAL ---
const ProviderPortal: React.FC<{ provider: AuthenticatedUser; onLogout: () => void }> = ({ provider, onLogout }) => {
    const { t } = useLocalization();
    const [view, setView] = useState<'scan' | 'notifications' | 'history' | 'ads' | null>(null);

    return (
        <div className="h-screen bg-white overflow-y-auto" dir="rtl">
            {/* Nav */}
            <div className="sticky top-0 bg-white z-10 p-3 border-b flex justify-between items-center shadow-sm">
                <h1 className="font-bold text-lg flex items-center gap-1">{provider.username || provider.name} <CheckCircle size={14} className="text-blue-500 fill-blue-500 text-white"/></h1>
                <div className="flex gap-4">
                    <button onClick={onLogout} className="text-xs font-bold bg-gray-100 px-3 py-1 rounded-md">{t('goToApp')}</button>
                    <Settings/>
                </div>
            </div>

            {/* Profile Header */}
            <div className="p-4">
                <div className="flex items-center gap-6 mb-4">
                    <div className="w-20 h-20 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 to-purple-600">
                        <img src={provider.profile_image_url || `https://ui-avatars.com/api/?name=${provider.name}`} className="w-full h-full rounded-full border-2 border-white object-cover"/>
                    </div>
                    <div className="flex-1 flex justify-around text-center">
                        <div><div className="font-bold text-lg">0</div><div className="text-xs text-gray-500">{t('posts')}</div></div>
                        <div><div className="font-bold text-lg">{provider.followers_count || 0}</div><div className="text-xs text-gray-500">{t('followers')}</div></div>
                        <div><div className="font-bold text-lg">{provider.visits_count || 0}</div><div className="text-xs text-gray-500">{t('visits')}</div></div>
                    </div>
                </div>
                <div>
                    <h2 className="font-bold">{provider.name}</h2>
                    <p className="text-gray-500 text-sm">{provider.service_type}</p>
                    <p className="text-sm whitespace-pre-line">{provider.bio || "Welcome to my official profile."}</p>
                </div>
                <div className="flex gap-2 mt-4 mb-6">
                    <button className="flex-1 bg-gray-100 py-1.5 rounded-lg font-bold text-sm">{t('edit')}</button>
                    <button className="flex-1 bg-gray-100 py-1.5 rounded-lg font-bold text-sm">{t('share')}</button>
                </div>

                {/* Highlights / Tools */}
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar mb-2">
                    <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => setView('scan')}>
                        <div className="w-16 h-16 rounded-full border bg-gray-50 flex items-center justify-center"><QrCode size={24}/></div>
                        <span className="text-xs">{t('qrScannerTitle')}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => setView('ads')}>
                        <div className="w-16 h-16 rounded-full border bg-gray-50 flex items-center justify-center"><Megaphone size={24} className="text-pink-500"/></div>
                        <span className="text-xs">{t('requestBoost')}</span>
                    </div>
                </div>

                {/* Grid Tabs */}
                <div className="flex border-t border-b">
                     <button className="flex-1 py-3 flex justify-center border-b-2 border-black"><Grid size={24}/></button>
                     <button className="flex-1 py-3 flex justify-center text-gray-400"><Bookmark size={24}/></button>
                </div>

                {/* The "Grid" (Actually the Tools) */}
                <div className="grid grid-cols-3 gap-0.5 mt-0.5">
                    <div onClick={() => setView('notifications')} className="aspect-square bg-gray-100 relative group cursor-pointer border border-white">
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-200">
                             <Bell size={24} className="mb-1"/>
                             <span className="text-[10px] font-bold">{t('notifications')}</span>
                        </div>
                    </div>
                    <div onClick={() => setView('history')} className="aspect-square bg-gray-100 relative group cursor-pointer border border-white">
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-200">
                             <History size={24} className="mb-1"/>
                             <span className="text-[10px] font-bold">{t('scanHistory')}</span>
                        </div>
                    </div>
                    {/* Filler items */}
                    {[1,2,3,4].map(i => <div key={i} className="aspect-square bg-gray-100"/>)}
                </div>
            </div>

            {view === 'scan' && <QRScannerView providerId={provider.id} onClose={() => setView(null)} />}
            {view === 'notifications' && <NotificationView providerId={provider.id} onClose={() => setView(null)} />}
            {view === 'history' && <HistoryView providerId={provider.id} onClose={() => setView(null)} />}
            {view === 'ads' && <AdsView providerId={provider.id} onClose={() => setView(null)} />}
        </div>
    );
};

export default ProviderPortal;
