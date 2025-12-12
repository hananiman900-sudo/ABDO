
import React, { useState, useRef, useEffect } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { AuthenticatedUser, ProviderNotification, AdRequest, Offer, UrgentAd, ProviderAd } from '../types';
import { supabase } from '../services/supabaseClient';
import { CheckCircle, XCircle, Camera, Loader2, Upload, MessageCircle, History, Users, Megaphone, Settings, ArrowLeft, Image as ImageIcon, QrCode, Bell, User, LayoutGrid, FileText, Lock, LogOut, Grid, Bookmark, Heart, Plus, Zap, Tag, Instagram, Facebook, MapPin, Edit3, Share2, Info, Trash2, Edit, ShieldAlert, Save, X, Database, BrainCircuit, Sparkles, Banknote, Clock, Map, CalendarCheck, Hourglass, MessageSquare, AlertCircle } from 'lucide-react';
import jsQR from 'jsqr';

// ... (Previous sub-components: NotificationView, HistoryView, UrgentAdsView, OffersView, AdsView, QRScannerView, EditProfileModal, AIInstructionsView remain unchanged)

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
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col animate-slide-up">
            <div className="p-4 border-b dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-800">
                <button onClick={onClose}><ArrowLeft className="dark:text-white"/></button>
                <h2 className="font-bold text-xl dark:text-white">{t('notifications')}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
                {notifications.map(n => (
                    <div key={n.id} className={`p-4 rounded-xl border flex items-start gap-3 ${n.status === 'completed' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                        <div className={`mt-1 w-3 h-3 rounded-full ${n.status === 'completed' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold dark:text-gray-200">{n.message}</p>
                            <p className="text-xs mt-1 opacity-70 dark:text-gray-400">
                                {new Date(n.created_at).toLocaleDateString()} • {n.status === 'completed' ? t('statusVerified') : t('statusPending')}
                            </p>
                        </div>
                        {n.status === 'completed' && <CheckCircle size={16} className="text-green-600 dark:text-green-400"/>}
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
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col animate-slide-up">
            <div className="p-4 border-b dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-800">
                <button onClick={onClose}><ArrowLeft className="dark:text-white"/></button>
                <h2 className="font-bold text-xl dark:text-white">{t('statsTitle')}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-sm text-left rtl:text-right">
                        <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300">
                            <tr>
                                <th className="p-3">{t('clientName')}</th>
                                <th className="p-3">{t('visitDate')}</th>
                                <th className="p-3">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {history.map((h, i) => (
                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="p-3 font-bold dark:text-white">{h.client_name}</td>
                                    <td className="p-3 text-gray-500 dark:text-gray-400">{new Date(h.created_at).toLocaleDateString()}</td>
                                    <td className="p-3 text-xs dark:text-gray-400"><span className="block">{h.client_phone}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

const UrgentAdsView: React.FC<{ providerId: number; onClose: () => void }> = ({ providerId, onClose }) => {
    const { t } = useLocalization();
    const [ads, setAds] = useState<UrgentAd[]>([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    useEffect(() => { fetchAds(); }, []);
    const fetchAds = async () => {
        const { data } = await supabase.from('urgent_ads').select('*').eq('provider_id', providerId).order('created_at', { ascending: false });
        setAds(data || []);
    }
    const handleCreateOrUpdate = async () => {
        if(!message.trim()) return;
        setLoading(true);
        if (editingId) {
            const { error } = await supabase.from('urgent_ads').update({ message }).eq('id', editingId);
            if(!error) { setMessage(''); setEditingId(null); fetchAds(); alert(t('success')); }
        } else {
            const { error } = await supabase.from('urgent_ads').insert({ provider_id: providerId, message, is_active: true });
            if(!error) { setMessage(''); fetchAds(); alert(t('success')); }
        }
        setLoading(false);
    }
    const handleEdit = (ad: UrgentAd) => { setMessage(ad.message); setEditingId(ad.id); }
    const handleDelete = async (id: number) => { if(confirm(t('delete') + '?')) { await supabase.from('urgent_ads').delete().eq('id', id); fetchAds(); } }
    const cancelEdit = () => { setMessage(''); setEditingId(null); }

    return (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col animate-slide-up">
             <div className="p-4 border-b dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-800">
                <button onClick={onClose}><ArrowLeft className="dark:text-white"/></button>
                <h2 className="font-bold text-xl dark:text-white">{t('urgentAds')}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-700 flex items-start gap-3">
                    <Info className="text-yellow-600 dark:text-yellow-400 shrink-0 mt-1"/>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">{t('urgentAdsDesc')}</p>
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Urgent message..." className="flex-1 border p-2 rounded-lg outline-none focus:border-yellow-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"/>
                        {editingId && <button onClick={cancelEdit} className="bg-gray-200 text-gray-700 px-3 rounded-lg"><X/></button>}
                    </div>
                    <button onClick={handleCreateOrUpdate} disabled={loading} className={`w-full text-white px-4 py-3 rounded-lg font-bold shadow-sm ${editingId ? 'bg-blue-600' : 'bg-red-500'}`}>
                        {loading ? <Loader2 className="animate-spin mx-auto"/> : (editingId ? t('save') : t('postAd'))}
                    </button>
                </div>
                <div className="space-y-3 mt-4">
                    {ads.map(ad => (
                        <div key={ad.id} className="p-3 bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 rounded-lg flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700">
                            <span className="text-sm font-bold text-gray-800 dark:text-white line-clamp-2 flex-1">{ad.message}</span>
                            <div className="flex gap-2 ml-2">
                                <button onClick={() => handleEdit(ad)} className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-600 hover:bg-blue-100"><Edit size={16}/></button>
                                <button onClick={() => handleDelete(ad.id)} className="p-2 bg-red-50 dark:bg-red-900/30 rounded-full text-red-500 hover:bg-red-100"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

const OffersView: React.FC<{ providerId: number; onClose: () => void }> = ({ providerId, onClose }) => {
    const { t } = useLocalization();
    const [offers, setOffers] = useState<Offer[]>([]);
    const [form, setForm] = useState({ title: '', original_price: '', discount_price: '', image: '' });
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => { fetchOffers(); }, []);
    const fetchOffers = async () => {
        const { data } = await supabase.from('provider_offers').select('*').eq('provider_id', providerId).order('created_at', { ascending: false });
        setOffers(data || []);
    }
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if(!file) return; setLoading(true);
        try {
            const fileName = `offer_${providerId}_${Date.now()}`;
            await supabase.storage.from('product-images').upload(fileName, file);
            const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
            setForm(prev => ({ ...prev, image: data.publicUrl }));
        } catch(e) {} finally { setLoading(false); }
    }
    const handleCreateOrUpdate = async () => {
        if(!form.title) return; setLoading(true);
        const payload = { provider_id: providerId, title: form.title, original_price: parseFloat(form.original_price || '0'), discount_price: parseFloat(form.discount_price || '0'), image_url: form.image };
        if (editingId) await supabase.from('provider_offers').update(payload).eq('id', editingId); else await supabase.from('provider_offers').insert(payload);
        setForm({ title: '', original_price: '', discount_price: '', image: '' }); setEditingId(null); fetchOffers(); setLoading(false); alert(t('success'));
    }
    const handleEdit = (o: Offer) => { setForm({ title: o.title, original_price: o.original_price?.toString() || '', discount_price: o.discount_price?.toString() || '', image: o.image_url || '' }); setEditingId(o.id); }
    const handleDelete = async (id: number) => { if(confirm(t('delete') + '?')) { await supabase.from('provider_offers').delete().eq('id', id); fetchOffers(); } }
    const cancelEdit = () => { setForm({ title: '', original_price: '', discount_price: '', image: '' }); setEditingId(null); }

    return (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col animate-slide-up">
            <div className="p-4 border-b dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-800">
                <button onClick={onClose}><ArrowLeft className="dark:text-white"/></button>
                <h2 className="font-bold text-xl dark:text-white">{t('offers')}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20 bg-gray-50 dark:bg-gray-900">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700 shadow-sm space-y-3">
                    <div className="flex justify-between items-center"><h3 className="font-bold text-gray-700 dark:text-gray-200">{editingId ? t('edit') : t('createOffer')}</h3>{editingId && <button onClick={cancelEdit} className="text-gray-400"><X size={18}/></button>}</div>
                    <input placeholder={t('titleLabel')} value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full p-2 rounded border dark:border-gray-600 dark:bg-gray-700 dark:text-white outline-none focus:border-blue-500"/>
                    <div className="flex gap-2">
                         <input type="number" placeholder={t('originalPrice')} value={form.original_price} onChange={e => setForm({...form, original_price: e.target.value})} className="flex-1 p-2 rounded border dark:border-gray-600 dark:bg-gray-700 dark:text-white outline-none focus:border-blue-500"/>
                         <input type="number" placeholder={t('discountPrice')} value={form.discount_price} onChange={e => setForm({...form, discount_price: e.target.value})} className="flex-1 p-2 rounded border dark:border-gray-600 dark:bg-gray-700 dark:text-white outline-none focus:border-blue-500"/>
                    </div>
                    <button onClick={() => fileRef.current?.click()} className="w-full py-2 bg-gray-50 dark:bg-gray-700 border border-dashed rounded flex justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600"><ImageIcon size={18}/> Image</button>
                    <input type="file" ref={fileRef} hidden onChange={handleUpload}/>
                    {form.image && <img src={form.image} className="h-20 object-cover rounded w-full"/>}
                    <button onClick={handleCreateOrUpdate} disabled={loading} className={`w-full text-white py-2 rounded font-bold shadow-sm ${editingId ? 'bg-green-600' : 'bg-blue-600'}`}>{loading ? <Loader2 className="animate-spin mx-auto"/> : (editingId ? t('save') : t('save'))}</button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                    {offers.map(o => (
                        <div key={o.id} className="border dark:border-gray-700 rounded-xl p-3 bg-white dark:bg-gray-800 shadow-sm flex gap-3 relative hover:shadow-md transition-shadow">
                            {o.image_url && <img src={o.image_url} className="w-20 h-20 object-cover rounded-lg bg-gray-100"/>}
                            <div className="flex-1"><h4 className="font-bold text-sm dark:text-white">{o.title}</h4><div className="flex gap-2 text-xs mt-1">{o.original_price > 0 && <span className="line-through text-gray-400">{o.original_price} DH</span>}<span className="text-red-500 font-bold">{o.discount_price} DH</span></div></div>
                            <div className="flex flex-col gap-2 justify-center"><button onClick={() => handleEdit(o)} className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-blue-500 hover:bg-blue-100"><Edit size={16}/></button><button onClick={() => handleDelete(o.id)} className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-full text-red-500 hover:bg-red-100"><Trash2 size={16}/></button></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

const AdsView: React.FC<{ providerId: number; onClose: () => void }> = ({ providerId, onClose }) => {
    const { t } = useLocalization();
    const [requests, setRequests] = useState<AdRequest[]>([]);
    const [newAd, setNewAd] = useState({ message: '', image: '' });
    const [loading, setLoading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => { fetchRequests(); }, []);
    const fetchRequests = async () => {
        const { data } = await supabase.from('provider_ad_requests').select('*, providers(name)').eq('provider_id', providerId).order('created_at', { ascending: false });
        setRequests(data as any || []);
    }
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if(!file) return; setLoading(true);
        try { const fileName = `req_${providerId}_${Date.now()}`; await supabase.storage.from('announcement-images').upload(fileName, file); const { data } = supabase.storage.from('announcement-images').getPublicUrl(fileName); setNewAd(prev => ({ ...prev, image: data.publicUrl })); } catch(e) {} finally { setLoading(false); }
    }
    const handleSubmit = async () => {
        if(!newAd.message) return; setLoading(true);
        await supabase.from('provider_ad_requests').insert({ provider_id: providerId, message: newAd.message, image_url: newAd.image, status: 'pending' });
        setNewAd({ message: '', image: '' }); alert('تم استلام طلبك. طلبك في طور الإنجاز. سيقوم الأدمن بمراجعة الإعلان والاتصال بكم.'); fetchRequests(); setLoading(false);
    }

    return (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col animate-slide-up">
            <div className="p-4 border-b dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-800">
                <button onClick={onClose}><ArrowLeft className="dark:text-white"/></button>
                <h2 className="font-bold text-xl dark:text-white">{t('requestBoost')}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 bg-gray-50 dark:bg-gray-900">
                 <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
                    <p className="text-sm text-purple-800 dark:text-purple-200 font-bold mb-3">{t('paidAdDesc')}</p>
                    <textarea value={newAd.message} onChange={e => setNewAd({...newAd, message: e.target.value})} placeholder={t('messageLabel')} className="w-full p-2 rounded-lg border dark:border-gray-600 dark:bg-gray-800 dark:text-white mb-2"/>
                    <button onClick={() => fileRef.current?.click()} className="w-full py-2 border border-dashed rounded-lg mb-2 bg-white dark:bg-gray-800 dark:border-gray-600 flex justify-center gap-2 text-gray-500 dark:text-gray-300 hover:bg-gray-50">
                        <ImageIcon size={18}/> {t('uploadQRImage')}
                    </button>
                    <input type="file" ref={fileRef} hidden onChange={handleUpload}/>
                    {newAd.image && <img src={newAd.image} className="h-24 w-full object-cover rounded-lg mb-2"/>}
                    <button onClick={handleSubmit} disabled={loading} className="w-full bg-purple-600 text-white py-2 rounded-lg font-bold shadow-md hover:bg-purple-700 transition-colors">
                        {loading ? <Loader2 className="animate-spin mx-auto"/> : t('sendButton')}
                    </button>
                </div>
                 <div className="space-y-3"><h3 className="font-bold text-gray-700 dark:text-gray-300 text-sm uppercase">Request History</h3>{requests.length === 0 && <p className="text-gray-400 text-sm text-center">No ad requests sent.</p>}{requests.map(r => (<div key={r.id} className="p-3 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 flex justify-between items-center shadow-sm"><div className="flex gap-2 items-center">{r.image_url && <img src={r.image_url} className="w-10 h-10 rounded object-cover bg-gray-200"/><div><p className="text-sm font-semibold line-clamp-1 dark:text-white">{r.message}</p><p className="text-[10px] text-gray-400">{new Date(r.created_at).toLocaleDateString()}</p></div></div><span className={`text-[10px] px-2 py-1 rounded-full font-bold ${r.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.status === 'pending' ? 'في طور الإنجاز' : 'مقبول'}</span></div>))}</div>
            </div>
        </div>
    );
}

const QRScannerView: React.FC<{ providerId: number; onClose: () => void }> = ({ providerId, onClose }) => {
    // ... (QR Scanner Logic Remains unchanged)
    const { t } = useLocalization();
    const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'wrong_provider'>('idle');
    const [scannedClientName, setScannedClientName] = useState('');
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [scanning, setScanning] = useState(true);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!scanning) return;
        const startVideo = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.setAttribute("playsinline", "true"); videoRef.current.play(); requestAnimationFrame(tick); }
            } catch (err) { console.error("Camera error", err); }
        };
        startVideo();
        return () => { if(videoRef.current?.srcObject) { const tracks = (videoRef.current.srcObject as MediaStream).getTracks(); tracks.forEach(track => track.stop()); } }
    }, [scanning]);

    const tick = () => {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            const canvas = canvasRef.current;
            if (canvas) {
                canvas.height = videoRef.current.videoHeight; canvas.width = videoRef.current.videoWidth;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
                    if (code) { processCode(code.data); return; }
                }
            }
        }
        if (scanning) requestAnimationFrame(tick);
    };

    const processCode = async (data: string) => {
        setScanning(false);
        try {
            const parsed = JSON.parse(data);
            if(!parsed.appointmentId) throw new Error();
            
            // Allow scanning even if providerId is missing/mismatch for fallback scenarios, 
            // BUT prefer strict checking if providerId is in QR
            if (parsed.providerId && parsed.providerId !== providerId) { 
                setStatus('wrong_provider'); 
                return; 
            }

            const clientName = parsed.clientName || `Client #${parsed.appointmentId}`;
            setScannedClientName(clientName);
            
            // 1. Log to History
            await supabase.from('scan_history').insert({ provider_id: providerId, client_name: clientName, client_phone: "Verified" });
            
            // 2. Update Provider Stats
            const { data: p } = await supabase.from('providers').select('visits_count').eq('id', providerId).single();
            await supabase.from('providers').update({ visits_count: (p?.visits_count || 0) + 1 }).eq('id', providerId);
            
            // 3. Mark Notification as Completed (Red to Green)
            await supabase.from('provider_notifications').insert({
                provider_id: providerId,
                message: `Visit Completed: ${clientName} (Scanned)`,
                type: 'SYSTEM',
                status: 'completed',
                is_read: false
            });

            setStatus('success');
        } catch(e) { setStatus('error'); }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if(!file) return; setScanning(false);
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image(); img.onload = () => {
                const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if(ctx) { ctx.drawImage(img, 0, 0); const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height); const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' }); if(code) processCode(code.data); else setStatus('error'); }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col animate-fade-in items-center justify-center p-4">
             <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl overflow-hidden relative shadow-2xl">
                 <div className="p-4 bg-black text-white flex justify-between items-center"><button onClick={onClose}><ArrowLeft/></button><span className="font-bold">{t('qrScannerTitle')}</span><div/></div>
                 <div className="p-6 flex flex-col items-center gap-6">
                    {status === 'success' ? (<div className="text-center py-10"><CheckCircle size={80} className="text-green-500 mx-auto"/><h2 className="text-2xl font-bold mt-4 dark:text-white">{t('verificationSuccess')}</h2><p className="text-lg font-semibold mt-2 text-gray-700 dark:text-gray-300">{scannedClientName}</p><button onClick={() => { setStatus('idle'); setScanning(true); }} className="mt-6 bg-black text-white px-6 py-2 rounded-full font-bold">Next</button></div>) : status === 'error' ? (<div className="text-center py-10"><XCircle size={80} className="text-red-500 mx-auto"/><h2 className="text-2xl font-bold mt-4 dark:text-white">{t('invalidQR')}</h2><button onClick={() => { setStatus('idle'); setScanning(true); }} className="mt-6 bg-black text-white px-6 py-2 rounded-full font-bold">Try Again</button></div>) : status === 'wrong_provider' ? (<div className="text-center py-10"><ShieldAlert size={80} className="text-orange-500 mx-auto"/><h2 className="text-xl font-bold mt-4 text-orange-600">{t('wrongProvider')}</h2><button onClick={() => { setStatus('idle'); setScanning(true); }} className="mt-6 bg-black text-white px-6 py-2 rounded-full font-bold">Try Again</button></div>) : (<><div className="w-full aspect-square max-h-[300px] bg-black rounded-xl overflow-hidden relative">{scanning ? (<><video ref={videoRef} className="absolute inset-0 w-full h-full object-cover"/><div className="absolute inset-0 border-2 border-green-500/50 m-8 rounded-lg animate-pulse"></div><canvas ref={canvasRef} hidden /></>) : (<div className="flex items-center justify-center h-full text-white">Processing Image...</div>)}</div><div className="w-full text-center"><p className="text-sm text-gray-500 mb-4">Align QR code or upload file from gallery</p><button onClick={() => fileRef.current?.click()} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl font-bold text-gray-500 hover:border-black hover:text-black transition-colors flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"><Upload size={24}/> {t('uploadQRImage')}</button><input type="file" ref={fileRef} hidden accept="image/*" onChange={handleFileUpload}/></div></>)}
                 </div>
             </div>
        </div>
    );
}

// ... (EditProfileModal and AIInstructionsView remain unchanged)
const EditProfileModal: React.FC<{ provider: AuthenticatedUser; onClose: () => void; onUpdateUser: (updates: Partial<AuthenticatedUser>) => void }> = ({ provider, onClose, onUpdateUser }) => {
    // ... same code ...
    const { t } = useLocalization();
    const [form, setForm] = useState({ bio: provider.bio || '', instagram: provider.social_links?.instagram || '', facebook: provider.social_links?.facebook || '', gps: provider.social_links?.gps || '', image: provider.profile_image_url || '' });
    const [loading, setLoading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if(!file) return; setLoading(true); try { const fileName = `avatar_${provider.id}_${Date.now()}`; await supabase.storage.from('profiles').upload(fileName, file); const { data } = supabase.storage.from('profiles').getPublicUrl(fileName); const publicUrl = data.publicUrl; setForm(prev => ({ ...prev, image: publicUrl })); await supabase.from('providers').update({ profile_image_url: publicUrl }).eq('id', provider.id); onUpdateUser({ profile_image_url: publicUrl }); } catch(e) { console.error(e); } finally { setLoading(false); } }
    const handleSave = async () => { setLoading(true); const updates = { bio: form.bio, social_links: { instagram: form.instagram, facebook: form.facebook, gps: form.gps }, profile_image_url: form.image }; const { error } = await supabase.from('providers').update(updates).eq('id', provider.id); setLoading(false); if(!error) { onUpdateUser(updates); alert(t('success')); onClose(); } else alert(t('errorMessage')); }
    return (<div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"><div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6 space-y-4"><h2 className="font-bold text-lg dark:text-white">{t('editProfile')}</h2><div className="flex justify-center mb-2"><div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden relative cursor-pointer" onClick={() => fileRef.current?.click()}>{form.image ? <img src={form.image} className="w-full h-full object-cover"/> : <Camera className="absolute inset-0 m-auto text-gray-400"/>}{loading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white"><Loader2 className="animate-spin"/></div>}</div><input type="file" ref={fileRef} hidden onChange={handleImageUpload} /></div><textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} placeholder={t('bioLabel')} className="w-full p-2 border rounded-lg h-24 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"/><div className="space-y-2"><h4 className="font-bold text-xs uppercase text-gray-400">{t('socialLinks')}</h4><div className="flex items-center gap-2 border dark:border-gray-600 rounded-lg p-2"><Instagram size={16} className="dark:text-white"/><input value={form.instagram} onChange={e => setForm({...form, instagram: e.target.value})} placeholder="Instagram Username" className="flex-1 outline-none text-sm dark:bg-gray-800 dark:text-white"/></div><div className="flex items-center gap-2 border dark:border-gray-600 rounded-lg p-2"><Facebook size={16} className="dark:text-white"/><input value={form.facebook} onChange={e => setForm({...form, facebook: e.target.value})} placeholder="Facebook Username" className="flex-1 outline-none text-sm dark:bg-gray-800 dark:text-white"/></div><div className="flex items-center gap-2 border dark:border-gray-600 rounded-lg p-2"><MapPin size={16} className="dark:text-white"/><input value={form.gps} onChange={e => setForm({...form, gps: e.target.value})} placeholder="GPS Coordinates" className="flex-1 outline-none text-sm dark:bg-gray-800 dark:text-white"/></div></div><div className="flex gap-2"><button onClick={onClose} className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 dark:text-white rounded-lg">{t('cancel')}</button><button onClick={handleSave} disabled={loading} className="flex-1 py-2 bg-black text-white rounded-lg font-bold">{t('saveProfile')}</button></div></div></div>)
}

const AIInstructionsView: React.FC<{ provider: AuthenticatedUser; onClose: () => void; onUpdateUser: (updates: Partial<AuthenticatedUser>) => void }> = ({ provider, onClose, onUpdateUser }) => {
    // ... same code ...
    const { t } = useLocalization();
    const [instructions, setInstructions] = useState(provider.custom_ai_instructions || '');
    const [priceInfo, setPriceInfo] = useState(provider.price_info || '');
    const [locationInfo, setLocationInfo] = useState(provider.location_info || '');
    const [workingHours, setWorkingHours] = useState(provider.working_hours || '');
    const [bookingInfo, setBookingInfo] = useState(provider.booking_info || '');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        const updates = { 
            custom_ai_instructions: instructions,
            price_info: priceInfo,
            location_info: locationInfo,
            working_hours: workingHours,
            booking_info: bookingInfo
        };

        const { error } = await supabase
            .from('providers')
            .update(updates)
            .eq('id', provider.id);
        
        setLoading(false);
        if(!error) {
            onUpdateUser(updates);
            alert(t('success'));
            onClose();
        } else {
            alert(t('errorMessage'));
        }
    }

    return (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-[70] flex flex-col animate-slide-up">
            <div className="p-4 border-b dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-800">
                <button onClick={onClose}><ArrowLeft className="dark:text-white"/></button>
                <h2 className="font-bold text-xl flex items-center gap-2 dark:text-white"><BrainCircuit className="text-purple-600"/> إعدادات الذكاء (AI Config)</h2>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-6 bg-gray-50 dark:bg-gray-900">
                {/* ... fields ... */}
                {/* Intro Box */}
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
                    <p className="text-sm text-purple-800 dark:text-purple-200 font-bold mb-2 flex items-center gap-2">
                        <Sparkles size={16}/> روبوت هجين (Hybrid Bot)
                    </p>
                    <p className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
                        قم بملء الخانات أدناه بدقة. عندما يسأل الزبون عن "الثمن" أو "الموقع"، سيقوم التطبيق بعرض جوابك المكتوب هنا فوراً دون الحاجة للذكاء الاصطناعي، مما يضمن دقة المعلومة وسرعة الرد.
                    </p>
                </div>

                {/* 1. Price Info */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Banknote size={16} className="text-green-600"/> معلومات الأسعار (Prices)
                    </label>
                    <textarea 
                        value={priceInfo} 
                        onChange={e => setPriceInfo(e.target.value)}
                        placeholder="مثال: الاستشارة: 200 درهم، تبييض الأسنان: 1500 درهم..."
                        className="w-full h-24 p-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 focus:border-green-500 outline-none text-sm resize-none bg-white dark:bg-gray-800 dark:text-white"
                    />
                </div>

                {/* 2. Working Hours */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Clock size={16} className="text-orange-600"/> التوقيت (Working Hours)
                    </label>
                    <input 
                        type="text"
                        value={workingHours} 
                        onChange={e => setWorkingHours(e.target.value)}
                        placeholder="مثال: يومياً من 9:00 صباحاً إلى 6:00 مساءً، ما عدا الأحد."
                        className="w-full p-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 focus:border-orange-500 outline-none text-sm bg-white dark:bg-gray-800 dark:text-white"
                    />
                </div>

                {/* 3. Location Info */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Map size={16} className="text-blue-600"/> تفاصيل العنوان (Exact Location)
                    </label>
                    <textarea 
                        value={locationInfo} 
                        onChange={e => setLocationInfo(e.target.value)}
                        placeholder="مثال: شارع محمد الخامس، قرب مقهى باريس، الطابق الثاني."
                        className="w-full h-20 p-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 focus:border-blue-500 outline-none text-sm resize-none bg-white dark:bg-gray-800 dark:text-white"
                    />
                </div>

                {/* 4. Booking Details (New) */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <CalendarCheck size={16} className="text-red-600"/> تفاصيل وشروط الحجز (Booking Conditions)
                    </label>
                    <textarea 
                        value={bookingInfo} 
                        onChange={e => setBookingInfo(e.target.value)}
                        placeholder="مثال: الدفع نقداً فقط، يرجى إحضار البطاقة الوطنية، الحضور قبل 10 دقائق..."
                        className="w-full h-24 p-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 focus:border-red-500 outline-none text-sm resize-none bg-white dark:bg-gray-800 dark:text-white"
                    />
                </div>

                {/* 5. General Context (Old Field) */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">معلومات إضافية (General Bio for AI)</label>
                    <textarea 
                        value={instructions} 
                        onChange={e => setInstructions(e.target.value)}
                        placeholder="أي معلومات أخرى تريد أن يعرفها البوت للرد على الأسئلة العامة..."
                        className="w-full h-32 p-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 focus:border-purple-500 outline-none text-sm leading-relaxed resize-none bg-white dark:bg-gray-800 dark:text-white"
                    />
                </div>
            </div>
            <div className="p-4 border-t dark:border-gray-700 safe-area-bottom bg-white dark:bg-gray-800">
                 <button onClick={handleSave} disabled={loading} className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2">
                    {loading ? <Loader2 className="animate-spin"/> : <><Save size={18}/> {t('save')}</>}
                 </button>
            </div>
        </div>
    );
};

// --- UPDATED V27: WELCOME AD SETUP (WITH STORIES ARCHIVE & LIMITS) ---
const WelcomeAdSetup: React.FC<{ provider: AuthenticatedUser; onClose: () => void; onUpdateUser: (updates: Partial<AuthenticatedUser>) => void }> = ({ provider, onClose, onUpdateUser }) => {
    const { t } = useLocalization();
    const [ads, setAds] = useState<ProviderAd[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [newImage, setNewImage] = useState('');
    const [loading, setLoading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => { fetchAds(); }, []);

    const fetchAds = async () => {
        const { data } = await supabase.from('provider_ads').select('*').eq('provider_id', provider.id).order('created_at', { ascending: false });
        setAds(data || []);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if(!file) return; setLoading(true);
        try {
            const fileName = `story_${provider.id}_${Date.now()}`;
            await supabase.storage.from('announcement-images').upload(fileName, file);
            const { data } = supabase.storage.from('announcement-images').getPublicUrl(fileName);
            setNewImage(data.publicUrl);
        } catch(e) { alert('Upload Error'); } finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!newMessage.trim() && !newImage) return alert('المرجو كتابة نص أو رفع صورة');
        
        // CHECK LIMIT (5 Per Day)
        const today = new Date();
        today.setHours(0,0,0,0);
        const adsToday = ads.filter(a => new Date(a.created_at) >= today).length;
        
        if (adsToday >= 5) {
            alert('⛔ لقد تجاوزت الحد المسموح (5 إعلانات في اليوم). المرجو حذف إعلانات قديمة أو المحاولة غداً.');
            return;
        }

        setLoading(true);
        const { error } = await supabase.from('provider_ads').insert({
            provider_id: provider.id,
            message: newMessage,
            image_url: newImage,
            is_active: true
        });

        setLoading(false);
        if(!error) {
            setNewMessage('');
            setNewImage('');
            fetchAds();
            alert('تم نشر الإعلان بنجاح! سيظهر الآن لمتابعيك.');
        } else {
            alert(t('errorMessage'));
        }
    };

    const handleDelete = async (id: number) => {
        if(!confirm(t('delete') + '?')) return;
        await supabase.from('provider_ads').delete().eq('id', id);
        fetchAds();
    };

    return (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-[70] flex flex-col animate-slide-up">
            <div className="p-4 border-b dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-800">
                <button onClick={onClose}><ArrowLeft className="dark:text-white"/></button>
                <h2 className="font-bold text-xl flex items-center gap-2 dark:text-white"><MessageSquare className="text-pink-600"/> إعلانات المحادثة (Stories)</h2>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto space-y-6 bg-gray-50 dark:bg-gray-900">
                
                {/* 1. INFO BOX */}
                <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-xl border border-pink-200 dark:border-pink-800">
                    <p className="text-sm text-pink-800 dark:text-pink-200 leading-relaxed font-bold">
                        ℹ️ هذه الإعلانات تظهر تلقائياً لأي زبون يدخل للمحادثة. 
                    </p>
                    <ul className="text-xs text-pink-700 dark:text-pink-300 mt-2 list-disc list-inside">
                        <li>الحد الأقصى: 5 إعلانات في اليوم.</li>
                        <li>سيظهر للزبناء إشعار (رقم أحمر) عند نشر إعلان جديد.</li>
                        <li>يمكنك حذف الإعلانات القديمة من الأرشيف أسفله.</li>
                    </ul>
                </div>

                {/* 2. CREATE NEW AD */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700 shadow-sm space-y-4">
                    <h3 className="font-bold text-sm text-gray-500 uppercase">نشر جديد</h3>
                    
                    <textarea 
                        value={newMessage} 
                        onChange={e => setNewMessage(e.target.value)} 
                        placeholder="اكتب رسالة ترحيبية أو عرض جديد..."
                        className="w-full h-24 p-3 rounded-xl border dark:border-gray-600 dark:bg-gray-700 dark:text-white outline-none resize-none"
                    />
                    
                    {newImage && (
                        <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                            <img src={newImage} className="w-full h-full object-cover"/>
                            <button onClick={() => setNewImage('')} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><X size={14}/></button>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button onClick={() => fileRef.current?.click()} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl font-bold text-gray-600 dark:text-gray-300 flex justify-center items-center gap-2">
                            <ImageIcon size={18}/> {newImage ? 'تغيير' : 'صورة'}
                        </button>
                        <input type="file" ref={fileRef} hidden accept="image/*" onChange={handleUpload}/>
                        
                        <button onClick={handleSave} disabled={loading} className="flex-[2] bg-pink-600 text-white py-3 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2">
                            {loading ? <Loader2 className="animate-spin"/> : <><Save size={18}/> نشر الإعلان</>}
                        </button>
                    </div>
                </div>

                {/* 3. ARCHIVE LIST */}
                <div className="space-y-3">
                    <h3 className="font-bold text-sm text-gray-500 uppercase">الأرشيف ({ads.length})</h3>
                    {ads.length === 0 && <p className="text-center text-gray-400 py-4">لا توجد إعلانات سابقة.</p>}
                    
                    {ads.map(ad => (
                        <div key={ad.id} className="bg-white dark:bg-gray-800 p-3 rounded-xl border dark:border-gray-700 shadow-sm flex gap-3 relative">
                            {ad.image_url ? (
                                <img src={ad.image_url} className="w-16 h-16 rounded-lg object-cover bg-gray-200"/>
                            ) : (
                                <div className="w-16 h-16 rounded-lg bg-pink-100 flex items-center justify-center text-pink-500 font-bold text-xs">نص فقط</div>
                            )}
                            
                            <div className="flex-1">
                                <p className="text-sm font-bold dark:text-white line-clamp-2">{ad.message}</p>
                                <p className="text-xs text-gray-400 mt-1">{new Date(ad.created_at).toLocaleString()}</p>
                            </div>

                            <button onClick={() => handleDelete(ad.id)} className="self-center p-2 text-red-500 hover:bg-red-50 rounded-full">
                                <Trash2 size={18}/>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ... (ProviderPortal main logic)
const ProviderPortal: React.FC<{ provider: AuthenticatedUser; onLogout: () => void; onUpdateUser: (updates: Partial<AuthenticatedUser>) => void; onNavTo?: (target: string) => void }> = ({ provider, onLogout, onUpdateUser, onNavTo }) => {
    const { t } = useLocalization();
    const [view, setView] = useState<'scan' | 'notifications' | 'history' | 'ads' | 'offers' | 'urgent' | 'ai_config' | 'welcome_ad' | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [stats, setStats] = useState({ followers: 0, posts: 0, visits: 0 });
    const [daysLeft, setDaysLeft] = useState(0);

    const isAdmin = provider.phone === '0617774846';

    useEffect(() => {
        const fetchStats = async () => {
            const { count: offersCount } = await supabase.from('provider_offers').select('id', { count: 'exact' }).eq('provider_id', provider.id);
            const { count: followersCount } = await supabase.from('follows').select('id', { count: 'exact' }).eq('provider_id', provider.id);
            setStats({ followers: followersCount || 0, posts: offersCount || 0, visits: provider.visits_count || 0 });
            
            // Calculate Subscription Days Left
            if (provider.subscriptionEndDate) {
                const now = new Date();
                const end = new Date(provider.subscriptionEndDate);
                const diff = end.getTime() - now.getTime();
                setDaysLeft(Math.ceil(diff / (1000 * 60 * 60 * 24)));
            }
        }
        fetchStats();
    }, [provider, view]);

    const handleShare = () => { const text = `Chat with me on TangerConnect: ${provider.name}`; window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank'); }
    const GridItem = ({ icon: Icon, label, onClick, badge, color }: any) => (
        <div onClick={onClick} className={`aspect-square relative group cursor-pointer border border-white dark:border-gray-700 transition-colors ${color ? color : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <div className={`absolute inset-0 flex flex-col items-center justify-center ${color ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                <Icon size={28} strokeWidth={1.5} className="mb-2"/><span className="text-[10px] font-bold uppercase tracking-wide text-center px-1">{label}</span>{badge > 0 && <span className="absolute top-2 right-2 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">{badge}</span>}
            </div>
        </div>
    );
    const handleAdminClick = () => { if(onNavTo) onNavTo('ADMIN_DASHBOARD'); else onLogout(); }

    return (
        <div className="h-screen bg-white dark:bg-black overflow-y-auto" dir="rtl">
            <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 p-3 border-b dark:border-gray-700 flex justify-between items-center shadow-sm">
                <h1 className="font-bold text-lg flex items-center gap-1 dark:text-white">{provider.username || provider.name} <CheckCircle size={14} className="text-blue-500 fill-blue-500 text-white"/></h1>
                <div className="flex gap-3"><button onClick={onLogout} className="text-xs font-bold bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-full flex items-center gap-1"><LogOut size={12}/> {t('goToApp')}</button><Settings className="dark:text-white"/></div>
            </div>
            <div className="p-4">
                <div className="flex items-center gap-6 mb-4">
                    <div className="w-20 h-20 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 to-purple-600"><img src={provider.profile_image_url || `https://ui-avatars.com/api/?name=${provider.name}`} className="w-full h-full rounded-full border-2 border-white object-cover"/></div>
                    <div className="flex-1 flex justify-around text-center dark:text-white"><div><div className="font-bold text-lg">{stats.posts}</div><div className="text-xs text-gray-500 dark:text-gray-400">{t('posts')}</div></div><div><div className="font-bold text-lg">{stats.followers}</div><div className="text-xs text-gray-500 dark:text-gray-400">{t('followers')}</div></div><div><div className="font-bold text-lg">{stats.visits}</div><div className="text-xs text-gray-500 dark:text-gray-400">{t('visits')}</div></div></div>
                </div>
                
                {/* SUBSCRIPTION COUNTDOWN BADGE */}
                {daysLeft < 365 && (
                    <div className={`mb-4 p-3 rounded-lg flex items-center justify-between shadow-sm border ${daysLeft <= 5 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                        <div className="flex items-center gap-2">
                            <Hourglass size={18} className={daysLeft <= 5 ? 'animate-pulse' : ''}/>
                            <span className="text-sm font-bold">مدة الاشتراك المتبقية</span>
                        </div>
                        <span className="font-black text-lg">{daysLeft} يوم</span>
                    </div>
                )}

                <div><h2 className="font-bold dark:text-white">{provider.name}</h2><p className="text-gray-500 dark:text-gray-400 text-sm">{provider.service_type}</p><p className="text-sm whitespace-pre-line mt-1 dark:text-gray-300">{provider.bio || t('bioLabel') + "..."}</p>{provider.social_links && (<div className="flex gap-3 mt-2">{provider.social_links.instagram && <Instagram size={16} className="text-pink-600"/>}{provider.social_links.facebook && <Facebook size={16} className="text-blue-600"/>}{provider.social_links.gps && <MapPin size={16} className="text-green-600"/>}</div>)}</div>
                <div className="flex gap-2 mt-4 mb-6"><button onClick={() => setEditMode(true)} className="flex-1 bg-gray-100 dark:bg-gray-800 dark:text-white py-1.5 rounded-lg font-bold text-sm">{t('editProfile')}</button><button onClick={handleShare} className="flex-1 bg-gray-100 dark:bg-gray-800 dark:text-white py-1.5 rounded-lg font-bold text-sm">{t('share')}</button></div>
                <div className="flex border-t border-b dark:border-gray-700"><button className="flex-1 py-3 flex justify-center border-b-2 border-black dark:border-white dark:text-white"><Grid size={24}/></button><button className="flex-1 py-3 flex justify-center text-gray-400"><Tag size={24}/></button></div>
                
                {/* GRID ITEMS */}
                <div className="grid grid-cols-3 gap-0.5 mt-0.5">
                    {/* FIXED: Using solid dark purple background to ensure text-white works correctly */}
                    <GridItem icon={BrainCircuit} label="إعدادات الذكاء" onClick={() => setView('ai_config')} color="bg-purple-600 hover:bg-purple-700 text-white"/>
                    
                    {/* NEW WELCOME AD TILE */}
                    <GridItem icon={MessageSquare} label="إعلانات المحادثة" onClick={() => setView('welcome_ad')} color="bg-pink-600 hover:bg-pink-700 text-white"/>

                    {isAdmin && <GridItem icon={ShieldAlert} label="الإدارة (Admin)" onClick={handleAdminClick} badge={0} color="bg-red-600 hover:bg-red-700 text-white" />}
                    <GridItem icon={QrCode} label={t('qrScannerTitle')} onClick={() => setView('scan')}/>
                    <GridItem icon={Megaphone} label={t('requestBoost')} onClick={() => setView('ads')}/>
                    <GridItem icon={Tag} label={t('offers')} onClick={() => setView('offers')}/>
                    <GridItem icon={History} label={t('statsTitle')} onClick={() => setView('history')}/>
                    <GridItem icon={Bell} label={t('notifications')} onClick={() => setView('notifications')} badge={0}/>
                    <GridItem icon={Zap} label={t('urgentAds')} onClick={() => setView('urgent')}/>
                </div>
            </div>

            {view === 'scan' && <QRScannerView providerId={provider.id} onClose={() => setView(null)} />}
            {view === 'notifications' && <NotificationView providerId={provider.id} onClose={() => setView(null)} />}
            {view === 'history' && <HistoryView providerId={provider.id} onClose={() => setView(null)} />}
            {view === 'ads' && <AdsView providerId={provider.id} onClose={() => setView(null)} />}
            {view === 'offers' && <OffersView providerId={provider.id} onClose={() => setView(null)} />}
            {view === 'urgent' && <UrgentAdsView providerId={provider.id} onClose={() => setView(null)} />}
            {view === 'ai_config' && <AIInstructionsView provider={provider} onClose={() => setView(null)} onUpdateUser={onUpdateUser} />}
            {view === 'welcome_ad' && <WelcomeAdSetup provider={provider} onClose={() => setView(null)} onUpdateUser={onUpdateUser} />}
            {editMode && <EditProfileModal provider={provider} onClose={() => setEditMode(false)} onUpdateUser={onUpdateUser} />}
        </div>
    );
};

export default ProviderPortal;
