import { Suspense } from "react";
import { Search, Settings2, ArrowRight } from "lucide-react";
import { cookies } from "next/headers";
import { FeaturedCollectionCard } from "@/components/properties/FeaturedCollectionCard";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { Pagination } from "@/components/ui/Pagination";
import { supabase } from "@/lib/supabase";
import { DbProperty, toProperty } from "@/lib/types";
import { HomeSearch } from "@/components/search/HomeSearch";
import { COOKIE_NAME, Locale, defaultLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/getDictionary";

const PAGE_SIZE = 8;

interface Props {
  searchParams: Promise<{ 
    page?: string;
    query?: string;
    minPrice?: string;
    maxPrice?: string;
    type?: string;
    beds?: string;
    baths?: string;
    amenities?: string;
  }>;
}

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  const currentPage = Math.max(1, Number(params.page) || 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Fetch featured properties (no pagination)
  const { data: featuredRows } = await supabase
    .from('properties')
    .select('*')
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .returns<DbProperty[]>();

  // Fetch paginated new-in-market properties with count
  let marketQuery = supabase
    .from('properties')
    .select('*', { count: 'exact' })
    .eq('is_featured', false)
    .order('created_at', { ascending: false })
    .range(from, to);

  const query = params.query || "";
  if (query) {
    marketQuery = marketQuery.or(`title.ilike.%${query}%,location.ilike.%${query}%`);
  }
  if (params.minPrice) marketQuery = marketQuery.gte('price', parseInt(params.minPrice));
  if (params.maxPrice) marketQuery = marketQuery.lte('price', parseInt(params.maxPrice));
  if (params.type && params.type !== "Any Type") marketQuery = marketQuery.eq('type', params.type);
  if (params.beds && parseInt(params.beds) > 0) marketQuery = marketQuery.gte('beds', parseInt(params.beds));
  if (params.baths && parseInt(params.baths) > 0) marketQuery = marketQuery.gte('baths', parseInt(params.baths));
  if (params.amenities) {
    const arr = params.amenities.split(',');
    marketQuery = marketQuery.contains('amenities', arr);
  }

  const { data: marketRows, count } = await marketQuery.returns<DbProperty[]>();

  const featuredProperties = (featuredRows ?? []).map(toProperty);
  const newInMarketProperties = (marketRows ?? []).map(toProperty);
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  const hasFilters = !!(params.query || params.minPrice || params.maxPrice || (params.type && params.type !== 'All') || params.beds || params.baths || params.amenities);

  const cookieStore = await cookies();
  const locale = (cookieStore.get(COOKIE_NAME)?.value as Locale) || defaultLocale;
  const dict = await getDictionary(locale);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 w-full">
      <section className="py-12 md:py-16">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-nordic-dark dark:text-white leading-tight">
            {dict.home.titlePrefix} <span className="relative inline-block">
              <span className="relative z-10 font-medium">{dict.home.titleHighlight}</span>
              <span className="absolute bottom-2 left-0 w-full h-3 bg-mosque/20 -rotate-1 z-0"></span>
            </span>{dict.home.titleSuffix}
          </h1>
        </div>
        
        <div className="mt-8">
          <Suspense fallback={<div className="h-20 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl max-w-2xl mx-auto"></div>}>
            <HomeSearch />
          </Suspense>
        </div>
      </section>
      
      {!hasFilters && (
        <section className="mb-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-light text-nordic-dark dark:text-white">{dict.home.featuredTitle}</h2>
              <p className="text-nordic-muted mt-1 text-sm">{dict.home.featuredSubtitle}</p>
            </div>
            <a href="#" className="hidden sm:flex items-center gap-1 text-sm font-medium text-mosque hover:opacity-70 transition-opacity">
              {dict.home.viewAll} <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </a>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {featuredProperties.map(property => (
              <FeaturedCollectionCard key={property.id} property={property} />
            ))}
          </div>
        </section>
      )}
      
      <section>
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-light text-nordic-dark dark:text-white">{dict.home.newInMarket}</h2>
            <p className="text-nordic-muted mt-1 text-sm">{dict.home.newInMarketSubtitle}</p>
          </div>
          <div className="hidden md:flex bg-white dark:bg-white/5 p-1 rounded-lg">
            <button className="px-4 py-1.5 rounded-md text-sm font-medium bg-nordic-dark text-white shadow-sm">{dict.home.all}</button>
            <button className="px-4 py-1.5 rounded-md text-sm font-medium text-nordic-muted hover:text-nordic-dark dark:hover:text-white">{dict.navbar.buy}</button>
            <button className="px-4 py-1.5 rounded-md text-sm font-medium text-nordic-muted hover:text-nordic-dark dark:hover:text-white">{dict.navbar.rent}</button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {newInMarketProperties.map((property) => (
            <PropertyCard 
              key={property.id} 
              property={property} 
            />
          ))}
        </div>
        
        <div className="mt-12">
          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </div>
      </section>
    </main>
  );
}
