import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Loader2, RefreshCw, Upload, Link as LinkIcon, Plus, Trash2, Palette, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BrochurePreview from "@/components/guide/BrochurePreview";
import LiveBrochurePreview from "@/components/guide/LiveBrochurePreview";
import type { BrochurePage } from "@/components/guide/BrochurePreview";

const EVENT_CATEGORIES = [
  { id: "culture", label: "Culture et Exposition", color: "#2563eb" },
  { id: "evenementiel", label: "Événementiel", color: "#E85D04" },
  { id: "nature", label: "Nature", color: "#16a34a" },
  { id: "famille", label: "Famille et enfants", color: "#E8A838" },
  { id: "spectacles", label: "Spectacles", color: "#9B59B6" },
  { id: "brocantes", label: "Brocantes", color: "#8B7355" },
] as const;

export interface ScrapedEvent {
  title: string;
  date: string;
  location: string;
  description: string;
  price: string;
  tags: string[];
}

interface CategorySources {
  links: string[];
  files: File[];
  additionalInfo: string;
}

type Template = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  contact_info: any;
  accueil_horaires: any;
  dynamic_insert_after: number;
  fixed_pages_count: number;
};

type TemplatePage = {
  page_number: number;
  title: string | null;
  content_instructions: string | null;
  layout_description: string | null;
  image_urls: string[] | null;
};

const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

const DEFAULT_BRAND = {
  colors: ["#E85D04", "#0077B6", "#2D6A4F", "#FFFFFF", "#1A1A2E"],
  logoUrl: "",
};

