'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function createSupabaseClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
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
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    + '-' + Date.now().toString(36);
}

export async function createProperty(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createSupabaseClient(cookieStore);

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const price = parseFloat(formData.get('price') as string) || 0;
  const status = formData.get('status') as string;
  const type = formData.get('type') as string;
  const location = formData.get('location') as string;
  const area = parseFloat(formData.get('area') as string) || 0;
  const yearBuilt = parseInt(formData.get('year_built') as string) || null;
  const beds = parseInt(formData.get('beds') as string) || 0;
  const baths = parseInt(formData.get('baths') as string) || 0;
  const parking = parseInt(formData.get('parking') as string) || 0;
  const latRaw = formData.get('lat') as string;
  const lngRaw = formData.get('lng') as string;
  const lat = latRaw && Number.isFinite(parseFloat(latRaw)) ? parseFloat(latRaw) : null;
  const lng = lngRaw && Number.isFinite(parseFloat(lngRaw)) ? parseFloat(lngRaw) : null;
  const amenitiesRaw = formData.get('amenities') as string;
  const amenities = amenitiesRaw ? amenitiesRaw.split(',').filter(Boolean) : [];
  const existingGallery = formData.get('existing_gallery') as string;
  const galleryUrls: string[] = existingGallery ? JSON.parse(existingGallery) : [];

  // Handle image uploads
  const imageFiles = formData.getAll('images') as File[];
  for (const file of imageFiles) {
    if (file.size === 0) continue;
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
    const filePath = `properties/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(filePath, file, { contentType: file.type });

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);
      galleryUrls.push(publicUrl);
    }
  }

  const slug = generateSlug(title);

  const { error } = await supabase.from('properties').insert({
    title,
    description,
    slug,
    price,
    status,
    type,
    location,
    area,
    year_built: yearBuilt,
    beds,
    baths,
    parking,
    lat,
    lng,
    amenities,
    gallery_urls: galleryUrls,
    image_alt: title,
    is_featured: false,
  });

  if (error) {
    console.error('Error creating property:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/properties');
  redirect('/admin/properties');
}

export async function updateProperty(id: string, formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createSupabaseClient(cookieStore);

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const price = parseFloat(formData.get('price') as string) || 0;
  const status = formData.get('status') as string;
  const type = formData.get('type') as string;
  const location = formData.get('location') as string;
  const area = parseFloat(formData.get('area') as string) || 0;
  const yearBuilt = parseInt(formData.get('year_built') as string) || null;
  const beds = parseInt(formData.get('beds') as string) || 0;
  const baths = parseInt(formData.get('baths') as string) || 0;
  const parking = parseInt(formData.get('parking') as string) || 0;
  const latRaw = formData.get('lat') as string;
  const lngRaw = formData.get('lng') as string;
  const lat = latRaw && Number.isFinite(parseFloat(latRaw)) ? parseFloat(latRaw) : null;
  const lng = lngRaw && Number.isFinite(parseFloat(lngRaw)) ? parseFloat(lngRaw) : null;
  const amenitiesRaw = formData.get('amenities') as string;
  const amenities = amenitiesRaw ? amenitiesRaw.split(',').filter(Boolean) : [];
  const existingGallery = formData.get('existing_gallery') as string;
  const galleryUrls: string[] = existingGallery ? JSON.parse(existingGallery) : [];

  // Handle new image uploads
  const imageFiles = formData.getAll('images') as File[];
  for (const file of imageFiles) {
    if (file.size === 0) continue;
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
    const filePath = `properties/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(filePath, file, { contentType: file.type });

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);
      galleryUrls.push(publicUrl);
    }
  }

  const { error } = await supabase.from('properties').update({
    title,
    description,
    price,
    status,
    type,
    location,
    area,
    year_built: yearBuilt,
    beds,
    baths,
    parking,
    lat,
    lng,
    amenities,
    gallery_urls: galleryUrls,
    image_alt: title,
  }).eq('id', id);

  if (error) {
    console.error('Error updating property:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/properties');
  redirect('/admin/properties');
}

export async function deletePropertyImage(propertyId: string, imageUrl: string) {
  const cookieStore = await cookies();
  const supabase = createSupabaseClient(cookieStore);

  // Get current gallery
  const { data: property } = await supabase
    .from('properties')
    .select('gallery_urls')
    .eq('id', propertyId)
    .single();

  if (!property) return { success: false, error: 'Property not found' };

  const updatedGallery = (property.gallery_urls || []).filter((url: string) => url !== imageUrl);

  const { error } = await supabase
    .from('properties')
    .update({ gallery_urls: updatedGallery })
    .eq('id', propertyId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/properties');
  return { success: true, galleryUrls: updatedGallery };
}
