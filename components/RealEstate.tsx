
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { AuthenticatedUser, Property } from '../types';
import { Home, MapPin, Phone, Plus, X, Image as ImageIcon, Loader2, DollarSign, Key, Tag, Building, Filter, SlidersHorizontal, ArrowLeft, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useLocalization } from '../hooks/useLocalization';

export const RealEstate: React.FC<{ isOpen: boolean; onClose: () => void; currentUser: AuthenticatedUser | null }> = ({ isOpen, onClose, currentUser }) => {
    const { t } = useLocalization();
    const [properties, setProperties] = useState<Property[]>([]);
    const [filter, setFilter] = useState<'all' | 'rent' | 'buy'>('all');
    const [locationFilter, setLocationFilter] = useState<string>('');
    const [priceRange, setPriceRange] = useState<{min: string, max: string}>({min: '', max: ''});
    
    const [isPosting, setIsPosting] = useState(false);
    const [newProp, setNewProp] = useState({ title: '', price: '', location: '', type: 'rent', description: '', contact: currentUser?.phone || '', images: [] as string[] });
    const [loading, setLoading] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);

    // Detail View State
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Get Neighborhoods List
    const neighborhoods = t('neighborhoods').split(',').map(s => s.trim());

    useEffect(() => { if (isOpen) fetchProperties(); }, [isOpen]);

    const fetchProperties = async () => {
        const { data } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
        setProperties(data || []);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file || !currentUser) return;
        
        setImageLoading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `property_${currentUser.id}_${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('announcement-images').upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('announcement-images').getPublicUrl(fileName);
            setNewProp(prev => ({ ...prev, images: [...prev.images, data.publicUrl] }));
        } catch (e) {
            alert(t('uploadError'));
        } finally {
            setImageLoading(false);
        }
    };

    const handlePost = async () => {
        if (!currentUser) return alert(t('loginRequired'));
        // Validate Location
        if(!newProp.location) return alert(t('selectNeighborhood'));
        // Validate Images - MUST HAVE AT LEAST ONE
        if(newProp.images.length === 0) return alert(t('imageRequired'));

        setLoading(true);
        const { error } = await supabase.from('properties').insert({
            agent_id: currentUser.id,
            title: newProp.title,
            price: parseFloat(newProp.price),
            location: newProp.location,
            type: newProp.type,
            description: newProp.description,
            contact_phone: newProp.contact,
            images: newProp.images
        });
        setLoading(false);
        if (error) alert(t('errorMessage'));
        else { setIsPosting(false); fetchProperties(); }
    };

    // Detail View Helpers
    const nextImage = () => {
        if (!selectedProperty?.images) return;
        setCurrentImageIndex((prev) => (prev + 1) % selectedProperty.images!.length);
    }
    const prevImage = () => {
        if (!selectedProperty?.images) return;
        setCurrentImageIndex((prev) => (prev - 1 + selectedProperty.images!.length) % selectedProperty.images!.length);
    }

    // Calculate Neighborhood Counts - SAFE CHECK
    const safeProps = properties || [];
    const neighborhoodCounts = neighborhoods.reduce((acc, curr) => {
        acc[curr] = safeProps.filter(p => p.location.includes(curr)).length;
        return acc;
    }, {} as Record<string, number>);

    const filteredProperties = safeProps.filter(p => {
        const matchesType = filter === 'all' || p.type === filter;
        const matchesLocation = locationFilter === '' || p.location.includes(locationFilter);
        const minPrice = priceRange.min ? parseFloat(priceRange.min) : 0;
        const maxPrice = priceRange.max ? parseFloat(priceRange.max) : Infinity;
        const matchesPrice = p.price >= minPrice && p.price <= maxPrice;
        return matchesType && matchesLocation && matchesPrice;
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-100 dark:bg-gray-900 w-full h-[90vh] max-w-4xl rounded-3xl flex flex-col overflow-hidden animate-slide-up relative">
                
                {/* --- HEADER --- */}
                <div className="bg-white dark:bg-gray-800 p-4 flex justify-between items-center shadow-sm border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold dark:text-white flex items-center gap-2"><Home className="text-orange-500"/> {t('realEstateTitle')}</h2>
                    <button onClick={onClose}><X className="dark:text-white"/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 relative">
                    {!isPosting ? (
                        <>
                            {/* Filter Bar */}
                            <div className="space-y-4 mb-4">
                                <div className="flex flex-col sm:flex-row justify-between gap-3">
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <div className="flex gap-2 p-1 bg-white dark:bg-gray-800 rounded-full shadow-sm w-max">
                                            <button onClick={() => setFilter('all')} className={`px-4 py-1.5 rounded-full font-bold text-sm transition-all ${filter === 'all' ? 'bg-orange-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}>{t('filterAll')}</button>
                                            <button onClick={() => setFilter('rent')} className={`px-4 py-1.5 rounded-full font-bold text-sm transition-all ${filter === 'rent' ? 'bg-orange-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}>{t('filterRent')}</button>
                                            <button onClick={() => setFilter('buy')} className={`px-4 py-1.5 rounded-full font-bold text-sm transition-all ${filter === 'buy' ? 'bg-orange-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}>{t('filterBuy')}</button>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsPosting(true)} className="bg-black dark:bg-white dark:text-black text-white px-5 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-transform whitespace-nowrap justify-center"><Plus size={18}/> {t('postAd')}</button>
                                </div>
                                
                                {/* Advanced Filtering: Price & Neighborhoods */}
                                <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                     <div className="flex gap-2 items-center mb-3">
                                         <SlidersHorizontal size={16} className="text-gray-400"/>
                                         <span className="text-xs font-bold text-gray-500 uppercase">{t('search')} & {t('price')}</span>
                                     </div>
                                     <div className="flex gap-2 mb-3">
                                         <div className="flex-1">
                                             <input 
                                                type="number" 
                                                placeholder={t('minPrice')} 
                                                value={priceRange.min}
                                                onChange={e => setPriceRange({...priceRange, min: e.target.value})}
                                                className="w-full p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm dark:text-white outline-none border border-gray-200 dark:border-gray-600"
                                             />
                                         </div>
                                         <div className="flex-1">
                                             <input 
                                                type="number" 
                                                placeholder={t('maxPrice')} 
                                                value={priceRange.max}
                                                onChange={e => setPriceRange({...priceRange, max: e.target.value})}
                                                className="w-full p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm dark:text-white outline-none border border-gray-200 dark:border-gray-600"
                                             />
                                         </div>
                                     </div>

                                     {/* Neighborhood Horizontal Scroll with COUNTS */}
                                     <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                         <button 
                                            onClick={() => setLocationFilter('')}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap border ${locationFilter === '' ? 'bg-black text-white dark:bg-white dark:text-black border-transparent' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}
                                         >
                                             {t('allNeighborhoods')} ({safeProps.length})
                                         </button>
                                         {neighborhoods.map(n => (
                                             <button 
                                                key={n}
                                                onClick={() => setLocationFilter(n)}
                                                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap border flex items-center gap-1 ${locationFilter === n ? 'bg-black text-white dark:bg-white dark:text-black border-transparent' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}
                                             >
                                                 {n}
                                                 <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${locationFilter === n ? 'bg-white text-black' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                                                     {neighborhoodCounts[n] || 0}
                                                 </span>
                                             </button>
                                         ))}
                                     </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredProperties.map(p => (
                                    <div key={p.id} onClick={() => { setSelectedProperty(p); setCurrentImageIndex(0); }} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-100 dark:border-gray-700 group cursor-pointer">
                                        <div className="h-48 bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                                            {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/> : <div className="flex items-center justify-center h-full text-gray-400"><Home size={32}/></div>}
                                            <span className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold uppercase text-white shadow-md ${p.type === 'rent' ? 'bg-blue-500' : 'bg-green-500'}`}>
                                                {p.type === 'rent' ? t('forRent') : t('forSale')}
                                            </span>
                                        </div>
                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-lg dark:text-white truncate flex-1">{p.title}</h3>
                                                <p className="text-orange-500 font-bold text-lg whitespace-nowrap ml-2">{p.price} <span className="text-xs">DH</span></p>
                                            </div>
                                            
                                            <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1 mb-3"><MapPin size={14} className="text-gray-400"/> {p.location}</p>
                                            <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-4 h-10">{p.description}</p>
                                            
                                            <div className="block w-full text-center bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 py-2.5 rounded-xl font-bold text-sm text-gray-700 dark:text-white">
                                                {t('propertyDetails')}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {filteredProperties.length === 0 && (
                                     <div className="col-span-full text-center py-10 text-gray-400">
                                        <Building size={64} className="mx-auto mb-3 opacity-20"/>
                                        <p>{t('noPosts')}</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl max-w-lg mx-auto shadow-lg border border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-xl mb-6 dark:text-white flex items-center gap-2"><Key className="text-orange-500"/> {t('postAd')}</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t('propertyTitle')}</label>
                                    <input placeholder="..." value={newProp.title} onChange={e => setNewProp({...newProp, title: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-orange-500"/>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t('propertyType')}</label>
                                        <select value={newProp.type} onChange={e => setNewProp({...newProp, type: e.target.value as any})} className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-orange-500">
                                            <option value="rent">{t('forRent')}</option>
                                            <option value="buy">{t('forSale')}</option>
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t('priceDH')}</label>
                                        <input type="number" placeholder="0" value={newProp.price} onChange={e => setNewProp({...newProp, price: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-orange-500"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t('selectNeighborhood')}</label>
                                    <select 
                                        value={newProp.location} 
                                        onChange={e => setNewProp({...newProp, location: e.target.value})} 
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="">{t('selectNeighborhood')}</option>
                                        {neighborhoods.map(n => (
                                            <option key={n} value={n}>{n}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t('description')}</label>
                                    <textarea placeholder="..." rows={3} value={newProp.description} onChange={e => setNewProp({...newProp, description: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-orange-500"/>
                                </div>
                                
                                {/* Image Upload */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Photos ({t('imageRequired')})</label>
                                    <div className="flex items-center gap-2 overflow-x-auto py-2">
                                        <label className="w-20 h-20 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-xl border border-dashed border-gray-400 flex items-center justify-center cursor-pointer hover:bg-gray-200">
                                            {imageLoading ? <Loader2 className="animate-spin text-gray-500"/> : <Plus className="text-gray-500"/>}
                                            <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                                        </label>
                                        {newProp.images.map((img, i) => (
                                            <div key={i} className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden relative">
                                                <img src={img} className="w-full h-full object-cover"/>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t('phone')}</label>
                                    <input placeholder="..." value={newProp.contact} onChange={e => setNewProp({...newProp, contact: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-orange-500"/>
                                </div>
                                
                                <div className="flex gap-3 mt-6">
                                    <button onClick={() => setIsPosting(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white rounded-xl font-bold">{t('cancel')}</button>
                                    <button onClick={handlePost} disabled={loading} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-500/30">
                                        {loading ? <Loader2 className="animate-spin mx-auto"/> : t('submitAd')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- FULL SCREEN PROPERTY DETAIL VIEW --- */}
                {selectedProperty && (
                    <div className="absolute inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col animate-slide-up">
                        <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-3 flex items-center gap-3">
                            <button onClick={() => setSelectedProperty(null)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200">
                                <ArrowLeft size={20} className="dark:text-white"/>
                            </button>
                            <h3 className="font-bold text-lg dark:text-white truncate">{selectedProperty.title}</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 pb-20">
                            {/* Image Slider */}
                            <div className="relative bg-black aspect-video w-full">
                                {selectedProperty.images && selectedProperty.images.length > 0 ? (
                                    <>
                                        <img src={selectedProperty.images[currentImageIndex]} className="w-full h-full object-contain"/>
                                        {selectedProperty.images.length > 1 && (
                                            <>
                                                <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full"><ChevronLeft/></button>
                                                <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full"><ChevronRight/></button>
                                                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1">
                                                    {selectedProperty.images.map((_, idx) => (
                                                        <div key={idx} className={`w-2 h-2 rounded-full shadow-sm ${idx === currentImageIndex ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-white"><Home size={48}/></div>
                                )}
                            </div>

                            <div className="p-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="text-3xl font-black text-orange-600">{selectedProperty.price} <span className="text-sm text-gray-500 font-normal">DH</span></div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase text-white ${selectedProperty.type === 'rent' ? 'bg-blue-500' : 'bg-green-500'}`}>
                                        {selectedProperty.type === 'rent' ? t('forRent') : t('forSale')}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-6 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm">
                                    <MapPin className="text-orange-500"/>
                                    <span className="font-bold">{selectedProperty.location}</span>
                                </div>

                                <h4 className="font-bold text-lg mb-2 dark:text-white">{t('description')}</h4>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700">
                                    {selectedProperty.description}
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 safe-area-bottom shadow-lg">
                             <a href={`tel:${selectedProperty.contact_phone}`} className="w-full py-4 bg-green-600 text-white rounded-full font-bold shadow-lg flex justify-center items-center gap-2 active:scale-95 transition-transform text-lg">
                                 <Phone size={20}/> {t('call')} {selectedProperty.contact_phone}
                             </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
