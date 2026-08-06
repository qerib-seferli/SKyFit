// ============================================================
// SKy Fit — Əsas konfiqurasiya
// Bu fayl real layihədə istifadə olunur.
// Frontend daxilində yalnız Supabase anon public key saxlanılır.
// service_role key bu fayla heç vaxt yazılmamalıdır.
// ============================================================

window.SKYFIT_CONFIG = Object.freeze({
  SUPABASE_URL: 'https://elpwornsvnplyzyufqir.supabase.co',

  SUPABASE_ANON_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVscHdvcm5zdm5wbHl6eXVmcWlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4Mjc0NjgsImV4cCI6MjEwMTQwMzQ2OH0.9kxI4ZwUEJjwzVOweZowdAdlkAk9tUZ9rg7Yf7CnJJo',

  SITE_URL: 'https://qerib-seferli.github.io/SKyFit',

  BUSINESS: Object.freeze({
    name: 'SKy Fit',
    username: 'skyp_fit_club',

    phone: '+994 55 524 01 60',
    phoneRaw: '+994555240160',
    whatsapp: '994555240160',

    address:
      'Bərdə ş. Avtovağzalın yanı, Güloğlular küçəsi döngəsi',

    workingHours: Object.freeze({
      weekdays: '08:00 – 23:00',
      saturday: '08:00 – 23:00',
      sunday: '08:00 – 23:00',
    }),

    membershipPrices: Object.freeze({
      monthly: 30,
      daily: 3,
    }),

    instagram:
      'https://www.instagram.com/sky_fit_club__/',

    tiktok:
      'https://www.tiktok.com/@sky_fit_club',

    maps:
      'https://maps.app.goo.gl/7UHf6EtpCbsbXBF26',

    whatsappUrl:
      'https://wa.me/994555240160',

    whatsappMessage:
      'Salam, SKy Fit haqqında məlumat almaq istəyirəm.',
  }),

  PATHS: Object.freeze({
    home: 'index.html',
    login: 'login.html',
    register: 'register.html',
    profile: 'profile.html',
    admin: 'admin.html',
    favorites: 'sevimliler.html',
    resetPassword: 'reset-password.html',
    updatePassword: 'update-password.html',

    logo: 'assets/img/logo.png',

    heroMain:
      'assets/img/hero-main.jpg',

    authBackground:
      'assets/img/auth-background.jpg',

    profileBackground:
      'assets/img/profile-background.jpg',

    adminBackground:
      'assets/img/admin-background.jpg',

    gymSection1:
      'assets/img/gym-section-1.jpg',

    gymSection2:
      'assets/img/gym-section-2.jpg',

    fitnessLoader:
      'assets/img/fitness-loader-optimized.gif',
  }),

  STORAGE: Object.freeze({
    avatarsBucket: 'avatars',
    productImagesBucket: 'product-images',
    trainerImagesBucket: 'trainer-images',
  }),

  APP: Object.freeze({
    currency: 'AZN',
    locale: 'az-AZ',
    defaultTheme: 'dark',
    membershipWarningDays: 3,
    membershipNoticeDays: 7,
    lowStockFallback: 5,
    realtimeEnabled: true,
    pwaEnabled: true,
  }),
});
