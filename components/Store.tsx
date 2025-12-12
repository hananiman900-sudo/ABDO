
import React, { useState, useEffect, useRef } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { Product, CartItem, AuthenticatedUser, AdRequest, Order, ProductReview } from '../types';
import { supabase } from '../services/supabaseClient';
import { ShoppingBag, ShoppingCart, X, Check, Loader2, ArrowLeft, Truck, Star, Heart, Send, Settings, Image as ImageIcon, Plus, List, ChevronLeft, ChevronRight, MessageSquare, ListChecks, Hash, User } from 'lucide-react';

interface StoreProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: AuthenticatedUser | null;
    onOpenAuth: () => void;
    onGoToProfile: () => void;
    notify: (msg: string, type: 'success' | 'error') => void;
}

const Store: React.FC<StoreProps> = ({ isOpen, onClose, currentUser, onOpenAuth, onGoToProfile, notify }) => {
    const { t } = useLocalization();
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [view, setView] = useState<'catalog' | 'cart' | 'admin' | 'my_orders'>('catalog');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showWelcome, setShowWelcome] = useState(true);
    const [adRequests, setAdRequests] = useState<AdRequest[]>([]);
    const [myOrders, setMyOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Filtering State
    const [activeCategory, setActiveCategory] = useState<string>('category_all');

    // Reviews State
    const [reviews, setReviews] = useState<ProductReview[]>([]);
    const [newReview, setNewReview] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);
    
    // Image Slider State
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    
    // Size Selection State
    const [selectedSize, setSelectedSize] = useState<string>('');

    // Categories
    const categories = ['category_all', 'category_clothes', 'category_electronics', 'category_accessories', 'category_home', 'category_beauty'];

    const isAdmin = currentUser?.phone === '0617774846' && currentUser?.accountType === 'PROVIDER';

    // --- FIX 1: DYNAMIC CART KEY BASED ON USER ID ---
    const getCartKey = () => {
        if (currentUser) return `tanger_cart_${currentUser.id}`;
        return 'tanger_cart_guest';
    };

    useEffect(() => {
        if(isOpen) fetchProducts();
    }, [isOpen]);

    // LOAD CART
    useEffect(() => {
        const key = getCartKey();
        const savedCart = localStorage.getItem(key);
        
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (e) {
                setCart([]);
            }
        } else {
            // Important: If switching users, and new user has no cart, clear the state
            setCart([]);
        }
    }, [currentUser]); // Re-run when currentUser changes

    // SAVE CART
    useEffect(() => {
        const key = getCartKey();
        localStorage.setItem(key, JSON.stringify(cart));
    }, [cart, currentUser]);

    const fetchProducts = async () => {
        const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        setProducts(data || []);
    };

    const fetchAdRequests = async () => {
        const { data } = await supabase.from('provider_ad_requests').select('*, providers(name, phone)').order('created_at', { ascending: false });
        setAdRequests(data as any || []);
    }
    
    const fetchMyOrders = async () => {
        if(!currentUser) return;
        setLoading(true);
        const { data } = await supabase.from('orders').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
        setMyOrders(data as any || []);
        setLoading(false);
    }
    
    const fetchReviews = async (productId: number) => {
        const { data } = await supabase.from('product_reviews').select('*').eq('product_id', productId).order('created_at', { ascending: true });
        setReviews(data || []);
    }

    const handleApproveAd = async (req: AdRequest) => {
        await supabase.from('system_announcements').insert({ title: req.providers?.name || 'Offer', message: req.message, image_url: req.image_url, is_active: true });
        await supabase.from('provider_ad_requests').update({ status: 'approved' }).eq('id', req.id);
        fetchAdRequests();
    }

    const handleCheckout = async () => {
        if(!currentUser) { onOpenAuth(); return; }
        setLoading(true);
        
        const { error } = await supabase.from('orders').insert({
            user_id: currentUser.id,
            user_type: currentUser.accountType,
            total_amount: cart.reduce((a,b) => a + b.price * b.quantity, 0),
            items: cart,
            status: 'pending',
            customer_details: { 
                name: currentUser.name, 
                phone: currentUser.phone 
            }
        });

        if (!error) {
            setCart([]);
            localStorage.removeItem(getCartKey()); // Clear correct key
            notify(t('orderPlaced'), 'success');
            setView('catalog');
        } else {
            notify(t('errorMessage'), 'error');
        }
        setLoading(false);
    }

    const addToCart = (p: Product) => {
        if (p.sizes && p.sizes.length > 0 && !selectedSize) {
            notify(t('selectSize'), 'error');
            return;
        }

        setCart(prev => {
            const ex = prev.find(i => i.id === p.id && i.selectedSize === selectedSize);
            if(ex) return prev.map(i => (i.id === p.id && i.selectedSize === selectedSize) ? {...i, quantity: i.quantity + 1} : i);
            return [...prev, {...p, quantity: 1, selectedSize: selectedSize || undefined}];
        });
        notify(t('addToCart'), 'success');
    }

    const handleSubmitReview = async () => {
        if(!currentUser) {
            onOpenAuth();
            return;
        }
        if(!selectedProduct || !newReview.trim()) return;
        setReviewLoading(true);
        
        const { error } = await supabase.from('product_reviews').insert({
            product_id: selectedProduct.id,
            user_name: currentUser.name,
            comment: newReview
        });

        if (error) {
            notify("خطأ في حفظ التعليق. تأكد من إعداد قاعدة البيانات (V28)", 'error');
        } else {
            setNewReview('');
            fetchReviews(selectedProduct.id);
        }
        setReviewLoading(false);
    }
    
    const filteredProducts = activeCategory === 'category_all' 
        ? products 
        : products.filter(p => p.category === activeCategory);

    const getImages = (p: Product) => {
        if(p.images && p.images.length > 0) return [p.image_url, ...p.images].filter(Boolean);
        return [p.image_url];
    }
    
    const sliderImages = selectedProduct ? getImages(selectedProduct) : [];
    
    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % sliderImages.length);
    }
    
    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + sliderImages.length) % sliderImages.length);
    }

    const openProduct = (p: Product) => {
        setSelectedProduct(p);
        setCurrentImageIndex(0);
        setSelectedSize('');
        fetchReviews(p.id);
    }

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0 md:p-4">
            <div className="bg-gray-100 w-full h-full md:rounded-3xl flex flex-col overflow-hidden relative">
                
                <div className="bg-white p-3 flex justify-between items-center shadow-sm z-10 border-b">
                    <button onClick={onClose} className="p-2"><ArrowLeft/></button>
                    <h2 className="font-bold text-lg text-orange-600">{view === 'admin' ? t('adminPanel') : (view === 'my_orders' ? t('myOrders') : t('shop'))}</h2>
                    <div className="flex items-center gap-2">
                        {currentUser && (
                            <button 
                                onClick={() => { setView('my_orders'); fetchMyOrders(); }} 
                                className="p-2 bg-gray-100 rounded-full text-gray-700 relative hover:bg-gray-200"
                            >
                                <ListChecks size={20}/>
                            </button>
                        )}
                        {isAdmin && <button onClick={() => { setView('admin'); fetchAdRequests(); }} className="p-2"><Settings/></button>}
                        <button onClick={() => setView('cart')} className="p-2 bg-black text-white rounded-full relative">
                            <ShoppingBag size={20}/> 
                            {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border border-white font-bold">{cart.length}</span>}
                        </button>
                        {currentUser && (
                            <button onClick={onGoToProfile} className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 ml-1">
                                <img src={currentUser.profile_image_url || `https://ui-avatars.com/api/?name=${currentUser.name}`} className="w-full h-full object-cover"/>
                            </button>
                        )}
                    </div>
                </div>

                {view === 'catalog' && (
                    <div className="bg-white border-b overflow-x-auto whitespace-nowrap p-2 flex gap-2 no-scrollbar shadow-sm z-10">
                         {categories.map(c => (
                             <button 
                                key={c} 
                                onClick={() => setActiveCategory(c)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${activeCategory === c ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                            >
                                {t(c)}
                             </button>
                         ))}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto bg-gray-50">
                    {view === 'admin' ? (
                        <div className="p-4 space-y-4">
                            <h3 className="font-bold">{t('adRequests')}</h3>
                            {adRequests.map(r => (
                                <div key={r.id} className="bg-white p-3 rounded-xl shadow-sm border">
                                    <div className="flex gap-3">
                                        <img src={r.image_url} className="w-16 h-16 rounded object-cover bg-gray-200"/>
                                        <div>
                                            <p className="font-bold text-sm">{r.providers?.name}</p>
                                            <p className="text-xs text-gray-500">{r.message}</p>
                                            <div className="flex gap-2 mt-2">
                                                {r.status === 'pending' && <button onClick={() => handleApproveAd(r)} className="bg-green-500 text-white px-3 py-1 rounded text-xs">Approve</button>}
                                                <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs uppercase">{r.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button className="w-full py-3 bg-black text-white rounded-lg font-bold flex items-center justify-center gap-2"><Plus/> {t('addProduct')}</button>
                        </div>
                    ) : view === 'cart' ? (
                        <div className="p-4 bg-white m-4 rounded-xl shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg">{t('checkout')}</h3>
                                <button onClick={() => setView('catalog')}><X/></button>
                            </div>
                            {cart.length === 0 ? <p className="text-center text-gray-500 py-6">{t('cartEmpty')}</p> : (
                                <>
                                    {cart.map(i => (
                                        <div key={`${i.id}-${i.selectedSize}`} className="flex justify-between border-b py-2">
                                            <span className="text-sm">{i.name} {i.selectedSize && `(${i.selectedSize})`} x{i.quantity}</span>
                                            <span className="font-bold">{i.price * i.quantity} DH</span>
                                        </div>
                                    ))}
                                    <div className="py-4 font-black text-xl flex justify-between">
                                        <span>{t('total')}</span>
                                        <span>{cart.reduce((a,b)=>a+b.price*b.quantity,0)} DH</span>
                                    </div>
                                    <div className="p-3 bg-yellow-50 text-xs text-yellow-700 rounded-lg mb-4">
                                        ℹ️ {t('storeWelcomeMsg')}
                                    </div>
                                    <button onClick={handleCheckout} className="w-full bg-green-600 text-white py-3 rounded-full font-bold shadow-lg">{loading ? <Loader2 className="animate-spin mx-auto"/> : t('checkout')}</button>
                                </>
                            )}
                        </div>
                    ) : view === 'my_orders' ? (
                        <div className="p-4 space-y-3">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold flex items-center gap-2"><ListChecks className="text-orange-600"/> {t('myOrders')}</h3>
                                <button onClick={() => setView('catalog')}><X/></button>
                            </div>
                            {loading && <div className="text-center py-10"><Loader2 className="animate-spin mx-auto"/></div>}
                            {myOrders.length === 0 && !loading && <p className="text-center text-gray-500">{t('noNotifications')}</p>}
                            {myOrders.map(o => (
                                <div key={o.id} className="bg-white p-4 rounded-xl border shadow-sm">
                                    <div className="flex justify-between mb-2">
                                        <span className="font-bold">Order #{o.id}</span>
                                        <span className={`text-xs px-2 py-1 rounded-full ${o.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {o.status === 'pending' ? 'في الانتظار' : (o.status === 'delivered' ? 'تم التسليم' : o.status)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600">{new Date(o.created_at).toLocaleDateString()}</p>
                                    <p className="font-bold text-orange-600 mt-1">{o.total_amount} DH</p>
                                    <div className="mt-2 text-xs text-gray-500">
                                        {o.items.map((i: any) => `${i.name} ${i.selectedSize ? `(${i.selectedSize})` : ''} (x${i.quantity})`).join(', ')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-1 p-1 pb-20">
                             {filteredProducts.map(p => (
                                 <div key={p.id} onClick={() => openProduct(p)} className="bg-white p-2 flex flex-col gap-1 cursor-pointer hover:shadow-md transition-shadow">
                                     <div className="aspect-[4/5] bg-gray-100 relative mb-1 overflow-hidden rounded-sm">
                                         <img src={p.image_url} className="w-full h-full object-cover"/>
                                     </div>
                                     <h3 className="text-xs line-clamp-1 text-gray-700">{p.name}</h3>
                                     <div className="flex items-baseline gap-1">
                                         <span className="text-orange-600 font-black text-lg">{p.price}<span className="text-xs">DH</span></span>
                                         <span className="text-gray-400 text-[10px] line-through">{(p.price * 1.5).toFixed(0)}</span>
                                     </div>
                                     <div className="flex items-center gap-1">
                                         <Star size={8} className="fill-yellow-400 text-yellow-400"/>
                                         <span className="text-[10px] text-gray-400">4.9</span>
                                     </div>
                                     <button 
                                        onClick={(e) => { e.stopPropagation(); openProduct(p); }} 
                                        className="w-full mt-1 bg-green-500 text-white text-[10px] rounded-full py-1 font-bold shadow-sm"
                                     >
                                         {t('addToCart')}
                                     </button>
                                 </div>
                             ))}
                             {filteredProducts.length === 0 && <p className="col-span-2 text-center py-10 text-gray-400">{t('loading')}</p>}
                        </div>
                    )}
                </div>

                {/* --- PRODUCT DETAIL FULL SCREEN --- */}
                {selectedProduct && (
                    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-slide-up">
                        <div className="bg-white border-b p-3 flex justify-between items-center shadow-sm z-10">
                            <button onClick={() => setSelectedProduct(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                                <ArrowLeft size={20}/>
                            </button>
                            <h3 className="font-bold text-sm truncate max-w-[200px]">{selectedProduct.name}</h3>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setView('cart')} className="p-2 bg-black text-white rounded-full relative">
                                    <ShoppingCart size={18}/>
                                    {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{cart.length}</span>}
                                </button>
                                {currentUser && (
                                    <button onClick={onGoToProfile} className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                                        <img src={currentUser.profile_image_url || `https://ui-avatars.com/api/?name=${currentUser.name}`} className="w-full h-full object-cover"/>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-gray-50 pb-20">
                            <div className="relative bg-white aspect-square w-full">
                                <img src={sliderImages[currentImageIndex]} className="w-full h-full object-contain"/>
                                {sliderImages.length > 1 && (
                                    <>
                                        <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/20 text-white rounded-full"><ChevronLeft/></button>
                                        <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/20 text-white rounded-full"><ChevronRight/></button>
                                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1">
                                            {sliderImages.map((_, idx) => (
                                                <div key={idx} className={`w-2 h-2 rounded-full shadow-sm ${idx === currentImageIndex ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="p-4 bg-white mb-2 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="text-3xl font-black text-orange-600">{selectedProduct.price} <span className="text-sm text-gray-500 font-normal">DH</span></div>
                                    <button className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-red-500"><Heart/></button>
                                </div>
                                <h1 className="text-lg font-bold text-gray-900 leading-tight mb-4">{selectedProduct.name}</h1>
                                
                                {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                                    <div className="mb-4">
                                        <h4 className="font-bold text-sm mb-2">{t('selectSize')}</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedProduct.sizes.map(size => (
                                                <button
                                                    key={size}
                                                    onClick={() => setSelectedSize(size)}
                                                    className={`px-4 py-2 border rounded-lg text-sm font-bold transition-all ${selectedSize === size ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-300 hover:border-black'}`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="p-3 bg-orange-50 rounded-xl mb-4 border border-orange-100 flex items-center gap-3">
                                    <div className="bg-orange-100 p-2 rounded-full text-orange-600"><Truck size={18}/></div>
                                    <div>
                                        <p className="text-xs font-bold text-orange-800">{t('freeDelivery')}</p>
                                        <p className="text-[10px] text-orange-600">{t('storeWelcomeMsg')}</p>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h4 className="font-bold text-sm mb-2 text-gray-900">{t('description')}</h4>
                                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{selectedProduct.description}</p>
                                </div>
                            </div>

                            <div className="p-4 bg-white shadow-sm">
                                <h4 className="font-bold text-sm mb-4 flex items-center gap-2"><MessageSquare size={16} className="text-blue-500"/> {t('reviews')} ({reviews.length})</h4>
                                <div className="flex gap-2 mb-6 items-end bg-gray-50 p-2 rounded-xl border">
                                    <textarea 
                                        value={newReview} 
                                        onChange={e => setNewReview(e.target.value)} 
                                        placeholder={currentUser ? t('writeComment') : t('loginRequired')}
                                        className="flex-1 bg-transparent text-sm outline-none resize-none h-10 py-2"
                                        disabled={!currentUser}
                                    />
                                    <button onClick={handleSubmitReview} disabled={reviewLoading || !currentUser} className="bg-blue-600 text-white p-2 rounded-lg shadow-sm disabled:opacity-50">
                                        {reviewLoading ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>}
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {reviews.map((rev, index) => (
                                        <div key={rev.id} className="flex gap-3 items-start border-b pb-3 last:border-0">
                                            <div className="bg-gray-200 text-gray-600 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                                                #{index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-bold text-xs text-gray-900">{rev.user_name}</span>
                                                    <span className="text-[10px] text-gray-400">{new Date(rev.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded-lg rounded-tl-none">{rev.comment}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {reviews.length === 0 && <p className="text-center text-gray-400 text-xs italic py-4">No reviews yet.</p>}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-white border-t safe-area-bottom shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)]">
                             <button onClick={() => addToCart(selectedProduct)} className="w-full py-4 bg-green-600 text-white rounded-full font-bold shadow-lg flex justify-center items-center gap-2 active:scale-95 transition-transform text-lg">
                                 <ShoppingBag size={20}/> {t('addToCart')}
                             </button>
                        </div>
                    </div>
                )}

                {showWelcome && view === 'catalog' && (
                    <div className="absolute inset-0 z-30 bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm">
                        <div className="bg-white p-6 rounded-3xl max-w-xs text-center relative animate-fade-in">
                            <button onClick={() => setShowWelcome(false)} className="absolute top-2 right-2"><X/></button>
                            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3"><Truck className="text-orange-500"/></div>
                            <h3 className="font-bold text-xl mb-2">{t('storeWelcomeTitle')}</h3>
                            <p className="text-gray-600 mb-6 text-sm">{currentUser ? t('welcomeBackMessage').replace('{name}', currentUser.name) : ''} {t('storeWelcomeMsg')}</p>
                            <button onClick={() => setShowWelcome(false)} className="w-full bg-orange-600 text-white py-3 rounded-full font-bold shadow-lg">{t('shopNow')}</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Store;
