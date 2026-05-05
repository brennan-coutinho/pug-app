import { Link, useLocation } from "wouter";
import { Clock, Check, Sparkles, LogOut, Settings } from "lucide-react";
import { useGetStatsSummary, getGetStatsSummaryQueryKey } from "@workspace/api-client-react";
import { useUser, useClerk } from "@clerk/react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();

  const isMovies = location.includes("/movies");
  const isTv = location.includes("/tv");
  const isRecs = location.includes("/recommendations");

  const { data: stats } = useGetStatsSummary({
    query: { enabled: true, queryKey: getGetStatsSummaryQueryKey() }
  });

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <div className="min-h-[100dvh] w-full flex flex-col font-sans bg-[#0d0d0d] text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black border-b border-white/8 backdrop-blur-md">
        <div className="max-w-screen-md mx-auto px-4 h-16 grid items-center" style={{ gridTemplateColumns: "1fr auto 1fr" }}>
          {/* Left nav */}
          <nav className="flex items-center gap-1 flex-wrap">
            <Link
              href="/app/movies/watched"
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isMovies ? "bg-orange-500/20 text-orange-400" : "text-white/50 hover:text-white hover:bg-white/8"}`}
              data-testid="nav-movies"
            >
              Movies {stats && <span className="ml-1 text-xs opacity-70">({stats.totalMovies})</span>}
            </Link>
            <Link
              href="/app/tv/watched"
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isTv ? "bg-orange-500/20 text-orange-400" : "text-white/50 hover:text-white hover:bg-white/8"}`}
              data-testid="nav-tv"
            >
              TV {stats && <span className="ml-1 text-xs opacity-70">({stats.totalTv})</span>}
            </Link>
            <Link
              href="/app/recommendations"
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${isRecs ? "bg-orange-500/20 text-orange-400" : "text-white/50 hover:text-white hover:bg-white/8"}`}
              data-testid="nav-recs"
            >
              <Sparkles className="w-3 h-3" /> For You
            </Link>
          </nav>

          {/* Center: PUG logo */}
          <Link
            href="/app/swipe"
            className="font-black text-xl tracking-widest text-orange-500 hover:text-orange-400 transition-colors text-center border-2 border-orange-500 hover:border-orange-400 rounded-md px-3 py-0.5 leading-none"
            data-testid="logo"
          >
            PUG
          </Link>

          {/* Right: user avatar + actions */}
          <div className="flex items-center justify-end gap-1">
            {user && (
              <>
                <Link href="/app/settings">
                  <button
                    className="group relative p-0.5 rounded-full hover:ring-2 hover:ring-orange-500/50 transition-all"
                    title="Settings"
                    data-testid="settings-btn"
                  >
                    {user.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={user.firstName || "User"}
                        className="w-7 h-7 rounded-full object-cover border border-white/20"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-orange-500/30 border border-orange-500/50 flex items-center justify-center text-orange-400 text-xs font-bold">
                        {(user.firstName?.[0] || user.emailAddresses?.[0]?.emailAddress?.[0] || "U").toUpperCase()}
                      </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#0d0d0d] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Settings className="w-2.5 h-2.5 text-orange-400" />
                    </span>
                  </button>
                </Link>
                <button
                  onClick={() => signOut({ redirectUrl: basePath || "/" })}
                  className="p-1.5 rounded-full text-white/40 hover:text-white/80 hover:bg-white/8 transition-colors"
                  title="Sign out"
                  data-testid="sign-out-btn"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Sub-nav for list pages */}
        {(isMovies || isTv) && (
          <div className="max-w-screen-md mx-auto px-4 h-11 flex items-center border-t border-white/6">
            <div className="flex space-x-6 text-sm font-medium">
              <Link
                href={isMovies ? "/app/movies/watched" : "/app/tv/watched"}
                className={`flex items-center gap-1.5 py-2.5 border-b-2 transition-colors ${location.endsWith("/watched") ? "border-orange-500 text-orange-400" : "border-transparent text-white/40 hover:text-white/70"}`}
              >
                <Check className="w-3.5 h-3.5" /> Watched
                {stats && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/10 text-white/60">
                    {isMovies ? stats.watchedMovies : stats.watchedTv}
                  </span>
                )}
              </Link>
              <Link
                href={isMovies ? "/app/movies/want-to-watch" : "/app/tv/want-to-watch"}
                className={`flex items-center gap-1.5 py-2.5 border-b-2 transition-colors ${location.endsWith("/want-to-watch") ? "border-orange-500 text-orange-400" : "border-transparent text-white/40 hover:text-white/70"}`}
              >
                <Clock className="w-3.5 h-3.5" /> Want to Watch
                {stats && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/10 text-white/60">
                    {isMovies ? stats.wantToWatchMovies : stats.wantToWatchTv}
                  </span>
                )}
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-screen-md w-full mx-auto p-4 flex flex-col">
        {children}
      </main>
    </div>
  );
}
