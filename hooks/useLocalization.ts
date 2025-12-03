
import React, { createContext, useContext, ReactNode } from 'react';
import { Language } from '../types';

interface Translations {
  [key: string]: { [lang in Language]: string };
}

type TranslationPlaceholder = { [key: string]: string | number };

export const translations: Translations = {
  appName: {
    ar: 'TangerConnect AI',
    en: 'TangerConnect AI',
    fr: 'TangerConnect AI',
  },
  // --- GENERAL ---
  search: { ar: 'بحث', en: 'Search', fr: 'Rechercher' },
  loading: { ar: 'جاري التحميل...', en: 'Loading...', fr: 'Chargement...' },
  close: { ar: 'إغلاق', en: 'Close', fr: 'Fermer' },
  save: { ar: 'حفظ', en: 'Save', fr: 'Enregistrer' },
  cancel: { ar: 'إلغاء', en: 'Cancel', fr: 'Annuler' },
  delete: { ar: 'مسح', en: 'Delete', fr: 'Supprimer' },
  edit: { ar: 'تعديل', en: 'Edit', fr: 'Modifier' },
  back: { ar: 'رجوع', en: 'Back', fr: 'Retour' },
  menu: { ar: 'القائمة', en: 'Menu', fr: 'Menu' },
  home: { ar: 'الرئيسية', en: 'Home', fr: 'Accueil' },
  
  // --- AUTH ---
  loginRegister: { ar: 'دخول / تسجيل', en: 'Login / Register', fr: 'Connexion / S\'inscrire' },
  loginTitle: { ar: 'تسجيل الدخول', en: 'Login', fr: 'Connexion' },
  registerTitle: { ar: 'إنشاء حساب', en: 'Register', fr: 'S\'inscrire' },
  logout: { ar: 'خروج', en: 'Logout', fr: 'Déconnexion' },
  username: { ar: 'إسم المستخدم', en: 'Username', fr: 'Nom d\'utilisateur' },
  password: { ar: 'كلمة السر', en: 'Password', fr: 'Mot de passe' },
  phone: { ar: 'الهاتف', en: 'Phone', fr: 'Téléphone' },
  fullName: { ar: 'الإسم الكامل', en: 'Full Name', fr: 'Nom complet' },
  accountType: { ar: 'نوع الحساب', en: 'Account Type', fr: 'Type de compte' },
  client: { ar: 'زبون', en: 'Client', fr: 'Client' },
  provider: { ar: 'مهني (Pro)', en: 'Provider', fr: 'Professionnel' },
  loginButton: { ar: 'دخول', en: 'Login', fr: 'Connexion' },
  registerButton: { ar: 'تسجيل', en: 'Register', fr: 'S\'inscrire' },
  
  // --- STORE SPECIFIC ---
  storeWelcomeTitle: { ar: 'مرحبا بك في المتجر!', en: 'Welcome to Store!', fr: 'Bienvenue !' },
  storeWelcomeMsg: { ar: 'الدفع عند الاستلام! شوف السلعة عاد خلص.', en: 'Cash on Delivery! Check goods then pay.', fr: 'Paiement à la livraison ! Vérifiez d\'abord.' },
  shopNow: { ar: 'تسوق الآن', en: 'Shop Now', fr: 'Acheter' },
  addToCart: { ar: 'أضف للسلة', en: 'Add to Cart', fr: 'Ajouter au panier' },
  buyNow: { ar: 'شراء الآن', en: 'Buy Now', fr: 'Acheter Maintenant' },
  checkout: { ar: 'تأكيد الطلب', en: 'Checkout', fr: 'Commander' },
  total: { ar: 'المجموع', en: 'Total', fr: 'Total' },
  cartEmpty: { ar: 'السلة فارغة', en: 'Cart is empty', fr: 'Panier vide' },
  orderPlaced: { ar: 'تم إرسال طلبك بنجاح! سيتصل بك البائع قريبا.', en: 'Order placed successfully!', fr: 'Commande passée avec succès !' },
  sizes: { ar: 'المقاسات المتوفرة', en: 'Available Sizes', fr: 'Tailles Dispo' },
  description: { ar: 'الوصف', en: 'Description', fr: 'Description' },
  category_clothes: { ar: 'ملابس', en: 'Clothing', fr: 'Vêtements' },
  category_electronics: { ar: 'إلكترونيات', en: 'Electronics', fr: 'Électronique' },
  category_accessories: { ar: 'أكسسوارات', en: 'Accessories', fr: 'Accessoires' },
  category_home: { ar: 'منزل', en: 'Home', fr: 'Maison' },
  category_beauty: { ar: 'تجميل', en: 'Beauty', fr: 'Beauté' },
  
  // --- CHATBOT ---
  inputPlaceholder: { ar: 'كتب ميساج هنا...', en: 'Type a message...', fr: 'Écrivez un message...' },
  recording: { ar: 'جاري التسجيل...', en: 'Recording...', fr: 'Enregistrement...' },
  
  // --- REAL ESTATE & JOBS ---
  realEstateTitle: { ar: 'عقارات', en: 'Real Estate', fr: 'Immobilier' },
  jobBoardTitle: { ar: 'سوق الشغل', en: 'Job Market', fr: 'Emploi' },
  postAd: { ar: 'نشر إعلان', en: 'Post Ad', fr: 'Publier' },
  
  // --- PROVIDER PORTAL ---
  controlRoom: { ar: 'غرفة التحكم', en: 'Control Room', fr: 'Salle de Contrôle' },
  goToApp: { ar: 'الذهاب للتطبيق', en: 'Go to App', fr: 'Aller à l\'App' },
  qrScannerTitle: { ar: 'ماسح الكود', en: 'QR Scanner', fr: 'Scanner QR' },
  notifications: { ar: 'الإشعارات', en: 'Notifications', fr: 'Notifications' },
  scanHistory: { ar: 'سجل العمليات', en: 'History', fr: 'Historique' },
  followers: { ar: 'المتابعين', en: 'Followers', fr: 'Abonnés' },
  requestBoost: { ar: 'طلب إعلان ممول', en: 'Request Ad', fr: 'Demander Pub' },
  
  // --- ERRORS ---
  errorMessage: { ar: 'حدث خطأ ما', en: 'Error', fr: 'Erreur' },
  loginRequired: { ar: 'يجب تسجيل الدخول أولا', en: 'Login Required', fr: 'Connexion Requise' },

  // --- OTHERS ---
  noPosts: { ar: 'لا توجد منشورات حاليا', en: 'No posts yet', fr: 'Aucun post' },
  priceDH: { ar: 'درهم', en: 'DH', fr: 'DH' },
  call: { ar: 'اتصال', en: 'Call', fr: 'Appeler' },
  
  // --- NEIGHBORHOODS ---
  neighborhoods: {
    ar: 'مسنانة, كسبارطا, درادب, وسط المدينة, مالاباطا, مجيمع, فال فلوري, بني مكادة, العوامة, مرشان, بوخالف, طنجة البالية, سيدي ادريس, المصلى, شارع محمد الخامس, بلاصاطورو, الزياتن, الجيراري, السواني, مغوغة, البرانص, كاليفورنيا, عين قطيوط, مرجان, ايبيريا',
    en: 'Mesnana, Casabarata, Dradeb, City Center, Malabata, Mojamaa, Val Fleuri, Bani Makada, Aouama, Marchan, Boukhalef, Tanger Balia, Sidi Driss, Msalla, Mohamed V Blvd, Placatoro, Ziaten, Jirari, Souani, Mghogha, Braness, California, Ain Ktiwat, Marjane, Iberia',
    fr: 'Mesnana, Casabarata, Dradeb, Centre Ville, Malabata, Mojamaa, Val Fleuri, Bani Makada, Aouama, Marchan, Boukhalef, Tanger Balia, Sidi Driss, Msalla, Bd Mohamed V, Placatoro, Ziaten, Jirari, Souani, Mghogha, Braness, California, Ain Ktiwat, Marjane, Iberia',
  },
};

interface LocalizationContextType {
  language: Language;
  t: (key: keyof typeof translations | string, placeholders?: TranslationPlaceholder) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ language: Language; children: ReactNode }> = ({ language, children }) => {
  const t = (key: keyof typeof translations | string, placeholders?: TranslationPlaceholder) => {
    const translationKey = key as string;
    let translation = translations[translationKey]?.[language] || translations[translationKey]?.[Language.EN] || translationKey;
    
    if (placeholders) {
      Object.entries(placeholders).forEach(([k, v]) => {
        translation = translation.replace(`{${k}}`, String(v));
      });
    }
    return translation;
  };

  return React.createElement(
    LocalizationContext.Provider,
    { value: { language, t } },
    children
  );
};

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};
