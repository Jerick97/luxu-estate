export type PropertyType = 'House' | 'Apartment' | 'Villa' | 'Penthouse' | 'Studio' | 'Condo' | 'Townhouse';
export type PropertyStatus = 'FOR SALE' | 'FOR RENT';
export type FeaturedBadge = 'Exclusive' | 'New Arrival';

export interface Property {
  id: string;
  slug: string;
  title: string;
  description?: string;
  location: string;
  price: number;
  period?: '/mo' | null;
  beds: number;
  baths: number;
  area: number;
  parking?: number;
  yearBuilt?: number;
  imageUrl: string;
  imageAlt: string;
  galleryUrls: string[];
  status: PropertyStatus;
  type: PropertyType;
  featuredBadge?: FeaturedBadge | null;

  isFeatured?: boolean;
  isActive?: boolean;
  lat?: number;
  lng?: number;
  amenities?: string[];
}

/** Raw row shape from the Supabase `properties` table (snake_case). */
export interface DbProperty {
  id: string;
  title: string;
  description?: string;
  location: string;
  price: number;
  period?: "/mo" | null;
  beds: number;
  baths: number;
  area: number;
  parking?: number;
  year_built?: number;
  image_alt: string;
  status: string;
  type: string;
  featured_badge?: "Exclusive" | "New Arrival" | null;
  created_at?: string;
  is_featured?: boolean;
  is_active?: boolean;
  slug: string;
  gallery_urls?: string[];
  lat?: number;
  lng?: number;
  amenities?: string[];
}

/** Convert a DB row to the frontend Property shape. */
export function toProperty(row: DbProperty): Property {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    location: row.location,
    price: row.price,
    period: row.period as "/mo" | undefined,
    beds: row.beds,
    baths: row.baths,
    area: row.area,
    parking: row.parking,
    yearBuilt: row.year_built,
    // Safely derive imageUrl from the first gallery item
    imageUrl: (row.gallery_urls && row.gallery_urls.length > 0) ? row.gallery_urls[0] : '',
    imageAlt: row.image_alt,
    galleryUrls: row.gallery_urls || [],
    status: row.status as PropertyStatus,
    type: row.type as PropertyType,
    featuredBadge: row.featured_badge,
    isFeatured: row.is_featured,
    isActive: row.is_active,
    lat: row.lat,
    lng: row.lng,
    amenities: row.amenities || [],
  };
}
