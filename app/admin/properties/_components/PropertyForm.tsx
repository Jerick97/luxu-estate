'use client';

import React, { useState, useRef, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { createProperty, updateProperty } from '../actions';

const MapWrapper = dynamic(() => import('@/components/ui/MapWrapper'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 dark:bg-gray-700 animate-pulse" />,
});

const PROPERTY_TYPES = ['House', 'Apartment', 'Villa', 'Penthouse', 'Studio'];
const STATUS_OPTIONS = [
  { value: 'FOR SALE', label: 'For Sale' },
  { value: 'FOR RENT', label: 'For Rent' },
];
const AMENITIES_LIST = ['Swimming Pool', 'Garden', 'Air Conditioning', 'Smart Home', 'Gym', 'Parking', 'High-speed Wifi', 'Patio / Terrace'];

const WEBP_QUALITY = 0.75;
const MAX_DIMENSION = 1920;
const MAX_OUTPUT_BYTES = 4.5 * 1024 * 1024;

async function convertToWebP(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new window.Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Image load failed'));
    el.src = dataUrl;
  });

  let { width, height } = img;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, width, height);

  let quality = WEBP_QUALITY;
  let blob: Blob | null = await new Promise(r => canvas.toBlob(r, 'image/webp', quality));
  while (blob && blob.size > MAX_OUTPUT_BYTES && quality > 0.3) {
    quality -= 0.1;
    blob = await new Promise(r => canvas.toBlob(r, 'image/webp', quality));
  }
  if (!blob) return file;

  const newName = file.name.replace(/\.[^.]+$/, '') + '.webp';
  return new File([blob], newName, { type: 'image/webp' });
}

interface PropertyFormProps {
  mode: 'create' | 'edit';
  property?: {
    id: string;
    title: string;
    description?: string;
    price: number;
    status: string;
    type: string;
    location: string;
    area: number;
    year_built?: number;
    beds: number;
    baths: number;
    parking?: number;
    amenities?: string[];
    gallery_urls?: string[];
    lat?: number | null;
    lng?: number | null;
  };
}

