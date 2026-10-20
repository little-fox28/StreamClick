import { NATIONAL_TEAMS, OTHER_LEAGUES, TOP_5_LEAGUES } from '@/constants/header.js';
import { useTranslation } from '@/hooks/useTranslation.js';
import { ChevronDown, ChevronRight, Menu, Search, ShoppingCart, User, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../common/LanguageSwitcher';
import JerseyPlugLogo from '../common/Logo';
import SearchBar from '../common/SearchBar';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [cartCount] = useState(2);
  const [mobileAccordion, setMobileAccordion] = useState({
    top5: false,
    national: false,
    other: false,
  });

  const { setCurrentLang, currentLang, languages } = useLanguage();
  const { t } = useTranslation();

  const handleMouseLeave = () => setActiveDropdown(null);

  const toggleMobileAccordion = (menu) => {
    setMobileAccordion((prevState) => ({
      ...prevState,
      [menu]: !prevState[menu],
    }));
  };

  return (
    <header className="sticky top-0 z-50 w-full shadow-md h-20 bg-primary text-white">
      <div className="container mx-auto px-4 h-full flex items-center justify-between relative">
        <div className="flex items-center gap-4 flex-1 justify-start">
          <button
            className="lg:hidden p-1 rounded transition-colors hover:bg-white/10"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <Link
            to="/"
            className="flex items-center gap-1 group active:scale-95 transition-transform"
          >
            <JerseyPlugLogo className="h-18 md:h-20 lg:h-26 w-auto" />
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-6 font-medium text-sm tracking-wide h-full absolute left-1/2 -translate-x-1/2 z-10">
          <Link
            to="/products?competition=World Cup 2026"
            className="transition-colors relative group py-2 h-full flex items-center hover:opacity-80"
          >
            {t('header.navigation.worldCup2026')}
          </Link>
          <div
            className="relative h-full flex items-center"
            onMouseEnter={() => setActiveDropdown('top5')}
            onMouseLeave={handleMouseLeave}
          >
            <button className="flex items-center gap-1 hover:opacity-80">
              {t('header.navigation.top5Leagues')} <ChevronDown size={14} />
            </button>
            {activeDropdown === 'top5' && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-[90vw] max-w-6xl bg-white text-gray-900 shadow-xl border-t-4 border-accent rounded-b-lg p-6 grid grid-cols-5 gap-6 animate-in fade-in slide-in-from-top-2 duration-200">
                {TOP_5_LEAGUES.map((league, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col border-r border-gray-100 last:border-0 pr-4"
                  >
                    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-100">
                      <img
                        src={league.logo}
                        alt={t(league.nameKey)}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="font-bold text-sm text-primary">{t(league.nameKey)}</span>
                    </div>
                    <ul className="space-y-3">
                      {league.teams.map((team, tIdx) => (
                        <li key={tIdx}>
                          <Link
                            to={`/products?team=${t(team.nameKey)}`}
                            onClick={() => setActiveDropdown(null)}
                            className="flex items-center gap-3 hover:bg-gray-50 p-1.5 rounded"
                          >
                            <img
                              src={team.logo}
                              alt={t(team.nameKey)}
                              className="w-6 h-6 object-cover"
                            />
                            <span className="text-sm text-gray-600 hover:text-primary">
                              {t(team.nameKey)}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            className="relative h-full flex items-center"
            onMouseEnter={() => setActiveDropdown('national')}
            onMouseLeave={handleMouseLeave}
          >
            <button className="flex items-center gap-1 hover:opacity-80">
              {t('header.navigation.national')} <ChevronDown size={14} />
            </button>
            {activeDropdown === 'national' && (
              <div className="absolute top-full left-0 w-64 bg-white text-gray-900 shadow-xl border-t-4 border-accent rounded-b-lg p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <h3 className="font-bold text-xs uppercase mb-3 tracking-wider text-primary">
                  {t('header.headings.nationalTeams')}
                </h3>
                <ul className="grid grid-cols-1 gap-2">
                  {NATIONAL_TEAMS.map((nation, idx) => (
                    <li key={idx}>
                      <Link
                        to={`/products?team=${t(nation.nameKey)}`}
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded transition-colors"
                      >
                        <span className="text-lg">{nation.flag}</span>
                        <span className="text-sm font-medium">{t(nation.nameKey)}</span>
                      </Link>
                    </li>
                  ))}
                  <li className="mt-2 pt-2 border-t border-gray-100">
                    <Link
                      to="/products"
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-center gap-1 text-xs font-bold hover:underline text-primary"
                    >
                      {t('header.actions.viewAll')} <ChevronRight size={12} />
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div
            className="relative h-full flex items-center"
            onMouseEnter={() => setActiveDropdown('other')}
            onMouseLeave={handleMouseLeave}
          >
            <button className="flex items-center gap-1 hover:opacity-80">
              {t('header.navigation.other')} <ChevronDown size={14} />
            </button>
            {activeDropdown === 'other' && (
              <div className="absolute top-full left-0 w-64 bg-white text-gray-900 shadow-xl border-t-4 border-accent rounded-b-lg p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <h3 className="font-bold text-xs uppercase mb-3 tracking-wider text-primary">
                  {t('header.headings.otherLeagues')}
                </h3>
                <ul className="space-y-2">
                  {OTHER_LEAGUES.map((l, idx) => (
                    <li key={idx}>
                      <Link
                        to={`/products?competition=${t(l.nameKey)}`}
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded transition-colors"
                      >
                        <span className="text-lg w-6 text-center">{l.logo}</span>
                        <span className="text-sm font-medium">{t(l.nameKey)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-4 lg:gap-6 flex-1 justify-end">
          <LanguageSwitcher />
          <SearchBar />
          <button className="hover:opacity-80 transition-transform active:scale-90">
            <User size={22} />
          </button>
          <Link to="/cart" className="relative hover:opacity-80 transition-transform active:scale-90 group">
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border border-primary bg-secondary text-primary group-hover:scale-110 transition-transform">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div
        className={`fixed top-0 left-0 w-80 h-full overflow-y-auto bg-darkBg z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <JerseyPlugLogo className="h-8 w-auto" />
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-white">
              <X size={24} />
            </button>
          </div>

          <div className="relative mb-4">
            <input
              type="text"
              placeholder={t('header.search.placeholder')}
              className="w-full bg-white/10 text-white text-sm rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-1 focus:ring-secondary placeholder-gray-400"
            />
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          </div>

          <nav className="flex flex-col space-y-2">
            <Link
              to="/products?competition=World Cup 2026"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-white py-3 border-b border-gray-700/50 font-bold hover:opacity-80"
            >
              {t('header.navigation.worldCup2026')}
            </Link>

            <div className="py-2 border-b border-gray-700/50">
              <button
                onClick={() => toggleMobileAccordion('top5')}
                className="w-full flex justify-between items-center text-white py-2 font-bold"
              >
                {t('header.navigation.top5Leagues')}
                <ChevronDown
                  size={16}
                  className={`transition-transform ${mobileAccordion.top5 ? 'rotate-180' : ''}`}
                />
              </button>
              {mobileAccordion.top5 && (
                <div className="pt-2 pl-4">
                  {TOP_5_LEAGUES.map((l, i) => (
                    <Link
                      key={i}
                      to={`/products?competition=${t(l.nameKey)}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-gray-300 py-1 text-sm hover:text-white"
                    >
                      {t(l.nameKey)}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="py-2 border-b border-gray-700/50">
              <button
                onClick={() => toggleMobileAccordion('national')}
                className="w-full flex justify-between items-center text-white py-2 font-bold"
              >
                {t('header.headings.nationalTeams')}
                <ChevronDown
                  size={16}
                  className={`transition-transform ${mobileAccordion.national ? 'rotate-180' : ''}`}
                />
              </button>
              {mobileAccordion.national && (
                <div className="pt-2 pl-4">
                  {NATIONAL_TEAMS.map((n, i) => (
                    <Link
                      key={i}
                      to={`/products?team=${t(n.nameKey)}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 text-gray-300 py-1 text-sm hover:text-white"
                    >
                      <span>{n.flag}</span>
                      {t(n.nameKey)}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="py-2 border-b border-gray-700/50">
              <button
                onClick={() => toggleMobileAccordion('other')}
                className="w-full flex justify-between items-center text-white py-2 font-bold"
              >
                {t('header.headings.otherLeagues')}
                <ChevronDown
                  size={16}
                  className={`transition-transform ${mobileAccordion.other ? 'rotate-180' : ''}`}
                />
              </button>
              {mobileAccordion.other && (
                <div className="pt-2 pl-4">
                  {OTHER_LEAGUES.map((l, i) => (
                    <Link
                      key={i}
                      to={`/products?competition=${t(l.nameKey)}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 text-gray-300 py-1 text-sm hover:text-white"
                    >
                      <span className="text-lg w-6 text-center">{l.logo}</span>
                      {t(l.nameKey)}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-700/50">
              <span className="text-white font-bold">{t('header.mobile.language')}</span>
              <div className="flex gap-2">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setCurrentLang(l.code)}
                    className={`px-2 py-1 text-xs rounded ${
                      currentLang === l.code ? 'bg-accent text-primary' : 'bg-white/10 text-white'
                    }`}
                  >
                    {l.code}
                  </button>
                ))}
              </div>
            </div>
          </nav>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
    </header>
  );
};

export default Header;
