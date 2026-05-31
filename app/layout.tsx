import type { Metadata } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import { Navbar } from "@/components/layout/Navbar";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { SavedPropertiesProvider } from "@/components/providers/SavedPropertiesProvider";
import { defaultLocale, Locale, COOKIE_NAME } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const sfPro = localFont({
  src: [
    {
      path: './fonts/SFProDisplay-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/SFProDisplay-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: './fonts/SFProDisplay-SemiboldItalic.woff2',
      weight: '600',
      style: 'italic',
    },
    {
      path: './fonts/SFProDisplay-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: './fonts/SFProDisplay-BlackItalic.woff2',
      weight: '900',
      style: 'italic',
    }
  ],
  variable: "--font-sf-pro",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LuxuEstate — Find your sanctuary",
    template: "%s | LuxuEstate",
  },
  description: "Discover premium properties for sale and rent. Find your sanctuary.",
  openGraph: {
    type: "website",
    siteName: "LuxuEstate",
    url: siteUrl,
    title: "LuxuEstate — Find your sanctuary",
    description: "Discover premium properties for sale and rent. Find your sanctuary.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LuxuEstate — Find your sanctuary",
    description: "Discover premium properties for sale and rent. Find your sanctuary.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies(); // In Next.js 15+ cookies() is async, though next 13/14 was sync. We await to be safe or assign. Actually `await cookies()` is Next 15 standard, `cookies()` is fine but returns Promise in latest config.
  const locale = (cookieStore.get(COOKIE_NAME)?.value as Locale) || defaultLocale;
  const dictionary = await getDictionary(locale);

  return (
    <html lang={locale} className={`${sfPro.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`min-h-full flex flex-col font-display bg-background-light text-nordic-dark`}>
        <I18nProvider locale={locale} dictionary={dictionary}>
          <SavedPropertiesProvider>
            <Navbar />
            {children}
          </SavedPropertiesProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
