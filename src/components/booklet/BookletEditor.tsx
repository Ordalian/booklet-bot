import { useCallback, useEffect, useState } from "react";
import { useBookletState } from "@/hooks/useBookletState";
import { useEditorState } from "@/components/editor/useEditorState";
import EditorCanvas from "@/components/editor/EditorCanvas";
import EditorToolbar from "@/components/editor/EditorToolbar";
import PropertiesPanel from "@/components/editor/PropertiesPanel";
import LayersPanel from "@/components/editor/LayersPanel";
import PageListPanel from "./PageListPanel";
import EventPanel, { ScrapedEvent } from "./EventPanel";
import AssetLibrary from "./AssetLibrary";
import SettingsPanel from "./SettingsPanel";
import { paginateEvents } from "./eventPagination";
import { Button } from "@/components/ui/button";
import { Save, Download, Loader2, ChevronLeft, ChevronRight, Settings, Layers, Image, Calendar, FileText } from "lucide-react";
import { CANVAS_SCALE, A4_WIDTH, A4_HEIGHT, createId } from "@/components/editor/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const EVENT_CATEGORIES_MAP: Record<string, { label: string; color: string }> = {
  culture: { label: "Culture et Exposition", color: "#2563eb" },
  evenementiel: { label: "Événementiel", color: "#E85D04" },
  nature: { label: "Nature", color: "#16a34a" },
  famille: { label: "Famille et enfants", color: "#E8A838" },
  spectacles: { label: "Spectacles", color: "#9B59B6" },
  brocantes: { label: "Brocantes", color: "#8B7355" },
};

const sanitizeFilename = (name: string) =>
  name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");

