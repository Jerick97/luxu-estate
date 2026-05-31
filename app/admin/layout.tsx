import Link from 'next/link'
import { Building } from 'lucide-react'
import { getDictionary } from '@/lib/i18n/getDictionary'
import { cookies } from 'next/headers'
import { AdminUserMenu } from '@/components/layout/AdminUserMenu'
import { AdminNavLinks } from './_components/AdminNavLinks'
import { LanguageSelector } from '@/components/layout/LanguageSelector'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const lang = cookieStore.get('NEXT_LOCALE')?.value || 'en'
  const dict = await getDictionary(lang as "en" | "es" | "fr")

  return (
    <div className="bg-background-light dark:bg-background-dark text-nordic dark:text-gray-100 font-display min-h-screen flex flex-col antialiased">
      <nav className="bg-white dark:bg-gray-900 border-b border-nordic/10 dark:border-gray-800 px-4 sm:px-6 lg:px-8 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
          <div className="flex items-center gap-8 lg:gap-12">
            <Link href="/admin" className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-nordic-dark flex items-center justify-center">
                <Building className="text-white h-5 w-5" strokeWidth={2} />
              </div>
              <span className="font-bold text-lg text-nordic dark:text-white tracking-tight">LuxuEstate</span>
            </Link>
            <div className="hidden md:flex space-x-4 lg:space-x-8">
              <AdminNavLinks />
            </div>
          </div>
          <div className="flex items-center gap-3 lg:gap-5">
            <button className="text-nordic/60 dark:text-gray-400 hover:text-mosque transition-colors">
              <span className="material-symbols-outlined text-xl">search</span>
            </button>
            <button className="text-nordic/60 dark:text-gray-400 hover:text-mosque transition-colors relative">
              <span className="material-symbols-outlined text-xl">notifications</span>
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#152e2a]"></span>
            </button>
            <div className="hidden sm:block">
              <LanguageSelector />
            </div>
            <AdminUserMenu />
          </div>
        </div>
      </nav>
      {children}
      <footer className="mt-auto border-t border-nordic/5 dark:border-mosque/20 bg-background-light dark:bg-[#152e2a] py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <p className="text-center text-sm text-gray-400 dark:text-gray-500">© 2026 {dict.admin?.copyright}</p>
        </div>
      </footer>
    </div>
  )
}
