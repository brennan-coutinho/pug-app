import { useState, useEffect } from "react";
import {
  useListEntries,
  useUpdateEntry,
  useDeleteEntry,
  useGetEntry,
  EntryMediaType,
  EntryStatus,
  getListEntriesQueryKey,
  getGetEntryQueryKey,
  getGetStatsSummaryQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Trash2, Edit2, X, Check, ExternalLink, Tv, Clapperboard, Film } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ListPageProps {
  mediaType: EntryMediaType;
  status: EntryStatus;
}

// ─── TV Streaming info hook (via TVMaze) ──────────────────────────────────────

function useTVStreamingInfo(title: string, mediaType: EntryMediaType, status: EntryStatus) {
  const [platform, setPlatform] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mediaType !== EntryMediaType.tv || status !== EntryStatus.want_to_watch) return;
    let cancelled = false;
    setLoading(true);
    setPlatform(null);
    fetch(`https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(title)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled || !data) return;
        const p = data?.webChannel?.name || data?.network?.name || null;
        setPlatform(p);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [title, mediaType, status]);

  return { platform, loading };
}

// ─── Streaming badge ──────────────────────────────────────────────────────────

function StreamingBadge({ title, mediaType, status }: { title: string; mediaType: EntryMediaType; status: EntryStatus }) {
  const { platform, loading } = useTVStreamingInfo(title, mediaType, status);

  if (status !== EntryStatus.want_to_watch) return null;

  if (mediaType === EntryMediaType.movie) {
    return (
      <a
        href={`https://www.justwatch.com/us/search?q=${encodeURIComponent(title)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20 hover:bg-orange-500/25 transition-colors"
      >
        <ExternalLink className="w-2.5 h-2.5" />
        Find on JustWatch
      </a>
    );
  }

  if (loading) return <span className="inline-block w-20 h-4 rounded-full bg-white/8 animate-pulse" />;
  if (!platform) return null;

  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/20">
      <Tv className="w-2.5 h-2.5" />
      {platform}
    </span>
  );
}

// ─── Poster thumbnail ─────────────────────────────────────────────────────────

