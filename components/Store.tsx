
import React, { useState, useEffect, useRef } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { Product, CartItem, AuthenticatedUser, Order, SystemAnnouncement, Category } from '../types';
import { supabase } from '../services/supabaseClient';
import { ShoppingBag, ShoppingCart, Plus, Minus, X, CheckCircle, Loader2, Package, Search, History, Trash, Settings, List, Save, User, Phone, Edit, MessageSquare, Image as ImageIcon, ArrowLeft, Truck, Clock, Star, Send, Filter, ChevronLeft, ChevronRight, FolderPlus, LogIn, Shirt, Scissors, Maximize2, ChevronUp, ChevronDown, Camera, Video, Upload, Wand2, ScanFace } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface StoreProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: AuthenticatedUser | null;
    onOpenAuth: () => void;
}

const Store: React.FC<StoreProps> = ({ isOpen, onClose, currentUser, onOpenAuth }) => {
    const { t, language } = useLocalization();
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [view, setView] = useState<'catalog' | 'cart' | 'orders' | 'admin'>('catalog');
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [isLoading, setIsLoading] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [myOrders, setMyOrders] = useState<Order[]>([]);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    
    // User Selection State
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [selectedProductDetail, setSelectedProductDetail] = useState<any | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showFittingRoom, setShowFittingRoom] = useState(false);

    // Admin State
    const [adminTab, setAdminTab] = useState<'products' | 'orders' | 'ads'>('products');
    const [adminOrders, setAdminOrders] = useState<Order[]>([]);
    const [systemAds, setSystemAds] = useState<SystemAnnouncement[]>([]);
    
    // Product Editing State
    const [newProduct, setNewProduct] = useState({ id: 0, name: '', description: '', price: '', category: 'General', image_url: '', images: [] as string[], sizes: '' });
    const [isEditingProduct, setIsEditingProduct] = useState(false);
    
    // Ad Creating State
    const [newAd, setNewAd] = useState<{ title: string; message: string; images: string[] }>({ title: '', message: '', images: [] });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const adFileInputRef = useRef<HTMLInputElement>(null);
    const isAdmin = currentUser?.phone === '0617774846' && currentUser?.accountType === 'PROVIDER';

    // --- EFFECT HOOKS ---
    useEffect(() => {
        if (currentUser) {
            const savedCart = localStorage.getItem(`cart_${currentUser.id}`);
            if (savedCart) setCart(JSON.parse(savedCart));
        } else {
            const guestCart = localStorage.getItem('cart_guest');
            if (guestCart) setCart(JSON.parse(guestCart));
        }
    }, [currentUser, isOpen]);

    useEffect(() => {
        if (currentUser) localStorage.setItem(`cart_${currentUser.id}`, JSON.stringify(cart));
        else localStorage.setItem('cart_guest', JSON.stringify(cart));
    }, [cart, currentUser]);

    useEffect(() => {
        if (isOpen) {
            fetchProducts();
            fetchCategories();
            if (currentUser) fetchMyOrders();
            if (isAdmin) setView('admin'); else setView('catalog');
        }
    }, [isOpen, currentUser]);

    // --- FETCH DATA ---
    const fetchCategories = async () => {
        const { data } = await supabase.from('categories').select('*').order('name');
        setCategories(data || []);
    }
    const fetchProducts = async () => {
        try {
            setIsLoading(true);
            const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
            setProducts(data || []);
        } catch(e) { console.log(e); } 
        finally { setIsLoading(false); }
    };
    const fetchMyOrders = async () => {
        if (!currentUser) return;
        try {
            const { data } = await supabase.from('orders').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
            setMyOrders(data as Order[] || []);
        } catch(e) { console.log(e); }
    };
    const fetchAdminOrders = async () => {
        try {
            setIsLoading(true);
            const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
            setAdminOrders(data as Order[] || []);
        } catch(e) { console.log(e); }
        finally { setIsLoading(false); }
    };
    const fetchSystemAds = async () => {
        try {
            const { data } = await supabase.from('system_announcements').select('*').order('created_at', { ascending: false });
            setSystemAds(data || []);
        } catch(e) { console.log(e); }
    }

    // --- UPLOAD LOGIC ---
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'product' | 'ad') => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setIsLoading(true);
        try {
            const bucket = type === 'product' ? 'product-images' : 'announcement-images';
            const urls: string[] = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `${type}_${Date.now()}_${i}.${fileExt}`;
                const { error } = await supabase.storage.from(bucket).upload(fileName, file);
                if (error) throw error;
                const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
                urls.push(data.publicUrl);
            }
            if (type === 'product') {
                setNewProduct(prev => ({ ...prev, images: [...prev.images, ...urls], image_url: prev.image_url || urls[0] }));
            } else {
                setNewAd(prev => ({ ...prev, images: [...prev.images, ...urls] }));
            }
        } catch (error) { alert(t('uploadError')); } 
        finally { setIsLoading(false); }
    };

    const removeProductImage = (index: number) => {
        setNewProduct(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    }

    // --- ADMIN ACTIONS ---
    const handleSaveProduct = async () => {
        if(!newProduct.name || !newProduct.price) return;
        setIsLoading(true);
        try {
            const sizeArray = newProduct.sizes.split(',').map(s => s.trim()).filter(s => s.length > 0);
            const productData = {
                name: newProduct.name, description: newProduct.description, price: parseFloat(newProduct.price),
                category: newProduct.category, image_url: newProduct.images[0] || newProduct.image_url, images: newProduct.images, sizes: sizeArray
            };

            if (isEditingProduct && newProduct.id) {
                await supabase.from('products').update(productData).eq('id', newProduct.id);
            } else {
                await supabase.from('products').insert(productData);
            }
            alert(t('savedSuccessfully'));
            setNewProduct({ id: 0, name: '', description: '', price: '', category: 'General', image_url: '', images: [], sizes: '' });
            setIsEditingProduct(false);
            fetchProducts();
        } catch (e) { alert("Error saving product."); }
        finally { setIsLoading(false); }
    };

    const handleDeleteProduct = async (id: number) => {
        if(confirm(t('delete') + '?')) {
            await supabase.from('products').delete().eq('id', id);
            fetchProducts();
        }
    }

    const handleAddSystemAd = async () => {
        if (!newAd.title || !newAd.message) return alert(t('allFieldsRequired'));
        await supabase.from('system_announcements').insert({
            title: newAd.title, message: newAd.message, image_url: newAd.images[0], images: newAd.images, is_active: true
        });
        setNewAd({ title: '', message: '', images: [] });
        fetchSystemAds();
    };

    const handleDeleteSystemAd = async (id: number) => {
        if(confirm(t('delete') + '?')) {
            await supabase.from('system_announcements').delete().eq('id', id);
            fetchSystemAds();
        }
    }

    // --- CART ACTIONS ---
    const addToCartInternal = (product: Product, size: string) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id && item.selectedSize === size);
            if (existing) return prev.map(item => (item.id === product.id && item.selectedSize === size) ? { ...item, quantity: item.quantity + 1 } : item);
            return [...prev, { ...product, quantity: 1, selectedSize: size }];
        });
    }

    const handleCheckout = async () => {
        if (!currentUser) { setShowLoginPrompt(true); return; }
        if (cart.length === 0) return;
        setIsLoading(true);
        const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        await supabase.from('orders').insert({
            user_id: currentUser.id, user_type: currentUser.accountType, total_amount: cartTotal, items: cart, status: 'pending',
            customer_details: { name: currentUser.name, phone: currentUser.phone || 'N/A' }
        });
        setOrderPlaced(true); setCart([]); fetchMyOrders(); setIsLoading(false);
    };

    const safeProducts = products || [];
    const filteredProducts = safeProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) && (selectedCategory === 'All' || p.category === selectedCategory));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-0 md:p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-gray-100 dark:bg-gray-900 w-full h-full md:max-w-5xl md:h-[90vh] md:rounded-3xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-4 bg-white dark:bg-gray-800 flex justify-between items-center shadow-sm z-20">
                    <div className="flex items-center gap-3">
                        <button onClick={onClose}><ArrowLeft className="dark:text-white"/></button>
                        <h2 className="text-xl font-bold dark:text-white">{view === 'admin' ? t('storeManager') : t('shop')}</h2>
                    </div>
                    <div className="flex gap-2">
                        {isAdmin && <button onClick={() => setView('admin')} className={`p-2 rounded-full ${view === 'admin' ? 'bg-purple-100 text-purple-600' : 'text-gray-400'}`}><Settings/></button>}
                        <button onClick={() => setView('catalog')} className={`p-2 rounded-full ${view === 'catalog' ? 'text-orange-500' : 'text-gray-400'}`}><Search/></button>
                        {!isAdmin && <button onClick={() => setView('cart')} className={`p-2 rounded-full relative ${view === 'cart' ? 'text-orange-500' : 'text-gray-400'}`}><ShoppingCart/>{cart.length > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{cart.length}</span>}</button>}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900">
                    {view === 'admin' && isAdmin ? (
                        <div className="p-6 space-y-6">
                            <div className="flex gap-4 border-b pb-2">
                                <button onClick={() => setAdminTab('products')} className={`font-bold ${adminTab === 'products' ? 'text-primary' : 'text-gray-400'}`}>{t('products')}</button>
                                <button onClick={() => { setAdminTab('orders'); fetchAdminOrders(); }} className={`font-bold ${adminTab === 'orders' ? 'text-primary' : 'text-gray-400'}`}>{t('orders')}</button>
                                <button onClick={() => { setAdminTab('ads'); fetchSystemAds(); }} className={`font-bold ${adminTab === 'ads' ? 'text-primary' : 'text-gray-400'}`}>{t('systemAds')}</button>
                            </div>

                            {adminTab === 'products' ? (
                                <div className="space-y-6">
                                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
                                        <h3 className="font-bold mb-4 dark:text-white">{isEditingProduct ? t('editProduct') : t('addProduct')}</h3>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <input placeholder={t('productName')} value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="p-3 rounded-xl border dark:bg-gray-700 dark:text-white"/>
                                            <input placeholder={t('price')} type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="p-3 rounded-xl border dark:bg-gray-700 dark:text-white"/>
                                            <div className="col-span-2">
                                                <button onClick={() => fileInputRef.current?.click()} className="mb-2 p-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm flex items-center gap-2"><ImageIcon size={16}/> Add Images</button>
                                                <input type="file" ref={fileInputRef} hidden multiple onChange={(e) => handleImageUpload(e, 'product')}/>
                                                <div className="flex gap-2 overflow-x-auto">
                                                    {newProduct.images.map((url, i) => (
                                                        <div key={i} className="relative w-16 h-16"><img src={url} className="w-full h-full object-cover rounded"/><button onClick={() => removeProductImage(i)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={10}/></button></div>
                                                    ))}
                                                </div>
                                            </div>
                                            <input placeholder={t('sizes')} value={newProduct.sizes} onChange={e => setNewProduct({...newProduct, sizes: e.target.value})} className="p-3 rounded-xl border dark:bg-gray-700 dark:text-white col-span-2"/>
                                            <textarea placeholder={t('description')} value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="p-3 rounded-xl border dark:bg-gray-700 dark:text-white col-span-2"/>
                                        </div>
                                        <button onClick={handleSaveProduct} disabled={isLoading} className="mt-4 w-full bg-primary text-white py-3 rounded-xl font-bold">{isLoading ? <Loader2 className="animate-spin mx-auto"/> : t('save')}</button>
                                    </div>
                                    <div className="space-y-2">
                                        {safeProducts.map(p => (
                                            <div key={p.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl flex justify-between items-center shadow-sm">
                                                <div className="flex gap-3 items-center">
                                                    <img src={p.image_url} className="w-12 h-12 rounded object-cover"/>
                                                    <div><p className="font-bold dark:text-white">{p.name}</p><p className="text-xs text-gray-500">{p.price} DH</p></div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => { setIsEditingProduct(true); setNewProduct({ id: p.id, name: p.name, description: p.description, price: p.price, category: p.category, image_url: p.image_url, images: p.images || [p.image_url], sizes: p.sizes ? p.sizes.join(', ') : '' }); }} className="text-blue-500"><Edit/></button>
                                                    <button onClick={() => handleDeleteProduct(p.id)} className="text-red-500"><Trash/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : adminTab === 'ads' ? (
                                <div className="space-y-6">
                                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
                                        <h3 className="font-bold mb-4 dark:text-white">{t('addSystemAd')}</h3>
                                        <div className="space-y-4">
                                            <input placeholder={t('adTitle')} value={newAd.title} onChange={e => setNewAd({...newAd, title: e.target.value})} className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:text-white"/>
                                            <button onClick={() => adFileInputRef.current?.click()} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm flex items-center gap-2"><ImageIcon size={16}/> Upload Ad Images</button>
                                            <input type="file" ref={adFileInputRef} hidden multiple onChange={(e) => handleImageUpload(e, 'ad')}/>
                                            <div className="flex gap-2 overflow-x-auto">{newAd.images.map((url, i) => <img key={i} src={url} className="w-16 h-16 rounded object-cover"/>)}</div>
                                            <textarea placeholder={t('messageLabel')} value={newAd.message} onChange={e => setNewAd({...newAd, message: e.target.value})} className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:text-white"/>
                                            <button onClick={handleAddSystemAd} className="w-full bg-primary text-white py-3 rounded-xl font-bold">{t('sendButton')}</button>
                                        </div>
                                    </div>
                                    {systemAds?.map(ad => (
                                        <div key={ad.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl flex justify-between items-center shadow-sm">
                                            <div><p className="font-bold dark:text-white">{ad.title}</p><p className="text-xs text-gray-500">{ad.message}</p></div>
                                            <button onClick={() => handleDeleteSystemAd(ad.id)} className="text-red-500"><Trash/></button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {adminOrders?.map(o => (
                                        <div key={o.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border dark:border-gray-700">
                                            <div className="flex justify-between"><span className="font-bold dark:text-white">#{o.id}</span><span className="font-bold text-orange-500">{o.total_amount} DH</span></div>
                                            <p className="text-sm text-gray-500">{o.status} • {new Date(o.created_at).toLocaleDateString()}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : view === 'catalog' ? (
                        <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4 pb-20">
                            {/* Product List */}
                            {filteredProducts.map(p => (
                                <div key={p.id} onClick={() => { setSelectedProductDetail(p); setCurrentImageIndex(0); }} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm cursor-pointer">
                                    <div className="aspect-square bg-gray-200"><img src={p.image_url} className="w-full h-full object-cover"/></div>
                                    <div className="p-3">
                                        <h3 className="font-bold dark:text-white truncate">{p.name}</h3>
                                        <p className="text-orange-500 font-bold">{p.price} DH</p>
                                        <button className="w-full mt-2 bg-orange-500 text-white py-1.5 rounded-full text-xs font-bold">{t('addToCart')}</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6">
                            {/* Cart View */}
                            {cart.length === 0 ? <p className="text-center text-gray-400 py-20">{t('noNotifications')}</p> : (
                                <div className="space-y-4">
                                    {cart.map((item, i) => (
                                        <div key={i} className="flex gap-4 border-b pb-4 dark:border-gray-700">
                                            <img src={item.image_url} className="w-16 h-16 rounded object-cover"/>
                                            <div className="flex-1">
                                                <h4 className="font-bold dark:text-white">{item.name}</h4>
                                                <p className="text-sm dark:text-gray-300">{item.price} DH x {item.quantity}</p>
                                                {item.selectedSize && <p className="text-xs text-gray-500">Size: {item.selectedSize}</p>}
                                            </div>
                                        </div>
                                    ))}
                                    <div className="pt-4 border-t dark:border-gray-700">
                                        <p className="font-bold text-xl text-right dark:text-white">Total: {cart.reduce((a, b) => a + b.price * b.quantity, 0)} DH</p>
                                        <button onClick={handleCheckout} className="w-full mt-4 bg-orange-500 text-white py-3 rounded-xl font-bold">{t('checkout')}</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Product Detail Modal */}
            {selectedProductDetail && (
                <div className="fixed inset-0 z-[60] bg-white dark:bg-gray-900 flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
                    <div className="absolute top-0 w-full p-4 flex justify-between z-10">
                        <button onClick={() => setSelectedProductDetail(null)} className="bg-black/40 text-white p-2 rounded-full"><ArrowLeft/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <div className="h-[50vh] bg-gray-200 relative">
                            <img src={selectedProductDetail.images?.[currentImageIndex] || selectedProductDetail.image_url} className="w-full h-full object-cover"/>
                            {selectedProductDetail.images?.length > 1 && (
                                <div className="absolute bottom-4 left-0 w-full flex justify-center gap-1">
                                    {selectedProductDetail.images.map((_:any, i:number) => <div key={i} className={`w-2 h-2 rounded-full ${i === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}/>)}
                                </div>
                            )}
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between items-start">
                                <h1 className="text-2xl font-bold dark:text-white">{selectedProductDetail.name}</h1>
                                <p className="text-2xl font-bold text-orange-500">{selectedProductDetail.price} DH</p>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 mt-4">{selectedProductDetail.description}</p>
                            
                            {selectedProductDetail.sizes?.length > 0 && (
                                <div className="mt-6">
                                    <p className="font-bold mb-2 dark:text-white">{t('selectSize')}</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {selectedProductDetail.sizes.map((s: string) => (
                                            <button key={s} onClick={() => setSelectedSize(s)} className={`px-4 py-2 border rounded-full ${selectedSize === s ? 'bg-orange-500 text-white border-orange-500' : 'dark:text-white dark:border-gray-600'}`}>{s}</button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button 
                                onClick={() => { addToCartInternal(selectedProductDetail, selectedSize); setSelectedProductDetail(null); }} 
                                disabled={selectedProductDetail.sizes?.length > 0 && !selectedSize}
                                className="w-full mt-8 bg-orange-500 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50"
                            >
                                {t('addToCart')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Store;
