import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Search, Loader2, Link as LinkIcon, Upload, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface ScrapedEvent {
  title: string;
  date: string;
  location: string;
  description: string;
  price: string;
  tags: string[];
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
  onGeneratePages: (events: Record<string, ScrapedEvent[]>) => void;
}

const EventPanel = ({ onGeneratePages }: Props) => {
  const [categories, setCategories] = useState<Record<string, CategoryState>>({});
  const [scrapedEvents, setScrapedEvents] = useState<Record<string, Record<string, ScrapedEvent[]>>>({});
  const [scrapingUrls, setScrapingUrls] = useState<Set<string>>(new Set());
  const [openCats, setOpenCats] = useState<Set<string>>(new Set());

  const toggleCategory = (catId: string) => {
    setCategories(prev => {
      if (prev[catId]?.enabled) {
        const { [catId]: _, ...rest } = prev;
        return { ...rest, [catId]: { ...prev[catId], enabled: false } };
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

  const scrapeLink = useCallback(async (catId: string, url: string) => {
    if (!url.trim().startsWith("http")) return;
    const key = `${catId}::${url}`;
    if (scrapingUrls.has(key)) return;
    setScrapingUrls(prev => new Set(prev).add(key));
    try {
      const { data, error } = await supabase.functions.invoke("scrape-preview", { body: { url } });
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
  }, [scrapingUrls]);

  const handleGenerate = () => {
    const allEvents: Record<string, ScrapedEvent[]> = {};
    for (const [catId, catState] of Object.entries(categories)) {
      if (!catState.enabled) continue;
      const events = Object.values(scrapedEvents[catId] || {}).flat();
      if (events.length > 0) allEvents[catId] = events;
    }
    if (Object.keys(allEvents).length === 0) {
      toast.error("Scrapez d'abord des événements");
      return;
    }
    onGeneratePages(allEvents);
    toast.success("Pages d'événements générées !");
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
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold flex items-center gap-1 text-muted-foreground">
                    <LinkIcon className="w-2.5 h-2.5" /> Liens web
                  </label>
                  {state.links.map((link, li) => {
                    const isScraping = scrapingUrls.has(`${cat.id}::${link}`);
                    const results = catEvents[link];
                    return (
                      <div key={li}>
                        <div className="flex gap-1">
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
                        {results && results.length > 0 && (
                          <div className="ml-1 mt-1 space-y-1">
                            {results.map((ev, ei) => (
                              <div key={ei} className="text-[10px] bg-muted/50 rounded px-2 py-1">
                                <span className="font-semibold">{ev.title}</span>
                                {ev.date && <span className="text-muted-foreground ml-1">— {ev.date}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <Button variant="ghost" size="sm" className="text-[10px] h-6" onClick={() => addLink(cat.id)}>
                    <Plus className="w-2.5 h-2.5 mr-1" /> Lien
                  </Button>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground">Directives</label>
                  <Textarea
                    value={state.additionalInfo}
                    onChange={e => setCategories(prev => ({ ...prev, [cat.id]: { ...prev[cat.id], additionalInfo: e.target.value } }))}
                    placeholder="Infos supplémentaires..."
                    rows={2}
                    className="text-[11px] mt-0.5"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {totalEvents > 0 && (
        <Button onClick={handleGenerate} className="w-full text-xs" size="sm">
          Générer {totalEvents} événement(s) en pages
        </Button>
      )}
    </div>
  );
};

export default EventPanel;
