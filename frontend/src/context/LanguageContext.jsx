import { createContext, useState, useContext } from 'react';

const LANGUAGES = [
  { code: 'EN', name: 'English', flag: '🇿🇦' },
  { code: 'AF', name: 'Afrikaans', flag: '🇿🇦' },
];

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [currentLang, setCurrentLang] = useState('EN');

  const value = {
    currentLang,
    setCurrentLang,
    languages: LANGUAGES,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
