import { useState, useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimation,
  AnimatePresence,
} from "framer-motion";
import {
  useCreateEntry,
  EntryMediaType,
  EntryStatus,
  getListEntriesQueryKey,
  getGetStatsSummaryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Film, Tv, Check, Clock, X, Search, Loader2 } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Suggestion {
  title: string;
  year?: string;
  thumbUrl?: string;
  posterUrls: string[];
}

// ─── Wikipedia search ─────────────────────────────────────────────────────────

function yearFromDescription(desc?: string): string | undefined {
  if (!desc) return undefined;
  const m = desc.match(/\b(19|20)\d{2}\b/);
  return m ? m[0] : undefined;
}

function cleanTitle(title: string): string {
  return title.replace(/\s*\(film\)$/i, "").replace(/\s*\(\d{4} film\)$/i, "").trim();
}

interface WikiSearchPage { title: string; description?: string }
interface WikiSummary { description?: string; thumbnail?: { source: string } }

async function fetchWikiSummary(pageTitle: string): Promise<WikiSummary | null> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`,
      { headers: { Accept: "application/json" } }
    );
    return res.ok ? await res.json() : null;
  } catch { return null; }
}

async function searchMovies(query: string): Promise<Suggestion[]> {
  if (!query.trim()) return [];
  const res = await fetch(
    `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(query + " film")}&limit=12`,
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) return [];
  const json = await res.json();
  const pages: WikiSearchPage[] = (json.pages || []).filter((p: WikiSearchPage) => {
    const d = (p.description || "").toLowerCase();
    return d.includes("film") || d.includes("movie") || d.includes("directed by");
  }).slice(0, 6);
  if (!pages.length) return [];
  const summaries = await Promise.all(pages.map((p) => fetchWikiSummary(p.title)));
  return summaries.map((s, i): Suggestion => {
    const thumb = s?.thumbnail?.source;
    return {
      title: cleanTitle(pages[i].title),
      year: yearFromDescription(s?.description || pages[i].description),
      thumbUrl: thumb,
      posterUrls: thumb ? [thumb] : [],
    };
  });
}

async function searchShows(query: string): Promise<Suggestion[]> {
  if (!query.trim()) return [];
  const res = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`);
  const json = await res.json();
  return (json || []).slice(0, 8).map((r: {
    show: { name: string; premiered?: string; image?: { medium?: string; original?: string } }
  }) => {
    const posterUrls: string[] = [];
    if (r.show.image?.original) posterUrls.push(r.show.image.original);
    if (r.show.image?.medium) posterUrls.push(r.show.image.medium);
    return {
      title: r.show.name,
      year: r.show.premiered ? r.show.premiered.slice(0, 4) : undefined,
      thumbUrl: r.show.image?.medium,
      posterUrls,
    };
  });
}

// ─── Poster image ─────────────────────────────────────────────────────────────

function PosterImage({ urls, alt, onAllFailed }: { urls: string[]; alt: string; onAllFailed: () => void }) {
  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [urls]);
  if (!urls.length || index >= urls.length) return null;
  return (
    <img
      key={urls[index]}
      src={urls[index]}
      alt={alt}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      className="w-full h-full object-cover pointer-events-none"
      data-testid="poster-image"
      onError={() => index + 1 < urls.length ? setIndex(index + 1) : onAllFailed()}
    />
  );
}

// ─── Swipe card ───────────────────────────────────────────────────────────────

const SWIPE_THRESHOLD = 100;

interface SwipeCardProps {
  title: string;
  year?: string;
  posterUrls: string[];
  posterFailed: boolean;
  onPosterFailed: () => void;
  mediaType: EntryMediaType;
  onSwipe: (status: EntryStatus) => void;
  disabled: boolean;
}

export interface SwipeCardHandle {
  triggerSwipe: (status: EntryStatus) => void;
}

