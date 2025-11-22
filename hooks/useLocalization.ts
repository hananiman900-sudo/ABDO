
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
  providerView: {
    ar: 'واجهة المزود',
    en: 'Provider View',
    fr: 'Vue Fournisseur',
  },
  clientView: {
    ar: 'واجهة الكليان',
    en: 'Client View',
    fr: 'Vue Client',
  },
  loginRegister: {
    ar: 'تسجيل الدخول / إنشاء حساب',
    en: 'Login / Register',
    fr: 'Connexion / S\'inscrire',
  },
  loginTitle: {
    ar: 'تسجيل الدخول',
    en: 'Login',
    fr: 'Connexion',
  },
  registerTitle: {
    ar: 'إنشاء حساب جديد',
    en: 'Create a New Account',
    fr: 'Créer un nouveau compte',
  },
  logout: {
    ar: 'تسجيل الخروج',
    en: 'Logout',
    fr: 'Déconnexion',
  },
  accountType: { ar: 'نوع الحساب', en: 'Account Type', fr: 'Type de compte' },
  client: { ar: 'كليان', en: 'Client', fr: 'Client' },
  provider: { ar: 'مزود الخدمة', en: 'Provider', fr: 'Fournisseur' },
  phone: { ar: 'رقم الهاتف', en: 'Phone Number', fr: 'Numéro de téléphone' },
  fullName: { ar: 'الإسم الكامل', en: 'Full Name', fr: 'Nom complet' },
  businessName: { ar: 'إسم الشركة', en: 'Business Name', fr: 'Nom de l\'entreprise' },
  serviceType: { ar: 'نوع الخدمة', en: 'Service Type', fr: 'Type de service' },
  address: { ar: 'العنوان', en: 'Address', fr: 'Adresse' },
  password: {
    ar: 'كلمة السر',
    en: 'Password',
    fr: 'Mot de passe',
  },
  loginButton: { ar: 'الدخول', en: 'Login', fr: 'Connexion' },
  registerButton: { ar: 'تسجيل', en: 'Register', fr: 'S\'inscrire' },
  loading: { ar: 'جاري التحميل...', en: 'Loading...', fr: 'Chargement...' },
  haveAccount: { ar: 'عندك حساب ديجا؟', en: 'Already have an account?', fr: 'Vous avez déjà un compte ?' },
  noAccount: { ar: 'معندكش حساب؟', en: 'Don\'t have an account?', fr: 'Pas de compte ?' },
  allFieldsRequired: { ar: 'عافاك عمر جميع الخانات.', en: 'Please fill in all fields.', fr: 'Veuillez remplir tous les champs.' },
  loginFailed: { ar: 'معلومات الدخول غالطة.', en: 'Login failed. Please check your credentials.', fr: 'Échec de la connexion. Veuillez vérifier vos identifiants.' },
  registrationFailed: { ar: 'التسجيل فشل. حاول مرة خرى.', en: 'Registration failed. Please try again.', fr: 'L\'inscription a échoué. Veuillez réessayer.' },
  clientsTableMissingError: {
    ar: "خطأ: جدول 'clients' غير موجود في قاعدة البيانات. يرجى التأكد من إعداده بشكل صحيح.",
    en: "Error: The 'clients' table is missing from the database. Please ensure it is set up correctly.",
    fr: "Erreur : La table 'clients' est manquante dans la base de données. Veuillez vous assurer qu'elle est correctement configurée.",
  },
  providersTableMissingError: {
    ar: "خطأ: جدول 'providers' غير موجود في قاعدة البيانات. يرجى التأكد من إعداده بشكل صحيح.",
    en: "Error: The 'providers' table is missing from the database. Please ensure it is set up correctly.",
    fr: "Erreur : La table 'providers' est manquante dans la base de données. Veuillez vous assurer qu'elle est correctement configurée.",
  },
  phoneExistsError: {
    ar: 'هاد النمرة ديجا مسجلة. عافاك دخل للحساب ديالك.',
    en: 'This phone number is already registered. Please log in.',
    fr: 'Ce numéro de téléphone est déjà enregistré. Veuillez vous connecter.',
  },
  usernameExistsError: {
    ar: 'هاد إسم المستخدم ديجا كاين. عافاك ختار واحد آخر.',
    en: 'This username is already taken. Please choose another one.',
    fr: 'Ce nom d\'utilisateur est déjà pris. Veuillez en choisir un autre.',
  },
  welcomeMessage: {
    ar: 'مرحبا بك فالمساعد الذكي ديال طنجة! تقدر تسول لي بغيتي، ولا تسجل الدخول باش تستافد من خدمات كتر.',
    en: 'Welcome to the Tangier AI Assistant! You can ask a question or log in to access more services.',
    fr: 'Bienvenue à l\'Assistant IA de Tanger ! Vous pouvez poser une question ou vous connecter pour accéder à plus de services.',
  },
  welcomeBackMessage: {
    ar: 'مرحبا بعودتك، {name}! كيفاش نقدر نعاونك اليوم؟',
    en: 'Welcome back, {name}! How can I help you today?',
    fr: 'Content de vous revoir, {name} ! Comment puis-je vous aider aujourd\'hui ?',
  },
  registrationSuccessMessage: {
    ar: 'شكرا! تم التسجيل ديالك بنجاح. دابا، كيفاش نقدر نعاونك؟',
    en: 'Thank you! You are now registered. Now, how can I help you?',
    fr: 'Merci ! Votre inscription est terminée. Maintenant, comment puis-je vous aider ?',
  },
  providerRegistrationSuccessMessage: {
    ar: 'شكرا! تم تسجيل الطلب ديالك. خاصك تخلص واجب الإشتراك (50 درهم) باش يتفعل الحساب. الإدارة غتتاصل بيك فالرقم لي سجلتي.',
    en: 'Thank you! Your request is registered. You must pay the subscription fee (50 DH) to activate your account. Admin will contact you.',
    fr: 'Merci ! Votre demande est enregistrée. Vous devez payer les frais d\'abonnement (50 DH) pour activer votre compte. L\'administration vous contactera.'
  },
  followUpSuccessMessage: {
    ar: 'تم بنجاح! تزادت المتابعة للملف ديالك.',
    en: 'Success! The follow-up has been added to your profile.',
    fr: 'Succès ! Le suivi a été ajouté à votre dossier.',
  },
  announcementsTitle: {
    ar: 'آخر الإعلانات',
    en: 'Latest Announcements',
    fr: 'Dernières annonces',
  },
  inputPlaceholder: {
    ar: 'كتب ميساج ولا تيليشارجي تصويرة...',
    en: 'Type a message or upload an image...',
    fr: 'Écrivez un message ou téléchargez une image...',
  },
  errorMessage: {
    ar: 'سمح لينا، وقع شي مشكل. عافاك حاول مرة خرى.',
    en: 'Sorry, something went wrong. Please try again.',
    fr: 'Désolé, une erreur s\'est produite. Veuillez réessayer.',
  },
  bookingConfirmedTitle: {
    ar: 'الرونديفو ديالك تأكد!',
    en: 'Booking Confirmed!',
    fr: 'Réservation confirmée !',
  },
  bookingSuccessMessage: {
    ar: 'مزيان! الرونديفو ديالك تشد بنجاح. هاهي المعلومات والكود QR ديالك.',
    en: 'Excellent! Your booking is confirmed. Here are your details and QR code.',
    fr: 'Excellent ! Votre réservation est confirmée. Voici vos détails et votre code QR.',
  },
  name: { ar: 'السمية', en: 'Name', fr: 'Nom' },
  service: { ar: 'الخدمة', en: 'Service', fr: 'Service' },
  with: { ar: 'مع', en: 'with', fr: 'avec' },
  location: { ar: 'الموقع', en: 'Location', fr: 'Emplacement' },
  discountApplied: { ar: 'التخفيض لي تطبق', en: 'Discount Applied', fr: 'Réduction appliquée' },
  downloadQR: { ar: 'تيليشارجي الكود', en: 'Download QR', fr: 'Télécharger le QR' },
  qrInstruction: {
    ar: 'عافاك وري هاد الكود لمزود الخدمة ملي توصل.',
    en: 'Please show this code to the service provider upon arrival.',
    fr: 'Veuillez montrer ce code au fournisseur de services à votre arrivée.',
  },
  qrScannerTitle: {
    ar: 'تأكيد المواعيد',
    en: 'Appointment Verification',
    fr: 'Vérification de rendez-vous',
  },
  qrScannerInstruction: {
    ar: 'سكاني الكود QR ديال الكليان ولا تيليشارجي تصويرة باش تأكد من الرونديفو.',
    en: 'Scan the client\'s QR code or upload an image to verify the appointment.',
    fr: 'Scannez le code QR du client ou téléchargez une image pour vérifier le rendez-vous.',
  },
  scanWithCamera: {
    ar: 'سكاني بالكاميرا',
    en: 'Scan with Camera',
    fr: 'Scanner avec la caméra',
  },
  uploadQRCode: {
    ar: 'تيليشارجي تصويرة ديال QR',
    en: 'Upload QR Image',
    fr: 'Télécharger l\'image QR',
  },
  qrNotDetected: {
    ar: 'مالقيناش شي كود QR فالتصويرة.',
    en: 'No QR code was detected in the image.',
    fr: 'Aucun code QR n\'a été détecté dans l\'image.',
  },
  invalidQR: {
    ar: 'الكود QR ماشي صحيح ولا مضروب.',
    en: 'Invalid or corrupted QR code.',
    fr: 'Code QR invalide ou corrompu.',
  },
  appointmentNotFound: {
    ar: 'الرونديفو مكاينش فالسيستيم.',
    en: 'Appointment not found in the system.',
    fr: 'Rendez-vous non trouvé dans le système.',
  },
  verifying: {
    ar: 'كنتأكدو...',
    en: 'Verifying...',
    fr: 'Vérification...',
  },
  verificationSuccess: {
    ar: 'تأكد بنجاح!',
    en: 'Verification Successful!',
    fr: 'Vérification réussie !',
  },
  appointmentID: { ar: 'نمرة الرونديفو', en: 'Appointment ID', fr: 'ID du rendez-vous' },
  clientName: { ar: 'سمية الكليان', en: 'Client Name', fr: 'Nom du client' },
  serviceBooked: { ar: 'الخدمة لي محجوزة', en: 'Service Booked', fr: 'Service réservé' },
  discount: { ar: 'التخفيض', en: 'Discount', fr: 'Réduction' },
  scanAnother: {
    ar: 'سكاني كود آخر',
    en: 'Scan Another Code',
    fr: 'Scanner un autre code',
  },
  verificationFailed: {
    ar: 'التأكيد فشل',
    en: 'Verification Failed',
    fr: 'Échec de la vérification',
  },
  tryAgain: {
    ar: 'حاول مرة خرى',
    en: 'Try Again',
    fr: 'Réessayer',
  },
  uploadImage: {
    ar: 'تيليشارجي تصويرة',
    en: 'Upload Image',
    fr: 'Télécharger une image',
  },
  removeImage: {
    ar: 'حيد التصويرة',
    en: 'Remove Image',
    fr: 'Retirer l\'image',
  },
  sendAnnouncementTitle: {
    ar: 'إرسال إعلان',
    en: 'Send Announcement',
    fr: 'Envoyer une annonce',
  },
  sendAnnouncementDesc: {
    ar: 'صيفط ميساج لجميع الكليان لي عندهم متابعة معاك.',
    en: 'Send a message to all clients who have a follow-up with you.',
    fr: 'Envoyez un message à tous les clients qui ont un suivi avec vous.',
  },
  selectProvider: {
    ar: 'ختار مزود الخدمة',
    en: 'Select Provider',
    fr: 'Sélectionnez le fournisseur',
  },
  messageLabel: {
    ar: 'الميساج',
    en: 'Message',
    fr: 'Message',
  },
  messagePlaceholder: {
    ar: 'كتب الإعلان ديالك هنا...',
    en: 'Write your announcement here...',
    fr: 'Écrivez votre annonce ici...',
  },
  sendButton: {
    ar: 'إرسال',
    en: 'Send',
    fr: 'Envoyer',
  },
  announcementSuccessMessage: {
    ar: 'تصيفط الإعلان بنجاح!',
    en: 'Announcement sent successfully!',
    fr: 'Annonce envoyée avec succès !',
  },
  announcementValidationError: {
    ar: 'عافاك، ختار مزود الخدمة وكتب شي ميساج.',
    en: 'Please, select a provider and write a message.',
    fr: 'Veuillez sélectionner un fournisseur et écrire un message.',
  },
  providerLoginTitle: {
    ar: 'بوابة مزود الخدمة',
    en: 'Provider Portal',
    fr: 'Portail Fournisseur',
  },
  pleaseLoginAsProvider: {
    ar: 'المرجو تسجيل الدخول كمزود خدمة لعرض هذه الصفحة.',
    en: 'Please log in as a provider to view this page.',
    fr: 'Veuillez vous connecter en tant que fournisseur pour voir cette page.',
  },
  providerLoginDesc: {
    ar: 'سجل الدخول باش تدبر الخدمات ديالك.',
    en: 'Log in to manage your services.',
    fr: 'Connectez-vous pour gérer vos services.',
  },
  username: {
    ar: 'إسم المستخدم',
    en: 'Username',
    fr: 'Nom d\'utilisateur',
  },
  providerLoginFailed: {
    ar: 'معلومات الدخول ديال المزود غالطة.',
    en: 'Invalid provider credentials.',
    fr: 'Identifiants de fournisseur invalides.',
  },
  welcomeProvider: {
    ar: 'مرحبا، {name}',
    en: 'Welcome, {name}',
    fr: 'Bienvenue, {name}',
  },
  clientFollowUps: {
    ar: 'متابعة الكليان',
    en: 'Client Follow-ups',
    fr: 'Suivis des clients',
  },
  clientFollowUpsDesc: {
    ar: 'هنا لائحة ديال المتابعات الجاية للكليان ديالك.',
    en: 'Here is a list of upcoming follow-ups for your clients.',
    fr: 'Voici une liste des suivis à venir pour vos clients.',
  },
  nextAppointment: {
    ar: 'الموعد الجاي',
    en: 'Next Appointment',
    fr: 'Prochain rendez-vous',
  },
  notes: {
    ar: 'ملاحظات',
    en: 'Notes',
    fr: 'Notes',
  },
  noFollowUps: {
    ar: 'ما كاين حتى متابعة حاليا.',
    en: 'No follow-ups found.',
    fr: 'Aucun suivi trouvé.',
  },
  dashboard: {
    ar: 'لوحة التحكم',
    en: 'Dashboard',
    fr: 'Tableau de bord',
  },
  myAppointments: {
    ar: 'مواعيدي',
    en: 'My Appointments',
    fr: 'Mes rendez-vous',
  },
  upcomingAppointments: {
    ar: 'المواعيد الجاية',
    en: 'Upcoming Appointments',
    fr: 'Rendez-vous à venir',
  },
  pastAppointments: {
    ar: 'المواعيد لي فاتو',
    en: 'Past Appointments',
    fr: 'Rendez-vous passés',
  },
  noAppointmentsFound: {
    ar: 'ما عندك حتى رونديفو.',
    en: 'You have no appointments.',
    fr: 'Vous n\'avez aucun rendez-vous.',
  },
  bookedOn: {
    ar: 'تحجز ف',
    en: 'Booked on',
    fr: 'Réservé le',
  },
  viewQRCode: {
    ar: 'شوف الكود QR',
    en: 'View QR Code',
    fr: 'Voir le code QR',
  },
  close: {
    ar: 'سد',
    en: 'Close',
    fr: 'Fermer',
  },
  databaseSetupTitle: {
    ar: 'إعداد قاعدة البيانات',
    en: 'Database Setup',
    fr: 'Configuration de la base de données',
  },
  databaseSetupDesc: {
    ar: 'للتطبيق باش يخدم مزيان، خاصك تصاوب هاد الجداول فقاعدة البيانات ديالك ف Supabase. كوبي كل كود SQL لتحت وخدمو ف SQL Editor ديال Supabase.',
    en: 'For the application to work correctly, you must create the following tables in your Supabase database. Copy each SQL code block below and run it in your Supabase SQL Editor.',
    fr: 'Pour que l\'application fonctionne correctement, vous devez créer les tables suivantes dans votre base de données Supabase. Copiez chaque bloc de code SQL ci-dessous et exécutez-le dans votre éditeur SQL Supabase.',
  },
  copyCode: { ar: 'كوبي الكود', en: 'Copy code', fr: 'Copier le code' },
  copied: { ar: 'تكوبيا!', en: 'Copied!', fr: 'Copié !' },
  clientsTable: { ar: 'جدول العملاء (clients)', en: 'Clients Table', fr: 'Table Clients' },
  providersTable: { ar: 'جدول المزودين (providers)', en: 'Providers Table', fr: 'Table Fournisseurs' },
  appointmentsTable: { ar: 'جدول المواعيد (appointments)', en: 'Appointments Table', fr: 'Table Rendez-vous' },
  followUpsTable: { ar: 'جدول المتابعات (follow_ups)', en: 'Follow-ups Table', fr: 'Table Suivis' },
  announcementsTable: { ar: 'جدول الإعلانات (announcements)', en: 'Announcements Table', fr: 'Table Annonces' },
  storageSetupTitle: {
    ar: 'إعداد مساحة التخزين (Storage)',
    en: 'Storage Setup',
    fr: 'Configuration du Stockage',
  },
  storageSetupDesc: {
    ar: 'التطبيق كيستعمل Supabase Storage باش يخزن تصاور الدوا. عافاك تبع هاد الخطوات:',
    en: 'The app uses Supabase Storage for medication images. Please follow these steps:',
    fr: 'L\'application utilise Supabase Storage pour les images de médicaments. Veuillez suivre ces étapes :',
  },
  storageStep1: {
    ar: 'فالداشبورد ديال Supabase، سير ل "Storage".',
    en: 'In your Supabase dashboard, go to "Storage".',
    fr: 'Dans votre tableau de bord Supabase, allez dans "Storage".',
  },
  storageStep2: {
    ar: 'كليكي على "Create a new bucket". سميه "medication-images" وخليه public.',
    en: 'Click "Create a new bucket". Name it "medication-images" and make it public.',
    fr: 'Cliquez sur "Create a new bucket". Nommez-le "medication-images" et rendez-le public.',
  },
  storageStep3: {
    ar: 'صافي! دابا كلشي واجد.',
    en: 'That\'s it! You are now ready to go.',
    fr: 'C\'est tout ! Vous êtes maintenant prêt.',
  },
  databaseSchemaError: {
    ar: 'وقع شي مشكل فقاعدة البيانات (جدول ولا عامود ناقص).',
    en: 'There seems to be a database schema error (missing table or column).',
    fr: 'Il semble y avoir une erreur de schéma de base de données (table ou colonne manquante).',
  },
  databaseSchemaErrorWithCache: {
    ar: 'مشكل فقاعدة البيانات. شغل كود الإعداد، ثم شغل كود NOTIFY المذكور أدناه لتحديث الكاش.',
    en: 'Database error. Run the setup script, then **reload the schema cache** via SQL.',
    fr: 'Erreur de base de données. Exécutez le script, puis **rechargez le cache du schéma** via SQL.',
  },
  rlsError: {
    ar: 'مشكل الصلاحيات (RLS). قاعدة البيانات ديالك محمية وكتمنع التسجيل. خاصك تزيد "Policies".',
    en: 'Permission denied (RLS). Your database is protected. You need to add security policies.',
    fr: 'Permission refusée (RLS). Votre base de données est protégée. Vous devez ajouter des politiques de sécurité.',
  },
  clickHereForInstructions: {
    ar: 'كليكي هنا للتعليمات.',
    en: 'Click here for instructions.',
    fr: 'Cliquez ici pour les instructions.',
  },
  completeSQLScript: {
    ar: 'كود SQL الكامل (كل الجداول)',
    en: 'Complete SQL Script (All Tables)',
    fr: 'Script SQL Complet (Toutes les tables)',
  },
  individualTablesTitle: {
      ar: 'أو، إنشاء كل جدول على حدة',
      en: 'Or, Create Tables Individually',
      fr: 'Ou, Créer les tables individuellement',
  },
  sampleDataTitle: {
    ar: 'إضافة بيانات نموذجية (اختياري)',
    en: 'Add Sample Data (Optional)',
    fr: 'Ajouter des données exemples (Optionnel)',
  },
  sampleDataDesc: {
    ar: 'باش تجرب التطبيق مباشرة، تقدر تزيد هاد البيانات النموذجية. هادشي غايزيد شي مزودين ديال الخدمات باش المساعد الذكي يقدر يقترحهم عليك.',
    en: 'To test the application immediately, you can add this sample data. This will populate the system with some service providers for the AI to recommend.',
    fr: 'Pour tester l\'application immédiatement, vous pouvez ajouter ces données exemples. Cela remplira le système avec quelques fournisseurs de services que l\'IA pourra recommander.',
  },
  sampleProviders: {
    ar: 'بيانات نموذجية للمزودين والعملاء',
    en: 'Sample Providers & Clients Data',
    fr: 'Données exemples Fournisseurs & Clients',
  },
  troubleshootingTitle: {
    ar: 'استكشاف الأخطاء وإصلاحها',
    en: 'Troubleshooting',
    fr: 'Dépannage',
  },
  troubleshootingDesc: {
    ar: 'مهم: بعد تشغيل كود SQL، إذا استمر ظهور خطأ في قاعدة البيانات، يجب عليك **إعادة تحميل ذاكرة التخزين المؤقت للمخطط**. يمكنك فعل ذلك يدوياً من الإعدادات أو باستخدام كود SQL السريع في الأسفل.',
    en: 'IMPORTANT: After running the SQL script, if you still get a database error, you MUST reload the schema cache. You can do this manually in settings or use the SQL quick fix below.',
    fr: 'IMPORTANT : Après avoir exécuté le script SQL, si vous obtenez toujours une erreur de base de données, vous DEVEZ recharger le cache du schéma. Vous pouvez le faire manuellement dans les paramètres ou utiliser le correctif SQL rapide ci-dessous.',
  },
  troubleshootingStep1: {
    ar: 'في لوحة تحكم Supabase، اذهب إلى "Project Settings" (أيقونة الترس) ثم اختر "API".',
    en: 'In your Supabase dashboard, go to "Project Settings" (the gear icon) and then "API".',
    fr: 'Dans votre tableau de bord Supabase, allez dans "Paramètres du projet" (l\'icône d\'engrenage) puis "API".',
  },
  troubleshootingStep2: {
    ar: 'انزل للأسفل واضغط على زر "Reload schema" الموجود تحت قسم "Database schema reload". هذا سيقوم بتحديث ذاكرة التخزين المؤقت.',
    en: 'Scroll down and click the "Reload schema" button under the "Database schema reload" section. This will refresh the cache.',
    fr: 'Faites défiler vers le bas et cliquez sur le bouton "Recharger le schéma" sous la section "Rechargement du schéma de la base de données". Cela rafraîchira le cache.',
  },
  reloadSchemaViaSQLTitle: {
    ar: 'طريقة سريعة: كود التحديث (SQL)',
    en: 'Quick Fix via SQL',
    fr: 'Solution rapide via SQL',
  },
  reloadSchemaViaSQLDesc: {
    ar: 'لتفادي الدخول للإعدادات، انسخ هذا الكود وضعه في "SQL Editor" ثم شغله. سيقوم هذا بتحديث ذاكرة التخزين المؤقت فوراً.',
    en: 'Yes! There is an easier way. Instead of settings, just copy this code and run it in the SQL Editor to fix the issue instantly.',
    fr: 'Oui ! Il y a un moyen plus simple. Au lieu des paramètres, copiez simplement ce code et exécutez-le dans l\'éditeur SQL.',
  },
  fixMissingPasswordTitle: {
    ar: 'إصلاح: إضافة عمود كلمة السر (Missing Password Column)',
    en: 'Fix: Add Missing Password Column',
    fr: 'Correctif : Ajouter la colonne mot de passe manquante',
  },
  fixMissingPasswordDesc: {
    ar: 'إذا ظهر لك الخطأ "Could not find the password column"، فهذا يعني أن الجدول قديم. شغل هذا الكود لإضافة العمود.',
    en: 'If you see the error "Could not find the password column", your table is outdated. Run this code to add it.',
    fr: 'Si vous voyez l\'erreur "Could not find the password column", votre table est obsolète. Exécutez ce code pour l\'ajouter.',
  },
  fixMissingUsernameTitle: {
    ar: 'إصلاح: إضافة عمود إسم المستخدم (Missing Username Column)',
    en: 'Fix: Add Missing Username Column',
    fr: 'Correctif : Ajouter la colonne nom d\'utilisateur manquante',
  },
  fixMissingUsernameDesc: {
    ar: 'إذا ظهر لك الخطأ "Could not find the username column"، شغل هذا الكود لإضافة العمود وتحديث الكاش.',
    en: 'If you see the error "Could not find the username column", run this code to add the column and refresh cache.',
    fr: 'Si vous voyez l\'erreur "Could not find the username column", exécutez ce code pour ajouter la colonne et rafraîchir le cache.',
  },
  fixRLSTitle: {
    ar: 'إصلاح: خطأ 42501 (مشكل الصلاحيات RLS)',
    en: 'Fix: Error 42501 (RLS Permission Denied)',
    fr: 'Correctif : Erreur 42501 (Permission refusée RLS)',
  },
  fixRLSDesc: {
    ar: 'إذا ظهر لك الخطأ "violates row-level security policy"، هذا الكود سيسمح للتطبيق بالقراءة والكتابة.',
    en: 'If you see "violates row-level security policy", this code will allow the app to read and write data.',
    fr: 'Si vous voyez "violates row-level security policy", ce code permettra à l\'application de lire et d\'écrire des données.',
  },
  breakingNews: {
    ar: 'خبر عاجل',
    en: 'Breaking News',
    fr: 'Dernière Heure',
  },
  subscriptionNoticeTitle: {
    ar: 'تنبيه هام للمزودين',
    en: 'Important Notice for Providers',
    fr: 'Avis important pour les fournisseurs',
  },
  subscriptionNoticeDesc: {
    ar: 'التسجيل كمزود خدمة كيتطلب اشتراك شهري بقيمة 50 درهم. الحساب ديالك غيكون معلق حتى تخلص وتتاصل بالإدارة باش يتفعل. عافاك دخل رقم هاتف حقيقي باش نتواصلو معاك.',
    en: 'Registering as a service provider requires a monthly subscription of 50 DH. Your account will be pending until payment is made. Please provide a real phone number so we can contact you.',
    fr: 'L\'inscription en tant que fournisseur de services nécessite un abonnement mensuel de 50 DH. Votre compte sera en attente jusqu\'au paiement. Veuillez fournir un vrai numéro de téléphone pour que nous puissions vous contacter.',
  },
  accountPending: {
    ar: 'الحساب ديالك فانتظار التفعيل.',
    en: 'Your account is pending activation.',
    fr: 'Votre compte est en attente d\'activation.',
  },
  accountPendingDesc: {
    ar: 'شكرا حيت سجلتي! الحساب ديالك باقي ماتفعلش. المرجو أداء واجب الاشتراك (50 درهم). الإدارة غتتاصل بيك فقريب، ولا تواصل معانا نتا.',
    en: 'Thank you for registering! Your account is not active yet. Please pay the subscription fee (50 DH). Admin will contact you shortly.',
    fr: 'Merci pour votre inscription ! Votre compte n\'est pas encore actif. Veuillez payer les frais d\'abonnement (50 DH) pour activer votre compte. L\'administration vous contactera sous peu.',
  },
  subscriptionFee: {
    ar: 'واجب الاشتراك: 50 درهم/شهر',
    en: 'Subscription Fee: 50 DH/month',
    fr: 'Frais d\'abonnement : 50 DH/mois',
  },
  fixProviderColumnsTitle: {
    ar: 'إصلاح: تحديث جدول المزودين (الاشتراك)',
    en: 'Fix: Update Providers Table (Subscription)',
    fr: 'Correctif : Mettre à jour la table fournisseurs',
  },
  fixProviderColumnsDesc: {
    ar: 'إذا ظهر الخطأ "missing is_active column"، شغل هذا الكود لإضافة نظام الاشتراك (رقم الهاتف والتفعيل).',
    en: 'If you see "missing is_active column" error, run this code to add the subscription system.',
    fr: 'Si vous voyez l\'erreur "missing is_active column", exécutez ce code pour ajouter le système d\'abonnement.',
  },
  missingIsActiveColumn: {
    ar: "خاصك تزيد عمود 'is_active' فالقاعدة. سير لإعدادات قاعدة البيانات وشغل كود 'تحديث جدول المزودين'.",
    en: "Missing 'is_active' column. Go to Database Setup and run 'Update Providers Table' code.",
    fr: "Colonne 'is_active' manquante. Allez dans Config BD et exécutez le code 'Mettre à jour la table fournisseurs'.",
  },
  accountLocked: {
    ar: 'الحساب مقفول!',
    en: 'Account Locked!',
    fr: 'Compte verrouillé !',
  },
  accountLockedDesc: {
    ar: 'الحساب ديالك باقي مامفعلش ولا الاشتراك ديالك سالا. خاصك تواصل مع الإدارة باش تخلص الاشتراك.',
    en: 'Your account is not active or your subscription has expired. Please contact admin to renew.',
    fr: 'Votre compte n\'est pas actif ou votre abonnement a expiré. Veuillez contacter l\'administration pour renouveler.',
  },
  callAdmin: {
    ar: 'تاصل بمدير التطبيق: 0617774846',
    en: 'Call App Admin: 0617774846',
    fr: 'Appelez l\'admin : 0617774846',
  },
  backToApp: {
    ar: 'الرجوع للتطبيق',
    en: 'Back to App',
    fr: 'Retour à l\'application',
  },
  daysRemaining: {
    ar: 'باقي ليك: {days} يوم',
    en: 'Days left: {days}',
    fr: 'Jours restants : {days}',
  },
  statusActive: {
    ar: 'مفعل',
    en: 'Active',
    fr: 'Actif',
  },
  statusPending: {
    ar: 'غير مفعل',
    en: 'Pending',
    fr: 'En attente',
  },
  statusExpired: {
    ar: 'منتهي',
    en: 'Expired',
    fr: 'Expiré',
  },
  registrationSuccessTitle: {
    ar: 'تم إرسال الطلب بنجاح!',
    en: 'Request Sent Successfully!',
    fr: 'Demande envoyée avec succès !',
  },
  howToActivateProviderTitle: {
    ar: 'للإدارة: تفعيل حساب مزود الخدمة',
    en: 'Admin: How to Activate Provider',
    fr: 'Admin: Comment Activer le Fournisseur',
  },
  howToActivateProviderDesc: {
    ar: 'لتفعيل حساب، انسخ هذا الكود، بدل "username_here" بإسم المستخدم، وشغله. سيقوم بتفعيل الحساب لمدة 30 يوم.',
    en: 'To activate an account, copy this code, replace "username_here" with the username, and run it. It activates for 30 days.',
    fr: 'Pour activer un compte, copiez ce code, remplacez "username_here" par le nom d\'utilisateur et exécutez-le. Il active pour 30 jours.',
  },
  providerDirectory: {
    ar: 'دليل المزودين',
    en: 'Provider Directory',
    fr: 'Répertoire des fournisseurs',
  },
  follow: {
    ar: 'متابعة',
    en: 'Follow',
    fr: 'Suivre',
  },
  unfollow: {
    ar: 'إلغاء المتابعة',
    en: 'Unfollow',
    fr: 'Ne plus suivre',
  },
  notifications: {
    ar: 'الإشعارات',
    en: 'Notifications',
    fr: 'Notifications',
  },
  noNotifications: {
    ar: 'ما كاين حتى إشعار.',
    en: 'No notifications.',
    fr: 'Pas de notifications.',
  },
  reminder: {
    ar: 'تذكير',
    en: 'Reminder',
    fr: 'Rappel',
  },
  appointmentReminder: {
    ar: 'تذكير: عندك رونديفو غدا مع {provider}.',
    en: 'Reminder: You have an appointment tomorrow with {provider}.',
    fr: 'Rappel : Vous avez un rendez-vous demain avec {provider}.',
  },
  statistics: {
    ar: 'الإحصائيات',
    en: 'Statistics',
    fr: 'Statistiques',
  },
  clientsToday: {
    ar: 'الكليان ديال اليوم',
    en: 'Clients Today',
    fr: 'Clients aujourd\'hui',
  },
  scanHistory: {
    ar: 'سجل السكان',
    en: 'Scan History',
    fr: 'Historique des scans',
  },
  scannedAt: {
    ar: 'تسكانا ف',
    en: 'Scanned at',
    fr: 'Scanné à',
  },
  edit: {
    ar: 'تعديل',
    en: 'Edit',
    fr: 'Modifier',
  },
  delete: {
    ar: 'مسح',
    en: 'Delete',
    fr: 'Supprimer',
  },
  myActiveAds: {
    ar: 'الإعلانات ديالي',
    en: 'My Active Ads',
    fr: 'Mes annonces actives',
  },
  accountRestricted: {
    ar: 'الحساب ديالك باقي مامفعلش. تاصل ب 0617774846 باش تفعلو.',
    en: 'Account not active. Call 0617774846 to activate.',
    fr: 'Compte non actif. Appelez le 0617774846 pour activer.',
  },
  call: {
    ar: 'اتصال',
    en: 'Call',
    fr: 'Appeler',
  },
  message: {
    ar: 'رسالة',
    en: 'Message',
    fr: 'Message',
  },
  followers: {
    ar: 'المتابعين',
    en: 'Followers',
    fr: 'Abonnés',
  },
  v2UpdateTitle: {
    ar: 'تحديث V2: خصائص لوحة التحكم',
    en: 'V2 Update: Dashboard Features',
    fr: 'Mise à jour V2 : Fonctionnalités du tableau de bord',
  }
};

interface LocalizationContextType {
  language: Language;
  t: (key: keyof typeof translations, placeholders?: TranslationPlaceholder) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ language: Language; children: ReactNode }> = ({ language, children }) => {
  const t = (key: keyof typeof translations, placeholders?: TranslationPlaceholder): string => {
    let translation = translations[key]?.[language] || translations[key]?.[Language.EN] || key;
    if (placeholders) {
      Object.keys(placeholders).forEach(placeholderKey => {
        const regex = new RegExp(`{${placeholderKey}}`, 'g');
        translation = translation.replace(regex, String(placeholders[placeholderKey]));
      });
    }
    return translation;
  };

  return React.createElement(LocalizationContext.Provider, { value: { language, t } }, children);
};

export const useLocalization = (): LocalizationContextType => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};
