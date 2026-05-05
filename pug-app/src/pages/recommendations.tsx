import { useState, useEffect } from "react";
import {
  useCreateEntry,
  EntryMediaType,
  EntryStatus,
  getListEntriesQueryKey,
  getGetStatsSummaryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Film, Tv, Star, Clock, Check, RefreshCw, Wifi } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecommendedItem {
  id: string;
  title: string;
  year?: string;
  description?: string;
  posterUrl?: string;
  genres: string[];
  rating?: number;
  platform?: string;
  mediaType: EntryMediaType;
}

// ─── TVMaze popular shows ─────────────────────────────────────────────────────

interface TVMazeShow {
  id: number;
  name: string;
  genres: string[];
  status: string;
  premiered?: string;
  rating: { average: number | null };
  network?: { name: string } | null;
  webChannel?: { name: string } | null;
  image?: { medium?: string; original?: string } | null;
  summary?: string;
}

function stripHtml(html?: string): string {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, "").slice(0, 180) + (html.length > 180 ? "…" : "");
}

async function fetchTVRecommendations(): Promise<RecommendedItem[]> {
  const pages = [0, 1];
  const results = await Promise.all(
    pages.map(p => fetch(`https://api.tvmaze.com/shows?page=${p}`).then(r => r.ok ? r.json() : []).catch(() => []))
  );
  const shows: TVMazeShow[] = (results.flat() as TVMazeShow[])
    .filter(s => s.rating?.average && s.rating.average >= 7.5 && s.genres?.length)
    .sort((a, b) => (b.rating.average ?? 0) - (a.rating.average ?? 0))
    .slice(0, 30);

  return shows.map(s => ({
    id: `tv-${s.id}`,
    title: s.name,
    year: s.premiered ? s.premiered.slice(0, 4) : undefined,
    description: stripHtml(s.summary),
    posterUrl: s.image?.medium || s.image?.original,
    genres: s.genres.slice(0, 3),
    rating: s.rating.average ?? undefined,
    platform: s.webChannel?.name || s.network?.name,
    mediaType: EntryMediaType.tv,
  }));
}

// ─── Movie recommendations (Wikipedia-enriched curated list) ──────────────────

const MOVIE_SEEDS: Array<{ title: string; wikiPage: string; genres: string[]; year: string }> = [
  { title: "Oppenheimer", wikiPage: "Oppenheimer (film)", genres: ["Drama", "History"], year: "2023" },
  { title: "Poor Things", wikiPage: "Poor Things (film)", genres: ["Comedy", "Drama"], year: "2023" },
  { title: "Past Lives", wikiPage: "Past Lives (film)", genres: ["Drama", "Romance"], year: "2023" },
  { title: "The Zone of Interest", wikiPage: "The Zone of Interest (film)", genres: ["Drama", "War"], year: "2023" },
  { title: "Killers of the Flower Moon", wikiPage: "Killers of the Flower Moon (film)", genres: ["Crime", "Drama"], year: "2023" },
  { title: "Anatomy of a Fall", wikiPage: "Anatomy of a Fall", genres: ["Drama", "Mystery"], year: "2023" },
  { title: "The Holdovers", wikiPage: "The Holdovers", genres: ["Comedy", "Drama"], year: "2023" },
  { title: "All of Us Strangers", wikiPage: "All of Us Strangers", genres: ["Drama", "Romance"], year: "2023" },
  { title: "Saltburn", wikiPage: "Saltburn (film)", genres: ["Drama", "Thriller"], year: "2023" },
  { title: "Society of the Snow", wikiPage: "Society of the Snow (film)", genres: ["Drama", "Survival"], year: "2023" },
  { title: "Dune: Part Two", wikiPage: "Dune: Part Two", genres: ["Sci-Fi", "Adventure"], year: "2024" },
  { title: "Conclave", wikiPage: "Conclave (film)", genres: ["Drama", "Thriller"], year: "2024" },
  { title: "The Substance", wikiPage: "The Substance", genres: ["Horror", "Sci-Fi"], year: "2024" },
  { title: "Anora", wikiPage: "Anora (film)", genres: ["Comedy", "Drama"], year: "2024" },
  { title: "A Real Pain", wikiPage: "A Real Pain", genres: ["Comedy", "Drama"], year: "2024" },
  { title: "September 5", wikiPage: "September 5 (film)", genres: ["Drama", "History"], year: "2024" },
  { title: "Alien: Romulus", wikiPage: "Alien: Romulus", genres: ["Sci-Fi", "Horror"], year: "2024" },
  { title: "Longlegs", wikiPage: "Longlegs (film)", genres: ["Horror", "Thriller"], year: "2024" },
  { title: "Nosferatu", wikiPage: "Nosferatu (2024 film)", genres: ["Horror", "Gothic"], year: "2024" },
  { title: "Emilia Pérez", wikiPage: "Emilia Pérez", genres: ["Crime", "Musical"], year: "2024" },
  { title: "Inside Out 2", wikiPage: "Inside Out 2", genres: ["Animation", "Family"], year: "2024" },
  { title: "Deadpool & Wolverine", wikiPage: "Deadpool & Wolverine", genres: ["Action", "Comedy"], year: "2024" },
  { title: "Gladiator II", wikiPage: "Gladiator II", genres: ["Action", "Drama"], year: "2024" },
  { title: "Wicked", wikiPage: "Wicked (film)", genres: ["Musical", "Fantasy"], year: "2024" },
  { title: "A Complete Unknown", wikiPage: "A Complete Unknown", genres: ["Drama", "Music"], year: "2024" },
];

