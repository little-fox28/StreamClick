import { Globe, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';

const LanguageSwitcher = () => {
  const { currentLang, setCurrentLang, languages } = useLanguage();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    function handleClickOutside(event) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setIsLangMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative hidden sm:block" ref={langMenuRef}>
      <button
        className={`flex items-center gap-1.5 hover:opacity-80 transition-all py-2 px-2 rounded ${
          isLangMenuOpen ? 'bg-white/10' : ''
        }`}
        onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
      >
        <Globe size={18} />
        <span className="text-xs font-bold">{currentLang}</span>
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${isLangMenuOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isLangMenuOpen && (
        <div className="absolute top-full right-0 mt-2 w-40 bg-white text-gray-900 shadow-xl rounded-lg py-2 border border-gray-100 animate-in fade-in zoom-in-95 duration-200 z-50">
          <p className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 mb-1">
            {t('selectLanguage')}
          </p>
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                currentLang === lang.code ? 'text-[#163300] font-bold bg-gray-50' : 'text-gray-600'
              }`}
              onClick={() => {
                setCurrentLang(lang.code);
                setIsLangMenuOpen(false);
              }}
            >
              <span className="text-lg">{lang.flag}</span>
              <span>{lang.name}</span>
              {currentLang === lang.code && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#65cf21]"></span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