function PosterThumb({ posterUrl, mediaType }: { posterUrl?: string | null; mediaType: EntryMediaType }) {
  const [failed, setFailed] = useState(false);

  if (posterUrl && !failed) {
    return (
      <img
        src={posterUrl}
        alt=""
        className="w-12 h-16 object-cover rounded-lg flex-shrink-0 bg-[#0a0a0a]"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className="w-12 h-16 rounded-lg bg-[#1a1a1a] border border-white/6 flex items-center justify-center flex-shrink-0">
      {mediaType === EntryMediaType.movie
        ? <Film className="w-5 h-5 text-white/15" />
        : <Tv className="w-5 h-5 text-white/15" />}
    </div>
  );
}

// ─── Edit row ─────────────────────────────────────────────────────────────────

function EditEntryRow({ id, onCancel, onSuccess }: { id: number, onCancel: () => void, onSuccess: () => void }) {
  const { data: entry, isLoading } = useGetEntry(id, { query: { enabled: !!id, queryKey: getGetEntryQueryKey(id) } });
  const updateEntry = useUpdateEntry();
  const [title, setTitle] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => { if (entry) setTitle(entry.title); }, [entry]);

  const handleSave = () => {
    if (!title.trim()) return;
    updateEntry.mutate({ id, data: { title: title.trim() } }, {
      onSuccess: () => {
        toast({ title: "Updated", description: "Title updated successfully." });
        queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetEntryQueryKey(id) });
        onSuccess();
      }
    });
  };

  if (isLoading || !entry) return <div className="p-4"><Skeleton className="h-10 w-full" /></div>;

  return (
    <div className="flex items-center gap-2 p-4 bg-[#1a1a1a] border border-orange-500/20 rounded-xl shadow-sm">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1 bg-[#111] border-white/10 text-white placeholder:text-white/30"
        autoFocus
        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onCancel(); }}
      />
      <Button size="icon" variant="ghost" onClick={handleSave} className="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10">
        <Check className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" onClick={onCancel} className="text-white/40 hover:text-white/80">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ListPage({ mediaType, status }: ListPageProps) {
  const { data: entries, isLoading } = useListEntries(
    { mediaType, status },
    { query: { enabled: true, queryKey: getListEntriesQueryKey({ mediaType, status }) } }
  );
  const updateEntry = useUpdateEntry();
  const deleteEntry = useDeleteEntry();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);

  // Optimistically adjust header stats counts and then force a refetch for accuracy
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patchStats = (delta: Record<string, number>) => {
    queryClient.setQueryData(getGetStatsSummaryQueryKey(), (old: any) => {
      if (!old) return old;
      const next = { ...old };
      for (const [key, val] of Object.entries(delta)) next[key] = Math.max(0, (next[key] ?? 0) + val);
      return next;
    });
    // Force an immediate server refetch so the number stays accurate
    queryClient.refetchQueries({ queryKey: getGetStatsSummaryQueryKey() });
  };

  const statsKey = (mt: EntryMediaType, st: EntryStatus) => {
    const m = mt === EntryMediaType.movie ? "Movies" : "Tv";
    if (st === EntryStatus.watched) return `watched${m}`;
    if (st === EntryStatus.want_to_watch) return `wantToWatch${m}`;
    return `notWatched${m}`;
  };

  const totalKey = (mt: EntryMediaType) => mt === EntryMediaType.movie ? "totalMovies" : "totalTv";

  const handleUpdateStatus = (id: number, newStatus: EntryStatus, title: string) => {
    // Optimistic: remove from this list immediately (it moves to another list)
    const prevData = queryClient.getQueryData(getListEntriesQueryKey({ mediaType, status }));
    queryClient.setQueryData(
      getListEntriesQueryKey({ mediaType, status }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (old: any) => Array.isArray(old) ? old.filter((e: any) => e.id !== id) : old
    );
    // Optimistic stats: shift count from old status to new status
    patchStats({
      [statsKey(mediaType, status)]: -1,
      [statsKey(mediaType, newStatus)]: +1,
    });
    updateEntry.mutate({ id, data: { status: newStatus } }, {
      onSuccess: () => {
        toast({ title: "Status updated", description: `"${title}" moved to ${newStatus.replace("_", " ")}` });
        queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
      },
      onError: (err) => {
        queryClient.setQueryData(getListEntriesQueryKey({ mediaType, status }), prevData);
        queryClient.refetchQueries({ queryKey: getGetStatsSummaryQueryKey() });
        toast({ title: "Failed to update", description: (err.data as { error?: string })?.error || "An error occurred", variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: number, title: string) => {
    // Optimistic: remove from cache instantly
    const prevData = queryClient.getQueryData(getListEntriesQueryKey({ mediaType, status }));
    queryClient.setQueryData(
      getListEntriesQueryKey({ mediaType, status }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (old: any) => Array.isArray(old) ? old.filter((e: any) => e.id !== id) : old
    );
    // Optimistic stats: decrement total and status-specific count
    patchStats({
      [totalKey(mediaType)]: -1,
      [statsKey(mediaType, status)]: -1,
    });
    deleteEntry.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Entry deleted", description: `"${title}" has been removed.` });
        queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
      },
      onError: (err) => {
        queryClient.setQueryData(getListEntriesQueryKey({ mediaType, status }), prevData);
        queryClient.refetchQueries({ queryKey: getGetStatsSummaryQueryKey() });
        toast({ title: "Failed to delete", description: (err.data as { error?: string })?.error || "An error occurred", variant: "destructive" });
      }
    });
  };

  const statusLabel = status === EntryStatus.watched ? "Watched" : "Want to Watch";
  const statusColor = status === EntryStatus.watched
    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
    : "bg-orange-500/15 text-orange-400 border-orange-500/20";

  return (
    <div className="w-full flex flex-col py-4">
      {isLoading ? (
        <div className="space-y-3 mt-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl bg-white/5" />)}
        </div>
      ) : entries?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/8">
            {mediaType === EntryMediaType.movie
              ? <Clapperboard className="w-7 h-7 text-white/20" />
              : <Tv className="w-7 h-7 text-white/20" />}
          </div>
          <p className="text-lg font-semibold text-white/80 mb-1">No entries yet</p>
          <p className="text-sm text-white/35 max-w-xs">
            You haven't added any {mediaType === EntryMediaType.movie ? 'movies' : 'TV shows'} to this list.
          </p>
        </div>
      ) : (
        <div className="flex flex-col space-y-2 mt-4">
          {entries?.map((entry) =>
            editingId === entry.id ? (
              <EditEntryRow key={entry.id} id={entry.id} onCancel={() => setEditingId(null)} onSuccess={() => setEditingId(null)} />
            ) : (
              <div
                key={entry.id}
                className="flex items-center gap-3 p-3 bg-[#111] border border-white/7 rounded-xl hover:border-white/12 transition-colors"
                data-testid={`entry-row-${entry.id}`}
              >
                {/* Poster */}
                <PosterThumb posterUrl={entry.posterUrl} mediaType={mediaType} />

                {/* Info */}
                <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                  <span className="font-semibold text-white text-sm leading-tight line-clamp-2">{entry.title}</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColor}`} data-testid={`badge-status-${entry.id}`}>
                      {statusLabel}
                    </span>
                    <StreamingBadge title={entry.title} mediaType={mediaType} status={status} />
                    <span className="text-xs text-white/25">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-white/30 hover:text-white hover:bg-white/8" data-testid={`btn-actions-${entry.id}`}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-[#1a1a1a] border-white/10">
                      <DropdownMenuItem onClick={() => setEditingId(entry.id)} className="text-white/80 focus:text-white focus:bg-white/8">
                        Edit Title
                      </DropdownMenuItem>
                      {status === EntryStatus.want_to_watch && (
                        <DropdownMenuItem onClick={() => handleUpdateStatus(entry.id, EntryStatus.watched, entry.title)} className="text-white/80 focus:text-white focus:bg-white/8">
                          Mark as Watched
                        </DropdownMenuItem>
                      )}
                      {status === EntryStatus.watched && (
                        <DropdownMenuItem onClick={() => handleUpdateStatus(entry.id, EntryStatus.want_to_watch, entry.title)} className="text-white/80 focus:text-white focus:bg-white/8">
                          Move to Want to Watch
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleUpdateStatus(entry.id, EntryStatus.not_watched, entry.title)} className="text-red-400 focus:text-red-300 focus:bg-red-500/10">
                        Mark as Skipped
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-400/50 hover:text-red-400 hover:bg-red-500/10"
                    onClick={() => handleDelete(entry.id, entry.title)}
                    data-testid={`btn-delete-${entry.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
