'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SearchFiltersModal } from '@/components/search/SearchFiltersModal';
import { useTranslation } from '@/components/providers/I18nProvider';

export function PropertiesHeaderActions() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-white dark:bg-[#152e2a] border border-gray-200 dark:border-mosque/30 text-nordic dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-mosque/10 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm inline-flex items-center gap-2"
        >
          <span className="material-icons text-base">filter_list</span> {t('admin.dashboard.filter')}
        </button>
        <Link href="/admin/properties/new" className="bg-mosque hover:bg-mosque/90 text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-md shadow-mosque/20 transition-all transform hover:-translate-y-0.5 inline-flex items-center gap-2">
          <span className="material-icons text-base">add</span> {t('admin.dashboard.addNewProperty')}
        </Link>
      </div>

      <SearchFiltersModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
