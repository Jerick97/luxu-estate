"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, LayoutGrid, List, Plus, Heart, ArrowRight } from "lucide-react";

import { Property } from "@/lib/types";
import { useSavedProperties } from "@/components/providers/SavedPropertiesProvider";
import { FavoriteCard } from "./FavoriteCard";

export type FavoriteItem = Property & { savedAt: string };

type SortKey = "date" | "priceLow" | "priceHigh";
type ViewMode = "grid" | "list";

interface FavoritesDict {
  title: string;
  youHave: string;
  propertyWaiting: string;
  propertiesWaiting: string;
  sortBy: string;
  sortDateAdded: string;
  sortPriceLow: string;
  sortPriceHigh: string;
  gridView: string;
  listView: string;
  forSale: string;
  forRent: string;
  bookVisit: string;
  scheduleTour: string;
  removeFavorite: string;
  discoverMore: string;
  discoverMoreSubtitle: string;
  browseListings: string;
  emptyTitle: string;
  emptySubtitle: string;
}

interface Props {
  items: FavoriteItem[];
  dict: FavoritesDict;
}

export function FavoritesView({ items, dict }: Props) {
  const { unsaveProperty } = useSavedProperties();
  const [list, setList] = useState<FavoriteItem[]>(items);
  const [view, setView] = useState<ViewMode>("grid");
  const [sort, setSort] = useState<SortKey>("date");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRemove = (id: string) => {
    setList((prev) => prev.filter((item) => item.id !== id));
    unsaveProperty(id);
  };

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "date", label: dict.sortDateAdded },
    { key: "priceLow", label: dict.sortPriceLow },
    { key: "priceHigh", label: dict.sortPriceHigh },
  ];

  const visibleItems = useMemo(() => {
    const sorted = [...list];
    switch (sort) {
      case "priceLow":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "priceHigh":
        sorted.sort((a, b) => b.price - a.price);
        break;
      default:
        sorted.sort((a, b) => +new Date(b.savedAt) - +new Date(a.savedAt));
    }
    return sorted;
  }, [list, sort]);

  const count = visibleItems.length;
  const activeSortLabel =
    sortOptions.find((option) => option.key === sort)?.label ?? dict.sortDateAdded;

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-nordic-dark tracking-tight mb-2">
            {dict.title}
          </h1>
          <p className="text-nordic-dark/70">
            {dict.youHave} {count}{" "}
            {count === 1 ? dict.propertyWaiting : dict.propertiesWaiting}
          </p>
        </div>

        {count > 0 && (
          <div className="flex items-center gap-3">
            {/* Sort dropdown */}
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setSortOpen((open) => !open)}
                className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-lg text-sm font-medium text-nordic-dark shadow-sm hover:shadow-md transition-all border border-transparent hover:border-mosque/30"
              >
                <span>
                  {dict.sortBy}: {activeSortLabel}
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${sortOpen ? "rotate-180" : ""}`}
                  strokeWidth={2}
                />
              </button>
              {sortOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-dropdown p-1.5 z-30">
                  {sortOptions.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => {
                        setSort(option.key);
                        setSortOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                        sort === option.key
                          ? "bg-mosque/10 text-mosque font-medium"
                          : "text-nordic-dark hover:bg-gray-100"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View toggle */}
            <div className="flex bg-white rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setView("grid")}
                aria-label={dict.gridView}
                aria-pressed={view === "grid"}
                className={`p-1.5 rounded transition-colors ${
                  view === "grid"
                    ? "text-mosque bg-hint-of-green"
                    : "text-nordic-dark/40 hover:text-nordic-dark/70"
                }`}
              >
                <LayoutGrid className="w-5 h-5" strokeWidth={2} />
              </button>
              <button
                onClick={() => setView("list")}
                aria-label={dict.listView}
                aria-pressed={view === "list"}
                className={`p-1.5 rounded transition-colors ${
                  view === "list"
                    ? "text-mosque bg-hint-of-green"
                    : "text-nordic-dark/40 hover:text-nordic-dark/70"
                }`}
              >
                <List className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Empty state */}
      {count === 0 ? (
        <div className="flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-dashed border-nordic-dark/15 py-20 px-6">
          <div className="w-16 h-16 rounded-full bg-mosque/10 flex items-center justify-center mb-5">
            <Heart className="w-8 h-8 text-mosque" strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-bold text-nordic-dark mb-1">{dict.emptyTitle}</h3>
          <p className="text-nordic-dark/60 text-sm max-w-sm mb-6">{dict.emptySubtitle}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-mosque text-white font-medium text-sm shadow-lg shadow-mosque/30 hover:bg-nordic-dark transition-colors"
          >
            {dict.browseListings}
            <ArrowRight className="w-4 h-4" strokeWidth={2} />
          </Link>
        </div>
      ) : (
        <div
          className={
            view === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8"
              : "flex flex-col gap-6"
          }
        >
          {visibleItems.map((property) => (
            <FavoriteCard
              key={property.id}
              property={property}
              dict={dict}
              view={view}
              onRemove={handleRemove}
            />
          ))}

          {/* Discover More CTA — only in grid view to mirror the design */}
          {view === "grid" && (
            <Link
              href="/"
              className="group bg-hint-of-green/30 rounded-xl overflow-hidden shadow-card hover:shadow-soft transition-all duration-300 border-2 border-dashed border-mosque/30 hover:border-mosque flex flex-col h-full items-center justify-center min-h-[400px] text-center p-6"
            >
              <div className="w-16 h-16 rounded-full bg-hint-of-green flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-8 h-8 text-mosque" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-nordic-dark mb-2">{dict.discoverMore}</h3>
              <p className="text-nordic-dark/70 text-sm mb-6 max-w-[200px]">
                {dict.discoverMoreSubtitle}
              </p>
              <span className="px-6 py-2.5 rounded-lg bg-mosque text-white font-medium text-sm shadow-lg shadow-mosque/30 group-hover:bg-nordic-dark transition-colors">
                {dict.browseListings}
              </span>
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
