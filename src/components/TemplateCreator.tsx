import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Save, Loader2, Image as ImageIcon, Paintbrush, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import VisualEditor from "./editor/VisualEditor";
import { EditorElement, BrandConfig, DEFAULT_BRAND } from "./editor/types";

interface PageDefinition {
  page_number: number;
  title: string;
  content_instructions: string;
  layout_description: string;
  images: File[];
  imageUrls: string[];
  layoutElements: EditorElement[];
}

const TemplateCreator = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [contactInfo, setContactInfo] = useState({ telephone: "", email: "", adresse: "", site_web: "" });
  const [horaires, setHoraires] = useState("");
  const [pointsAccueil, setPointsAccueil] = useState("");
  const [fixedPagesCount, setFixedPagesCount] = useState(4);
  const [dynamicInsertAfter, setDynamicInsertAfter] = useState(1);
  const [pages, setPages] = useState<PageDefinition[]>([
    { page_number: 1, title: "Couverture", content_instructions: "", layout_description: "", images: [], imageUrls: [], layoutElements: [] },
    { page_number: 2, title: "Page 2", content_instructions: "", layout_description: "", images: [], imageUrls: [], layoutElements: [] },
    { page_number: 3, title: "Page 3", content_instructions: "", layout_description: "", images: [], imageUrls: [], layoutElements: [] },
    { page_number: 4, title: "Dernière page", content_instructions: "", layout_description: "", images: [], imageUrls: [], layoutElements: [] },
  ]);
  const [charterPdfs, setCharterPdfs] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [brandConfig, setBrandConfig] = useState<BrandConfig>(DEFAULT_BRAND);
  const [activePageEditor, setActivePageEditor] = useState<number | null>(null);

  const updatePagesCount = (count: number) => {
    const clamped = Math.max(2, Math.min(20, count));
    setFixedPagesCount(clamped);
    setPages(prev => {
      if (clamped > prev.length) {
        const newPages = [...prev];
        for (let i = prev.length; i < clamped; i++) {
          newPages.push({ page_number: i + 1, title: `Page ${i + 1}`, content_instructions: "", layout_description: "", images: [], imageUrls: [], layoutElements: [] });
        }
        return newPages;
      }
      return prev.slice(0, clamped);
    });
    if (dynamicInsertAfter >= clamped) setDynamicInsertAfter(Math.max(1, clamped - 1));
  };

  const updatePage = (index: number, field: keyof PageDefinition, value: any) => {
    setPages(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const handlePageImages = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setPages(prev => prev.map((p, i) => i === index ? { ...p, images: [...p.images, ...newFiles] } : p));
    }
  };

  const removePageImage = (pageIndex: number, imgIndex: number) => {
    setPages(prev => prev.map((p, i) => i === pageIndex ? { ...p, images: p.images.filter((_, j) => j !== imgIndex) } : p));
  };

  const sanitizeFilename = (name: string) =>
    name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const safePath = path.split("/").map((seg, i, arr) => i === arr.length - 1 ? sanitizeFilename(seg) : seg).join("/");
    const { data, error } = await supabase.storage.from("uploads").upload(safePath, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Donnez un nom au template"); return; }
    setIsSaving(true);
    try {
      const timestamp = Date.now();
      let logoUrl = brandConfig.logoUrl || "";
      if (logoFile) {
        logoUrl = await uploadFile(logoFile, `templates/${timestamp}/logo_${logoFile.name}`);
      }

      const charterUrls: string[] = [];
      for (const pdf of charterPdfs) {
        const url = await uploadFile(pdf, `templates/${timestamp}/charter_${pdf.name}`);
        charterUrls.push(url);
      }

      const { data: template, error: tErr } = await supabase.from("templates").insert({
        name,
        description,
        logo_url: logoUrl,
        contact_info: { ...contactInfo, horaires, points_accueil: pointsAccueil, brand: brandConfig },
        accueil_horaires: { horaires, points_accueil: pointsAccueil },
        fixed_pages_count: fixedPagesCount,
        dynamic_insert_after: dynamicInsertAfter,
        charter_pdfs: charterUrls,
      }).select().single();

      if (tErr) throw tErr;

      for (const page of pages) {
        const imageUrls: string[] = [];
        for (const img of page.images) {
          const url = await uploadFile(img, `templates/${timestamp}/page${page.page_number}_${img.name}`);
          imageUrls.push(url);
        }

        const { error: pErr } = await supabase.from("template_pages").insert({
          template_id: template.id,
          page_number: page.page_number,
          title: page.title,
          content_instructions: page.content_instructions,
          image_urls: imageUrls,
          layout_description: page.layout_description,
          layout_json: page.layoutElements as any,
        });
        if (pErr) throw pErr;
      }

      toast.success("Template sauvegardé !");
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur: " + (err.message || "Erreur inconnue"));
    } finally {
      setIsSaving(false);
    }
  };

  // If a page editor is open, show the full visual editor
  if (activePageEditor !== null) {
    const page = pages[activePageEditor];
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setActivePageEditor(null)}>← Retour</Button>
            <h2 className="font-semibold text-base" style={{ fontFamily: "Montserrat" }}>
              Éditeur visuel — {page.title}
            </h2>
          </div>
        </div>
        <VisualEditor
          initialElements={page.layoutElements}
          initialBrand={brandConfig}
          pageTitle={`Page ${page.page_number}: ${page.title}`}
          onSave={(elements, brand) => {
            updatePage(activePageEditor, "layoutElements", elements);
            setBrandConfig(brand);
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Basic info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg" style={{ fontFamily: 'Montserrat' }}>Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-semibold">Nom du template *</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Guide des Animations Mensuel" />
          </div>
          <div>
            <label className="text-sm font-semibold">Description</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Décrivez l'usage de ce template..." rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Contact info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg" style={{ fontFamily: 'Montserrat' }}>Infos de contact & Accueil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold">Téléphone</label>
              <Input value={contactInfo.telephone} onChange={e => setContactInfo(p => ({ ...p, telephone: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-semibold">Email</label>
              <Input value={contactInfo.email} onChange={e => setContactInfo(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-semibold">Adresse</label>
              <Input value={contactInfo.adresse} onChange={e => setContactInfo(p => ({ ...p, adresse: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-semibold">Site web</label>
              <Input value={contactInfo.site_web} onChange={e => setContactInfo(p => ({ ...p, site_web: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold">Points d'accueil</label>
            <Textarea value={pointsAccueil} onChange={e => setPointsAccueil(e.target.value)} placeholder="Listez les points d'accueil..." rows={2} />
          </div>
          <div>
            <label className="text-sm font-semibold">Horaires</label>
            <Textarea value={horaires} onChange={e => setHoraires(e.target.value)} placeholder="Horaires d'ouverture..." rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Page structure */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg" style={{ fontFamily: 'Montserrat' }}>Structure des pages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold">Nombre de pages fixes</label>
              <Input type="number" min={2} max={20} value={fixedPagesCount} onChange={e => updatePagesCount(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-sm font-semibold">Insérer le contenu dynamique après la page</label>
              <Input type="number" min={1} max={fixedPagesCount - 1} value={dynamicInsertAfter} onChange={e => setDynamicInsertAfter(Number(e.target.value))} />
              <p className="text-xs text-muted-foreground mt-1">Les événements seront insérés entre la page {dynamicInsertAfter} et {dynamicInsertAfter + 1}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per-page content */}
      {pages.map((page, idx) => (
        <Card key={idx} className="border-l-4" style={{ borderLeftColor: idx < dynamicInsertAfter ? 'hsl(var(--guide-orange))' : idx === dynamicInsertAfter ? 'hsl(var(--guide-blue))' : 'hsl(var(--guide-green))' }}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base" style={{ fontFamily: 'Montserrat' }}>
                Page {page.page_number}
                {idx === dynamicInsertAfter && <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--guide-blue) / 0.15)', color: 'hsl(var(--guide-blue))' }}>↓ Contenu dynamique inséré ici</span>}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 text-xs"
                onClick={() => setActivePageEditor(idx)}
              >
                <Paintbrush className="w-3.5 h-3.5" />
                Éditeur visuel
                {page.layoutElements.length > 0 && (
                  <span className="ml-1 bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[10px]">
                    {page.layoutElements.length}
                  </span>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-semibold">Titre de la page</label>
              <Input value={page.title} onChange={e => updatePage(idx, "title", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-semibold">Contenu / Instructions</label>
              <Textarea value={page.content_instructions} onChange={e => updatePage(idx, "content_instructions", e.target.value)} placeholder="Décrivez le contenu de cette page..." rows={3} />
            </div>
            <div>
              <label className="text-sm font-semibold">Mise en page (description textuelle)</label>
              <Textarea value={page.layout_description} onChange={e => updatePage(idx, "layout_description", e.target.value)} placeholder="Décrivez où le texte et les images doivent aller..." rows={2} />
            </div>
            <div>
              <label className="text-sm font-semibold flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" style={{ color: 'hsl(var(--guide-green))' }} />
                Images
              </label>
              <div className="border-2 border-dashed border-border rounded-lg p-3 text-center cursor-pointer hover:border-primary/50 transition-colors relative">
                <input type="file" multiple accept="image/*" onChange={e => handlePageImages(idx, e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                <Upload className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">Ajoutez des photos pour cette page</p>
              </div>
              {page.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {page.images.map((img, imgIdx) => (
                    <div key={imgIdx} className="relative group">
                      <img src={URL.createObjectURL(img)} alt="" className="w-16 h-16 object-cover rounded" />
                      <button onClick={() => removePageImage(idx, imgIdx)} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Charter PDFs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg" style={{ fontFamily: 'Montserrat' }}>Charte graphique (PDFs de référence)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Uploadez jusqu'à 10 PDFs pour que l'IA reproduise le style visuel</p>
          <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors relative">
            <input type="file" multiple accept=".pdf" onChange={e => { if (e.target.files) setCharterPdfs(prev => [...prev, ...Array.from(e.target.files!)].slice(0, 10)); }} className="absolute inset-0 opacity-0 cursor-pointer" />
            <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
            <p className="text-sm text-muted-foreground">PDF de charte graphique ({charterPdfs.length}/10)</p>
          </div>
          {charterPdfs.length > 0 && (
            <div className="space-y-1">
              {charterPdfs.map((f, i) => (
                <div key={i} className="text-xs flex items-center justify-between bg-muted rounded px-2 py-1">
                  <span className="truncate">{f.name}</span>
                  <button onClick={() => setCharterPdfs(prev => prev.filter((_, j) => j !== i))} className="text-destructive hover:underline ml-2">✕</button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save */}
      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full text-white font-bold"
        style={{ background: 'hsl(var(--guide-orange))', fontFamily: 'Montserrat' }}
        size="lg"
      >
        {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sauvegarde en cours…</> : <><Save className="w-4 h-4 mr-2" />Sauvegarder le Template</>}
      </Button>
    </div>
  );
};

export default TemplateCreator;
