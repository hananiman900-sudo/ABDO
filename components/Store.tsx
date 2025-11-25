
import React, { useState, useEffect, useRef } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { Product, CartItem, AuthenticatedUser, Order, SystemAnnouncement } from '../types';
import { supabase } from '../services/supabaseClient';
import { ShoppingBag, ShoppingCart, Plus, Minus, X, CheckCircle, Loader2, Package, Search, History, Trash, Settings, List, Save, User, Phone, Edit, MessageSquare, Image as ImageIcon, ArrowLeft, Truck, Clock } from 'lucide-react';

interface StoreProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: AuthenticatedUser | null;
}

const Store: React.FC<StoreProps> = ({ isOpen, onClose, currentUser }) => {
    const { t } = useLocalization();
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [view, setView] = useState<'catalog' | 'cart' | 'orders' | 'admin'>('catalog');
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [myOrders, setMyOrders] = useState<Order[]>([]);
    
    // User Selection State
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [selectedNote, setSelectedNote] = useState<string>('');
    const [productToAdd, setProductToAdd] = useState<Product | null>(null);
    const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);

    // Admin State
    const [adminTab, setAdminTab] = useState<'products' | 'orders' | 'ads'>('products');
    const [adminOrders, setAdminOrders] = useState<Order[]>([]);
    const [systemAds, setSystemAds] = useState<SystemAnnouncement[]>([]);
    const [newProduct, setNewProduct] = useState({ id: 0, name: '', description: '', price: '', category: 'General', image_url: '', sizes: '' });
    const [newAd, setNewAd] = useState({ title: '', message: '', image_url: '' });
    const [isEditingProduct, setIsEditingProduct] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const adFileInputRef = useRef<HTMLInputElement>(null);
    const isAdmin = currentUser?.phone === '0617774846' && currentUser?.accountType === 'PROVIDER';

    useEffect(() => {
        if (isOpen) {
            fetchProducts();
            if (currentUser) fetchMyOrders();
            if (isAdmin) setView('admin'); // Auto-open admin view for admin
        }
    }, [isOpen, currentUser]);

    // --- FETCHING ---

    const fetchProducts = async () => {
        setIsLoading(true);
        const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        setProducts(data || []);
        setIsLoading(false);
    };

    const fetchMyOrders = async () => {
        if (!currentUser) return;
        const { data } = await supabase.from('orders').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
        setMyOrders(data as Order[] || []);
    };

    const fetchAdminOrders = async () => {
        setIsLoading(true);
        const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        setAdminOrders(data as Order[] || []);
        setIsLoading(false);
    };

    const fetchSystemAds = async () => {
        const { data } = await supabase.from('system_announcements').select('*').order('created_at', { ascending: false });
        setSystemAds(data || []);
    }

    // --- IMAGE UPLOAD LOGIC ---

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'product' | 'ad') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const bucket = type === 'product' ? 'product-images' : 'announcement-images';
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
            
            if (type === 'product') {
                setNewProduct(prev => ({ ...prev, image_url: data.publicUrl }));
            } else {
                setNewAd(prev => ({ ...prev, image_url: data.publicUrl }));
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert(t('uploadError'));
        } finally {
            setIsLoading(false);
        }
    };

    // --- CART LOGIC ---

    const initiateAddToCart = (product: Product) => {
        setSelectedProductDetail(product);
        setSelectedSize('');
        setSelectedNote('');
    };

    const confirmAddToCart = () => {
        if (!selectedProductDetail) return;
        setCart(prev => {
            const existing = prev.find(item => item.id === selectedProductDetail.id && item.selectedSize === selectedSize);
            if (existing) {
                return prev.map(item => (item.id === selectedProductDetail.id && item.selectedSize === selectedSize) ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...selectedProductDetail, quantity: 1, selectedSize, note: selectedNote }];
        });
        setSelectedProductDetail(null);
    };

    const removeFromCart = (index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const updateQuantity = (index: number, delta: number) => {
        setCart(prev => prev.map((item, i) => {
            if (i === index) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const handleCheckout = async () => {
        if (!currentUser) return alert(t('loginTitle'));
        if (cart.length === 0) return;

        setIsLoading(true);
        try {
            const { error } = await supabase.from('orders').insert({
                user_id: currentUser.id,
                user_type: currentUser.accountType,
                total_amount: cartTotal,
                items: cart,
                status: 'pending',
                customer_details: {
                    name: currentUser.name,
                    phone: currentUser.phone || 'N/A'
                }
            });
            
            if (error) throw error;

            setOrderPlaced(true);
            setCart([]);
            await fetchMyOrders(); // Wait for orders to refresh
        } catch (e: any) {
            console.error(e);
            alert(t('errorMessage') + (e.message ? `: ${e.message}` : ''));
        } finally {
            setIsLoading(false);
        }
    };

    // --- ADMIN LOGIC ---

    const handleSaveProduct = async () => {
        if(!newProduct.name || !newProduct.price) return;
        setIsLoading(true);
        try {
            const sizeArray = newProduct.sizes.split(',').map(s => s.trim()).filter(s => s.length > 0);
            
            const productData = {
                name: newProduct.name,
                description: newProduct.description,
                price: parseFloat(newProduct.price),
                category: newProduct.category,
                image_url: newProduct.image_url,
                sizes: sizeArray
            };

            if (isEditingProduct && newProduct.id) {
                const { error } = await supabase.from('products').update(productData).eq('id', newProduct.id);
                if (error) throw error;
                alert(t('savedSuccessfully'));
            } else {
                const { error } = await supabase.from('products').insert(productData);
                if (error) throw error;
                alert(t('savedSuccessfully'));
            }

            setNewProduct({ id: 0, name: '', description: '', price: '', category: 'General', image_url: '', sizes: '' });
            setIsEditingProduct(false);
            await fetchProducts(); // Refresh list immediately
        } catch (e: any) {
            console.error(e);
            alert("Error saving product. Please ensure V14 update is applied in DB Setup.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditProductClick = (product: Product) => {
        setNewProduct({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price.toString(),
            category: product.category,
            image_url: product.image_url,
            sizes: product.sizes ? product.sizes.join(', ') : ''
        });
        setIsEditingProduct(true);
        // Scroll to top of admin area
        const container = document.getElementById('admin-product-form');
        if(container) container.scrollIntoView({ behavior: 'smooth' });
    };

    const handleDeleteProduct = async (id: number) => {
        if(confirm(t('delete') + '?')) {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) {
                alert("Error deleting product. Check permissions (V14 Update).");
            } else {
                fetchProducts();
            }
        }
    }

    const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
        await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
        fetchAdminOrders();
    };

    const handleAddSystemAd = async () => {
        if (!newAd.title || !newAd.message || !newAd.image_url) return alert(t('allFieldsRequired'));
        await supabase.from('system_announcements').insert({
            title: newAd.title,
            message: newAd.message,
            image_url: newAd.image_url,
            is_active: true
        });
        setNewAd({ title: '', message: '', image_url: '' });
        fetchSystemAds();
    };

    const handleDeleteSystemAd = async (id: number) => {
        if(confirm(t('delete') + '?')) {
            await supabase.from('system_announcements').delete().eq('id', id);
            fetchSystemAds();
        }
    }

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 w-full max-w-4xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-4 sm:p-6 border-b dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="bg-pink-100 text-pink-600 p-2 rounded-xl">
                            <ShoppingBag size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold dark:text-white leading-none">{view === 'admin' ? t('storeManager') : t('shop')}</h2>
                            {currentUser && !isAdmin && <p className="text-xs text-gray-500 font-bold">{t('helloUser', { name: currentUser.name })}</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                         {isAdmin && (
                            <button onClick={() => { setView('admin'); fetchAdminOrders(); fetchSystemAds(); }} className={`p-2 rounded-full transition-colors ${view === 'admin' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-purple-600'}`}>
                                <Settings size={24} />
                            </button>
                        )}
                        <button onClick={() => setView('catalog')} className={`p-2 rounded-full transition-colors ${view === 'catalog' ? 'bg-gray-100 dark:bg-gray-700 text-primary' : 'text-gray-400'}`}>
                            <Search size={24} />
                        </button>
                        {currentUser && !isAdmin && (
                            <button onClick={() => setView('orders')} className={`p-2 rounded-full transition-colors ${view === 'orders' ? 'bg-gray-100 dark:bg-gray-700 text-primary' : 'text-gray-400'}`}>
                                <History size={24} />
                            </button>
                        )}
                        {!isAdmin && (
                        <button onClick={() => setView('cart')} className={`p-2 rounded-full transition-colors relative ${view === 'cart' ? 'bg-gray-100 dark:bg-gray-700 text-primary' : 'text-gray-400'}`}>
                            <ShoppingCart size={24} />
                            {cart.length > 0 && <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">{cart.length}</span>}
                        </button>
                        )}
                        <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-dark dark:text-light ml-2">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-900/50">
                    {/* --- ADMIN VIEW --- */}
                    {view === 'admin' && isAdmin ? (
                        <div className="space-y-6">
                            <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 pb-4 overflow-x-auto">
                                <button onClick={() => setAdminTab('products')} className={`pb-2 px-2 font-bold whitespace-nowrap ${adminTab === 'products' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}>{t('products')}</button>
                                <button onClick={() => { setAdminTab('orders'); fetchAdminOrders(); }} className={`pb-2 px-2 font-bold whitespace-nowrap ${adminTab === 'orders' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}>{t('orders')}</button>
                                <button onClick={() => { setAdminTab('ads'); fetchSystemAds(); }} className={`pb-2 px-2 font-bold whitespace-nowrap ${adminTab === 'ads' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}>{t('systemAds')}</button>
                            </div>

                            {adminTab === 'products' ? (
                                <div className="space-y-8">
                                    <div id="admin-product-form" className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-bold text-lg dark:text-white">{isEditingProduct ? t('editProduct') : t('addProduct')}</h3>
                                            {isEditingProduct && (
                                                <button onClick={() => { setIsEditingProduct(false); setNewProduct({ id: 0, name: '', description: '', price: '', category: 'General', image_url: '', sizes: '' }); }} className="text-xs text-red-500 underline">{t('close')}</button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input placeholder={t('productName')} value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl outline-none dark:text-white border border-gray-200 dark:border-gray-600"/>
                                            <input placeholder={t('price')} type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl outline-none dark:text-white border border-gray-200 dark:border-gray-600"/>
                                            <input placeholder={t('category')} value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl outline-none dark:text-white border border-gray-200 dark:border-gray-600"/>
                                            
                                            <div className="flex gap-2">
                                                <input placeholder={t('productImage')} value={newProduct.image_url} onChange={e => setNewProduct({...newProduct, image_url: e.target.value})} className="flex-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl outline-none dark:text-white border border-gray-200 dark:border-gray-600"/>
                                                <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-gray-200 dark:bg-gray-600 rounded-xl hover:bg-gray-300"><ImageIcon/></button>
                                                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => handleImageUpload(e, 'product')} />
                                            </div>

                                            <input placeholder={t('sizes')} value={newProduct.sizes} onChange={e => setNewProduct({...newProduct, sizes: e.target.value})} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl outline-none dark:text-white border border-gray-200 dark:border-gray-600 md:col-span-2"/>
                                            <textarea placeholder={t('productDescription')} value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl outline-none dark:text-white border border-gray-200 dark:border-gray-600 md:col-span-2" rows={3}/>
                                        </div>
                                        <button onClick={handleSaveProduct} disabled={isLoading} className="mt-4 w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primaryDark flex items-center justify-center gap-2">
                                            {isLoading ? <Loader2 className="animate-spin"/> : <Save size={18}/>} {t('saveProfile')}
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="font-bold text-lg dark:text-white">{t('products')}</h3>
                                        {products.map(p => (
                                            <div key={p.id} className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                    {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover"/> : <Package className="w-full h-full p-4 text-gray-400"/>}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold dark:text-white">{p.name}</h4>
                                                    <p className="text-sm text-gray-500">{p.price} DH | {p.category}</p>
                                                    <p className="text-xs text-gray-400 mt-1">{p.sizes && p.sizes.length > 0 ? p.sizes.join(', ') : 'No sizes'}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleEditProductClick(p)} className="text-blue-500 p-2 hover:bg-blue-50 rounded-full"><Edit size={18}/></button>
                                                    <button onClick={() => handleDeleteProduct(p.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-full"><Trash size={18}/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : adminTab === 'ads' ? (
                                <div className="space-y-8">
                                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                        <h3 className="font-bold text-lg mb-4 dark:text-white">{t('addSystemAd')}</h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            <input placeholder={t('adTitle')} value={newAd.title} onChange={e => setNewAd({...newAd, title: e.target.value})} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl outline-none dark:text-white border border-gray-200 dark:border-gray-600"/>
                                            <div className="flex gap-2">
                                                <input placeholder={t('productImage')} value={newAd.image_url} onChange={e => setNewAd({...newAd, image_url: e.target.value})} className="flex-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl outline-none dark:text-white border border-gray-200 dark:border-gray-600"/>
                                                <button onClick={() => adFileInputRef.current?.click()} className="p-3 bg-gray-200 dark:bg-gray-600 rounded-xl hover:bg-gray-300"><ImageIcon/></button>
                                                <input type="file" ref={adFileInputRef} hidden accept="image/*" onChange={(e) => handleImageUpload(e, 'ad')} />
                                            </div>
                                            <textarea placeholder={t('messageLabel')} value={newAd.message} onChange={e => setNewAd({...newAd, message: e.target.value})} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl outline-none dark:text-white border border-gray-200 dark:border-gray-600" rows={3}/>
                                        </div>
                                        <button onClick={handleAddSystemAd} className="mt-4 w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primaryDark flex items-center justify-center gap-2">
                                            <Plus size={18}/> {t('sendButton')}
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {systemAds.map(ad => (
                                            <div key={ad.id} className="relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                                <img src={ad.image_url} className="w-full h-32 object-cover"/>
                                                <div className="p-4">
                                                    <h4 className="font-bold dark:text-white">{ad.title}</h4>
                                                    <p className="text-sm text-gray-500">{ad.message}</p>
                                                </div>
                                                <button onClick={() => handleDeleteSystemAd(ad.id)} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg"><Trash size={16}/></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                     <h3 className="font-bold text-lg dark:text-white">{t('orders')}</h3>
                                     {adminOrders.map(order => (
                                         <div key={order.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                             <div className="flex justify-between items-start mb-4">
                                                 <div>
                                                     <div className="flex items-center gap-2 mb-1">
                                                         <span className="font-bold text-lg dark:text-white">Order #{order.id}</span>
                                                         <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{order.status}</span>
                                                     </div>
                                                     <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleString()}</p>
                                                 </div>
                                                 <div className="text-right">
                                                      <p className="font-bold text-xl text-primary">{order.total_amount} DH</p>
                                                 </div>
                                             </div>
                                             
                                             <div className="bg-gray-50 dark:bg-gray-900/30 p-4 rounded-xl mb-4 text-sm">
                                                 <h5 className="font-bold text-gray-500 mb-2 flex items-center gap-1"><User size={14}/> {t('customerInfo')}</h5>
                                                 <p className="font-bold dark:text-white">{order.customer_details?.name || 'Unknown'}</p>
                                                 <p className="flex items-center gap-2 mt-1 dark:text-gray-300"><Phone size={12}/> {order.customer_details?.phone || 'N/A'}</p>
                                             </div>

                                             <div className="space-y-2 border-t border-gray-100 dark:border-gray-700 pt-4">
                                                 {order.items.map((item: CartItem, idx: number) => (
                                                     <div key={idx} className="flex justify-between items-center text-sm dark:text-gray-300">
                                                         <div>
                                                             <span className="font-bold">{item.quantity}x {item.name}</span>
                                                             {item.selectedSize && <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">{item.selectedSize}</span>}
                                                             {item.note && <div className="text-xs text-gray-500 italic mt-0.5">Note: {item.note}</div>}
                                                         </div>
                                                         <span>{item.price * item.quantity} DH</span>
                                                     </div>
                                                 ))}
                                             </div>

                                             {order.status === 'pending' && (
                                                 <button onClick={() => handleUpdateOrderStatus(order.id, 'delivered')} className="w-full mt-4 py-2 bg-green-50 text-green-600 font-bold rounded-lg hover:bg-green-100 transition-colors">
                                                     {t('markDelivered')}
                                                 </button>
                                             )}
                                         </div>
                                     ))}
                                </div>
                            )}
                        </div>
                    ) : orderPlaced ? (
                        <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in p-6">
                            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                                <Truck size={48} className="text-green-500" />
                            </div>
                            <h3 className="text-2xl font-bold dark:text-white mb-2">{t('orderPlaced')}</h3>
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800 mb-6 w-full max-w-sm">
                                <p className="font-bold text-green-800 dark:text-green-300 mb-2">{t('freeDelivery')}</p>
                                <p className="text-sm text-green-700 dark:text-green-400">{t('contactWithin24h')}</p>
                            </div>
                            <div className="flex flex-col gap-3 w-full max-w-xs">
                                <button onClick={() => { setOrderPlaced(false); setView('orders'); }} className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30">
                                    {t('trackOrder')}
                                </button>
                                <button onClick={() => { setOrderPlaced(false); setView('catalog'); }} className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold">
                                    {t('backToStore')}
                                </button>
                            </div>
                        </div>
                    ) : view === 'catalog' ? (
                        <div>
                            <div className="relative mb-6">
                                <input 
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder={t('searchProductPlaceholder')}
                                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-none outline-none dark:text-white"
                                />
                                <Search className="absolute left-4 top-4 text-gray-400" size={20} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredProducts.map(product => (
                                    <div key={product.id} onClick={() => initiateAddToCart(product)} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all flex flex-col cursor-pointer group">
                                        <div className="h-48 bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                                            {product.image_url ? (
                                                <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400"><Package size={48}/></div>
                                            )}
                                            <span className="absolute top-3 right-3 bg-white/90 dark:bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-sm dark:text-white">
                                                {product.category}
                                            </span>
                                        </div>
                                        <div className="p-4 flex-1 flex flex-col">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-lg dark:text-white line-clamp-1">{product.name}</h3>
                                                <span className="font-bold text-primary text-lg whitespace-nowrap">{product.price} DH</span>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 flex-1">{product.description}</p>
                                            <button 
                                                className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mt-auto"
                                            >
                                                <Plus size={18} /> {t('addToCart')}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : view === 'cart' ? (
                        <div className="max-w-2xl mx-auto">
                            {cart.length === 0 ? (
                                <div className="text-center py-20 text-gray-400">
                                    <ShoppingCart size={64} className="mx-auto mb-4 opacity-20" />
                                    <p className="text-lg">{t('noNotifications')}</p>
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm overflow-hidden">
                                    <div className="p-6 space-y-6">
                                        {cart.map((item, index) => (
                                            <div key={index} className="flex items-center gap-4 border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden flex-shrink-0">
                                                    {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover"/> : null}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold dark:text-white truncate">{item.name}</h4>
                                                    <p className="text-primary font-bold text-sm">{item.price} DH</p>
                                                    {item.selectedSize && <p className="text-xs text-gray-500 mt-1">Size: {item.selectedSize}</p>}
                                                    {item.note && <p className="text-xs text-gray-400 italic truncate">"{item.note}"</p>}
                                                </div>
                                                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                                    <button onClick={() => updateQuantity(index, -1)} className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors"><Minus size={14} /></button>
                                                    <span className="font-bold text-sm w-4 text-center dark:text-white">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(index, 1)} className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors"><Plus size={14} /></button>
                                                </div>
                                                <button onClick={() => removeFromCart(index)} className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"><Trash size={18} /></button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-6 bg-gray-50 dark:bg-gray-900/30 border-t dark:border-gray-700">
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="text-lg font-bold text-gray-600 dark:text-gray-300">Total</span>
                                            <span className="text-3xl font-bold text-dark dark:text-white">{cartTotal} DH</span>
                                        </div>
                                        <button 
                                            onClick={handleCheckout} 
                                            disabled={isLoading}
                                            className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-green-500/30 transition-all active:scale-95"
                                        >
                                            {isLoading ? <Loader2 className="animate-spin mx-auto" /> : t('checkout')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="font-bold text-xl mb-4 dark:text-white">{t('myOrders')}</h3>
                            {myOrders.map(order => (
                                <div key={order.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                                    {order.status}
                                                </span>
                                                {order.status === 'pending' && <Clock size={14} className="text-yellow-600"/>}
                                            </div>
                                            <p className="text-xs text-gray-400 mt-2">{new Date(order.created_at).toLocaleString()}</p>
                                        </div>
                                        <span className="text-xl font-bold dark:text-white">{order.total_amount} DH</span>
                                    </div>
                                    <div className="space-y-2">
                                        {order.items.map((item: CartItem, idx: number) => (
                                            <div key={idx} className="flex justify-between text-sm text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0">
                                                <span>{item.quantity}x {item.name} {item.selectedSize ? `(${item.selectedSize})` : ''}</span>
                                                <span>{item.price * item.quantity} DH</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {myOrders.length === 0 && <p className="text-center text-gray-400 py-10">{t('noFollowUps')}</p>}
                        </div>
                    )}
                </div>
            </div>
            
            {/* PRODUCT DETAIL MODAL */}
            {selectedProductDetail && (
                <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedProductDetail(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        {selectedProductDetail.image_url ? (
                            <div className="h-64 w-full bg-gray-100">
                                <img src={selectedProductDetail.image_url} className="w-full h-full object-cover"/>
                            </div>
                        ) : <div className="h-32 bg-gray-200 flex items-center justify-center"><Package size={48} className="text-gray-400"/></div>}
                        
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-2xl font-bold dark:text-white">{selectedProductDetail.name}</h3>
                                <p className="text-xl font-bold text-primary">{selectedProductDetail.price} DH</p>
                            </div>
                            <span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm dark:text-white mb-4 inline-block">
                                {selectedProductDetail.category}
                            </span>
                            
                            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">{selectedProductDetail.description}</p>

                            {selectedProductDetail.sizes && selectedProductDetail.sizes.length > 0 && (
                                <div className="mb-4">
                                    <label className="block text-sm font-bold text-gray-500 mb-2">{t('selectSize')}</label>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedProductDetail.sizes.map(size => (
                                            <button 
                                                key={size} 
                                                onClick={() => setSelectedSize(size)}
                                                className={`px-4 py-2 rounded-lg border-2 font-bold transition-all ${selectedSize === size ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mb-6">
                                <label className="block text-sm font-bold text-gray-500 mb-2">{t('addNote')}</label>
                                <textarea 
                                    value={selectedNote}
                                    onChange={e => setSelectedNote(e.target.value)}
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl outline-none dark:text-white resize-none"
                                    rows={2}
                                />
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setSelectedProductDetail(null)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white font-bold rounded-xl">{t('close')}</button>
                                <button 
                                    onClick={confirmAddToCart} 
                                    disabled={selectedProductDetail.sizes && selectedProductDetail.sizes.length > 0 && !selectedSize}
                                    className="flex-1 py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl disabled:opacity-50"
                                >
                                    {t('addToCart')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Store;
