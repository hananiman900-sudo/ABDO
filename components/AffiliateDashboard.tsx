
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { AuthenticatedUser, AffiliatePartner, AffiliateSale } from '../types';
import { useLocalization } from '../hooks/useLocalization';
import { X, Handshake, Loader2, Copy, Wallet, TrendingUp, Users, DollarSign, Clock, Lock } from 'lucide-react';

export const AffiliateDashboard: React.FC<{ isOpen: boolean; onClose: () => void; currentUser: AuthenticatedUser }> = ({ isOpen, onClose, currentUser }) => {
    const { t } = useLocalization();
    const [partner, setPartner] = useState<AffiliatePartner | null>(null);
    const [sales, setSales] = useState<AffiliateSale[]>([]);
    const [loading, setLoading] = useState(false);
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        if(isOpen && currentUser) {
            fetchData();
        }
    }, [isOpen, currentUser]);

    const fetchData = async () => {
        setLoading(true);
        // 1. Check if user is partner
        const { data } = await supabase.from('affiliate_partners').select('*').eq('user_id', currentUser.id).single();
        if (data) {
            setPartner(data);
            // 2. Fetch Sales only if approved
            if (data.status === 'approved') {
                const { data: salesData } = await supabase.from('affiliate_sales').select('*').eq('partner_id', data.id).order('created_at', { ascending: false });
                setSales(salesData || []);
            }
        }
        setLoading(false);
    };

    const handleJoin = async () => {
        setJoining(true);
        // Generate a simple promo code: First 3 letters of name + random numbers
        const base = currentUser.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'AFF');
        const random = Math.floor(100 + Math.random() * 900);
        const code = `${base}${random}`;

        // Insert with status PENDING
        const { data, error } = await supabase.from('affiliate_partners').insert({
            user_id: currentUser.id,
            promo_code: code,
            commission_rate: 0.05, // 5%
            discount_rate: 0.10, // 10%
            status: 'pending' 
        }).select().single();

        if (error) {
            if (error.message?.includes("status")) {
                alert("Please run SQL V33 in Database Setup.");
            } else {
                alert(t('errorMessage') + ": " + error.message);
            }
        } else {
            setPartner(data);
        }
        setJoining(false);
    };

    const copyCode = () => {
        if(partner?.promo_code) {
            navigator.clipboard.writeText(partner.promo_code);
            alert(t('copied'));
        }
    };

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                    <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                        <Handshake className="text-yellow-600"/> {t('affiliateProgram')}
                    </h3>
                    <button onClick={onClose}><X className="dark:text-white"/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-900">
                    {loading ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-yellow-600"/></div>
                    ) : !partner ? (
                        // NOT JOINED YET
                        <div className="text-center py-10 space-y-6">
                            <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                                <DollarSign size={48} className="text-yellow-600"/>
                            </div>
                            <h2 className="text-2xl font-black dark:text-white">{t('joinAffiliate')}</h2>
                            <p className="text-gray-600 dark:text-gray-300 px-4">{t('affiliateDesc')}</p>
                            <button onClick={handleJoin} disabled={joining} className="w-full py-4 bg-black text-white rounded-xl font-bold shadow-lg">
                                {joining ? <Loader2 className="animate-spin mx-auto"/> : t('joinAffiliate')}
                            </button>
                        </div>
                    ) : partner.status === 'pending' ? (
                        // PENDING APPROVAL
                        <div className="text-center py-10 space-y-6">
                            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                                <Clock size={48} className="text-blue-600"/>
                            </div>
                            <h2 className="text-2xl font-black dark:text-white">طلبك قيد المراجعة</h2>
                            <p className="text-gray-600 dark:text-gray-300 px-4">
                                شكراً لانضمامك! سيقوم المسؤول بمراجعة طلبك وتفعيل كود الخصم الخاص بك قريباً (أقل من 24 ساعة).
                            </p>
                            <div className="bg-gray-100 p-4 rounded-xl text-sm font-mono">
                                Status: <span className="text-blue-600 font-bold">PENDING</span>
                            </div>
                        </div>
                    ) : partner.status === 'rejected' ? (
                        // REJECTED
                        <div className="text-center py-10 space-y-6">
                            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                                <Lock size={48} className="text-red-600"/>
                            </div>
                            <h2 className="text-2xl font-black dark:text-white">تم رفض الطلب</h2>
                            <p className="text-gray-600 dark:text-gray-300 px-4">
                                نعتذر، لم يتم قبول طلبك للانضمام لبرنامج الشركاء في الوقت الحالي.
                            </p>
                        </div>
                    ) : (
                        // APPROVED - DASHBOARD
                        <div className="space-y-6">
                            {/* Promo Code Card */}
                            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 rounded-2xl text-white text-center shadow-lg relative overflow-hidden">
                                <div className="relative z-10">
                                    <p className="text-sm font-bold uppercase opacity-90 mb-2">{t('yourCode')}</p>
                                    <div className="flex items-center justify-center gap-3">
                                        <h1 className="text-4xl font-black tracking-widest">{partner.promo_code}</h1>
                                        <button onClick={copyCode} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"><Copy size={20}/></button>
                                    </div>
                                    <p className="text-xs mt-3 bg-black/20 inline-block px-3 py-1 rounded-full">
                                        -{partner.discount_rate * 100}% للزبون | {partner.commission_rate * 100}% لك
                                    </p>
                                </div>
                                <div className="absolute -right-4 -bottom-4 opacity-10"><Wallet size={120}/></div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700">
                                    <p className="text-gray-500 text-xs font-bold uppercase">{t('totalEarnings')}</p>
                                    <p className="text-2xl font-black text-green-600">{partner.total_earnings} DH</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700">
                                    <p className="text-gray-500 text-xs font-bold uppercase">{t('salesCount')}</p>
                                    <p className="text-2xl font-black text-blue-600">{sales.length}</p>
                                </div>
                            </div>

                            {/* History */}
                            <div>
                                <h4 className="font-bold mb-3 dark:text-white flex items-center gap-2"><TrendingUp size={18}/> {t('scanHistory')} (Sales)</h4>
                                {sales.length === 0 ? (
                                    <p className="text-center text-gray-400 py-4 text-sm">No sales yet. Share your code!</p>
                                ) : (
                                    <div className="space-y-2">
                                        {sales.map(sale => (
                                            <div key={sale.id} className="bg-white dark:bg-gray-800 border dark:border-gray-700 p-3 rounded-xl flex justify-between items-center shadow-sm">
                                                <div>
                                                    <p className="font-bold text-sm dark:text-white">Order #{sale.order_id}</p>
                                                    <p className="text-[10px] text-gray-400">{new Date(sale.created_at).toLocaleDateString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-green-600">+{sale.commission} DH</p>
                                                    <p className="text-[10px] text-gray-400">Sale: {sale.amount} DH</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