interface WikiSummaryResponse { thumbnail?: { source: string }; extract?: string }

async function fetchMovieRecommendations(): Promise<RecommendedItem[]> {
  const BATCH = 8;
  const items: RecommendedItem[] = [];
  for (let i = 0; i < MOVIE_SEEDS.length; i += BATCH) {
    const batch = MOVIE_SEEDS.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(seed =>
        fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(seed.wikiPage)}`)
          .then(r => r.ok ? r.json() as Promise<WikiSummaryResponse> : null)
          .catch(() => null)
      )
    );
    results.forEach((data, j) => {
      const seed = batch[j];
      items.push({
        id: `movie-${seed.wikiPage}`,
        title: seed.title,
        year: seed.year,
        description: data?.extract ? data.extract.slice(0, 180) + "…" : undefined,
        posterUrl: data?.thumbnail?.source,
        genres: seed.genres,
        rating: undefined,
        platform: undefined,
        mediaType: EntryMediaType.movie,
      });
    });
  }
  return items;
}

// ─── Recommendation card ──────────────────────────────────────────────────────

function RecCard({ item, onAdd }: { item: RecommendedItem; onAdd: (status: EntryStatus) => void }) {
  const [added, setAdded] = useState<EntryStatus | null>(null);

  return (
    <div className="flex flex-col bg-[#111] border border-white/7 rounded-2xl overflow-hidden hover:border-white/12 transition-colors group" data-testid="rec-card">
      {/* Poster */}
      <div className="relative w-full bg-[#0a0a0a] flex-shrink-0" style={{ height: 200 }}>
        {item.posterUrl ? (
          <img
            src={item.posterUrl}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {item.mediaType === EntryMediaType.movie
              ? <Film className="w-12 h-12 text-white/10" />
              : <Tv className="w-12 h-12 text-white/10" />}
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#111] to-transparent" />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-white text-base leading-snug line-clamp-2">{item.title}</h3>
          {item.rating && (
            <span className="flex items-center gap-1 text-xs text-orange-400 font-semibold flex-shrink-0">
              <Star className="w-3 h-3 fill-orange-400" /> {item.rating.toFixed(1)}
            </span>
          )}
        </div>

        {item.year && <p className="text-xs text-white/35 mb-2">{item.year}</p>}

        {/* Genres */}
        <div className="flex flex-wrap gap-1 mb-2">
          {item.genres.map(g => (
            <span key={g} className="text-[10px] px-2 py-0.5 rounded-full bg-white/6 text-white/45 border border-white/8">{g}</span>
          ))}
        </div>

        {/* Platform */}
        {item.platform && (
          <div className="flex items-center gap-1 mb-2">
            <Wifi className="w-3 h-3 text-purple-400" />
            <span className="text-xs text-purple-300 font-medium">{item.platform}</span>
          </div>
        )}
        {item.mediaType === EntryMediaType.movie && (
          <div className="flex items-center gap-1 mb-2">
            <a
              href={`https://www.justwatch.com/us/search?q=${encodeURIComponent(item.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-orange-400/70 hover:text-orange-400 underline underline-offset-2"
            >
              Find streaming →
            </a>
          </div>
        )}

        {/* Description */}
        {item.description && (
          <p className="text-xs text-white/35 leading-relaxed line-clamp-3 mb-3 flex-1">{item.description}</p>
        )}

        {/* Actions */}
        {added ? (
          <div className={`text-xs font-semibold text-center py-2 rounded-lg ${added === EntryStatus.watched ? "bg-emerald-500/15 text-emerald-400" : "bg-orange-500/15 text-orange-400"}`}>
            {added === EntryStatus.watched ? "✓ Marked as Watched" : "✓ Added to Watchlist"}
          </div>
        ) : (
          <div className="flex gap-2 mt-auto">
            <Button
              size="sm"
              className="flex-1 text-xs bg-orange-500 hover:bg-orange-400 text-black font-semibold h-8"
              onClick={() => { setAdded(EntryStatus.want_to_watch); onAdd(EntryStatus.want_to_watch); }}
            >
              <Clock className="w-3 h-3 mr-1" /> Watchlist
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs border-white/10 text-white/70 hover:bg-white/8 hover:text-white h-8"
              onClick={() => { setAdded(EntryStatus.watched); onAdd(EntryStatus.watched); }}
            >
              <Check className="w-3 h-3 mr-1" /> Watched
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RecommendationsPage() {
  const [activeTab, setActiveTab] = useState<"movies" | "tv">("movies");
  const [movies, setMovies] = useState<RecommendedItem[]>([]);
  const [tvShows, setTvShows] = useState<RecommendedItem[]>([]);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [loadingTv, setLoadingTv] = useState(true);

  const createEntry = useCreateEntry();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    fetchMovieRecommendations()
      .then(setMovies)
      .finally(() => setLoadingMovies(false));
    fetchTVRecommendations()
      .then(setTvShows)
      .finally(() => setLoadingTv(false));
  }, []);

  const handleAdd = (item: RecommendedItem, status: EntryStatus) => {
    createEntry.mutate(
      { data: { title: item.title, mediaType: item.mediaType, status } },
      {
        onSuccess: () => {
          const label = status === EntryStatus.watched ? "Watched" : "Watchlist";
          toast({ title: `Added to ${label}`, description: `"${item.title}" has been logged.` });
          queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
        },
        onError: (err) => {
          toast({ title: "Already logged", description: (err.data as { error?: string })?.error || "This title is already in your log.", variant: "destructive" });
        },
      }
    );
  };

  const currentItems = activeTab === "movies" ? movies : tvShows;
  const isLoading = activeTab === "movies" ? loadingMovies : loadingTv;

  return (
    <div className="w-full py-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white mb-1">For You</h1>
        <p className="text-sm text-white/40">Curated picks to add to your watchlist or log right away.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("movies")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            activeTab === "movies" ? "bg-orange-500 text-black" : "bg-white/8 text-white/60 hover:bg-white/12 hover:text-white"
          }`}
          data-testid="tab-movies"
        >
          <Film className="w-4 h-4" /> Movies
        </button>
        <button
          onClick={() => setActiveTab("tv")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            activeTab === "tv" ? "bg-orange-500 text-black" : "bg-white/8 text-white/60 hover:bg-white/12 hover:text-white"
          }`}
          data-testid="tab-tv"
        >
          <Tv className="w-4 h-4" /> TV Shows
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-[#111] border border-white/7 overflow-hidden">
              <Skeleton className="h-48 w-full bg-white/5" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4 bg-white/5" />
                <Skeleton className="h-3 w-1/2 bg-white/5" />
                <Skeleton className="h-8 w-full bg-white/5 mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : currentItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <RefreshCw className="w-10 h-10 text-white/20 mb-4" />
          <p className="text-white/50">Couldn't load recommendations. Check your connection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {currentItems.map(item => (
            <RecCard key={item.id} item={item} onAdd={(status) => handleAdd(item, status)} />
          ))}
        </div>
      )}
    </div>
  );
}
