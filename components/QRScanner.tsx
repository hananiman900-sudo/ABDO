
import React, { useState, useRef, useEffect } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { AuthenticatedUser, ProviderNotification, AdRequest, Offer, UrgentAd, ProviderAd } from '../types';
import { supabase } from '../services/supabaseClient';
import { CheckCircle, XCircle, Camera, Loader2, Upload, MessageCircle, History, Users, Megaphone, Settings, ArrowLeft, Image as ImageIcon, QrCode, Bell, User, LayoutGrid, FileText, Lock, LogOut, Grid, Bookmark, Heart, Plus, Zap, Tag, Instagram, Facebook, MapPin, Edit3, Share2, Info, Trash2, Edit, ShieldAlert, Save, X, Database, BrainCircuit, Sparkles, Banknote, Clock, Map, CalendarCheck, Hourglass, MessageSquare, AlertCircle, Calendar, Phone, Rocket, Check } from 'lucide-react';
import jsQR from 'jsqr';

// --- IMPLEMENTED MISSING COMPONENTS ---

const QRScannerView: React.FC<{ providerId: number; onClose: () => void }> = ({ providerId, onClose }) => {
    const { t } = useLocalization();
    const [result, setResult] = useState<string | null>(null);
    const [message, setMessage] = useState<string>('');
    const fileRef = useRef<HTMLInputElement>(null);
    const [verifying, setVerifying] = useState(false);

    const handleScan = async (file: File) => {
        setVerifying(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            const img = new Image();
            img.onload = async () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if(ctx) {
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height);
                    
                    if (code) {
                        try {
                            const data = JSON.parse(code.data);
                            // Verify Provider ID matches
                            if (data.providerId !== providerId) {
                                setMessage(t('wrongProvider'));
                                setVerifying(false);
                                return;
                            }
                            
                            // Check for duplicates
                            const { data: existing } = await supabase.from('scan_history').select('*').eq('appointment_id', data.appointmentId).single();
                            if(existing) {
                                setMessage("This code has already been scanned!");
                                setVerifying(false);
                                return;
                            }

                            // Record Scan
                            await supabase.from('scan_history').insert({
                                provider_id: providerId,
                                client_name: data.clientName || 'Guest',
                                offer_title: data.offerTitle,
                                appointment_id: data.appointmentId,
                                created_at: new Date().toISOString()
                            });

                            // Update Visit Count
                            await supabase.rpc('increment_visits', { row_id: providerId });

                            setResult(t('verificationSuccess'));
                            setMessage(`Client: ${data.clientName || 'Guest'}\nDate: ${data.date || 'Today'}\n${data.offerTitle ? `Offer: ${data.offerTitle}` : ''}`);
                        } catch (err) {
                            setMessage(t('invalidQR'));
                        }
                    } else {
                        setMessage(t('invalidQR'));
                    }
                    setVerifying(false);
                }
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4 animate-fade-in">
            <button onClick={onClose} className="absolute top-4 right-4 text-white"><X size={32}/></button>
            <h2 className="text-white text-2xl font-bold mb-8">{t('qrScannerTitle')}</h2>
            
            <div className="bg-white p-6 rounded-3xl w-full max-w-sm text-center">
                {result ? (
                    <div className="space-y-4">
                        <CheckCircle size={64} className="text-green-500 mx-auto"/>
                        <h3 className="text-xl font-bold text-green-600">{result}</h3>
                        <p className="text-gray-600 whitespace-pre-line font-medium bg-gray-50 p-4 rounded-xl">{message}</p>
                        <button onClick={() => { setResult(null); setMessage(''); }} className="w-full py-3 bg-black text-white rounded-xl font-bold">Scan Another</button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => fileRef.current?.click()}>
                            {verifying ? <Loader2 className="animate-spin text-blue-600" size={48}/> : <Upload className="text-gray-400" size={48}/>}
                            <p className="text-gray-500 font-bold">{verifying ? t('loading') : t('uploadQRImage')}</p>
                            <input type="file" ref={fileRef} hidden accept="image/*" onChange={(e) => e.target.files?.[0] && handleScan(e.target.files[0])}/>
                        </div>
                        {message && <div className="bg-red-50 p-3 rounded-lg flex items-center gap-2 text-red-600 font-bold justify-center"><AlertCircle size={18}/> {message}</div>}
                    </div>
                )}
            </div>
        </div>
    );
};

