
import React, { useState, useEffect, useRef } from 'react';
import { UserView, Language, AuthenticatedUser, AccountType } from './types';
import Chatbot from './components/Chatbot';
import ProviderPortal from './components/QRScanner';
import AppointmentsDrawer from './components/AppointmentsDrawer';
import DatabaseSetup from './components/DatabaseSetup';
import { LocalizationProvider, useLocalization } from './hooks/useLocalization';
import { Globe, User as UserIcon, CheckSquare, Sun, Moon, LogIn, LogOut, X, CalendarDays, Database, AlertTriangle, CreditCard, CheckCircle2 } from 'lucide-react';
import { supabase } from './services/supabaseClient';

const RegistrationSuccessModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t } = useLocalization();
    return (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={48} className="text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-dark dark:text-light mb-4">{t('registrationSuccessTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
                    {t('providerRegistrationSuccessMessage')}
                </p>
                <button 
                    onClick={onClose} 
                    className="w-full px-6 py-3 bg-primary text-white rounded-xl hover:bg-dark transition-colors font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200"
                >
                    {t('backToApp')}
                </button>
            </div>
        </div>
    );
};

const AuthDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthenticatedUser) => void;
  onDatabaseError: () => void;
}> = ({ isOpen, onClose, onAuthSuccess, onDatabaseError }) => {
  const { t } = useLocalization();
  const [isRegister, setIsRegister] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>(AccountType.CLIENT);
  
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | React.ReactNode>('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Client fields
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  
  // Provider fields
  const [businessName, setBusinessName] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [location, setLocation] = useState('');
  const [username, setUsername] = useState('');
  const [providerPhone, setProviderPhone] = useState('');
  
  const drawerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);

  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setStartY(y);
  };
  
  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || !drawerRef.current) return;
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = y - startY;
    if (deltaY > 0) { // Only allow dragging down
      setCurrentY(deltaY);
      drawerRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (currentY > 100) { // If dragged more than 100px, close
      onClose();
    }
    // Reset position
    if (drawerRef.current) {
      drawerRef.current.style.transform = 'translateY(0)';
    }
    setCurrentY(0);
    setStartY(0);
  };
  
  const handleSpecificError = (err: any) => {
      console.error("Auth Error:", err); // Log the full error for debugging
      const message = (err.message || '').toLowerCase();
      const code = err.code || '';
      const isSchemaError = message.includes('relation') || message.includes('column') || message.includes('schema cache');
      const isRLSError = code === '42501' || message.includes('row-level security');

      if (message.includes('clients_phone_key')) {
          setError(t('phoneExistsError'));
      } else if (message.includes('providers_username_key')) {
          setError(t('usernameExistsError'));
      } else if (message.includes("'is_active' column")) {
           setError(
                <span>
                    {t('missingIsActiveColumn')} {' '}
                    <button onClick={onDatabaseError} className="font-bold underline text-secondary hover:text-primary">
                        {t('clickHereForInstructions')}
                    </button>
                </span>
            );
      } else if (isRLSError) {
           setError(
                <span>
                    {t('rlsError')} {' '}
                    <button onClick={onDatabaseError} className="font-bold underline text-secondary hover:text-primary">
                        {t('clickHereForInstructions')}
                    </button>
                </span>
            );
      } else if (isSchemaError) {
           const errorMessageKey = message.includes('schema cache') 
            ? 'databaseSchemaErrorWithCache' 
            : 'databaseSchemaError';
           setError(
                <span>
                    {t(errorMessageKey as any)} {' '}
                    <button onClick={onDatabaseError} className="font-bold underline text-secondary hover:text-primary">
                        {t('clickHereForInstructions')}
                    </button>
                </span>
            );
      } else {
          setError(t('registrationFailed'));
      }
  }

  const handleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      if (accountType === AccountType.CLIENT) {
        if (!phone || !password) { setError(t('allFieldsRequired')); setIsLoading(false); return; }
        const { data, error } = await supabase
          .from('clients')
          .select('id, full_name, phone')
          .eq('phone', phone)
          .eq('password', password)
          .single();
        if (error || !data) throw error || new Error('Invalid credentials');
        localStorage.setItem('tangerconnect_user_id', data.id.toString());
        localStorage.setItem('tangerconnect_user_type', AccountType.CLIENT);
        onAuthSuccess({ id: data.id, name: data.full_name, accountType: AccountType.CLIENT, phone: data.phone });
      } else {
        if (!username || !password) { setError(t('allFieldsRequired')); setIsLoading(false); return; }
        // Select is_active AND subscription_end_date
        const { data, error } = await supabase
          .from('providers')
          .select('id, name, username, is_active, subscription_end_date')
          .eq('username', username)
          .eq('password', password)
          .single();
          
        if (error || !data) throw error || new Error('Invalid credentials');

        // Allow login even if inactive, but flag it
        // The ProviderPortal component will handle the locking logic
        localStorage.setItem('tangerconnect_user_id', data.id.toString());
        localStorage.setItem('tangerconnect_user_type', AccountType.PROVIDER);
        onAuthSuccess({ 
            id: data.id, 
            name: data.name, 
            accountType: AccountType.PROVIDER, 
            username: data.username,
            isActive: data.is_active,
            subscriptionEndDate: data.subscription_end_date
        });
      }
    } catch (e: any) {
       handleSpecificError(e);
    } finally {
        setIsLoading(false);
    }
  };
  const handleRegister = async () => {
    setError('');
    setIsLoading(true);
    try {
      if (accountType === AccountType.CLIENT) {
        if (!fullName || !phone || !password) { setError(t('allFieldsRequired')); setIsLoading(false); return; }
        const { data, error } = await supabase
          .from('clients')
          .insert({ full_name: fullName, phone: phone, password: password })
          .select('id, full_name, phone')
          .single();
        if (error || !data) throw error;
        localStorage.setItem('tangerconnect_user_id', data.id.toString());
        localStorage.setItem('tangerconnect_user_type', AccountType.CLIENT);
        onAuthSuccess({ id: data.id, name: data.full_name, accountType: AccountType.CLIENT, phone: data.phone });
      } else {
        if(!businessName || !serviceType || !location || !username || !password || !providerPhone) { setError(t('allFieldsRequired')); setIsLoading(false); return; }
        
        // Insert with is_active = false by default (enforced by DB default, but explicit here for clarity if needed, or rely on DB)
        const { data, error } = await supabase
          .from('providers')
          .insert({ 
              name: businessName, 
              service_type: serviceType, 
              location: location, 
              username: username, 
              password: password,
              phone: providerPhone,
              is_active: false 
          })
          .select('id, name, username')
          .single();
          
        if (error || !data) throw error;
        
        // Show Success Modal
        setShowSuccessModal(true);
      }
    } catch (e: any) {
       handleSpecificError(e);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) handleRegister();
    else handleLogin();
  };
  
  const renderClientFields = () => (
    <>
      {isRegister && (
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('fullName')}</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
        </div>
      )}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('phone')}</label>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
      </div>
    </>
  );

  const renderProviderFields = () => (
    <>
       {isRegister && (
         <>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                    </div>
                    <div className="ltr:ml-3 rtl:mr-3">
                        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">{t('subscriptionNoticeTitle')}</h3>
                        <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-200">
                            <p>{t('subscriptionNoticeDesc')}</p>
                        </div>
                         <div className="mt-2 font-bold text-sm text-yellow-800 dark:text-yellow-300">
                            {t('subscriptionFee')}
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('businessName')}</label>
                <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
            </div>
             <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('serviceType')}</label>
                <input type="text" value={serviceType} onChange={(e) => setServiceType(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
            </div>
             <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('location')}</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
            </div>
             <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('phone')}</label>
                <input type="tel" value={providerPhone} onChange={(e) => setProviderPhone(e.target.value)} placeholder="06..." className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
            </div>
         </>
       )}
        <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('username')}</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
        </div>
    </>
  );


  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
    }
    return () => {
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);


  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-end" onClick={onClose}>
      <div 
        ref={drawerRef}
        className="bg-white dark:bg-gray-800 rounded-t-2xl shadow-xl w-full max-w-md relative transition-transform duration-300 max-h-[90vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
        style={{ transform: `translateY(0)`, willChange: 'transform' }}
      >
        <div 
          className="w-full py-4 flex justify-center cursor-grab sticky top-0 bg-white dark:bg-gray-800 z-10"
          onTouchStart={handleDragStart}
          onMouseDown={handleDragStart}
        >
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        </div>
        
        <div className="p-8 pt-0">
          <button onClick={onClose} className="absolute top-4 right-4 rtl:left-4 rtl:right-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-20">
            <X size={24} />
          </button>
          <h2 className="text-2xl font-bold text-center text-dark dark:text-light mb-4">
            {isRegister ? t('registerTitle') : t('loginTitle')}
          </h2>
            <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('accountType')}</label>
                <div className="flex rounded-md shadow-sm">
                    <button onClick={() => setAccountType(AccountType.CLIENT)} className={`px-4 py-2 block w-full text-sm font-medium rounded-l-lg border ${accountType === AccountType.CLIENT ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>
                        {t('client')}
                    </button>
                    <button onClick={() => setAccountType(AccountType.PROVIDER)} className={`px-4 py-2 block w-full text-sm font-medium rounded-r-lg border-t border-b border-r ${accountType === AccountType.PROVIDER ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>
                        {t('provider')}
                    </button>
                </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {accountType === AccountType.CLIENT ? renderClientFields() : renderProviderFields()}
               <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('password')}</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
              </div>
              {error && <div className="text-sm text-center">{error}</div>}
              <button type="submit" disabled={isLoading} className="w-full text-white bg-primary hover:bg-dark focus:ring-4 focus:ring-secondary font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-gray-400">
                {isLoading ? t('loading') : (isRegister ? t('registerButton') : t('loginButton'))}
              </button>
            </form>
            <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-4">
              {isRegister ? t('haveAccount') : t('noAccount')}{' '}
              <button onClick={() => setIsRegister(!isRegister)} className="font-medium text-secondary hover:underline">
                {isRegister ? t('loginButton') : t('registerButton')}
              </button>
            </p>
        </div>
      </div>
    </div>
    {showSuccessModal && (
        <RegistrationSuccessModal 
            onClose={() => {
                setShowSuccessModal(false);
                onClose(); // Close the auth drawer as well
            }} 
        />
    )}
    </>
  );
};


