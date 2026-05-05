import { UserProfile } from "@clerk/react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const settingsAppearance = {
  variables: {
    colorPrimary: "#f97316",
    colorForeground: "#ffffff",
    colorMutedForeground: "#a3a3a3",
    colorDanger: "#ef4444",
    colorBackground: "#0d0d0d",
    colorInput: "#1a1a1a",
    colorInputForeground: "#ffffff",
    colorNeutral: "#404040",
    fontFamily: "system-ui, -apple-system, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full max-w-[820px] mx-auto rounded-2xl overflow-hidden border border-white/10",
    card: "!shadow-none !border-0 !bg-[#111111] !rounded-none min-h-[520px]",
    navbar: "!bg-[#0d0d0d] border-r border-white/8",
    navbarButton: "text-white/60 hover:text-white hover:bg-white/8 rounded-lg",
    navbarButtonActive: "!text-orange-400 !bg-orange-500/10",
    pageScrollBox: "!bg-[#111111]",
    profilePage: "!bg-[#111111]",
    profileSectionTitle: "text-white font-semibold border-b border-white/8 pb-3",
    profileSectionTitleText: "text-white",
    profileSectionPrimaryButton: "bg-orange-500 hover:bg-orange-600 text-white font-semibold",
    formButtonPrimary: "bg-orange-500 hover:bg-orange-600 text-white font-semibold",
    formButtonReset: "border border-white/20 text-white/70 hover:bg-white/8",
    formFieldLabel: "text-white/80",
    formFieldInput: "bg-[#1a1a1a] border border-white/20 text-white",
    formFieldSuccessText: "text-green-400",
    alertText: "text-white",
    alert: "border border-white/10 bg-white/5",
    avatarBox: "ring-2 ring-orange-500/30",
    avatarImageActionsUpload: "text-orange-400 hover:text-orange-300",
    avatarImageActionsRemove: "text-red-400 hover:text-red-300",
    badge: "bg-orange-500/15 text-orange-400 border-orange-500/20",
    accordionTriggerButton: "text-white/80 hover:text-white",
    menuList: "bg-[#1a1a1a] border border-white/10 shadow-xl",
    menuItem: "text-white/80 hover:bg-white/8 hover:text-white",
    menuItemButton: "text-white/80 hover:bg-white/8 hover:text-white",
    menuItemDestructive: "text-red-400 hover:bg-red-500/10",
    headerTitle: "text-white font-bold",
    headerSubtitle: "text-white/60",
    identityPreviewEditButton: "text-orange-400",
    breadcrumbsItems: "text-white/40",
    breadcrumbsItemDivider: "text-white/20",
    breadcrumbsItem__currentPage: "text-white",
    dividerLine: "bg-white/10",
    dividerText: "text-white/40",
  },
};

export default function SettingsPage() {
  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-[#0d0d0d] text-white">
      {/* Minimal header */}
      <header className="sticky top-0 z-10 bg-black border-b border-white/8 backdrop-blur-md">
        <div className="max-w-screen-lg mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/app/swipe">
            <button className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-white/8">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </Link>
          <span className="font-black text-xl tracking-widest text-orange-500 border-2 border-orange-500 rounded-md px-3 py-0.5 leading-none">
            PUG
          </span>
          <span className="text-white/30 font-medium">/ Settings</span>
        </div>
      </header>

      {/* Profile management */}
      <main className="flex-1 w-full max-w-screen-lg mx-auto p-6">
        <UserProfile
          routing="path"
          path={`${basePath}/app/settings`}
          appearance={settingsAppearance}
        />
      </main>
    </div>
  );
}
