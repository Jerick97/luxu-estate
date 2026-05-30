import React, { Suspense } from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import { Pagination } from '@/components/ui/Pagination';
import { PropertiesHeaderActions } from './PropertiesHeaderActions';
import { PropertyActiveToggle } from './_components/PropertyActiveToggle';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale, COOKIE_NAME, defaultLocale } from '@/lib/i18n/config';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 10;

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

export default async function AdminPropertiesPage({ searchParams }: Props) {
  const params = await searchParams;
  const currentPage = Math.max(1, Number(params.page) || 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const cookieStore = await cookies();
  const locale = (cookieStore.get(COOKIE_NAME)?.value as Locale) || defaultLocale;
  const dict = await getDictionary(locale);
  const d = dict.admin?.dashboard || {};
  const table = d.table || {};

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  // Fetch paginated properties
  let propertiesQuery = supabase
    .from('properties')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  // Normalize the free-text search term. Strip characters that would break the
  // PostgREST `or()` filter syntax; `ilike` already handles case-insensitive,
  // partial matching.
  const query = (params.query || "").trim();
  const safeQuery = query.replace(/[,()*]/g, ' ').trim();
  if (safeQuery) {
    propertiesQuery = propertiesQuery.or(`title.ilike.%${safeQuery}%,location.ilike.%${safeQuery}%`);
  }
  if (params.minPrice) propertiesQuery = propertiesQuery.gte('price', parseInt(params.minPrice));
  if (params.maxPrice) propertiesQuery = propertiesQuery.lte('price', parseInt(params.maxPrice));
  if (params.type && params.type !== "Any Type" && params.type !== "All") propertiesQuery = propertiesQuery.eq('type', params.type);
  if (params.beds && parseInt(params.beds) > 0) propertiesQuery = propertiesQuery.gte('beds', parseInt(params.beds));
  if (params.baths && parseInt(params.baths) > 0) propertiesQuery = propertiesQuery.gte('baths', parseInt(params.baths));
  if (params.amenities) {
    const arr = params.amenities.split(',');
    propertiesQuery = propertiesQuery.contains('amenities', arr);
  }

  const { data: properties, count: totalListings } = await propertiesQuery;

  // Fetch active count
  const { count: activeCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Fetch pending count
  const { count: pendingCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const totalPages = Math.ceil((totalListings || 0) / PAGE_SIZE);

  return (
    <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-nordic dark:text-white tracking-tight">{d.title}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{d.subtitle}</p>
        </div>
        <PropertiesHeaderActions />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-[#152e2a] p-5 rounded-xl border border-mosque/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{d.totalListings}</p>
            <p className="text-2xl font-bold text-nordic dark:text-white mt-1">{totalListings || 0}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-mosque/10 flex items-center justify-center text-mosque">
            <span className="material-icons">apartment</span>
          </div>
        </div>
        <div className="bg-white dark:bg-[#152e2a] p-5 rounded-xl border border-mosque/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{d.activeProperties}</p>
            <p className="text-2xl font-bold text-nordic dark:text-white mt-1">{activeCount || 0}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-hint-green flex items-center justify-center text-mosque">
            <span className="material-icons">check_circle</span>
          </div>
        </div>
        <div className="bg-white dark:bg-[#152e2a] p-5 rounded-xl border border-mosque/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{d.pendingSale}</p>
            <p className="text-2xl font-bold text-nordic dark:text-white mt-1">{pendingCount || 0}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <span className="material-icons">pending</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-[#152e2a] rounded-xl shadow-sm border border-gray-200 dark:border-mosque/20 overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50/50 dark:bg-mosque/5 border-b border-gray-100 dark:border-mosque/10 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <div className="col-span-6">{table.propertyDetails}</div>
          <div className="col-span-2">{table.price}</div>
          <div className="col-span-2">{table.status}</div>
          <div className="col-span-2 text-right">{table.actions}</div>
        </div>
        
        {(!properties || properties.length === 0) ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {d.noProperties}
          </div>
        ) : (
          properties.map((prop) => {
            const firstImage = Array.isArray(prop.gallery_urls) && prop.gallery_urls.length > 0 
              ? prop.gallery_urls[0] 
              : "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=400";
              
            const isInactive = prop.is_active === false;

            return (
              <div key={prop.id} className={`group grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 border-b border-l-4 border-gray-100 dark:border-mosque/10 transition-colors items-center ${isInactive ? 'border-l-amber-400/70 bg-amber-50/40 dark:bg-amber-900/10 hover:bg-amber-50/70 dark:hover:bg-amber-900/15' : 'border-l-transparent hover:bg-background-light dark:hover:bg-mosque/5'}`}>
                <div className="col-span-12 md:col-span-6 flex gap-4 items-center">
                  <div className="relative h-20 w-28 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                    <Image
                      alt={prop.title || "Property image"}
                      className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${isInactive ? 'grayscale' : ''}`}
                      src={firstImage}
                      fill
                      sizes="(max-width: 768px) 112px, 112px"
                    />
                    {isInactive && (
                      <div className="absolute inset-0 bg-nordic/35 flex items-center justify-center">
                        <span className="material-icons text-white/90 text-2xl drop-shadow">visibility_off</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold truncate max-w-xs transition-colors cursor-pointer ${isInactive ? 'text-gray-400 dark:text-gray-500' : 'text-nordic dark:text-white group-hover:text-mosque'}`}>{prop.title}</h3>
                    <p className={`text-sm truncate max-w-xs ${isInactive ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}>{prop.location}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                      <span className="flex items-center gap-1"><span className="material-icons text-[14px]">bed</span> {prop.beds} {d.beds}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                      <span className="flex items-center gap-1"><span className="material-icons text-[14px]">bathtub</span> {prop.baths} {d.baths}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                      <span>{prop.area} sqft</span>
                    </div>
                  </div>
                </div>
                <div className="col-span-6 md:col-span-2">
                  <div className={`text-base font-semibold ${isInactive ? 'text-gray-400 dark:text-gray-500' : 'text-nordic dark:text-gray-200'}`}>${prop.price?.toLocaleString()}</div>
                  <div className="text-xs text-gray-400 capitalize">{prop.type || 'property'}</div>
                </div>
                <div className="col-span-6 md:col-span-2">
                  {isInactive ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      <span className="material-icons text-[13px] leading-none">visibility_off</span> {d.inactive || 'Inactive'}
                    </span>
                  ) : prop.status === 'active' ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-hint-green text-mosque border border-mosque/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-mosque mr-1.5"></span> {d.active}
                    </span>
                  ) : prop.status === 'pending' ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5"></span> {d.pending}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-500 mr-1.5"></span> {prop.status || d.sold}
                    </span>
                  )}
                </div>
                <div className="col-span-12 md:col-span-2 flex items-center justify-end gap-2">
                  <Link href={`/admin/properties/${prop.id}/edit`} className="p-2 rounded-lg text-gray-400 hover:text-mosque hover:bg-hint-green/30 transition-all tooltip-trigger" title={d.editProperty}>
                    <span className="material-icons text-xl">edit</span>
                  </Link>
                  <PropertyActiveToggle
                    propertyId={prop.id}
                    isActive={prop.is_active !== false}
                    labels={{ deactivate: d.deactivateProperty, activate: d.activateProperty, activateShort: d.activateShort }}
                  />
                </div>
              </div>
            );
          })
        )}
        
        {(totalListings ?? 0) > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-mosque/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50 dark:bg-mosque/5">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {d.showing} <span className="font-medium text-nordic dark:text-white">{Math.min(from + 1, totalListings!)}</span> {d.to} <span className="font-medium text-nordic dark:text-white">{Math.min(to + 1, totalListings!)}</span> {d.of} <span className="font-medium text-nordic dark:text-white">{totalListings}</span> {d.results}
            </div>
            {totalPages > 1 && (
              <Suspense fallback={<div className="h-9 w-32 bg-gray-100 dark:bg-mosque/10 rounded-lg animate-pulse"></div>}>
                <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/admin/properties" />
              </Suspense>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
