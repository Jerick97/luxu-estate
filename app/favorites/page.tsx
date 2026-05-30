import { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { DbProperty, toProperty } from "@/lib/types";
import { COOKIE_NAME, Locale, defaultLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { FavoritesView, FavoriteItem } from "./_components/FavoritesView";

export const metadata: Metadata = {
  title: "Your Favorites | LuxuEstate",
  description: "The homes you've saved, all in one place.",
};

export default async function FavoritesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Favorites are tied to an account — send anonymous visitors to log in.
  if (!user) redirect("/login");

  // RLS scopes saved_properties to the current user. Embed the related
  // property row and keep the saved date so we can sort by "Date Added".
  const { data: savedRows } = await supabase
    .from("saved_properties")
    .select("created_at, properties(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const items: FavoriteItem[] = (savedRows ?? [])
    .filter((row) => Boolean(row.properties))
    .map((row) => ({
      ...toProperty(row.properties as unknown as DbProperty),
      savedAt: row.created_at as string,
    }));

  const cookieStore = await cookies();
  const locale = (cookieStore.get(COOKIE_NAME)?.value as Locale) || defaultLocale;
  const dict = await getDictionary(locale);

  return <FavoritesView items={items} dict={dict.favorites} />;
}
