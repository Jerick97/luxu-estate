"use client";

import { useState, useEffect, useRef } from "react";
import { Building, Search, Bell, User, LogOut, Heart, Settings } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { SearchFiltersModal } from "@/components/search/SearchFiltersModal";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { useTranslation } from "@/components/providers/I18nProvider";
import { usePathname } from "next/navigation";
import { useSavedProperties } from "@/components/providers/SavedPropertiesProvider";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export const Navbar = () => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { savedPropertyIds } = useSavedProperties();
  const savedCount = savedPropertyIds.length;
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const supabase = createClient();
  const pathname = usePathname();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      if (data.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
        setIsAdmin(profile?.role === 'admin');
      } else {
        setIsAdmin(false);
      }
    };
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-nordic-dark/10 dark:border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          <Link href="/" className="shrink-0 flex items-center gap-2 cursor-pointer transition-transform hover:-translate-y-0.5">
            <div className="w-8 h-8 rounded-lg bg-nordic-dark flex items-center justify-center">
              <Building className="text-white h-5 w-5" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-nordic-dark dark:text-white">
              LuxuEstate
            </span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#" className="relative group text-mosque font-medium text-sm px-1 py-1">
              {t("navbar.buy")}
              <span className="absolute -bottom-1 left-0 h-[2px] w-full bg-mosque rounded-full"></span>
            </Link>
            <Link href="#" className="relative group text-nordic-dark/70 hover:text-nordic-dark font-medium text-sm px-1 py-1 transition-colors">
              {t("navbar.rent")}
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-[2px] w-0 bg-mosque/50 transition-all duration-300 ease-out group-hover:w-full rounded-full"></span>
            </Link>
            <Link href="#" className="relative group text-nordic-dark/70 hover:text-nordic-dark font-medium text-sm px-1 py-1 transition-colors">
              {t("navbar.sell")}
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-[2px] w-0 bg-mosque/50 transition-all duration-300 ease-out group-hover:w-full rounded-full"></span>
            </Link>
            <Link href="/favorites" className="relative group text-nordic-dark/70 hover:text-nordic-dark font-medium text-sm px-1 py-1 transition-colors">
              {t("navbar.savedHomes")}
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-[2px] w-0 bg-mosque/50 transition-all duration-300 ease-out group-hover:w-full rounded-full"></span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-3 sm:space-x-6">
            <button 
              onClick={() => setIsFiltersOpen(true)}
              className="text-nordic-dark hover:text-mosque dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              <Search className="h-6 w-6" strokeWidth={1.5} />
            </button>
            <button className="text-nordic-dark hover:text-mosque dark:text-gray-400 dark:hover:text-white transition-colors relative hidden sm:block">
              <Bell className="h-7 w-7 text-nordic-dark" strokeWidth={1.5} />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-background-light dark:border-background-dark"></span>
            </button>
            
            <LanguageSelector />
            
            {user ? (
              <div className="relative pl-2 sm:border-l border-nordic-dark/10 dark:border-white/10 sm:ml-2" ref={userMenuRef}>
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 focus:outline-none"
                  aria-label="User menu"
                >
                  <div className={`w-9 h-9 rounded-full overflow-hidden ring-2 transition-all relative ${isUserMenuOpen ? 'ring-mosque shadow-soft' : 'ring-transparent hover:ring-mosque'}`}>
                    {user.user_metadata?.avatar_url ? (
                      <Image 
                        src={user.user_metadata.avatar_url} 
                        alt="User avatar" 
                        width={36}
                        height={36}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#EAC9B6] flex items-center justify-center">
                        <User className="h-[18px] w-[18px] text-[#A67E67]" strokeWidth={2.5} />
                      </div>
                    )}
                  </div>
                </button>
                
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-[#1a1f2e] border border-gray-100 dark:border-white/10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-1.5 overflow-hidden z-50 animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 origin-top-right transition-all">
                    
                    {/* Header: Avatar + Info */}
                    <div className="flex items-center gap-3 p-3 mb-1 bg-gray-50/50 dark:bg-black/20 rounded-xl">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-black/5 dark:border-white/5 ring-2 ring-transparent">
                        {user.user_metadata?.avatar_url ? (
                          <Image 
                            src={user.user_metadata.avatar_url} 
                            alt="User avatar" 
                            width={40} height={40}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#EAC9B6] flex items-center justify-center">
                            <User className="h-5 w-5 text-[#A67E67]" strokeWidth={2.5} />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <p className="text-sm font-semibold text-nordic-dark dark:text-white truncate">
                          {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-xs text-nordic-dark/60 dark:text-gray-400 truncate mt-0.5">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="h-px bg-gray-200 dark:bg-white/10 my-1.5 mx-2"></div>

                    {/* Navigation Links */}
                    <div className="space-y-0.5">
                      {isAdmin && (
                        <Link href="/admin" className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-nordic-dark dark:text-gray-200 hover:bg-mosque/10 dark:hover:bg-mosque/20 rounded-lg transition-colors text-left group">
                          <div className="w-4 h-4 flex items-center justify-center">
                            <span className="material-symbols-outlined text-mosque/70 group-hover:text-mosque transition-colors" style={{fontSize: '18px'}}>admin_panel_settings</span>
                          </div>
                          <span className="font-semibold text-mosque">Admin Dashboard</span>
                        </Link>
                      )}
                      <Link href="/profile" onClick={() => setIsUserMenuOpen(false)} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-nordic-dark dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-left group">
                        <User className="w-4 h-4 text-nordic-dark/50 dark:text-gray-400 group-hover:text-mosque transition-colors" />
                        <span>{t("navbar.profile")}</span>
                      </Link>
                      <Link href="/favorites" onClick={() => setIsUserMenuOpen(false)} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-nordic-dark dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-left group">
                        <Heart className="w-4 h-4 text-nordic-dark/50 dark:text-gray-400 group-hover:text-mosque transition-colors" />
                        <span>{t("navbar.savedHomes")}</span>
                        {savedCount > 0 && (
                          <span className="ml-auto bg-mosque/10 text-mosque dark:bg-mosque/20 dark:text-mosque font-semibold text-[10px] px-2 py-0.5 rounded-full">{savedCount}</span>
                        )}
                      </Link>
                      <Link href="/profile?tab=settings" onClick={() => setIsUserMenuOpen(false)} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-nordic-dark dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-left group">
                        <Settings className="w-4 h-4 text-nordic-dark/50 dark:text-gray-400 group-hover:text-mosque transition-colors" />
                        <span>{t("navbar.settings")}</span>
                      </Link>
                    </div>

                    <div className="h-px bg-gray-200 dark:bg-white/10 my-1.5 mx-2"></div>

                    {/* Sign out */}
                    <button
                      onClick={async () => {
                        setIsUserMenuOpen(false);
                        await supabase.auth.signOut();
                        window.location.reload();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors text-left group"
                    >
                      <LogOut className="w-4 h-4 text-rose-500/70 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors" />
                      <span className="font-medium">{t("navbar.signOut")}</span>
                    </button>
                    
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="flex items-center gap-2 pl-2 sm:border-l border-nordic-dark/10 dark:border-white/10 sm:ml-2">
                <div className="w-9 h-9 rounded-full bg-[#EAC9B6] flex items-center justify-center overflow-hidden ring-2 ring-transparent hover:ring-mosque transition-all relative">
                  <User className="h-[18px] w-[18px] text-[#A67E67]" strokeWidth={2.5} />
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
      
      <div className="md:hidden border-t border-nordic-dark/5 bg-background-light dark:bg-background-dark overflow-hidden h-0 transition-all duration-300">
        <div className="px-4 py-2 space-y-1">
          <Link href="#" className="block px-3 py-2 rounded-md text-base font-medium text-mosque bg-mosque/10">{t("navbar.buy")}</Link>
          <Link href="#" className="block px-3 py-2 rounded-md text-base font-medium text-nordic-dark hover:bg-black/5">{t("navbar.rent")}</Link>
          <Link href="#" className="block px-3 py-2 rounded-md text-base font-medium text-nordic-dark hover:bg-black/5">{t("navbar.sell")}</Link>
          <Link href="/favorites" className="flex justify-between items-center px-3 py-2 rounded-md text-base font-medium text-nordic-dark hover:bg-black/5">
            {t("navbar.savedHomes")}
            {savedCount > 0 && (
              <span className="bg-mosque/10 text-mosque dark:bg-mosque/20 dark:text-mosque font-semibold text-[10px] px-2 py-0.5 rounded-full">{savedCount}</span>
            )}
          </Link>
        </div>
      </div>

      <SearchFiltersModal 
        isOpen={isFiltersOpen} 
        onClose={() => setIsFiltersOpen(false)} 
      />
    </nav>
  );
};
