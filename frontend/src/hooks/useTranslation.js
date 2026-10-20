import { useLanguage } from '../context/LanguageContext';
import en from '../locales/en.json';
import af from '../locales/af.json';

const translations = { en, af };

export const useTranslation = () => {
  const { currentLang } = useLanguage();

  const t = (key, variables = {}) => {
    const keys = key.split('.');
    let value = translations[currentLang.toLowerCase()];
    
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        return key;
      }
    }
    
    if (typeof value === 'string') {
      Object.keys(variables).forEach(variable => {
        value = value.replace(`{${variable}}`, variables[variable]);
      });
    }
    
    return value;
  };

  return { t };
};
