
import React, { useState, useRef, useEffect } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { AuthenticatedUser, ProviderNotification, AdRequest, Offer, UrgentAd } from '../types';
import { supabase } from '../services/supabaseClient';
import { CheckCircle, XCircle, Camera, Loader2, Upload, MessageCircle, History, Users, Megaphone, Settings, ArrowLeft, Image as ImageIcon, QrCode, Bell, User, LayoutGrid, FileText, Lock, LogOut, Grid, Bookmark, Heart, Plus, Zap, Tag, Instagram, Facebook, MapPin, Edit3, Share2, Info, Trash2, Edit } from 'lucide-react';
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
            <div className="p-4 space-y-3">
                {notifications.map(n => (
                    <div key={n.id} className={`p-4 rounded-xl border flex items-start gap-3 ${n.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className={`mt-1 w-3 h-3 rounded-full ${n.status === 'completed' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold">{n.message}</p>
                            <p className="text-xs mt-1 opacity-70">
                                {new Date(n.created_at).toLocaleDateString()} • {n.status === 'completed' ? t('statusVerified') : t('statusPending')}
                            </p>
                        </div>
                        {n.status === 'completed' && <CheckCircle size={16} className="text-green-600"/>}
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
                <h2 className="font-bold text-xl">{t('statsTitle')}</h2>
            </div>
            <div className="p-4">
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                <th className="p-3 text-right">{t('clientName')}</th>
                                <th className="p-3 text-right">{t('visitDate')}</th>
                                <th className="p-3 text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((h, i) => (
                                <tr key={i} className="border-t">
                                    <td className="p-3 font-bold">{h.client_name}</td>
                                    <td className="p-3 text-gray-500">{new Date(h.created_at).toLocaleDateString()}</td>
                                    <td className="p-3 text-xs">
                                        <span className="block">{h.client_phone}</span>
                                    </td>
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

    useEffect(() => { fetchAds(); }, []);
    const fetchAds = async () => {
        const { data } = await supabase.from('urgent_ads').select('*').eq('provider_id', providerId).order('created_at', { ascending: false });
        setAds(data || []);
    }

    const handleCreate = async () => {
        if(!message.trim()) return;
        setLoading(true);
        const { error } = await supabase.from('urgent_ads').insert({ provider_id: providerId, message, is_active: true });
        if(!error) {
            setMessage('');
            fetchAds();
            alert(t('success'));
        }
        setLoading(false);
    }

    const handleDelete = async (id: number) => {
        if(confirm(t('delete') + '?')) {
            await supabase.from('urgent_ads').delete().eq('id', id);
            fetchAds();
        }
    }

    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col animate-slide-up">
             <div className="p-4 border-b flex items-center gap-3">
                <button onClick={onClose}><ArrowLeft/></button>
                <h2 className="font-bold text-xl">{t('urgentAds')}</h2>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto">
                {/* Professional Description */}
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 flex items-start gap-3">
                    <Info className="text-yellow-600 shrink-0 mt-1"/>
                    <p className="text-sm text-yellow-800">{t('urgentAdsDesc')}</p>
                </div>

                <div className="flex gap-2">
                    <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Urgent message for ticker..." className="flex-1 border p-2 rounded-lg outline-none"/>
                    <button onClick={handleCreate} disabled={loading} className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold">{t('postAd')}</button>
                </div>
                <div className="space-y-2">
                    {ads.map(ad => (
                        <div key={ad.id} className="p-3 bg-white shadow-sm border rounded-lg flex justify-between items-center">
                            <span className="text-sm font-bold">{ad.message}</span>
                            <div className="flex gap-2">
                                <button onClick={() => handleDelete(ad.id)} className="p-2 bg-gray-100 rounded-full text-red-500"><Trash2 size={16}/></button>
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
    const [newOffer, setNewOffer] = useState({ title: '', original_price: '', discount_price: '', image: '' });
    const [loading, setLoading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => { fetchOffers(); }, []);
    const fetchOffers = async () => {
        const { data } = await supabase.from('provider_offers').select('*').eq('provider_id', providerId);
        setOffers(data || []);
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;
        setLoading(true);
        try {
            const fileName = `offer_${providerId}_${Date.now()}`;
            await supabase.storage.from('product-images').upload(fileName, file);
            const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
            setNewOffer(prev => ({ ...prev, image: data.publicUrl }));
        } catch(e) {} finally { setLoading(false); }
    }

    const handleCreate = async () => {
        if(!newOffer.title) return;
        setLoading(true);
        await supabase.from('provider_offers').insert({ 
            provider_id: providerId, 
            title: newOffer.title, 
            original_price: parseFloat(newOffer.original_price), 
            discount_price: parseFloat(newOffer.discount_price),
            image_url: newOffer.image
        });
        setNewOffer({ title: '', original_price: '', discount_price: '', image: '' });
        fetchOffers();
        setLoading(false);
        alert(t('success'));
    }
    
    const handleDelete = async (id: number) => {
        if(confirm(t('delete') + '?')) {
            await supabase.from('provider_offers').delete().eq('id', id);
            fetchOffers();
        }
    }

    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col animate-slide-up">
            <div className="p-4 border-b flex items-center gap-3">
                <button onClick={onClose}><ArrowLeft/></button>
                <h2 className="font-bold text-xl">{t('offers')}</h2>
            </div>
            <div className="p-4 space-y-6 overflow-y-auto pb-20">
                {/* Professional Description */}
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex items-start gap-3">
                    <Info className="text-blue-600 shrink-0 mt-1"/>
                    <p className="text-sm text-blue-800">{t('offersDesc')}</p>
                </div>

                <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
                    <h3 className="font-bold text-gray-700">{t('createOffer')}</h3>
                    <input placeholder={t('titleLabel')} value={newOffer.title} onChange={e => setNewOffer({...newOffer, title: e.target.value})} className="w-full p-2 rounded border outline-none"/>
                    <div className="flex gap-2">
                         <input type="number" placeholder={t('originalPrice')} value={newOffer.original_price} onChange={e => setNewOffer({...newOffer, original_price: e.target.value})} className="flex-1 p-2 rounded border outline-none"/>
                         <input type="number" placeholder={t('discountPrice')} value={newOffer.discount_price} onChange={e => setNewOffer({...newOffer, discount_price: e.target.value})} className="flex-1 p-2 rounded border outline-none"/>
                    </div>
                    <button onClick={() => fileRef.current?.click()} className="w-full py-2 bg-gray-50 border border-dashed rounded flex justify-center text-gray-500"><ImageIcon size={18}/> Image</button>
                    <input type="file" ref={fileRef} hidden onChange={handleUpload}/>
                    {newOffer.image && <img src={newOffer.image} className="h-20 object-cover rounded"/>}
                    <button onClick={handleCreate} disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded font-bold">{loading ? t('loading') : t('save')}</button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {offers.map(o => (
                        <div key={o.id} className="border rounded-xl p-3 bg-white shadow-sm flex gap-3 relative">
                            {o.image_url && <img src={o.image_url} className="w-20 h-20 object-cover rounded-lg bg-gray-100"/>}
                            <div className="flex-1">
                                <h4 className="font-bold text-sm">{o.title}</h4>
                                <div className="flex gap-2 text-xs mt-1">
                                    <span className="line-through text-gray-400">{o.original_price} DH</span>
                                    <span className="text-red-500 font-bold">{o.discount_price} DH</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button className="p-1.5 bg-gray-100 rounded-full text-blue-500"><Edit size={16}/></button>
                                <button onClick={() => handleDelete(o.id)} className="p-1.5 bg-red-100 rounded-full text-red-500"><Trash2 size={16}/></button>
                            </div>
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
        
        // SPECIFIC ARABIC FEEDBACK MESSAGE
        alert('تم استلام طلبك. طلبك في طور الإنجاز. سيظهر الإعلان لمدة 7 أيام بعد الموافقة.');
        
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
                     <p className="text-sm text-purple-800 font-bold mb-3">{t('paidAdDesc')}</p>
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
                         <span className={`text-[10px] px-2 py-1 rounded-full ${r.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {r.status === 'pending' ? 'في طور الإنجاز' : 'مقبول'}
                         </span>
                     </div>
                 ))}
            </div>
        </div>
    );
}

const QRScannerView: React.FC<{ providerId: number; onClose: () => void }> = ({ providerId, onClose }) => {
    const { t } = useLocalization();
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [scanning, setScanning] = useState(true);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!scanning) return;
        const startVideo = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.setAttribute("playsinline", "true");
                    videoRef.current.play();
                    requestAnimationFrame(tick);
                }
            } catch (err) {
                console.error("Camera error", err);
            }
        };
        startVideo();
        return () => { 
            if(videoRef.current?.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
            }
        }
    }, [scanning]);

    const tick = () => {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            const canvas = canvasRef.current;
            if (canvas) {
                canvas.height = videoRef.current.videoHeight;
                canvas.width = videoRef.current.videoWidth;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
                    if (code) {
                        processCode(code.data);
                        return; 
                    }
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
            
            await supabase.from('scan_history').insert({ provider_id: providerId, client_name: "Client #" + parsed.appointmentId, client_phone: "Verified" });
            const { data: p } = await supabase.from('providers').select('visits_count').eq('id', providerId).single();
            await supabase.from('providers').update({ visits_count: (p?.visits_count || 0) + 1 }).eq('id', providerId);
            
            // Mark notification as completed if it exists
            // (Assuming logic exists to link notification to appointmentId, but simplified here)
            
            setStatus('success');
        } catch(e) { setStatus('error'); }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;

        setScanning(false);
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
                    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
                    if(code) processCode(code.data);
                    else setStatus('error');
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col animate-fade-in items-center justify-center p-4">
             <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden relative shadow-2xl">
                 <div className="p-4 bg-black text-white flex justify-between items-center">
                    <button onClick={onClose}><ArrowLeft/></button>
                    <span className="font-bold">{t('qrScannerTitle')}</span>
                    <div/>
                 </div>
                 
                 <div className="p-6 flex flex-col items-center gap-6">
                    {status === 'success' ? (
                        <div className="text-center py-10"><CheckCircle size={80} className="text-green-500 mx-auto"/><h2 className="text-2xl font-bold mt-4">{t('verificationSuccess')}</h2><button onClick={() => { setStatus('idle'); setScanning(true); }} className="mt-6 bg-black text-white px-6 py-2 rounded-full font-bold">Next</button></div>
                    ) : status === 'error' ? (
                         <div className="text-center py-10"><XCircle size={80} className="text-red-500 mx-auto"/><h2 className="text-2xl font-bold mt-4">{t('invalidQR')}</h2><button onClick={() => { setStatus('idle'); setScanning(true); }} className="mt-6 bg-black text-white px-6 py-2 rounded-full font-bold">Try Again</button></div>
                    ) : (
                        <>
                            <div className="w-full aspect-square bg-black rounded-xl overflow-hidden relative">
                                {scanning ? (
                                    <>
                                        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover"/>
                                        <div className="absolute inset-0 border-2 border-green-500/50 m-8 rounded-lg animate-pulse"></div>
                                        <canvas ref={canvasRef} hidden />
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-white">Processing Image...</div>
                                )}
                            </div>
                            <div className="w-full text-center">
                                <p className="text-sm text-gray-500 mb-4">Align QR code or upload file</p>
                                <button onClick={() => fileRef.current?.click()} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl font-bold text-gray-500 hover:border-black hover:text-black transition-colors flex items-center justify-center gap-2">
                                    <Upload size={20}/> {t('uploadQRImage')}
                                </button>
                                <input type="file" ref={fileRef} hidden accept="image/*" onChange={handleFileUpload}/>
                            </div>
                        </>
                    )}
                 </div>
             </div>
        </div>
    );
}

const EditProfileModal: React.FC<{ provider: AuthenticatedUser; onClose: () => void; onUpdateUser: (updates: Partial<AuthenticatedUser>) => void }> = ({ provider, onClose, onUpdateUser }) => {
    const { t } = useLocalization();
    const [form, setForm] = useState({ 
        bio: provider.bio || '', 
        instagram: provider.social_links?.instagram || '', 
        facebook: provider.social_links?.facebook || '', 
        gps: provider.social_links?.gps || '',
        image: provider.profile_image_url || ''
    });
    const [loading, setLoading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;
        setLoading(true);
        try {
            const fileName = `avatar_${provider.id}_${Date.now()}`;
            await supabase.storage.from('profiles').upload(fileName, file);
            const { data } = supabase.storage.from('profiles').getPublicUrl(fileName);
            const publicUrl = data.publicUrl;
            setForm(prev => ({ ...prev, image: publicUrl }));
            
            // Immediately update the provider record and app state
            await supabase.from('providers').update({ profile_image_url: publicUrl }).eq('id', provider.id);
            onUpdateUser({ profile_image_url: publicUrl });

        } catch(e) { console.error(e); } finally { setLoading(false); }
    }

    const handleSave = async () => {
        setLoading(true);
        const updates = { 
            bio: form.bio, 
            social_links: { instagram: form.instagram, facebook: form.facebook, gps: form.gps },
            profile_image_url: form.image
        };
        const { error } = await supabase.from('providers').update(updates).eq('id', provider.id);
        setLoading(false);
        if(!error) { 
            onUpdateUser(updates);
            alert(t('success')); 
            onClose(); 
        }
        else alert(t('errorMessage'));
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
                <h2 className="font-bold text-lg">{t('editProfile')}</h2>
                
                <div className="flex justify-center mb-2">
                    <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden relative cursor-pointer" onClick={() => fileRef.current?.click()}>
                        {form.image ? <img src={form.image} className="w-full h-full object-cover"/> : <Camera className="absolute inset-0 m-auto text-gray-400"/>}
                        {loading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white"><Loader2 className="animate-spin"/></div>}
                    </div>
                    <input type="file" ref={fileRef} hidden onChange={handleImageUpload} />
                </div>

                <textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} placeholder={t('bioLabel')} className="w-full p-2 border rounded-lg h-24 text-sm"/>
                <div className="space-y-2">
                    <h4 className="font-bold text-xs uppercase text-gray-400">{t('socialLinks')}</h4>
                    <div className="flex items-center gap-2 border rounded-lg p-2"><Instagram size={16}/><input value={form.instagram} onChange={e => setForm({...form, instagram: e.target.value})} placeholder="Instagram Username" className="flex-1 outline-none text-sm"/></div>
                    <div className="flex items-center gap-2 border rounded-lg p-2"><Facebook size={16}/><input value={form.facebook} onChange={e => setForm({...form, facebook: e.target.value})} placeholder="Facebook Username" className="flex-1 outline-none text-sm"/></div>
                    <div className="flex items-center gap-2 border rounded-lg p-2"><MapPin size={16}/><input value={form.gps} onChange={e => setForm({...form, gps: e.target.value})} placeholder="GPS Coordinates" className="flex-1 outline-none text-sm"/></div>
                </div>
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 py-2 bg-gray-100 rounded-lg">{t('cancel')}</button>
                    <button onClick={handleSave} disabled={loading} className="flex-1 py-2 bg-black text-white rounded-lg font-bold">{t('saveProfile')}</button>
                </div>
            </div>
        </div>
    )
}

// --- INSTAGRAM STYLE PORTAL ---
const ProviderPortal: React.FC<{ provider: AuthenticatedUser; onLogout: () => void; onUpdateUser: (updates: Partial<AuthenticatedUser>) => void }> = ({ provider, onLogout, onUpdateUser }) => {
    const { t } = useLocalization();
    const [view, setView] = useState<'scan' | 'notifications' | 'history' | 'ads' | 'offers' | 'urgent' | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [stats, setStats] = useState({ followers: 0, posts: 0, visits: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            // Count Offers (Posts)
            const { count: offersCount } = await supabase.from('provider_offers').select('id', { count: 'exact' }).eq('provider_id', provider.id);
            // Count Followers
            const { count: followersCount } = await supabase.from('follows').select('id', { count: 'exact' }).eq('provider_id', provider.id);
            // Visits
            setStats({ 
                followers: followersCount || 0, 
                posts: offersCount || 0, 
                visits: provider.visits_count || 0 
            });
        }
        fetchStats();
    }, [provider, view]); // Re-fetch when view changes (e.g. added offer)

    const handleShare = () => {
        const text = `Chat with me on TangerConnect: ${provider.name}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }

    const GridItem = ({ icon: Icon, label, onClick, badge }: any) => (
        <div onClick={onClick} className="aspect-square bg-gray-50 relative group cursor-pointer border border-white hover:bg-gray-100 transition-colors">
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                <Icon size={28} strokeWidth={1.5} className="mb-2 text-gray-700"/>
                <span className="text-[10px] font-bold uppercase tracking-wide text-center px-1">{label}</span>
                {badge > 0 && <span className="absolute top-2 right-2 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">{badge}</span>}
            </div>
        </div>
    );

    return (
        <div className="h-screen bg-white overflow-y-auto" dir="rtl">
            {/* Nav */}
            <div className="sticky top-0 bg-white z-10 p-3 border-b flex justify-between items-center shadow-sm">
                <h1 className="font-bold text-lg flex items-center gap-1">{provider.username || provider.name} <CheckCircle size={14} className="text-blue-500 fill-blue-500 text-white"/></h1>
                <div className="flex gap-3">
                    <button onClick={onLogout} className="text-xs font-bold bg-black text-white px-3 py-1.5 rounded-full flex items-center gap-1"><LogOut size={12}/> {t('goToApp')}</button>
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
                        <div><div className="font-bold text-lg">{stats.posts}</div><div className="text-xs text-gray-500">{t('posts')}</div></div>
                        <div><div className="font-bold text-lg">{stats.followers}</div><div className="text-xs text-gray-500">{t('followers')}</div></div>
                        <div><div className="font-bold text-lg">{stats.visits}</div><div className="text-xs text-gray-500">{t('visits')}</div></div>
                    </div>
                </div>
                <div>
                    <h2 className="font-bold">{provider.name}</h2>
                    <p className="text-gray-500 text-sm">{provider.service_type}</p>
                    <p className="text-sm whitespace-pre-line mt-1">{provider.bio || t('bioLabel') + "..."}</p>
                    {provider.social_links && (
                        <div className="flex gap-3 mt-2">
                             {provider.social_links.instagram && <Instagram size={16} className="text-pink-600"/>}
                             {provider.social_links.facebook && <Facebook size={16} className="text-blue-600"/>}
                             {provider.social_links.gps && <MapPin size={16} className="text-green-600"/>}
                        </div>
                    )}
                </div>
                <div className="flex gap-2 mt-4 mb-6">
                    <button onClick={() => setEditMode(true)} className="flex-1 bg-gray-100 py-1.5 rounded-lg font-bold text-sm">{t('editProfile')}</button>
                    <button onClick={handleShare} className="flex-1 bg-gray-100 py-1.5 rounded-lg font-bold text-sm">{t('share')}</button>
                </div>

                {/* Grid Tabs */}
                <div className="flex border-t border-b">
                     <button className="flex-1 py-3 flex justify-center border-b-2 border-black"><Grid size={24}/></button>
                     <button className="flex-1 py-3 flex justify-center text-gray-400"><Tag size={24}/></button>
                </div>

                {/* THE CONTROL GRID */}
                <div className="grid grid-cols-3 gap-0.5 mt-0.5">
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
            
            {editMode && <EditProfileModal provider={provider} onClose={() => setEditMode(false)} onUpdateUser={onUpdateUser} />}
        </div>
    );
};

export default ProviderPortal;
