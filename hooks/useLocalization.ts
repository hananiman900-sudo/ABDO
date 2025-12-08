
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Language } from '../types';

interface Translations {
  [key: string]: { [lang in Language]: string };
}

export const translations: Translations = {
  appName: { ar: 'طنجة IA', en: 'Tanger IA', fr: 'Tanger IA' },
  appDesc: { 
    ar: 'مساعدك الذكي في طنجة. يمكنني مساعدتك في العثور على الأطباء، العقارات، فرص العمل، والمزيد.', 
    en: 'Your AI assistant in Tangier. I can help you find doctors, real estate, jobs, and more.', 
    fr: 'Votre assistant IA à Tanger. Je peux vous aider à trouver des médecins, de l\'immobilier, des emplois, et plus.' 
  },
  discoverServices: { ar: 'اكتشف المزيد من الخدمات', en: 'Discover More Services', fr: 'Découvrir plus de services' },
  
  // --- BOTTOM NAV ---
  navChat: { ar: 'الرئيسية', en: 'Chat', fr: 'Chat' },
  navStore: { ar: 'المتجر', en: 'Store', fr: 'Boutique' },
  navExplore: { ar: 'خدمات', en: 'Services', fr: 'Services' },
  navProfile: { ar: 'حسابي', en: 'Profile', fr: 'Profil' },

  // --- SERVICES HUB ---
  servicesHubTitle: { ar: 'جميع الخدمات', en: 'All Services', fr: 'Tous les Services' },
  servicesHubDesc: { ar: 'كل ما تحتاجه في طنجة في مكان واحد', en: 'Everything you need in Tangier', fr: 'Tout ce dont vous avez besoin à Tanger' },
  
  // --- GENERAL ---
  search: { ar: 'بحث', en: 'Search', fr: 'Rechercher' },
  loading: { ar: 'جاري التحميل...', en: 'Loading...', fr: 'Chargement...' },
  close: { ar: 'إغلاق', en: 'Close', fr: 'Fermer' },
  save: { ar: 'حفظ', en: 'Save', fr: 'Enregistrer' },
  cancel: { ar: 'إلغاء', en: 'Cancel', fr: 'Annuler' },
  delete: { ar: 'مسح', en: 'Delete', fr: 'Supprimer' },
  edit: { ar: 'تعديل', en: 'Edit', fr: 'Modifier' },
  share: { ar: 'مشاركة', en: 'Share', fr: 'Partager' },
  back: { ar: 'رجوع', en: 'Back', fr: 'Retour' },
  menu: { ar: 'القائمة', en: 'Menu', fr: 'Menu' },
  home: { ar: 'الرئيسية', en: 'Home', fr: 'Accueil' },
  guest: { ar: 'زائر', en: 'Guest', fr: 'Invité' },
  suggestedProviders: { ar: 'اقتراحات لك', en: 'Suggested for You', fr: 'Suggestions' },
  
  // --- AUTH ---
  loginRegister: { ar: 'دخول / تسجيل', en: 'Login / Register', fr: 'Connexion / S\'inscrire' },
  loginTitle: { ar: 'تسجيل الدخول', en: 'Login', fr: 'Connexion' },
  registerTitle: { ar: 'إنشاء حساب', en: 'Sign Up', fr: 'S\'inscrire' },
  logout: { ar: 'خروج', en: 'Logout', fr: 'Déconnexion' },
  username: { ar: 'إسم المستخدم', en: 'Username', fr: 'Nom d\'utilisateur' },
  password: { ar: 'كلمة السر', en: 'Password', fr: 'Mot de passe' },
  phone: { ar: 'رقم الهاتف', en: 'Phone Number', fr: 'Numéro de téléphone' },
  phoneOrUsername: { ar: 'رقم الهاتف أو إسم المستخدم', en: 'Phone or Username', fr: 'Tél ou Nom d\'utilisateur' },
  fullName: { ar: 'الإسم الكامل', en: 'Full Name', fr: 'Nom complet' },
  accountType: { ar: 'نوع الحساب', en: 'Account Type', fr: 'Type de compte' },
  client: { ar: 'زبون', en: 'Client', fr: 'Client' },
  provider: { ar: 'مهني (Pro)', en: 'Provider', fr: 'Professionnel' },
  loginButton: { ar: 'دخول', en: 'Login', fr: 'Connexion' },
  registerButton: { ar: 'تسجيل', en: 'Register', fr: 'S\'inscrire' },
  passwordError: { ar: 'كلمة السر غير صحيحة', en: 'Incorrect Password', fr: 'Mot de passe incorrect' },
  accountPending: { ar: 'حسابك في طور المراجعة من طرف الإدارة.', en: 'Account pending approval.', fr: 'Compte en attente d\'approbation.' },
  
  // --- ADMIN DASHBOARD ---
  adminDashboard: { ar: 'لوحة التحكم (المدير)', en: 'Admin Dashboard', fr: 'Tableau de Bord' },
  manageProducts: { ar: 'إدارة المنتجات', en: 'Manage Products', fr: 'Gérer Produits' },
  manageProviders: { ar: 'طلبات الانخراط', en: 'Provider Requests', fr: 'Demandes Pro' },
  pendingProviders: { ar: 'مهنيين في الانتظار', en: 'Pending Providers', fr: 'Pros en attente' },
  approve: { ar: 'قبول', en: 'Approve', fr: 'Approuver' },
  reject: { ar: 'رفض', en: 'Reject', fr: 'Rejeter' },
  productName: { ar: 'إسم المنتج', en: 'Product Name', fr: 'Nom Produit' },
  productPrice: { ar: 'الثمن', en: 'Price', fr: 'Prix' },
  productCategory: { ar: 'الصنف', en: 'Category', fr: 'Catégorie' },
  productImage: { ar: 'صورة المنتج', en: 'Product Image', fr: 'Image Produit' },
  addProductSuccess: { ar: 'تمت إضافة المنتج بنجاح', en: 'Product added', fr: 'Produit ajouté' },
  globalStats: { ar: 'إحصائيات عامة', en: 'Global Stats', fr: 'Stats Globales' },
  totalVisits: { ar: 'مجموع الزيارات', en: 'Total Visits', fr: 'Total Visites' },
  ranking: { ar: 'الترتيب', en: 'Ranking', fr: 'Classement' },
  updateProduct: { ar: 'تحديث المنتج', en: 'Update Product', fr: 'Mettre à jour' },
  cancelEdit: { ar: 'إلغاء التعديل', en: 'Cancel Edit', fr: 'Annuler modif' },
  
  // --- PROFILE ---
  posts: { ar: 'الخدمات', en: 'Services', fr: 'Services' },
  followers: { ar: 'المتابعين', en: 'Followers', fr: 'Abonnés' },
  visits: { ar: 'زيارات اليوم', en: 'Visits Today', fr: 'Visites' },
  following: { ar: 'أتابع', en: 'Following', fr: 'Abonnements' },
  follow: { ar: 'متابعة', en: 'Follow', fr: 'Suivre' },
  unfollow: { ar: 'إلغاء المتابعة', en: 'Unfollow', fr: 'Ne plus suivre' },
  editProfile: { ar: 'تعديل الملف', en: 'Edit Profile', fr: 'Modifier Profil' },
  saveProfile: { ar: 'حفظ التعديلات', en: 'Save Profile', fr: 'Enregistrer' },
  bioLabel: { ar: 'الوصف (Bio)', en: 'Bio', fr: 'Bio' },
  socialLinks: { ar: 'روابط التواصل', en: 'Social Links', fr: 'Réseaux Sociaux' },
  gpsLink: { ar: 'موقع GPS', en: 'GPS Location', fr: 'Position GPS' },
  uploadPhoto: { ar: 'تغيير الصورة', en: 'Change Photo', fr: 'Changer Photo' },
  
  // --- STORE SPECIFIC ---
  storeWelcomeTitle: { ar: 'مرحبا بك!', en: 'Welcome!', fr: 'Bienvenue !' },
  storeWelcomeMsg: { ar: 'الدفع عند الاستلام! شوف السلعة عاد خلص.', en: 'Cash on Delivery! Check goods then pay.', fr: 'Paiement à la livraison ! Vérifiez d\'abord.' },
  shopNow: { ar: 'تصفح العروض', en: 'Shop Now', fr: 'Acheter' },
  addToCart: { ar: 'أضف للسلة', en: 'Add to Cart', fr: 'Ajouter au panier' },
  buyNow: { ar: 'شراء الآن', en: 'Buy Now', fr: 'Acheter Maintenant' },
  checkout: { ar: 'طلب الآن', en: 'Order Now', fr: 'Commander' },
  total: { ar: 'المجموع', en: 'Total', fr: 'Total' },
  cartEmpty: { ar: 'السلة فارغة', en: 'Cart is empty', fr: 'Panier vide' },
  orderPlaced: { ar: 'تم الطلب! سنتصل بك قريبا.', en: 'Order placed!', fr: 'Commande passée !' },
  sizes: { ar: 'المقاسات', en: 'Sizes', fr: 'Tailles' },
  description: { ar: 'الوصف', en: 'Description', fr: 'Description' },
  category_all: { ar: 'الكل', en: 'All', fr: 'Tout' },
  category_clothes: { ar: 'ملابس', en: 'Clothing', fr: 'Vêtements' },
  category_electronics: { ar: 'إلكترونيات', en: 'Electronics', fr: 'Électronique' },
  category_accessories: { ar: 'أكسسوارات', en: 'Accessories', fr: 'Accessoires' },
  category_home: { ar: 'منزل', en: 'Home', fr: 'Maison' },
  category_beauty: { ar: 'تجميل', en: 'Beauty', fr: 'Beauté' },
  freeDelivery: { ar: 'توصيل مجاني', en: 'Free Delivery', fr: 'Livraison Gratuite' },
  welcomeBackMessage: { ar: 'مرحبا {name}', en: 'Welcome {name}', fr: 'Bienvenue {name}' },
  flashSale: { ar: 'عروض خاصة', en: 'Flash Sale', fr: 'Vente Flash' },
  addProduct: { ar: 'إضافة منتج', en: 'Add Product', fr: 'Ajouter Produit' },
  adminPanel: { ar: 'الإدارة', en: 'Admin', fr: 'Admin' },
  adRequests: { ar: 'طلبات الإشهار', en: 'Ad Requests', fr: 'Demandes Pub' },
  myOrders: { ar: 'طلباتي', en: 'My Orders', fr: 'Mes Commandes' },
  orderStatus: { ar: 'حالة الطلب', en: 'Order Status', fr: 'Statut' },
  reviews: { ar: 'التعليقات', en: 'Reviews', fr: 'Avis' },
  addReview: { ar: 'أضف تعليق', en: 'Add Review', fr: 'Ajouter avis' },
  
  // --- CHATBOT ---
  inputPlaceholder: { ar: 'كتب رسالة...', en: 'Type a message...', fr: 'Écrivez un message...' },
  recording: { ar: 'جاري التسجيل...', en: 'Recording...', fr: 'Enregistrement...' },
  bookingSuccessMessage: { ar: 'تم الحجز! احتفظ بهذا الكود لتقديمه للمهني.', en: 'Booked! Keep this code for the provider.', fr: 'Réservé ! Gardez ce code pour le pro.' },
  bookAppointment: { ar: 'حجز موعد', en: 'Book Appointment', fr: 'Prendre RDV' },
  selectOffer: { ar: 'اختر العرض (اختياري)', en: 'Select Offer (Optional)', fr: 'Choisir Offre' },
  keepQR: { ar: 'مهم: احتفظ بهذا الكود. صالح فقط عند هذا المهني.', en: 'Important: Keep this code. Valid only for this provider.', fr: 'Important: Gardez ce code. Valide uniquement pour ce pro.' },
  welcomeMessage: { ar: 'مرحبا! أنا المساعد الذكي. باش نقدر نعاونك؟', en: 'Hello! How can I help?', fr: 'Bonjour ! Comment aider ?' },
  service: { ar: 'الخدمة', en: 'Service', fr: 'Service' },
  with: { ar: 'مع', en: 'With', fr: 'Avec' },
  discountApplied: { ar: 'تخفيض', en: 'Discount', fr: 'Réduction' },
  bookingConfirmedTitle: { ar: 'تأكيد الموعد', en: 'Booking Confirmed', fr: 'RDV Confirmé' },
  sponsored: { ar: 'إشهار', en: 'Sponsored', fr: 'Sponsorisé' },
  
  // --- REAL ESTATE & JOBS ---
  realEstateTitle: { ar: 'السمسار', en: 'Real Estate', fr: 'Immobilier' },
  jobBoardTitle: { ar: 'سوق الشغل', en: 'Jobs', fr: 'Emploi' },
  postAd: { ar: 'نشر', en: 'Post', fr: 'Publier' },
  postNewAd: { ar: 'إعلان جديد', en: 'New Ad', fr: 'Nouvelle Annonce' },
  filterRent: { ar: 'كراء', en: 'Rent', fr: 'Location' },
  filterBuy: { ar: 'شراء', en: 'Buy', fr: 'Achat' },
  filterAll: { ar: 'الكل', en: 'All', fr: 'Tout' },
  tabOffers: { ar: 'عروض', en: 'Offers', fr: 'Offres' },
  tabTalent: { ar: 'طلبات', en: 'Seekers', fr: 'Demandes' },
  jobCategory: { ar: 'مجال', en: 'Category', fr: 'Catégorie' },
  jobTitle: { ar: 'العنوان', en: 'Title', fr: 'Titre' },
  salaryPlaceholder: { ar: 'الراتب', en: 'Salary', fr: 'Salaire' },
  experienceDesc: { ar: 'التفاصيل', en: 'Details', fr: 'Détails' },
  skillsPlaceholder: { ar: 'المهارات', en: 'Skills', fr: 'Compétences' },
  postNow: { ar: 'نشر الآن', en: 'Post Now', fr: 'Publier' },
  chooseRole: { ar: 'شنو بغيتي؟', en: 'Goal?', fr: 'But ?' },
  iamHiring: { ar: 'بغت خدام', en: 'Hiring', fr: 'Je recrute' },
  iamLooking: { ar: 'كنقلب على خدمة', en: 'Looking', fr: 'Je cherche' },
  applyWhatsApp: { ar: 'تواصل', en: 'Contact', fr: 'Contact' },
  hireWhatsApp: { ar: 'تواصل', en: 'Contact', fr: 'Contact' },
  writeComment: { ar: 'تعليق...', en: 'Comment...', fr: 'Commentaire...' },
  postedAgo: { ar: 'منذ', en: 'ago', fr: 'il y a' },
  noPosts: { ar: 'والو حاليا', en: 'No posts', fr: 'Aucun post' },
  
  // --- PROVIDER PORTAL ---
  controlRoom: { ar: 'غرفة التحكم', en: 'Control Room', fr: 'Salle de Contrôle' },
  goToApp: { ar: 'تطبيق الزبناء', en: 'Client View', fr: 'Vue Client' },
  qrScannerTitle: { ar: 'مسح الكود', en: 'Scan QR', fr: 'Scanner QR' },
  notifications: { ar: 'الإشعارات', en: 'Notifications', fr: 'Notifications' },
  scanHistory: { ar: 'سجل الزبناء', en: 'History', fr: 'Historique' },
  requestBoost: { ar: 'طلب إشهار', en: 'Request Ad', fr: 'Demande Pub' },
  verificationSuccess: { ar: 'كود صحيح!', en: 'Valid!', fr: 'Valide !' },
  invalidQR: { ar: 'كود غير صالح', en: 'Invalid QR', fr: 'QR Invalide' },
  wrongProvider: { ar: 'خطأ: هذا الموعد ليس لك', en: 'Error: Appointment not for you', fr: 'Erreur: RDV pas pour vous' },
  scanWithCamera: { ar: 'الكاميرا', en: 'Camera', fr: 'Caméra' },
  uploadQRImage: { ar: 'رفع صورة من الملفات', en: 'Upload QR File', fr: 'Importer Fichier QR' },
  messageLabel: { ar: 'نص الإعلان...', en: 'Ad text...', fr: 'Texte pub...' },
  sendButton: { ar: 'إرسال', en: 'Send', fr: 'Envoyer' },
  requestSent: { ar: 'تم استلام طلبك. سيقوم الأدمن بمراجعة الإعلان والاتصال بكم.', en: 'Request received. Admin will review and contact you.', fr: 'Reçu. L\'admin vous contactera.' },
  uploadError: { ar: 'خطأ', en: 'Error', fr: 'Erreur' },
  providerDirectory: { ar: 'دليل المهنيين', en: 'Provider Directory', fr: 'Annuaire Pro' },
  paidAdDesc: { ar: 'خدمة مدفوعة (50 درهم/أسبوع). إعلانك سيظهر في قائمة المحادثات.', en: 'Paid Service (50DH/Week). Ad appears in chat list.', fr: 'Service Payant (50DH/Semaine). Pub dans la liste.' },
  
  // --- OFFERS & URGENT ADS ---
  offers: { ar: 'العروض', en: 'Offers', fr: 'Offres' },
  createOffer: { ar: 'إنشاء عرض', en: 'Create Offer', fr: 'Créer Offre' },
  urgentAds: { ar: 'إعلان عاجل', en: 'Urgent Ad', fr: 'Annonce Urgente' },
  createUrgentAd: { ar: 'إنشاء إعلان عاجل (الشريط)', en: 'Create Ticker Ad', fr: 'Créer Ticker' },
  statsTitle: { ar: 'الإحصائيات', en: 'Statistics', fr: 'Statistiques' },
  clientName: { ar: 'إسم الزبون', en: 'Client Name', fr: 'Nom Client' },
  visitDate: { ar: 'تاريخ الزيارة', en: 'Visit Date', fr: 'Date Visite' },
  originalPrice: { ar: 'الثمن الأصلي', en: 'Original Price', fr: 'Prix Original' },
  discountPrice: { ar: 'ثمن التخفيض', en: 'Discount Price', fr: 'Prix Remisé' },
  titleLabel: { ar: 'العنوان', en: 'Title', fr: 'Titre' },
  offersDesc: { ar: 'إضافة العروض تساعد في زيادة الحجوزات بنسبة كبيرة. العروض تظهر في صفحتك الشخصية للزبناء.', en: 'Adding offers increases bookings. They appear on your profile.', fr: 'Ajouter des offres augmente les réservations.' },
  urgentAdsDesc: { ar: 'الإعلان العاجل يظهر كشريط إخباري عند جميع متابعيك. استخدمه للإعلانات الهامة فقط.', en: 'Urgent ads appear as a ticker for all followers.', fr: 'Les pubs urgentes apparaissent pour tous les abonnés.' },
  statusPending: { ar: 'في الانتظار', en: 'Pending', fr: 'En attente' },
  statusVerified: { ar: 'تم التحقق', en: 'Verified', fr: 'Vérifié' },
  
  // --- ERRORS ---
  errorMessage: { ar: 'خطأ', en: 'Error', fr: 'Erreur' },
  loginRequired: { ar: 'سجل الدخول', en: 'Login First', fr: 'Connexion Requise' },
  success: { ar: 'تم بنجاح', en: 'Success', fr: 'Succès' },

  // --- OTHERS ---
  priceDH: { ar: 'د.م', en: 'DH', fr: 'DH' },
  call: { ar: 'اتصل', en: 'Call', fr: 'Appeler' },
  shop: { ar: 'المتجر', en: 'Shop', fr: 'Boutique' },
  myAppointments: { ar: 'مواعيدي', en: 'Appointments', fr: 'RDV' },
  databaseSetupTitle: { ar: 'إعداد قاعدة البيانات', en: 'DB Setup', fr: 'Config BDD' },
  bookedOn: { ar: 'يوم', en: 'On', fr: 'Le' },
  noAppointmentsFound: { ar: 'لا توجد مواعيد', en: 'No appointments', fr: 'Aucun RDV' },
  viewQRCode: { ar: 'QR', en: 'QR', fr: 'QR' },
  downloadQR: { ar: 'تحميل', en: 'Download', fr: 'Télécharger' },
  copied: { ar: 'منسوخ', en: 'Copied', fr: 'Copié' },
  copyCode: { ar: 'نسخ', en: 'Copy', fr: 'Copier' },
  databaseSetupDesc: { ar: 'شغل هاد الأكواد ف Supabase', en: 'Run in Supabase', fr: 'Exécuter dans Supabase' },
  createAdminUser: { ar: 'إنشاء أدمن', en: 'Create Admin', fr: 'Créer Admin' },
  completeSQLScript: { ar: 'الكل', en: 'All', fr: 'Tout' },
  v12UpdateTitle: { ar: 'تحديث V12', en: 'V12', fr: 'V12' },
  v13UpdateTitle: { ar: 'تحديث V13', en: 'V13', fr: 'V13' },
  
  // --- NEIGHBORHOODS ---
  neighborhoods: {
    ar: 'مسنانة, كسبارطا, درادب, وسط المدينة, مالاباطا, مجيمع, فال فلوري, بني مكادة, العوامة, مرشان, بوخالف, طنجة البالية, سيدي ادريس, المصلى, شارع محمد الخامس, بلاصاطورو, الزياتن, الجيراري, السواني, مغوغة, البرانص, كاليفورنيا, عين قطيوط, مرجان, ايبيريا',
    en: 'Mesnana, Casabarata, Dradeb, City Center, Malabata, Mojamaa, Val Fleuri, Bani Makada, Aouama, Marchan, Boukhalef, Tanger Balia, Sidi Driss, Msalla, Mohamed V Blvd, Placatoro, Ziaten, Jirari, Souani, Mghogha, Braness, California, Ain Ktiwat, Marjane, Iberia',
    fr: 'Mesnana, Casabarata, Dradeb, Centre Ville, Malabata, Mojamaa, Val Fleuri, Bani Makada, Aouama, Marchan, Boukhalef, Tanger Balia, Sidi Driss, Msalla, Bd Mohamed V, Placatoro, Ziaten, Jirari, Souani, Mghogha, Braness, California, Ain Ktiwat, Marjane, Iberia',
  },
  
  // Filters
  price: { ar: 'الثمن', en: 'Price', fr: 'Prix' },
  minPrice: { ar: 'من', en: 'Min', fr: 'Min' },
  maxPrice: { ar: 'إلى', en: 'Max', fr: 'Max' },
  allNeighborhoods: { ar: 'كل الأحياء', en: 'All Areas', fr: 'Tous Quartiers' },
  forRent: { ar: 'كراء', en: 'Rent', fr: 'Location' },
  forSale: { ar: 'بيع', en: 'Sale', fr: 'Vente' },
  propertyTitle: { ar: 'العنوان', en: 'Title', fr: 'Titre' },
  propertyType: { ar: 'النوع', en: 'Type', fr: 'Type' },
  selectNeighborhood: { ar: 'الحي', en: 'Area', fr: 'Quartier' },
  submitAd: { ar: 'نشر', en: 'Submit', fr: 'Publier' },
  noNotifications: { ar: 'لا إشعارات', en: 'No notifications', fr: 'Aucune notif' },

  // Job Categories
  cat_security: { ar: 'أمن', en: 'Security', fr: 'Sécurité' },
  cat_nurse: { ar: 'تمريض', en: 'Nursing', fr: 'Infirmier' },
  cat_med_assistant: { ar: 'مساعد طبي', en: 'Medical Assistant', fr: 'Assistant Médical' },
  cat_reception: { ar: 'استقبال', en: 'Reception', fr: 'Réception' },
  cat_services: { ar: 'خدمات', en: 'Services', fr: 'Services' },
  cat_accountant: { ar: 'محاسبة', en: 'Accounting', fr: 'Comptabilité' },
  cat_other: { ar: 'آخر', en: 'Other', fr: 'Autre' },
  jobDescPlaceholder: { ar: 'الوصف...', en: 'Description...', fr: 'Description...' }
};

interface LocalizationContextType {
  t: (key: string) => string;
  language: Language;
  setLanguage: (lang: Language) => void;
  dir: 'rtl' | 'ltr';
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(Language.AR);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string) => {
    const translation = translations[key]?.[language];
    if (!translation) return translations[key]?.['ar'] || key;
    return translation;
  };

  return React.createElement(
    LocalizationContext.Provider,
    { value: { t, language, setLanguage, dir: language === 'ar' ? 'rtl' : 'ltr' } },
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
