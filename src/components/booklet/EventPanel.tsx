import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Trash2, Search, Loader2, Link as LinkIcon, Upload,
  ChevronDown, ChevronRight, FileSearch, GripVertical, ImageIcon,
  ImageOff, Maximize2, Minimize2, Pencil, X, FolderPlus, Heading,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ScrapedEvent {
  title: string;
  date: string;
  location: string;
  description: string;
  price: string;
  tags: string[];
  imageUrl?: string;
  _format?: "withImage" | "noImage";
  _size?: "normal" | "large";
  _fontScale?: 1 | 1.2 | 1.5;
}

interface SavedUrl {
  id: string;
  url: string;
}

interface UploadedFile {
  id: string;
  name: string;
  publicUrl: string;
  size: number;
}

interface ScrappingSection {
  id: string;
  name: string;
  color: string;
  urls: SavedUrl[];
  uploadedFiles: UploadedFile[];
  directives: string;
}

interface EventsCache {
  [sourceKey: string]: {
    events: ScrapedEvent[];
    timestamp: number;
  };
}

const SECTIONS_KEY = "scrapping-sections-v2";
const EVENTS_CACHE_KEY = "scrapping-events-v2";
const SECTION_COLORS = [
  "#E85D04", "#2563eb", "#16a34a", "#E8A838",
  "#9B59B6", "#8B7355", "#e11d48", "#0891b2",
];

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function loadSections(): ScrappingSection[] {
  try {
    const raw = localStorage.getItem(SECTIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function loadEventsCache(): EventsCache {
  try {
    const raw = localStorage.getItem(EVENTS_CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function getGeminiApiKey(): string | undefined {
  return localStorage.getItem("gemini-api-key") || undefined;
}

function getFirecrawlApiKey(): string | undefined {
  return localStorage.getItem("firecrawl-api-key") || undefined;
}

interface Props {
  onDropEvent?: (event: ScrapedEvent, catId: string) => void;
  onAddSectionHeader?: (name: string, color: string) => void;
}

const EventPanel = ({ onDropEvent, onAddSectionHeader }: Props) => {
  const [sections, setSections] = useState<ScrappingSection[]>(loadSections);
  const [eventsCache, setEventsCache] = useState<EventsCache>(loadEventsCache);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [scrapingKeys, setScrapingKeys] = useState<Set<string>>(new Set());
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState("");
  const [newUrlBySec, setNewUrlBySec] = useState<Record<string, string>>({});

  // Persist sections on change
  useEffect(() => {
    try {
      localStorage.setItem(SECTIONS_KEY, JSON.stringify(sections));
    } catch {}
  }, [sections]);

  // Persist events cache on change
  useEffect(() => {
    try {
      localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(eventsCache));
    } catch {}
  }, [eventsCache]);

  const addSection = () => {
    const color = SECTION_COLORS[sections.length % SECTION_COLORS.length];
    const section: ScrappingSection = {
      id: genId(),
      name: `Section ${sections.length + 1}`,
      color,
      urls: [],
      uploadedFiles: [],
      directives: "",
    };
    setSections(prev => [...prev, section]);
    setOpenSections(prev => new Set(prev).add(section.id));
    setEditingNameId(section.id);
    setEditNameValue(section.name);
  };

  const deleteSection = (id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
    setOpenSections(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const updateSection = useCallback((id: string, updates: Partial<ScrappingSection>) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const commitName = (id: string) => {
    if (editNameValue.trim()) {
      updateSection(id, { name: editNameValue.trim() });
    }
    setEditingNameId(null);
  };

  const addUrl = (sectionId: string) => {
    const url = (newUrlBySec[sectionId] || "").trim();
    if (!url.startsWith("http")) return;
    const savedUrl: SavedUrl = { id: genId(), url };
    setSections(prev => prev.map(s => s.id === sectionId
      ? { ...s, urls: [...s.urls, savedUrl] } : s));
    setNewUrlBySec(prev => ({ ...prev, [sectionId]: "" }));
  };

  const removeUrl = (sectionId: string, urlId: string) => {
    setSections(prev => prev.map(s => s.id === sectionId
      ? { ...s, urls: s.urls.filter(u => u.id !== urlId) } : s));
  };

  const removeFile = (sectionId: string, fileId: string) => {
    setSections(prev => prev.map(s => s.id === sectionId
      ? { ...s, uploadedFiles: s.uploadedFiles.filter(f => f.id !== fileId) } : s));
  };

  const getKey = (sectionId: string, sourceId: string) => `${sectionId}::${sourceId}`;

  const scrapeUrl = useCallback(async (section: ScrappingSection, savedUrl: SavedUrl) => {
    const key = getKey(section.id, savedUrl.id);
    setScrapingKeys(prev => new Set(prev).add(key));
    try {
      const { data, error } = await supabase.functions.invoke("scrape-preview", {
        body: {
          url: savedUrl.url,
          directives: section.directives,
          categoryLabel: section.name,
          userApiKey: getGeminiApiKey(),
          firecrawlApiKey: getFirecrawlApiKey(),
        },
      });
      if (error) throw error;
      const events: ScrapedEvent[] = data?.events || [];
      setEventsCache(prev => ({ ...prev, [key]: { events, timestamp: Date.now() } }));
      if (events.length) {
        toast.success(`${events.length} résultat(s) trouvé(s)`);
      } else {
        toast.info("Aucun résultat trouvé");
      }
    } catch (err: any) {
      toast.error("Erreur: " + (err.message || "Erreur"));
    } finally {
      setScrapingKeys(prev => { const n = new Set(prev); n.delete(key); return n; });
    }
  }, []);

  const scrapeFile = useCallback(async (section: ScrappingSection, file: UploadedFile) => {
    const key = getKey(section.id, file.id);
    setScrapingKeys(prev => new Set(prev).add(key));
    try {
      const { data, error } = await supabase.functions.invoke("scrape-preview", {
        body: {
          fileUrls: [file.publicUrl],
          directives: section.directives,
          categoryLabel: section.name,
          userApiKey: getGeminiApiKey(),
          firecrawlApiKey: getFirecrawlApiKey(),
        },
      });
      if (error) throw error;
      const events: ScrapedEvent[] = data?.events || [];
      setEventsCache(prev => ({ ...prev, [key]: { events, timestamp: Date.now() } }));
      if (events.length) {
        toast.success(`${events.length} résultat(s) extraits`);
      } else {
        toast.info("Aucun résultat dans ce fichier");
      }
    } catch (err: any) {
      toast.error("Erreur: " + (err.message || "Erreur"));
    } finally {
      setScrapingKeys(prev => { const n = new Set(prev); n.delete(key); return n; });
    }
  }, []);

  const handleFileUpload = useCallback(async (sectionId: string, files: FileList) => {
    for (const file of Array.from(files)) {
      try {
        const safeName = file.name
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `scrape/${Date.now()}_${safeName}`;
        const { data, error } = await supabase.storage.from("uploads").upload(path, file, { upsert: true });
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(data.path);
        const uploaded: UploadedFile = {
          id: genId(),
          name: file.name,
          publicUrl: urlData.publicUrl,
          size: file.size,
        };
        setSections(prev => prev.map(s => s.id === sectionId
          ? { ...s, uploadedFiles: [...s.uploadedFiles, uploaded] } : s));
        toast.success(`"${file.name}" enregistré`);
      } catch (err: any) {
        toast.error("Erreur upload: " + err.message);
      }
    }
  }, []);

  const updateEventInCache = useCallback((key: string, idx: number, patch: Partial<ScrapedEvent>) => {
    setEventsCache(prev => {
      const entry = prev[key];
      if (!entry) return prev;
      const events = entry.events.map((ev, i) => i === idx ? { ...ev, ...patch } : ev);
      return { ...prev, [key]: { ...entry, events } };
    });
  }, []);

  const deleteEventFromCache = useCallback((key: string, idx: number) => {
    setEventsCache(prev => {
      const entry = prev[key];
      if (!entry) return prev;
      return { ...prev, [key]: { ...entry, events: entry.events.filter((_, i) => i !== idx) } };
    });
    toast.success("Supprimé");
  }, []);

  const uploadEventImage = useCallback(async (key: string, idx: number, file: File) => {
    try {
      const safeName = file.name
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `event-images/${Date.now()}_${safeName}`;
      const { data, error } = await supabase.storage.from("uploads").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(data.path);
      updateEventInCache(key, idx, { imageUrl: urlData.publicUrl, _format: "withImage" });
      toast.success("Image ajoutée");
    } catch (err: any) {
      toast.error("Erreur upload: " + err.message);
    }
  }, [updateEventInCache]);

  const handleDragStart = (e: React.DragEvent, event: ScrapedEvent, section: ScrappingSection) => {
    e.dataTransfer.setData("application/json", JSON.stringify({
      event,
      catId: section.id,
      catColor: section.color,
      format: event._format || "withImage",
      size: event._size || "normal",
      fontScale: event._fontScale ?? 1,
    }));
    e.dataTransfer.effectAllowed = "copy";
  };

  const renderEventCard = (
    ev: ScrapedEvent,
    section: ScrappingSection,
    cacheKey: string,
    idx: number
  ) => {
    const format = ev._format || "withImage";
    const size = ev._size || "normal";
    const fontScale = ev._fontScale ?? 1;
    return (
      <div
        key={`${cacheKey}-${idx}`}
        draggable
        onDragStart={e => handleDragStart(e, ev, section)}
        className="bg-card rounded-lg border border-border overflow-hidden cursor-grab active:cursor-grabbing hover:shadow-md transition-all select-none"
        style={{ borderLeftWidth: 3, borderLeftColor: section.color }}
      >
        {/* Card header: color band */}
        <div className="h-1 w-full" style={{ background: section.color }} />

        <div className="px-2.5 py-2 space-y-1">
          <div className="flex items-start gap-1.5">
            <GripVertical className="w-3 h-3 text-muted-foreground/40 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0 space-y-0.5">
              {/* Title */}
              <div className="text-[11px] font-bold leading-tight" style={{ color: section.color }}>
                {ev.title}
              </div>

              {/* Date */}
              {ev.date && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span>📅</span>
                  <span className="truncate">{ev.date}</span>
                </div>
              )}

              {/* Location */}
              {ev.location && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span>📍</span>
                  <span className="truncate">{ev.location}</span>
                </div>
              )}

              {/* Description preview */}
              {ev.description && (
                <p className="text-[10px] text-foreground/70 line-clamp-2 leading-snug">
                  {ev.description}
                </p>
              )}

              {/* Price */}
              {ev.price && (
                <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  💰 {ev.price}
                </div>
              )}

              {/* Tags */}
              {ev.tags?.length > 0 && (
                <div className="flex flex-wrap gap-0.5 pt-0.5">
                  {ev.tags.slice(0, 4).map((tag, ti) => (
                    <span
                      key={ti}
                      className="text-[8px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: section.color + "18", color: section.color }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controls bar */}
        <div className="flex items-center gap-1 px-2.5 py-1.5 bg-muted/30 border-t border-border/50 flex-wrap">
          <button
            onClick={() => updateEventInCache(cacheKey, idx, {
              _format: format === "withImage" ? "noImage" : "withImage",
            })}
            className={`flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-md transition-colors ${
              format === "withImage" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            }`}
          >
            {format === "withImage"
              ? <ImageIcon className="w-2.5 h-2.5" />
              : <ImageOff className="w-2.5 h-2.5" />}
            {format === "withImage" ? "Image" : "Sans"}
          </button>

          <button
            onClick={() => updateEventInCache(cacheKey, idx, {
              _size: size === "large" ? "normal" : "large",
            })}
            className={`flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-md transition-colors ${
              size === "large" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            }`}
          >
            {size === "large"
              ? <Maximize2 className="w-2.5 h-2.5" />
              : <Minimize2 className="w-2.5 h-2.5" />}
            {size === "large" ? "Large" : "Normal"}
          </button>

          <button
            onClick={() => {
              const next = fontScale === 1 ? 1.2 : fontScale === 1.2 ? 1.5 : 1;
              updateEventInCache(cacheKey, idx, { _fontScale: next as 1 | 1.2 | 1.5 });
            }}
            className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
            title="Taille de police"
          >
            <span className="font-semibold">
              {fontScale === 1 ? "Aa" : fontScale === 1.2 ? "Aa+" : "Aa++"}
            </span>
          </button>

          <button
            onClick={() => deleteEventFromCache(cacheKey, idx)}
            className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
          >
            <Trash2 className="w-2.5 h-2.5" />
          </button>

          {format === "withImage" && (
            ev.imageUrl ? (
              <img
                src={ev.imageUrl}
                alt=""
                className="w-8 h-6 rounded object-cover border border-border ml-auto"
              />
            ) : (
              <label className="ml-auto text-[9px] text-primary cursor-pointer hover:underline flex items-center gap-0.5">
                <Upload className="w-2.5 h-2.5" /> Photo
                <input
                  type="file" className="hidden" accept="image/*"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) uploadEventImage(cacheKey, idx, f);
                    e.target.value = "";
                  }}
                />
              </label>
            )
          )}
        </div>
      </div>
    );
  };

  const totalEvents = Object.values(eventsCache).reduce(
    (acc, entry) => acc + entry.events.length, 0
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Scrapping
        </h3>
        <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={addSection}>
          <FolderPlus className="w-3 h-3" />
          Section
        </Button>
      </div>

      {sections.length === 0 && (
        <div className="rounded-md border-2 border-dashed border-border p-4 text-center space-y-2">
          <p className="text-[11px] text-muted-foreground leading-snug">
            Créez des sections pour organiser vos sources (sites, PDFs…)
          </p>
          <Button variant="outline" size="sm" className="text-[10px] h-7" onClick={addSection}>
            <FolderPlus className="w-3 h-3 mr-1" />
            Nouvelle section
          </Button>
        </div>
      )}

      {sections.map(section => {
        const isOpen = openSections.has(section.id);
        const isEditingName = editingNameId === section.id;

        const sectionKeys = [
          ...section.urls.map(u => getKey(section.id, u.id)),
          ...section.uploadedFiles.map(f => getKey(section.id, f.id)),
        ];
        const sectionEventCount = sectionKeys.reduce(
          (acc, k) => acc + (eventsCache[k]?.events.length || 0), 0
        );

        return (
          <div key={section.id} className="rounded-md border border-border overflow-hidden">
            {/* Section header */}
            <div className="flex items-center gap-1.5 px-2 py-1.5 bg-muted/30">
              <button
                className="flex-1 flex items-center gap-1.5 text-left min-w-0 overflow-hidden"
                onClick={() => setOpenSections(prev => {
                  const n = new Set(prev);
                  isOpen ? n.delete(section.id) : n.add(section.id);
                  return n;
                })}
              >
                <label
                  className="relative w-3.5 h-3.5 rounded-full shrink-0 cursor-pointer ring-1 ring-border hover:ring-2 hover:ring-primary/50 transition-all overflow-hidden"
                  style={{ background: section.color }}
                  title="Changer la couleur"
                  onClick={e => e.stopPropagation()}
                >
                  <input
                    type="color"
                    value={section.color}
                    onChange={e => updateSection(section.id, { color: e.target.value })}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </label>
                {isEditingName ? (
                  <input
                    value={editNameValue}
                    autoFocus
                    onChange={e => setEditNameValue(e.target.value)}
                    onBlur={() => commitName(section.id)}
                    onKeyDown={e => {
                      if (e.key === "Enter") commitName(section.id);
                      if (e.key === "Escape") setEditingNameId(null);
                    }}
                    onClick={e => e.stopPropagation()}
                    className="flex-1 min-w-0 text-xs font-medium bg-background border border-border rounded px-1 h-5 outline-none"
                  />
                ) : (
                  <span
                    className="text-xs font-medium truncate flex-1 min-w-0"
                    style={{ color: section.color }}
                  >
                    {section.name}
                  </span>
                )}
                {sectionEventCount > 0 && (
                  <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-primary/10 text-primary">
                    {sectionEventCount}
                  </span>
                )}
                {isOpen
                  ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                  : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
              </button>
              {onAddSectionHeader && (
                <button
                  onClick={e => { e.stopPropagation(); onAddSectionHeader(section.name, section.color); }}
                  className="p-0.5 rounded text-muted-foreground hover:text-primary transition-colors shrink-0"
                  title="Ajouter comme en-tête sur le canvas"
                >
                  <Heading className="w-2.5 h-2.5" />
                </button>
              )}
              <button
                onClick={e => {
                  e.stopPropagation();
                  setEditingNameId(section.id);
                  setEditNameValue(section.name);
                }}
                className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <Pencil className="w-2.5 h-2.5" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); deleteSection(section.id); }}
                className="p-0.5 rounded text-muted-foreground hover:text-destructive transition-colors shrink-0"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>

            {/* Section body */}
            {isOpen && (
              <div className="px-2.5 py-2.5 space-y-3 border-t border-border">

                {/* ── Saved URLs ── */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold flex items-center gap-1 text-muted-foreground">
                    <LinkIcon className="w-2.5 h-2.5" /> Sites web
                  </label>

                  {section.urls.map(saved => {
                    const cacheKey = getKey(section.id, saved.id);
                    const isScraping = scrapingKeys.has(cacheKey);
                    const cached = eventsCache[cacheKey];
                    return (
                      <div key={saved.id} className="space-y-0.5">
                        <div className="flex gap-1 items-center">
                          <div className="flex-1 min-w-0 text-[10px] bg-muted/50 rounded px-2 py-1 truncate text-muted-foreground">
                            {saved.url}
                          </div>
                          <Button
                            variant="outline" size="icon" className="h-6 w-6 shrink-0"
                            disabled={isScraping}
                            onClick={() => scrapeUrl(section, saved)}
                            title="Scraper ce lien"
                          >
                            {isScraping
                              ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
                              : <Search className="w-2.5 h-2.5" />}
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-6 w-6 shrink-0"
                            onClick={() => removeUrl(section.id, saved.id)}
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </Button>
                        </div>
                        {cached && (
                          <div className="text-[9px] text-muted-foreground pl-1">
                            {cached.events.length > 0
                              ? `✓ ${cached.events.length} résultat(s)`
                              : "∅ Aucun résultat"}
                            {" · "}
                            {new Date(cached.timestamp).toLocaleDateString("fr-FR", {
                              day: "numeric", month: "short",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add URL row */}
                  <div className="flex gap-1">
                    <Input
                      value={newUrlBySec[section.id] || ""}
                      onChange={e => setNewUrlBySec(prev => ({ ...prev, [section.id]: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && addUrl(section.id)}
                      placeholder="https://..."
                      className="text-[10px] h-6"
                    />
                    <Button
                      variant="outline" size="icon" className="h-6 w-6 shrink-0"
                      disabled={!(newUrlBySec[section.id] || "").trim().startsWith("http")}
                      onClick={() => addUrl(section.id)}
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </Button>
                  </div>
                </div>

                {/* ── Saved Files ── */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold flex items-center gap-1 text-muted-foreground">
                    <Upload className="w-2.5 h-2.5" /> Fichiers (PDF, images)
                  </label>

                  {section.uploadedFiles.map(file => {
                    const cacheKey = getKey(section.id, file.id);
                    const isScraping = scrapingKeys.has(cacheKey);
                    const cached = eventsCache[cacheKey];
                    return (
                      <div key={file.id} className="space-y-0.5">
                        <div className="flex items-center gap-1 text-[10px] bg-muted/50 rounded px-2 py-1">
                          <span className="truncate flex-1">{file.name}</span>
                          <span className="text-muted-foreground shrink-0">
                            {(file.size / 1024).toFixed(0)} Ko
                          </span>
                          <Button
                            variant="outline" size="icon" className="h-5 w-5 shrink-0"
                            disabled={isScraping}
                            onClick={() => scrapeFile(section, file)}
                            title="Analyser ce fichier"
                          >
                            {isScraping
                              ? <Loader2 className="w-2 h-2 animate-spin" />
                              : <FileSearch className="w-2 h-2" />}
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-5 w-5 shrink-0"
                            onClick={() => removeFile(section.id, file.id)}
                          >
                            <Trash2 className="w-2 h-2" />
                          </Button>
                        </div>
                        {cached && (
                          <div className="text-[9px] text-muted-foreground pl-1">
                            {cached.events.length > 0
                              ? `✓ ${cached.events.length} résultat(s)`
                              : "∅ Aucun résultat"}
                            {" · "}
                            {new Date(cached.timestamp).toLocaleDateString("fr-FR", {
                              day: "numeric", month: "short",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <label className="flex items-center gap-1 text-[10px] text-primary cursor-pointer hover:underline">
                    <Plus className="w-2.5 h-2.5" /> Ajouter fichier
                    <input
                      type="file" className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                      multiple
                      onChange={e => {
                        if (e.target.files) handleFileUpload(section.id, e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>

                {/* ── Directives ── */}
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground">
                    Directives de scrapping
                  </label>
                  <Textarea
                    value={section.directives}
                    onChange={e => updateSection(section.id, { directives: e.target.value })}
                    placeholder="Ex: focus sur les événements gratuits, exclure les conférences..."
                    rows={2}
                    className="text-[10px] mt-0.5"
                  />
                </div>

                {/* ── Scraped results ── */}
                {[
                  ...section.urls.map(u => ({
                    key: getKey(section.id, u.id),
                    label: u.url,
                  })),
                  ...section.uploadedFiles.map(f => ({
                    key: getKey(section.id, f.id),
                    label: f.name,
                  })),
                ].map(({ key, label }) => {
                  const cached = eventsCache[key];
                  if (!cached?.events.length) return null;
                  return (
                    <div key={key} className="space-y-1.5">
                      <div
                        className="text-[9px] font-semibold text-muted-foreground truncate"
                        title={label}
                      >
                        Résultats ({cached.events.length})
                      </div>
                      {cached.events.map((ev, ei) =>
                        renderEventCard(ev, section, key, ei)
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {totalEvents > 0 && (
        <p className="text-[10px] text-muted-foreground text-center px-2 py-1.5 bg-muted/30 rounded-md">
          Glissez les résultats sur le canvas pour les placer
        </p>
      )}
    </div>
  );
};

export default EventPanel;
