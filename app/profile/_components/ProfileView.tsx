"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Camera, Heart, MapPin, Calendar, Mail, ArrowRight, User } from "lucide-react";

import { Property } from "@/lib/types";
import { PropertyCard } from "@/components/properties/PropertyCard";

export type ProfileTab = "saved" | "visits" | "settings";

interface ProfileInfo {
  name: string;
  email: string;
  avatarUrl: string | null;
  memberSince: number | null;
}

interface ProfileDict {
  memberSince: string;
  stats: { saved: string; visits: string; sold: string };
  tabs: { saved: string; visits: string; settings: string };
  savedEmptyTitle: string;
  savedEmptySubtitle: string;
  browseProperties: string;
  upcomingVisits: string;
  visitsEmptyTitle: string;
  visitsEmptySubtitle: string;
  agent: string;
  reschedule: string;
  getDirections: string;
  accountPreferences: string;
  accountPreferencesSubtitle: string;
  viewAllSettings: string;
  emailAddress: string;
  change: string;
  notifications: string;
  newPropertyAlerts: string;
}

interface Props {
  profile: ProfileInfo;
  savedProperties: Property[];
  dict: ProfileDict;
  initialTab: ProfileTab;
}

export function ProfileView({ profile, savedProperties, dict, initialTab }: Props) {
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: "saved", label: dict.tabs.saved },
    { id: "visits", label: dict.tabs.visits },
    { id: "settings", label: dict.tabs.settings },
  ];

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Header card */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-12 bg-hint-of-green p-6 sm:p-8 rounded-3xl shadow-soft border border-nordic-dark/5">
        <div className="flex items-center gap-5 sm:gap-6">
          <div className="relative shrink-0">
            <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-[#EAC9B6] flex items-center justify-center">
              {profile.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt={profile.name}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="w-10 h-10 lg:w-14 lg:h-14 text-[#A67E67]" strokeWidth={2} />
              )}
            </div>
            <span className="absolute bottom-1 right-1 w-8 h-8 lg:w-10 lg:h-10 bg-mosque text-white rounded-full flex items-center justify-center shadow-md border-2 border-white">
              <Camera className="w-4 h-4 lg:w-5 lg:h-5" strokeWidth={2} />
            </span>
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-nordic-dark mb-1.5 truncate">
              {profile.name}
            </h1>
            <p className="text-nordic-dark/70 font-light flex flex-wrap items-center gap-x-2 gap-y-1 text-sm sm:text-base">
              <MapPin className="w-4 h-4 text-mosque" strokeWidth={2} />
              <span className="truncate max-w-[16rem]">{profile.email}</span>
              {profile.memberSince && (
                <>
                  <span className="text-nordic-dark/30">•</span>
                  <span>
                    {dict.memberSince} {profile.memberSince}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-6 lg:gap-10 bg-white px-6 sm:px-8 py-4 rounded-2xl shadow-sm border border-nordic-dark/5 w-full md:w-auto justify-around md:justify-start">
          <Stat value={savedProperties.length} label={dict.stats.saved} />
          <div className="w-px bg-nordic-dark/10" />
          <Stat value={0} label={dict.stats.visits} accent />
          <div className="w-px bg-nordic-dark/10" />
          <Stat value={0} label={dict.stats.sold} />
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-6 sm:gap-8 border-b border-nordic-dark/10 mb-10 overflow-x-auto hide-scroll">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-1 whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? "text-nordic-dark font-semibold border-mosque"
                  : "text-nordic-dark/50 hover:text-nordic-dark font-medium border-transparent hover:border-nordic-dark/20"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "saved" && (
        <SavedTab savedProperties={savedProperties} dict={dict} />
      )}
      {activeTab === "visits" && <VisitsTab dict={dict} />}
      {activeTab === "settings" && <SettingsTab email={profile.email} dict={dict} />}
    </main>
  );
}

function Stat({
  value,
  label,
  accent = false,
}: {
  value: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${accent ? "text-mosque" : "text-nordic-dark"}`}>
        {String(value).padStart(2, "0")}
      </div>
      <div className="text-xs uppercase tracking-wider text-nordic-dark/50 font-medium mt-0.5">
        {label}
      </div>
    </div>
  );
}

function SavedTab({
  savedProperties,
  dict,
}: {
  savedProperties: Property[];
  dict: ProfileDict;
}) {
  if (savedProperties.length === 0) {
    return (
      <EmptyState
        icon={<Heart className="w-7 h-7 text-mosque" strokeWidth={1.5} />}
        title={dict.savedEmptyTitle}
        subtitle={dict.savedEmptySubtitle}
        action={
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-mosque text-white hover:bg-nordic-dark transition-colors text-sm font-medium shadow-sm"
          >
            {dict.browseProperties}
            <ArrowRight className="w-4 h-4" strokeWidth={2} />
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
      {savedProperties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}

function VisitsTab({ dict }: { dict: ProfileDict }) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-nordic-dark mb-8 flex items-center gap-3">
        <span className="w-2 h-8 bg-mosque rounded-full" />
        {dict.upcomingVisits}
      </h2>
      <EmptyState
        icon={<Calendar className="w-7 h-7 text-mosque" strokeWidth={1.5} />}
        title={dict.visitsEmptyTitle}
        subtitle={dict.visitsEmptySubtitle}
        action={
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-mosque text-white hover:bg-nordic-dark transition-colors text-sm font-medium shadow-sm"
          >
            {dict.browseProperties}
            <ArrowRight className="w-4 h-4" strokeWidth={2} />
          </Link>
        }
      />
    </section>
  );
}

function SettingsTab({ email, dict }: { email: string; dict: ProfileDict }) {
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  return (
    <section className="bg-white rounded-2xl p-6 sm:p-8 border border-nordic-dark/5 shadow-soft">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-nordic-dark">{dict.accountPreferences}</h2>
          <p className="text-nordic-dark/50 text-sm mt-1">
            {dict.accountPreferencesSubtitle}
          </p>
        </div>
        <button className="text-mosque font-medium text-sm hover:underline self-start md:self-auto">
          {dict.viewAllSettings}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {/* Email */}
        <div>
          <label className="block text-xs font-bold text-nordic-dark/40 uppercase tracking-wider mb-2">
            {dict.emailAddress}
          </label>
          <div className="flex items-center gap-3 p-3 bg-background-light rounded-lg border border-nordic-dark/10 h-[50px]">
            <Mail className="w-5 h-5 text-nordic-dark/40 shrink-0" strokeWidth={1.5} />
            <span className="flex-1 text-nordic-dark text-sm truncate">{email}</span>
            <button className="text-xs text-mosque font-medium hover:underline shrink-0">
              {dict.change}
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div>
          <label className="block text-xs font-bold text-nordic-dark/40 uppercase tracking-wider mb-2">
            {dict.notifications}
          </label>
          <div className="flex items-center justify-between p-3 bg-background-light rounded-lg border border-nordic-dark/10 h-[50px]">
            <span className="text-sm text-nordic-dark">{dict.newPropertyAlerts}</span>
            <button
              type="button"
              role="switch"
              aria-checked={alertsEnabled}
              onClick={() => setAlertsEnabled((v) => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                alertsEnabled ? "bg-mosque" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  alertsEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-dashed border-nordic-dark/15 py-16 px-6">
      <div className="w-14 h-14 rounded-full bg-mosque/10 flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-nordic-dark mb-1">{title}</h3>
      <p className="text-nordic-dark/60 text-sm max-w-sm mb-6">{subtitle}</p>
      {action}
    </div>
  );
}
