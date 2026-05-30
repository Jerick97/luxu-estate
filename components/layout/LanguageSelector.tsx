"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "@/components/providers/I18nProvider";
import { COOKIE_NAME, locales, Locale } from "@/lib/i18n/config";

// SVG flags render consistently across OSes (Windows has no emoji-flag glyphs).
const Flag = ({ locale, className = "" }: { locale: Locale; className?: string }) => {
	const flags: Record<Locale, React.ReactNode> = {
		es: (
			<>
				<rect width="20" height="14" fill="#c60b1e" />
				<rect y="3.5" width="20" height="7" fill="#ffc400" />
			</>
		),
		en: (
			<>
				<rect width="20" height="14" fill="#012169" />
				<path d="M0 0l20 14M20 0L0 14" stroke="#fff" strokeWidth="2.8" />
				<path d="M0 0l20 14M20 0L0 14" stroke="#c8102e" strokeWidth="1.4" />
				<path d="M10 0v14M0 7h20" stroke="#fff" strokeWidth="4.6" />
				<path d="M10 0v14M0 7h20" stroke="#c8102e" strokeWidth="2.8" />
			</>
		),
		fr: (
			<>
				<rect width="20" height="14" fill="#fff" />
				<rect width="6.67" height="14" fill="#002395" />
				<rect x="13.33" width="6.67" height="14" fill="#ed2939" />
			</>
		),
	};
	return (
		<svg
			viewBox="0 0 20 14"
			className={`rounded-sm ring-1 ring-black/10 ${className}`}
			aria-hidden="true"
		>
			{flags[locale]}
		</svg>
	);
};

const languageConfigs: Record<Locale, { label: string }> = {
	es: { label: "Español" },
	en: { label: "English" },
	fr: { label: "Français" },
};

export const LanguageSelector = () => {
	const { locale } = useTranslation();
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const changeLanguage = (newLocale: Locale) => {
		if (newLocale === locale) {
			setIsOpen(false);
			return;
		}

		// Set the cookie (valid for 1 year)
		if (typeof window !== "undefined") {
			window.document.cookie = `${COOKIE_NAME}=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
		}

		// Force a router refresh to re-fetch Server Components with the new cookie
		router.refresh();
		setIsOpen(false);
	};

	const currentLocale = (languageConfigs[locale as Locale] ? locale : "es") as Locale;

	return (
		<div className="relative" ref={dropdownRef}>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center gap-1.5 px-2 py-1.5 rounded-full text-nordic-dark hover:bg-nordic-dark/5 dark:text-gray-300 dark:hover:bg-white/10 transition-colors"
				aria-label="Select Language"
			>
				<Flag locale={currentLocale} className="w-5 h-3.5" />
				<span className="text-sm font-medium uppercase hidden sm:block">
					{locale}
				</span>
				<ChevronDown
					className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
				/>
			</button>

			{isOpen && (
				<div className="absolute right-0 mt-2 w-40 bg-white dark:bg-[#1a1f2e] border border-gray-100 dark:border-white/10 rounded-xl shadow-lg ring-1 ring-black/5 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
					<div className="py-1">
						{locales.map((l) => (
							<button
								key={l}
								onClick={() => changeLanguage(l)}
								className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
									locale === l
										? "bg-mosque/10 text-mosque dark:bg-mosque/20 font-medium"
										: "text-nordic-dark dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
								}`}
							>
								<Flag locale={l} className="w-5 h-3.5" />
								<span>{languageConfigs[l].label}</span>
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
};