export function PropertyForm({ mode, property }: PropertyFormProps) {
  const [isPending, startTransition] = useTransition();
  const [beds, setBeds] = useState(property?.beds ?? 3);
  const [baths, setBaths] = useState(property?.baths ?? 2);
  const [parking, setParking] = useState(property?.parking ?? 1);
  const [amenities, setAmenities] = useState<string[]>(property?.amenities ?? []);
  const [galleryUrls, setGalleryUrls] = useState<string[]>(property?.gallery_urls ?? []);
  const [previewFiles, setPreviewFiles] = useState<{ file: File; url: string }[]>([]);
  const [charCount, setCharCount] = useState(property?.description?.length ?? 0);
  const [address, setAddress] = useState(property?.location ?? '');
  const [lat, setLat] = useState<string>(property?.lat != null ? String(property.lat) : '');
  const [lng, setLng] = useState<string>(property?.lng != null ? String(property.lng) : '');
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [imgProcessing, setImgProcessing] = useState(false);
  const [price, setPrice] = useState<string>(property?.price != null ? String(property.price) : '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const wrapSelection = (before: string, after: string = before, placeholder = 'text') => {
    const ta = descriptionRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const value = ta.value;
    const selected = value.slice(start, end) || placeholder;
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    ta.value = next;
    ta.focus();
    const cursorStart = start + before.length;
    ta.setSelectionRange(cursorStart, cursorStart + selected.length);
    setCharCount(next.length);
  };

  const insertList = () => {
    const ta = descriptionRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const value = ta.value;
    const selected = value.slice(start, end);
    const lines = (selected || 'List item').split('\n').map(l => `- ${l.replace(/^-\s*/, '')}`).join('\n');
    const needsLeadingBreak = start > 0 && value[start - 1] !== '\n';
    const block = (needsLeadingBreak ? '\n' : '') + lines;
    const next = value.slice(0, start) + block + value.slice(end);
    ta.value = next;
    ta.focus();
    const cursorStart = start + block.length;
    ta.setSelectionRange(cursorStart, cursorStart);
    setCharCount(next.length);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setImgProcessing(true);
    try {
      const converted = await Promise.all(files.map(convertToWebP));
      const newPreviews = converted.map(file => ({ file, url: URL.createObjectURL(file) }));
      setPreviewFiles(prev => [...prev, ...newPreviews]);
    } catch (err) {
      console.error('Image conversion failed:', err);
    } finally {
      setImgProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGeocode = async () => {
    if (!address.trim()) {
      setGeocodeError('Enter an address first');
      return;
    }
    setGeocoding(true);
    setGeocodeError(null);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setLat(parseFloat(data[0].lat).toFixed(6));
        setLng(parseFloat(data[0].lon).toFixed(6));
      } else {
        setGeocodeError('No results found for that address');
      }
    } catch {
      setGeocodeError('Geocoding failed. Try again.');
    } finally {
      setGeocoding(false);
    }
  };

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  const hasValidCoords = Number.isFinite(latNum) && Number.isFinite(lngNum);

  const removePreview = (index: number) => {
    setPreviewFiles(prev => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeExisting = (index: number) => {
    setGalleryUrls(prev => prev.filter((_, i) => i !== index));
  };

  const toggleAmenity = (amenity: string) => {
    setAmenities(prev => prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(formRef.current!);
    formData.set('beds', beds.toString());
    formData.set('baths', baths.toString());
    formData.set('parking', parking.toString());
    formData.set('amenities', amenities.join(','));
    formData.set('existing_gallery', JSON.stringify(galleryUrls));
    formData.set('lat', lat);
    formData.set('lng', lng);
    formData.delete('images');
    previewFiles.forEach(p => formData.append('images', p.file));

    startTransition(async () => {
      if (mode === 'edit' && property?.id) {
        await updateProperty(property.id, formData);
      } else {
        await createProperty(formData);
      }
    });
  };

  const isEdit = mode === 'edit';
  const pageTitle = isEdit ? 'Edit Property' : 'Add New Property';
  const breadcrumbLast = isEdit ? 'Edit' : 'Add New';

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 dark:border-gray-700 pb-8">
        <div className="space-y-4">
          <nav aria-label="Breadcrumb"><ol className="flex items-center space-x-2 text-sm text-gray-500 font-medium">
            <li><Link href="/admin/properties" className="hover:text-mosque transition-colors">Properties</Link></li>
            <li><span className="material-icons text-xs text-gray-400">chevron_right</span></li>
            <li className="text-nordic dark:text-white">{breadcrumbLast}</li>
          </ol></nav>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-nordic dark:text-white tracking-tight mb-2">{pageTitle}</h1>
            <p className="text-base text-gray-500 dark:text-gray-400 max-w-2xl font-normal">Fill in the details below to create a new listing. Fields marked with * are mandatory.</p>
          </div>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <Link href="/admin/properties" className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-nordic dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm">Cancel</Link>
          <button type="submit" disabled={isPending} className="px-5 py-2.5 rounded-lg bg-mosque hover:bg-nordic text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 text-sm disabled:opacity-60">
            <span className="material-icons text-sm">save</span>
            {isPending ? 'Saving...' : 'Save Property'}
          </button>
        </div>
      </header>

      {/* Form Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Column */}
        <div className="xl:col-span-8 space-y-8">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-8 py-6 border-b border-hint-green/30 flex items-center gap-3 bg-gradient-to-r from-hint-green/10 to-transparent">
              <div className="w-8 h-8 rounded-full bg-hint-green flex items-center justify-center text-nordic"><span className="material-icons text-lg">info</span></div>
              <h2 className="text-xl font-bold text-nordic dark:text-white">Basic Information</h2>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-nordic dark:text-gray-300 mb-1.5" htmlFor="title">Property Title <span className="text-red-500">*</span></label>
                <input name="title" id="title" required defaultValue={property?.title} className="w-full text-base px-4 py-2.5 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-nordic dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all" placeholder="e.g. Modern Penthouse with Ocean View" type="text" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-nordic dark:text-gray-300 mb-1.5" htmlFor="price">Price <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      name="price"
                      id="price"
                      required
                      value={price}
                      onChange={e => setPrice(e.target.value.replace(/\s+/g, ''))}
                      onPaste={e => {
                        e.preventDefault();
                        const pasted = e.clipboardData.getData('text').replace(/\s+/g, '');
                        setPrice(pasted);
                      }}
                      onKeyDown={e => { if (e.key === ' ') e.preventDefault(); }}
                      className="w-full pl-7 pr-4 py-2.5 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-nordic dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all text-base font-medium"
                      placeholder="0.00"
                      type="number"
                      inputMode="decimal"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-nordic dark:text-gray-300 mb-1.5" htmlFor="status">Status</label>
                  <select name="status" id="status" defaultValue={property?.status || 'FOR SALE'} className="w-full px-4 py-2.5 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-nordic dark:text-white focus:ring-1 focus:ring-mosque focus:border-mosque transition-all text-base cursor-pointer">
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-nordic dark:text-gray-300 mb-1.5" htmlFor="type">Property Type</label>
                  <select name="type" id="type" defaultValue={property?.type || 'Apartment'} className="w-full px-4 py-2.5 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-nordic dark:text-white focus:ring-1 focus:ring-mosque focus:border-mosque transition-all text-base cursor-pointer">
                    {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-8 py-6 border-b border-hint-green/30 flex items-center gap-3 bg-gradient-to-r from-hint-green/10 to-transparent">
              <div className="w-8 h-8 rounded-full bg-hint-green flex items-center justify-center text-nordic"><span className="material-icons text-lg">description</span></div>
              <h2 className="text-xl font-bold text-nordic dark:text-white">Description</h2>
            </div>
            <div className="p-8">
              <div className="mb-3 flex gap-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                <button
                  type="button"
                  onClick={() => wrapSelection('**', '**', 'bold text')}
                  title="Bold (**text**)"
                  className="p-1.5 text-gray-500 hover:text-mosque dark:hover:text-white hover:bg-hint-green/30 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <span className="material-icons text-lg">format_bold</span>
                </button>
                <button
                  type="button"
                  onClick={() => wrapSelection('*', '*', 'italic text')}
                  title="Italic (*text*)"
                  className="p-1.5 text-gray-500 hover:text-mosque dark:hover:text-white hover:bg-hint-green/30 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <span className="material-icons text-lg">format_italic</span>
                </button>
                <button
                  type="button"
                  onClick={insertList}
                  title="Bulleted list"
                  className="p-1.5 text-gray-500 hover:text-mosque dark:hover:text-white hover:bg-hint-green/30 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <span className="material-icons text-lg">format_list_bulleted</span>
                </button>
                <span className="ml-auto text-[10px] uppercase tracking-wider text-gray-400 self-center">Markdown</span>
              </div>
              <textarea
                ref={descriptionRef}
                name="description"
                id="description"
                maxLength={2000}
                defaultValue={property?.description}
                onChange={e => setCharCount(e.target.value.length)}
                className="w-full px-4 py-3 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-nordic dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all text-base leading-relaxed resize-y min-h-[200px] font-mono"
                placeholder="Describe the property. Use **bold**, *italic* or - lists."
              />
              <div className="mt-2 text-right text-xs text-gray-400">{charCount} / 2000 characters</div>
            </div>
          </div>

          {/* Gallery */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-8 py-6 border-b border-hint-green/30 flex justify-between items-center bg-gradient-to-r from-hint-green/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-hint-green flex items-center justify-center text-nordic"><span className="material-icons text-lg">image</span></div>
                <h2 className="text-xl font-bold text-nordic dark:text-white">Gallery</h2>
              </div>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Auto-converted to WEBP</span>
            </div>
            <div className="p-8">
              <div onClick={() => fileInputRef.current?.click()} className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-700/30 p-10 text-center hover:bg-hint-green/10 hover:border-mosque/40 transition-colors cursor-pointer group">
                <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 bg-white dark:bg-gray-600 rounded-full flex items-center justify-center shadow-sm text-mosque group-hover:scale-110 transition-transform duration-300">
                    <span className="material-icons text-2xl">cloud_upload</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-medium text-nordic dark:text-white">
                      {imgProcessing ? 'Processing images...' : 'Click or drag images here'}
                    </p>
                    <p className="text-xs text-gray-400">Images are resized & compressed to WebP (≤4.5MB)</p>
                  </div>
                </div>
              </div>
              {(galleryUrls.length > 0 || previewFiles.length > 0) && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                  {galleryUrls.map((url, i) => (
                    <div key={`existing-${i}`} className="aspect-square rounded-lg overflow-hidden relative group shadow-sm">
                      <Image src={url} alt={`Gallery ${i + 1}`} fill className="object-cover" sizes="150px" />
                      <div className="absolute inset-0 bg-nordic/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                        <button type="button" onClick={() => removeExisting(i)} className="w-8 h-8 rounded-full bg-white text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"><span className="material-icons text-sm">delete</span></button>
                      </div>
                      {i === 0 && <span className="absolute top-2 left-2 bg-mosque text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm uppercase tracking-wider">Main</span>}
                    </div>
                  ))}
                  {previewFiles.map((p, i) => (
                    <div key={`preview-${i}`} className="aspect-square rounded-lg overflow-hidden relative group shadow-sm">
                      <Image src={p.url} alt={`Preview ${i + 1}`} fill className="object-cover" sizes="150px" />
                      <div className="absolute inset-0 bg-nordic/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                        <button type="button" onClick={() => removePreview(i)} className="w-8 h-8 rounded-full bg-white text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"><span className="material-icons text-sm">delete</span></button>
                      </div>
                      <span className="absolute top-2 right-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm uppercase tracking-wider">New</span>
                    </div>
                  ))}
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-lg border border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center text-gray-400 hover:text-mosque hover:border-mosque hover:bg-hint-green/20 transition-all group">
                    <span className="material-icons group-hover:scale-110 transition-transform">add</span>
                    <span className="text-xs mt-1 font-medium">Add More</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="xl:col-span-4 space-y-8">
          {/* Location */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-hint-green/30 flex items-center gap-3 bg-gradient-to-r from-hint-green/10 to-transparent">
              <div className="w-8 h-8 rounded-full bg-hint-green flex items-center justify-center text-nordic"><span className="material-icons text-lg">place</span></div>
              <h2 className="text-lg font-bold text-nordic dark:text-white">Location</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-nordic dark:text-gray-300 mb-1.5" htmlFor="location">Address</label>
                <div className="flex gap-2">
                  <input
                    name="location"
                    id="location"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-nordic dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all text-sm"
                    placeholder="Street Address, City, Zip"
                    type="text"
                  />
                  <button
                    type="button"
                    onClick={handleGeocode}
                    disabled={geocoding}
                    className="px-3 py-2.5 rounded-md bg-mosque hover:bg-nordic disabled:opacity-60 text-white text-sm font-medium flex items-center gap-1 transition-colors"
                    title="Find coordinates from address"
                  >
                    <span className="material-icons text-sm">{geocoding ? 'hourglass_empty' : 'my_location'}</span>
                    {geocoding ? '...' : 'Locate'}
                  </button>
                </div>
                {geocodeError && <p className="mt-1.5 text-xs text-red-500">{geocodeError}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block" htmlFor="lat">Latitude</label>
                  <input
                    id="lat"
                    value={lat}
                    onChange={e => setLat(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-nordic dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all text-sm"
                    placeholder="0.000000"
                    type="number"
                    step="any"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block" htmlFor="lng">Longitude</label>
                  <input
                    id="lng"
                    value={lng}
                    onChange={e => setLng(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-nordic dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all text-sm"
                    placeholder="0.000000"
                    type="number"
                    step="any"
                  />
                </div>
              </div>
              <div className="relative h-64 w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                {hasValidCoords ? (
                  <MapWrapper lat={latNum} lng={lngNum} />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-hint-green/20 to-background-light dark:to-gray-800 flex items-center justify-center">
                    <span className="bg-white/90 dark:bg-gray-800/90 text-nordic dark:text-white px-3 py-1.5 rounded shadow-sm backdrop-blur-sm text-xs font-medium flex items-center gap-1">
                      <span className="material-icons text-sm text-mosque">map</span>
                      Enter an address and click Locate
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden sticky top-24">
            <div className="px-6 py-4 border-b border-hint-green/30 flex items-center gap-3 bg-gradient-to-r from-hint-green/10 to-transparent">
              <div className="w-8 h-8 rounded-full bg-hint-green flex items-center justify-center text-nordic"><span className="material-icons text-lg">straighten</span></div>
              <h2 className="text-lg font-bold text-nordic dark:text-white">Details</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block" htmlFor="area">Area (m²)</label>
                  <input name="area" id="area" defaultValue={property?.area} className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-nordic dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all text-sm" placeholder="0" type="number" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block" htmlFor="year_built">Year Built</label>
                  <input name="year_built" id="year_built" defaultValue={property?.year_built ?? ''} className="w-full px-3 py-2 rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-nordic dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all text-sm" placeholder="YYYY" type="number" />
                </div>
              </div>
              <hr className="border-gray-100 dark:border-gray-700" />
              {/* Stepper controls */}
              {[
                { icon: 'bed', label: 'Bedrooms', value: beds, setter: setBeds },
                { icon: 'shower', label: 'Bathrooms', value: baths, setter: setBaths },
                { icon: 'directions_car', label: 'Parking', value: parking, setter: setParking },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <label className="text-sm font-medium text-nordic dark:text-gray-300 flex items-center gap-2">
                    <span className="material-icons text-gray-400 text-sm">{item.icon}</span> {item.label}
                  </label>
                  <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-md overflow-hidden bg-white dark:bg-gray-700 shadow-sm">
                    <button type="button" onClick={() => item.setter(Math.max(0, item.value - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors border-r border-gray-100 dark:border-gray-600">-</button>
                    <span className="w-10 text-center text-sm font-medium text-nordic dark:text-white">{item.value}</span>
                    <button type="button" onClick={() => item.setter(item.value + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors border-l border-gray-100 dark:border-gray-600">+</button>
                  </div>
                </div>
              ))}
              <hr className="border-gray-100 dark:border-gray-700" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Amenities</h3>
                <div className="space-y-2">
                  {AMENITIES_LIST.map(amenity => (
                    <label key={amenity} className="flex items-center gap-2.5 cursor-pointer group">
                      <input type="checkbox" checked={amenities.includes(amenity)} onChange={() => toggleAmenity(amenity)} className="w-4 h-4 text-mosque border-gray-300 rounded focus:ring-mosque" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-nordic dark:group-hover:text-white transition-colors">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-xl md:hidden z-40 flex gap-3">
        <Link href="/admin/properties" className="flex-1 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-nordic dark:text-gray-300 font-medium text-center">Cancel</Link>
        <button type="submit" disabled={isPending} className="flex-1 py-3 rounded-lg bg-mosque text-white font-medium flex justify-center items-center gap-2 disabled:opacity-60">
          {isPending ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}
