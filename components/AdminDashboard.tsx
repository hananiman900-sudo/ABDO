
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { useLocalization } from '../hooks/useLocalization';
import { ArrowLeft, Loader2, Plus, Trash2, Edit, CheckCircle, XCircle, ShoppingBag, Users, Megaphone, Image as ImageIcon, Settings, Save, BarChart3, X, FileText, Phone, CreditCard, RefreshCw, Power, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { Product, AdRequest, Order, AppCategory, AppSpecialty } from '../types';

interface AdminDashboardProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
    const { t } = useLocalization();
    const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'PROVIDERS' | 'ADS' | 'STATS' | 'ORDERS' | 'SUBS' | 'SETTINGS'>('PRODUCTS');
    const [loading, setLoading] = useState(false);

    // Products State
    const [products, setProducts] = useState<Product[]>([]);
    const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'category_clothes', description: '', image: '', images: [] as string[], sizes: '' });
    const [editingProductId, setEditingProductId] = useState<number | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    // Providers State (ALL providers)
    const [allProviders, setAllProviders] = useState<any[]>([]);

    // Ads State
    const [adRequests, setAdRequests] = useState<AdRequest[]>([]);

    // Stats State
    const [providerStats, setProviderStats] = useState<any[]>([]);

    // Orders State
    const [orders, setOrders] = useState<Order[]>([]);
    
    // Subscriptions State
    const [activeProviders, setActiveProviders] = useState<any[]>([]);

    // Settings (Categories) State
    const [appCategories, setAppCategories] = useState<AppCategory[]>([]);
    const [appSpecialties, setAppSpecialties] = useState<AppSpecialty[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newSpecialtyName, setNewSpecialtyName] = useState('');
    const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

    useEffect(() => {
        if(isOpen) {
            fetchData();
        }
    }, [isOpen, activeTab]);

    const fetchData = async () => {
        setLoading(true);
        if (activeTab === 'PRODUCTS') {
            const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
            setProducts(data || []);
        } else if (activeTab === 'PROVIDERS') {
            const { data } = await supabase.from('providers').select('*').order('created_at', { ascending: false });
            setAllProviders(data || []);
        } else if (activeTab === 'ADS') {
            const { data } = await supabase.from('provider_ad_requests').select('*, providers(name, phone)').order('created_at', { ascending: false });
            setAdRequests(data as any || []);
        } else if (activeTab === 'STATS') {
            // Stats logic...
            const { data: providers } = await supabase.from('providers').select('id, name, service_type, visits_count, profile_image_url').order('visits_count', { ascending: false });
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const { data: todayScans } = await supabase.from('scan_history').select('provider_id').gte('created_at', today.toISOString());
            const todayCounts: Record<number, number> = {};
            todayScans?.forEach((scan: any) => { todayCounts[scan.provider_id] = (todayCounts[scan.provider_id] || 0) + 1; });
            const mergedStats = providers?.map((p: any) => ({ ...p, today_visits: todayCounts[p.id] || 0 })) || [];
            setProviderStats(mergedStats);
        } else if (activeTab === 'ORDERS') {
            const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
            setOrders(data as any || []);
        } else if (activeTab === 'SUBS') {
            const { data } = await supabase.from('providers').select('*').eq('is_active', true).order('subscription_end_date', { ascending: true });
            setActiveProviders(data || []);
        } else if (activeTab === 'SETTINGS') {
            const { data: cats } = await supabase.from('app_categories').select('*').order('name');
            const { data: specs } = await supabase.from('app_specialties').select('*').order('name');
            setAppCategories(cats || []);
            setAppSpecialties(specs || []);
        }
        setLoading(false);
    };

    // --- CATEGORY MANAGEMENT ---
    const handleAddCategory = async () => {
        if(!newCategoryName.trim()) return;
        setLoading(true);
        const { error } = await supabase.from('app_categories').insert({ name: newCategoryName.trim() });
        if(!error) { setNewCategoryName(''); fetchData(); } else alert('Error adding category');
        setLoading(false);
    };

    const handleDeleteCategory = async (id: number) => {
        if(!confirm('Delete this category? All related specialties will be deleted.')) return;
        setLoading(true);
        await supabase.from('app_categories').delete().eq('id', id);
        fetchData();
    };

    const handleAddSpecialty = async (categoryId: number) => {
        if(!newSpecialtyName.trim()) return;
        setLoading(true);
        const { error } = await supabase.from('app_specialties').insert({ category_id: categoryId, name: newSpecialtyName.trim() });
        if(!error) { setNewSpecialtyName(''); fetchData(); } else alert('Error adding specialty');
        setLoading(false);
    };

    const handleDeleteSpecialty = async (id: number) => {
        if(!confirm('Delete specialty?')) return;
        await supabase.from('app_specialties').delete().eq('id', id);
        fetchData();
    };

    // ... (Existing Product, Provider, Ad, Order Logic)
    // --- PRODUCT LOGIC ---
    const handleSaveProduct = async () => { /* ... existing code ... */ 
        if (!newProduct.name || !newProduct.price) return alert(t('errorMessage')); setLoading(true); const sizesArray = newProduct.sizes ? newProduct.sizes.split(',').map(s => s.trim()).filter(s => s !== '') : []; const payload = { name: newProduct.name, price: parseFloat(newProduct.price), category: newProduct.category, description: newProduct.description, image_url: newProduct.image, images: newProduct.images, sizes: sizesArray }; let error; if (editingProductId) { const { error: err } = await supabase.from('products').update(payload).eq('id', editingProductId); error = err; } else { const { error: err } = await supabase.from('products').insert(payload); error = err; } if (!error) { alert(editingProductId ? t('success') : t('addProductSuccess')); handleCancelEdit(); fetchData(); } else { alert(t('errorMessage')); } setLoading(false);
    };
    const handleEditProduct = (p: Product) => { setNewProduct({ name: p.name, price: p.price.toString(), category: p.category, description: p.description || '', image: p.image_url || '', images: p.images || [], sizes: p.sizes ? p.sizes.join(', ') : '' }); setEditingProductId(p.id); document.querySelector('.overflow-y-auto')?.scrollTo({ top: 0, behavior: 'smooth' }); }
    const handleCancelEdit = () => { setNewProduct({ name: '', price: '', category: 'category_clothes', description: '', image: '', images: [], sizes: '' }); setEditingProductId(null); }
    const handleDeleteProduct = async (id: number) => { if(confirm(t('delete') + '?')) { await supabase.from('products').delete().eq('id', id); fetchData(); } };
    const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if(!file) return; setLoading(true); try { const fileName = `prod_${Date.now()}`; await supabase.storage.from('product-images').upload(fileName, file); const { data } = supabase.storage.from('product-images').getPublicUrl(fileName); if (!newProduct.image) setNewProduct(prev => ({ ...prev, image: data.publicUrl })); else setNewProduct(prev => ({ ...prev, images: [...prev.images, data.publicUrl] })); } catch(e) {} finally { setLoading(false); } };
    const removeImage = (index: number) => { const newImages = [...newProduct.images]; newImages.splice(index, 1); setNewProduct(prev => ({ ...prev, images: newImages })); }
    
    // --- PROVIDER LOGIC ---
    const toggleProviderActivation = async (provider: any) => { setLoading(true); const newStatus = !provider.is_active; let updateData: any = { is_active: newStatus }; if (newStatus && (!provider.subscription_end_date || new Date(provider.subscription_end_date) < new Date())) { const endDate = new Date(); endDate.setDate(endDate.getDate() + 30); updateData.subscription_end_date = endDate.toISOString(); } const { error } = await supabase.from('providers').update(updateData).eq('id', provider.id); if(!error) { setAllProviders(prev => prev.map(p => p.id === provider.id ? {...p, is_active: newStatus} : p)); } else { alert(t('errorMessage')); } setLoading(false); };
    const handleDeleteProvider = async (id: number) => { if(confirm(t('delete') + ' Provider?')) { await supabase.from('providers').delete().eq('id', id); fetchData(); } };

    // --- SUBSCRIPTIONS ---
    const handleRenewSubscription = async (provider: any) => { setLoading(true); let currentEnd = provider.subscription_end_date ? new Date(provider.subscription_end_date) : new Date(); const now = new Date(); if (currentEnd < now) currentEnd = now; currentEnd.setDate(currentEnd.getDate() + 30); await supabase.from('providers').update({ subscription_end_date: currentEnd.toISOString() }).eq('id', provider.id); fetchData(); alert(`تم تجديد اشتراك ${provider.name} لمدة شهر بنجاح.`); setLoading(false); }
    const calculateDaysLeft = (dateStr: string) => { if(!dateStr) return 0; const end = new Date(dateStr); const now = new Date(); const diff = end.getTime() - now.getTime(); return Math.ceil(diff / (1000 * 60 * 60 * 24)); }

    // --- ADS & ORDERS ---
    const handleApproveAd = async (req: AdRequest) => { await supabase.from('system_announcements').insert({ title: req.providers?.name || 'Offer', message: req.message, image_url: req.image_url, is_active: true }); await supabase.from('provider_ad_requests').update({ status: 'approved' }).eq('id', req.id); fetchData(); };
    const handleRejectAd = async (id: number) => { await supabase.from('provider_ad_requests').update({ status: 'rejected' }).eq('id', id); fetchData(); };
    const handleDeleteAdRequest = async (id: number) => { if(confirm(t('delete') + '?')) { await supabase.from('provider_ad_requests').delete().eq('id', id); fetchData(); } };
    const handleUpdateOrderStatus = async (id: number, status: string) => { setLoading(true); await supabase.from('orders').update({ status: status }).eq('id', id); fetchData(); setLoading(false); }


    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-white z-[80] flex flex-col animate-slide-up">
            <div className="bg-black text-white p-4 flex justify-between items-center shadow-lg">
                <button onClick={onClose}><ArrowLeft/></button>
                <h2 className="font-bold text-lg flex items-center gap-2"><Settings/> {t('adminDashboard')}</h2>
                <div className="w-6"/>
            </div>

            {/* TABS */}
            <div className="flex border-b bg-gray-100 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('PRODUCTS')} className={`flex-1 py-4 px-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'PRODUCTS' ? 'bg-white text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'}`}><ShoppingBag size={18}/> المنتجات</button>
                <button onClick={() => setActiveTab('ORDERS')} className={`flex-1 py-4 px-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'ORDERS' ? 'bg-white text-teal-600 border-b-2 border-teal-600' : 'text-gray-500'}`}><FileText size={18}/> الطلبات</button>
                <button onClick={() => setActiveTab('PROVIDERS')} className={`flex-1 py-4 px-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'PROVIDERS' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}><Users size={18}/> المهنيين</button>
                <button onClick={() => setActiveTab('SUBS')} className={`flex-1 py-4 px-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'SUBS' ? 'bg-white text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}><CreditCard size={18}/> الاشتراكات</button>
                <button onClick={() => setActiveTab('ADS')} className={`flex-1 py-4 px-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'ADS' ? 'bg-white text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}><Megaphone size={18}/> الإشهار</button>
                <button onClick={() => setActiveTab('SETTINGS')} className={`flex-1 py-4 px-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'SETTINGS' ? 'bg-white text-gray-800 border-b-2 border-gray-800' : 'text-gray-500'}`}><Layers size={18}/> الإعدادات</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                
                {/* SETTINGS TAB (Categories & Specialties) */}
                {activeTab === 'SETTINGS' && (
                    <div className="space-y-6">
                        <div className="bg-gray-100 p-4 rounded-xl border border-gray-200 mb-2">
                             <h3 className="font-bold text-gray-800">إدارة أصناف المهن (Categories)</h3>
                             <p className="text-xs text-gray-600">يمكنك هنا إضافة أو حذف المهن، وإضافة تخصصات لكل مهنة.</p>
                        </div>

                        {/* Add New Category */}
                        <div className="flex gap-2">
                            <input 
                                value={newCategoryName} 
                                onChange={e => setNewCategoryName(e.target.value)} 
                                placeholder="إسم مهنة جديدة (مثلاً: مهندس)" 
                                className="flex-1 p-3 rounded-xl border outline-none"
                            />
                            <button onClick={handleAddCategory} disabled={loading} className="bg-black text-white px-6 rounded-xl font-bold">إضافة</button>
                        </div>

                        {/* Categories List */}
                        <div className="space-y-3">
                            {appCategories.map(cat => (
                                <div key={cat.id} className="bg-white rounded-xl border overflow-hidden">
                                    <div className="p-4 flex justify-between items-center bg-white hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}>
                                        <div className="flex items-center gap-3">
                                            {expandedCategory === cat.id ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                                            <span className="font-bold text-lg">{cat.name}</span>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }} className="text-red-500 bg-red-50 p-2 rounded-full hover:bg-red-100"><Trash2 size={16}/></button>
                                    </div>
                                    
                                    {/* Specialties Section */}
                                    {expandedCategory === cat.id && (
                                        <div className="bg-gray-50 p-4 border-t">
                                            <h4 className="font-bold text-xs text-gray-500 uppercase mb-3">التخصصات (Specialties)</h4>
                                            
                                            {/* List of Specialties */}
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {appSpecialties.filter(s => s.category_id === cat.id).map(spec => (
                                                    <div key={spec.id} className="bg-white px-3 py-1 rounded-full border flex items-center gap-2 text-sm shadow-sm">
                                                        {spec.name}
                                                        <button onClick={() => handleDeleteSpecialty(spec.id)} className="text-red-500 hover:text-red-700"><X size={12}/></button>
                                                    </div>
                                                ))}
                                                {appSpecialties.filter(s => s.category_id === cat.id).length === 0 && <span className="text-xs text-gray-400 italic">لا توجد تخصصات مضافة</span>}
                                            </div>

                                            {/* Add Specialty */}
                                            <div className="flex gap-2">
                                                <input 
                                                    value={newSpecialtyName} 
                                                    onChange={e => setNewSpecialtyName(e.target.value)} 
                                                    placeholder={`أضف تخصص لـ ${cat.name}...`} 
                                                    className="flex-1 p-2 rounded-lg border text-sm outline-none"
                                                />
                                                <button onClick={() => handleAddSpecialty(cat.id)} disabled={loading} className="bg-blue-600 text-white px-4 rounded-lg font-bold text-sm">إضافة</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ... (Existing Tabs: Products, Orders, Providers, Subs, Ads, Stats) ... */}
                {activeTab === 'PRODUCTS' && (
                    <div className="space-y-6">
                        <div className="bg-white p-4 rounded-xl shadow-sm border">
                            <div className="flex justify-between items-center mb-4"><h3 className="font-bold">{editingProductId ? t('updateProduct') : t('addProduct')}</h3>{editingProductId && <button onClick={handleCancelEdit} className="text-red-500 text-xs font-bold flex items-center gap-1"><X size={14}/> {t('cancelEdit')}</button>}</div>
                            <div className="space-y-3">
                                <input value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder={t('productName')} className="w-full p-2 border rounded"/>
                                <div className="flex gap-2"><input type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} placeholder={t('productPrice')} className="flex-1 p-2 border rounded"/><select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="flex-1 p-2 border rounded"><option value="category_clothes">{t('category_clothes')}</option><option value="category_electronics">{t('category_electronics')}</option><option value="category_accessories">{t('category_accessories')}</option><option value="category_home">{t('category_home')}</option><option value="category_beauty">{t('category_beauty')}</option></select></div>
                                <input value={newProduct.sizes} onChange={e => setNewProduct({...newProduct, sizes: e.target.value})} placeholder={t('sizesLabel')} className="w-full p-2 border rounded"/>
                                <textarea value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} placeholder={t('description')} className="w-full p-2 border rounded"/>
                                <button onClick={() => fileRef.current?.click()} className="w-full py-2 border border-dashed rounded flex items-center justify-center gap-2 text-gray-500"><Plus size={18}/> Add Image</button><input type="file" ref={fileRef} hidden onChange={handleProductImageUpload} />
                                <div className="grid grid-cols-4 gap-2">{newProduct.image && (<div className="relative border rounded h-16 w-full"><img src={newProduct.image} className="h-full w-full object-cover rounded"/><span className="absolute bottom-0 right-0 bg-black text-white text-[9px] px-1">Main</span></div>)}{newProduct.images.map((img, idx) => (<div key={idx} className="relative border rounded h-16 w-full group"><img src={img} className="h-full w-full object-cover rounded"/><button onClick={() => removeImage(idx)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl"><X size={10}/></button></div>))}</div>
                                <button onClick={handleSaveProduct} disabled={loading} className={`w-full text-white py-2 rounded font-bold ${editingProductId ? 'bg-blue-600' : 'bg-orange-600'}`}>{loading ? <Loader2 className="animate-spin mx-auto"/> : (editingProductId ? t('save') : t('save'))}</button>
                            </div>
                        </div>
                        <div className="space-y-2">{products.map(p => (<div key={p.id} className="bg-white p-2 rounded-lg border flex justify-between items-center shadow-sm"><div className="flex items-center gap-3"><img src={p.image_url} className="w-12 h-12 rounded bg-gray-100 object-cover"/><div><p className="font-bold text-sm">{p.name}</p><p className="text-xs text-orange-600 font-bold">{p.price} DH</p></div></div><div className="flex gap-2"><button onClick={() => handleEditProduct(p)} className="p-2 text-blue-500 hover:bg-blue-50 rounded"><Edit size={18}/></button><button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={18}/></button></div></div>))}</div>
                    </div>
                )}
                {activeTab === 'ORDERS' && (
                    <div className="space-y-4">
                        <div className="bg-teal-50 p-4 rounded-xl border border-teal-200"><h3 className="font-bold text-teal-800">{t('storeOrders')}</h3><p className="text-xs text-teal-600">Review requests and contact customers.</p></div>
                        {orders.length === 0 && <p className="text-center text-gray-400 py-10">No orders yet.</p>}
                        {orders.map(o => (<div key={o.id} className="bg-white p-4 rounded-xl border shadow-sm space-y-3"><div className="flex justify-between items-start"><div><h4 className="font-bold flex items-center gap-2">{o.customer_details?.name || 'Unknown User'} <span className={`text-[10px] px-2 py-0.5 rounded-full ${o.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{o.status}</span></h4><p className="text-sm text-gray-600 flex items-center gap-1 mt-1"><Phone size={12}/> <a href={`tel:${o.customer_details?.phone}`} className="hover:underline">{o.customer_details?.phone || 'No phone'}</a></p><p className="text-[10px] text-gray-400">{new Date(o.created_at).toLocaleString()}</p></div><div className="text-right"><span className="font-black text-lg text-orange-600">{o.total_amount} DH</span></div></div><div className="bg-gray-50 p-3 rounded-lg text-sm border"><ul className="space-y-1">{o.items.map((item: any, idx: number) => (<li key={idx} className="flex justify-between text-xs"><span>{item.name} <span className="text-gray-500">x{item.quantity}</span> {item.selectedSize && <span className="font-bold bg-white px-1 border rounded">{item.selectedSize}</span>}</span><span className="font-bold">{item.price * item.quantity} DH</span></li>))}</ul></div>{o.status === 'pending' && (<button onClick={() => handleUpdateOrderStatus(o.id, 'delivered')} className="w-full py-2 bg-green-600 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"><CheckCircle size={14}/> {t('markDelivered')} (Connect)</button>)}</div>))}
                    </div>
                )}
                {activeTab === 'PROVIDERS' && (
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200"><h3 className="font-bold text-blue-800">إدارة المهنيين (All Providers)</h3><p className="text-xs text-blue-600">Activate or deactivate accounts directly.</p></div>
                        {allProviders.length === 0 && <p className="text-center text-gray-400 py-10">No providers found.</p>}
                        {allProviders.map(p => (<div key={p.id} className={`bg-white p-4 rounded-xl border shadow-sm ${!p.is_active ? 'border-red-200 bg-red-50/30' : 'border-green-200'}`}><div className="flex justify-between items-start mb-2"><div><div className="flex items-center gap-2"><h4 className="font-bold">{p.name}</h4>{p.is_active ? <CheckCircle size={14} className="text-green-500"/> : <XCircle size={14} className="text-red-500"/>}</div><p className="text-sm text-gray-600 font-mono">{p.phone}</p><p className="text-xs text-blue-500 font-bold">{p.service_type} <span className="text-gray-400">|</span> {p.category || 'N/A'}</p><p className="text-[10px] text-gray-400">{new Date(p.created_at).toLocaleDateString()}</p></div><div className="flex flex-col gap-2"><button onClick={() => toggleProviderActivation(p)} className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${p.is_active ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'}`}><div className="w-4 h-4 bg-white rounded-full shadow-sm"></div></button></div></div><div className="flex gap-2 mt-3 pt-3 border-t border-dashed"><button onClick={() => handleDeleteProvider(p.id)} className="text-red-500 text-xs font-bold flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded"><Trash2 size={12}/> Delete</button>{!p.is_active && (<button onClick={() => toggleProviderActivation(p)} className="ml-auto bg-green-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-sm">تفعيل الآن</button>)}</div></div>))}
                    </div>
                )}
                {activeTab === 'SUBS' && (
                    <div className="space-y-4">
                        <div className="bg-pink-50 p-4 rounded-xl border border-pink-200 mb-2"><h3 className="font-bold text-pink-800">إدارة الاشتراكات</h3><p className="text-xs text-pink-600">تتبع المدة المتبقية لكل مهني وتجديد الاشتراكات.</p></div>
                        <div className="bg-white rounded-xl shadow-sm border overflow-hidden"><table className="w-full text-sm"><thead className="bg-gray-100 text-gray-600 font-bold"><tr><th className="p-3 text-right">المهني</th><th className="p-3 text-right">الهاتف</th><th className="p-3 text-center">الأيام المتبقية</th><th className="p-3 text-center">إجراء</th></tr></thead><tbody>{activeProviders.map((p) => { const daysLeft = calculateDaysLeft(p.subscription_end_date); return (<tr key={p.id} className="border-t hover:bg-gray-50"><td className="p-3 font-bold"><div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${daysLeft > 5 ? 'bg-green-500' : 'bg-red-500'}`}></div>{p.name}</div><span className="text-xs text-gray-400 font-normal block">{p.service_type}</span></td><td className="p-3 text-gray-600 text-xs"><a href={`tel:${p.phone}`} className="hover:text-blue-600 hover:underline">{p.phone}</a></td><td className="p-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-bold ${daysLeft > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{daysLeft} يوم</span><span className="block text-[9px] text-gray-400 mt-1">{p.subscription_end_date ? new Date(p.subscription_end_date).toLocaleDateString() : 'N/A'}</span></td><td className="p-3 text-center"><button onClick={() => handleRenewSubscription(p)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="تجديد شهر واحد"><RefreshCw size={16}/></button></td></tr>) })}</tbody></table></div>
                    </div>
                )}
                {activeTab === 'ADS' && (
                    <div className="space-y-4">
                         <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 mb-2"><h3 className="font-bold text-purple-800">{t('adRequests')}</h3><p className="text-xs text-purple-600">Archive of all requests.</p></div>
                         {adRequests.length === 0 && <p className="text-center text-gray-400 py-10">No ad requests found.</p>}
                         {adRequests.map(r => (<div key={r.id} className={`bg-white p-4 rounded-xl border shadow-sm ${r.status !== 'pending' ? 'opacity-75 bg-gray-50' : ''}`}><div className="flex justify-between items-start mb-3"><div className="flex gap-3"><img src={r.image_url} className="w-16 h-16 rounded bg-gray-100 object-cover"/><div><p className="font-bold text-sm">{r.providers?.name}</p><p className="text-sm text-gray-800">{r.message}</p><p className="text-xs text-gray-500 mt-1">{new Date(r.created_at).toLocaleDateString()}</p></div></div><span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${r.status === 'approved' ? 'bg-green-100 text-green-700' : r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.status}</span></div><div className="flex gap-2">{r.status === 'pending' ? (<><button onClick={() => handleRejectAd(r.id)} className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg font-bold text-xs">{t('reject')}</button><button onClick={() => handleApproveAd(r)} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold text-xs">{t('approve')}</button></>) : (<button onClick={() => handleDeleteAdRequest(r.id)} className="w-full py-2 bg-gray-200 text-gray-600 hover:bg-red-500 hover:text-white transition-colors rounded-lg font-bold text-xs flex items-center justify-center gap-2"><Trash2 size={14}/> Delete Request</button>)}</div></div>))}
                    </div>
                )}
                {activeTab === 'STATS' && (
                    <div className="space-y-4">
                        <div className="bg-green-50 p-4 rounded-xl border border-green-200 mb-4"><h3 className="font-bold text-green-800 flex items-center gap-2"><BarChart3 size={20}/> {t('globalStats')}</h3><p className="text-xs text-green-600">Top providers by QR scans.</p></div>
                        <div className="bg-white rounded-xl shadow-sm border overflow-hidden"><table className="w-full text-sm"><thead className="bg-gray-100 text-gray-600 font-bold"><tr><th className="p-3 text-right">#</th><th className="p-3 text-right">{t('provider')}</th><th className="p-3 text-right">{t('service')}</th><th className="p-3 text-center text-green-600">{t('visits')}</th><th className="p-3 text-center">{t('totalVisits')}</th></tr></thead><tbody>{providerStats.length === 0 && (<tr><td colSpan={5} className="text-center p-6 text-gray-400">No data available</td></tr>)}{providerStats.map((p, index) => (<tr key={p.id} className="border-t hover:bg-gray-50"><td className="p-3 font-bold text-gray-400">{index + 1}</td><td className="p-3 font-bold flex items-center gap-2"><img src={p.profile_image_url || `https://ui-avatars.com/api/?name=${p.name}`} className="w-8 h-8 rounded-full bg-gray-200 object-cover"/><span className="truncate max-w-[100px]">{p.name}</span></td><td className="p-3 text-gray-600 text-xs">{p.service_type}</td><td className="p-3 text-center font-bold text-green-600">+{p.today_visits || 0}</td><td className="p-3 text-center font-black text-blue-600">{p.visits_count || 0}</td></tr>))}</tbody></table></div>
                    </div>
                )}
            </div>
        </div>
    );
};