const BrochureGenerator = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [templatePages, setTemplatePages] = useState<TemplatePage[]>([]);
  const [brand, setBrand] = useState(DEFAULT_BRAND);
  const [dateDebut, setDateDebut] = useState("2026-03-29");
  const [dateFin, setDateFin] = useState("2026-04-30");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [categorySources, setCategorySources] = useState<Record<string, CategorySources>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [pages, setPages] = useState<BrochurePage[] | null>(null);
  const guideRef = useRef<HTMLDivElement>(null);
  // Scraped events per category per link: { [catId]: { [url]: ScrapedEvent[] } }
  const [scrapedEvents, setScrapedEvents] = useState<Record<string, Record<string, ScrapedEvent[]>>>({});
  const [scrapingUrls, setScrapingUrls] = useState<Set<string>>(new Set());

  const scrapeLink = useCallback(async (catId: string, url: string) => {
    if (!url.trim() || !url.startsWith('http')) return;
    const key = `${catId}::${url}`;
    if (scrapingUrls.has(key)) return;

    setScrapingUrls(prev => new Set(prev).add(key));
    try {
      const { data, error } = await supabase.functions.invoke("scrape-preview", {
        body: { url },
      });
      if (error) throw error;
      if (data?.events?.length) {
        setScrapedEvents(prev => ({
          ...prev,
          [catId]: { ...prev[catId], [url]: data.events },
        }));
        toast.success(`${data.events.length} événement(s) trouvé(s)`);
      } else {
        toast.info("Aucun événement trouvé sur cette page");
        setScrapedEvents(prev => ({
          ...prev,
          [catId]: { ...prev[catId], [url]: [] },
        }));
      }
    } catch (err: any) {
      console.error('Scrape error:', err);
      toast.error("Erreur de scraping: " + (err.message || "Erreur"));
    } finally {
      setScrapingUrls(prev => { const n = new Set(prev); n.delete(key); return n; });
    }
  }, [scrapingUrls]);

  // Fetch templates
  useEffect(() => {
    supabase.from("templates").select("id, name, description, logo_url, contact_info, accueil_horaires, dynamic_insert_after, fixed_pages_count")
      .order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setTemplates(data); });
  }, []);

  // Fetch template pages & brand when template changes
  useEffect(() => {
    if (!selectedTemplate) {
      setTemplatePages([]);
      setBrand(DEFAULT_BRAND);
      return;
    }
    const tpl = templates.find(t => t.id === selectedTemplate);
    if (tpl) {
      const tplBrand = tpl.contact_info?.brand;
      setBrand({
        colors: tplBrand?.colors || DEFAULT_BRAND.colors,
        logoUrl: tplBrand?.logoUrl || tpl.logo_url || "",
      });
    }
    supabase.from("template_pages")
      .select("page_number, title, content_instructions, layout_description, image_urls")
      .eq("template_id", selectedTemplate)
      .order("page_number", { ascending: true })
      .then(({ data }) => { if (data) setTemplatePages(data); });
  }, [selectedTemplate, templates]);

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setCategorySources(s => { const n = { ...s }; delete n[id]; return n; });
      } else {
        next.add(id);
        setCategorySources(s => ({ ...s, [id]: { links: [""], files: [], additionalInfo: "" } }));
      }
      return next;
    });
  };

  const updateCategoryLink = (catId: string, linkIdx: number, value: string) => {
    setCategorySources(prev => ({
      ...prev,
      [catId]: { ...prev[catId], links: prev[catId].links.map((l, i) => i === linkIdx ? value : l) }
    }));
  };

  const addCategoryLink = (catId: string) => {
    setCategorySources(prev => ({
      ...prev,
      [catId]: { ...prev[catId], links: [...prev[catId].links, ""] }
    }));
  };

  const removeCategoryLink = (catId: string, linkIdx: number) => {
    setCategorySources(prev => ({
      ...prev,
      [catId]: { ...prev[catId], links: prev[catId].links.filter((_, i) => i !== linkIdx) }
    }));
  };

  const handleCategoryFiles = (catId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setCategorySources(prev => ({
        ...prev,
        [catId]: { ...prev[catId], files: [...prev[catId].files, ...Array.from(e.target.files!)] }
      }));
    }
  };

  const removeCategoryFile = (catId: string, fileIdx: number) => {
    setCategorySources(prev => ({
      ...prev,
      [catId]: { ...prev[catId], files: prev[catId].files.filter((_, i) => i !== fileIdx) }
    }));
  };

  const updateCategoryInfo = (catId: string, value: string) => {
    setCategorySources(prev => ({
      ...prev,
      [catId]: { ...prev[catId], additionalInfo: value }
    }));
  };

  const formatDateRange = () => {
    const d1 = new Date(dateDebut);
    const d2 = new Date(dateFin);
    return { moisDebut: MONTHS[d1.getMonth()], moisFin: MONTHS[d2.getMonth()], annee: String(d2.getFullYear()) };
  };

  // Build live preview categories with scraped events
  const liveCategories = useMemo(() => {
    return EVENT_CATEGORIES
      .filter(cat => selectedCategories.has(cat.id))
      .map(cat => {
        const src = categorySources[cat.id];
        const catEvents = scrapedEvents[cat.id] || {};
        const allEvents: ScrapedEvent[] = Object.values(catEvents).flat();
        return {
          id: cat.id,
          label: cat.label,
          color: cat.color,
          links: src?.links || [],
          additionalInfo: src?.additionalInfo || "",
          fileCount: src?.files.length || 0,
          events: allEvents,
        };
      });
  }, [selectedCategories, categorySources, scrapedEvents]);

  const selectedTpl = templates.find(t => t.id === selectedTemplate);
  const dynamicInsertAfter = selectedTpl?.dynamic_insert_after || 1;

  const handleGenerate = async () => {
    if (selectedCategories.size === 0) { toast.error("Sélectionnez au moins une catégorie"); return; }
    setIsGenerating(true);
    try {
      const categories: Record<string, { links: string[]; additionalInfo: string }> = {};
      for (const catId of selectedCategories) {
        const src = categorySources[catId];
        categories[catId] = { links: src.links.filter(l => l.trim()), additionalInfo: src.additionalInfo };
      }

      const { data, error } = await supabase.functions.invoke("generate-brochure", {
        body: {
          dateDebut, dateFin, categories,
          templateId: selectedTemplate || undefined,
          brand,
          contactInfo: selectedTpl?.contact_info || {},
          accueilHoraires: (selectedTpl as any)?.accueil_horaires || {},
        },
      });

      if (error) throw error;
      if (data?.pages?.length) {
        setPages(data.pages);
        toast.success(`Brochure générée — ${data.pages.length} pages !`);
      } else {
        toast.error("Aucune page générée");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur: " + (err.message || "Erreur inconnue"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!guideRef.current) return;
    toast.info("Génération du PDF en cours...");
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const pageEls = guideRef.current.querySelectorAll('.guide-page');
      const container = document.createElement('div');
      pageEls.forEach(p => container.appendChild(p.cloneNode(true)));
      const { moisDebut, moisFin, annee } = formatDateRange();
      await html2pdf().set({
        margin: 0,
        filename: `brochure_${moisDebut.toLowerCase()}_${moisFin.toLowerCase()}_${annee}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], before: '.guide-page' },
      }).from(container).save();
      toast.success("PDF téléchargé !");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la génération du PDF");
    }
  };

  const { moisDebut, moisFin, annee } = formatDateRange();

  return (
    <div className="flex gap-6">
      {/* Left panel */}
      <aside className="w-96 flex-shrink-0 space-y-5 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg" style={{ fontFamily: 'Montserrat' }}>Paramètres</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Template select */}
            {templates.length > 0 && (
              <div>
                <label className="text-sm font-semibold">Template</label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un template" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun template</SelectItem>
                    {templates.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Brand colors */}
            <div>
              <label className="text-sm font-semibold flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                Couleurs de marque
              </label>
              <div className="flex gap-2 mt-1.5 items-center">
                {brand.colors.map((c, i) => (
                  <div key={i} className="relative group">
                    <input
                      type="color"
                      value={c}
                      onChange={e => {
                        const next = [...brand.colors];
                        next[i] = e.target.value;
                        setBrand(b => ({ ...b, colors: next }));
                      }}
                      className="w-8 h-8 rounded-full border-2 border-border cursor-pointer appearance-none p-0"
                      style={{ background: c }}
                    />
                  </div>
                ))}
              </div>
              {brand.logoUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={brand.logoUrl} alt="Logo" className="h-8 object-contain rounded" />
                  <span className="text-xs text-muted-foreground">Logo du template</span>
                </div>
              )}
            </div>

            {/* Date range */}
            <div>
              <label className="text-sm font-semibold">Période couverte</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div>
                  <span className="text-xs text-muted-foreground">Début</span>
                  <Input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Fin</span>
                  <Input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} />
                </div>
              </div>
              <div className="mt-2 text-center py-2 rounded-lg" style={{ background: `${brand.colors[0]}15` }}>
                <p className="text-sm font-bold" style={{ fontFamily: 'Montserrat', color: brand.colors[0] }}>
                  {moisDebut} – {moisFin} {annee}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg" style={{ fontFamily: 'Montserrat' }}>Types d'événements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {EVENT_CATEGORIES.map(cat => (
              <div key={cat.id}>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <Checkbox checked={selectedCategories.has(cat.id)} onCheckedChange={() => toggleCategory(cat.id)} />
                  <span className="text-sm font-medium" style={{ color: cat.color }}>{cat.label}</span>
                </label>

                {selectedCategories.has(cat.id) && categorySources[cat.id] && (
                  <div className="ml-6 mt-2 space-y-2 border-l-2 pl-3 pb-2" style={{ borderColor: cat.color }}>
                    <div>
                      <label className="text-xs font-semibold flex items-center gap-1"><LinkIcon className="w-3 h-3" /> Liens web</label>
                      {categorySources[cat.id].links.map((link, li) => (
                        <div key={li} className="flex gap-1 mt-1">
                          <Input value={link} onChange={e => updateCategoryLink(cat.id, li, e.target.value)} placeholder="https://..." className="text-xs h-8" />
                          {categorySources[cat.id].links.length > 1 && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeCategoryLink(cat.id, li)}><Trash2 className="w-3 h-3" /></Button>
                          )}
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" className="text-xs mt-1 h-7" onClick={() => addCategoryLink(cat.id)}><Plus className="w-3 h-3 mr-1" />Ajouter un lien</Button>
                    </div>

                    <div>
                      <label className="text-xs font-semibold flex items-center gap-1"><Upload className="w-3 h-3" /> PDFs / Documents</label>
                      <div className="border border-dashed border-border rounded p-2 text-center cursor-pointer hover:border-primary/50 transition-colors relative mt-1">
                        <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e => handleCategoryFiles(cat.id, e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <p className="text-[10px] text-muted-foreground">PDF, JPG, PNG</p>
                      </div>
                      {categorySources[cat.id].files.map((f, fi) => (
                        <div key={fi} className="text-[10px] flex items-center justify-between bg-muted rounded px-2 py-0.5 mt-1">
                          <span className="truncate">{f.name}</span>
                          <button onClick={() => removeCategoryFile(cat.id, fi)} className="text-destructive ml-1">✕</button>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="text-xs font-semibold">Directives / Infos</label>
                      <Textarea
                        value={categorySources[cat.id].additionalInfo}
                        onChange={e => updateCategoryInfo(cat.id, e.target.value)}
                        placeholder="Ex: 'Inclure tous les marchés du samedi matin' ou coller des infos..."
                        rows={2}
                        className="text-xs mt-1"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3">
          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full text-white font-bold" style={{ background: brand.colors[0], fontFamily: 'Montserrat' }} size="lg">
            {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Génération en cours…</> : <><RefreshCw className="w-4 h-4 mr-2" />Générer la brochure</>}
          </Button>
          {pages && (
            <Button onClick={handleDownload} variant="outline" className="w-full font-bold" style={{ fontFamily: 'Montserrat', borderColor: brand.colors[1], color: brand.colors[1] }} size="lg">
              <Download className="w-4 h-4 mr-2" />Télécharger PDF
            </Button>
          )}
        </div>
      </aside>

      {/* Right panel — live or generated preview */}
      <main className="flex-1 overflow-x-auto">
        {pages ? (
          <BrochurePreview pages={pages} guideRef={guideRef} />
        ) : (
          <LiveBrochurePreview
            dateDebut={dateDebut}
            dateFin={dateFin}
            brand={brand}
            categories={liveCategories}
            templatePages={templatePages}
            dynamicInsertAfter={dynamicInsertAfter}
            contactInfo={selectedTpl?.contact_info || {}}
            accueilHoraires={(selectedTpl as any)?.accueil_horaires || {}}
          />
        )}
      </main>
    </div>
  );
};

export default BrochureGenerator;