const SwipeCard = forwardRef<SwipeCardHandle, SwipeCardProps>(function SwipeCard(
  { title, year, posterUrls, posterFailed, onPosterFailed, mediaType, onSwipe, disabled },
  ref
) {
  const controls = useAnimation();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-18, 18]);
  const watchedOpacity = useTransform(x, [30, 110], [0, 1]);
  const skipOpacity = useTransform(x, [-110, -30], [1, 0]);
  const listOpacity = useTransform(y, [-110, -30], [1, 0]);

  const flyOff = useCallback(async (toX: number, toY: number, toRotate: number, status: EntryStatus) => {
    await controls.start({
      x: toX,
      y: toY,
      rotate: toRotate,
      opacity: 0,
      transition: { duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] },
    });
    onSwipe(status);
  }, [controls, onSwipe]);

  useImperativeHandle(ref, () => ({
    triggerSwipe: (status: EntryStatus) => {
      if (status === EntryStatus.watched) flyOff(620, -80, 30, status);
      else if (status === EntryStatus.not_watched) flyOff(-620, -80, -30, status);
      else flyOff(0, -620, 0, status);
    },
  }), [flyOff]);

  function handleDragEnd(_: unknown, info: { offset: { x: number; y: number }; velocity: { x: number; y: number } }) {
    const { offset, velocity } = info;
    const swipeX = Math.abs(offset.x) > SWIPE_THRESHOLD || Math.abs(velocity.x) > 500;
    const swipeUp = offset.y < -SWIPE_THRESHOLD || velocity.y < -500;
    if (swipeX && offset.x > 0) { flyOff(620, -80, 30, EntryStatus.watched); return; }
    if (swipeX && offset.x < 0) { flyOff(-620, -80, -30, EntryStatus.not_watched); return; }
    if (swipeUp) { flyOff(0, -620, 0, EntryStatus.want_to_watch); return; }
  }

  const hasPoster = posterUrls.length > 0 && !posterFailed;

  return (
    <motion.div
      animate={controls}
      style={{ x, y, rotate, touchAction: "none" }}
      drag={!disabled}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.85}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 1.02 }}
      className="relative w-full rounded-2xl bg-[#1a1a1a] border border-white/10 overflow-hidden cursor-grab active:cursor-grabbing select-none shadow-2xl"
      data-testid="swipe-card"
    >
      <div className="relative w-full bg-[#111]" style={{ height: 380 }}>
        {hasPoster ? (
          <PosterImage urls={posterUrls} alt={title} onAllFailed={onPosterFailed} />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            {mediaType === EntryMediaType.movie
              ? <Film className="w-20 h-20 text-white/10" />
              : <Tv className="w-20 h-20 text-white/10" />}
          </div>
        )}

        {/* WATCHED overlay */}
        <motion.div style={{ opacity: watchedOpacity }} className="absolute inset-0 flex items-start justify-start p-5 pointer-events-none">
          <span className="border-4 border-emerald-400 text-emerald-400 font-black text-3xl uppercase tracking-widest px-3 py-1 rounded-lg rotate-[-15deg]">Watched!</span>
        </motion.div>

        {/* SKIP overlay */}
        <motion.div style={{ opacity: skipOpacity }} className="absolute inset-0 flex items-start justify-end p-5 pointer-events-none">
          <span className="border-4 border-red-400 text-red-400 font-black text-3xl uppercase tracking-widest px-3 py-1 rounded-lg rotate-[15deg]">Skip</span>
        </motion.div>

        {/* WATCHLIST overlay */}
        <motion.div style={{ opacity: listOpacity }} className="absolute inset-0 flex items-start justify-center pt-5 pointer-events-none">
          <span className="border-4 border-orange-400 text-orange-400 font-black text-2xl uppercase tracking-widest px-3 py-1 rounded-lg">Watchlist</span>
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pointer-events-none">
          <p className="font-bold text-white text-xl leading-tight drop-shadow" data-testid="selected-title">{title}</p>
          {year && <p className="text-sm text-white/60">{year}</p>}
        </div>
      </div>
    </motion.div>
  );
});

// ─── Action button ────────────────────────────────────────────────────────────

