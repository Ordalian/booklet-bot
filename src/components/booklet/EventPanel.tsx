import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Search, Loader2, Link as LinkIcon, Upload, ChevronDown, ChevronRight, FileSearch, GripVertical, ImageIcon, ImageOff, Maximize2, Minimize2 } from "lucide-react";
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
}

const EVENT_CATEGORIES = [
  { id: "culture", label: "Culture et Exposition", color: "#2563eb" },
  { id: "evenementiel", label: "Événementiel", color: "#E85D04" },
  { id: "nature", label: "Nature", color: "#16a34a" },
  { id: "famille", label: "Famille et enfants", color: "#E8A838" },
  { id: "spectacles", label: "Spectacles", color: "#9B59B6" },
  { id: "brocantes", label: "Brocantes", color: "#8B7355" },
] as const;

interface CategoryState {
  enabled: boolean;
  links: string[];
  additionalInfo: string;
  files: File[];
}

interface Props {
  onDropEvent?: (event: ScrapedEvent, catId: string) => void;
}

const EventPanel = ({ onDropEvent }: Props) => {
  const [categories, setCategories] = useState<Record<string, CategoryState>>({});
  const [scrapedEvents, setScrapedEvents] = useState<Record<string, Record<string, ScrapedEvent[]>>>({});
  const [scrapingUrls, setScrapingUrls] = useState<Set<string>>(new Set());
  const [openCats, setOpenCats] = useState<Set<string>>(new Set());

  const toggleCategory = (catId: string) => {
    setCategories(prev => {
      if (prev[catId]?.enabled) {
        return { ...prev, [catId]: { ...prev[catId], enabled: false } };
      }
      return { ...prev, [catId]: { enabled: true, links: [""], additionalInfo: "", files: [] } };
    });
    setOpenCats(prev => { const n = new Set(prev); n.add(catId); return n; });
  };

  const updateLink = (catId: string, idx: number, val: string) => {
    setCategories(prev => ({
      ...prev,
      [catId]: { ...prev[catId], links: prev[catId].links.map((l, i) => i === idx ? val : l) },
    }));
  };

  const addLink = (catId: string) => {
    setCategories(prev => ({
      ...prev,
      [catId]: { ...prev[catId], links: [...prev[catId].links, ""] },
    }));
  };

  const removeLink = (catId: string, idx: number) => {
    setCategories(prev => ({
      ...prev,
      [catId]: { ...prev[catId], links: prev[catId].links.filter((_, i) => i !== idx) },
    }));
  };

  const getDirectives = (catId: string) => {
    const cat = EVENT_CATEGORIES.find(c => c.id === catId);
    const state = categories[catId];
    return { categoryLabel: cat?.label || catId, directives: state?.additionalInfo || "" };
  };

  const scrapeLink = useCallback(async (catId: string, url: string) => {
    if (!url.trim().startsWith("http")) return;
    const key = `${catId}::${url}`;
    if (scrapingUrls.has(key)) return;
    setScrapingUrls(prev => new Set(prev).add(key));
    try {
      const { categoryLabel, directives } = getDirectives(catId);
      const { data, error } = await supabase.functions.invoke("scrape-preview", {
        body: { url, directives, categoryLabel },
      });
      if (error) throw error;
      if (data?.events?.length) {
        setScrapedEvents(prev => ({
          ...prev,
          [catId]: { ...prev[catId], [url]: data.events },
        }));
        toast.success(`${data.events.length} événement(s) trouvé(s)`);
      } else {
        toast.info("Aucun événement trouvé");
        setScrapedEvents(prev => ({ ...prev, [catId]: { ...prev[catId], [url]: [] } }));
      }
    } catch (err: any) {
      toast.error("Erreur: " + (err.message || "Erreur"));
    } finally {
      setScrapingUrls(prev => { const n = new Set(prev); n.delete(key); return n; });
    }
  }, [scrapingUrls, categories]);

  const scrapeFiles = useCallback(async (catId: string) => {
    const state = categories[catId];
    if (!state?.files.length) return;
    const key = `${catId}::files`;
    if (scrapingUrls.has(key)) return;
    setScrapingUrls(prev => new Set(prev).add(key));
    try {
      const { categoryLabel, directives } = getDirectives(catId);
      const fileUrls: string[] = [];
      for (const file of state.files) {
        const safeName = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `scrape/${Date.now()}_${safeName}`;
        const { data, error } = await supabase.storage.from("uploads").upload(path, file, { upsert: true });
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(data.path);
        fileUrls.push(urlData.publicUrl);
      }
      const { data, error } = await supabase.functions.invoke("scrape-preview", {
        body: { fileUrls, directives, categoryLabel },
      });
      if (error) throw error;
      if (data?.events?.length) {
        setScrapedEvents(prev => ({
          ...prev,
          [catId]: { ...prev[catId], ["__files__"]: data.events },
        }));
        toast.success(`${data.events.length} événement(s) extraits des fichiers`);
      } else {
        toast.info("Aucun événement trouvé dans les fichiers");
      }
    } catch (err: any) {
      toast.error("Erreur fichiers: " + (err.message || "Erreur"));
    } finally {
      setScrapingUrls(prev => { const n = new Set(prev); n.delete(key); return n; });
    }
  }, [categories, scrapingUrls]);

  const toggleEventFormat = (catId: string, sourceKey: string, eventIdx: number) => {
    setScrapedEvents(prev => {
      const catEvents = { ...prev[catId] };
      const events = [...(catEvents[sourceKey] || [])];
      const ev = events[eventIdx];
      events[eventIdx] = { ...ev, _format: ev._format === "noImage" ? "withImage" : "noImage" };
      catEvents[sourceKey] = events;
      return { ...prev, [catId]: catEvents };
    });
  };

  const toggleEventSize = (catId: string, sourceKey: string, eventIdx: number) => {
    setScrapedEvents(prev => {
      const catEvents = { ...prev[catId] };
      const events = [...(catEvents[sourceKey] || [])];
      const ev = events[eventIdx];
      events[eventIdx] = { ...ev, _size: ev._size === "large" ? "normal" : "large" };
      catEvents[sourceKey] = events;
      return { ...prev, [catId]: catEvents };
    });
  };

  const uploadEventImage = async (catId: string, sourceKey: string, eventIdx: number, file: File) => {
    try {
      const safeName = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `event-images/${Date.now()}_${safeName}`;
      const { data, error } = await supabase.storage.from("uploads").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(data.path);
      setScrapedEvents(prev => {
        const catEvents = { ...prev[catId] };
        const events = [...(catEvents[sourceKey] || [])];
        events[eventIdx] = { ...events[eventIdx], imageUrl: urlData.publicUrl, _format: "withImage" };
        catEvents[sourceKey] = events;
        return { ...prev, [catId]: catEvents };
      });
      toast.success("Image ajoutée");
    } catch (err: any) {
      toast.error("Erreur upload: " + err.message);
    }
  };

  const handleDragStart = (e: React.DragEvent, event: ScrapedEvent, catId: string) => {
    const cat = EVENT_CATEGORIES.find(c => c.id === catId);
    e.dataTransfer.setData("application/json", JSON.stringify({
      event,
      catId,
      catColor: cat?.color || "#333",
      format: event._format || "withImage",
      size: event._size || "normal",
    }));
    e.dataTransfer.effectAllowed = "copy";
  };

  const renderEventCard = (ev: ScrapedEvent, catId: string, sourceKey: string, idx: number, catColor: string) => {
    const format = ev._format || "withImage";
    const size = ev._size || "normal";
    return (
      <div
        key={`${sourceKey}-${idx}`}
        draggable
        onDragStart={e => handleDragStart(e, ev, catId)}
        className="text-[10px] bg-card rounded-lg border border-border overflow-hidden cursor-grab active:cursor-grabbing hover:shadow-md transition-all"
        style={{ borderLeftWidth: 3, borderLeftColor: catColor }}
      >
        <div className="px-2.5 py-2 space-y-0.5">
          <div className="flex items-start gap-1.5">
            <GripVertical className="w-3 h-3 text-muted-foreground/50 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate" style={{ color: catColor }}>{ev.title}</div>
              {ev.date && <div className="text-muted-foreground">📅 {ev.date}</div>}
              {ev.location && <div className="text-muted-foreground">📍 {ev.location}</div>}
              {ev.description && <div className="text-muted-foreground line-clamp-2">{ev.description}</div>}
              {ev.price && <div className="font-medium">💰 {ev.price}</div>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1.5 bg-muted/30 border-t border-border/50">
          <button
            onClick={() => toggleEventFormat(catId, sourceKey, idx)}
            className={`flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-md transition-colors ${format === "withImage" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
          >
            {format === "withImage" ? <ImageIcon className="w-2.5 h-2.5" /> : <ImageOff className="w-2.5 h-2.5" />}
            {format === "withImage" ? "Image" : "Sans"}
          </button>
          <button
            onClick={() => toggleEventSize(catId, sourceKey, idx)}
            className={`flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-md transition-colors ${size === "large" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
          >
            {size === "large" ? <Maximize2 className="w-2.5 h-2.5" /> : <Minimize2 className="w-2.5 h-2.5" />}
            {size === "large" ? "Large" : "Normal"}
          </button>
          <button
            onClick={() => deleteEvent(catId, sourceKey, idx)}
            className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-md transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20"
            title="Supprimer cet événement"
          >
            <Trash2 className="w-2.5 h-2.5" />
          </button>
          {format === "withImage" && (
            ev.imageUrl ? (
              <img src={ev.imageUrl} alt="" className="w-8 h-6 rounded object-cover border border-border ml-auto" />
            ) : (
              <label className="ml-auto text-[9px] text-primary cursor-pointer hover:underline flex items-center gap-0.5">
                <Upload className="w-2.5 h-2.5" /> Photo
                <input
                  type="file" className="hidden" accept="image/*"
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadEventImage(catId, sourceKey, idx, f); e.target.value = ""; }}
                />
              </label>
            )
          )}
        </div>
      </div>
    );
  };

  const totalEvents = Object.values(scrapedEvents).reduce(
    (acc, cat) => acc + Object.values(cat).flat().length, 0
  );

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">Événements</h3>

      {EVENT_CATEGORIES.map(cat => {
        const state = categories[cat.id];
        const isOpen = openCats.has(cat.id);
        const catEvents = scrapedEvents[cat.id] || {};
        const eventCount = Object.values(catEvents).flat().length;
        const isScrapingFiles = scrapingUrls.has(`${cat.id}::files`);

        return (
          <div key={cat.id} className="rounded-md border border-border overflow-hidden">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-muted/30">
              <Checkbox
                checked={state?.enabled || false}
                onCheckedChange={() => toggleCategory(cat.id)}
              />
              <button
                className="flex-1 flex items-center gap-1.5 text-xs font-medium text-left"
                style={{ color: cat.color }}
                onClick={() => setOpenCats(prev => {
                  const n = new Set(prev);
                  isOpen ? n.delete(cat.id) : n.add(cat.id);
                  return n;
                })}
              >
                {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                {cat.label}
                {eventCount > 0 && (
                  <span className="ml-auto bg-accent/10 text-accent text-[10px] px-1.5 rounded-full font-bold">{eventCount}</span>
                )}
              </button>
            </div>

            {isOpen && state?.enabled && (
              <div className="px-2 py-2 space-y-2 border-t border-border">
                {/* URLs */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold flex items-center gap-1 text-muted-foreground">
                    <LinkIcon className="w-2.5 h-2.5" /> Liens web
                  </label>
                  {state.links.map((link, li) => {
                    const isScraping = scrapingUrls.has(`${cat.id}::${link}`);
                    return (
                      <div key={li} className="flex gap-1">
                        <Input
                          value={link}
                          onChange={e => updateLink(cat.id, li, e.target.value)}
                          placeholder="https://..."
                          className="text-[11px] h-7"
                        />
                        <Button
                          variant="outline" size="icon" className="h-7 w-7 shrink-0"
                          disabled={!link.trim().startsWith("http") || isScraping}
                          onClick={() => scrapeLink(cat.id, link)}
                        >
                          {isScraping ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                        </Button>
                        {state.links.length > 1 && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeLink(cat.id, li)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                  <Button variant="ghost" size="sm" className="text-[10px] h-6" onClick={() => addLink(cat.id)}>
                    <Plus className="w-2.5 h-2.5 mr-1" /> Lien
                  </Button>
                </div>

                {/* Files */}
                <div>
                  <label className="text-[10px] font-semibold flex items-center gap-1 text-muted-foreground">
                    <Upload className="w-2.5 h-2.5" /> Fichiers PDF / images
                  </label>
                  <div className="space-y-1 mt-0.5">
                    {state.files.map((file, fi) => (
                      <div key={fi} className="flex items-center gap-1 text-[10px] bg-muted/50 rounded px-2 py-1">
                        <span className="truncate flex-1">{file.name}</span>
                        <span className="text-muted-foreground shrink-0">{(file.size / 1024).toFixed(0)} Ko</span>
                        <Button
                          variant="ghost" size="icon" className="h-5 w-5 shrink-0"
                          onClick={() => setCategories(prev => ({
                            ...prev,
                            [cat.id]: { ...prev[cat.id], files: prev[cat.id].files.filter((_, i) => i !== fi) },
                          }))}
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex items-center gap-1">
                      <label className="flex items-center gap-1 text-[10px] text-primary cursor-pointer hover:underline">
                        <Plus className="w-2.5 h-2.5" /> Ajouter
                        <input
                          type="file" className="hidden"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                          multiple
                          onChange={e => {
                            const newFiles = Array.from(e.target.files || []);
                            if (newFiles.length > 0) {
                              setCategories(prev => ({
                                ...prev,
                                [cat.id]: { ...prev[cat.id], files: [...prev[cat.id].files, ...newFiles] },
                              }));
                            }
                            e.target.value = "";
                          }}
                        />
                      </label>
                      {state.files.length > 0 && (
                        <Button
                          variant="outline" size="sm" className="text-[10px] h-6 ml-auto"
                          disabled={isScrapingFiles}
                          onClick={() => scrapeFiles(cat.id)}
                        >
                          {isScrapingFiles
                            ? <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            : <FileSearch className="w-3 h-3 mr-1" />}
                          Analyser
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Directives */}
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground">Directives</label>
                  <Textarea
                    value={state.additionalInfo}
                    onChange={e => setCategories(prev => ({ ...prev, [cat.id]: { ...prev[cat.id], additionalInfo: e.target.value } }))}
                    placeholder="Ex: focus sur les événements gratuits, exclure les conférences..."
                    rows={2}
                    className="text-[11px] mt-0.5"
                  />
                </div>

                {/* Scraped results as draggable cards */}
                {Object.entries(catEvents).map(([sourceKey, events]) => (
                  events.length > 0 && (
                    <div key={sourceKey} className="space-y-1">
                      <div className="text-[9px] font-semibold text-muted-foreground">
                        {sourceKey === "__files__" ? "Résultats fichiers" : `Résultats`} ({events.length})
                      </div>
                      {events.map((ev, ei) => renderEventCard(ev, cat.id, sourceKey, ei, cat.color))}
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        );
      })}

      {totalEvents > 0 && (
        <p className="text-[10px] text-muted-foreground text-center px-2 py-1">
          Glissez les événements sur le canvas pour les placer
        </p>
      )}
    </div>
  );
};

export default EventPanel;