const NotificationView: React.FC<{ providerId: number; onClose: () => void }> = ({ providerId, onClose }) => {
    const { t } = useLocalization();
    const [notifs, setNotifs] = useState<ProviderNotification[]>([]);
    
    useEffect(() => {
        const fetch = async () => {
            const { data } = await supabase.from('provider_notifications').select('*').eq('provider_id', providerId).order('created_at', { ascending: false });
            setNotifs(data as any || []);
            if(data && data.length > 0) {
                 await supabase.from('provider_notifications').update({ is_read: true }).eq('provider_id', providerId).eq('is_read', false);
            }
        };
        fetch();
    }, [providerId]);

    return (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col animate-slide-up">
            <div className="p-4 border-b dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-800">
                <button onClick={onClose}><ArrowLeft className="dark:text-white"/></button>
                <h2 className="font-bold text-xl dark:text-white">{t('notifications')}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
                {notifs.map(n => (
                    <div key={n.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-l-4 border-l-blue-500 dark:border-gray-700">
                        <p className="font-bold text-gray-800 dark:text-white">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                ))}
                {notifs.length === 0 && <p className="text-center text-gray-400 mt-10">{t('noNotifications')}</p>}
            </div>
        </div>
    );
};

const HistoryView: React.FC<{ providerId: number; onClose: () => void }> = ({ providerId, onClose }) => {
    const { t } = useLocalization();
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        const fetch = async () => {
            const { data } = await supabase.from('scan_history').select('*').eq('provider_id', providerId).order('created_at', { ascending: false });
            setHistory(data || []);
        };
        fetch();
    }, [providerId]);

    return (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col animate-slide-up">
            <div className="p-4 border-b dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-800">
                <button onClick={onClose}><ArrowLeft className="dark:text-white"/></button>
                <h2 className="font-bold text-xl dark:text-white">{t('scanHistory')}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
                <table className="w-full bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm text-sm border dark:border-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        <tr>
                            <th className="p-3 text-left">{t('clientName')}</th>
                            <th className="p-3 text-left">Offer</th>
                            <th className="p-3 text-right">{t('visitDate')}</th>
                        </tr>
                    </thead>
                    <tbody className="dark:text-gray-300">
                        {history.map(h => (
                            <tr key={h.id} className="border-t dark:border-gray-700">
                                <td className="p-3 font-bold">{h.client_name}</td>
                                <td className="p-3 text-gray-500 dark:text-gray-400">{h.offer_title || '-'}</td>
                                <td className="p-3 text-right text-gray-400 text-xs">{new Date(h.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AdsView: React.FC<{ providerId: number; onClose: () => void }> = ({ providerId, onClose }) => {
    const { t } = useLocalization();
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    
    const sendRequest = async () => {
        if(!message.trim()) return;
        setLoading(true);
        const { error } = await supabase.from('provider_ad_requests').insert({
            provider_id: providerId,
            message: message,
            status: 'pending'
        });
        if(!error) { alert(t('requestSent')); onClose(); }
        else alert(t('errorMessage'));
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col animate-slide-up">
            <div className="p-4 border-b dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-800">
                <button onClick={onClose}><ArrowLeft className="dark:text-white"/></button>
                <h2 className="font-bold text-xl dark:text-white">{t('requestBoost')}</h2>
            </div>
            <div className="p-6 space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-700">
                    <h3 className="font-bold text-yellow-800 dark:text-yellow-400">Premium Ad</h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-500 mt-1">{t('paidAdDesc')}</p>
                </div>
                <textarea 
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder={t('messageLabel')}
                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border dark:border-gray-700 outline-none h-40 dark:text-white"
                />
                <button onClick={sendRequest} disabled={loading} className="w-full bg-black dark:bg-white dark:text-black text-white py-4 rounded-xl font-bold shadow-lg">
                    {loading ? <Loader2 className="animate-spin mx-auto"/> : t('sendButton')}
                </button>
            </div>
        </div>
    );
};

const OffersView: React.FC<{ providerId: number; onClose: () => void }> = ({ providerId, onClose }) => {
    const { t } = useLocalization();
    const [offers, setOffers] = useState<Offer[]>([]);
    const [newOffer, setNewOffer] = useState({ title: '', description: '', original_price: '', discount_price: '' });
    
    useEffect(() => {
        const fetch = async () => {
            const { data } = await supabase.from('provider_offers').select('*').eq('provider_id', providerId);
            setOffers(data || []);
        };
        fetch();
    }, [providerId]);

    const addOffer = async () => {
        if(!newOffer.title || !newOffer.discount_price) return;
        const { data, error } = await supabase.from('provider_offers').insert({
            provider_id: providerId,
            title: newOffer.title,
            description: newOffer.description,
            original_price: parseFloat(newOffer.original_price),
            discount_price: parseFloat(newOffer.discount_price)
        }).select();
        
        if(!error && data) {
            setOffers([...offers, data[0]]);
            setNewOffer({ title: '', description: '', original_price: '', discount_price: '' });
        }
    };

    const deleteOffer = async (id: number) => {
        await supabase.from('provider_offers').delete().eq('id', id);
        setOffers(offers.filter(o => o.id !== id));
    };

    return (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col animate-slide-up">
            <div className="p-4 border-b dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-800">
                <button onClick={onClose}><ArrowLeft className="dark:text-white"/></button>
                <h2 className="font-bold text-xl dark:text-white">{t('offers')}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border dark:border-gray-700 mb-6">
                    <h3 className="font-bold mb-4 dark:text-white">{t('createOffer')}</h3>
                    <div className="space-y-3">
                        <input value={newOffer.title} onChange={e => setNewOffer({...newOffer, title: e.target.value})} placeholder={t('titleLabel')} className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600 outline-none dark:text-white"/>
                        <div className="flex gap-2">
                            <input type="number" value={newOffer.original_price} onChange={e => setNewOffer({...newOffer, original_price: e.target.value})} placeholder={t('originalPrice')} className="flex-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600 outline-none dark:text-white"/>
                            <input type="number" value={newOffer.discount_price} onChange={e => setNewOffer({...newOffer, discount_price: e.target.value})} placeholder={t('discountPrice')} className="flex-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600 outline-none dark:text-white"/>
                        </div>
                        <button onClick={addOffer} className="w-full bg-black dark:bg-white dark:text-black text-white py-3 rounded-lg font-bold">{t('save')}</button>
                    </div>
                </div>

                <div className="space-y-3">
                    {offers.map(o => (
                        <div key={o.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border dark:border-gray-700 flex justify-between items-center">
                            <div>
                                <h4 className="font-bold dark:text-white">{o.title}</h4>
                                <div className="flex gap-2 text-sm">
                                    <span className="line-through text-gray-400">{o.original_price} DH</span>
                                    <span className="text-red-600 font-bold">{o.discount_price} DH</span>
                                </div>
                            </div>
                            <button onClick={() => deleteOffer(o.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"><Trash2 size={18}/></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const UrgentAdsView: React.FC<{ providerId: number; onClose: () => void }> = ({ providerId, onClose }) => {
    const { t } = useLocalization();
    const [ads, setAds] = useState<UrgentAd[]>([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetch = async () => {
            const { data } = await supabase.from('urgent_ads').select('*').eq('provider_id', providerId).order('created_at', { ascending: false });
            setAds(data || []);
        };
        fetch();
    }, [providerId]);

    const addAd = async () => {
        if(!message.trim()) return;
        const { data, error } = await supabase.from('urgent_ads').insert({
            provider_id: providerId,
            message: message,
            is_active: true
        }).select();
        
        if(!error && data) {
            setAds([data[0], ...ads]);
            setMessage('');
        }
    };

    const toggleAd = async (ad: UrgentAd) => {
        const { error } = await supabase.from('urgent_ads').update({ is_active: !ad.is_active }).eq('id', ad.id);
        if(!error) setAds(ads.map(a => a.id === ad.id ? {...a, is_active: !a.is_active} : a));
    };

    const deleteAd = async (id: number) => {
        await supabase.from('urgent_ads').delete().eq('id', id);
        setAds(ads.filter(a => a.id !== id));
    };

    return (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col animate-slide-up">
            <div className="p-4 border-b dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-800">
                <button onClick={onClose}><ArrowLeft className="dark:text-white"/></button>
                <h2 className="font-bold text-xl dark:text-white">{t('urgentAds')}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border dark:border-gray-700 mb-6">
                    <h3 className="font-bold mb-4 dark:text-white">{t('createUrgentAd')}</h3>
                    <div className="space-y-3">
                        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Message..." className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600 outline-none h-24 dark:text-white"/>
                        <button onClick={addAd} className="w-full bg-red-600 text-white py-3 rounded-lg font-bold">{t('postAd')}</button>
                    </div>
                </div>

                <div className="space-y-3">
                    {ads.map(ad => (
                        <div key={ad.id} className={`bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border dark:border-gray-700 ${!ad.is_active ? 'opacity-60' : 'border-l-4 border-l-red-500'}`}>
                            <p className="font-bold text-sm mb-2 dark:text-white">{ad.message}</p>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400">{new Date(ad.created_at).toLocaleDateString()}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => toggleAd(ad)} className={`px-3 py-1 rounded-full font-bold ${ad.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {ad.is_active ? 'Active' : 'Inactive'}
                                    </button>
                                    <button onClick={() => deleteAd(ad.id)} className="text-red-500"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const AIInstructionsView: React.FC<{ provider: AuthenticatedUser; onClose: () => void; onUpdateUser: (u: Partial<AuthenticatedUser>) => void }> = ({ provider, onClose, onUpdateUser }) => {
    const { t } = useLocalization();
    const [formData, setFormData] = useState({
        price_info: provider.price_info || '',
        location_info: provider.location_info || '',
        working_hours: provider.working_hours || '',
        booking_info: provider.booking_info || '',
        custom_ai_instructions: provider.custom_ai_instructions || ''
    });
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        const { error } = await supabase.from('providers').update(formData).eq('id', provider.id);
        if(!error) {
            onUpdateUser(formData);
            alert(t('success'));
        } else {
            alert(t('errorMessage'));
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col animate-slide-up">
            <div className="p-4 border-b dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-800">
                <button onClick={onClose}><ArrowLeft className="dark:text-white"/></button>
                <h2 className="font-bold text-xl flex items-center gap-2 dark:text-white"><BrainCircuit className="text-purple-600"/> إعدادات الذكاء الاصطناعي</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800 mb-2">
                    <p className="text-xs text-blue-700 dark:text-blue-300">هذه المعلومات سيستخدمها المساعد الذكي للإجابة عن أسئلة الزبناء تلقائياً.</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700 shadow-sm">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2"><Banknote size={14}/> الأسعار (Prices)</label>
                    <textarea value={formData.price_info} onChange={e => setFormData({...formData, price_info: e.target.value})} placeholder="مثال: الاستشارة ب 200 درهم، تبييض الأسنان ب 1500 درهم..." className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600 h-20 text-sm dark:text-white"/>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700 shadow-sm">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2"><MapPin size={14}/> تفاصيل الموقع (Location)</label>
                    <textarea value={formData.location_info} onChange={e => setFormData({...formData, location_info: e.target.value})} placeholder="مثال: قرب مسجد محمد الخامس، الطابق الثاني..." className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600 h-20 text-sm dark:text-white"/>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700 shadow-sm">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2"><Clock size={14}/> التوقيت (Hours)</label>
                    <textarea value={formData.working_hours} onChange={e => setFormData({...formData, working_hours: e.target.value})} placeholder="مثال: من الإثنين إلى الجمعة 9:00 - 18:00..." className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600 h-20 text-sm dark:text-white"/>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700 shadow-sm">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2"><CalendarCheck size={14}/> شروط الحجز (Booking)</label>
                    <textarea value={formData.booking_info} onChange={e => setFormData({...formData, booking_info: e.target.value})} placeholder="مثال: الحجز ضروري قبل 24 ساعة..." className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600 h-20 text-sm dark:text-white"/>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700 shadow-sm">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2"><FileText size={14}/> معلومات إضافية (Extra Info)</label>
                    <textarea value={formData.custom_ai_instructions} onChange={e => setFormData({...formData, custom_ai_instructions: e.target.value})} placeholder="أي معلومات أخرى تريد أن يعرفها الزبون..." className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600 h-32 text-sm dark:text-white"/>
                </div>

                <button onClick={handleSave} disabled={loading} className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="animate-spin"/> : <><Save size={18}/> حفظ التغييرات</>}
                </button>
            </div>
        </div>
    );
};

const WelcomeAdSetup: React.FC<{ provider: AuthenticatedUser; onClose: () => void; onUpdateUser: (u: Partial<AuthenticatedUser>) => void }> = ({ provider, onClose, onUpdateUser }) => {
    const { t } = useLocalization();
    const [ads, setAds] = useState<ProviderAd[]>([]);
    const [newAd, setNewAd] = useState({ message: '', image_url: '' });
    const [loading, setLoading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetch = async () => {
            const { data } = await supabase.from('provider_ads').select('*').eq('provider_id', provider.id).order('created_at', { ascending: false });
            setAds(data as any || []);
        };
        fetch();
    }, [provider.id]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if(!file) return;
        setLoading(true);
        try {
            const fileName = `ad_${provider.id}_${Date.now()}`;
            await supabase.storage.from('announcement-images').upload(fileName, file);
            const { data } = supabase.storage.from('announcement-images').getPublicUrl(fileName);
            setNewAd(prev => ({ ...prev, image_url: data.publicUrl }));
        } catch(e) { alert('Upload error'); } finally { setLoading(false); }
    };

    const handleCreate = async () => {
        if(!newAd.message) return alert('Message required');
        setLoading(true);
        const { data, error } = await supabase.from('provider_ads').insert({
            provider_id: provider.id,
            message: newAd.message,
            image_url: newAd.image_url,
            is_active: true
        }).select();

        if(!error && data) {
            setAds([data[0] as any, ...ads]);
            setNewAd({ message: '', image_url: '' });
        }
        setLoading(false);
    };

    const handleDelete = async (id: number) => {
        await supabase.from('provider_ads').delete().eq('id', id);
        setAds(ads.filter(a => a.id !== id));
    };

    return (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col animate-slide-up">
            <div className="p-4 border-b dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-800">
                <button onClick={onClose}><ArrowLeft className="dark:text-white"/></button>
                <h2 className="font-bold text-xl flex items-center gap-2 dark:text-white"><MessageSquare className="text-pink-600"/> قصص و إعلانات (Stories)</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700 shadow-sm mb-6">
                    <h3 className="font-bold mb-4 dark:text-white">نشر قصة جديدة</h3>
                    <div className="space-y-4">
                        <textarea value={newAd.message} onChange={e => setNewAd({...newAd, message: e.target.value})} placeholder="اكتب رسالتك للزبناء..." className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border dark:border-gray-600 h-24 dark:text-white"/>
                        <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                            {newAd.image_url ? <img src={newAd.image_url} className="h-32 object-contain"/> : <><ImageIcon className="text-gray-400 mb-2"/><span className="text-xs text-gray-500">إضافة صورة (اختياري)</span></>}
                            <input type="file" ref={fileRef} hidden accept="image/*" onChange={handleImageUpload} />
                        </div>
                        <button onClick={handleCreate} disabled={loading} className="w-full py-3 bg-pink-600 text-white rounded-xl font-bold shadow-lg">نشر الآن</button>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold text-gray-500 text-sm uppercase">منشورات سابقة</h3>
                    {ads.map(ad => (
                        <div key={ad.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700 shadow-sm relative overflow-hidden">
                             {ad.image_url && <div className="h-32 bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 overflow-hidden"><img src={ad.image_url} className="w-full h-full object-cover"/></div>}
                             <p className="font-bold text-sm text-gray-800 dark:text-white">{ad.message}</p>
                             <div className="flex justify-between items-center mt-3 text-xs text-gray-400">
                                 <span>{new Date(ad.created_at).toLocaleDateString()}</span>
                                 <button onClick={() => handleDelete(ad.id)} className="text-red-500 flex items-center gap-1"><Trash2 size={12}/> حذف</button>
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const EditProfileModal: React.FC<{ provider: AuthenticatedUser; onClose: () => void; onUpdateUser: (u: Partial<AuthenticatedUser>) => void }> = ({ provider, onClose, onUpdateUser }) => {
    const { t } = useLocalization();
    const [name, setName] = useState(provider.name);
    const [bio, setBio] = useState(provider.bio || '');
    const [phone, setPhone] = useState(provider.phone || '');
    const [image, setImage] = useState(provider.profile_image_url || '');
    const [loading, setLoading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleSave = async () => {
        setLoading(true);
        const { error } = await supabase.from('providers').update({ name, bio, phone, profile_image_url: image }).eq('id', provider.id);
        if(!error) {
            onUpdateUser({ name, bio, phone, profile_image_url: image });
            onClose();
        } else {
            alert(t('errorMessage'));
        }
        setLoading(false);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if(!file) return;
        setLoading(true);
        try {
            const fileName = `prof_${provider.id}_${Date.now()}`;
            await supabase.storage.from('profiles').upload(fileName, file);
            const { data } = supabase.storage.from('profiles').getPublicUrl(fileName);
            setImage(data.publicUrl);
        } catch(e) {} finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-[60] flex flex-col animate-slide-up">
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-xl dark:text-white">{t('editProfile')}</h3>
                <button onClick={onClose}><X className="dark:text-white"/></button>
            </div>
            <div className="p-6 space-y-4 bg-gray-50 dark:bg-gray-900 flex-1">
                <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden relative" onClick={() => fileRef.current?.click()}>
                        {image ? <img src={image} className="w-full h-full object-cover"/> : <Camera className="m-auto mt-8 text-gray-400"/>}
                        {loading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="animate-spin text-white"/></div>}
                    </div>
                    <input type="file" ref={fileRef} hidden onChange={handleUpload}/>
                </div>
                <input value={name} onChange={e => setName(e.target.value)} placeholder={t('fullName')} className="w-full p-3 rounded-xl border dark:border-gray-600 dark:bg-gray-800 dark:text-white"/>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder={t('phone')} className="w-full p-3 rounded-xl border dark:border-gray-600 dark:bg-gray-800 dark:text-white"/>
                <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder={t('bioLabel')} className="w-full p-3 rounded-xl border dark:border-gray-600 h-32 dark:bg-gray-800 dark:text-white"/>
                <button onClick={handleSave} disabled={loading} className="w-full py-3 bg-black dark:bg-white dark:text-black text-white rounded-xl font-bold">{t('save')}</button>
            </div>
        </div>
    );
};

// --- NEW COMPONENT: SPONSORED REQUESTS VIEW ---
const SponsoredRequestsView: React.FC<{ providerId: number; onClose: () => void }> = ({ providerId, onClose }) => {
    const { t } = useLocalization();
    const [ads, setAds] = useState<ProviderAd[]>([]);
    const [selectedAdId, setSelectedAdId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [requests, setRequests] = useState<any[]>([]);

    useEffect(() => {
        fetchAds();
        fetchRequests();
    }, []);

    const fetchAds = async () => {
        const { data } = await supabase.from('provider_ads').select('*').eq('provider_id', providerId).eq('is_active', true).order('created_at', { ascending: false });
        setAds(data || []);
    };

    const fetchRequests = async () => {
        const { data } = await supabase.from('sponsored_requests').select('*, provider_ads(message, image_url)').eq('provider_id', providerId).order('created_at', { ascending: false });
        setRequests(data || []);
    };

    const handleSubmit = async () => {
        if (!selectedAdId) return alert('Please select an ad to boost');
        
        // Check if pending
        const pending = requests.find(r => r.ad_id === selectedAdId && r.status === 'pending');
        if (pending) return alert('Already pending approval');

        setLoading(true);
        const { error } = await supabase.from('sponsored_requests').insert({
            provider_id: providerId,
            ad_id: selectedAdId,
            status: 'pending'
        });

        if (!error) {
            alert('Request sent! Admin will verify payment (50DH) and activate.');
            fetchRequests();
            setSelectedAdId(null);
        } else {
            alert('Error sending request');
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col animate-slide-up">
            <div className="p-4 border-b dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-800">
                <button onClick={onClose}><ArrowLeft className="dark:text-white"/></button>
                <h2 className="font-bold text-xl dark:text-white flex items-center gap-2"><Rocket className="text-pink-600"/> {t('boostPost')}</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50 dark:bg-gray-900">
                
                {/* Info Card */}
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg">
                    <h3 className="font-bold text-lg mb-2">{t('boostDesc')}</h3>
                    <p className="text-3xl font-black mb-4">{t('boostPrice')}</p>
                    <div className="bg-white/20 p-3 rounded-lg text-sm">
                        <p>✅ يظهر الإعلان لجميع مستخدمي التطبيق (Feed)</p>
                        <p>✅ زر حجز موعد مباشر</p>
                        <p>✅ زيادة المتابعين</p>
                    </div>
                </div>

                {/* Select Ad */}
                <div>
                    <h4 className="font-bold mb-3 dark:text-white">اختر إعلان للترويج</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {ads.length === 0 && <p className="text-gray-400 text-sm">No active ads. Create one in Stories first.</p>}
                        {ads.map(ad => (
                            <div 
                                key={ad.id} 
                                onClick={() => setSelectedAdId(ad.id)}
                                className={`p-3 rounded-xl border-2 cursor-pointer flex gap-3 items-center transition-all ${selectedAdId === ad.id ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}
                            >
                                {ad.image_url ? (
                                    <img src={ad.image_url} className="w-12 h-12 rounded object-cover bg-gray-200"/>
                                ) : (
                                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-xs">Text</div>
                                )}
                                <div className="flex-1">
                                    <p className="text-sm font-bold line-clamp-1 dark:text-white">{ad.message}</p>
                                    <p className="text-[10px] text-gray-400">{new Date(ad.created_at).toLocaleDateString()}</p>
                                </div>
                                {selectedAdId === ad.id && <CheckCircle className="text-pink-500"/>}
                            </div>
                        ))}
                    </div>
                </div>

                <button onClick={handleSubmit} disabled={loading || !selectedAdId} className="w-full py-4 bg-black text-white rounded-xl font-bold shadow-lg disabled:opacity-50">
                    {loading ? <Loader2 className="animate-spin mx-auto"/> : t('requestBoost')}
                </button>

                {/* History */}
                <div>
                    <h4 className="font-bold mb-3 dark:text-white text-sm uppercase text-gray-500">{t('sponsoredRequests')}</h4>
                    {requests.map(r => (
                        <div key={r.id} className="p-3 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 mb-2 flex justify-between items-center">
                            <div className="flex gap-2 items-center">
                                <div className={`w-2 h-2 rounded-full ${r.status === 'approved' ? 'bg-green-500' : r.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                <span className="text-sm dark:text-white">Request #{r.id}</span>
                            </div>
                            <span className="text-xs font-bold uppercase">{r.status}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const ProviderPortal: React.FC<{ provider: AuthenticatedUser; onLogout: () => void; onUpdateUser: (updates: Partial<AuthenticatedUser>) => void; onNavTo?: (target: string) => void }> = ({ provider, onLogout, onUpdateUser, onNavTo }) => {
    const { t } = useLocalization();
    const [view, setView] = useState<'scan' | 'notifications' | 'history' | 'ads' | 'offers' | 'urgent' | 'ai_config' | 'welcome_ad' | 'sponsored' | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [stats, setStats] = useState({ followers: 0, posts: 0, visits: 0 });
    const [daysLeft, setDaysLeft] = useState(0);

    const isAdmin = provider.phone === '0617774846';

    useEffect(() => {
        const fetchStats = async () => {
            const { count: offersCount } = await supabase.from('provider_offers').select('id', { count: 'exact' }).eq('provider_id', provider.id);
            const { count: followersCount } = await supabase.from('follows').select('id', { count: 'exact' }).eq('provider_id', provider.id);
            setStats({ followers: followersCount || 0, posts: offersCount || 0, visits: provider.visits_count || 0 });
            
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
                
                <div className="grid grid-cols-3 gap-0.5 mt-0.5">
                    <GridItem icon={Rocket} label="إشهار مدفوع" onClick={() => setView('sponsored')} color="bg-gradient-to-br from-purple-600 to-pink-600 text-white"/>
                    <GridItem icon={MessageSquare} label="إعلانات المحادثة" onClick={() => setView('welcome_ad')} color="bg-pink-100 hover:bg-pink-200 text-pink-700"/>
                    <GridItem icon={BrainCircuit} label="إعدادات الذكاء" onClick={() => setView('ai_config')} color="bg-purple-100 hover:bg-purple-200 text-purple-700"/>
                    
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
            {view === 'sponsored' && <SponsoredRequestsView providerId={provider.id} onClose={() => setView(null)} />}
            
            {editMode && <EditProfileModal provider={provider} onClose={() => setEditMode(false)} onUpdateUser={onUpdateUser} />}
        </div>
    );
};

export default ProviderPortal;
