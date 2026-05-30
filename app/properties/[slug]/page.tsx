import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';

import { supabase } from '@/lib/supabase';
import { DbProperty, toProperty } from '@/lib/types';
import {
  MapPin, Star, MessageCircle, Phone, Calendar, Mail,
  Maximize, BedDouble, Bath, Car, ArrowRight, CheckCircle2, Calculator
} from 'lucide-react';
import { PropertyGallery } from './_components/PropertyGallery';
import { cookies } from "next/headers";
import { COOKIE_NAME, Locale, defaultLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/getDictionary";

import MapWrapper from '@/components/ui/MapWrapper';
import MarkdownText from '@/components/ui/MarkdownText';

export const revalidate = 3600; // ISR revalidate every hour

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const { data } = await supabase
    .from('properties')
    .select('*')
    .eq('slug', resolvedParams.slug)
    .single<DbProperty>();

  if (!data) return { title: 'Property Not Found' };
  
  const property = toProperty(data);

  return {
    title: `${property.title} | LuxuEstate`,
    description: `Discover ${property.title} in ${property.location}. ${property.beds} beds, ${property.baths} baths, offered at $${property.price.toLocaleString()}.`,
    openGraph: {
      images: [{ url: property.imageUrl }],
    }
  };
}

export default async function PropertyDetailsPage({ params }: Props) {
  const resolvedParams = await params;
  const { data } = await supabase
    .from('properties')
    .select('*')
    .eq('slug', resolvedParams.slug)
    .single<DbProperty>();

  if (!data) {
    notFound();
  }

  const property = toProperty(data);
  const gallery = property.galleryUrls?.length ? property.galleryUrls : [property.imageUrl, property.imageUrl, property.imageUrl, property.imageUrl];

  const cookieStore = await cookies();
  const locale = (cookieStore.get(COOKIE_NAME)?.value as Locale) || defaultLocale;
  const dict = await getDictionary(locale);

  // Map coordinates sourced directly from Supabase (fallback to Beverly Hills if undefined)
  const lat = property.lat ?? 34.0736;
  const lng = property.lng ?? -118.4004;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: `Property in ${property.location} with ${property.beds} beds and ${property.baths} baths.`,
    url: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/properties/${property.slug}`,
    image: property.imageUrl,
    offers: {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: 'USD',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          
          <div className="lg:col-span-8 space-y-4">
            <PropertyGallery 
              initialImage={property.imageUrl} 
              imageAlt={property.imageAlt} 
              galleryUrls={gallery} 
              featuredBadge={property.featuredBadge}
              status={property.status}
            />
          </div>

          <div className="lg:col-span-4 relative">
            <div className="lg:sticky lg:top-28 space-y-6">
              
              <div className="bg-white dark:bg-white/5 p-6 rounded-xl shadow-sm border border-mosque/5 dark:border-white/10">
                <div className="mb-4">
                  <h1 className="text-4xl font-light text-nordic-dark dark:text-white mb-2">
                    ${property.price.toLocaleString()}
                    {property.period && <span className="text-lg text-nordic-muted">{property.period}</span>}
                  </h1>
                  <p className="text-nordic-muted font-medium flex items-center gap-1.5">
                    <MapPin className="text-mosque w-4 h-4" strokeWidth={2} />
                    {property.location}
                  </p>
                </div>
                <div className="h-px bg-slate-100 dark:bg-white/10 my-6"></div>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white dark:border-white/20 shadow-sm relative shrink-0 bg-gray-200">
                     <Image src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150" alt="Sarah Jenkins" fill className="object-cover" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-nordic-dark dark:text-white">Sarah Jenkins</h3>
                    <div className="flex items-center gap-1 text-xs text-mosque dark:text-primary font-medium">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{dict.property.topRatedAgent}</span>
                    </div>
                  </div>
                  <div className="ml-auto flex gap-2">
                    <button className="p-2 rounded-full bg-mosque/10 dark:bg-mosque/20 text-mosque dark:text-primary hover:bg-mosque hover:text-white dark:hover:bg-primary dark:hover:text-nordic-dark transition-colors">
                      <MessageCircle className="w-4 h-4" strokeWidth={2} />
                    </button>
                    <button className="p-2 rounded-full bg-mosque/10 dark:bg-mosque/20 text-mosque dark:text-primary hover:bg-mosque hover:text-white dark:hover:bg-primary dark:hover:text-nordic-dark transition-colors">
                      <Phone className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <button className="w-full bg-mosque hover:bg-mosque/90 text-white py-4 px-6 rounded-lg font-medium transition-all shadow-lg shadow-mosque/20 flex items-center justify-center gap-2 group">
                    <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={2} />
                    {dict.property.scheduleVisit}
                  </button>
                  <button className="w-full bg-transparent border border-nordic-dark/10 dark:border-white/10 hover:border-mosque dark:hover:border-primary text-nordic-dark dark:text-white hover:text-mosque py-4 px-6 rounded-lg font-medium transition-all flex items-center justify-center gap-2">
                    <Mail className="w-5 h-5" strokeWidth={2} />
                    {dict.property.contactAgent}
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-white/5 p-2 rounded-xl shadow-sm border border-mosque/5 dark:border-white/10">
                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 z-0">
                  <MapWrapper lat={lat} lng={lng} />
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(property.location)}`} target="_blank" rel="noopener noreferrer" className="absolute bottom-2 right-2 bg-white/90 text-xs font-medium px-2 py-1 rounded shadow-sm text-nordic-dark hover:text-mosque z-[1000]">
                    {dict.property.viewOnMap}
                  </a>
                </div>
              </div>

            </div>
          </div>

          <div className="lg:col-span-8 lg:row-start-2 lg:-mt-8 space-y-8">
            <div className="bg-white dark:bg-white/5 p-8 rounded-xl shadow-sm border border-mosque/5 dark:border-white/10">
              <h2 className="text-lg font-semibold mb-6 text-nordic-dark dark:text-white">{dict.property.propertyFeatures}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex flex-col items-center justify-center p-4 bg-mosque/5 rounded-lg border border-mosque/10 dark:border-white/5">
                  <Maximize className="text-mosque dark:text-primary w-6 h-6 mb-2" strokeWidth={1.5} />
                  <span className="text-xl font-bold text-nordic-dark dark:text-white">{property.area}</span>
                  <span className="text-xs uppercase tracking-wider text-nordic-muted">{dict.property.squareMeters}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-mosque/5 rounded-lg border border-mosque/10 dark:border-white/5">
                  <BedDouble className="text-mosque dark:text-primary w-6 h-6 mb-2" strokeWidth={1.5} />
                  <span className="text-xl font-bold text-nordic-dark dark:text-white">{property.beds}</span>
                  <span className="text-xs uppercase tracking-wider text-nordic-muted">{dict.property.bedrooms}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-mosque/5 rounded-lg border border-mosque/10 dark:border-white/5">
                  <Bath className="text-mosque dark:text-primary w-6 h-6 mb-2" strokeWidth={1.5} />
                  <span className="text-xl font-bold text-nordic-dark dark:text-white">{property.baths}</span>
                  <span className="text-xs uppercase tracking-wider text-nordic-muted">{dict.property.bathrooms}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-mosque/5 rounded-lg border border-mosque/10 dark:border-white/5">
                  <Car className="text-mosque dark:text-primary w-6 h-6 mb-2" strokeWidth={1.5} />
                  <span className="text-xl font-bold text-nordic-dark dark:text-white">2</span>
                  <span className="text-xs uppercase tracking-wider text-nordic-muted">{dict.property.garage}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-white/5 p-8 rounded-xl shadow-sm border border-mosque/5 dark:border-white/10">
              <h2 className="text-lg font-semibold mb-4 text-nordic-dark dark:text-white">{dict.property.aboutThisHome}</h2>
              {property.description ? (
                <MarkdownText>{property.description}</MarkdownText>
              ) : (
                <div className="text-nordic-muted leading-relaxed">
                  <p className="mb-4">
                    {dict.property.description1}{property.location.split(',')[0]}{dict.property.description1Suffix}
                  </p>
                  <p>{dict.property.description2}</p>
                </div>
              )}
              <button className="mt-4 text-mosque dark:text-primary font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                {dict.property.readMore}
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            </div>

            <div className="bg-white dark:bg-white/5 p-8 rounded-xl shadow-sm border border-mosque/5 dark:border-white/10">
              <h2 className="text-lg font-semibold mb-6 text-nordic-dark dark:text-white">{dict.property.amenitiesTitle}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                {['Smart Home System', 'Swimming Pool', 'Central Heating & Cooling', 'Electric Vehicle Charging', 'Private Gym', 'Wine Cellar'].map((amenity, i) => (
                  <div key={i} className="flex items-center gap-3 text-nordic-muted">
                    <CheckCircle2 className="text-mosque/60 dark:text-primary/60 w-4 h-4 shrink-0" strokeWidth={2} />
                    <span>{dict.filters.amenities[amenity as keyof typeof dict.filters.amenities] || amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-mosque/5 dark:bg-mosque/10 p-6 rounded-xl border border-mosque/10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white dark:bg-black/20 rounded-full text-mosque dark:text-primary shadow-sm">
                  <Calculator className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-semibold text-nordic-dark dark:text-white">{dict.property.estimatedPayment}</h3>
                  <p className="text-sm text-nordic-muted">{dict.property.startingFrom}<strong className="text-mosque dark:text-primary">${Math.floor(property.price * 0.0045).toLocaleString()}{dict.property.perMonth}</strong>{dict.property.withDown}</p>
                </div>
              </div>
              <button className="whitespace-nowrap px-4 py-2 bg-white dark:bg-white/10 border border-nordic-dark/10 dark:border-white/10 rounded-lg text-sm font-semibold hover:border-mosque dark:hover:border-primary transition-colors text-nordic-dark dark:text-white">
                {dict.property.calculateMortgage}
              </button>
            </div>
          </div>
          
        </div>
      </main>
    </>
  );
}
