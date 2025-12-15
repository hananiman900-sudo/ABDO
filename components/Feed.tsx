
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { AuthenticatedUser, ProviderAd, AdComment } from '../types';
import { useLocalization } from '../hooks/useLocalization';
import { Heart, MessageCircle, Send, MoreVertical, X, Loader2, UserPlus, UserCheck, Star, MapPin } from 'lucide-react';
import { UrgentTicker, ChatProfileModal } from './Chatbot';

interface FeedProps {
    currentUser: AuthenticatedUser | null;
    onOpenAuth: () => void;
    onOpenNotifications: () => void;
    onOpenProfile: (provider: any) => void;
}

export const Feed: React.FC<FeedProps> = ({ currentUser, onOpenAuth, onOpenNotifications, onOpenProfile }) => {
    const { t } = useLocalization();
    const [ads, setAds] = useState<ProviderAd[]>([]);
    const [loading, setLoading] = useState(false);
    const [suggestedProviders, setSuggestedProviders] = useState<any[]>([]);
    
    // Comments Logic
    const [openCommentsId, setOpenCommentsId] = useState<number | null>(null);
    const [comments, setComments] = useState<AdComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [commentLoading, setCommentLoading] = useState(false);

    // Profile Modal Logic (for internal navigation)
    const [viewingProvider, setViewingProvider] = useState<any | null>(null);

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
                // Get list of providers user follows
                const { data: follows } = await supabase.from('follows').select('provider_id').eq('client_id', currentUser.id);
                const followedIds = new Set(follows?.map(f => f.provider_id));

                // Filter: Show if (Sponsored AND Valid Date) OR (Followed)
                filteredAds = filteredAds.filter((ad: any) => {
                    const isSponsored = ad.is_sponsored && ad.sponsored_end_date && new Date(ad.sponsored_end_date) > new Date();
                    const isFollowed = followedIds.has(ad.provider_id);
                    return isSponsored || isFollowed;
                });

                // Process likes
                filteredAds = filteredAds.map((ad: any) => ({
                    ...ad,
                    likes_count: ad.ad_likes?.length || 0,
                    comments_count: ad.ad_comments?.[0]?.count || 0,
                    user_has_liked: ad.ad_likes?.some((l: any) => l.user_id === currentUser.id)
                }));
            } else {
                // Guest: Show only Sponsored Ads
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
        // Fetch top 10 active providers
        const { data } = await supabase.from('providers').select('*').eq('is_active', true).order('visits_count', { ascending: false }).limit(10);
        setSuggestedProviders(data || []);
    };

    const handleLike = async (adId: number) => {
        if (!currentUser) return onOpenAuth();

        const adIndex = ads.findIndex(a => a.id === adId);
        if (adIndex === -1) return;

        const ad = ads[adIndex];
        const isLiked = ad.user_has_liked;
        
        // Optimistic Update
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
        const { error } = await supabase.from('ad_comments').insert({
            ad_id: openCommentsId,
            user_id: currentUser.id,
            user_name: currentUser.name,
            comment: newComment
        });

        if (!error) {
            setNewComment('');
            // Refresh comments
            const { data } = await supabase.from('ad_comments').select('*').eq('ad_id', openCommentsId).order('created_at', { ascending: true });
            setComments(data || []);
            
            // Update counts locally
            setAds(prev => prev.map(a => a.id === openCommentsId ? { ...a, comments_count: (a.comments_count || 0) + 1 } : a));
        }
        setCommentLoading(false);
    };

    const handleProviderClick = (provider: any) => {
        setViewingProvider(provider);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 relative">
            {/* Header: Logo + UrgentTicker */}
            <div className="bg-white dark:bg-gray-800 sticky top-0 z-20 shadow-sm">
                <UrgentTicker onClick={onOpenNotifications} currentUser={currentUser} />
            </div>

            <div className="flex-1 overflow-y-auto pb-20">
                {/* Stories / Suggested Providers */}
                <div className="bg-white dark:bg-gray-800 py-3 mb-2 border-b dark:border-gray-700">
                    <div className="flex gap-3 overflow-x-auto no-scrollbar px-4">
                        {suggestedProviders.map(p => (
                            <div key={p.id} className="flex flex-col items-center gap-1 cursor-pointer w-16 flex-shrink-0" onClick={() => handleProviderClick(p)}>
                                <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 to-purple-600">
                                    <div className="w-full h-full rounded-full border-2 border-white dark:border-gray-800 overflow-hidden bg-gray-200">
                                        <img src={p.profile_image_url || `https://ui-avatars.com/api/?name=${p.name}`} className="w-full h-full object-cover"/>
                                    </div>
                                </div>
                                <span className="text-[10px] truncate w-full text-center font-medium dark:text-gray-300">{p.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Feed List */}
                <div className="space-y-3">
                    {loading && <div className="flex justify-center py-10"><Loader2 className="animate-spin"/></div>}
                    {!loading && ads.length === 0 && (
                        <div className="text-center py-20 text-gray-400">
                            <p>{t('noPosts')}</p>
                            <p className="text-xs">Follow providers to see their posts here.</p>
                        </div>
                    )}

                    {ads.map(ad => {
                        const isSponsored = ad.is_sponsored && ad.sponsored_end_date && new Date(ad.sponsored_end_date) > new Date();
                        return (
                            <div key={ad.id} className="bg-white dark:bg-gray-800 border-y dark:border-gray-700 sm:border sm:rounded-xl sm:mx-2 sm:shadow-sm">
                                {/* Post Header */}
                                <div className="p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleProviderClick(ad.providers)}>
                                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border dark:border-gray-600">
                                            <img src={ad.providers?.profile_image_url || `https://ui-avatars.com/api/?name=${ad.providers?.name}`} className="w-full h-full object-cover"/>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-sm dark:text-white">{ad.providers?.name}</h4>
                                                {isSponsored && (
                                                    <span className="text-[9px] bg-gray-100 dark:bg-gray-700 text-gray-500 px-1.5 rounded font-medium uppercase tracking-wide">
                                                        {t('sponsored')}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                {ad.providers?.neighborhood || ad.providers?.location || 'Tangier'}
                                            </p>
                                        </div>
                                    </div>
                                    <button className="text-gray-400"><MoreVertical size={20}/></button>
                                </div>

                                {/* Post Image */}
                                {ad.image_url && (
                                    <div className="w-full bg-gray-100 dark:bg-black relative">
                                        <img src={ad.image_url} className="w-full h-auto max-h-[500px] object-cover" onDoubleClick={() => handleLike(ad.id)}/>
                                        {isSponsored && (
                                            <div onClick={() => handleProviderClick(ad.providers)} className="absolute bottom-0 w-full bg-blue-600/90 text-white py-2 px-4 flex justify-between items-center cursor-pointer backdrop-blur-sm">
                                                <span className="font-bold text-xs">{t('bookAppointment')}</span>
                                                <Star size={14} className="fill-white"/>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Action Bar */}
                                <div className="p-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => handleLike(ad.id)} className="transition-transform active:scale-125">
                                                <Heart size={26} className={ad.user_has_liked ? "fill-red-500 text-red-500" : "text-gray-800 dark:text-white"}/>
                                            </button>
                                            <button onClick={() => openComments(ad.id)}>
                                                <MessageCircle size={26} className="text-gray-800 dark:text-white -rotate-90"/>
                                            </button>
                                            <button onClick={() => navigator.share?.({ title: 'TangerConnect', text: ad.message, url: window.location.href })}>
                                                <Send size={26} className="text-gray-800 dark:text-white"/>
                                            </button>
                                        </div>
                                        
                                        {/* WhatsApp Button */}
                                        <a href={`https://wa.me/${ad.providers?.phone?.replace(/\s/g, '').replace(/^0/, '212')}?text=Saw your post on TangerConnect`} target="_blank" rel="noreferrer" className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 hover:bg-green-200">
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-4 h-4"/>
                                            {t('contactProvider')}
                                        </a>
                                    </div>

                                    {/* Likes Count */}
                                    <p className="font-bold text-sm mb-1 dark:text-white">{(ad.likes_count || 0)} {t('like')}</p>

                                    {/* Caption */}
                                    <p className="text-sm dark:text-gray-300 mb-1">
                                        <span className="font-bold mr-2 text-black dark:text-white">{ad.providers?.name}</span>
                                        {ad.message}
                                    </p>

                                    {/* View Comments */}
                                    {ad.comments_count && ad.comments_count > 0 ? (
                                        <button onClick={() => openComments(ad.id)} className="text-gray-500 text-xs mt-1">
                                            View all {ad.comments_count} comments
                                        </button>
                                    ) : null}
                                    
                                    <p className="text-[10px] text-gray-400 mt-2 uppercase">{new Date(ad.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Comments Modal */}
            {openCommentsId && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex justify-center items-end sm:items-center p-0 sm:p-4">
                    <div className="bg-white dark:bg-gray-900 w-full sm:max-w-md h-[70vh] sm:rounded-2xl rounded-t-2xl flex flex-col overflow-hidden animate-slide-up">
                        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold dark:text-white">{t('comment')}s</h3>
                            <button onClick={() => setOpenCommentsId(null)}><X className="dark:text-white"/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {commentLoading && <Loader2 className="animate-spin mx-auto"/>}
                            {comments.map(c => (
                                <div key={c.id} className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-xs shrink-0">
                                        {c.user_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold dark:text-white">{c.user_name}</p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{c.comment}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-3 border-t dark:border-gray-700 flex gap-2">
                            <input 
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                placeholder={t('writeComment')}
                                className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 text-sm outline-none dark:text-white"
                            />
                            <button onClick={submitComment} disabled={!newComment.trim()} className="text-blue-600 font-bold px-2">
                                {t('save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Internal Profile Modal */}
            {viewingProvider && (
                <ChatProfileModal provider={viewingProvider} onClose={() => setViewingProvider(null)} currentUser={currentUser} />
            )}
        </div>
    );
};
