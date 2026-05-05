import { useEffect, useRef } from "react";
import { Switch, Route, Redirect, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { dark } from "@clerk/themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EntryMediaType, EntryStatus } from "@workspace/api-client-react";

import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import SwipePage from "@/pages/swipe";
import ListPage from "@/pages/list";
import RecommendationsPage from "@/pages/recommendations";
import SettingsPage from "@/pages/settings";
import { Layout } from "@/components/layout";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  baseTheme: dark,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
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
    rootBox: "w-full flex justify-center",
    cardBox: "rounded-2xl w-[440px] max-w-full overflow-hidden border border-white/10",
    card: "!shadow-none !border-0 !bg-[#0d0d0d] !rounded-none",
    footer: "!shadow-none !border-0 !bg-[#111111] !rounded-none",
    headerTitle: "text-white font-bold",
    headerSubtitle: "text-white/60",
    socialButtonsBlockButtonText: "text-white",
    formFieldLabel: "text-white/80",
    footerActionLink: "text-orange-400 hover:text-orange-300",
    footerActionText: "text-white/50",
    dividerText: "text-white/40",
    identityPreviewEditButton: "text-orange-400",
    formFieldSuccessText: "text-green-400",
    alertText: "text-white",
    logoBox: "flex items-center justify-center py-2",
    logoImage: "h-10 w-auto",
    socialButtonsBlockButton: "border border-white/20 bg-white/5 hover:bg-white/10",
    formButtonPrimary: "bg-orange-500 hover:bg-orange-600 text-white font-semibold",
    formFieldInput: "bg-[#1a1a1a] border border-white/20 text-white",
    footerAction: "bg-[#111111]",
    dividerLine: "bg-white/10",
    alert: "border border-white/10 bg-white/5",
    otpCodeFieldInput: "bg-[#1a1a1a] border border-white/20 text-white",
    formFieldRow: "",
    main: "",
  },
};

const queryClient = new QueryClient();

// Invalidates React Query cache when the signed-in user changes
function ClerkCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsub = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserId.current !== undefined && prevUserId.current !== userId) {
        qc.clear();
      }
      prevUserId.current = userId;
    });
    return unsub;
  }, [addListener, qc]);

  return null;
}

// Home: show landing for guests, redirect to app for signed-in users
function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/app/swipe" />
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

// Wrap a protected route — redirect to sign-in if not authenticated
function Protected({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function SignInPage() {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-[#0d0d0d] px-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={`${basePath}/app/swipe`}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-[#0d0d0d] px-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        fallbackRedirectUrl={`${basePath}/app/swipe`}
      />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />

      <Route path="/app/swipe">
        <Protected><Layout><SwipePage /></Layout></Protected>
      </Route>

      <Route path="/app/recommendations">
        <Protected><Layout><RecommendationsPage /></Layout></Protected>
      </Route>

      <Route path="/app/movies/watched">
        <Protected><Layout><ListPage mediaType={EntryMediaType.movie} status={EntryStatus.watched} /></Layout></Protected>
      </Route>

      <Route path="/app/movies/want-to-watch">
        <Protected><Layout><ListPage mediaType={EntryMediaType.movie} status={EntryStatus.want_to_watch} /></Layout></Protected>
      </Route>

      <Route path="/app/tv/watched">
        <Protected><Layout><ListPage mediaType={EntryMediaType.tv} status={EntryStatus.watched} /></Layout></Protected>
      </Route>

      <Route path="/app/tv/want-to-watch">
        <Protected><Layout><ListPage mediaType={EntryMediaType.tv} status={EntryStatus.want_to_watch} /></Layout></Protected>
      </Route>

      <Route path="/app/settings/*?">
        <Protected><SettingsPage /></Protected>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      signInFallbackRedirectUrl={`${basePath}/app/swipe`}
      signUpFallbackRedirectUrl={`${basePath}/app/swipe`}
      afterSignOutUrl={basePath || "/"}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to your PUG account",
            actionText: "Don't have an account?",
            actionLink: "Sign up",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Start your personal viewing log",
            actionText: "Already have an account?",
            actionLink: "Sign in",
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkCacheInvalidator />
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