const BookletEditor = () => {
  const booklet = useBookletState();
  const editor = useEditorState(booklet.currentPage.elements);
  const [leftSection, setLeftSection] = useState<string>("pages");
  const [rightOpen, setRightOpen] = useState(true);
  const [rightTab, setRightTab] = useState<"props" | "layers">("props");
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Load templates list
  useEffect(() => {
    supabase.from("templates").select("id, name").order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setTemplates(data); });
  }, []);

  // Sync editor elements ↔ booklet page when switching pages
  useEffect(() => {
    editor.setElements(booklet.currentPage.elements);
    editor.setSelectedId(null);
  }, [booklet.currentPageIndex, booklet.currentPage.id]);

  // Sync editor changes back to booklet
  useEffect(() => {
    if (editor.elements !== booklet.currentPage.elements) {
      booklet.updateCurrentPageElements(editor.elements);
    }
  }, [editor.elements]);

  const handleImageUpload = useCallback(async (file: File) => {
    try {
      const asset = await booklet.uploadAsset(file);
      const img = new window.Image();
      img.onload = () => {
        const maxW = 300;
        const ratio = img.width / img.height;
        const w = Math.min(img.width, maxW);
        const h = w / ratio;
        editor.addElement("image", { src: asset.url, width: w, height: h });
      };
      img.src = asset.url;
    } catch (err: any) {
      toast.error("Erreur upload: " + err.message);
    }
  }, [booklet, editor]);

  const handleLogoUpload = useCallback(async (file: File) => {
    try {
      const safeName = sanitizeFilename(file.name);
      const path = `brand/logo_${Date.now()}_${safeName}`;
      const { data, error } = await supabase.storage.from("uploads").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(data.path);
      booklet.setBrand(prev => ({ ...prev, logoUrl: urlData.publicUrl }));
    } catch (err: any) {
      toast.error("Erreur: " + err.message);
    }
  }, [booklet]);

  const handleInsertAsset = useCallback((url: string) => {
    editor.addElement("image", { src: url, width: 200, height: 150 });
  }, [editor]);

  const handleGenerateEventPages = useCallback((events: Record<string, ScrapedEvent[]>) => {
    const categories = Object.entries(events).map(([id, evts]) => ({
      id,
      label: EVENT_CATEGORIES_MAP[id]?.label || id,
      color: EVENT_CATEGORIES_MAP[id]?.color || "#333",
      events: evts,
    }));

    const paginatedElements = paginateEvents(categories, booklet.brand);

    // Add event pages after current position
    for (let i = 0; i < paginatedElements.length; i++) {
      const pageId = booklet.addPage("event", `${categories[0]?.label || "Événements"} (${i + 1})`);
      booklet.updatePage(pageId, { elements: paginatedElements[i] });
    }
  }, [booklet]);

  const handleExportPDF = useCallback(async () => {
    setIsExporting(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const Konva = (await import("konva")).default;

      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [A4_WIDTH, A4_HEIGHT] });

      for (let i = 0; i < booklet.pages.length; i++) {
        if (i > 0) pdf.addPage([A4_WIDTH, A4_HEIGHT]);

        // Create offscreen stage
        const container = document.createElement("div");
        container.style.position = "absolute";
        container.style.left = "-9999px";
        document.body.appendChild(container);

        const stage = new Konva.Stage({ container, width: A4_WIDTH, height: A4_HEIGHT });
        const layer = new Konva.Layer();
        stage.add(layer);

        // White background
        layer.add(new Konva.Rect({ x: 0, y: 0, width: A4_WIDTH, height: A4_HEIGHT, fill: "white" }));

        const page = booklet.pages[i];
        for (const el of page.elements) {
          if (!el.visible) continue;
          if (el.type === "rect") {
            layer.add(new Konva.Rect({
              x: el.x, y: el.y, width: el.width, height: el.height,
              fill: el.fill, stroke: el.stroke, strokeWidth: el.strokeWidth,
              rotation: el.rotation, opacity: el.opacity, cornerRadius: el.cornerRadius,
            }));
          } else if (el.type === "text") {
            layer.add(new Konva.Text({
              x: el.x, y: el.y, width: el.width,
              text: el.text, fontSize: el.fontSize, fontFamily: el.fontFamily,
              fontStyle: el.fontStyle, align: el.textAlign as any,
              fill: el.fill, rotation: el.rotation, opacity: el.opacity,
            }));
          } else if (el.type === "circle") {
            layer.add(new Konva.Circle({
              x: el.x + el.width / 2, y: el.y + el.height / 2,
              radiusX: el.width / 2, radiusY: el.height / 2,
              fill: el.fill, stroke: el.stroke, strokeWidth: el.strokeWidth,
              rotation: el.rotation, opacity: el.opacity,
            }));
          } else if (el.type === "line") {
            layer.add(new Konva.Line({
              x: el.x, y: el.y,
              points: el.points || [0, 0, 200, 0],
              stroke: el.stroke || "#000", strokeWidth: el.strokeWidth || 2,
              rotation: el.rotation, opacity: el.opacity,
            }));
          }
          // Images are harder in offscreen — skip for now, use toDataURL fallback
        }

        layer.draw();
        const dataUrl = stage.toDataURL({ pixelRatio: 2 });
        pdf.addImage(dataUrl, "PNG", 0, 0, A4_WIDTH, A4_HEIGHT);

        stage.destroy();
        container.remove();
      }

      pdf.save(`${booklet.settings.templateName || "booklet"}.pdf`);
      toast.success("PDF exporté !");
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur export: " + err.message);
    } finally {
      setIsExporting(false);
    }
  }, [booklet]);

  const selectedElement = editor.elements.find(e => e.id === editor.selectedId) || null;

  const sidebarSections = [
    { id: "pages", icon: FileText, label: "Pages" },
    { id: "events", icon: Calendar, label: "Événements" },
    { id: "assets", icon: Image, label: "Assets" },
    { id: "settings", icon: Settings, label: "Paramètres" },
  ];

  return (
    <div className="h-[calc(100vh-60px)] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <img src="/images/logo.png" alt="OT" className="h-8" />
          <div>
            <h1 className="font-bold text-sm" style={{ fontFamily: "Montserrat", color: "hsl(var(--guide-orange))" }}>
              {booklet.settings.templateName || "Nouveau Booklet"}
            </h1>
            <p className="text-[10px] text-muted-foreground">{booklet.pages.length} pages</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Template loader */}
          {templates.length > 0 && (
            <Select onValueChange={id => booklet.loadTemplate(id)}>
              <SelectTrigger className="h-8 text-xs w-44">
                <SelectValue placeholder="Charger un template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={booklet.saveBooklet}>
            <Save className="w-3.5 h-3.5 mr-1" />
            Sauvegarder
          </Button>
          <Button size="sm" className="h-8 text-xs" onClick={handleExportPDF} disabled={isExporting}>
            {isExporting ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-1" />}
            Export PDF
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-64 border-r border-border bg-card flex flex-col overflow-hidden shrink-0">
          {/* Section tabs */}
          <div className="flex border-b border-border shrink-0">
            {sidebarSections.map(s => (
              <button
                key={s.id}
                onClick={() => setLeftSection(s.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[9px] transition-colors ${
                  leftSection === s.id ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <s.icon className="w-3.5 h-3.5" />
                {s.label}
              </button>
            ))}
          </div>

          {/* Section content */}
          <div className="flex-1 overflow-y-auto p-2">
            {leftSection === "pages" && (
              <PageListPanel
                pages={booklet.pages}
                currentIndex={booklet.currentPageIndex}
                onSelect={booklet.setCurrentPageIndex}
                onAdd={type => booklet.addPage(type)}
                onDuplicate={booklet.duplicatePage}
                onDelete={booklet.deletePage}
                onReorder={booklet.reorderPages}
              />
            )}
            {leftSection === "events" && (
              <EventPanel onGeneratePages={handleGenerateEventPages} />
            )}
            {leftSection === "assets" && (
              <AssetLibrary
                assets={booklet.assets}
                onUpload={booklet.uploadAsset}
                onDelete={booklet.deleteAsset}
                onInsert={handleInsertAsset}
              />
            )}
            {leftSection === "settings" && (
              <SettingsPanel
                brand={booklet.brand}
                onBrandChange={booklet.setBrand}
                settings={booklet.settings}
                onSettingsChange={booklet.setSettings}
                onLogoUpload={handleLogoUpload}
              />
            )}
          </div>
        </aside>

        {/* Center canvas */}
        <main className="flex-1 flex flex-col overflow-hidden bg-muted/20">
          {/* Toolbar */}
          <div className="shrink-0 px-3 py-2">
            <EditorToolbar
              onAdd={type => editor.addElement(type)}
              onUndo={editor.undo}
              onRedo={editor.redo}
              onDelete={() => editor.selectedId && editor.deleteElement(editor.selectedId)}
              onDuplicate={() => editor.selectedId && editor.duplicateElement(editor.selectedId)}
              onMoveUp={() => editor.selectedId && editor.moveLayer(editor.selectedId, "up")}
              onMoveDown={() => editor.selectedId && editor.moveLayer(editor.selectedId, "down")}
              hasSelection={!!editor.selectedId}
              onImageUpload={handleImageUpload}
            />
          </div>

          {/* Canvas area */}
          <div className="flex-1 overflow-auto flex items-start justify-center p-4">
            <EditorCanvas
              elements={editor.elements}
              selectedId={editor.selectedId}
              scale={CANVAS_SCALE}
              onSelect={editor.setSelectedId}
              onTransform={editor.updateElement}
            />
          </div>

          {/* Page indicator */}
          <div className="shrink-0 flex items-center justify-center gap-3 py-2 border-t border-border bg-card">
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              disabled={booklet.currentPageIndex === 0}
              onClick={() => booklet.setCurrentPageIndex(booklet.currentPageIndex - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-medium">
              Page {booklet.currentPageIndex + 1} / {booklet.pages.length}
              <span className="ml-2 text-muted-foreground">— {booklet.currentPage.title}</span>
            </span>
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              disabled={booklet.currentPageIndex >= booklet.pages.length - 1}
              onClick={() => booklet.setCurrentPageIndex(booklet.currentPageIndex + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </main>

        {/* Right panel */}
        {rightOpen && (
          <aside className="w-56 border-l border-border bg-card overflow-y-auto shrink-0">
            <div className="flex border-b border-border">
              <button
                onClick={() => setRightTab("props")}
                className={`flex-1 py-2 text-[10px] font-medium ${rightTab === "props" ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
              >
                Propriétés
              </button>
              <button
                onClick={() => setRightTab("layers")}
                className={`flex-1 py-2 text-[10px] font-medium ${rightTab === "layers" ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
              >
                Calques
              </button>
            </div>
            {rightTab === "props" && (
              <PropertiesPanel element={selectedElement} brandConfig={booklet.brand} onChange={editor.updateElement} />
            )}
            {rightTab === "layers" && (
              <LayersPanel
                elements={editor.elements}
                selectedId={editor.selectedId}
                onSelect={editor.setSelectedId}
                onToggleVisible={id => editor.updateElement(id, { visible: !(editor.elements.find(e => e.id === id)?.visible ?? true) })}
                onToggleLock={id => editor.updateElement(id, { locked: !editor.elements.find(e => e.id === id)?.locked })}
              />
            )}
          </aside>
        )}

        {/* Toggle right panel */}
        <button
          onClick={() => setRightOpen(!rightOpen)}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-card border border-border rounded-l-md p-1 hover:bg-muted z-10"
          style={{ right: rightOpen ? "224px" : 0 }}
        >
          {rightOpen ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </div>
    </div>
  );
};

export default BookletEditor;
