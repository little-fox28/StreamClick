import { memo } from 'react';
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation.js';
import { FOOTER_LINKS } from '@/constants/footer';
import JerseyPlugLogo from '@/components/common/Logo';

const SocialButton = memo(({ icon: Icon, href, label }) => (
  <a
    href={href}
    aria-label={label}
    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-secondary hover:text-secondary-foreground transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-secondary"
  >
    <Icon size={20} className="group-hover:scale-110 transition-transform" />
  </a>
));

const PaymentBadge = memo(({ name, className }) => (
  <div
    className={`h-8 px-3 rounded bg-white flex items-center justify-center text-[10px] font-bold uppercase tracking-wider shadow-sm border border-transparent ${className}`}
  >
    {name}
  </div>
));

const FooterLinkList = memo(({ links }) => {
  const { t } = useTranslation();
  return (
    <ul className="space-y-2.5">
      {links.map((link, idx) => (
        <li key={idx}>
          <a
            href={link.href}
            className="text-gray-400 hover:text-secondary text-sm transition-colors flex items-center gap-2 group w-fit"
          >
            <span className="w-0 overflow-hidden group-hover:w-3 transition-all duration-300 opacity-0 group-hover:opacity-100">
              <ArrowRight size={12} />
            </span>
            <span className="group-hover:translate-x-0 transition-transform duration-300 -translate-x-2">
              {t(link.labelKey)}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
});

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-white border-t-4 border-accent" role="contentinfo">
      <div className="container mx-auto px-4 py-10 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-8">
          <div className="space-y-6">
            <a href="/" className="flex items-center group">
              <JerseyPlugLogo className="h-30 w-auto object-contain" />
            </a>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              {t('footer.brand.description')}
            </p>
            <div className="flex gap-3">
              <SocialButton icon={Facebook} href="#" label={t('footer.brand.facebook')} />
              <SocialButton icon={Instagram} href="#" label={t('footer.brand.instagram')} />
              <SocialButton icon={Twitter} href="#" label={t('footer.brand.twitter')} />
              <SocialButton icon={Youtube} href="#" label={t('footer.brand.youtube')} />
            </div>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-4 md:mb-6 text-white">
              {t('footer.headings.shop')}
            </h4>
            <FooterLinkList links={FOOTER_LINKS.shop} />
          </div>

          <div>
            <h4 className="font-bold text-lg mb-4 md:mb-6 text-white">
              {t('footer.headings.support')}
            </h4>
            <FooterLinkList links={FOOTER_LINKS.support} />
          </div>

          <div className="space-y-6">
            <h4 className="font-bold text-lg mb-4 md:mb-6 text-white">
              {t('footer.headings.contact')}
            </h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-gray-400 text-sm group">
                <MapPin
                  size={18}
                  className="text-secondary shrink-0 mt-0.5 group-hover:animate-bounce"
                />
                <span className="group-hover:text-white transition-colors">
                  {t('footer.contact.address')}
                </span>
              </div>
              <div className="flex items-center gap-3 text-gray-400 text-sm group">
                <Phone size={18} className="text-secondary shrink-0" />
                <span className="group-hover:text-white transition-colors">
                  {t('footer.contact.phone')}
                </span>
              </div>
              <div className="flex items-center gap-3 text-gray-400 text-sm group">
                <Mail size={18} className="text-secondary shrink-0" />
                <span className="group-hover:text-white transition-colors">
                  {t('footer.contact.email')}
                </span>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                {t('footer.trust.weAccept')}
              </p>
              <div className="flex flex-wrap gap-2">
                <PaymentBadge name="Visa" className="text-[#1A1F71] border-blue-900/20" />
                <PaymentBadge name="Mastercard" className="text-[#EB001B] border-red-900/20" />
                <PaymentBadge name="PayFast" className="text-[#bf1e2e] border-red-900/20" />
                <PaymentBadge
                  name="PayJustNow"
                  className="bg-black text-[#b2f35f] border-gray-800"
                />
                <PaymentBadge name="Ozow" className="bg-[#1C58F2] text-white border-blue-700" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-black/20 border-t border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
            <p>{t('footer.legal.copyright', { year: currentYear })}</p>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              {FOOTER_LINKS.legal.map((link, idx) => (
                <a
                  key={idx}
                  href={link.href}
                  className="hover:text-white transition-colors whitespace-nowrap"
                >
                  {t(link.labelKey)}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default memo(Footer);
