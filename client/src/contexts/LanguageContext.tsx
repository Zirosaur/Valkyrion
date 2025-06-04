import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'id';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionaries
const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.features': 'Features',
    'nav.commands': 'Commands',
    'nav.controlPanel': 'Control Panel',
    'nav.dashboard': 'Dashboard',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    'nav.login': 'Login with Discord',
    'nav.inviteBot': 'Invite Bot',
    'nav.about': 'About',
    'nav.changelog': 'Changelog',
    
    // Common UI
    'ui.loading': 'Loading...',
    'ui.error': 'Error',
    'ui.retry': 'Retry',
    'ui.back': 'Back',
    'ui.next': 'Next',
    'ui.previous': 'Previous',
    'ui.close': 'Close',
    'ui.save': 'Save',
    'ui.cancel': 'Cancel',
    'ui.confirm': 'Confirm',
    'ui.delete': 'Delete',
    'ui.edit': 'Edit',
    'ui.view': 'View',
    'ui.add': 'Add',
    'ui.remove': 'Remove',
    
    // Hero Section
    'hero.subtitle': 'Discord Radio Bot',
    'hero.description': 'Premium 24/7 radio streaming for Discord communities.',
    'hero.description2': '33+ high-quality radio stations with crystal clear audio and smart controls.',
    'hero.status.online': 'Bot Online & Streaming',
    'hero.status.offline': 'Bot Offline',
    'hero.buttons.invite': 'Invite to Server',
    'hero.buttons.features': 'View Features',
    'hero.stats.servers': 'Active Servers',
    'hero.stats.listeners': 'Live Listeners',
    'hero.stats.stations': 'Radio Stations',
    'hero.stats.uptime': 'Uptime',
    
    // Features Page
    'features.page.title': 'Premium',
    'features.page.highlight': 'Features',
    'features.page.subtitle': 'The best Discord radio experience with advanced features for your community',
    
    // Features Cards
    'features.audio.title': 'High Quality Audio',
    'features.audio.description': 'Crystal clear 320kbps streaming with 200% volume boost for the best audio experience.',
    'features.stations.title': '33+ Radio Stations',
    'features.stations.description': 'Curated collection of premium radio stations across 8 different music genres.',
    'features.streaming.title': '24/7 Streaming',
    'features.streaming.description': 'Bot stays active all the time with stable connection and guaranteed quality.',
    'features.control.title': 'Easy Control',
    'features.control.description': 'Simple interface with slash commands to control your music.',
    'features.security.title': 'Voice Channel Security',
    'features.security.description': 'Validation ensures only users in voice channel can control the music.',
    'features.dashboard.title': 'Web Dashboard',
    'features.dashboard.description': 'Monitor and control bot through responsive web dashboard.',
    
    // Features Legacy
    'features.title': 'Why Choose Valkyrion?',
    'features.subtitle': 'The most advanced Discord radio bot with premium features and 24/7 reliability.',
    
    // Settings
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.language.english': 'English',
    'settings.language.indonesian': 'Bahasa Indonesia',
    'settings.save': 'Save Changes',
    'settings.saved': 'Settings saved successfully!',
    
    // Control Panel
    'control.title': 'Control Panel',
    'control.selectServer': 'Select a server to manage',
    'control.noServers': 'No servers available',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error occurred',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.close': 'Close',
  },
  id: {
    // Navigation
    'nav.home': 'Beranda',
    'nav.features': 'Fitur',
    'nav.commands': 'Perintah',
    'nav.controlPanel': 'Panel Kontrol',
    'nav.dashboard': 'Dashboard',
    'nav.profile': 'Profil',
    'nav.settings': 'Pengaturan',
    'nav.logout': 'Keluar',
    'nav.login': 'Masuk dengan Discord',
    'nav.inviteBot': 'Undang Bot',
    'nav.about': 'Tentang',
    'nav.changelog': 'Riwayat Perubahan',
    
    // Common UI
    'ui.loading': 'Memuat...',
    'ui.error': 'Error',
    'ui.retry': 'Coba Lagi',
    'ui.back': 'Kembali',
    'ui.next': 'Selanjutnya',
    'ui.previous': 'Sebelumnya',
    'ui.close': 'Tutup',
    'ui.save': 'Simpan',
    'ui.cancel': 'Batal',
    'ui.confirm': 'Konfirmasi',
    'ui.delete': 'Hapus',
    'ui.edit': 'Edit',
    'ui.view': 'Lihat',
    'ui.add': 'Tambah',
    'ui.remove': 'Hapus',
    
    // Hero Section
    'hero.subtitle': 'Bot Radio Discord',
    'hero.description': 'Streaming radio premium 24/7 untuk komunitas Discord.',
    'hero.description2': '33+ stasiun radio berkualitas tinggi dengan audio jernih dan kontrol cerdas.',
    'hero.status.online': 'Bot Online & Streaming',
    'hero.status.offline': 'Bot Offline',
    'hero.buttons.invite': 'Undang ke Server',
    'hero.buttons.features': 'Lihat Fitur',
    'hero.stats.servers': 'Server Aktif',
    'hero.stats.listeners': 'Pendengar Live',
    'hero.stats.stations': 'Stasiun Radio',
    'hero.stats.uptime': 'Uptime',
    
    // Features Page
    'features.page.title': 'Fitur',
    'features.page.highlight': 'Unggulan',
    'features.page.subtitle': 'Pengalaman radio Discord terbaik dengan fitur-fitur canggih untuk komunitas Anda',
    
    // Features Cards
    'features.audio.title': 'Audio Berkualitas Tinggi',
    'features.audio.description': 'Streaming jernih 320kbps dengan volume boost 200% untuk pengalaman audio terbaik.',
    'features.stations.title': '33+ Stasiun Radio',
    'features.stations.description': 'Koleksi kurasi stasiun radio premium di 8 genre musik berbeda.',
    'features.streaming.title': 'Streaming 24/7',
    'features.streaming.description': 'Bot aktif sepanjang waktu dengan koneksi stabil dan kualitas terjamin.',
    'features.control.title': 'Kontrol Mudah',
    'features.control.description': 'Interface sederhana dengan slash commands untuk mengontrol musik.',
    'features.security.title': 'Keamanan Voice Channel',
    'features.security.description': 'Validasi memastikan hanya user di voice channel yang bisa mengontrol musik.',
    'features.dashboard.title': 'Dashboard Web',
    'features.dashboard.description': 'Monitoring dan kontrol bot melalui dashboard web yang responsif.',
    
    // Features Legacy
    'features.title': 'Mengapa Memilih Valkyrion?',
    'features.subtitle': 'Bot radio Discord paling canggih dengan fitur premium dan keandalan 24/7.',
    
    // Settings
    'settings.title': 'Pengaturan',
    'settings.language': 'Bahasa',
    'settings.language.english': 'English',
    'settings.language.indonesian': 'Bahasa Indonesia',
    'settings.save': 'Simpan Perubahan',
    'settings.saved': 'Pengaturan berhasil disimpan!',
    
    // Control Panel
    'control.title': 'Panel Kontrol',
    'control.selectServer': 'Pilih server untuk dikelola',
    'control.noServers': 'Tidak ada server tersedia',
    
    // Common
    'common.loading': 'Memuat...',
    'common.error': 'Terjadi kesalahan',
    'common.save': 'Simpan',
    'common.cancel': 'Batal',
    'common.close': 'Tutup',
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    // Load language from localStorage
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'id')) {
      setLanguage(savedLang);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return (translations[language] as any)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}