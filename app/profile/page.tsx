import { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { DbProperty, toProperty } from "@/lib/types";
import { COOKIE_NAME, Locale, defaultLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { ProfileView, ProfileTab } from "./_components/ProfileView";

export const metadata: Metadata = {
  title: "My Profile | LuxuEstate",
  description: "Manage your saved homes, scheduled visits and account preferences.",
};

const VALID_TABS: ProfileTab[] = ["saved", "visits", "settings"];

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function ProfilePage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Profile is private — bounce anonymous visitors to the login screen.
  if (!user) redirect("/login");

  // Pull the user's saved listings (RLS scopes this to the current user).
  const { data: savedRows } = await supabase
    .from("saved_properties")
    .select("created_at, properties(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const savedProperties = (savedRows ?? [])
    .map((row) => row.properties as unknown as DbProperty | null)
    .filter((row): row is DbProperty => Boolean(row))
    .map(toProperty);

  const cookieStore = await cookies();
  const locale = (cookieStore.get(COOKIE_NAME)?.value as Locale) || defaultLocale;
  const dict = await getDictionary(locale);

  const params = await searchParams;
  const initialTab: ProfileTab = VALID_TABS.includes(params.tab as ProfileTab)
    ? (params.tab as ProfileTab)
    : "saved";

  const profile = {
    name:
      (user.user_metadata?.full_name as string) ||
      user.email?.split("@")[0] ||
      "User",
    email: user.email ?? "",
    avatarUrl: (user.user_metadata?.avatar_url as string) ?? null,
    memberSince: user.created_at ? new Date(user.created_at).getFullYear() : null,
  };

  return (
    <ProfileView
      profile={profile}
      savedProperties={savedProperties}
      dict={dict.profile}
      initialTab={initialTab}
    />
  );
}
