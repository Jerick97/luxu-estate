"use client";

import Image from "next/image";
import Link from "next/link";
import { BedDouble, Bath, Maximize, Heart, ArrowRight, Calendar } from "lucide-react";

import { Property } from "@/lib/types";

interface FavoritesDict {
  forSale: string;
  forRent: string;
  bookVisit: string;
  scheduleTour: string;
  removeFavorite: string;
}

interface Props {
  property: Property;
  dict: FavoritesDict;
  view: "grid" | "list";
  onRemove: (id: string) => void;
}

function formatPrice(property: Property) {
  const value =
    property.price >= 1000 ? `$${property.price.toLocaleString()}` : `$${property.price}`;
  return property.period ? `${value}${property.period}` : value;
}

function StatusPill({ property, dict }: { property: Property; dict: FavoritesDict }) {
  const isRent = property.status === "FOR RENT";
  return (
    <span
      className={`text-xs font-medium px-2 py-1 rounded ${
        isRent ? "bg-blue-50 text-blue-800" : "bg-hint-of-green text-mosque"
      }`}
    >
      {isRent ? dict.forRent : dict.forSale}
    </span>
  );
}

function Specs({ property }: { property: Property }) {
  return (
    <div className="flex items-center justify-between text-nordic-dark/60 text-xs font-medium">
      <div className="flex items-center gap-1">
        <BedDouble className="w-4 h-4 text-mosque" strokeWidth={1.5} />
        <span>{property.beds}</span>
      </div>
      <div className="flex items-center gap-1">
        <Bath className="w-4 h-4 text-mosque" strokeWidth={1.5} />
        <span>{property.baths}</span>
      </div>
      <div className="flex items-center gap-1">
        <Maximize className="w-4 h-4 text-mosque" strokeWidth={1.5} />
        <span>{property.area}m²</span>
      </div>
    </div>
  );
}

function ActionButton({ property, dict }: { property: Property; dict: FavoritesDict }) {
  const isRent = property.status === "FOR RENT";
  return (
    <Link
      href={`/properties/${property.slug}`}
      className="w-full py-2.5 rounded-lg border border-mosque text-mosque font-medium text-sm hover:bg-mosque hover:text-white transition-colors duration-300 flex items-center justify-center gap-2"
    >
      <span>{isRent ? dict.scheduleTour : dict.bookVisit}</span>
      {isRent ? (
        <Calendar className="w-4 h-4" strokeWidth={2} />
      ) : (
        <ArrowRight className="w-4 h-4" strokeWidth={2} />
      )}
    </Link>
  );
}

function RemoveButton({
  property,
  dict,
  onRemove,
}: {
  property: Property;
  dict: FavoritesDict;
  onRemove: (id: string) => void;
}) {
  return (
    <button
      type="button"
      aria-label={dict.removeFavorite}
      onClick={() => onRemove(property.id)}
      className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-mosque hover:bg-mosque hover:text-white transition-colors shadow-sm z-10"
    >
      <Heart className="w-5 h-5 fill-current" strokeWidth={1.5} />
    </button>
  );
}

export function FavoriteCard({ property, dict, view, onRemove }: Props) {
  if (view === "list") {
    return (
      <div className="group bg-white rounded-xl overflow-hidden shadow-card hover:shadow-soft transition-all duration-300 border border-slate-100 flex flex-col sm:flex-row">
        <div className="relative sm:w-72 h-56 sm:h-auto shrink-0 overflow-hidden">
          <Image
            src={property.imageUrl}
            alt={property.imageAlt}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <RemoveButton property={property} dict={dict} onRemove={onRemove} />
          {property.featuredBadge && (
            <div className="absolute bottom-3 left-3 bg-nordic-dark/90 backdrop-blur-md px-3 py-1 rounded-md">
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                {property.featuredBadge}
              </span>
            </div>
          )}
        </div>
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-nordic-dark">{formatPrice(property)}</h3>
            <StatusPill property={property} dict={dict} />
          </div>
          <h4 className="text-nordic-dark font-medium mb-1 line-clamp-1">{property.title}</h4>
          <p className="text-nordic-dark/70 text-sm mb-4 line-clamp-1">{property.location}</p>
          <div className="mb-6 max-w-xs">
            <Specs property={property} />
          </div>
          <div className="mt-auto sm:max-w-xs">
            <ActionButton property={property} dict={dict} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-white rounded-xl overflow-hidden shadow-card hover:shadow-soft hover:-translate-y-1 transition-all duration-300 border border-slate-100 flex flex-col h-full">
      <div className="relative h-64 overflow-hidden">
        <Image
          src={property.imageUrl}
          alt={property.imageAlt}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <RemoveButton property={property} dict={dict} onRemove={onRemove} />
        {property.featuredBadge && (
          <div className="absolute bottom-3 left-3 bg-nordic-dark/90 backdrop-blur-md px-3 py-1 rounded-md">
            <span className="text-xs font-semibold text-white uppercase tracking-wider">
              {property.featuredBadge}
            </span>
          </div>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-nordic-dark">{formatPrice(property)}</h3>
          <StatusPill property={property} dict={dict} />
        </div>
        <p className="text-nordic-dark/70 text-sm mb-4 line-clamp-1">{property.location}</p>
        <div className="mb-6">
          <Specs property={property} />
        </div>
        <div className="mt-auto">
          <ActionButton property={property} dict={dict} />
        </div>
      </div>
    </div>
  );
}
