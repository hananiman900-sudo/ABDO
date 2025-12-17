
import React, { useState, useEffect, useRef } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { Product, CartItem, AuthenticatedUser, AdRequest, Order, ProductReview } from '../types';
import { supabase } from '../services/supabaseClient';
import { ShoppingBag, ShoppingCart, X, Check, Loader2, ArrowLeft, Truck, Star, Heart, Send, Settings, Image as ImageIcon, Plus, List, ChevronLeft, ChevronRight, MessageSquare, ListChecks, Hash, User, Globe, Search, Tag, CheckCircle, Gem } from 'lucide-react';

interface StoreProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: AuthenticatedUser | null;
    onOpenAuth: () => void;
    onGoToProfile: () => void;
    notify: (msg: string, type: 'success' | 'error') => void;
    initialProduct?: Product | null; 
}

const StoreHeaderBanner = ({ 
    onClose, 
    cartCount, 
    onOpenCart, 
    onOpenOrders, 
    onOpenAdmin,
    onProfile, 
    currentUser, 
    isAdmin 
}: any) => {
    const [typedText, setTypedText] = useState('');
    const [isFinished, setIsFinished] = useState(false);
    const fullText = "Marhaba bik f l-matjar dyalna... Ahsan l-3orod f Tanja!";

    useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            setTypedText(fullText.slice(0, index));
            index++;
            if (index > fullText.length) {
                clearInterval(interval);
                setIsFinished(true);
            }
        }, 600); // Slightly slower typing for clarity on white background
        return () => clearInterval(interval);
    }, []);

    return (
        // COMPACT HEADER: Height reduced to h-16 (Temu Style)
        <div className="w-full h-20 shrink-0 bg-white border-b border-gray-100 sticky top-0 z-40 px-3 flex flex-col justify-center gap-1 shadow-sm">
            <div className="flex justify-between items-center">
                {/* Left Side: Back & Branding */}
                <div className="flex items-center gap-2.5">
                    <button onClick={onClose} className="w-9 h-9 bg-gray-50 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-all border border-gray-100">
                        <ArrowLeft size={20}/>
                    </button>
                    <div className="flex flex-col leading-none">
                        <div className="flex items-center gap-1">
                            <span className={`font-black text-sm tracking-tight uppercase transition-all duration-700 ${isFinished ? 'text-orange-600' : 'text-gray-900'}`}>
                                Tanger Store
                            </span>
                            {isFinished && <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse shadow-[0_0_5px_orange]"></div>}
                        </div>
                        {/* Compact Typing Text */}
                        <div className="h-3">
                            <p className="text-[9px] text-gray-400 font-bold italic truncate max-w-[140px]">
                                {typedText}
                                <span className={`inline-block w-0.5 h-2.5 bg-orange-500 ml-0.5 ${isFinished ? 'hidden' : 'animate-pulse'}`}></span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Tools & Profile */}
                <div className="flex items-center gap-1.5">
                    {currentUser && (
                        <button onClick={onOpenOrders} className="w-9 h-9 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 border border-gray-100">
                            <ListChecks size={18}/>
                        </button>
                    )}
                    {isAdmin && (
                        <button onClick={onOpenAdmin} className="w-9 h-9 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                            <Settings size={18}/>
                        </button>
                    )}
                    <button onClick={onOpenCart} className="w-9 h-9 bg-orange-600 text-white rounded-full flex items-center justify-center relative shadow-lg hover:scale-105 transition-transform">
                        <ShoppingCart size={18}/>
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white font-black">
                                {cartCount}
                            </span>
                        )}
                    </button>
                    {currentUser && (
                        <button onClick={onProfile} className="w-9 h-9 rounded-full overflow-hidden border-2 border-gray-50 shadow-sm hover:ring-2 hover:ring-orange-100 transition-all">
                            <img src={currentUser.profile_image_url || `https://ui-avatars.com/api/?name=${currentUser.name}`} className="w-full h-full object-cover"/>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const Store: React.FC<StoreProps> = ({ isOpen, onClose, currentUser, onOpenAuth, onGoToProfile, notify, initialProduct }) => {
    const { t } = useLocalization();
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [view, setView] = useState<'catalog' | 'cart' | 'admin' | 'my_orders'>('catalog');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(initialProduct || null); 
    const [showWelcome, setShowWelcome] = useState(!initialProduct); 
    const [adRequests, setAdRequests] = useState<AdRequest[]>([]);
    const [myOrders, setMyOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Filtering State
    const [activeCategory, setActiveCategory] = useState<string>('category_all');
    const [searchTerm, setSearchTerm] = useState('');

    // Reviews State
    const [reviews, setReviews] = useState<ProductReview[]>([]);
    const [newReview, setNewReview] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);
    
    // Image Slider State
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    
    // Size Selection State
    const [selectedSize, setSelectedSize] = useState<string>('');

    // --- PROMO CODE STATE ---
    const [promoCode, setPromoCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState<{code: string, rate: number, partnerId: number} | null>(null);
    const [promoLoading, setPromoLoading] = useState(false);
    
    // --- AFFILIATE CHECK STATE ---
    const [isApprovedAffiliate, setIsApprovedAffiliate] = useState(false);

    // Categories
    const categories = ['category_all', 'category_clothes', 'category_electronics', 'category_accessories', 'category_home', 'category_beauty'];

    const isAdmin = currentUser?.phone === '0617774846' && currentUser?.accountType === 'PROVIDER';

    // --- STRICT CART KEY LOGIC ---
    const getCartKey = () => {
        if (currentUser) return `tanger_cart_${currentUser.id}`;
        return 'tanger_cart_guest';
    };

    useEffect(() => {
        if(isOpen) fetchProducts();
    }, [isOpen]);

    // Check Affiliate Status
    useEffect(() => {
        const checkAffiliateStatus = async () => {
            if (currentUser) {
                const { data } = await supabase
                    .from('affiliate_partners')
                    .select('status')
                    .eq('user_id', currentUser.id)
                    .single();
                
                if (data && data.status === 'approved') {
                    setIsApprovedAffiliate(true);
                } else {
                    setIsApprovedAffiliate(false);
                }
            } else {
                setIsApprovedAffiliate(false);
            }
        };
        checkAffiliateStatus();
    }, [currentUser, isOpen]);

    // Handle Deep Link updates
    useEffect(() => {
        if(initialProduct) {
            setSelectedProduct(initialProduct);
            setShowWelcome(false);
            fetchReviews(initialProduct.id);
        }
    }, [initialProduct]);

    // LOAD CART ON USER CHANGE
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
            setCart([]);
        }
    }, [currentUser?.id]);

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

    const validatePromo = async () => {
        if (!promoCode.trim()) return;
        setPromoLoading(true);
        const { data } = await supabase.from('affiliate_partners').select('*').eq('promo_code', promoCode.toUpperCase()).single();
        
        if (data) {
            if (currentUser && data.user_id === currentUser.id) {
                notify("You cannot use your own promo code!", 'error');
            } else if (data.status !== 'approved') {
                notify("هذا الكود غير مفعل بعد.", 'error');
            } else {
                setAppliedDiscount({ code: data.promo_code, rate: data.discount_rate || 0.10, partnerId: data.id });
                notify(t('codeApplied'), 'success');
            }
        } else {
            notify(t('invalidCode'), 'error');
            setAppliedDiscount(null);
        }
        setPromoLoading(false);
    };

    const handleCheckout = async () => {
        if(!currentUser) { onOpenAuth(); return; }
        setLoading(true);
        
        let finalAmount = 0;
        let originalAmount = 0;
        let totalCommission = 0;

        cart.forEach(item => {
            originalAmount += item.price * item.quantity;
            const itemPrice = appliedDiscount 
                ? (item.discount_price && item.discount_price > 0 ? item.discount_price : Math.round(item.price * (1 - appliedDiscount.rate)))
                : item.price;
            finalAmount += itemPrice * item.quantity;

            if (appliedDiscount) {
                if (item.affiliate_commission && item.affiliate_commission > 0) {
                    totalCommission += (item.affiliate_commission * item.quantity);
                } else {
                    const commissionRate = 0.05; 
                    totalCommission += (itemPrice * item.quantity * commissionRate);
                }
            }
        });

        const discountAmount = originalAmount - finalAmount;

        const { data: orderData, error } = await supabase.from('orders').insert({
            user_id: currentUser.id,
            user_type: currentUser.accountType,
            total_amount: finalAmount,
            items: cart,
            status: 'pending',
            customer_details: { 
                name: currentUser.name, 
                phone: currentUser.phone 
            },
            promo_code: appliedDiscount?.code,
            discount_amount: discountAmount
        }).select().single();

        if (!error && orderData) {
            if (appliedDiscount) {
                totalCommission = Math.round(totalCommission);
                await supabase.from('affiliate_sales').insert({
                    partner_id: appliedDiscount.partnerId,
                    order_id: orderData.id,
                    amount: finalAmount,
                    commission: totalCommission,
                    status: 'pending'
                });
            }

            setCart([]);
            localStorage.removeItem(getCartKey()); 
            setAppliedDiscount(null);
            setPromoCode('');
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
            notify("خطأ في حفظ التعليق.", 'error');
        } else {
            setNewReview('');
            fetchReviews(selectedProduct.id);
        }
        setReviewLoading(false);
    }
    
    const filteredProducts = products.filter(p => {
        const matchesCategory = activeCategory === 'category_all' || p.category === activeCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const getImages = (p: Product) => {
        if(p.images && p.images.length > 0) return [p.image_url, ...p.images].filter(Boolean);
        return [p.image_url];
    }
    
    const sliderImages = selectedProduct ? getImages(selectedProduct) : [];
    const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % sliderImages.length);
    const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + sliderImages.length) % sliderImages.length);

    const openProduct = (p: Product) => {
        setSelectedProduct(p);
        setCurrentImageIndex(0);
        setSelectedSize('');
        fetchReviews(p.id);
    }

    const calculateCartTotal = () => {
        return cart.reduce((total, item) => {
            const price = appliedDiscount 
                ? (item.discount_price && item.discount_price > 0 ? item.discount_price : Math.round(item.price * (1 - appliedDiscount.rate)))
                : item.price;
            return total + (price * item.quantity);
        }, 0);
    };

    // FIX: Define displayPriceForSelectedProduct to resolve the reference error in the product detail view.
    const displayPriceForSelectedProduct = selectedProduct ? (
        appliedDiscount 
            ? (selectedProduct.discount_price && selectedProduct.discount_price > 0 ? selectedProduct.discount_price : Math.round(selectedProduct.price * (1 - appliedDiscount.rate)))
            : selectedProduct.price
    ) : 0;

    const cartTotal = calculateCartTotal();

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0 md:p-4">
            <div className="bg-white w-full h-full md:rounded-3xl flex flex-col overflow-hidden relative">
                
                {view === 'catalog' ? (
                    <StoreHeaderBanner 
                        onClose={onClose}
                        cartCount={cart.length}
                        onOpenCart={() => setView('cart')}
                        onOpenOrders={() => { setView('my_orders'); fetchMyOrders(); }}
                        onOpenAdmin={() => { setView('admin'); fetchAdRequests(); }}
                        onProfile={onGoToProfile}
                        currentUser={currentUser}
                        isAdmin={isAdmin}
                    />
                ) : (
                    <div className="bg-white p-3 flex justify-between items-center shadow-sm z-10 border-b relative">
                        <button onClick={() => setView('catalog')} className="p-2"><ArrowLeft/></button>
                        <h2 className="font-bold text-lg text-orange-600">{view === 'admin' ? t('adminPanel') : (view === 'my_orders' ? t('myOrders') : t('shop'))}</h2>
                        <div className="w-8"></div>
                    </div>
                )}

                <div className="flex-1 flex flex-col overflow-hidden">
                {view === 'catalog' && (
                    <>
                        {/* SEARCH & PROMO: Ultra-compact */}
                        <div className="bg-white p-2 border-b border-gray-50 flex gap-2">
                            <div className="bg-gray-100 rounded-full flex items-center px-4 py-2 transition-all flex-1">
                                <Search size={16} className="text-gray-400"/>
                                <input 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={t('search')} 
                                    className="bg-transparent border-none outline-none flex-1 mx-2 text-xs text-gray-800"
                                />
                            </div>
                            
                            <div className="relative">
                                <div className={`flex items-center bg-gray-100 border ${appliedDiscount ? 'border-green-500 bg-green-50' : 'border-transparent'} rounded-full px-3 py-1 h-full`}>
                                    <Tag size={14} className={appliedDiscount ? "text-green-600" : "text-gray-400"}/>
                                    <input 
                                        value={promoCode}
                                        onChange={e => setPromoCode(e.target.value)}
                                        placeholder="CODE"
                                        className="bg-transparent border-none outline-none w-14 text-center text-[10px] font-bold uppercase mx-1"
                                        disabled={!!appliedDiscount}
                                    />
                                    {appliedDiscount ? (
                                        <button onClick={() => { setAppliedDiscount(null); setPromoCode(''); }} className="bg-red-500 text-white rounded-full p-0.5"><X size={10}/></button>
                                    ) : (
                                        <button onClick={validatePromo} disabled={!promoCode.trim() || promoLoading} className="text-orange-600 font-black text-[10px]">
                                            {promoLoading ? <Loader2 size={10} className="animate-spin"/> : 'OK'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* CATEGORIES: Clean & White */}
                        <div className="bg-white border-b overflow-x-auto whitespace-nowrap px-2 py-2.5 flex gap-2 no-scrollbar z-10 sticky top-0">
                             {categories.map(c => (
                                 <button 
                                    key={c} 
                                    onClick={() => setActiveCategory(c)}
                                    className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all ${activeCategory === c ? 'bg-black text-white' : 'bg-gray-50 text-gray-500 border border-gray-100'}`}
                                >
                                    {t(c)}
                                 </button>
                             ))}
                        </div>
                    </>
                )}

                <div className="flex-1 overflow-y-auto bg-gray-50/50">
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
                        <div className="p-4 bg-white m-4 rounded-xl shadow-sm border">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg">{t('checkout')}</h3>
                                <button onClick={() => setView('catalog')}><X/></button>
                            </div>
                            {cart.length === 0 ? <p className="text-center text-gray-500 py-6">{t('cartEmpty')}</p> : (
                                <>
                                    {cart.map(i => {
                                        const finalItemPrice = appliedDiscount 
                                            ? (i.discount_price && i.discount_price > 0 ? i.discount_price : Math.round(i.price * (1 - appliedDiscount.rate)))
                                            : i.price;
                                        return (
                                            <div key={`${i.id}-${i.selectedSize}`} className="flex justify-between border-b py-2">
                                                <span className="text-sm">{i.name} {i.selectedSize && `(${i.selectedSize})`} x{i.quantity}</span>
                                                <div className="text-right">
                                                    {appliedDiscount && (
                                                        <span className="text-[10px] text-gray-400 line-through mr-1">{i.price * i.quantity}</span>
                                                    )}
                                                    <span className="font-bold">{finalItemPrice * i.quantity} DH</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div className="py-4">
                                        {appliedDiscount && (
                                            <div className="flex justify-between text-sm mb-1 text-green-600 font-bold">
                                                <span>Discount Applied</span>
                                                <span>{appliedDiscount.code}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between font-black text-xl mt-2">
                                            <span>{t('total')}</span>
                                            <span className="text-orange-600">{cartTotal} DH</span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-yellow-50 text-[10px] text-yellow-700 rounded-lg mb-4 leading-tight">
                                        ℹ️ {t('storeWelcomeMsg')}
                                    </div>
                                    <button onClick={handleCheckout} className="w-full bg-green-600 text-white py-4 rounded-full font-black shadow-lg uppercase tracking-wider">{loading ? <Loader2 className="animate-spin mx-auto"/> : t('checkout')}</button>
                                </>
                            )}
                        </div>
                    ) : view === 'my_orders' ? (
                        <div className="p-4 space-y-3">
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
                                    {o.discount_amount && o.discount_amount > 0 ? (
                                        <div className="mt-1">
                                            <span className="line-through text-xs text-gray-400 mr-2">{o.total_amount + o.discount_amount} DH</span>
                                            <span className="font-bold text-orange-600">{o.total_amount} DH</span>
                                            <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded ml-2">Promo Applied</span>
                                        </div>
                                    ) : (
                                        <p className="font-bold text-orange-600 mt-1">{o.total_amount} DH</p>
                                    )}
                                    <div className="mt-2 text-xs text-gray-500">
                                        {o.items.map((i: any) => `${i.name} ${i.selectedSize ? `(${i.selectedSize})` : ''} (x${i.quantity})`).join(', ')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-1.5 p-1.5 pb-24">
                             {filteredProducts.map(p => {
                                 const displayPrice = appliedDiscount 
                                    ? (p.discount_price && p.discount_price > 0 ? p.discount_price : Math.round(p.price * (1 - appliedDiscount.rate)))
                                    : p.price;
                                 return (
                                     <div key={p.id} onClick={() => openProduct(p)} className="bg-white flex flex-col gap-1.5 cursor-pointer hover:shadow-lg transition-all relative overflow-hidden rounded-xl border border-gray-100 pb-2">
                                         {appliedDiscount && (
                                             <div className="absolute top-2 right-2 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full z-10 shadow-lg">
                                                 SALE
                                             </div>
                                         )}
                                         <div className="aspect-[4/5] bg-gray-50 relative overflow-hidden">
                                             <img src={p.image_url} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"/>
                                         </div>
                                         <div className="px-2 space-y-1">
                                            <h3 className="text-[11px] font-bold line-clamp-1 text-gray-900">{p.name}</h3>
                                            {isApprovedAffiliate && (
                                                <div className="text-[9px] bg-green-50 text-green-700 px-2 py-0.5 rounded-md font-black w-fit border border-green-100">
                                                    ربح: {p.affiliate_commission ? `${p.affiliate_commission} DH` : `${Math.round(p.price * 0.05)} DH`}
                                                </div>
                                            )}
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-orange-600 font-black text-lg">{displayPrice}<span className="text-[10px] ml-0.5">DH</span></span>
                                                {appliedDiscount && (
                                                    <span className="text-gray-400 text-[10px] line-through">
                                                        {p.price}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="flex">
                                                    {[1,2,3,4,5].map(s => <Star key={s} size={8} className="fill-yellow-400 text-yellow-400"/>)}
                                                </div>
                                                <span className="text-[8px] text-gray-400">(48)</span>
                                            </div>
                                         </div>
                                     </div>
                                 );
                             })}
                             {filteredProducts.length === 0 && <p className="col-span-2 text-center py-20 text-gray-400 text-xs">{t('loading')}</p>}
                        </div>
                    )}
                </div>
                </div>

                {/* PRODUCT DETAIL FULL SCREEN */}
                {selectedProduct && (
                    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-slide-up">
                        <div className="bg-white border-b p-3 flex justify-between items-center shadow-sm z-10">
                            <button onClick={() => setSelectedProduct(null)} className="p-2 bg-gray-50 rounded-full">
                                <ArrowLeft size={20}/>
                            </button>
                            <h3 className="font-black text-xs uppercase tracking-widest">{selectedProduct.name}</h3>
                            <div className="flex items-center gap-2">
                                <button onClick={() => { setSelectedProduct(null); setView('cart'); }} className="p-2 bg-orange-600 text-white rounded-full relative shadow-md">
                                    <ShoppingCart size={18}/>
                                    {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black border-2 border-white">{cart.length}</span>}
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-white pb-24">
                            <div className="relative aspect-square w-full bg-gray-50">
                                <img src={sliderImages[currentImageIndex]} className="w-full h-full object-contain"/>
                                {sliderImages.length > 1 && (
                                    <>
                                        <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/50 rounded-full shadow-md"><ChevronLeft/></button>
                                        <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/50 rounded-full shadow-md"><ChevronRight/></button>
                                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                                            {sliderImages.map((_, idx) => (
                                                <div key={idx} className={`h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'w-6 bg-orange-600' : 'w-1.5 bg-gray-300'}`}></div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="space-y-1">
                                        <div className="text-4xl font-black text-orange-600">
                                            {displayPriceForSelectedProduct} 
                                            <span className="text-sm text-gray-400 font-bold ml-1">DH</span>
                                        </div>
                                        {appliedDiscount && (
                                            <div className="text-sm text-gray-400 line-through">
                                                {selectedProduct.price} DH
                                            </div>
                                        )}
                                        {isApprovedAffiliate && (
                                            <div className="mt-2 bg-green-50 text-green-700 text-[10px] px-3 py-1 rounded-full inline-block font-black border border-green-100">
                                                ربح المسوق: {selectedProduct.affiliate_commission ? `${selectedProduct.affiliate_commission} DH` : `${Math.round(selectedProduct.price * 0.05)} DH`}
                                            </div>
                                        )}
                                    </div>
                                    <button className="p-3 bg-gray-50 rounded-full text-gray-400"><Heart size={24}/></button>
                                </div>

                                <h1 className="text-xl font-black text-gray-900 leading-tight mb-6">{selectedProduct.name}</h1>
                                
                                {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="font-bold text-xs uppercase text-gray-400 mb-3">{t('selectSize')}</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedProduct.sizes.map(size => (
                                                <button
                                                    key={size}
                                                    onClick={() => setSelectedSize(size)}
                                                    className={`px-5 py-2.5 border-2 rounded-xl text-sm font-black transition-all ${selectedSize === size ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-900 border-gray-100'}`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-50 flex flex-col gap-1">
                                        <Truck size={20} className="text-orange-600 mb-1"/>
                                        <p className="text-xs font-black">{t('freeDelivery')}</p>
                                        <p className="text-[9px] text-gray-500">Tanja City Only</p>
                                    </div>
                                    <div className="p-4 bg-green-50/50 rounded-2xl border border-green-50 flex flex-col gap-1">
                                        <CheckCircle size={20} className="text-green-600 mb-1"/>
                                        <p className="text-xs font-black">Cash On Delivery</p>
                                        <p className="text-[9px] text-gray-500">الدفع عند الاستلام</p>
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <h4 className="font-bold text-xs uppercase text-gray-400 mb-3">{t('description')}</h4>
                                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{selectedProduct.description}</p>
                                </div>

                                {/* REVIEWS */}
                                <div className="border-t pt-8">
                                    <h4 className="font-black text-lg mb-6 flex items-center gap-2">
                                        {t('reviews')} <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md text-xs">{reviews.length}</span>
                                    </h4>
                                    <div className="flex gap-2 mb-8 items-start bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                        <textarea 
                                            value={newReview} 
                                            onChange={e => setNewReview(e.target.value)} 
                                            placeholder={currentUser ? t('writeComment') : t('loginRequired')}
                                            className="flex-1 bg-transparent text-sm outline-none resize-none h-12 py-1"
                                            disabled={!currentUser}
                                        />
                                        <button onClick={handleSubmitReview} disabled={reviewLoading || !currentUser} className="bg-orange-600 text-white p-3 rounded-xl shadow-lg disabled:opacity-50">
                                            {reviewLoading ? <Loader2 className="animate-spin" size={20}/> : <Send size={20}/>}
                                        </button>
                                    </div>
                                    <div className="space-y-6">
                                        {reviews.map((rev) => (
                                            <div key={rev.id} className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-black text-sm">{rev.user_name}</span>
                                                    <span className="text-[10px] text-gray-400 font-mono">{new Date(rev.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex mb-1">
                                                    {[1,2,3,4,5].map(s => <Star key={s} size={10} className="fill-orange-500 text-orange-500"/>)}
                                                </div>
                                                <p className="text-sm text-gray-700 bg-gray-50/50 p-3 rounded-2xl rounded-tl-none">{rev.comment}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* STICKY FOOTER */}
                        <div className="p-4 bg-white border-t safe-area-bottom shadow-[0_-10px_30px_rgba(0,0,0,0.05)] flex gap-3">
                             <button onClick={() => addToCart(selectedProduct)} className="flex-1 py-4 bg-orange-600 text-white rounded-full font-black shadow-xl uppercase tracking-widest active:scale-95 transition-transform text-sm">
                                 {t('addToCart')}
                             </button>
                        </div>
                    </div>
                )}

                {showWelcome && view === 'catalog' && (
                    <div className="absolute inset-0 z-[60] bg-white flex flex-col items-center justify-center p-8 animate-fade-in">
                        <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6 ring-4 ring-orange-50">
                            <ShoppingBag className="text-orange-600" size={48}/>
                        </div>
                        <h3 className="font-black text-3xl mb-3 text-center uppercase tracking-tighter">{t('storeWelcomeTitle')}</h3>
                        <p className="text-gray-500 mb-12 text-center text-sm leading-relaxed max-w-[240px]">
                            {t('storeWelcomeMsg')}
                        </p>
                        <button onClick={() => setShowWelcome(false)} className="w-full max-w-xs bg-orange-600 text-white py-5 rounded-full font-black shadow-2xl uppercase tracking-widest text-sm active:scale-95 transition-transform">
                            {t('shopNow')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Store;
