
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { useLocalization } from '../hooks/useLocalization';
import { ArrowLeft, Loader2, Plus, Trash2, Edit, CheckCircle, XCircle, ShoppingBag, Users, Megaphone, Image as ImageIcon, Settings, Save, BarChart3, X, FileText, Phone } from 'lucide-react';
import { Product, AdRequest, Order } from '../types';

interface AdminDashboardProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
    const { t } = useLocalization();
    const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'PROVIDERS' | 'ADS' | 'STATS' | 'ORDERS'>('PRODUCTS');
    const [loading, setLoading] = useState(false);

    // Products State
    const [products, setProducts] = useState<Product[]>([]);
    const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'category_clothes', description: '', image: '', images: [] as string[], sizes: '' });
    const [editingProductId, setEditingProductId] = useState<number | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    // Providers State
    const [pendingProviders, setPendingProviders] = useState<any[]>([]);

    // Ads State
    const [adRequests, setAdRequests] = useState<AdRequest[]>([]);

    // Stats State
    const [providerStats, setProviderStats] = useState<any[]>([]);

    // Orders State
    const [orders, setOrders] = useState<Order[]>([]);

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
            const { data } = await supabase.from('providers').select('*').eq('is_active', false);
            setPendingProviders(data || []);
        } else if (activeTab === 'ADS') {
            // UPDATED: Fetch ALL requests, not just pending, so Admin can see history
            const { data } = await supabase.from('provider_ad_requests').select('*, providers(name, phone)').order('created_at', { ascending: false });
            setAdRequests(data as any || []);
        } else if (activeTab === 'STATS') {
            // 1. Fetch Providers (Total Visits)
            const { data: providers } = await supabase.from('providers').select('id, name, service_type, visits_count, profile_image_url').order('visits_count', { ascending: false });
            
            // 2. Fetch Today's Scans to calculate "Visits Today"
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { data: todayScans } = await supabase.from('scan_history').select('provider_id').gte('created_at', today.toISOString());

            // 3. Count today's visits per provider
            const todayCounts: Record<number, number> = {};
            todayScans?.forEach((scan: any) => {
                todayCounts[scan.provider_id] = (todayCounts[scan.provider_id] || 0) + 1;
            });

            // 4. Merge Data
            const mergedStats = providers?.map((p: any) => ({
                ...p,
                today_visits: todayCounts[p.id] || 0
            })) || [];

            setProviderStats(mergedStats);
        } else if (activeTab === 'ORDERS') {
            const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
            setOrders(data as any || []);
        }
        setLoading(false);
    };

    // --- PRODUCT LOGIC ---
    const handleSaveProduct = async () => {
        if (!newProduct.name || !newProduct.price) return alert(t('errorMessage'));
        setLoading(true);

        const sizesArray = newProduct.sizes ? newProduct.sizes.split(',').map(s => s.trim()).filter(s => s !== '') : [];

        const payload = {
            name: newProduct.name,
            price: parseFloat(newProduct.price),
            category: newProduct.category,
            description: newProduct.description,
            image_url: newProduct.image, // Main image
            images: newProduct.images, // Array of images
            sizes: sizesArray
        };

        let error;
        if (editingProductId) {
            // Update Existing
            const { error: err } = await supabase.from('products').update(payload).eq('id', editingProductId);
            error = err;
        } else {
            // Create New
            const { error: err } = await supabase.from('products').insert(payload);
            error = err;
        }

        if (!error) {
            alert(editingProductId ? t('success') : t('addProductSuccess'));
            handleCancelEdit();
            fetchData();
        } else {
            alert(t('errorMessage'));
        }
        setLoading(false);
    };

    const handleEditProduct = (p: Product) => {
        setNewProduct({
            name: p.name,
            price: p.price.toString(),
            category: p.category,
            description: p.description || '',
            image: p.image_url || '',
            images: p.images || [],
            sizes: p.sizes ? p.sizes.join(', ') : ''
        });
        setEditingProductId(p.id);
        // Scroll to top to see form
        document.querySelector('.overflow-y-auto')?.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const handleCancelEdit = () => {
        setNewProduct({ name: '', price: '', category: 'category_clothes', description: '', image: '', images: [], sizes: '' });
        setEditingProductId(null);
    }

    const handleDeleteProduct = async (id: number) => {
        if(confirm(t('delete') + '?')) {
            await supabase.from('products').delete().eq('id', id);
            fetchData();
        }
    };

    const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;
        setLoading(true);
        try {
            const fileName = `prod_${Date.now()}`;
            await supabase.storage.from('product-images').upload(fileName, file);
            const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
            
            // If main image is empty, set it. Otherwise add to images array
            if (!newProduct.image) {
                setNewProduct(prev => ({ ...prev, image: data.publicUrl }));
            } else {
                setNewProduct(prev => ({ ...prev, images: [...prev.images, data.publicUrl] }));
            }
        } catch(e) {} finally { setLoading(false); }
    };
    
    const removeImage = (index: number) => {
        const newImages = [...newProduct.images];
        newImages.splice(index, 1);
        setNewProduct(prev => ({ ...prev, images: newImages }));
    }

    // --- PROVIDER LOGIC ---
    const handleApproveProvider = async (id: number) => {
        await supabase.from('providers').update({ is_active: true }).eq('id', id);
        fetchData();
    };

    const handleRejectProvider = async (id: number) => {
        if(confirm(t('reject') + '?')) {
            await supabase.from('providers').delete().eq('id', id);
            fetchData();
        }
    };

    // --- AD LOGIC ---
    const handleApproveAd = async (req: AdRequest) => {
        await supabase.from('system_announcements').insert({ title: req.providers?.name || 'Offer', message: req.message, image_url: req.image_url, is_active: true });
        await supabase.from('provider_ad_requests').update({ status: 'approved' }).eq('id', req.id);
        fetchData();
    };

    const handleRejectAd = async (id: number) => {
        await supabase.from('provider_ad_requests').update({ status: 'rejected' }).eq('id', id);
        fetchData();
    };
    
    // NEW: Delete Ad Request (Archive)
    const handleDeleteAdRequest = async (id: number) => {
        if(confirm(t('delete') + '?')) {
            await supabase.from('provider_ad_requests').delete().eq('id', id);
            fetchData();
        }
    };

    // --- ORDERS LOGIC ---
    const handleUpdateOrderStatus = async (id: number, status: string) => {
        setLoading(true);
        await supabase.from('orders').update({ status: status }).eq('id', id);
        fetchData();
        setLoading(false);
    }

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-white z-[80] flex flex-col animate-slide-up">
            <div className="bg-black text-white p-4 flex justify-between items-center shadow-lg">
                <button onClick={onClose}><ArrowLeft/></button>
                <h2 className="font-bold text-lg flex items-center gap-2"><Settings/> {t('adminDashboard')}</h2>
                <div className="w-6"/>
            </div>

            {/* TABS */}
            <div className="flex border-b bg-gray-100 overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('PRODUCTS')}
                    className={`flex-1 py-4 px-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'PRODUCTS' ? 'bg-white text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'}`}
                >
                    <ShoppingBag size={18}/> {t('manageProducts')}
                </button>
                <button 
                    onClick={() => setActiveTab('ORDERS')}
                    className={`flex-1 py-4 px-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'ORDERS' ? 'bg-white text-teal-600 border-b-2 border-teal-600' : 'text-gray-500'}`}
                >
                    <FileText size={18}/> {t('storeOrders')}
                </button>
                <button 
                    onClick={() => setActiveTab('PROVIDERS')}
                    className={`flex-1 py-4 px-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'PROVIDERS' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                >
                    <Users size={18}/> {t('manageProviders')}
                </button>
                <button 
                    onClick={() => setActiveTab('ADS')}
                    className={`flex-1 py-4 px-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'ADS' ? 'bg-white text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
                >
                    <Megaphone size={18}/> {t('adRequests')}
                </button>
                <button 
                    onClick={() => setActiveTab('STATS')}
                    className={`flex-1 py-4 px-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'STATS' ? 'bg-white text-green-600 border-b-2 border-green-600' : 'text-gray-500'}`}
                >
                    <BarChart3 size={18}/> {t('globalStats')}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                
                {/* PRODUCTS TAB */}
                {activeTab === 'PRODUCTS' && (
                    <div className="space-y-6">
                        <div className="bg-white p-4 rounded-xl shadow-sm border">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold">{editingProductId ? t('updateProduct') : t('addProduct')}</h3>
                                {editingProductId && <button onClick={handleCancelEdit} className="text-red-500 text-xs font-bold flex items-center gap-1"><X size={14}/> {t('cancelEdit')}</button>}
                            </div>
                            
                            <div className="space-y-3">
                                <input value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder={t('productName')} className="w-full p-2 border rounded"/>
                                <div className="flex gap-2">
                                    <input type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} placeholder={t('productPrice')} className="flex-1 p-2 border rounded"/>
                                    <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="flex-1 p-2 border rounded">
                                        <option value="category_clothes">{t('category_clothes')}</option>
                                        <option value="category_electronics">{t('category_electronics')}</option>
                                        <option value="category_accessories">{t('category_accessories')}</option>
                                        <option value="category_home">{t('category_home')}</option>
                                        <option value="category_beauty">{t('category_beauty')}</option>
                                    </select>
                                </div>
                                <input value={newProduct.sizes} onChange={e => setNewProduct({...newProduct, sizes: e.target.value})} placeholder={t('sizesLabel')} className="w-full p-2 border rounded"/>
                                <textarea value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} placeholder={t('description')} className="w-full p-2 border rounded"/>
                                
                                <button onClick={() => fileRef.current?.click()} className="w-full py-2 border border-dashed rounded flex items-center justify-center gap-2 text-gray-500"><Plus size={18}/> Add Image</button>
                                <input type="file" ref={fileRef} hidden onChange={handleProductImageUpload} />
                                
                                {/* Image Preview Grid */}
                                <div className="grid grid-cols-4 gap-2">
                                    {newProduct.image && (
                                        <div className="relative border rounded h-16 w-full">
                                            <img src={newProduct.image} className="h-full w-full object-cover rounded"/>
                                            <span className="absolute bottom-0 right-0 bg-black text-white text-[9px] px-1">Main</span>
                                        </div>
                                    )}
                                    {newProduct.images.map((img, idx) => (
                                        <div key={idx} className="relative border rounded h-16 w-full group">
                                            <img src={img} className="h-full w-full object-cover rounded"/>
                                            <button onClick={() => removeImage(idx)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl"><X size={10}/></button>
                                        </div>
                                    ))}
                                </div>
                                
                                <button onClick={handleSaveProduct} disabled={loading} className={`w-full text-white py-2 rounded font-bold ${editingProductId ? 'bg-blue-600' : 'bg-orange-600'}`}>
                                    {loading ? <Loader2 className="animate-spin mx-auto"/> : (editingProductId ? t('save') : t('save'))}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {products.map(p => (
                                <div key={p.id} className="bg-white p-2 rounded-lg border flex justify-between items-center shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <img src={p.image_url} className="w-12 h-12 rounded bg-gray-100 object-cover"/>
                                        <div>
                                            <p className="font-bold text-sm">{p.name}</p>
                                            <p className="text-xs text-orange-600 font-bold">{p.price} DH</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEditProduct(p)} className="p-2 text-blue-500 hover:bg-blue-50 rounded"><Edit size={18}/></button>
                                        <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={18}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ORDERS TAB */}
                {activeTab === 'ORDERS' && (
                    <div className="space-y-4">
                        <div className="bg-teal-50 p-4 rounded-xl border border-teal-200">
                             <h3 className="font-bold text-teal-800">{t('storeOrders')}</h3>
                             <p className="text-xs text-teal-600">Review requests and contact customers.</p>
                        </div>
                        {orders.length === 0 && <p className="text-center text-gray-400 py-10">No orders yet.</p>}
                        {orders.map(o => (
                            <div key={o.id} className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold flex items-center gap-2">
                                            {o.customer_details?.name || 'Unknown User'} 
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${o.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {o.status}
                                            </span>
                                        </h4>
                                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                            <Phone size={12}/> <a href={`tel:${o.customer_details?.phone}`} className="hover:underline">{o.customer_details?.phone || 'No phone'}</a>
                                        </p>
                                        <p className="text-[10px] text-gray-400">{new Date(o.created_at).toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-black text-lg text-orange-600">{o.total_amount} DH</span>
                                    </div>
                                </div>
                                
                                <div className="bg-gray-50 p-3 rounded-lg text-sm border">
                                    <ul className="space-y-1">
                                        {o.items.map((item: any, idx: number) => (
                                            <li key={idx} className="flex justify-between text-xs">
                                                <span>{item.name} <span className="text-gray-500">x{item.quantity}</span> {item.selectedSize && <span className="font-bold bg-white px-1 border rounded">{item.selectedSize}</span>}</span>
                                                <span className="font-bold">{item.price * item.quantity} DH</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {o.status === 'pending' && (
                                    <button 
                                        onClick={() => handleUpdateOrderStatus(o.id, 'delivered')}
                                        className="w-full py-2 bg-green-600 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
                                    >
                                        <CheckCircle size={14}/> {t('markDelivered')} (Connect)
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* PROVIDERS TAB */}
                {activeTab === 'PROVIDERS' && (
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                             <h3 className="font-bold text-blue-800">{t('pendingProviders')}</h3>
                             <p className="text-xs text-blue-600">Approve new registrations here.</p>
                        </div>
                        {pendingProviders.length === 0 && <p className="text-center text-gray-400 py-10">No pending requests.</p>}
                        {pendingProviders.map(p => (
                            <div key={p.id} className="bg-white p-4 rounded-xl border shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-bold">{p.name}</h4>
                                        <p className="text-sm text-gray-600">{p.phone}</p>
                                        <p className="text-xs text-blue-500 font-bold">{p.service_type}</p>
                                    </div>
                                    <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-bold">Pending</span>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <button onClick={() => handleRejectProvider(p.id)} className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg font-bold text-xs flex items-center justify-center gap-1"><XCircle size={14}/> {t('reject')}</button>
                                    <button onClick={() => handleApproveProvider(p.id)} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1"><CheckCircle size={14}/> {t('approve')}</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ADS TAB */}
                {activeTab === 'ADS' && (
                    <div className="space-y-4">
                         <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 mb-2">
                             <h3 className="font-bold text-purple-800">{t('adRequests')}</h3>
                             <p className="text-xs text-purple-600">Archive of all requests.</p>
                        </div>

                         {adRequests.length === 0 && <p className="text-center text-gray-400 py-10">No ad requests found.</p>}
                         {adRequests.map(r => (
                             <div key={r.id} className={`bg-white p-4 rounded-xl border shadow-sm ${r.status !== 'pending' ? 'opacity-75 bg-gray-50' : ''}`}>
                                 <div className="flex justify-between items-start mb-3">
                                     <div className="flex gap-3">
                                        <img src={r.image_url} className="w-16 h-16 rounded bg-gray-100 object-cover"/>
                                        <div>
                                            <p className="font-bold text-sm">{r.providers?.name}</p>
                                            <p className="text-sm text-gray-800">{r.message}</p>
                                            <p className="text-xs text-gray-500 mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                                        </div>
                                     </div>
                                     {/* Status Badge */}
                                     <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${
                                         r.status === 'approved' ? 'bg-green-100 text-green-700' : 
                                         r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                     }`}>
                                         {r.status}
                                     </span>
                                 </div>

                                 {/* Actions */}
                                 <div className="flex gap-2">
                                     {r.status === 'pending' ? (
                                        <>
                                            <button onClick={() => handleRejectAd(r.id)} className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg font-bold text-xs">{t('reject')}</button>
                                            <button onClick={() => handleApproveAd(r)} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold text-xs">{t('approve')}</button>
                                        </>
                                     ) : (
                                        <button onClick={() => handleDeleteAdRequest(r.id)} className="w-full py-2 bg-gray-200 text-gray-600 hover:bg-red-500 hover:text-white transition-colors rounded-lg font-bold text-xs flex items-center justify-center gap-2">
                                            <Trash2 size={14}/> Delete Request
                                        </button>
                                     )}
                                 </div>
                             </div>
                         ))}
                    </div>
                )}

                {/* STATS TAB */}
                {activeTab === 'STATS' && (
                    <div className="space-y-4">
                        <div className="bg-green-50 p-4 rounded-xl border border-green-200 mb-4">
                             <h3 className="font-bold text-green-800 flex items-center gap-2"><BarChart3 size={20}/> {t('globalStats')}</h3>
                             <p className="text-xs text-green-600">Top providers by QR scans.</p>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                             <table className="w-full text-sm">
                                 <thead className="bg-gray-100 text-gray-600 font-bold">
                                     <tr>
                                         <th className="p-3 text-right">#</th>
                                         <th className="p-3 text-right">{t('provider')}</th>
                                         <th className="p-3 text-right">{t('service')}</th>
                                         <th className="p-3 text-center text-green-600">{t('visits')}</th>
                                         <th className="p-3 text-center">{t('totalVisits')}</th>
                                     </tr>
                                 </thead>
                                 <tbody>
                                     {providerStats.length === 0 && (
                                         <tr><td colSpan={5} className="text-center p-6 text-gray-400">No data available</td></tr>
                                     )}
                                     {providerStats.map((p, index) => (
                                         <tr key={p.id} className="border-t hover:bg-gray-50">
                                             <td className="p-3 font-bold text-gray-400">{index + 1}</td>
                                             <td className="p-3 font-bold flex items-center gap-2">
                                                 <img src={p.profile_image_url || `https://ui-avatars.com/api/?name=${p.name}`} className="w-8 h-8 rounded-full bg-gray-200 object-cover"/>
                                                 <span className="truncate max-w-[100px]">{p.name}</span>
                                             </td>
                                             <td className="p-3 text-gray-600 text-xs">{p.service_type}</td>
                                             <td className="p-3 text-center font-bold text-green-600">+{p.today_visits || 0}</td>
                                             <td className="p-3 text-center font-black text-blue-600">{p.visits_count || 0}</td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
