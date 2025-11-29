
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
  statusActive: { ar: 'حساب مفعل', en: 'Active', fr: 'Actif' },
  statusPending: { ar: 'في الانتظار', en: 'Pending', fr: 'En attente' },
  welcomeProvider: { ar: 'مرحباً، {name}', en: 'Welcome, {name}', fr: 'Bienvenue, {name}' },
  
  // --- PROFILE & DIRECTORY ---
  providerDirectory: { ar: 'دليل المهنيين', en: 'Provider Directory', fr: 'Annuaire Pro' },
  searchProviderPlaceholder: { ar: 'بحث عن مهني أو خدمة...', en: 'Search provider or service...', fr: 'Chercher un pro ou service...' },
  followers: { ar: 'متابعين', en: 'Followers', fr: 'Abonnés' },
  clientsToday: { ar: 'زبناء اليوم', en: 'Clients Today', fr: 'Clients Aujourd\'hui' },
  totalScans: { ar: 'مجموع العمليات', en: 'Total Scans', fr: 'Total Scans' },
  activeAds: { ar: 'إعلانات نشطة', en: 'Active Ads', fr: 'Pubs Actives' },
  follow: { ar: 'متابعة', en: 'Follow', fr: 'Suivre' },
  unfollow: { ar: 'إلغاء المتابعة', en: 'Unfollow', fr: 'Ne plus suivre' },
  services: { ar: 'الخدمات', en: 'Services', fr: 'Services' },
  posts: { ar: 'المنشورات', en: 'Posts', fr: 'Publications' },
  about: { ar: 'معلومات', en: 'About', fr: 'À propos' },
  noServices: { ar: 'لا توجد خدمات حاليا', en: 'No services listed', fr: 'Aucun service listé' },
  noPosts: { ar: 'لا توجد منشورات حاليا', en: 'No posts yet', fr: 'Aucune publication' },
  call: { ar: 'اتصال', en: 'Call', fr: 'Appeler' },
  profileAndServices: { ar: 'الملف الشخصي والخدمات', en: 'Profile & Services', fr: 'Profil & Services' },
  bioLabel: { ar: 'نبذة تعريفية (Bio)', en: 'Bio', fr: 'Bio' },
  uploadProfileImage: { ar: 'تغيير الصورة', en: 'Change Photo', fr: 'Changer Photo' },
  removeImage: { ar: 'حذف الصورة', en: 'Remove Photo', fr: 'Supprimer Photo' },
  uploading: { ar: 'جاري الرفع...', en: 'Uploading...', fr: 'Téléchargement...' },
  saveProfile: { ar: 'حفظ التغييرات', en: 'Save Changes', fr: 'Enregistrer' },
  savedSuccessfully: { ar: 'تم الحفظ بنجاح', en: 'Saved successfully', fr: 'Enregistré avec succès' },
  addService: { ar: 'إضافة خدمة جديدة', en: 'Add New Service', fr: 'Ajouter Service' },
  serviceName: { ar: 'اسم الخدمة', en: 'Service Name', fr: 'Nom Service' },
  discountPrice: { ar: 'تخفيض (اختياري)', en: 'Discount (Opt)', fr: 'Réduction (Opt)' },
  setLocation: { ar: 'تحديد الموقع GPS', en: 'Set GPS Location', fr: 'Définir GPS' },
  locationSet: { ar: 'تم تحديد الموقع', en: 'Location Set', fr: 'Localisation définie' },
  locationError: { ar: 'فشل تحديد الموقع', en: 'Location Failed', fr: 'Échec Localisation' },
  
  // --- CLIENT PROFILE ---
  myProfile: { ar: 'ملفي الشخصي', en: 'My Profile', fr: 'Mon Profil' },
  followingProviders: { ar: 'أتابعهم', en: 'Following', fr: 'Abonnements' },
  upcomingAppointments: { ar: 'مواعيدي', en: 'Appointments', fr: 'Rendez-vous' },
  timeRemaining: { ar: 'الوقت المتبقي', en: 'Time Remaining', fr: 'Temps restant' },
  days: { ar: 'أيام', en: 'days', fr: 'jours' },
  hours: { ar: 'ساعات', en: 'hours', fr: 'heures' },
  noAppointments: { ar: 'لا توجد مواعيد قادمة', en: 'No upcoming appointments', fr: 'Pas de RDV à venir' },

  // --- JOBS (SOUQ CHOGHL) ---
  jobBoardTitle: { ar: 'سوق الشغل', en: 'Job Market', fr: 'Marché de l\'emploi' },
  tabOffers: { ar: 'فرص عمل (شركات)', en: 'Job Offers', fr: 'Offres d\'emploi' },
  tabTalent: { ar: 'طلبات عمل (كفاءات)', en: 'Talent / CVs', fr: 'Talents / CVs' },
  
  // Filters
  filterAll: { ar: 'الكل', en: 'All', fr: 'Tout' },
  cat_security: { ar: 'حارس أمن', en: 'Security', fr: 'Sécurité' },
  cat_nurse: { ar: 'ممرض(ة)', en: 'Nurse', fr: 'Infirmier(ère)' },
  cat_med_assistant: { ar: 'مساعد طبي', en: 'Medical Assistant', fr: 'Assistant Médical' },
  cat_reception: { ar: 'موضف إستقبال', en: 'Receptionist', fr: 'Réceptionniste' },
  cat_services: { ar: 'خدمات عامة', en: 'General Services', fr: 'Services Généraux' },
  cat_accountant: { ar: 'محاسب', en: 'Accountant', fr: 'Comptable' },
  cat_other: { ar: 'آخر', en: 'Other', fr: 'Autre' },
  
  // Actions
  postNewAd: { ar: 'نشر إعلان جديد', en: 'Post New Ad', fr: 'Publier Annonce' },
  iamHiring: { ar: 'عندي عرض عمل (أوظف)', en: 'I am Hiring', fr: 'Je recrute' },
  iamLooking: { ar: 'أبحث عن عمل', en: 'I need a Job', fr: 'Je cherche un emploi' },
  
  // Card Details
  salary: { ar: 'الراتب', en: 'Salary', fr: 'Salaire' },
  applyWhatsApp: { ar: 'تواصل عبر واتساب', en: 'Apply via WhatsApp', fr: 'Postuler via WhatsApp' },
  hireWhatsApp: { ar: 'توظيف عبر واتساب', en: 'Contact via WhatsApp', fr: 'Contacter via WhatsApp' },
  postedAgo: { ar: 'منذ', en: 'Ago', fr: 'Il y a' },
  
  // Form
  jobTitle: { ar: 'عنوان المهنة', en: 'Job Title', fr: 'Titre du poste' },
  jobDescPlaceholder: { ar: 'وصف العمل، المتطلبات، التوقيت...', en: 'Job description, requirements...', fr: 'Description, prérequis...' },
  skillsPlaceholder: { ar: 'المهارات (مثال: سياقة، فرنسية...)', en: 'Skills (e.g. Driving, English...)', fr: 'Compétences...' },
  salaryPlaceholder: { ar: 'الراتب المقترح (اختياري)', en: 'Salary (Optional)', fr: 'Salaire (Optionnel)' },
  postNow: { ar: 'نشر الآن', en: 'Post Now', fr: 'Publier' },
  jobCategory: { ar: 'المجال / التخصص', en: 'Category', fr: 'Catégorie' },
  experienceDesc: { ar: 'تفاصيل الخبرة / العرض', en: 'Details', fr: 'Détails' },
  chooseRole: { ar: 'اختر صفتك', en: 'Choose Role', fr: 'Choisir le rôle' },

  comments: { ar: 'تعليقات', en: 'Comments', fr: 'Commentaires' },
  writeComment: { ar: 'أكتب تعليق...', en: 'Write a comment...', fr: 'Écrire un commentaire...' },
  
  // --- REAL ESTATE (SAMSAR) ---
  realEstateTitle: { ar: 'العقار (سمسار)', en: 'Real Estate', fr: 'Immobilier' },
  postAd: { ar: 'نشر إعلان عقاري', en: 'Post Ad', fr: 'Publier une annonce' },
  filterRent: { ar: 'كراء', en: 'Rent', fr: 'Location' },
  filterBuy: { ar: 'شراء', en: 'Buy', fr: 'Achat' },
  propertyTitle: { ar: 'عنوان الإعلان', en: 'Property Title', fr: 'Titre de l\'annonce' },
  propertyType: { ar: 'نوع العرض', en: 'Type', fr: 'Type' },
  forRent: { ar: 'للكراء', en: 'For Rent', fr: 'A Louer' },
  forSale: { ar: 'للبيع', en: 'For Sale', fr: 'A Vendre' },
  priceDH: { ar: 'الثمن (درهم)', en: 'Price (DH)', fr: 'Prix (DH)' },
  location: { ar: 'الموقع / الحي', en: 'Location', fr: 'Emplacement' },
  description: { ar: 'الوصف', en: 'Description', fr: 'Description' },
  submitAd: { ar: 'نشر الإعلان', en: 'Submit Ad', fr: 'Publier' },
  selectNeighborhood: { ar: 'اختر الحي', en: 'Select Neighborhood', fr: 'Choisir Quartier' },
  allNeighborhoods: { ar: 'كل الأحياء', en: 'All Neighborhoods', fr: 'Tous les quartiers' },
  filterLocation: { ar: 'تصفية حسب الحي', en: 'Filter by Location', fr: 'Filtrer par quartier' },
  minPrice: { ar: 'أقل ثمن', en: 'Min Price', fr: 'Prix Min' },
  maxPrice: { ar: 'أقصى ثمن', en: 'Max Price', fr: 'Prix Max' },
  
  // --- STORE ---
  shop: { ar: 'المتجر', en: 'Store', fr: 'Boutique' },
  addToCart: { ar: 'أضف للسلة', en: 'Add to Cart', fr: 'Ajouter au panier' },
  
  // --- ERRORS & ALERTS ---
  loginRequired: { ar: 'المرجو تسجيل الدخول أولا', en: 'Please login first', fr: 'Veuillez vous connecter d\'abord' },
  errorMessage: { ar: 'حدث خطأ ما', en: 'Something went wrong', fr: 'Une erreur s\'est produite' },
  success: { ar: 'تمت العملية بنجاح', en: 'Success!', fr: 'Succès !' },
  phoneExistsError: { ar: 'هذا الهاتف مسجل بالفعل', en: 'Phone already exists', fr: 'Téléphone existe déjà' },
  usernameExistsError: { ar: 'اسم المستخدم مسجل بالفعل', en: 'Username taken', fr: 'Nom d\'utilisateur pris' },
  registrationFailed: { ar: 'فشل التسجيل', en: 'Registration Failed', fr: 'Échec de l\'inscription' },
  gpsPermissionDenied: { ar: 'تم رفض إذن الوصول للموقع', en: 'GPS permission denied', fr: 'Permission GPS refusée' },
  gpsUnavailable: { ar: 'خدمة الموقع غير متاحة', en: 'GPS unavailable', fr: 'GPS indisponible' },
  gpsTimeout: { ar: 'انتهت مهلة تحديد الموقع', en: 'GPS timeout', fr: 'Délai GPS dépassé' },
  
  // --- NEIGHBORHOODS ---
  neighborhoods: {
    ar: 'مسنانة, كسبارطا, درادب, وسط المدينة, مالاباطا, مجيمع, فال فلوري, بني مكادة, العوامة, مرشان, بوخالف, طنجة البالية, سيدي ادريس, المصلى, شارع محمد الخامس, بلاصاطورو, الزياتن, الجيراري, السواني, مغوغة, البرانص, كاليفورنيا, عين قطيوط, مرجان, ايبيريا',
    en: 'Mesnana, Casabarata, Dradeb, City Center, Malabata, Mojamaa, Val Fleuri, Bani Makada, Aouama, Marchan, Boukhalef, Tanger Balia, Sidi Driss, Msalla, Mohamed V Blvd, Placatoro, Ziaten, Jirari, Souani, Mghogha, Braness, California, Ain Ktiwat, Marjane, Iberia',
    fr: 'Mesnana, Casabarata, Dradeb, Centre Ville, Malabata, Mojamaa, Val Fleuri, Bani Makada, Aouama, Marchan, Boukhalef, Tanger Balia, Sidi Driss, Msalla, Bd Mohamed V, Placatoro, Ziaten, Jirari, Souani, Mghogha, Braness, California, Ain Ktiwat, Marjane, Iberia',
  },
  
  // --- AI CHAT ---
  welcomeMessage: {
    ar: 'مرحبا بك فالمساعد الذكي ديال طنجة! كيفاش نقدر نعاونك؟',
    en: 'Welcome to TangerConnect AI! How can I help you?',
    fr: 'Bienvenue sur TangerConnect AI ! Comment puis-je vous aider ?',
  },
  welcomeBackMessage: {
    ar: 'مرحبا بعودتك، {name}! ',
    en: 'Welcome back, {name}! ',
    fr: 'Bon retour, {name} ! ',
  },
  inputPlaceholder: {
    ar: 'كتب ميساج هنا...',
    en: 'Type a message...',
    fr: 'Écrivez un message...',
  },
  registrationSuccessMessage: {
    ar: 'تم التسجيل بنجاح!',
    en: 'Registered successfully!',
    fr: 'Inscription réussie !',
  },
  providerRegistrationSuccessMessage: {
    ar: 'تم تسجيل طلبك كمزود خدمة.',
    en: 'Provider request registered.',
    fr: 'Demande fournisseur enregistrée.',
  },
  bookingSuccessMessage: {
    ar: 'تم حجز الموعد بنجاح!',
    en: 'Booking confirmed!',
    fr: 'Réservation confirmée !',
  },
  bookingConfirmedTitle: { ar: 'تأكيد الحجز', en: 'Booking Confirmed', fr: 'Réservation Confirmée' },
  service: { ar: 'الخدمة', en: 'Service', fr: 'Service' },
  with: { ar: 'مع', en: 'With', fr: 'Avec' },
  discountApplied: { ar: 'تخفيض', en: 'Discount', fr: 'Réduction' },
  qrInstruction: { ar: 'وري هاد الكود للمهني', en: 'Show this QR to provider', fr: 'Montrez ce QR au pro' },
  
  // --- MENUS ---
  myAppointments: { ar: 'مواعيدي', en: 'My Appointments', fr: 'Mes Rendez-vous' },
  notifications: { ar: 'الإشعارات', en: 'Notifications', fr: 'Notifications' },
  noNotifications: { ar: 'لا توجد إشعارات', en: 'No notifications', fr: 'Pas de notifications' },
  providerNotifications: { ar: 'إشعارات المزود', en: 'Provider Alerts', fr: 'Alertes Fournisseur' },
  notificationDetails: { ar: 'تفاصيل الإشعار', en: 'Details', fr: 'Détails' },
  clientHasArrived: { ar: 'الزبون وصل', en: 'Client Arrived', fr: 'Client Arrivé' },
  clientPending: { ar: 'حجز جديد', en: 'New Booking', fr: 'Nouvelle Réservation' },
  clientName: { ar: 'إسم الزبون', en: 'Client Name', fr: 'Nom Client' },
  markAsCompleted: { ar: 'تأكيد العملية', en: 'Complete', fr: 'Terminer' },
  scanHistory: { ar: 'سجل العمليات', en: 'Scan History', fr: 'Historique' },
  qrScannerTitle: { ar: 'ماسح الكود (QR)', en: 'QR Scanner', fr: 'Scanner QR' },
  scanWithCamera: { ar: 'مسح بالكاميرا', en: 'Scan Camera', fr: 'Scanner Caméra' },
  uploadQRImage: { ar: 'رفع صورة QR', en: 'Upload QR', fr: 'Importer QR' },
  qrNotDetected: { ar: 'لم يتم التعرف على الكود', en: 'No QR found', fr: 'Aucun QR trouvé' },
  invalidQR: { ar: 'كود غير صالح', en: 'Invalid QR', fr: 'QR Invalide' },
  verificationSuccess: { ar: 'تم التحقق بنجاح', en: 'Verified!', fr: 'Vérifié !' },
  tryAgain: { ar: 'حاول مجدداً', en: 'Try Again', fr: 'Réessayer' },
  
  // --- DATABASE SETUP ---
  databaseSetupTitle: { ar: 'إعداد قاعدة البيانات', en: 'Database Setup', fr: 'Config Base de Données' },
  databaseSetupDesc: { ar: 'إعدادات الأدمن', en: 'Admin Settings', fr: 'Paramètres Admin' },
  createAdminUser: { ar: 'إنشاء حساب أدمن', en: 'Create Admin', fr: 'Créer Admin' },
  completeSQLScript: { ar: 'كود SQL الكامل', en: 'Complete SQL Script', fr: 'Script SQL Complet' },
  copyCode: { ar: 'نسخ', en: 'Copy', fr: 'Copier' },
  copied: { ar: 'تم النسخ', en: 'Copied', fr: 'Copié' },
  
  // --- FITTING ROOM ---
  virtualFittingRoom: { ar: 'غرفة القياس', en: 'Fitting Room', fr: 'Cabine d\'essayage' },
  fittingRoomStep1: { ar: 'القياسات', en: 'Measurements', fr: 'Mesures' },
  fittingRoomStep2: { ar: 'رفع صورة', en: 'Upload Photo', fr: 'Télécharger Photo' },
  heightCm: { ar: 'الطول (cm)', en: 'Height (cm)', fr: 'Taille (cm)' },
  weightKg: { ar: 'الوزن (kg)', en: 'Weight (kg)', fr: 'Poids (kg)' },
  yourSize: { ar: 'المقاس', en: 'Size', fr: 'Taille' },
  continue: { ar: 'تابع', en: 'Continue', fr: 'Continuer' },
  takePhoto: { ar: 'التقاط صورة', en: 'Take Photo', fr: 'Prendre Photo' },
  uploadImageOrVideo: { ar: 'معرض الصور', en: 'Gallery', fr: 'Galerie' },
  scale: { ar: 'تكبير', en: 'Scale', fr: 'Échelle' },
  move: { ar: 'تحريك', en: 'Move', fr: 'Déplacer' },
  addToCartClose: { ar: 'أضف وأغلق', en: 'Add & Close', fr: 'Ajouter & Fermer' },
  
  // --- STORE MANAGER ---
  storeManager: { ar: 'إدارة المتجر', en: 'Store Manager', fr: 'Gestion Boutique' },
  products: { ar: 'المنتجات', en: 'Products', fr: 'Produits' },
  orders: { ar: 'الطلبات', en: 'Orders', fr: 'Commandes' },
  systemAds: { ar: 'الإعلانات', en: 'Ads', fr: 'Publicités' },
  addProduct: { ar: 'إضافة منتج', en: 'Add Product', fr: 'Ajouter Produit' },
  editProduct: { ar: 'تعديل منتج', en: 'Edit Product', fr: 'Modifier Produit' },
  productName: { ar: 'إسم المنتج', en: 'Product Name', fr: 'Nom Produit' },
  price: { ar: 'الثمن', en: 'Price', fr: 'Prix' },
  sizes: { ar: 'المقاسات', en: 'Sizes', fr: 'Tailles' },
  productDescription: { ar: 'الوصف', en: 'Description', fr: 'Description' },
  addSystemAd: { ar: 'إضافة إعلان', en: 'Add Ad', fr: 'Ajouter Pub' },
  adTitle: { ar: 'العنوان', en: 'Title', fr: 'Titre' },
  messageLabel: { ar: 'الرسالة', en: 'Message', fr: 'Message' },
  sendButton: { ar: 'إرسال', en: 'Send', fr: 'Envoyer' },
  sendAnnouncementTitle: { ar: 'إرسال إشعار للمتابعين', en: 'Send Alert', fr: 'Envoyer Alerte' },
  messagePlaceholder: { ar: 'أكتب رسالة...', en: 'Type message...', fr: 'Écrire message...' },
  myActiveAds: { ar: 'إعلاناتي النشطة', en: 'My Active Ads', fr: 'Mes Pubs Actives' },
  allFieldsRequired: { ar: 'المرجو ملء جميع الخانات', en: 'All fields required', fr: 'Champs requis' },
  uploadError: { ar: 'خطأ في الرفع', en: 'Upload Error', fr: 'Erreur Téléchargement' },
  orderPlaced: { ar: 'تم الطلب!', en: 'Order Placed!', fr: 'Commande Passée !' },
  freeDelivery: { ar: 'توصيل مجاني', en: 'Free Delivery', fr: 'Livraison Gratuite' },
  contactWithin24h: { ar: 'سنتصل بك قريبا', en: 'We will contact you soon', fr: 'On vous contactera bientôt' },
  trackOrder: { ar: 'تتبع الطلب', en: 'Track Order', fr: 'Suivre Commande' },
  backToStore: { ar: 'رجوع للمتجر', en: 'Back to Store', fr: 'Retour Boutique' },
  searchProductPlaceholder: { ar: 'بحث عن منتج...', en: 'Search product...', fr: 'Chercher produit...' },
  myOrders: { ar: 'طلباتي', en: 'My Orders', fr: 'Mes Commandes' },
  noFollowUps: { ar: 'لا يوجد', en: 'Empty', fr: 'Vide' },
  checkout: { ar: 'شراء الآن', en: 'Checkout', fr: 'Acheter' },
  selectSize: { ar: 'اختر المقاس', en: 'Select Size', fr: 'Choisir Taille' },
  virtualFittingRoomShort: { ar: 'قياس افتراضي', en: 'Try On', fr: 'Essayer' },
  v13UpdateTitle: { ar: 'تحديث 13 (صور متعددة)', en: 'V13 Update', fr: 'Mise à jour V13' },
  v12UpdateTitle: { ar: 'تحديث 12 (إدارة المتجر)', en: 'V12 Update', fr: 'Mise à jour V12' },
  subscriptionExpired: { ar: 'انتهى الاشتراك', en: 'Subscription Expired', fr: 'Abonnement Expiré' },
  accountLockedDesc: { ar: 'المرجو تجديد الاشتراك لمتابعة استخدام حسابك المهني.', en: 'Please renew to continue using your provider account.', fr: 'Veuillez renouveler pour continuer.' },
  renewNow: { ar: 'تجديد الآن', en: 'Renew Now', fr: 'Renouveler' },
  subscriptionWarning: { ar: 'تنبيه الاشتراك', en: 'Subscription Warning', fr: 'Alerte Abonnement' },
  daysLeft: { ar: 'بقي {days} أيام', en: '{days} days left', fr: '{days} jours restants' },
  statistics: { ar: 'الإحصائيات', en: 'Statistics', fr: 'Statistiques' },
  breakingNews: { ar: 'عاجل', en: 'News', fr: 'Infos' },
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
