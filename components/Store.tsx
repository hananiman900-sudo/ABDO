
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

// ... (StoreHeaderBanner remains unchanged)
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
    // New curated images for a "Shopping Store" vibe
    const bannerImages = [
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop", // Clothing Store Interior
        "https://images.unsplash.com/photo-1472851294608-415522f96319?q=80&w=800&auto=format&fit=crop", // Classy Watch/Accessories
        "https://images.unsplash.com/photo-1511556820780-d912e42b4980?q=80&w=800&auto=format&fit=crop"  // Product Packaging/Bags
    ];
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent(prev => (prev + 1) % bannerImages.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="w-full h-36 relative overflow-hidden shrink-0 shadow-md">
            {bannerImages.map((img, idx) => (
                <div 
                    key={idx} 
                    className={`absolute inset-0 transition-opacity duration-1000 ${idx === current ? 'opacity-100' : 'opacity-0'}`}
                >
                    <img src={img} className="w-full h-full object-cover"/>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-transparent"></div>
                </div>
            ))}
            <div className="absolute inset-0 flex flex-col justify-between p-4 z-20">
                <div className="flex justify-between items-start">
                    <button onClick={onClose} className="w-8 h-8 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors"><ArrowLeft size={18}/></button>
                    <div className="flex items-center gap-2">
                        {currentUser && (<button onClick={onOpenOrders} className="w-8 h-8 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white/40"><ListChecks size={16}/></button>)}
                        {isAdmin && (<button onClick={onOpenAdmin} className="w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center"><Settings size={16}/></button>)}
                        <button onClick={onOpenCart} className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center relative shadow-lg border border-white/20"><ShoppingBag size={16}/>{cartCount > 0 && (<span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white font-bold">{cartCount}</span>)}</button>
                        {currentUser && (<button onClick={onProfile} className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/50 shadow-sm"><img src={currentUser.profile_image_url || `https://ui-avatars.com/api/?name=${currentUser.name}`} className="w-full h-full object-cover"/></button>)}
                    </div>
                </div>
                <div className="flex items-center gap-2 animate-fade-in pb-1"><div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm"><ShoppingBag size={12} className="text-orange-600"/></div><span className="font-black text-sm text-white tracking-wide uppercase drop-shadow-md">Tanger Store</span></div>
            </div>
            <div className="absolute bottom-2 right-4 flex gap-1 z-20">{bannerImages.map((_, idx) => (<div key={idx} className={`h-1 rounded-full transition-all shadow-sm ${idx === current ? 'bg-white w-4' : 'bg-white/40 w-1.5'}`}></div>))}</div>
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

    // Categories
    const categories = ['category_all', 'category_clothes', 'category_electronics', 'category_accessories', 'category_home', 'category_beauty'];

    const isAdmin = currentUser?.phone === '0617774846' && currentUser?.accountType === 'PROVIDER';

    // --- STRICT CART KEY LOGIC ---
    // This ensures cart is strictly isolated to the user ID. Guest cart is separate.
    const getCartKey = () => {
        if (currentUser) return `tanger_cart_${currentUser.id}`;
        return 'tanger_cart_guest';
    };

    useEffect(() => {
        if(isOpen) fetchProducts();
    }, [isOpen]);

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
            // Important: If switching users and no cart found, Reset!
            setCart([]);
        }
    }, [currentUser?.id]); // Re-run strictly when ID changes

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
        // Ensure user doesn't use their own code
        const { data } = await supabase.from('affiliate_partners').select('*').eq('promo_code', promoCode.toUpperCase()).single();
        
        if (data) {
            // Allow providers to use codes too, only block if it's THEIR OWN code
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

    // Calculate final price for a product based on discount logic
    const calculatePrice = (p: Product) => {
        if (!appliedDiscount) return p.price;
        // If product has specific discount price set, use it
        if (p.discount_price && p.discount_price > 0) return p.discount_price;
        // Fallback to default percentage
        return Math.round(p.price * (1 - appliedDiscount.rate));
    }

    const handleCheckout = async () => {
        if(!currentUser) { onOpenAuth(); return; }
        setLoading(true);
        
        // Calculate total based on dynamic pricing per item
        let finalAmount = 0;
        let originalAmount = 0;
        let totalCommission = 0;

        cart.forEach(item => {
            originalAmount += item.price * item.quantity; // item.price is original here (from addToCart logic below)
            
            // Calculate final price for this item
            const itemPrice = appliedDiscount 
                ? (item.discount_price && item.discount_price > 0 ? item.discount_price : Math.round(item.price * (1 - appliedDiscount.rate)))
                : item.price;
            
            finalAmount += itemPrice * item.quantity;

            // Calculate Commission
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
            items: cart, // Note: items in cart currently hold ORIGINAL price
            status: 'pending',
            customer_details: { 
                name: currentUser.name, 
                phone: currentUser.phone 
            },
            promo_code: appliedDiscount?.code,
            discount_amount: discountAmount
        }).select().single();

        if (!error && orderData) {
            // --- UPDATE AFFILIATE SALES ---
            if (appliedDiscount) {
                totalCommission = Math.round(totalCommission);

                // Insert into sales with STATUS 'PENDING'
                await supabase.from('affiliate_sales').insert({
                    partner_id: appliedDiscount.partnerId,
                    order_id: orderData.id,
                    amount: finalAmount,
                    commission: totalCommission,
                    status: 'pending' // Important: Earnings are pending until delivery
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

        // Add with ORIGINAL PRICE. Discount is calculated at display/checkout time
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
    
    // --- FILTER LOGIC ---
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

    // Calculations for Cart View Display
    const calculateCartTotal = () => {
        return cart.reduce((total, item) => {
            const price = appliedDiscount 
                ? (item.discount_price && item.discount_price > 0 ? item.discount_price : Math.round(item.price * (1 - appliedDiscount.rate)))
                : item.price;
            return total + (price * item.quantity);
        }, 0);
    };

    const cartTotal = calculateCartTotal();

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0 md:p-4">
            <div className="bg-gray-100 w-full h-full md:rounded-3xl flex flex-col overflow-hidden relative">
                
                {/* --- HEADER IS NOW THE BANNER ITSELF --- */}
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
                    /* Simple Header for other views */
                    <div className="bg-white p-3 flex justify-between items-center shadow-sm z-10 border-b relative">
                        <button onClick={() => setView('catalog')} className="p-2"><ArrowLeft/></button>
                        <h2 className="font-bold text-lg text-orange-600">{view === 'admin' ? t('adminPanel') : (view === 'my_orders' ? t('myOrders') : t('shop'))}</h2>
                        <div className="w-8"></div>
                    </div>
                )}

                {/* ... (Rest of Store UI) */}
                {view === 'catalog' && (
                    <>
                        {/* --- SEARCH BAR & PROMO CODE INPUT --- */}
                        <div className="bg-white p-3 border-b border-gray-100 flex gap-2">
                            <div className="bg-gray-50 border border-gray-200 rounded-xl flex items-center px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-orange-100 transition-all flex-1">
                                <Search size={18} className="text-gray-400"/>
                                <input 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={t('search')} 
                                    className="bg-transparent border-none outline-none flex-1 mx-2 text-sm text-gray-800 placeholder-gray-400 h-full"
                                />
                            </div>
                            
                            {/* NEW PROMO CODE TRIGGER */}
                            <div className="relative group">
                                <div className={`flex items-center bg-gray-50 border ${appliedDiscount ? 'border-green-500 bg-green-50' : 'border-gray-200'} rounded-xl px-2 py-1 h-full shadow-sm`}>
                                    <Tag size={16} className={appliedDiscount ? "text-green-600" : "text-gray-400"}/>
                                    <input 
                                        value={promoCode}
                                        onChange={e => setPromoCode(e.target.value)}
                                        placeholder="CODE"
                                        className="bg-transparent border-none outline-none w-16 text-center text-sm font-bold uppercase mx-1"
                                        disabled={!!appliedDiscount}
                                    />
                                    {appliedDiscount ? (
                                        <button onClick={() => { setAppliedDiscount(null); setPromoCode(''); }} className="bg-red-500 text-white rounded-full p-0.5"><X size={12}/></button>
                                    ) : (
                                        <button onClick={validatePromo} disabled={!promoCode.trim() || promoLoading} className="text-orange-600 font-bold text-xs px-1">
                                            {promoLoading ? <Loader2 size={12} className="animate-spin"/> : 'OK'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* --- CATEGORIES --- */}
                        <div className="bg-white border-b overflow-x-auto whitespace-nowrap p-2 flex gap-2 no-scrollbar shadow-sm z-10 sticky top-0">
                             {categories.map(c => (
                                 <button 
                                    key={c} 
                                    onClick={() => setActiveCategory(c)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeCategory === c ? 'bg-black text-white shadow-md' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}
                                >
                                    {t(c)}
                                 </button>
                             ))}
                        </div>
                    </>
                )}

                <div className="flex-1 overflow-y-auto bg-gray-50">
                    {/* ... (Existing Views: Admin, Cart, Orders) ... */}
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
                                    {cart.map(i => {
                                        // Dynamic calculation for display
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

                                    <div className="p-3 bg-yellow-50 text-xs text-yellow-700 rounded-lg mb-4">
                                        ℹ️ {t('storeWelcomeMsg')}
                                    </div>
                                    <button onClick={handleCheckout} className="w-full bg-green-600 text-white py-3 rounded-full font-bold shadow-lg">{loading ? <Loader2 className="animate-spin mx-auto"/> : t('checkout')}</button>
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
                        <div className="grid grid-cols-2 gap-1 p-1 pb-20">
                             {filteredProducts.map(p => {
                                 // CALCULATE DISPLAY PRICE
                                 const displayPrice = appliedDiscount 
                                    ? (p.discount_price && p.discount_price > 0 ? p.discount_price : Math.round(p.price * (1 - appliedDiscount.rate)))
                                    : p.price;

                                 return (
                                     <div key={p.id} onClick={() => openProduct(p)} className="bg-white p-2 flex flex-col gap-1 cursor-pointer hover:shadow-md transition-shadow relative">
                                         {appliedDiscount && (
                                             <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded z-10 shadow-sm animate-pulse">
                                                 SALE
                                             </div>
                                         )}
                                         {p.is_featured && (
                                             <div className="absolute top-2 left-2 bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded z-10 shadow-sm flex items-center gap-1">
                                                 <Gem size={8}/> Featured
                                             </div>
                                         )}
                                         <div className="aspect-[4/5] bg-gray-100 relative mb-1 overflow-hidden rounded-sm">
                                             <img src={p.image_url} className="w-full h-full object-cover"/>
                                         </div>
                                         <h3 className="text-xs line-clamp-1 text-gray-700">{p.name}</h3>
                                         
                                         {/* SHOW COMMISSION TO LOGGED IN USERS ONLY (AFFILIATES) */}
                                         {currentUser && (
                                             <div className="text-[9px] bg-green-50 text-green-700 px-1 rounded inline-block font-bold w-fit">
                                                 ربح: {p.affiliate_commission ? `${p.affiliate_commission} DH` : `${Math.round(p.price * 0.05)} DH`}
                                             </div>
                                         )}

                                         <div className="flex items-baseline gap-1 flex-wrap">
                                             <span className="text-orange-600 font-black text-lg">{displayPrice}<span className="text-xs">DH</span></span>
                                             {appliedDiscount && (
                                                 <span className="text-gray-400 text-[10px] line-through relative">
                                                     {p.price}
                                                     <div className="absolute top-1/2 left-0 w-full h-[1px] bg-red-500"></div>
                                                 </span>
                                             )}
                                         </div>
                                         
                                         <div className="flex items-center gap-1">
                                             <Star size={8} className="fill-yellow-400 text-yellow-400"/>
                                             <span className="text-[10px] text-gray-400">4.9</span>
                                         </div>
                                         <button 
                                            onClick={(e) => { e.stopPropagation(); addToCart(p); }} 
                                            className="w-full mt-1 bg-green-500 text-white text-[10px] rounded-full py-1 font-bold shadow-sm active:scale-95 transition-transform"
                                         >
                                             {t('addToCart')}
                                         </button>
                                     </div>
                                 );
                             })}
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
                                    <div>
                                        <div className="text-3xl font-black text-orange-600">
                                            {appliedDiscount 
                                                ? (selectedProduct.discount_price && selectedProduct.discount_price > 0 ? selectedProduct.discount_price : Math.round(selectedProduct.price * (1 - appliedDiscount.rate)))
                                                : selectedProduct.price} 
                                            <span className="text-sm text-gray-500 font-normal">DH</span>
                                        </div>
                                        {appliedDiscount && (
                                            <div className="text-sm text-gray-400 line-through decoration-red-500">
                                                {selectedProduct.price} DH
                                            </div>
                                        )}
                                        {/* Show Commission to Affiliates */}
                                        {currentUser && (
                                            <div className="mt-1 bg-green-50 text-green-700 text-xs px-2 py-1 rounded inline-block font-bold border border-green-200">
                                                ربح المسوق: {selectedProduct.affiliate_commission ? `${selectedProduct.affiliate_commission} DH` : `${Math.round(selectedProduct.price * 0.05)} DH`}
                                            </div>
                                        )}
                                    </div>
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
                                                    <span className="text-[10px] text-gray-400">{new Date(rev.created_at).toLocaleDateString()}</p>
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
