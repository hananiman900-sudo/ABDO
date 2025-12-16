
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { AuthenticatedUser, AffiliatePartner, AffiliateSale } from '../types';
import { useLocalization } from '../hooks/useLocalization';
import { X, Handshake, Loader2, Copy, Wallet, TrendingUp, Users, DollarSign, Clock, Lock, ArrowDownLeft, AlertCircle, Coins, ChevronRight } from 'lucide-react';

export const AffiliateDashboard: React.FC<{ isOpen: boolean; onClose: () => void; currentUser: AuthenticatedUser }> = ({ isOpen, onClose, currentUser }) => {
    const { t } = useLocalization();
    const [partner, setPartner] = useState<AffiliatePartner | null>(null);
    const [sales, setSales] = useState<AffiliateSale[]>([]);
    const [loading, setLoading] = useState(false);
    const [joining, setJoining] = useState(false);
    const [withdrawalLoading, setWithdrawalLoading] = useState(false);

    // Stats
    const [pendingEarnings, setPendingEarnings] = useState(0);
    const [verifiedEarnings, setVerifiedEarnings] = useState(0);
    const [withdrawnAmount, setWithdrawnAmount] = useState(0);

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
                
                // Calculate Stats
                const pending = salesData?.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.commission, 0) || 0;
                const verified = salesData?.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.commission, 0) || 0;
                setPendingEarnings(pending);
                setVerifiedEarnings(verified);

                // Fetch withdrawals
                const { data: withdrawals } = await supabase.from('withdrawal_requests').select('amount').eq('partner_id', data.id);
                const totalWithdrawn = withdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0;
                setWithdrawnAmount(totalWithdrawn);
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

        const { data, error } = await supabase.from('affiliate_partners').insert({
            user_id: currentUser.id,
            promo_code: code,
            commission_rate: 0.05,
            discount_rate: 0.10,
            status: 'pending' 
        }).select().single();

        if (error) {
            alert(t('errorMessage') + ": " + error.message);
        } else {
            setPartner(data);
        }
        setJoining(false);
    };

    const handleWithdrawal = async () => {
        if (!partner) return;
        const availableBalance = verifiedEarnings - withdrawnAmount;
        if (availableBalance < 200) {
            alert("الرصيد غير كافي. يجب أن يكون لديك 200 درهم على الأقل.");
            return;
        }

        setWithdrawalLoading(true);
        const { error } = await supabase.from('withdrawal_requests').insert({
            partner_id: partner.id,
            amount: availableBalance,
            status: 'pending'
        });

        if (!error) {
            alert("تم إرسال طلب السحب بنجاح! سيتصل بك الأدمن قريباً.");
            setWithdrawnAmount(prev => prev + availableBalance); // Optimistic update
        } else {
            alert(t('errorMessage'));
        }
        setWithdrawalLoading(false);
    };

    const copyCode = () => {
        if(partner?.promo_code) {
            navigator.clipboard.writeText(partner.promo_code);
            alert(t('copied'));
        }
    };

    const availableBalance = verifiedEarnings - withdrawnAmount;

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-0 md:p-4 animate-fade-in backdrop-blur-sm">
            <div className="bg-gray-100 dark:bg-gray-900 w-full h-full md:h-auto md:max-h-[90vh] md:max-w-md md:rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
                
                {/* Custom Header */}
                <div className="bg-black text-white p-4 flex justify-between items-center shadow-md z-10">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Coins className="text-yellow-400"/> {t('affiliateProgram')}
                    </h3>
                    <button onClick={onClose} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors"><X size={18}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
                    {loading ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-yellow-600"/></div>
                    ) : !partner ? (
                        // NOT JOINED YET
                        <div className="text-center py-10 space-y-6">
                            <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto shadow-lg">
                                <DollarSign size={48} className="text-yellow-600"/>
                            </div>
                            <h2 className="text-2xl font-black dark:text-white">{t('joinAffiliate')}</h2>
                            <p className="text-gray-600 dark:text-gray-300 px-4 leading-relaxed">{t('affiliateDesc')}</p>
                            <button onClick={handleJoin} disabled={joining} className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl font-bold shadow-lg text-lg transform transition hover:scale-105">
                                {joining ? <Loader2 className="animate-spin mx-auto"/> : t('joinAffiliate')}
                            </button>
                        </div>
                    ) : partner.status === 'pending' ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6">
                            <Clock size={64} className="text-blue-500 mb-4 animate-pulse"/>
                            <h2 className="text-xl font-bold mb-2 dark:text-white">طلبك قيد المراجعة</h2>
                            <p className="text-gray-500">يرجى الانتظار حتى يتم تفعيل حسابك من طرف الإدارة.</p>
                        </div>
                    ) : partner.status === 'rejected' ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6">
                            <Lock size={64} className="text-red-500 mb-4"/>
                            <h2 className="text-xl font-bold mb-2 dark:text-white">تم رفض الطلب</h2>
                        </div>
                    ) : (
                        // APPROVED - DASHBOARD (TEMU STYLE)
                        <div className="space-y-4">
                            {/* Wallet Card */}
                            <div className="bg-gradient-to-br from-gray-900 to-black text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet size={120}/></div>
                                <div className="relative z-10">
                                    <p className="text-gray-400 text-xs font-bold uppercase mb-1">الرصيد القابل للسحب</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black tracking-tight">{availableBalance}</span>
                                        <span className="text-sm font-bold text-yellow-400">DH</span>
                                    </div>
                                    
                                    <div className="mt-6 flex gap-3">
                                        <button 
                                            onClick={handleWithdrawal}
                                            disabled={availableBalance < 200 || withdrawalLoading}
                                            className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 ${availableBalance >= 200 ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-white/10 text-gray-400 cursor-not-allowed'}`}
                                        >
                                            {withdrawalLoading ? <Loader2 size={14} className="animate-spin"/> : <ArrowDownLeft size={14}/>}
                                            سحب (Min 200)
                                        </button>
                                        <div className="flex-1 bg-white/10 rounded-xl p-2 flex flex-col justify-center items-center">
                                            <span className="text-[10px] text-gray-400">أرباح معلقة</span>
                                            <span className="font-bold text-sm text-yellow-400">{pendingEarnings} DH</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Promo Code Strip */}
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-dashed border-gray-300 dark:border-gray-700 flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase">كود الخصم الخاص بك</p>
                                    <p className="text-xl font-black tracking-wider text-green-600">{partner.promo_code}</p>
                                </div>
                                <button onClick={copyCode} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200"><Copy size={18} className="text-gray-600 dark:text-gray-300"/></button>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center">
                                    <span className="text-2xl font-black text-gray-800 dark:text-white">{sales.filter(s => s.status === 'completed').length}</span>
                                    <span className="text-[10px] text-gray-400 uppercase font-bold">مبيعات مكتملة</span>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center">
                                    <span className="text-2xl font-black text-gray-800 dark:text-white">{sales.length}</span>
                                    <span className="text-[10px] text-gray-400 uppercase font-bold">مجموع الطلبات</span>
                                </div>
                            </div>

                            {/* History List */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
                                <div className="p-4 border-b dark:border-gray-700">
                                    <h4 className="font-bold text-sm dark:text-white flex items-center gap-2"><TrendingUp size={16}/> سجل العمليات</h4>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                    {sales.length === 0 ? (
                                        <p className="text-center text-gray-400 py-8 text-sm">لا توجد مبيعات حتى الآن.</p>
                                    ) : (
                                        sales.map(sale => (
                                            <div key={sale.id} className="p-4 border-b dark:border-gray-700 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm dark:text-white">Order #{sale.order_id}</span>
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${sale.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                            {sale.status === 'completed' ? 'Verified' : 'Pending'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-gray-400">{new Date(sale.created_at).toLocaleDateString()}</p>
                                                </div>
                                                <span className={`font-bold ${sale.status === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                                                    +{sale.commission} DH
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
