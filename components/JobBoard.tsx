
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { AuthenticatedUser, JobPost, JobComment } from '../types';
import { Briefcase, MapPin, Phone, Plus, X, User, Heart, MessageCircle, FileText, CheckCircle2, UserPlus, Filter, Search, Clock, Send, Image as ImageIcon, Loader2, ArrowLeft, Building2, Banknote, Calendar, ChevronRight, Share2, Globe } from 'lucide-react';
import { useLocalization } from '../hooks/useLocalization';

// --- DRAGGABLE FAB COMPONENT ---
const DraggableFab = ({ onClick }: { onClick: () => void }) => {
    // Initial position: Bottom Right
    const [position, setPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 100 });
    const [isDragging, setIsDragging] = useState(false);
    const offset = useRef({ x: 0, y: 0 });

    const handleStart = (clientX: number, clientY: number) => {
        setIsDragging(false);
        offset.current = {
            x: clientX - position.x,
            y: clientY - position.y
        };
    };

    const handleMove = (clientX: number, clientY: number) => {
        setIsDragging(true);
        setPosition({
            x: clientX - offset.current.x,
            y: clientY - offset.current.y
        });
    };

    // Touch Handlers
    const onTouchStart = (e: React.TouchEvent) => {
        // e.stopPropagation(); 
        handleStart(e.touches[0].clientX, e.touches[0].clientY);
    };
    
    const onTouchMove = (e: React.TouchEvent) => {
        // e.preventDefault() is handled by touchAction: none style
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    // Mouse Handlers (for PC)
    const onMouseDown = (e: React.MouseEvent) => {
        handleStart(e.clientX, e.clientY);
        const moveHandler = (moveEvent: MouseEvent) => {
            handleMove(moveEvent.clientX, moveEvent.clientY);
        };
        const upHandler = () => {
            document.removeEventListener('mousemove', moveHandler);
            document.removeEventListener('mouseup', upHandler);
        };
        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('mouseup', upHandler);
    };

    return (
        <button 
            style={{ 
                position: 'fixed', 
                left: `${position.x}px`, 
                top: `${position.y}px`, 
                touchAction: 'none' // CRITICAL: This prevents screen scrolling while dragging
            }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onMouseDown={onMouseDown}
            onClick={(e) => {
                if(!isDragging) onClick();
            }}
            className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-2xl flex items-center justify-center text-white z-[60] hover:scale-105 active:scale-95 transition-transform"
        >
            <Plus size={32}/>
        </button>
    );
};


export const JobBoard: React.FC<{ isOpen: boolean; onClose: () => void; currentUser: AuthenticatedUser | null; notify?: (msg: string, type: 'success'|'error') => void }> = ({ isOpen, onClose, currentUser, notify }) => {
    const { t, language } = useLocalization();
    const [activeTab, setActiveTab] = useState<'OFFERS' | 'TALENT'>('OFFERS');
    const [jobs, setJobs] = useState<JobPost[]>([]);
    
    // Posting State
    const [isPosting, setIsPosting] = useState(false);
    const [showPostTypeSelection, setShowPostTypeSelection] = useState(false);
    const [newJob, setNewJob] = useState({ title: '', description: '', skills: '', contact: currentUser?.phone || '', category: 'cat_other', post_type: 'EMPLOYER', image_url: '', salary: '' });
    
    // Detail View State
    const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);

    // Filters
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [loading, setLoading] = useState(false);
    
    // Comments
    const [comments, setComments] = useState<JobComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [commentLoading, setCommentLoading] = useState(false);

    // Likes
    const [userLikes, setUserLikes] = useState<number[]>([]);

    // Image Upload
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imageLoading, setImageLoading] = useState(false);

    const categories = [
        'cat_security', 'cat_nurse', 'cat_med_assistant', 'cat_reception', 'cat_services', 'cat_accountant', 'cat_other'
    ];

    // Helper for Notifications
    const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
        if(notify) notify(msg, type);
        else alert(msg);
    }

    useEffect(() => { 
        if (isOpen) {
            fetchJobs();
        }
    }, [isOpen, currentUser]);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            // Select all fields AND the count of related comments
            const { data, error } = await supabase
                .from('job_posts')
                .select('*, job_comments(count)')
                .order('created_at', { ascending: false });
            
            if (data) {
                // Transform the data to flatten comments_count
                const formattedJobs: JobPost[] = data.map((job: any) => ({
                    ...job,
                    comments_count: job.job_comments?.[0]?.count || 0
                }));
                setJobs(formattedJobs);
            }

            // Fetch Likes for this user
            if (currentUser) {
                const { data: likesData } = await supabase.from('job_likes').select('job_id').eq('user_id', currentUser.id);
                if (likesData) {
                    setUserLikes(likesData.map((l: any) => l.job_id));
                }
            }
        } catch(e) {
            console.log("Error fetching jobs", e);
        } finally {
            setLoading(false);
        }
    };

    const handleStartPost = () => {
        if (!currentUser) return showMessage(t('loginRequired'), 'error');
        setShowPostTypeSelection(true);
    }

    const selectPostType = (type: 'EMPLOYER' | 'SEEKER') => {
        setNewJob(prev => ({ ...prev, post_type: type, contact: currentUser?.phone || '' }));
        setShowPostTypeSelection(false);
        setIsPosting(true);
    }

    const handlePost = async () => {
        if (!currentUser) return showMessage(t('loginRequired'), 'error');
        const skillsArray = newJob.skills.split(',').map(s => s.trim());
        
        let finalDescription = newJob.description;
        if(newJob.salary) finalDescription += `\n\n💰 Salary: ${newJob.salary}`;

        const { error } = await supabase.from('job_posts').insert({
            user_id: currentUser.id,
            user_name: currentUser.name,
            title: newJob.title,
            description: finalDescription,
            skills: skillsArray,
            contact_phone: newJob.contact,
            category: newJob.category,
            post_type: newJob.post_type,
            image_url: newJob.image_url
        });
        
        if (!error) { 
            setIsPosting(false); 
            fetchJobs(); 
            showMessage(t('success'), 'success');
        } else {
            showMessage(t('errorMessage'), 'error');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentUser) return;
        
        setImageLoading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `job_${currentUser.id}_${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('announcement-images').upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('announcement-images').getPublicUrl(fileName);
            setNewJob(prev => ({ ...prev, image_url: data.publicUrl }));
        } catch (e) {
            showMessage(t('uploadError'), 'error');
        } finally {
            setImageLoading(false);
        }
    };

    // --- NEW LIKE LOGIC: ONE PER USER ---
    const handleLike = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation(); // Prevent opening detail view
        if(!currentUser) return showMessage(t('loginRequired'), 'error');

        const isLiked = userLikes.includes(id);
        const currentLikes = jobs.find(j => j.id === id)?.likes || 0;
        const newCount = isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;

        // Optimistic Update
        setJobs(prev => prev.map(j => j.id === id ? { ...j, likes: newCount } : j));
        setUserLikes(prev => isLiked ? prev.filter(lid => lid !== id) : [...prev, id]);

        if (isLiked) {
             // Unlike
             await supabase.from('job_likes').delete().match({ user_id: currentUser.id, job_id: id });
             await supabase.from('job_posts').update({ likes: newCount }).eq('id', id);
        } else {
             // Like
             await supabase.from('job_likes').insert({ user_id: currentUser.id, job_id: id });
             await supabase.from('job_posts').update({ likes: newCount }).eq('id', id);
        }
    };

    // Open Detail View & Fetch Comments
    const openJobDetails = async (job: JobPost) => {
        setSelectedJob(job);
        setCommentLoading(true);
        const { data } = await supabase.from('job_comments').select('*').eq('job_id', job.id).order('created_at', { ascending: true });
        setComments(data || []);
        setCommentLoading(false);
    }

    const submitComment = async () => {
        if(!currentUser || !newComment.trim() || !selectedJob) return;
        setCommentLoading(true);
        
        // 1. Insert
        const { error } = await supabase.from('job_comments').insert({
            job_id: selectedJob.id,
            user_name: currentUser.name,
            comment: newComment
        });

        if(!error) {
            setNewComment('');
            
            // 2. Refresh Comments List
            const { data } = await supabase.from('job_comments').select('*').eq('job_id', selectedJob.id).order('created_at', { ascending: true });
            setComments(data || []);

            // 3. Update Job List Count Locally
            setJobs(prev => prev.map(job => 
                job.id === selectedJob.id ? { ...job, comments_count: (job.comments_count || 0) + 1 } : job
            ));
        }
        setCommentLoading(false);
    }

    // Filter Logic - SAFE CHECK ADDED
    const safeJobs = jobs || [];
    const filteredJobs = safeJobs.filter(j => {
        const typeMatch = activeTab === 'OFFERS' ? j.post_type === 'EMPLOYER' : j.post_type === 'SEEKER';
        const catMatch = categoryFilter === 'ALL' || j.category === categoryFilter;
        return typeMatch && catMatch;
    });

    // Calculate Category Counts based on Active Tab
    const currentTabJobs = safeJobs.filter(j => activeTab === 'OFFERS' ? j.post_type === 'EMPLOYER' : j.post_type === 'SEEKER');
    const categoryCounts = categories.reduce((acc, curr) => {
        acc[curr] = currentTabJobs.filter(j => j.category === curr).length;
        return acc;
    }, {} as Record<string, number>);

    // GLOBAL COUNTS FOR TABS
    const offersCount = safeJobs.filter(j => j.post_type === 'EMPLOYER').length;
    const seekersCount = safeJobs.filter(j => j.post_type === 'SEEKER').length;

    const formatTime = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
            if(diffHrs < 24) return `${diffHrs}h ${t('postedAgo')}`;
            return date.toLocaleDateString();
        } catch (e) { return dateStr; }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-0 md:p-4">
            <div className="bg-gray-100 dark:bg-gray-900 w-full h-full md:h-[90vh] md:max-w-6xl md:rounded-3xl flex flex-col overflow-hidden animate-slide-up relative">
                
                {/* 1. Header & Navigation */}
                <div className="bg-white dark:bg-gray-800 shadow-sm z-20">
                    <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                        <div className="flex items-center gap-2">
                             {isPosting && <button onClick={() => setIsPosting(false)} className="mr-2"><ArrowLeft size={20} className="dark:text-white"/></button>}
                             <h2 className="text-xl font-bold dark:text-white flex items-center gap-2 text-blue-600">
                                <Briefcase className="text-blue-600"/> {t('jobBoardTitle')}
                            </h2>
                        </div>
                        <button onClick={onClose}><X className="dark:text-white"/></button>
                    </div>

                    {!isPosting && !selectedJob && (
                        <>
                            {/* Main Tabs */}
                            <div className="flex">
                                <button 
                                    onClick={() => setActiveTab('OFFERS')}
                                    className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'OFFERS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                                >
                                    {t('tabOffers')}
                                    {/* GREEN COUNT BADGE */}
                                    <span className="w-5 h-5 bg-green-500 text-white rounded-full text-[10px] flex items-center justify-center">{offersCount}</span>
                                </button>
                                <button 
                                    onClick={() => setActiveTab('TALENT')}
                                    className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'TALENT' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                                >
                                    {t('tabTalent')}
                                    {/* GREEN COUNT BADGE */}
                                    <span className="w-5 h-5 bg-green-500 text-white rounded-full text-[10px] flex items-center justify-center">{seekersCount}</span>
                                </button>
                            </div>

                            {/* Category Pills (Horizontal Scroll with Counts) */}
                            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700 overflow-x-auto no-scrollbar flex gap-2">
                                <button 
                                   onClick={() => setCategoryFilter('ALL')} 
                                   className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border flex items-center gap-1 ${categoryFilter === 'ALL' ? 'bg-black text-white dark:bg-white dark:text-black border-transparent' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}
                                >
                                    {t('filterAll')}
                                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] ${categoryFilter === 'ALL' ? 'bg-white text-black' : 'bg-gray-200 text-gray-700'}`}>
                                        {currentTabJobs.length}
                                    </span>
                                </button>
                                {categories.map(cat => (
                                    <button 
                                       key={cat}
                                       onClick={() => setCategoryFilter(cat)}
                                       className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border flex items-center gap-1 ${categoryFilter === cat ? 'bg-black text-white dark:bg-white dark:text-black border-transparent' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}
                                    >
                                        {t(cat)}
                                        <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] ${categoryFilter === cat ? 'bg-white text-black' : 'bg-gray-200 text-gray-700'}`}>
                                            {categoryCounts[cat] || 0}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* 2. Main Content Feed */}
                <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900 relative">
                    {!isPosting && !selectedJob && (
                        <div className="p-4">
                            {loading ? (
                                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-400" size={32}/></div>
                            ) : filteredJobs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                    <Briefcase size={48} className="mb-4 opacity-20"/>
                                    <p>{t('noPosts')}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                                    {filteredJobs.map(job => (
                                        <div 
                                            key={job.id} 
                                            onClick={() => openJobDetails(job)}
                                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all cursor-pointer group"
                                        >
                                            
                                            {/* Card Header */}
                                            <div className="p-4 flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${job.post_type === 'EMPLOYER' ? 'bg-blue-600' : 'bg-green-600'}`}>
                                                        {job.image_url ? (
                                                            <img src={job.image_url} className="w-full h-full object-cover rounded-xl"/>
                                                        ) : (
                                                            job.user_name?.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors">{job.title}</h4>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                            {job.user_name} • <Clock size={10}/> {formatTime(job.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                                {job.category && (
                                                    <span className="text-[10px] font-bold px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md">
                                                        {t(job.category)}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Description & Metadata */}
                                            <div className="px-4 pb-2 flex-1">
                                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2 whitespace-pre-line">{job.description}</p>
                                                
                                                {/* Skills Chips */}
                                                {job.skills && job.skills.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mb-3">
                                                        {job.skills.slice(0, 3).map((s, i) => (
                                                            <span key={i} className="text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 px-2 py-1 rounded-md font-medium">
                                                                {s}
                                                            </span>
                                                        ))}
                                                        {job.skills.length > 3 && <span className="text-[10px] text-gray-400">+{job.skills.length - 3}</span>}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Footer Actions */}
                                            <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                                                <div className="flex gap-4 text-gray-400">
                                                     <button onClick={(e) => handleLike(e, job.id)} className="flex items-center gap-1 hover:scale-110 transition-transform">
                                                         <Heart size={18} className={userLikes.includes(job.id) ? "fill-red-500 text-red-500" : ""}/> 
                                                         <span className="text-xs font-bold">{job.likes || 0}</span>
                                                     </button>
                                                     <div className="flex items-center gap-1 text-gray-500">
                                                         <MessageCircle size={18}/>
                                                         <span className="text-xs font-bold">{job.comments_count || 0}</span>
                                                     </div>
                                                </div>
                                                <span className="text-xs text-blue-600 font-bold flex items-center gap-1">
                                                    View Details <ChevronRight size={14}/>
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* DRAGGABLE FAB BUTTON */}
                            <DraggableFab onClick={handleStartPost} />
                        </div>
                    )}

                    {/* VIEW 3: FULL SCREEN DETAILS (Responsive Modal) */}
                    {selectedJob && (
                        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-6 animate-fade-in">
                            <div className="bg-white dark:bg-gray-900 w-full h-full md:max-w-2xl md:h-auto md:max-h-[85vh] md:rounded-3xl flex flex-col shadow-2xl relative overflow-hidden">
                                
                                {/* Details Header */}
                                <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-3 flex items-center gap-3">
                                    <button onClick={() => setSelectedJob(null)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 transition-colors">
                                        <ArrowLeft size={20} className="dark:text-white"/>
                                    </button>
                                    <h3 className="font-bold text-lg dark:text-white truncate flex-1">{selectedJob.title}</h3>
                                    <button onClick={(e) => handleLike(e, selectedJob.id)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200">
                                        <Heart size={20} className={userLikes.includes(selectedJob.id) ? "fill-red-500 text-red-500" : "text-gray-500"}/>
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto pb-20 bg-gray-50 dark:bg-gray-900">
                                    {/* Hero Section */}
                                    <div className="bg-white dark:bg-gray-800 p-6 mb-2 border-b dark:border-gray-700">
                                        <div className="flex flex-col items-center text-center mb-4">
                                            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-3xl mb-3 shadow-lg ${selectedJob.post_type === 'EMPLOYER' ? 'bg-blue-600' : 'bg-green-600'}`}>
                                                {selectedJob.image_url ? (
                                                    <img src={selectedJob.image_url} className="w-full h-full object-cover rounded-2xl"/>
                                                ) : (
                                                    selectedJob.user_name?.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <h1 className="text-2xl font-black dark:text-white mb-1">{selectedJob.title}</h1>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 font-bold">{selectedJob.user_name}</p>
                                            <div className="flex gap-2 mt-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedJob.post_type === 'EMPLOYER' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                    {selectedJob.post_type === 'EMPLOYER' ? t('iamHiring') : t('iamLooking')}
                                                </span>
                                                {selectedJob.category && <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">{t(selectedJob.category)}</span>}
                                            </div>
                                        </div>
                                        
                                        {/* Stats Row */}
                                        <div className="flex justify-around border-t border-b border-gray-100 dark:border-gray-700 py-4">
                                            <div className="text-center">
                                                <span className="block font-bold text-lg dark:text-white">{selectedJob.likes || 0}</span>
                                                <span className="text-xs text-gray-400">Likes</span>
                                            </div>
                                            <div className="text-center">
                                                <span className="block font-bold text-lg dark:text-white">{comments.length}</span>
                                                <span className="text-xs text-gray-400">Comments</span>
                                            </div>
                                            <div className="text-center">
                                                <span className="block font-bold text-lg dark:text-white">{formatTime(selectedJob.created_at)}</span>
                                                <span className="text-xs text-gray-400">Posted</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4 space-y-4">
                                        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                            <h4 className="font-bold mb-2 dark:text-white flex items-center gap-2"><FileText size={18}/> {t('description')}</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                                                {selectedJob.description}
                                            </p>
                                        </div>

                                        {selectedJob.skills && selectedJob.skills.length > 0 && (
                                            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                                <h4 className="font-bold mb-3 dark:text-white flex items-center gap-2"><CheckCircle2 size={18}/> {t('skillsPlaceholder')}</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedJob.skills.map((s, i) => (
                                                        <span key={i} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium">
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Comments Section */}
                                        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm mb-20 border border-gray-100 dark:border-gray-700">
                                            <h4 className="font-bold mb-4 dark:text-white flex items-center gap-2">
                                                <MessageCircle size={18}/> Comments ({comments.length})
                                            </h4>
                                            <div className="space-y-4 mb-4">
                                                {comments.map(c => (
                                                    <div key={c.id} className="flex gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-xs shrink-0">
                                                            {c.user_name.charAt(0)}
                                                        </div>
                                                        <div className="flex-1 bg-gray-50 dark:bg-gray-900 p-3 rounded-2xl rounded-tl-none">
                                                            <p className="text-xs font-bold text-gray-900 dark:text-white mb-1">{c.user_name}</p>
                                                            <p className="text-sm text-gray-700 dark:text-gray-300">{c.comment}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {comments.length === 0 && <p className="text-center text-gray-400 text-sm py-4">No comments yet.</p>}
                                            </div>
                                            
                                            <div className="flex gap-2 items-center">
                                                <input 
                                                    value={newComment}
                                                    onChange={e => setNewComment(e.target.value)}
                                                    placeholder={t('writeComment')}
                                                    className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-3 text-sm outline-none dark:text-white border border-transparent focus:border-blue-500 transition-colors"
                                                    onKeyPress={(e) => e.key === 'Enter' && newComment.trim() && submitComment()}
                                                />
                                                <button onClick={submitComment} disabled={!newComment.trim() || commentLoading} className="bg-blue-600 text-white p-3 rounded-full shadow-lg disabled:opacity-50 hover:bg-blue-700 transition-colors">
                                                    {commentLoading ? <Loader2 size={18} className="animate-spin"/> : <Send size={18}/>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sticky Footer Button */}
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)] rounded-b-3xl">
                                    <a 
                                        href={`https://wa.me/${selectedJob.contact_phone?.replace(/\s/g, '').replace(/^0/, '212')}?text=Hello, I saw your post on TangerConnect: ${selectedJob.title}`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className={`w-full py-4 rounded-full text-white font-bold shadow-lg flex justify-center items-center gap-2 active:scale-95 transition-transform ${selectedJob.post_type === 'EMPLOYER' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
                                    >
                                        <Send size={20}/> {selectedJob.post_type === 'EMPLOYER' ? t('applyWhatsApp') : t('hireWhatsApp')}
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* VIEW 4: CREATE POST FORM */}
                    {isPosting && (
                        <div className="max-w-md mx-auto py-4 px-4">
                            <h3 className="font-bold text-xl mb-6 dark:text-white flex items-center gap-2">{t('postNewAd')}</h3>
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm space-y-4">
                                
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t('jobCategory')}</label>
                                    <select 
                                        value={newJob.category} 
                                        onChange={e => setNewJob({...newJob, category: e.target.value})}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl dark:text-white outline-none"
                                    >
                                        {categories.map(cat => <option key={cat} value={cat}>{t(cat)}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t('jobTitle')}</label>
                                    <input 
                                        placeholder="e.g. Senior Accountant" 
                                        value={newJob.title} 
                                        onChange={e => setNewJob({...newJob, title: e.target.value})} 
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl dark:text-white outline-none"
                                    />
                                </div>

                                {newJob.post_type === 'EMPLOYER' && (
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t('salaryPlaceholder')}</label>
                                        <div className="relative">
                                            <Banknote className="absolute left-3 top-3.5 text-gray-400" size={18}/>
                                            <input 
                                                placeholder="e.g. 4000 DH" 
                                                value={newJob.salary} 
                                                onChange={e => setNewJob({...newJob, salary: e.target.value})} 
                                                className="w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl dark:text-white outline-none"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t('experienceDesc')}</label>
                                    <textarea 
                                        placeholder={t('jobDescPlaceholder')}
                                        rows={4} 
                                        value={newJob.description} 
                                        onChange={e => setNewJob({...newJob, description: e.target.value})} 
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl dark:text-white outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t('skillsPlaceholder')}</label>
                                    <input 
                                        placeholder="Excel, English..." 
                                        value={newJob.skills} 
                                        onChange={e => setNewJob({...newJob, skills: e.target.value})} 
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl dark:text-white outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Image (Optional)</label>
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-500 hover:text-blue-500 transition-colors w-full flex justify-center items-center gap-2">
                                            {imageLoading ? <Loader2 className="animate-spin"/> : <ImageIcon size={20}/>}
                                            {newJob.image_url ? "Change Image" : "Upload Photo / Logo"}
                                        </button>
                                        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageUpload} />
                                    </div>
                                    {newJob.image_url && (
                                        <div className="mt-2 h-32 w-full rounded-lg overflow-hidden border border-gray-200">
                                            <img src={newJob.image_url} className="w-full h-full object-cover"/>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 mt-6 pt-4 border-t dark:border-gray-700">
                                    <button onClick={() => setIsPosting(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white rounded-xl font-bold">{t('cancel')}</button>
                                    <button onClick={handlePost} className={`flex-1 py-3 text-white rounded-xl font-bold shadow-lg ${newJob.post_type === 'EMPLOYER' ? 'bg-blue-600' : 'bg-green-600'}`}>
                                        {t('postNow')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* MODAL: POST TYPE SELECTION */}
                {showPostTypeSelection && (
                    <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
                        <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-3xl p-6 text-center shadow-2xl border border-gray-700 relative">
                            <button onClick={() => setShowPostTypeSelection(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X/></button>
                            <h3 className="text-2xl font-bold dark:text-white mb-6">{t('chooseRole')}</h3>
                            
                            <div className="space-y-4">
                                <button 
                                    onClick={() => selectPostType('EMPLOYER')}
                                    className="w-full p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 hover:border-blue-500 transition-all group flex items-center gap-4 text-left"
                                >
                                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                                        <Building2 size={24}/>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-blue-700 dark:text-blue-300">{t('iamHiring')}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Post a job offer</p>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => selectPostType('SEEKER')}
                                    className="w-full p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 hover:border-green-500 transition-all group flex items-center gap-4 text-left"
                                >
                                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                                        <UserPlus size={24}/>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-green-700 dark:text-green-300">{t('iamLooking')}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Post my CV / Services</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
