
import React, { useState, useEffect, useRef } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { Product, CartItem, AuthenticatedUser, Order, SystemAnnouncement, Category } from '../types';
import { supabase } from '../services/supabaseClient';
import { ShoppingBag, ShoppingCart, Plus, Minus, X, CheckCircle, Loader2, Package, Search, History, Trash, Settings, List, Save, User, Phone, Edit, MessageSquare, Image as ImageIcon, ArrowLeft, Truck, Clock, Star, Send, Filter, ChevronLeft, ChevronRight, FolderPlus, LogIn, Shirt, Scissors, Maximize2, ChevronUp, ChevronDown, Camera, Video, Upload } from 'lucide-react';

interface StoreProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: AuthenticatedUser | null;
    onOpenAuth: () => void; // Callback to open auth drawer
}

// --- VIRTUAL TRY-ON COMPONENT (WIZARD FLOW) ---
const VirtualFittingRoom: React.FC<{ isOpen: boolean; onClose: () => void; initialProduct: Product; onAddToCart: (product: Product, size: string) => void }> = ({ isOpen, onClose, initialProduct, onAddToCart }) => {
    const { t } = useLocalization();
    const [step, setStep] = useState(1);
    
    // Step 1: Measurements
    const [userStats, setUserStats] = useState({ height: '', weight: '', size: '' });
    
    // Step 2: Media
    const [userMedia, setUserMedia] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
    
    // Step 3: Fitting Room
    const [clothingItems, setClothingItems] = useState<{product: Product, x: number, y: number, scale: number, id: number}[]>([]);
    const [activeItemId, setActiveItemId] = useState<number | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    
    useEffect(() => {
        if(isOpen && initialProduct) {
             // Reset
             setStep(1);
             setUserMedia(null);
             setClothingItems([{ product: initialProduct, x: 50, y: 30, scale: 1, id: Date.now() }]);
        }
    }, [isOpen, initialProduct]);

    const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
        const file = e.target.files?.[0];
        if(file) {
            setMediaType(type);
            const url = URL.createObjectURL(file);
            setUserMedia(url);
            setStep(3);
        }
    }

    // Controls
    const updateScale = (delta: number) => {
        if(!activeItemId) return;
        setClothingItems(prev => prev.map(item => item.id === activeItemId ? {...item, scale: Math.max(0.5, item.scale + delta)} : item));
    }
    
    const moveItem = (dx: number, dy: number) => {
        if(!activeItemId) return;
        setClothingItems(prev => prev.map(item => item.id === activeItemId ? {...item, x: item.x + dx, y: item.y + dy} : item));
    }

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 z-[70] flex flex-col animate-fade-in text-white h-screen">
            <div className="flex justify-between items-center p-4 z-20 bg-black/50 backdrop-blur-md">
                 <h2 className="font-bold text-lg flex items-center gap-2"><Shirt className="text-pink-500"/> {t('virtualFittingRoom')}</h2>
                 <button onClick={onClose} className="bg-gray-800 p-2 rounded-full"><X size={20}/></button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                
                {/* STEP 1: MEASUREMENTS */}
                {step === 1 && (
                    <div className="w-full max-w-sm bg-gray-800 p-6 rounded-2xl animate-slide-up">
                        <h3 className="text-xl font-bold mb-6 text-center">{t('fittingRoomStep1')}</h3>
                        <div className="space-y-4">
                             <div>
                                 <label className="text-sm text-gray-400 block mb-1">{t('heightCm')}</label>
                                 <input 
                                    type="number"
                                    value={userStats.height} 
                                    onChange={e => setUserStats({...userStats, height: e.target.value})} 
                                    className="w-full bg-gray-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-pink-500 text-white"
                                    placeholder="170"
                                 />
                             </div>
                             <div>
                                 <label className="text-sm text-gray-400 block mb-1">{t('weightKg')}</label>
                                 <input 
                                    type="number"
                                    value={userStats.weight} 
                                    onChange={e => setUserStats({...userStats, weight: e.target.value})} 
                                    className="w-full bg-gray-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-pink-500 text-white"
                                    placeholder="70"
                                 />
                             </div>
                             <div>
                                 <label className="text-sm text-gray-400 block mb-1">{t('yourSize')}</label>
                                 <div className="flex gap-2">
                                     {['S', 'M', 'L', 'XL', 'XXL'].map(s => (
                                         <button 
                                            key={s} 
                                            onClick={() => setUserStats({...userStats, size: s})}
                                            className={`flex-1 py-2 rounded-lg font-bold border ${userStats.size === s ? 'bg-pink-500 border-pink-500' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
                                         >
                                             {s}
                                         </button>
                                     ))}
                                 </div>
                             </div>
                             
                             <button 
                                onClick={() => setStep(2)} 
                                disabled={!userStats.height || !userStats.weight || !userStats.size}
                                className="w-full bg-pink-500 py-3 rounded-xl font-bold mt-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-pink-500/30"
                             >
                                 {t('continue')}
                             </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: CHOOSE MEDIA */}
                {step === 2 && (
                    <div className="w-full max-w-sm bg-gray-800 p-6 rounded-2xl animate-slide-up">
                        <h3 className="text-xl font-bold mb-6 text-center">{t('fittingRoomStep2')}</h3>
                        <div className="space-y-3">
                            <label className="w-full bg-gray-700 p-4 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-gray-600 transition-colors">
                                <div className="bg-blue-500 p-3 rounded-full"><Camera size={24}/></div>
                                <div className="text-left">
                                    <span className="block font-bold">{t('takePhoto')}</span>
                                </div>
                                <input type="file" hidden accept="image/*" capture="user" onChange={(e) => handleMediaUpload(e, 'image')} />
                            </label>

                            <label className="w-full bg-gray-700 p-4 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-gray-600 transition-colors">
                                <div className="bg-red-500 p-3 rounded-full"><Video size={24}/></div>
                                <div className="text-left">
                                    <span className="block font-bold">{t('recordVideo')}</span>
                                </div>
                                <input type="file" hidden accept="video/*" capture="environment" onChange={(e) => handleMediaUpload(e, 'video')} />
                            </label>

                            <label className="w-full bg-gray-700 p-4 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-gray-600 transition-colors">
                                <div className="bg-green-500 p-3 rounded-full"><Upload size={24}/></div>
                                <div className="text-left">
                                    <span className="block font-bold">{t('uploadImageOrVideo')}</span>
                                </div>
                                <input type="file" hidden accept="image/*,video/*" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if(file) {
                                        const type = file.type.startsWith('video') ? 'video' : 'image';
                                        handleMediaUpload(e, type);
                                    }
                                }} />
                            </label>
                        </div>
                        <button onClick={() => setStep(1)} className="mt-6 text-gray-400 text-sm hover:text-white underline w-full text-center">Back</button>
                    </div>
                )}

                {/* STEP 3: TRY-ON CANVAS */}
                {step === 3 && (
                     <div className="w-full h-full relative flex items-center justify-center">
                         <div className="relative w-full max-w-md h-full max-h-[70vh] bg-black overflow-hidden rounded-lg border border-gray-700">
                             {/* Background Media */}
                             {mediaType === 'video' ? (
                                 <video 
                                    ref={videoRef} 
                                    src={userMedia!} 
                                    className="w-full h-full object-cover pointer-events-none" 
                                    autoPlay 
                                    loop 
                                    muted 
                                    playsInline 
                                 />
                             ) : (
                                 <img src={userMedia!} className="w-full h-full object-cover pointer-events-none" alt="User" />
                             )}
                             
                             {/* Clothing Overlay */}
                             {clothingItems.map(item => (
                                 <div 
                                     key={item.id}
                                     className={`absolute transition-transform ${activeItemId === item.id ? 'ring-2 ring-pink-500 ring-offset-2 ring-offset-transparent' : ''}`}
                                     style={{ 
                                         top: `${item.y}%`, 
                                         left: `${item.x}%`, 
                                         transform: `translate(-50%, -50%) scale(${item.scale})`,
                                         width: '200px',
                                         touchAction: 'none'
                                     }}
                                     onTouchStart={() => setActiveItemId(item.id)}
                                     onMouseDown={() => setActiveItemId(item.id)}
                                 >
                                     <img src={item.product.image_url} className="w-full pointer-events-none drop-shadow-2xl filter contrast-110" />
                                 </div>
                             ))}

                             <div className="absolute top-4 left-0 w-full text-center pointer-events-none">
                                 <span className="bg-black/50 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm">
                                     {t('tryOnInstruction')}
                                 </span>
                             </div>
                         </div>
                     </div>
                )}
            </div>

            {/* Controls (Only visible in Step 3) */}
            {step === 3 && (
                <div className="bg-gray-800 p-4 pb-8 rounded-t-3xl z-30">
                    <div className="flex justify-between items-center mb-4">
                         <div className="flex gap-4">
                             <div className="flex flex-col items-center">
                                 <span className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider">{t('scale')}</span>
                                 <div className="flex gap-2">
                                     <button onClick={() => updateScale(-0.1)} className="bg-gray-700 p-3 rounded-full active:scale-95 transition-transform"><Minus size={16}/></button>
                                     <button onClick={() => updateScale(0.1)} className="bg-gray-700 p-3 rounded-full active:scale-95 transition-transform"><Plus size={16}/></button>
                                 </div>
                             </div>
                             <div className="flex flex-col items-center">
                                 <span className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider">{t('move')}</span>
                                 <div className="flex gap-2">
                                     <button onClick={() => moveItem(0, -5)} className="bg-gray-700 p-3 rounded-full active:scale-95 transition-transform"><ChevronUp size={16}/></button>
                                     <button onClick={() => moveItem(0, 5)} className="bg-gray-700 p-3 rounded-full active:scale-95 transition-transform"><ChevronDown size={16}/></button>
                                 </div>
                             </div>
                         </div>
                         <button onClick={() => setStep(2)} className="text-gray-400 p-2 text-xs flex flex-col items-center">
                             <Camera size={20} className="mb-1"/> Retake
                         </button>
                    </div>

                    <button 
                        onClick={() => {
                            onAddToCart(initialProduct, userStats.size || 'M');
                            onClose();
                        }}
                        className="w-full bg-pink-500 py-3 rounded-xl font-bold text-white shadow-lg shadow-pink-500/30 active:scale-95 transition-transform flex items-center justify-center gap-2"
                    >
                        <ShoppingBag size={18} /> {t('addToCartClose')}
                    </button>
                </div>
            )}
        </div>
    );
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
    const [showLoginPrompt, setShowLoginPrompt] = useState(false); // Guest checkout prompt
    
    // User Selection State
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [selectedNote, setSelectedNote] = useState<string>('');
    const [selectedProductDetail, setSelectedProductDetail] = useState<any | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Virtual Fitting Room State
    const [showFittingRoom, setShowFittingRoom] = useState(false);

    // Reviews State
    const [reviews, setReviews] = useState<any[]>([]);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    // Admin State
    const [adminTab, setAdminTab] = useState<'products' | 'orders' | 'ads' | 'categories'>('products');
    const [adminOrders, setAdminOrders] = useState<Order[]>([]);
    const [systemAds, setSystemAds] = useState<SystemAnnouncement[]>([]);
    const [newProduct, setNewProduct] = useState({ id: 0, name: '', description: '', price: '', category: 'General', image_url: '', images: [] as string[], sizes: '' });
    const [newAd, setNewAd] = useState<{ title: string; message: string; images: string[] }>({ title: '', message: '', images: [] });
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isEditingProduct, setIsEditingProduct] = useState(false);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const adFileInputRef = useRef<HTMLInputElement>(null);
    const isAdmin = currentUser?.phone === '0617774846' && currentUser?.accountType === 'PROVIDER';

    // --- CART ISOLATION ---
    // Load cart from localStorage based on User ID
    useEffect(() => {
        if (currentUser) {
            const savedCart = localStorage.getItem(`cart_${currentUser.id}`);
            if (savedCart) setCart(JSON.parse(savedCart));
            else setCart([]);
        } else {
            const guestCart = localStorage.getItem('cart_guest');
            if (guestCart) setCart(JSON.parse(guestCart));
            else setCart([]);
        }
    }, [currentUser, isOpen]);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (currentUser) {
            localStorage.setItem(`cart_${currentUser.id}`, JSON.stringify(cart));
        } else {
            localStorage.setItem('cart_guest', JSON.stringify(cart));
        }
    }, [cart, currentUser]);


    useEffect(() => {
        if (isOpen) {
            fetchProducts();
            fetchCategories();
            if (currentUser) fetchMyOrders();
            // ALWAYS DEFAULT TO CATALOG FOR USERS
            if (isAdmin) {
                setView('admin'); 
            } else {
                setView('catalog');
            }
        }
    }, [isOpen, currentUser]);

    // --- FETCHING ---

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase.from('categories').select('*').order('name');
            if(error) {
                if(error.code === '42P01') {
                    console.warn("Categories table missing. Please run V20 update.");
                } else {
                    console.error("Fetch categories error:", error);
                }
            }
            setCategories(data || []);
        } catch(e) { console.error(e); }
    }

    const fetchProducts = async () => {
        setIsLoading(true);
        // Fetch products. Note: Supabase might return error if 'images' column doesn't exist yet (run V17)
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (!error) setProducts(data || []);
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

    // --- REVIEWS LOGIC ---
    const fetchReviews = async (productId: number) => {
        const { data } = await supabase.from('product_reviews').select('*').eq('product_id', productId).order('created_at', { ascending: false });
        setReviews(data || []);
    }

    const handleSubmitReview = async () => {
        if(!selectedProductDetail || !currentUser) return;
        if(!newReview.comment.trim()) return;

        setIsSubmittingReview(true);
        try {
            const { error } = await supabase.from('product_reviews').insert({
                product_id: selectedProductDetail.id,
                user_name: currentUser.name || 'Anonymous',
                rating: newReview.rating,
                comment: newReview.comment
            });
            if (error) throw error;
            setNewReview({ rating: 5, comment: '' });
            fetchReviews(selectedProductDetail.id);
        } catch(e) {
            console.error(e);
            alert("Failed to post review. Make sure you ran V17 update in Database Setup.");
        } finally {
            setIsSubmittingReview(false);
        }
    }

    // --- IMAGE UPLOAD LOGIC ---

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
                const filePath = `${fileName}`;
                const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);
                if (uploadError) throw uploadError;
                const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
                urls.push(data.publicUrl);
            }

            if (type === 'product') {
                setNewProduct(prev => ({ 
                    ...prev, 
                    images: [...prev.images, ...urls],
                    image_url: prev.image_url || urls[0] // Fallback for legacy
                }));
            } else {
                setNewAd(prev => ({ ...prev, images: [...prev.images, ...urls] }));
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert(t('uploadError'));
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (adFileInputRef.current) adFileInputRef.current.value = '';
        }
    };

    const removeProductImage = (index: number) => {
        setNewProduct(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    }

    const removeAdImage = (index: number) => {
        setNewAd(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    // --- CART LOGIC ---

    const initiateAddToCart = (product: Product) => {
        setSelectedProductDetail(product);
        setSelectedSize('');
        setSelectedNote('');
        setCurrentImageIndex(0);
        fetchReviews(product.id);
    };

    const confirmAddToCart = () => {
        if (!selectedProductDetail) return;
        addToCartInternal(selectedProductDetail, selectedSize, selectedNote);
        setSelectedProductDetail(null);
    };

    // New helper to add to cart from different places (like Fitting Room)
    const addToCartInternal = (product: Product, size: string, note?: string) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id && item.selectedSize === size);
            if (existing) {
                return prev.map(item => (item.id === product.id && item.selectedSize === size) ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, quantity: 1, selectedSize: size, note: note }];
        });
    }

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
        if (!currentUser) {
            setShowLoginPrompt(true);
            return;
        }
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

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        setIsAddingCategory(true);
        try {
             // 1. Attempt insert
             const { error } = await supabase.from('categories').insert({ name: newCategoryName.trim() });
             
             if (error) {
                 console.error("Add Category Error:", error);
                 if(error.code === '42P01') {
                    alert("Error: Table 'categories' missing. Go to Database Setup and run V20 Update.");
                 } else if(error.code === '23505') { // Duplicate key
                     alert("Category already exists.");
                 } else {
                     alert("Error adding category. Please ensure you ran V20 update. " + error.message);
                 }
             } else {
                 setNewCategoryName('');
                 fetchCategories();
             }
        } catch (e: any) {
             console.error("Unexpected error:", e);
             alert("An unexpected error occurred.");
        } finally {
             setIsAddingCategory(false);
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm(t('delete') + '?')) return;
        await supabase.from('categories').delete().eq('id', id);
        fetchCategories();
    }

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
                image_url: newProduct.images.length > 0 ? newProduct.images[0] : newProduct.image_url,
                images: newProduct.images, // Array of strings
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

            setNewProduct({ id: 0, name: '', description: '', price: '', category: 'General', image_url: '', images: [], sizes: '' });
            setIsEditingProduct(false);
            await fetchProducts(); // Refresh list immediately
        } catch (e: any) {
            console.error(e);
            alert("Error saving product. Please ensure V17/V18 update is applied.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditProductClick = (product: any) => {
        setNewProduct({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price.toString(),
            category: product.category,
            image_url: product.image_url,
            images: product.images || (product.image_url ? [product.image_url] : []),
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
                alert("Error deleting product.");
            } else {
                fetchProducts();
            }
        }
    }

    const handleAddSystemAd = async () => {
        if (!newAd.title || !newAd.message || newAd.images.length === 0) return alert(t('allFieldsRequired'));
        
        await supabase.from('system_announcements').insert({
            title: newAd.title,
            message: newAd.message,
            image_url: newAd.images[0], // Keep legacy field populated
            images: newAd.images,
            is_active: true
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

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (!isOpen) return null;

    return (
        <div key={language} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
            {/* Full Screen on Mobile */}
            <div className="bg-gray-100 dark:bg-gray-900 w-full h-full md:max-w-4xl md:h-[90vh] md:rounded-3xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-3 border-b dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 sticky top-0 z-20 shadow-sm">
                    <div className="flex items-center gap-3">
                         <button onClick={onClose} className="p-1 rounded-full text-dark dark:text-light"><ArrowLeft size={24}/></button>
                        <div>
                            <h2 className="text-lg font-bold dark:text-white leading-none">{view === 'admin' ? t('storeManager') : t('shop')}</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                         {isAdmin && (
                            <button onClick={() => { setView('admin'); fetchAdminOrders(); fetchSystemAds(); }} className={`p-2 rounded-full transition-colors ${view === 'admin' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-purple-600'}`}>
                                <Settings size={20} />
                            </button>
                        )}
                        <button onClick={() => setView('catalog')} className={`p-2 rounded-full transition-colors ${view === 'catalog' ? 'text-orange-500' : 'text-gray-400'}`}>
                            <Search size={24} />
                        </button>
                        {currentUser && !isAdmin && (
                            <button onClick={() => setView('orders')} className={`p-2 rounded-full transition-colors ${view === 'orders' ? 'text-orange-500' : 'text-gray-400'}`}>
                                <History size={24} />
                            </button>
                        )}
                        {!isAdmin && (
                        <button onClick={() => setView('cart')} className={`p-2 rounded-full transition-colors relative ${view === 'cart' ? 'text-orange-500' : 'text-gray-400'}`}>
                            <ShoppingCart size={24} />
                            {cart.length > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{cart.length}</span>}
                        </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900 relative">
                    {/* --- ADMIN VIEW --- */}
                    {view === 'admin' && isAdmin ? (
                        <div className="space-y-6 p-4">
                            <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 pb-4 overflow-x-auto">
                                <button onClick={() => setAdminTab('products')} className={`pb-2 px-2 font-bold whitespace-nowrap ${adminTab === 'products' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}>{t('products')}</button>
                                <button onClick={() => setAdminTab('categories')} className={`pb-2 px-2 font-bold whitespace-nowrap ${adminTab === 'categories' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}>Categories</button>
                                <button onClick={() => { setAdminTab('orders'); fetchAdminOrders(); }} className={`pb-2 px-2 font-bold whitespace-nowrap ${adminTab === 'orders' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}>{t('orders')}</button>
                                <button onClick={() => { setAdminTab('ads'); fetchSystemAds(); }} className={`pb-2 px-2 font-bold whitespace-nowrap ${adminTab === 'ads' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}>{t('systemAds')}</button>
                            </div>

                            {/* ... (Admin Content) ... */}
                            {adminTab === 'products' ? (
                                <div className="space-y-8">
                                    <div id="admin-product-form" className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-bold text-lg dark:text-white">{isEditingProduct ? t('editProduct') : t('addProduct')}</h3>
                                            {isEditingProduct && (
                                                <button onClick={() => { setIsEditingProduct(false); setNewProduct({ id: 0, name: '', description: '', price: '', category: 'General', image_url: '', images: [], sizes: '' }); }} className="text-xs text-red-500 underline">{t('close')}</button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input placeholder={t('productName')} value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl outline-none dark:text-white border border-gray-200 dark:border-gray-600"/>
                                            <input placeholder={t('price')} type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl outline-none dark:text-white border border-gray-200 dark:border-gray-600"/>
                                            
                                            {/* Category Select */}
                                            <select 
                                                value={newProduct.category} 
                                                onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                                                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl outline-none dark:text-white border border-gray-200 dark:border-gray-600"
                                            >
                                                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                                <option value="General">General</option>
                                            </select>
                                            
                                            {/* Multi Image Upload */}
                                            <div className="md:col-span-2">
                                                <div className="flex items-center gap-2 mb-2">
                                                     <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-gray-200 dark:bg-gray-600 rounded-xl hover:bg-gray-300 flex items-center gap-2 text-sm font-bold"><ImageIcon size={16}/> Add Images</button>
                                                     <input type="file" ref={fileInputRef} hidden accept="image/*" multiple onChange={(e) => handleImageUpload(e, 'product')} />
                                                </div>
                                                <div className="flex gap-2 overflow-x-auto pb-2">
                                                    {newProduct.images.map((url, idx) => (
                                                        <div key={idx} className="relative w-20 h-20 flex-shrink-0">
                                                            <img src={url} className="w-full h-full object-cover rounded-lg"/>
                                                            <button onClick={() => removeProductImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm"><X size={12}/></button>
                                                        </div>
                                                    ))}
                                                </div>
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
                            ) : adminTab === 'categories' ? (
                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg dark:text-white">Category Manager</h3>
                                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm flex gap-2">
                                        <input 
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            placeholder="New Category Name (e.g. ملابس)"
                                            className="flex-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl outline-none dark:text-white"
                                            disabled={isAddingCategory}
                                        />
                                        <button onClick={handleAddCategory} disabled={isAddingCategory} className="bg-green-500 text-white px-6 rounded-xl font-bold flex items-center justify-center">
                                            {isAddingCategory ? <Loader2 className="animate-spin"/> : <Plus/>}
                                        </button>
                                    </div>
                                    {categories.length === 0 && <p className="text-red-500 text-sm font-bold">Categories not loading? Run V20 Update in Database Setup.</p>}
                                    <div className="grid grid-cols-2 gap-2">
                                        {categories.map(c => (
                                            <div key={c.id} className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700">
                                                <span className="font-bold dark:text-white">{c.name}</span>
                                                <button onClick={() => handleDeleteCategory(c.id)} className="text-red-500 p-2"><Trash size={16}/></button>
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
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                     <button onClick={() => adFileInputRef.current?.click()} className="flex items-center gap-2 p-3 bg-gray-200 dark:bg-gray-600 rounded-xl hover:bg-gray-300 dark:text-white font-bold text-sm"><ImageIcon size={18}/> Add Images (Multiple)</button>
                                                     <input type="file" ref={adFileInputRef} hidden accept="image/*" multiple onChange={(e) => handleImageUpload(e, 'ad')} />
                                                </div>
                                                <div className="flex gap-2 overflow-x-auto pb-2">
                                                    {newAd.images.map((url, idx) => (
                                                        <div key={idx} className="relative w-20 h-20 flex-shrink-0">
                                                            <img src={url} className="w-full h-full object-cover rounded-lg"/>
                                                            <button onClick={() => removeAdImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm"><X size={12}/></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <textarea placeholder={t('messageLabel')} value={newAd.message} onChange={e => setNewAd({...newAd, message: e.target.value})} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl outline-none dark:text-white border border-gray-200 dark:border-gray-600" rows={3}/>
                                        </div>
                                        <button onClick={handleAddSystemAd} className="mt-4 w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primaryDark flex items-center justify-center gap-2">
                                            <Plus size={18}/> {t('sendButton')}
                                        </button>
                                    </div>
                                    {/* Ads List omitted for brevity */}
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
                                                     {order.customer_details && (
                                                         <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                                             <p>Customer: {(order.customer_details as any).name}</p>
                                                             <p>Phone: {(order.customer_details as any).phone}</p>
                                                         </div>
                                                     )}
                                                 </div>
                                                 <div className="text-right">
                                                      <p className="font-bold text-xl text-primary">{order.total_amount} DH</p>
                                                 </div>
                                             </div>
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
                        <div className="pb-20 relative">
                            {/* STORE BANNER - PERSONALIZED */}
                            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4">
                                <p className="font-bold text-lg">
                                    {currentUser ? `مرحبا ${currentUser.name}!` : 'مرحبا!'}
                                </p>
                                <p className="text-sm font-medium mt-1">
                                    شري دابا وخلص من بعد (الدفع عند الاستلام). التوصيل فابور!
                                </p>
                            </div>

                            {/* Search - Sticky Top */}
                            <div className="sticky top-0 z-20 bg-gray-100 dark:bg-gray-900 px-3 py-2 shadow-sm">
                                <div className="relative">
                                    <input 
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder={t('searchProductPlaceholder')}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 rounded-full shadow-sm border-none outline-none dark:text-white text-sm"
                                    />
                                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                </div>
                                
                                {/* Categories List */}
                                <div className="flex gap-2 overflow-x-auto mt-2 pb-1 no-scrollbar">
                                    <button 
                                        onClick={() => setSelectedCategory('All')}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${selectedCategory === 'All' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-white text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}
                                    >
                                        All
                                    </button>
                                    {categories.map(cat => (
                                        <button 
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(cat.name)}
                                            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${selectedCategory === cat.name ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-white text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Temu-Style Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 px-2 mt-2">
                                {filteredProducts.map(product => (
                                    <div key={product.id} onClick={() => initiateAddToCart(product)} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm flex flex-col cursor-pointer group hover:shadow-lg transition-shadow">
                                        {/* Image Square */}
                                        <div className="aspect-square bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                                            {product.image_url ? (
                                                <img src={product.image_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400"><Package size={32}/></div>
                                            )}
                                        </div>
                                        
                                        {/* Product Details */}
                                        <div className="p-2 flex-1 flex flex-col">
                                            <h3 className="text-sm dark:text-white line-clamp-2 leading-tight mb-1 h-9 overflow-hidden text-ellipsis">{product.name}</h3>
                                            
                                            <div className="mt-auto">
                                                <div className="flex items-baseline gap-1 mb-1">
                                                     <span className="font-bold text-lg text-black dark:text-white">{product.price} <span className="text-xs">DH</span></span>
                                                </div>
                                                <div className="text-[10px] text-gray-500 mb-2">{product.category}</div>
                                                
                                                {/* Add Button - Temu Orange */}
                                                <button className="w-full py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-bold text-xs flex items-center justify-center gap-1">
                                                     <ShoppingBag size={12} /> {t('addToCart')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : view === 'cart' ? (
                        <div className="p-4 max-w-2xl mx-auto">
                            {cart.length === 0 ? (
                                <div className="text-center py-20 text-gray-400">
                                    <ShoppingCart size={64} className="mx-auto mb-4 opacity-20" />
                                    <p className="text-lg">{t('noNotifications')}</p>
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                                    <div className="p-4 space-y-4">
                                        {cart.map((item, index) => (
                                            <div key={index} className="flex gap-3 border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                                                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                                                    {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover"/> : null}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold dark:text-white truncate text-sm">{item.name}</h4>
                                                    <p className="text-black dark:text-white font-bold text-sm">{item.price} DH</p>
                                                    {item.selectedSize && <p className="text-xs text-gray-500 mt-1">Size: {item.selectedSize}</p>}
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded">
                                                            <button onClick={() => updateQuantity(index, -1)} className="px-2 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">-</button>
                                                            <span className="px-2 font-bold text-sm dark:text-white">{item.quantity}</span>
                                                            <button onClick={() => updateQuantity(index, 1)} className="px-2 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">+</button>
                                                        </div>
                                                        <button onClick={() => removeFromCart(index)} className="text-xs text-gray-400 underline ml-auto">Remove</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-900/30 border-t dark:border-gray-700">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-sm font-bold text-gray-600 dark:text-gray-300">Total</span>
                                            <span className="text-2xl font-bold text-orange-500">{cartTotal} DH</span>
                                        </div>
                                        <button 
                                            onClick={handleCheckout} 
                                            disabled={isLoading}
                                            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-bold text-base shadow-lg transition-all active:scale-95"
                                        >
                                            {isLoading ? <Loader2 className="animate-spin mx-auto" /> : t('checkout')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-4 space-y-4">
                            <h3 className="font-bold text-lg mb-4 dark:text-white">{t('myOrders')}</h3>
                            {myOrders.map(order => (
                                <div key={order.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1">{new Date(order.created_at).toLocaleString()}</p>
                                        </div>
                                        <span className="text-lg font-bold text-orange-500">{order.total_amount} DH</span>
                                    </div>
                                    <div className="space-y-1">
                                        {order.items.map((item: CartItem, idx: number) => (
                                            <div key={idx} className="flex justify-between text-xs text-gray-600 dark:text-gray-300">
                                                <span>{item.quantity}x {item.name}</span>
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

            {/* GUEST CHECKOUT MODAL */}
            {showLoginPrompt && (
                <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowLoginPrompt(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center" onClick={e => e.stopPropagation()}>
                        <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <LogIn size={32} className="text-orange-500"/>
                        </div>
                        <h3 className="text-xl font-bold dark:text-white">Please Login</h3>
                        <p className="text-gray-500 dark:text-gray-300 mb-6">You need to have an account to place an order.</p>
                        <div className="flex flex-col gap-2">
                            <button 
                                onClick={() => { setShowLoginPrompt(false); onClose(); onOpenAuth(); }}
                                className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-500/30"
                            >
                                Login / Register
                            </button>
                            <button 
                                onClick={() => setShowLoginPrompt(false)}
                                className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* FULL SCREEN PRODUCT DETAIL MODAL */}
            {selectedProductDetail && !showFittingRoom && (
                <div className="fixed inset-0 z-[60] bg-white dark:bg-gray-900 flex flex-col animate-slide-up overflow-hidden" onClick={e => e.stopPropagation()}>
                    
                    {/* Header */}
                    <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
                         <button onClick={() => setSelectedProductDetail(null)} className="bg-black/40 text-white p-2 rounded-full pointer-events-auto"><ArrowLeft/></button>
                         <button onClick={() => setSelectedProductDetail(null)} className="bg-black/40 text-white p-2 rounded-full pointer-events-auto"><X/></button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto">
                        
                        {/* Image Slider */}
                        <div className="h-[50vh] bg-gray-100 relative group">
                            {selectedProductDetail.images && selectedProductDetail.images.length > 0 ? (
                                <img src={selectedProductDetail.images[currentImageIndex]} className="w-full h-full object-cover"/>
                            ) : selectedProductDetail.image_url ? (
                                <img src={selectedProductDetail.image_url} className="w-full h-full object-cover"/>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400"><Package size={64}/></div>
                            )}

                            {/* Slider Controls */}
                            {selectedProductDetail.images && selectedProductDetail.images.length > 1 && (
                                <>
                                    <button 
                                        onClick={() => setCurrentImageIndex((prev) => (prev - 1 + selectedProductDetail.images.length) % selectedProductDetail.images.length)}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 p-2 rounded-full text-white"
                                    >
                                        <ChevronLeft/>
                                    </button>
                                    <button 
                                        onClick={() => setCurrentImageIndex((prev) => (prev + 1) % selectedProductDetail.images.length)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 p-2 rounded-full text-white"
                                    >
                                        <ChevronRight/>
                                    </button>
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                                        {selectedProductDetail.images.map((_: any, idx: number) => (
                                            <div key={idx} className={`w-2 h-2 rounded-full ${idx === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}></div>
                                        ))}
                                    </div>
                                </>
                            )}
                            
                            {/* TRY-ON BUTTON (Only for Clothes) */}
                            {(selectedProductDetail.category === 'ملابس' || selectedProductDetail.category === 'Clothing') && (
                                <button 
                                    onClick={() => setShowFittingRoom(true)}
                                    className="absolute bottom-4 right-4 bg-pink-500 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg hover:bg-pink-600 transition-transform hover:scale-105 pointer-events-auto"
                                >
                                    <Shirt size={18}/> {t('virtualFittingRoom')}
                                </button>
                            )}
                        </div>
                        
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-2xl font-bold dark:text-white leading-tight">{selectedProductDetail.name}</h3>
                                <p className="text-2xl font-bold text-orange-500">{selectedProductDetail.price} <span className="text-sm text-gray-500">DH</span></p>
                            </div>
                            
                            <p className="text-gray-600 dark:text-gray-300 mb-6 text-base leading-relaxed">{selectedProductDetail.description}</p>

                            {/* Variants (Temu Style Chips) */}
                            {selectedProductDetail.sizes && selectedProductDetail.sizes.length > 0 && (
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-gray-500 mb-2 uppercase">{t('selectSize')}</label>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedProductDetail.sizes.map((size: string) => (
                                            <button 
                                                key={size} 
                                                onClick={() => setSelectedSize(size)}
                                                className={`px-6 py-2 rounded-full font-bold text-sm transition-all border ${
                                                    selectedSize === size 
                                                    ? 'bg-orange-50 text-orange-600 border-orange-500 ring-2 ring-orange-200' 
                                                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-orange-300'
                                                }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* REVIEWS SECTION */}
                            <div className="mt-8 border-t border-gray-100 dark:border-gray-700 pt-6">
                                <h4 className="font-bold text-lg mb-4 flex items-center gap-2 dark:text-white"><MessageSquare size={18}/> Reviews ({reviews.length})</h4>
                                
                                {/* Add Review */}
                                {currentUser ? (
                                    <div className="mb-6 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl" onClick={e => e.stopPropagation()}>
                                        <div className="flex gap-1 mb-2">
                                            {[1,2,3,4,5].map(star => (
                                                <button key={star} onClick={() => setNewReview({...newReview, rating: star})}>
                                                    <Star size={24} className={star <= newReview.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}/>
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input 
                                                value={newReview.comment} 
                                                onChange={e => setNewReview({...newReview, comment: e.target.value})}
                                                placeholder="Write a comment..." 
                                                className="flex-1 bg-white dark:bg-gray-800 rounded-lg px-3 py-3 text-sm outline-none border border-gray-200 dark:border-gray-700 dark:text-white"
                                                onClick={e => e.stopPropagation()} // Prevent Modal closing
                                            />
                                            <button onClick={handleSubmitReview} disabled={isSubmittingReview || !newReview.comment.trim()} className="bg-primary text-white px-4 rounded-lg">
                                                {isSubmittingReview ? <Loader2 className="animate-spin" size={20}/> : <Send size={20}/>}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 mb-4 italic">Login to write a review.</p>
                                )}

                                {/* Reviews List */}
                                <div className="space-y-4">
                                    {reviews.map(review => (
                                        <div key={review.id} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-bold text-sm dark:text-white">{review.user_name}</span>
                                                <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex gap-0.5 mb-2">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={12} className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}/>
                                                ))}
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">{review.comment}</p>
                                        </div>
                                    ))}
                                    {reviews.length === 0 && <p className="text-gray-400 text-sm">No reviews yet.</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sticky Bottom Actions */}
                    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 safe-bottom">
                            <div className="flex gap-3">
                            <button 
                                onClick={confirmAddToCart} 
                                disabled={selectedProductDetail.sizes && selectedProductDetail.sizes.length > 0 && !selectedSize}
                                className="w-full py-4 bg-orange-500 text-white font-bold rounded-full disabled:opacity-50 shadow-lg shadow-orange-500/30 text-lg"
                            >
                                {t('addToCart')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* RENDER VIRTUAL FITTING ROOM */}
            <VirtualFittingRoom 
                isOpen={showFittingRoom} 
                onClose={() => setShowFittingRoom(false)} 
                initialProduct={selectedProductDetail}
                onAddToCart={(product, size) => {
                    addToCartInternal(product, size);
                    setSelectedProductDetail(null); // Close main modal too if desired
                    setShowFittingRoom(false);
                }}
            />
        </div>
    );
};

export default Store;
