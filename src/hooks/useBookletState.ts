import { useState, useCallback, useRef, useEffect } from "react";
import { EditorElement, BrandConfig, DEFAULT_BRAND, createId, A4_WIDTH, A4_HEIGHT } from "@/components/editor/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BookletPage {
  id: string;
  title: string;
  elements: EditorElement[];
}

export interface AssetItem {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  fileType?: string;
}

export interface BookletSettings {
  templateId: string;
  templateName: string;
  dateDebut: string;
  dateFin: string;
  contactInfo: Record<string, any>;
  accueilHoraires: Record<string, any>;
  charterPdfs: string[];
}

const DEFAULT_SETTINGS: BookletSettings = {
  templateId: "",
  templateName: "",
  dateDebut: new Date().toISOString().slice(0, 10),
  dateFin: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  contactInfo: {},
  accueilHoraires: {},
  charterPdfs: [],
};

const sanitizeFilename = (name: string) =>
  name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");

export function useBookletState() {
  const [pages, setPages] = useState<BookletPage[]>([
    { id: createId(), title: "Couverture", elements: [] },
  ]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [brand, setBrand] = useState<BrandConfig>(DEFAULT_BRAND);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [settings, setSettings] = useState<BookletSettings>(DEFAULT_SETTINGS);
  const [isDirty, setIsDirty] = useState(false);

  // Load assets from DB
  useEffect(() => {
    supabase.from("assets").select("*").order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setAssets(data.map((a: any) => ({
          id: a.id, name: a.name, url: a.url,
          thumbnailUrl: a.thumbnail_url, fileType: a.file_type,
        })));
      });
  }, []);

  const currentPage = pages[currentPageIndex] || pages[0];

  // Page management — no more type distinction
  const addPage = useCallback((title?: string, afterIndex?: number) => {
    const newPage: BookletPage = {
      id: createId(),
      title: title || `Page ${pages.length + 1}`,
      elements: [],
    };
    setPages(prev => {
      const idx = afterIndex !== undefined ? afterIndex + 1 : prev.length;
      const next = [...prev];
      next.splice(idx, 0, newPage);
      return next;
    });
    setIsDirty(true);
    return newPage.id;
  }, [pages.length]);

  const deletePage = useCallback((pageId: string) => {
    setPages(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter(p => p.id !== pageId);
    });
    setCurrentPageIndex(prev => Math.min(prev, pages.length - 2));
    setIsDirty(true);
  }, [pages.length]);

  const duplicatePage = useCallback((pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (!page) return;
    const newPage: BookletPage = {
      ...page,
      id: createId(),
      title: page.title + " (copie)",
      elements: page.elements.map(el => ({ ...el, id: createId() })),
    };
    const idx = pages.findIndex(p => p.id === pageId);
    setPages(prev => {
      const next = [...prev];
      next.splice(idx + 1, 0, newPage);
      return next;
    });
    setIsDirty(true);
  }, [pages]);

  const reorderPages = useCallback((fromIndex: number, toIndex: number) => {
    setPages(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setCurrentPageIndex(toIndex);
    setIsDirty(true);
  }, []);

  const updatePage = useCallback((pageId: string, changes: Partial<BookletPage>) => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, ...changes } : p));
    setIsDirty(true);
  }, []);

  const updateCurrentPageElements = useCallback((elements: EditorElement[]) => {
    setPages(prev => prev.map((p, i) => i === currentPageIndex ? { ...p, elements } : p));
    setIsDirty(true);
  }, [currentPageIndex]);

  // Add elements to current page (for drag-drop from sidebar)
  const addElementsToCurrentPage = useCallback((newElements: EditorElement[]) => {
    setPages(prev => prev.map((p, i) =>
      i === currentPageIndex ? { ...p, elements: [...p.elements, ...newElements] } : p
    ));
    setIsDirty(true);
  }, [currentPageIndex]);

  // Asset management
  const uploadAsset = useCallback(async (file: File): Promise<AssetItem> => {
    const safeName = sanitizeFilename(file.name);
    const path = `assets/${Date.now()}_${safeName}`;
    const { data, error } = await supabase.storage.from("uploads").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(data.path);
    const url = urlData.publicUrl;

    const { data: row, error: dbErr } = await supabase.from("assets").insert({
      name: file.name,
      url,
      file_type: file.type,
    }).select().single();

    if (dbErr) throw dbErr;

    const asset: AssetItem = { id: row.id, name: row.name, url: row.url, fileType: row.file_type };
    setAssets(prev => [asset, ...prev]);
    return asset;
  }, []);

  const deleteAsset = useCallback(async (assetId: string) => {
    await supabase.from("assets").delete().eq("id", assetId);
    setAssets(prev => prev.filter(a => a.id !== assetId));
  }, []);

  // Save to Supabase
  const saveBooklet = useCallback(async () => {
    if (!settings.templateName.trim()) {
      toast.error("Donnez un nom au booklet");
      return;
    }
    try {
      const templateData: any = {
        name: settings.templateName,
        description: "",
        logo_url: brand.logoUrl,
        contact_info: { ...settings.contactInfo, brand },
        accueil_horaires: settings.accueilHoraires,
        fixed_pages_count: pages.length,
        dynamic_insert_after: 1,
        charter_pdfs: settings.charterPdfs,
      };

      let templateId = settings.templateId;
      if (templateId) {
        await supabase.from("templates").update(templateData).eq("id", templateId);
      } else {
        const { data, error } = await supabase.from("templates").insert(templateData).select().single();
        if (error) throw error;
        templateId = data.id;
        setSettings(prev => ({ ...prev, templateId }));
      }

      await supabase.from("template_pages").delete().eq("template_id", templateId);

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        await supabase.from("template_pages").insert({
          template_id: templateId,
          page_number: i + 1,
          title: page.title,
          page_type: "visual",
          layout_json: page.elements as any,
        });
      }

      setIsDirty(false);
      toast.success("Booklet sauvegardé !");
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur: " + (err.message || "Erreur inconnue"));
    }
  }, [pages, brand, settings]);

  // Load from template
  const loadTemplate = useCallback(async (templateId: string) => {
    const { data: tpl } = await supabase.from("templates")
      .select("*").eq("id", templateId).single();
    if (!tpl) return;

    const { data: tplPages } = await supabase.from("template_pages")
      .select("*").eq("template_id", templateId).order("page_number");

    const tplBrand = (tpl.contact_info as any)?.brand;
    if (tplBrand) setBrand(tplBrand);

    setSettings({
      templateId: tpl.id,
      templateName: tpl.name,
      dateDebut: DEFAULT_SETTINGS.dateDebut,
      dateFin: DEFAULT_SETTINGS.dateFin,
      contactInfo: (tpl.contact_info as any) || {},
      accueilHoraires: (tpl.accueil_horaires as any) || {},
      charterPdfs: tpl.charter_pdfs || [],
    });

    if (tplPages && tplPages.length > 0) {
      setPages(tplPages.map((p: any) => ({
        id: createId(),
        title: p.title || `Page ${p.page_number}`,
        elements: Array.isArray(p.layout_json) ? p.layout_json : [],
      })));
      setCurrentPageIndex(0);
    }
  }, []);

  return {
    pages, currentPage, currentPageIndex, setCurrentPageIndex,
    brand, setBrand,
    assets, setAssets, uploadAsset, deleteAsset,
    settings, setSettings,
    addPage, deletePage, duplicatePage, reorderPages, updatePage,
    updateCurrentPageElements, addElementsToCurrentPage,
    saveBooklet, loadTemplate,
    isDirty,
  };
}
