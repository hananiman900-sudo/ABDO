
import React, { useState, useEffect, useRef } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { Product, CartItem, AuthenticatedUser, Order, SystemAnnouncement, Category, AdRequest } from '../types';
import { supabase } from '../services/supabaseClient';
import { ShoppingBag, ShoppingCart, Plus, Minus, X, CheckCircle, Loader2, Package, Search, History, Trash, Settings, List, Save, User, Phone, Edit, MessageSquare, Image as ImageIcon, ArrowLeft, Truck, Clock, Star, Send, Filter, ChevronLeft, ChevronRight, FolderPlus, LogIn, Shirt, Scissors, Maximize2, ChevronUp, ChevronDown, Camera, Video, Upload, Wand2, ScanFace, Check, Eye, Heart } from 'lucide-react';

interface StoreProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: AuthenticatedUser | null;
    onOpenAuth: () => void;
}

const Store: React.FC<StoreProps> = ({ isOpen, onClose, currentUser, onOpenAuth }) => {
    const { t, language } = useLocalization();
    const [products, setProducts] = useState<any[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [view, setView] = useState<'catalog' | 'cart' | 'orders' | 'admin'>('catalog');
    const [isLoading, setIsLoading] = useState(false);
    const [showWelcome, setShowWelcome] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    
    // Admin State
    const [adminTab, setAdminTab] = useState<'products' | 'orders' | 'ads' | 'requests'>('products');
    const [adRequests, setAdRequests] = useState<AdRequest[]>([]);
    
    // Product Editing
    const [newProduct, setNewProduct] = useState({ id: 0, name: '', description: '', price: '', category: 'General', image_url: '', images: [] as string[], sizes: '' });

    const isAdmin = currentUser?.phone === '0617774846' && currentUser?.accountType === 'PROVIDER';

    const categories = ['ALL', 'category_clothes', 'category_electronics', 'category_accessories', 'category_home', 'category_beauty'];

    useEffect(() => {
        if (isOpen) {
            fetchProducts();
            if (currentUser) {
                const saved = localStorage.getItem(`cart_${currentUser.id}`);
                if(saved) setCart(JSON.parse(saved));
            }
        }
    }, [isOpen, currentUser]);

    useEffect(() => {
         if(currentUser) localStorage.setItem(`cart_${currentUser.id}`, JSON.stringify(cart));
    }, [cart, currentUser]);

    const fetchProducts = async () => {
        setIsLoading(true);
        const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        setProducts(data || []);
        setIsLoading(false);
    };

    const fetchAdRequests = async () => {
        const { data } = await supabase.from('provider_ad_requests').select('*, providers(name, phone)').order('created_at', { ascending: false });
        setAdRequests(data as any || []); // Cast for join
    }

    const handleApproveAd = async (req: AdRequest) => {
        // 1. Create System Announcement
        await supabase.from('system_announcements').insert({
            title: req.providers?.name || 'Partner Offer',
            message: req.message,
            image_url: req.image_url,
            is_active: true
        });
        // 2. Update Request Status
        await supabase.from('provider_ad_requests').update({ status: 'approved' }).eq('id', req.id);
        fetchAdRequests();
    }

    const handleCheckout = async () => {
        if (!currentUser) { onOpenAuth(); return; }
        if (cart.length === 0) return;
        setIsLoading(true);
        const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        
        // Checkout only Name and Phone
        await supabase.from('orders').insert({
            user_id: currentUser.id,
            user_type: currentUser.accountType,
            total_amount: total,
            items: cart,
            status: 'pending',
            customer_details: { name: currentUser.name, phone: currentUser.phone || 'N/A' } 
        });
        
        setCart([]);
        alert(t('orderPlaced'));
        setIsLoading(false);
    };

    const addToCart = (p: Product) => {
        setCart(prev => {
            const exists = prev.find(i => i.id === p.id);
            if(exists) return prev.map(i => i.id === p.id ? {...i, quantity: i.quantity + 1} : i);
            return [...prev, {...p, quantity: 1}];
        });
        // Close detail view if open
        if(selectedProduct) setSelectedProduct(null);
    }

    const filteredProducts = selectedCategory === 'ALL' ? products : products.filter(p => p.category === selectedCategory);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-fade-in p-0 md:p-4">
            <div className="bg-gray-100 dark:bg-gray-900 w-full h-full md:rounded-3xl overflow-hidden flex flex-col relative">
                
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 p-4 flex justify-between items-center shadow-sm z-10">
                    <button onClick={onClose}><ArrowLeft/></button>
                    <h2 className="font-bold text-xl">{view === 'admin' ? 'Admin Panel' : t('shop')}</h2>
                    <div className="flex gap-3">
                        {isAdmin && <button onClick={() => setView('admin')}><Settings/></button>}
                        <button onClick={() => setView('cart')} className="relative">
                            <ShoppingCart/>
                            {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{cart.length}</span>}
                        </button>
                    </div>
                </div>

                {/* Categories Bar */}
                {view === 'catalog' && (
                    <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-2 overflow-x-auto no-scrollbar flex gap-2">
                        {categories.map(cat => (
                            <button 
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border ${selectedCategory === cat ? 'bg-black text-white dark:bg-white dark:text-black border-transparent' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-transparent'}`}
                            >
                                {cat === 'ALL' ? t('filterAll') : t(cat)}
                            </button>
                        ))}
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900">
                    {view === 'admin' ? (
                        <div className="space-y-4 p-2">
                             <div className="flex gap-2 overflow-x-auto pb-2">
                                 <button onClick={() => setAdminTab('products')} className={`px-4 py-2 rounded-full font-bold whitespace-nowrap ${adminTab === 'products' ? 'bg-black text-white' : 'bg-white'}`}>Products</button>
                                 <button onClick={() => { setAdminTab('requests'); fetchAdRequests(); }} className={`px-4 py-2 rounded-full font-bold whitespace-nowrap ${adminTab === 'requests' ? 'bg-black text-white' : 'bg-white'}`}>Ad Requests</button>
                             </div>
                             
                             {adminTab === 'requests' && (
                                 <div className="space-y-4">
                                     {adRequests.length === 0 && <p className="text-gray-400 text-center">No pending requests</p>}
                                     {adRequests.map(r => (
                                         <div key={r.id} className="bg-white p-4 rounded-xl shadow-sm">
                                             <div className="flex gap-3">
                                                 <img src={r.image_url} className="w-16 h-16 rounded object-cover bg-gray-200"/>
                                                 <div>
                                                     <p className="font-bold">{r.providers?.name} ({r.providers?.phone})</p>
                                                     <p className="text-sm text-gray-600">{r.message}</p>
                                                     <span className={`text-xs px-2 py-0.5 rounded ${r.status === 'pending' ? 'bg-yellow-100' : 'bg-green-100'}`}>{r.status}</span>
                                                 </div>
                                             </div>
                                             {r.status === 'pending' && (
                                                 <button onClick={() => handleApproveAd(r)} className="mt-3 w-full bg-green-500 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2"><Check size={16}/> Approve & Publish</button>
                                             )}
                                         </div>
                                     ))}
                                 </div>
                             )}
                        </div>
                    ) : view === 'cart' ? (
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm m-2">
                             <h3 className="font-bold text-xl mb-4 text-center">{t('checkout')}</h3>
                             {cart.length === 0 ? <p className="text-gray-400 text-center py-10">{t('cartEmpty')}</p> : (
                                 <div className="space-y-4">
                                     {cart.map(i => (
                                         <div key={i.id} className="flex justify-between items-center border-b pb-2">
                                             <div className="flex gap-3 items-center">
                                                 <img src={i.image_url} className="w-12 h-12 rounded bg-gray-100 object-cover"/>
                                                 <div><p className="font-bold text-sm">{i.name}</p><p className="text-xs text-gray-500">{i.quantity} x {i.price} {t('priceDH')}</p></div>
                                             </div>
                                             <p className="font-bold">{i.quantity * i.price} {t('priceDH')}</p>
                                         </div>
                                     ))}
                                     <div className="pt-4 border-t flex justify-between text-xl font-black">
                                         <span>{t('total')}</span>
                                         <span>{cart.reduce((a, b) => a + b.price * b.quantity, 0)} {t('priceDH')}</span>
                                     </div>
                                     <button onClick={handleCheckout} className="w-full bg-orange-500 text-white py-4 rounded-full font-bold mt-4 shadow-lg shadow-orange-500/30 text-lg">
                                         {isLoading ? <Loader2 className="animate-spin mx-auto"/> : t('checkout')}
                                     </button>
                                 </div>
                             )}
                        </div>
                    ) : (
                        /* CATALOG GRID (Temu Style) */
                        <div className="grid grid-cols-2 gap-2 pb-20">
                            {filteredProducts.map(p => (
                                <div key={p.id} onClick={() => setSelectedProduct(p)} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                                    <div className="aspect-[4/5] bg-gray-200 dark:bg-gray-700 relative">
                                        <img src={p.image_url} className="w-full h-full object-cover"/>
                                        {/* Flash Sale Tag */}
                                        <div className="absolute bottom-0 left-0 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-tr-lg">Flash Sale</div>
                                    </div>
                                    <div className="p-2">
                                        <h3 className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 h-8 mb-1 leading-tight">{p.name}</h3>
                                        <div className="flex items-baseline gap-1">
                                            <p className="text-orange-600 font-black text-lg">{p.price}<span className="text-xs font-normal">dh</span></p>
                                            <p className="text-[10px] text-gray-400 line-through">{(p.price * 1.3).toFixed(0)}</p>
                                        </div>
                                        <div className="flex items-center gap-1 mt-1">
                                            <Star size={10} className="fill-yellow-400 text-yellow-400"/>
                                            <span className="text-[10px] text-gray-500">4.8 (100+)</span>
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); addToCart(p); }} 
                                            className="w-full mt-2 bg-white border border-orange-500 text-orange-500 hover:bg-orange-50 py-1.5 rounded-full text-[10px] font-bold flex items-center justify-center gap-1"
                                        >
                                            <ShoppingCart size={12}/> {t('addToCart')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Welcome Modal */}
                {showWelcome && view === 'catalog' && (
                    <div className="absolute inset-0 z-30 bg-black/80 flex items-center justify-center p-6 animate-fade-in backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl max-w-sm text-center shadow-2xl relative">
                            <button onClick={() => setShowWelcome(false)} className="absolute top-2 right-2 p-2"><X/></button>
                            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Truck size={40} className="text-orange-500"/>
                            </div>
                            <h3 className="font-bold text-2xl mb-2 dark:text-white">{t('storeWelcomeTitle')}</h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-6 font-medium">{currentUser ? `${t('welcomeBackMessage').replace('{name}', currentUser.name)}` : ''} {t('storeWelcomeMsg')}</p>
                            <button onClick={() => setShowWelcome(false)} className="w-full bg-orange-500 text-white px-8 py-3.5 rounded-full font-bold shadow-lg hover:scale-105 transition-transform text-lg">{t('shopNow')}</button>
                        </div>
                    </div>
                )}

                {/* PRODUCT DETAIL FULL SCREEN (Temu Style) */}
                {selectedProduct && (
                    <div className="absolute inset-0 z-40 bg-white dark:bg-gray-900 flex flex-col animate-slide-up">
                        {/* Detail Header */}
                        <div className="absolute top-0 w-full p-4 flex justify-between z-10 bg-gradient-to-b from-black/50 to-transparent">
                            <button onClick={() => setSelectedProduct(null)} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white"><ArrowLeft/></button>
                            <button className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white"><ShoppingBag/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto pb-24">
                            {/* Main Image */}
                            <div className="h-[50vh] bg-gray-200 dark:bg-gray-800 relative">
                                <img src={selectedProduct.image_url} className="w-full h-full object-cover"/>
                            </div>

                            {/* Info */}
                            <div className="p-4 -mt-6 bg-white dark:bg-gray-900 rounded-t-3xl relative">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="text-3xl font-black text-orange-600">{selectedProduct.price} <span className="text-sm">DH</span></div>
                                    <div className="flex gap-1">
                                        <button className="p-2 bg-gray-100 rounded-full"><Heart size={20}/></button>
                                        <button className="p-2 bg-gray-100 rounded-full"><Send size={20}/></button>
                                    </div>
                                </div>
                                <h1 className="text-lg font-medium text-gray-800 dark:text-white mb-4 leading-snug">{selectedProduct.name}</h1>
                                
                                <div className="p-3 bg-orange-50 rounded-xl mb-4 border border-orange-100">
                                    <p className="text-xs font-bold text-orange-700 flex items-center gap-2"><Truck size={14}/> {t('freeDelivery')}</p>
                                    <p className="text-[10px] text-orange-600 mt-1">{t('storeWelcomeMsg')}</p>
                                </div>

                                {/* Sizes */}
                                {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="font-bold text-sm mb-2">{t('sizes')}</h4>
                                        <div className="flex gap-2 flex-wrap">
                                            {selectedProduct.sizes.map((s: string) => (
                                                <button key={s} className="px-4 py-2 border rounded-lg text-sm font-bold hover:border-black dark:hover:border-white transition-colors">
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h4 className="font-bold text-sm mb-2">{t('description')}</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{selectedProduct.description}</p>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Action Bar */}
                        <div className="absolute bottom-0 w-full p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 flex gap-3">
                            <button onClick={() => setSelectedProduct(null)} className="flex-1 py-3 rounded-full font-bold border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white">Chat</button>
                            <button onClick={() => addToCart(selectedProduct)} className="flex-[2] py-3 bg-orange-500 text-white rounded-full font-bold shadow-lg shadow-orange-500/30 text-lg">
                                {t('addToCart')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Store;
