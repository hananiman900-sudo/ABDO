
import React, { useState, useEffect } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { Product, CartItem, AuthenticatedUser, AdRequest } from '../types';
import { supabase } from '../services/supabaseClient';
import { ShoppingBag, ShoppingCart, X, Check, Loader2, ArrowLeft, Truck, Star, Heart, Send, Settings, Image as ImageIcon, Plus } from 'lucide-react';

interface StoreProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: AuthenticatedUser | null;
    onOpenAuth: () => void;
}

const Store: React.FC<StoreProps> = ({ isOpen, onClose, currentUser, onOpenAuth }) => {
    const { t } = useLocalization();
    const [products, setProducts] = useState<any[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [view, setView] = useState<'catalog' | 'cart' | 'admin'>('catalog');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showWelcome, setShowWelcome] = useState(true);
    const [adRequests, setAdRequests] = useState<AdRequest[]>([]);
    const [loading, setLoading] = useState(false);

    // Categories
    const categories = ['category_clothes', 'category_electronics', 'category_accessories', 'category_home', 'category_beauty'];

    const isAdmin = currentUser?.phone === '0617774846' && currentUser?.accountType === 'PROVIDER';

    useEffect(() => {
        if(isOpen) fetchProducts();
    }, [isOpen]);

    const fetchProducts = async () => {
        const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        setProducts(data || []);
    };

    const fetchAdRequests = async () => {
        const { data } = await supabase.from('provider_ad_requests').select('*, providers(name, phone)').order('created_at', { ascending: false });
        setAdRequests(data as any || []);
    }

    const handleApproveAd = async (req: AdRequest) => {
        // Approve: Move to system announcements
        await supabase.from('system_announcements').insert({ title: req.providers?.name || 'Offer', message: req.message, image_url: req.image_url, is_active: true });
        // Update request status
        await supabase.from('provider_ad_requests').update({ status: 'approved' }).eq('id', req.id);
        fetchAdRequests();
    }

    const handleCheckout = async () => {
        if(!currentUser) { onOpenAuth(); return; }
        setLoading(true);
        // Simple Checkout: Only ID, Amount, Items. Name/Phone come from currentUser or basic inputs.
        // We simplified the orders table in previous steps to accept basic info.
        await supabase.from('orders').insert({
            user_id: currentUser.id,
            user_type: currentUser.accountType,
            total_amount: cart.reduce((a,b) => a + b.price * b.quantity, 0),
            items: cart,
            status: 'pending',
            customer_details: { name: currentUser.name, phone: currentUser.phone }
        });
        setCart([]);
        alert(t('orderPlaced'));
        setLoading(false);
        setView('catalog');
    }

    const addToCart = (p: Product) => {
        setCart(prev => {
            const ex = prev.find(i => i.id === p.id);
            if(ex) return prev.map(i => i.id === p.id ? {...i, quantity: i.quantity + 1} : i);
            return [...prev, {...p, quantity: 1}];
        });
        setSelectedProduct(null);
    }

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0 md:p-4">
            <div className="bg-gray-100 w-full h-full md:rounded-3xl flex flex-col overflow-hidden relative">
                {/* Header */}
                <div className="bg-white p-3 flex justify-between items-center shadow-sm z-10">
                    <button onClick={onClose}><ArrowLeft/></button>
                    <h2 className="font-bold text-lg">{view === 'admin' ? t('adminPanel') : t('shop')}</h2>
                    <div className="flex gap-3">
                        {isAdmin && <button onClick={() => { setView('admin'); fetchAdRequests(); }}><Settings/></button>}
                        <button onClick={() => setView('cart')} className="relative"><ShoppingCart/> {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{cart.length}</span>}</button>
                    </div>
                </div>

                {/* Horizontal Categories */}
                {view === 'catalog' && (
                    <div className="bg-white border-b overflow-x-auto whitespace-nowrap p-2 flex gap-2 no-scrollbar">
                         {categories.map(c => <span key={c} className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600">{t(c)}</span>)}
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
                                            <p className="text-[10px] text-gray-400">{r.providers?.phone}</p>
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
                            <h3 className="font-bold text-lg mb-4 text-center">{t('checkout')}</h3>
                            {cart.map(i => (
                                <div key={i.id} className="flex justify-between border-b py-2">
                                    <span className="text-sm">{i.name} x{i.quantity}</span>
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
                            <button onClick={handleCheckout} className="w-full bg-orange-600 text-white py-3 rounded-full font-bold shadow-lg">{loading ? <Loader2 className="animate-spin mx-auto"/> : t('checkout')}</button>
                        </div>
                    ) : (
                        /* TEMU STYLE GRID */
                        <div className="grid grid-cols-2 gap-1 p-1 pb-20">
                             {products.map(p => (
                                 <div key={p.id} onClick={() => setSelectedProduct(p)} className="bg-white p-2 flex flex-col gap-1 cursor-pointer">
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
                                         <span className="text-[10px] text-gray-400">4.9 sold(500)</span>
                                     </div>
                                     <button className="w-full mt-1 border border-orange-500 text-orange-500 text-[10px] rounded-full py-1 font-bold">{t('addToCart')}</button>
                                 </div>
                             ))}
                             {products.length === 0 && <p className="col-span-2 text-center py-10 text-gray-400">{t('loading')}</p>}
                        </div>
                    )}
                </div>

                {/* PRODUCT DETAIL FULL SCREEN */}
                {selectedProduct && (
                    <div className="absolute inset-0 z-40 bg-white flex flex-col animate-slide-up">
                        <div className="absolute top-0 w-full p-4 flex justify-between z-10">
                            <button onClick={() => setSelectedProduct(null)} className="w-10 h-10 bg-black/20 rounded-full flex items-center justify-center text-white backdrop-blur"><ArrowLeft/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto pb-20">
                            <img src={selectedProduct.image_url} className="w-full h-[50vh] object-cover"/>
                            <div className="p-4 -mt-4 bg-white rounded-t-3xl relative">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="text-3xl font-black text-orange-600">{selectedProduct.price} <span className="text-sm">DH</span></div>
                                    <div className="flex gap-2 text-gray-500"><Heart/><Send/></div>
                                </div>
                                <h1 className="text-lg font-medium mb-4">{selectedProduct.name}</h1>
                                <div className="p-3 bg-orange-50 rounded-xl mb-4 border border-orange-100">
                                    <p className="text-xs font-bold text-orange-700 flex items-center gap-2"><Truck size={14}/> {t('freeDelivery')}</p>
                                    <p className="text-[10px] text-orange-600 mt-1">{t('storeWelcomeMsg')}</p>
                                </div>
                                <h4 className="font-bold text-sm mb-2">{t('description')}</h4>
                                <p className="text-sm text-gray-600">{selectedProduct.description}</p>
                            </div>
                        </div>
                        <div className="absolute bottom-0 w-full p-4 bg-white border-t flex gap-2">
                             <button className="flex-1 py-3 border rounded-full font-bold">Chat</button>
                             <button onClick={() => addToCart(selectedProduct)} className="flex-[2] py-3 bg-orange-600 text-white rounded-full font-bold shadow-lg">{t('addToCart')}</button>
                        </div>
                    </div>
                )}

                {/* Welcome Modal */}
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