const Footer: React.FC = () => {
  const { t } = useLocalization();
  return (
    <footer className="w-full p-4 text-center text-gray-600 dark:text-gray-400 text-sm">
      <p>&copy; 2025 {t('appName')}</p>
    </footer>
  );
};

const PendingAccountView: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { t } = useLocalization();
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl max-w-md border border-yellow-200">
        <AlertTriangle className="text-yellow-500 w-12 h-12 mb-4" />
        <h2 className="text-xl font-bold text-dark dark:text-light mb-2">{t('accountPending')}</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">{t('accountPendingDesc')}</p>
        <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-dark dark:text-light rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            <LogOut size={18} />
            {t('logout')}
        </button>
    </div>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<UserView>(UserView.CLIENT);
  const [language, setLanguage] = useState<Language>(Language.AR);
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [showAuthDrawer, setShowAuthDrawer] = useState(false);
  const [showAppointmentsDrawer, setShowAppointmentsDrawer] = useState(false);
  const [showDbSetup, setShowDbSetup] = useState(false);

  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined' && localStorage.theme) return localStorage.theme;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });

  useEffect(() => {
    const checkUser = async () => {
      const userId = localStorage.getItem('tangerconnect_user_id');
      const userType = localStorage.getItem('tangerconnect_user_type');
      if (userId && userType) {
        try {
          if (userType === AccountType.CLIENT) {
            const { data, error } = await supabase.from('clients').select('id, full_name, phone').eq('id', parseInt(userId, 10)).single();
            if (error) throw error;
            if (data) setCurrentUser({ id: data.id, name: data.full_name, accountType: AccountType.CLIENT, phone: data.phone });
          } else if (userType === AccountType.PROVIDER) {
            const { data, error } = await supabase.from('providers').select('id, name, username, is_active, subscription_end_date').eq('id', parseInt(userId, 10)).single();
            if (error) throw error;
            if (data) {
                setCurrentUser({ 
                    id: data.id, 
                    name: data.name, 
                    accountType: AccountType.PROVIDER, 
                    username: data.username, 
                    isActive: data.is_active,
                    subscriptionEndDate: data.subscription_end_date
                });
            }
          }
        } catch (error) {
          console.error("Error fetching user:", error);
          localStorage.removeItem('tangerconnect_user_id');
          localStorage.removeItem('tangerconnect_user_type');
        }
      }
      setIsLoadingUser(false);
    };
    checkUser();
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === Language.AR ? 'rtl' : 'ltr';
    document.body.className = language === Language.AR ? 'font-arabic' : 'font-sans';
  }, [language]);
  
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  const handleLogout = () => {
    localStorage.removeItem('tangerconnect_user_id');
    localStorage.removeItem('tangerconnect_user_type');
    setCurrentUser(null);
    setView(UserView.CLIENT);
  };
  
  const handleAuthSuccess = (user: AuthenticatedUser) => {
    setCurrentUser(user);
    setShowAuthDrawer(false);
    if (user.accountType === AccountType.PROVIDER) {
        setView(UserView.PROVIDER);
    } else {
        setView(UserView.CLIENT);
    }
  };

  const Header = () => {
    const { t } = useLocalization();
    
    // Determine status for provider badge
    let statusBadge = null;
    if (currentUser?.accountType === AccountType.PROVIDER) {
        const isActive = currentUser.isActive;
        const isExpired = currentUser.subscriptionEndDate && new Date(currentUser.subscriptionEndDate) < new Date();
        const isValid = isActive && !isExpired;
        
        statusBadge = (
             <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                 isValid 
                 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                 : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
             }`}>
                 {isValid ? t('statusActive') : (isActive ? t('statusExpired') : t('statusPending'))}
             </span>
        );
    }


    const accountTypeDisplay = currentUser ? `(${t(currentUser.accountType.toLowerCase() as any)})` : '';
    return (
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-md w-full p-4 flex justify-between items-center z-20 sticky top-0">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          <h1 className="text-xl md:text-2xl font-bold text-dark dark:text-light">{t('appName')}</h1>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
           {currentUser ? (
             <div className="flex items-center gap-2">
                <div className="hidden md:flex flex-col items-end bg-light dark:bg-dark px-3 py-1 rounded-lg">
                    <div className="flex items-center gap-1">
                        <span className="text-dark dark:text-light font-medium text-sm truncate max-w-32">{currentUser.name}</span>
                        {statusBadge}
                    </div>
                    <span className="text-xs text-secondary">{accountTypeDisplay}</span>
                </div>
                 {currentUser.accountType === AccountType.CLIENT && (
                    <button onClick={() => setShowAppointmentsDrawer(true)} className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" aria-label={t('myAppointments')}>
                        <CalendarDays size={20} />
                    </button>
                 )}
                <button onClick={handleLogout} className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" aria-label={t('logout')}>
                    <LogOut size={20} />
                </button>
             </div>
           ) : (
             <button onClick={() => setShowAuthDrawer(true)} className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-dark transition-colors text-sm">
                <LogIn size={18} />
                <span className="hidden md:inline">{t('loginRegister')}</span>
             </button>
           )}
           <button onClick={toggleTheme} aria-label="Toggle theme" className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button onClick={() => setShowDbSetup(true)} aria-label="Database Setup" className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <Database size={20} />
          </button>
          <div className="relative">
            <Globe className="absolute top-1/2 -translate-y-1/2 left-3 rtl:right-3 rtl:left-auto text-gray-500" size={20} />
            <select value={language} onChange={(e) => setLanguage(e.target.value as Language)} className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 rtl:pr-10 rtl:pl-4 p-2.5 appearance-none">
              <option value={Language.AR}>العربية</option>
              <option value={Language.EN}>English</option>
              <option value={Language.FR}>Français</option>
            </select>
          </div>
          <button onClick={() => setView(view === UserView.CLIENT ? UserView.PROVIDER : UserView.CLIENT)} className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary transition-colors">
            {view === UserView.CLIENT ? <CheckSquare size={20} /> : <UserIcon size={20} />}
            <span className="hidden md:inline">{view === UserView.CLIENT ? t('providerView') : t('clientView')}</span>
          </button>
        </div>
      </header>
    );
  };

  const ProviderLoginPrompt = () => {
    const { t } = useLocalization();
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-2xl font-bold text-dark dark:text-light mb-4">{t('providerLoginTitle')}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{t('pleaseLoginAsProvider')}</p>
        <button onClick={() => setShowAuthDrawer(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-dark transition-colors">
            <LogIn size={18} />
            {t('loginRegister')}
        </button>
      </div>
    );
  };

  return (
    <LocalizationProvider language={language}>
      <DatabaseSetup isOpen={showDbSetup} onClose={() => setShowDbSetup(false)} />
      <AuthDrawer 
        isOpen={showAuthDrawer} 
        onClose={() => setShowAuthDrawer(false)} 
        onAuthSuccess={handleAuthSuccess}
        onDatabaseError={() => {
            setShowAuthDrawer(false);
            setShowDbSetup(true);
        }}
      />
       {currentUser?.accountType === AccountType.CLIENT && (
         <AppointmentsDrawer 
            isOpen={showAppointmentsDrawer} 
            onClose={() => setShowAppointmentsDrawer(false)} 
            user={currentUser} 
        />
      )}
      <div className="bg-light dark:bg-dark min-h-screen flex flex-col items-center">
        <Header />
        <main className="w-full flex-1 flex flex-col items-center p-4 overflow-hidden">
          {view === UserView.CLIENT ? (
            <Chatbot 
              currentUser={currentUser} 
              setCurrentUser={setCurrentUser} 
              isLoadingUser={isLoadingUser}
            />
          ) : view === UserView.PROVIDER && currentUser?.accountType === AccountType.PROVIDER ? (
                 <ProviderPortal provider={currentUser} onLogout={handleLogout} />
          ) : (
            <ProviderLoginPrompt />
          )}
        </main>
        <Footer />
      </div>
    </LocalizationProvider>
  );
};

export default App;