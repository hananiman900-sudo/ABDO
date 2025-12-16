
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { AuthenticatedUser, ProviderAd, AdComment, Product } from '../types';
import { useLocalization } from '../hooks/useLocalization';
import { Heart, MessageCircle, Send, MoreVertical, X, Loader2, UserPlus, UserCheck, Star, MapPin, Search, ShoppingBag, Calendar, MessageSquare, Gem } from 'lucide-react';
import { UrgentTicker, ChatProfileModal } from './Chatbot';

interface FeedProps {
    currentUser: AuthenticatedUser | null;
    onOpenAuth: () => void;
    onOpenNotifications: () => void;
    onOpenProfile: (provider: any) => void;
    onChatWithProvider: (provider: any, message?: string) => void;
    onViewProduct: (product: Product) => void;
}

export const Feed: React.FC<FeedProps> = ({ currentUser, onOpenAuth, onOpenNotifications, onOpenProfile, onChatWithProvider, onViewProduct }) => {
    const { t } = useLocalization();
    const [ads, setAds] = useState<ProviderAd[]>([]);
    const [loading, setLoading] = useState(false);
    const [suggestedProviders, setSuggestedProviders] = useState<any[]>([]);
    const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Comments Logic
    const [openCommentsId, setOpenCommentsId] = useState<number | null>(null);
    const [comments, setComments] = useState<AdComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [commentLoading, setCommentLoading] = useState(false);

    // Profile Modal Logic (for internal navigation)
    const [viewingProvider, setViewingProvider] = useState<any | null>(null);
    
    // 3-Dot Menu State
    const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

    useEffect(() => {
        fetchFeed();
        fetchSuggestions();
    }, [currentUser]);

    const fetchFeed = async () => {
        setLoading(true);
        try {
            // 1. Get Ads from Followed Providers OR Sponsored Ads
            let query = supabase
                .from('provider_ads')
                .select('*, providers!inner(id, name, profile_image_url, location, service_type, phone, neighborhood), ad_likes(user_id), ad_comments(count)')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            const { data: allAds, error } = await query;
            
            if (error) throw error;

            let filteredAds = allAds || [];

            if (currentUser) {
                const { data: follows } = await supabase.from('follows').select('provider_id').eq('client_id', currentUser.id);
                const followedIds = new Set(follows?.map(f => f.provider_id));

                filteredAds = filteredAds.filter((ad: any) => {
                    const isSponsored = ad.is_sponsored && ad.sponsored_end_date && new Date(ad.sponsored_end_date) > new Date();
                    const isFollowed = followedIds.has(ad.provider_id);
                    return isSponsored || isFollowed;
                });

                filteredAds = filteredAds.map((ad: any) => ({
                    ...ad,
                    likes_count: ad.ad_likes?.length || 0,
                    comments_count: ad.ad_comments?.[0]?.count || 0,
                    user_has_liked: ad.ad_likes?.some((l: any) => l.user_id === currentUser.id)
                }));
            } else {
                filteredAds = filteredAds.filter((ad: any) => 
                    ad.is_sponsored && ad.sponsored_end_date && new Date(ad.sponsored_end_date) > new Date()
                );
            }

            setAds(filteredAds);

        } catch (e) {
            console.error("Feed Error", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchSuggestions = async () => {
        try {
            // ... (Existing Logic) ...
            let followedIds: number[] = [];
            if (currentUser) {
                const { data: follows } = await supabase.from('follows').select('provider_id').eq('client_id', currentUser.id);
                if (follows) followedIds = follows.map(f => f.provider_id);
            }

            let providerQuery = supabase.from('providers').select('*').eq('is_active', true).limit(15);
            if (currentUser && currentUser.neighborhood) {
                const { data: hoodProviders } = await supabase.from('providers').select('*').eq('is_active', true).eq('neighborhood', currentUser.neighborhood).limit(10);
                if (hoodProviders && hoodProviders.length > 0) {
                    const newInHood = hoodProviders.filter(p => !followedIds.includes(p.id));
                    setSuggestedProviders(newInHood.length > 0 ? newInHood : []);
                } else {
                    const { data: popular } = await providerQuery.order('visits_count', { ascending: false });
                    setSuggestedProviders((popular || []).filter(p => !followedIds.includes(p.id)).slice(0, 10));
                }
            } else {
                const { data: popular } = await providerQuery.order('visits_count', { ascending: false });
                setSuggestedProviders((popular || []).filter(p => !followedIds.includes(p.id)).slice(0, 10));
            }

            // Fetch Store Suggestions
            const { data: products } = await supabase.from('products').select('*').limit(10);
            setSuggestedProducts(products || []);

            // FETCH FEATURED PRODUCTS FOR ADS
            const { data: featured } = await supabase.from('products').select('*').eq('is_featured', true).limit(5);
            setFeaturedProducts(featured || []);

        } catch (e) {
            console.error("Suggestion Error", e);
        }
    };

    const handleLike = async (adId: number) => {
        if (!currentUser) return onOpenAuth();

        const adIndex = ads.findIndex(a => a.id === adId);
        if (adIndex === -1) return;

        const ad = ads[adIndex];
        const isLiked = ad.user_has_liked;
        
        const newAds = [...ads];
        newAds[adIndex] = {
            ...ad,
            user_has_liked: !isLiked,
            likes_count: (ad.likes_count || 0) + (isLiked ? -1 : 1)
        };
        setAds(newAds);

        if (isLiked) {
            await supabase.from('ad_likes').delete().match({ ad_id: adId, user_id: currentUser.id });
        } else {
            await supabase.from('ad_likes').insert({ ad_id: adId, user_id: currentUser.id });
        }
    };

    const openComments = async (adId: number) => {
        setOpenCommentsId(adId);
        setCommentLoading(true);
        const { data } = await supabase.from('ad_comments').select('*').eq('ad_id', adId).order('created_at', { ascending: true });
        setComments(data || []);
        setCommentLoading(false);
    };

    const submitComment = async () => {
        if (!currentUser || !newComment.trim() || !openCommentsId) return;
        setCommentLoading(true);
        const { error } = await supabase.from('ad_comments').insert({ ad_id: openCommentsId, user_id: currentUser.id, user_name: currentUser.name, comment: newComment });
        if (!error) {
            setNewComment('');
            const { data } = await supabase.from('ad_comments').select('*').eq('ad_id', openCommentsId).order('created_at', { ascending: true });
            setComments(data || []);
            setAds(prev => prev.map(a => a.id === openCommentsId ? { ...a, comments_count: (a.comments_count || 0) + 1 } : a));
        }
        setCommentLoading(false);
    };

    const handleImageClick = (ad: ProviderAd) => {
        onChatWithProvider(ad.providers, `سلام، شفت المنشور ديالك: "${ad.message.substring(0, 30)}..."`);
    };

    // --- RENDER HELPERS ---
    
    // Render Featured Product Ad
    const renderFeaturedProduct = (index: number) => {
        // Map index to a specific featured product
        const prodIndex = index % (featuredProducts.length || 1);
        const product = featuredProducts[prodIndex];
        
        if (!product) return null;

        return (
            <div key={`featured-${product.id}-${index}`} className="bg-white dark:bg-gray-800 border-y dark:border-gray-700 sm:border sm:rounded-xl sm:mx-2 sm:shadow-sm mb-3 overflow-hidden transform transition-all hover:scale-[1.01] cursor-pointer" onClick={() => onViewProduct(product)}>
                {/* Header */}
                <div className="p-3 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800 border-b border-purple-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <div className="bg-purple-600 text-white p-1 rounded-md">
                            <ShoppingBag size={14}/>
                        </div>
                        <div>
                            <h4 className="font-bold text-xs dark:text-white">متجر طنجة (Store)</h4>
                            <span className="text-[9px] bg-purple-200 text-purple-800 px-1.5 rounded font-bold uppercase">Featured</span>
                        </div>
                    </div>
                    <button className="text-purple-600 text-xs font-bold bg-white px-3 py-1 rounded-full shadow-sm">شراء الآن</button>
                </div>

                {/* Image */}
                <div className="relative aspect-square w-full bg-gray-100">
                    <img src={product.image_url} className="w-full h-full object-cover"/>
                    <div className="absolute bottom-0 left-0 bg-black/60 text-white px-3 py-1 text-sm font-bold rounded-tr-xl">
                        {product.price} DH
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">{product.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
                </div>
            </div>
        );
    };

    const renderProviderSuggestions = () => {
        if (suggestedProviders.length === 0) return null;
        return (
            <div className="py-4 bg-white dark:bg-gray-800 border-y dark:border-gray-700 mb-3 animate-fade-in">
                <div className="flex justify-between px-4 mb-3">
                    <h4 className="font-bold text-sm dark:text-white">
                        {currentUser?.neighborhood ? `اقتراحات في ${currentUser.neighborhood}` : t('suggestedProviders')}
                    </h4>
                    <button className="text-blue-600 text-xs font-bold">See all</button>
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-2">
                    {suggestedProviders.map(p => (
                        <div key={p.id} className="w-32 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 p-3 rounded-xl flex flex-col items-center shrink-0 relative">
                            <div onClick={() => setViewingProvider(p)} className="w-14 h-14 rounded-full bg-gray-200 mb-2 overflow-hidden border cursor-pointer">
                                <img src={p.profile_image_url || `https://ui-avatars.com/api/?name=${p.name}`} className="w-full h-full object-cover"/>
                            </div>
                            <h5 className="font-bold text-xs truncate w-full text-center dark:text-white">{p.name}</h5>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2 truncate w-full text-center">{p.service_type}</p>
                            <button onClick={() => onChatWithProvider(p)} className="w-full bg-blue-600 text-white text-[10px] py-1.5 rounded-lg font-bold">Follow</button>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Filter Logic based on search query
    const displayedAds = ads.filter(ad => 
        ad.message.toLowerCase().includes(searchQuery.toLowerCase()) || 
        ad.providers?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900 relative" onClick={() => setActiveMenuId(null)}>
            {/* Header: Logo + UrgentTicker */}
            <div className="bg-white dark:bg-gray-800 sticky top-0 z-30 shadow-sm">
                <UrgentTicker onClick={onOpenNotifications} currentUser={currentUser} />
                <div className="bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700 py-1.5 px-3 flex items-center gap-3">
                    <div className="flex-1 flex items-center bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-full px-3 py-1 shadow-sm">
                        <Search size={14} className="text-gray-400"/>
                        {/* Search Input for FEED filtering */}
                        <input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ابحث عن منشور أو مهني..." 
                            className="bg-transparent border-none outline-none text-xs flex-1 mx-2 dark:text-white" 
                        />
                    </div>
                    <div className="flex gap-2 overflow-hidden h-6 items-center">
                        <span className="text-[10px] text-gray-500 whitespace-nowrap animate-pulse">🔥 عروض حصرية اليوم!</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-20">
                <div className="pt-2">
                    {loading && <div className="flex justify-center py-10"><Loader2 className="animate-spin"/></div>}
                    {!loading && displayedAds.length === 0 && (
                        <div className="text-center py-20 text-gray-400">
                            <p>{t('noPosts')}</p>
                            <p className="text-xs">Follow providers to see their posts here.</p>
                        </div>
                    )}

                    {displayedAds.map((ad, index) => {
                        const isSponsored = ad.is_sponsored && ad.sponsored_end_date && new Date(ad.sponsored_end_date) > new Date();
                        
                        return (
                            <React.Fragment key={ad.id}>
                                {/* INJECTION LOGIC */}
                                {index === 2 && featuredProducts.length > 0 && renderFeaturedProduct(0)}
                                {index === 4 && renderProviderSuggestions()}
                                {index === 6 && featuredProducts.length > 1 && renderFeaturedProduct(1)}

                                <div className="bg-white dark:bg-gray-800 border-y dark:border-gray-700 sm:border sm:rounded-xl sm:mx-2 sm:shadow-sm mb-3">
                                    {/* Post Header */}
                                    <div className="p-3 flex items-center justify-between relative">
                                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setViewingProvider(ad.providers)}>
                                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border dark:border-gray-600">
                                                <img src={ad.providers?.profile_image_url || `https://ui-avatars.com/api/?name=${ad.providers?.name}`} className="w-full h-full object-cover"/>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-sm dark:text-white">{ad.providers?.name}</h4>
                                                    {isSponsored && (
                                                        <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 rounded font-bold uppercase tracking-wide">
                                                            {t('sponsored')}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                    {ad.providers?.neighborhood || ad.providers?.location || 'Tangier'}
                                                </p>
                                            </div>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === ad.id ? null : ad.id); }} className="text-gray-400 p-1 hover:bg-gray-100 rounded-full"><MoreVertical size={20}/></button>
                                        {activeMenuId === ad.id && (
                                            <div className="absolute top-10 right-4 bg-white dark:bg-gray-900 border dark:border-gray-700 shadow-xl rounded-xl z-10 w-40 overflow-hidden animate-fade-in">
                                                <button onClick={() => { onChatWithProvider(ad.providers, "I want to book an appointment"); setActiveMenuId(null); }} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 dark:text-white font-bold"><Calendar size={16} className="text-blue-600"/> {t('bookAppointment')}</button>
                                                <button onClick={() => { setViewingProvider(ad.providers); setActiveMenuId(null); }} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 dark:text-white"><UserPlus size={16}/> {t('viewProfile')}</button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Post Image */}
                                    {ad.image_url && (
                                        <div className="w-full bg-gray-100 dark:bg-black relative cursor-pointer" onClick={() => handleImageClick(ad)}>
                                            <img src={ad.image_url} className="w-full h-auto max-h-[500px] object-cover"/>
                                            {isSponsored && (
                                                <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent text-white py-3 px-4 flex justify-between items-center">
                                                    <span className="font-bold text-xs">{t('bookAppointment')}</span>
                                                    <div className="bg-white/20 p-1 rounded-full"><Star size={12} className="fill-white"/></div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Action Bar */}
                                    <div className="p-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-4">
                                                <button onClick={() => handleLike(ad.id)} className="transition-transform active:scale-125"><Heart size={26} className={ad.user_has_liked ? "fill-red-500 text-red-500" : "text-gray-800 dark:text-white"}/></button>
                                                <button onClick={() => openComments(ad.id)}><MessageCircle size={26} className="text-gray-800 dark:text-white -rotate-90"/></button>
                                                <button onClick={() => navigator.share?.({ title: 'TangerConnect', text: ad.message, url: window.location.href })}><Send size={26} className="text-gray-800 dark:text-white"/></button>
                                            </div>
                                            <a href={`https://wa.me/${ad.providers?.phone?.replace(/\s/g, '').replace(/^0/, '212')}?text=Saw your post on TangerConnect`} target="_blank" rel="noreferrer" className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 hover:bg-green-200"><img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-4 h-4"/>{t('contactProvider')}</a>
                                        </div>
                                        <p className="font-bold text-sm mb-1 dark:text-white">{(ad.likes_count || 0)} {t('like')}</p>
                                        <p className="text-sm dark:text-gray-300 mb-1"><span className="font-bold mr-2 text-black dark:text-white">{ad.providers?.name}</span>{ad.message}</p>
                                        {ad.comments_count && ad.comments_count > 0 ? (<button onClick={() => openComments(ad.id)} className="text-gray-500 text-xs mt-1">View all {ad.comments_count} comments</button>) : null}
                                        <p className="text-[10px] text-gray-400 mt-2 uppercase">{new Date(ad.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Comments Modal */}
            {openCommentsId && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex justify-center items-end sm:items-center p-0 sm:p-4">
                    <div className="bg-white dark:bg-gray-900 w-full sm:max-w-md h-[70vh] sm:rounded-2xl rounded-t-2xl flex flex-col overflow-hidden animate-slide-up">
                        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center"><h3 className="font-bold dark:text-white">{t('comment')}s</h3><button onClick={() => setOpenCommentsId(null)}><X className="dark:text-white"/></button></div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {commentLoading && <Loader2 className="animate-spin mx-auto"/>}
                            {comments.map(c => (<div key={c.id} className="flex gap-3"><div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-xs shrink-0">{c.user_name.charAt(0)}</div><div><p className="text-xs font-bold dark:text-white">{c.user_name}</p><p className="text-sm text-gray-700 dark:text-gray-300">{c.comment}</p></div></div>))}
                        </div>
                        <div className="p-3 border-t dark:border-gray-700 flex gap-2"><input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder={t('writeComment')} className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 text-sm outline-none dark:text-white"/><button onClick={submitComment} disabled={!newComment.trim()} className="text-blue-600 font-bold px-2">{t('save')}</button></div>
                    </div>
                </div>
            )}

            {viewingProvider && <ChatProfileModal provider={viewingProvider} onClose={() => setViewingProvider(null)} currentUser={currentUser} />}
        </div>
    );
};