function ActionBtn({ onClick, disabled, color, icon, label, size = "md" }: {
  onClick: () => void; disabled: boolean; color: string; icon: React.ReactNode; label: string; size?: "sm" | "md" | "lg";
}) {
  const sz = size === "lg" ? "w-16 h-16" : size === "sm" ? "w-12 h-12" : "w-14 h-14";
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.12 }}
      whileTap={{ scale: disabled ? 1 : 0.92 }}
      onClick={onClick}
      disabled={disabled}
      className={`${sz} rounded-full flex items-center justify-center shadow-lg transition-opacity ${color} ${disabled ? "opacity-30" : ""}`}
      title={label}
    >
      {icon}
    </motion.button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SwipePage() {
  const [title, setTitle] = useState("");
  const [mediaType, setMediaType] = useState<EntryMediaType>(EntryMediaType.movie);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPosterUrls, setSelectedPosterUrls] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string | undefined>(undefined);
  const [posterFailed, setPosterFailed] = useState(false);
  const [cardKey, setCardKey] = useState(0);
  const [hasSelected, setHasSelected] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createEntry = useCreateEntry();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<SwipeCardHandle>(null);

  useEffect(() => {
    const q = title.trim();
    if (!q || hasSelected) {
      if (!q) { setSuggestions([]); setShowDropdown(false); }
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = mediaType === EntryMediaType.movie ? await searchMovies(q) : await searchShows(q);
        setSuggestions(results);
        setShowDropdown(results.length > 0);
      } catch {
        setSuggestions([]); setShowDropdown(false);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [title, mediaType, hasSelected]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) setShowDropdown(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectSuggestion = useCallback((s: Suggestion) => {
    setTitle(s.title);
    setSelectedYear(s.year);
    setSelectedPosterUrls(s.posterUrls);
    setPosterFailed(false);
    setHasSelected(true);
    setSuggestions([]);
    setShowDropdown(false);
    setCardKey((k) => k + 1);
  }, []);

  const clearSelection = useCallback(() => {
    setTitle("");
    setSelectedPosterUrls([]);
    setSelectedYear(undefined);
    setPosterFailed(false);
    setHasSelected(false);
    setSuggestions([]);
    setShowDropdown(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleAction = useCallback((status: EntryStatus) => {
    if (!title.trim()) return;
    const posterUrl = !posterFailed && selectedPosterUrls.length > 0 ? selectedPosterUrls[0] : undefined;
    createEntry.mutate(
      { data: { title: title.trim(), mediaType, status, posterUrl: posterUrl ?? null } },
      {
        onSuccess: () => {
          const label = status === EntryStatus.watched ? "Watched" : status === EntryStatus.want_to_watch ? "Want to Watch" : "Skipped";
          toast({ title: `Added to ${label}`, description: `"${title.trim()}" has been logged.` });
          clearSelection();
          queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
        },
        onError: (err) => {
          toast({ title: "Failed to add", description: (err.data as { error?: string })?.error || "Already in your log.", variant: "destructive" });
        },
      }
    );
  }, [title, mediaType, createEntry, toast, queryClient, clearSelection]);

  const hasSelection = hasSelected && !!title.trim();
  const isDisabled = createEntry.isPending;

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center pt-4 pb-8">
      {/* Media type toggle */}
      <div className="mb-4 flex justify-center">
        <ToggleGroup
          type="single"
          value={mediaType}
          onValueChange={(v) => { if (v) { setMediaType(v as EntryMediaType); clearSelection(); } }}
          className="bg-[#1a1a1a] border border-white/10 p-1 rounded-lg"
        >
          <ToggleGroupItem
            value={EntryMediaType.movie}
            className="px-4 py-2 data-[state=on]:bg-orange-500 data-[state=on]:text-black rounded-md text-sm font-medium text-white/60"
            data-testid="toggle-movie"
          >
            <Film className="w-4 h-4 mr-2 inline-block" /> Movies
          </ToggleGroupItem>
          <ToggleGroupItem
            value={EntryMediaType.tv}
            className="px-4 py-2 data-[state=on]:bg-orange-500 data-[state=on]:text-black rounded-md text-sm font-medium text-white/60"
            data-testid="toggle-tv"
          >
            <Tv className="w-4 h-4 mr-2 inline-block" /> TV Shows
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Search input */}
      <div className="w-full px-1 mb-4 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 animate-spin pointer-events-none" />
          )}
          {hasSelection && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80" onClick={clearSelection} data-testid="btn-clear">
              <X className="w-4 h-4" />
            </button>
          )}
          <Input
            ref={inputRef}
            value={title}
            onChange={(e) => {
              const val = e.target.value;
              setTitle(val);
              if (selectedPosterUrls.length) { setSelectedPosterUrls([]); setPosterFailed(false); }
              if (selectedYear) setSelectedYear(undefined);
            }}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            placeholder={mediaType === EntryMediaType.movie ? "Search for a movie..." : "Search for a TV show..."}
            className="pl-9 pr-9 text-sm bg-[#1a1a1a] border-white/10 text-white placeholder:text-white/30 focus-visible:ring-orange-500 rounded-xl"
            data-testid="input-title"
            autoComplete="off"
          />
        </div>

        {/* Suggestions dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute left-1 right-1 z-50 mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
            data-testid="suggestions-dropdown"
          >
            {suggestions.map((s, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/6 text-left transition-colors border-b border-white/6 last:border-0"
                onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s); }}
                data-testid={`suggestion-item-${i}`}
              >
                {s.thumbUrl ? (
                  <img src={s.thumbUrl} alt={s.title} className="w-9 h-12 object-cover rounded flex-shrink-0 bg-[#111]"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <div className="w-9 h-12 rounded bg-[#111] flex items-center justify-center flex-shrink-0">
                    {mediaType === EntryMediaType.movie ? <Film className="w-4 h-4 text-white/20" /> : <Tv className="w-4 h-4 text-white/20" />}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{s.title}</p>
                  {s.year && <p className="text-xs text-white/40">{s.year}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Swipe card */}
      <div className="w-full px-1 mb-6">
        <AnimatePresence mode="wait">
          {hasSelection ? (
            <motion.div
              key={cardKey}
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
            >
              <SwipeCard
                ref={cardRef}
                title={title}
                year={selectedYear}
                posterUrls={selectedPosterUrls}
                posterFailed={posterFailed}
                onPosterFailed={() => setPosterFailed(true)}
                mediaType={mediaType}
                onSwipe={handleAction}
                disabled={isDisabled}
              />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border-2 border-dashed border-white/8 bg-white/3 flex flex-col items-center justify-center text-center"
              style={{ height: 380 }}
            >
              {mediaType === EntryMediaType.movie
                ? <Film className="w-14 h-14 text-orange-500/30 mb-3" />
                : <Tv className="w-14 h-14 text-orange-500/30 mb-3" />}
              <p className="text-sm text-white/30">Search above and pick a title</p>
              <p className="text-xs text-white/20 mt-1">Then swipe or tap to log it</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Swipe hint */}
      {hasSelection && (
        <div className="flex items-center justify-center gap-4 mb-4">
          <span className="flex items-center gap-1 text-xs text-red-400/60 font-medium"><span className="text-base leading-none">←</span> Skip</span>
          <span className="text-white/15">·</span>
          <span className="flex items-center gap-1 text-xs text-orange-400/60 font-medium"><span className="text-base leading-none">↑</span> Watchlist</span>
          <span className="text-white/15">·</span>
          <span className="flex items-center gap-1 text-xs text-emerald-400/60 font-medium">Watched <span className="text-base leading-none">→</span></span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-6">
        <ActionBtn
          onClick={() => cardRef.current?.triggerSwipe(EntryStatus.not_watched)}
          disabled={isDisabled || !hasSelection}
          color="bg-[#1a1a1a] border-2 border-red-500/40 text-red-400 hover:bg-red-500/10"
          icon={<X className="w-7 h-7" />}
          label="Skip"
          size="lg"
        />
        <ActionBtn
          onClick={() => cardRef.current?.triggerSwipe(EntryStatus.want_to_watch)}
          disabled={isDisabled || !hasSelection}
          color="bg-[#1a1a1a] border-2 border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
          icon={<Clock className="w-6 h-6" />}
          label="Want to Watch"
          size="md"
        />
        <ActionBtn
          onClick={() => cardRef.current?.triggerSwipe(EntryStatus.watched)}
          disabled={isDisabled || !hasSelection}
          color="bg-[#1a1a1a] border-2 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
          icon={<Check className="w-7 h-7" />}
          label="Watched"
          size="lg"
        />
      </div>

      {/* Button labels */}
      <div className="flex items-center justify-center gap-6 mt-2">
        <span className="text-xs text-red-400/70 font-medium w-16 text-center">Skipped</span>
        <span className="text-xs text-orange-400/70 font-medium w-14 text-center">Watchlist</span>
        <span className="text-xs text-emerald-400/70 font-medium w-16 text-center">Watched</span>
      </div>
    </div>
  );
}
