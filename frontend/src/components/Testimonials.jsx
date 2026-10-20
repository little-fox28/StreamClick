import { Star, Quote } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export default function Testimonials() {
  const { t } = useTranslation();
  const testimonialsData = t('testimonials');
  
  // Fallback in case t('testimonials') doesn't return an array
  const TESTIMONIALS = Array.isArray(testimonialsData) ? testimonialsData : [];

  return (
    <section className="py-16 text-gray-800 bg-white">
      <div className="container mx-auto px-0 md:px-4">
        <div className="text-center mb-12 px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 flex items-center justify-center gap-2 text-primary">
            <Quote size={24} className="text-secondary rotate-180" />{' '}
            {t('customerSays')}
          </h2>
          <div className="w-16 h-1 bg-accent mx-auto rounded mt-2"></div>
        </div>
        <div className="relative overflow-hidden w-full">
          <div className="flex animate-marquee gap-6 px-4 mb-1">
            {[...TESTIMONIALS, ...TESTIMONIALS].map((item, idx) => (
              <div
                key={idx}
                className="shrink-0 w-70 md:w-87.5 bg-gray-50 p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      fill={i < item.rating ? '#f2c86c' : 'none'}
                      stroke={i < item.rating ? '#f2c86c' : '#d1d5db'}
                    />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic text-sm md:text-base">
                  "{item.comment}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-accent to-secondary flex items-center justify-center font-bold text-primary text-sm">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">
                      {item.name}
                    </h4>
                    <p className="text-xs text-accent font-bold">{item.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
