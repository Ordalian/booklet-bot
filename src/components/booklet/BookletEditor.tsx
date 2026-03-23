import { useCallback, useEffect, useState } from "react";
import { useBookletState } from "@/hooks/useBookletState";
import { useEditorState } from "@/components/editor/useEditorState";
import EditorCanvas from "@/components/editor/EditorCanvas";
import EditorToolbar from "@/components/editor/EditorToolbar";
import PropertiesPanel from "@/components/editor/PropertiesPanel";
import LayersPanel from "@/components/editor/LayersPanel";
import PageListPanel from "./PageListPanel";
import EventPanel from "./EventPanel";
import AssetLibrary from "./AssetLibrary";
import SettingsPanel from "./SettingsPanel";
import { buildEventTile } from "./buildEventTile";
import { autoLayoutTiles } from "./autoLayoutTiles";
import { Button } from "@/components/ui/button";
import { Save, Download, Loader2, ChevronLeft, ChevronRight, Settings, Layers, Image, Calendar, FileText, Moon, Sun } from "lucide-react";
import { A4_WIDTH, A4_HEIGHT, createId } from "@/components/editor/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const sanitizeFilename = (name: string) =>
  name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");

const ZOOM_LEVELS = [0.35, 0.5, 0.65, 0.8, 1.0];

const BookletEditor = () => {
  const booklet = useBookletState();
  const editor = useEditorState(booklet.currentPage.elements);
  const [leftSection, setLeftSection] = useState<string>("pages");
  const [rightOpen, setRightOpen] = useState(true);
  const [rightTab, setRightTab] = useState<"props" | "layers">("props");
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [gridEnabled, setGridEnabled] = useState(false);
  const [zoom, setZoom] = useState(0.5);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    supabase.from("templates").select("id, name").order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setTemplates(data); });
  }, []);

  useEffect(() => {
    editor.setElements(booklet.currentPage.elements);
    editor.setSelectedId(null);
  }, [booklet.currentPageIndex, booklet.currentPage.id]);

  useEffect(() => {
    if (editor.elements !== booklet.currentPage.elements) {
      booklet.updateCurrentPageElements(editor.elements);
    }
  }, [editor.elements]);

  const handleZoomIn = () => setZoom(z => {
    const idx = ZOOM_LEVELS.indexOf(z);
    return idx < ZOOM_LEVELS.length - 1 ? ZOOM_LEVELS[idx + 1] : z;
  });
  const handleZoomOut = () => setZoom(z => {
    const idx = ZOOM_LEVELS.indexOf(z);
    return idx > 0 ? ZOOM_LEVELS[idx - 1] : z;
  });

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      window.localStorage.setItem("booklet-theme", next ? "dark" : "light");
      return next;
    });
  };

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

  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const jsonStr = e.dataTransfer.getData("application/json");
    if (!jsonStr) return;
    try {
      const { event, catColor, format } = JSON.parse(jsonStr);
      const canvasWrapper = e.currentTarget as HTMLElement;
      const rect = canvasWrapper.getBoundingClientRect();
      const x = Math.max(20, Math.min((e.clientX - rect.left) / zoom - 170, A4_WIDTH - 360));
      const y = Math.max(20, Math.min((e.clientY - rect.top) / zoom - 130, A4_HEIGHT - 280));
      const tileElements = buildEventTile(event, x, y, format, catColor, booklet.brand.colors[0]);
      booklet.addElementsToCurrentPage(tileElements);
      editor.setElements([...booklet.currentPage.elements, ...tileElements]);
      toast.success(`"${event.title}" ajouté à la page`);
    } catch (err) {
      console.error("Drop error:", err);
    }
  }, [booklet, editor, zoom]);

  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleAutoLayout = useCallback(() => {
    const result = autoLayoutTiles(editor.elements);
    if (result.pages.length === 0) return;
    // Apply first page to current
    editor.setElements(result.pages[0]);
    booklet.updateCurrentPageElements(result.pages[0]);
    // Create extra pages if overflow
    for (let i = 1; i < result.pages.length; i++) {
      const pageId = booklet.addPage(`Page auto ${booklet.pages.length + 1}`);
      booklet.updatePage(pageId, { elements: result.pages[i] } as any);
    }
    toast.success(`Auto-layout appliqué${result.pages.length > 1 ? ` (${result.pages.length} pages)` : ""}`);
  }, [editor, booklet]);

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  };

  const handleExportPDF = useCallback(async () => {
    setIsExporting(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const Konva = (await import("konva")).default;
      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [A4_WIDTH, A4_HEIGHT] });
      for (let i = 0; i < booklet.pages.length; i++) {
        if (i > 0) pdf.addPage([A4_WIDTH, A4_HEIGHT]);
        const container = document.createElement("div");
        container.style.position = "absolute";
        container.style.left = "-9999px";
        document.body.appendChild(container);
        const stage = new Konva.Stage({ container, width: A4_WIDTH, height: A4_HEIGHT });
        const layer = new Konva.Layer();
        stage.add(layer);
        layer.add(new Konva.Rect({ x: 0, y: 0, width: A4_WIDTH, height: A4_HEIGHT, fill: "white" }));
        const page = booklet.pages[i];
        const imageElements = page.elements.filter(el => el.type === "image" && el.src && el.visible);
        const loadedImages: Record<string, HTMLImageElement> = {};
        await Promise.allSettled(
          imageElements.map(async (el) => {
            try { loadedImages[el.id] = await loadImage(el.src!); } catch {}
          })
        );
        for (const el of page.elements) {
          if (!el.visible) continue;
          if (el.type === "rect") {
            layer.add(new Konva.Rect({ x: el.x, y: el.y, width: el.width, height: el.height, fill: el.fill, stroke: el.stroke, strokeWidth: el.strokeWidth, rotation: el.rotation, opacity: el.opacity, cornerRadius: el.cornerRadius }));
          } else if (el.type === "text") {
            if (el.textBgEnabled && el.textBgColor) {
              const pad = el.textBgPadding || 8;
              layer.add(new Konva.Rect({ x: el.x - pad, y: el.y - pad, width: el.width + pad * 2, height: (el.height || 40) + pad * 2, fill: el.textBgColor, cornerRadius: el.textBgRadius || 0, rotation: el.rotation, opacity: el.opacity }));
            }
            layer.add(new Konva.Text({ x: el.x, y: el.y, width: el.width, height: el.height || 40, text: el.text, fontSize: el.fontSize, fontFamily: el.fontFamily, fontStyle: el.fontStyle, align: el.textAlign as any, verticalAlign: "middle", fill: el.fill, rotation: el.rotation, opacity: el.opacity }));
          } else if (el.type === "circle") {
            layer.add(new Konva.Circle({ x: el.x + el.width / 2, y: el.y + el.height / 2, radiusX: el.width / 2, radiusY: el.height / 2, fill: el.fill, stroke: el.stroke, strokeWidth: el.strokeWidth, rotation: el.rotation, opacity: el.opacity }));
          } else if (el.type === "line") {
            layer.add(new Konva.Line({ x: el.x, y: el.y, points: el.points || [0, 0, 200, 0], stroke: el.stroke || "#000", strokeWidth: el.strokeWidth || 2, rotation: el.rotation, opacity: el.opacity }));
          } else if (el.type === "image" && loadedImages[el.id]) {
            layer.add(new Konva.Image({ x: el.x, y: el.y, width: el.width, height: el.height, image: loadedImages[el.id], rotation: el.rotation, opacity: el.opacity }));
          }
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
    { id: "settings", icon: Settings, label: "Réglages" },
  ];

  return (
    <div className="h-screen flex flex-col bg-muted/40">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-primary-foreground font-black text-sm" style={{ background: `hsl(var(--guide-orange))` }}>B</div>
          <div>
            <h1 className="font-bold text-sm" style={{ fontFamily: "Montserrat" }}>
              {booklet.settings.templateName || "Nouveau Booklet"}
            </h1>
            <p className="text-[10px] text-muted-foreground">{booklet.pages.length} pages</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={toggleTheme}>
            {isDark ? <Sun className="w-3.5 h-3.5 mr-1" /> : <Moon className="w-3.5 h-3.5 mr-1" />}
            {isDark ? "Mode clair" : "Mode sombre"}
          </Button>
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
            <Save className="w-3.5 h-3.5 mr-1" /> Sauvegarder
          </Button>
          <Button size="sm" className="h-8 text-xs" onClick={handleExportPDF} disabled={isExporting}>
            {isExporting ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-1" />}
            Export PDF
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-72 border-r border-border bg-card flex flex-col overflow-hidden shrink-0">
          <div className="flex border-b border-border shrink-0">
            {sidebarSections.map(s => (
              <button
                key={s.id}
                onClick={() => setLeftSection(s.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[9px] font-medium transition-all ${
                  leftSection === s.id
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <s.icon className="w-4 h-4" />
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto sidebar-scroll p-3">
            {leftSection === "pages" && (
              <PageListPanel
                pages={booklet.pages}
                currentIndex={booklet.currentPageIndex}
                onSelect={booklet.setCurrentPageIndex}
                onAdd={() => booklet.addPage()}
                onDuplicate={booklet.duplicatePage}
                onDelete={booklet.deletePage}
                onReorder={booklet.reorderPages}
              />
            )}
            {leftSection === "events" && <EventPanel />}
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
        <main className="flex-1 flex flex-col overflow-hidden bg-muted/40">
          <div className="shrink-0 px-3 py-2 bg-card/80 backdrop-blur-sm border-b border-border">
            <div className="flex items-center gap-2">
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
                gridEnabled={gridEnabled}
                onToggleGrid={() => setGridEnabled(g => !g)}
                onAutoLayout={handleAutoLayout}
                zoom={zoom}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
              />
            </div>
          </div>

          {/* Drop zone wrapping canvas */}
          <div
            className="flex-1 overflow-auto flex items-start justify-center p-6"
            onDrop={handleCanvasDrop}
            onDragOver={handleCanvasDragOver}
          >
            <EditorCanvas
              elements={editor.elements}
              selectedId={editor.selectedId}
              scale={zoom}
              onSelect={editor.setSelectedId}
              onTransform={editor.updateElement}
              gridEnabled={gridEnabled}
            />
          </div>

          {/* Page nav pill */}
          <div className="shrink-0 flex items-center justify-center gap-2 py-2 border-t border-border bg-card/80 backdrop-blur-sm">
            <Button
              variant="ghost" size="icon" className="h-7 w-7 rounded-full"
              disabled={booklet.currentPageIndex === 0}
              onClick={() => booklet.setCurrentPageIndex(booklet.currentPageIndex - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1.5 bg-muted px-3 py-1 rounded-full">
              <span className="text-xs font-semibold">{booklet.currentPageIndex + 1}</span>
              <span className="text-[10px] text-muted-foreground">/</span>
              <span className="text-xs text-muted-foreground">{booklet.pages.length}</span>
              <span className="text-[10px] text-muted-foreground ml-1">— {booklet.currentPage.title}</span>
            </div>
            <Button
              variant="ghost" size="icon" className="h-7 w-7 rounded-full"
              disabled={booklet.currentPageIndex >= booklet.pages.length - 1}
              onClick={() => booklet.setCurrentPageIndex(booklet.currentPageIndex + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </main>

        {/* Right panel */}
        {rightOpen && (
          <aside className="w-60 border-l border-border bg-card overflow-y-auto shrink-0 sidebar-scroll">
            <div className="flex border-b border-border">
              <button
                onClick={() => setRightTab("props")}
                className={`flex-1 py-2.5 text-[10px] font-semibold transition-all ${rightTab === "props" ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"}`}
              >
                Propriétés
              </button>
              <button
                onClick={() => setRightTab("layers")}
                className={`flex-1 py-2.5 text-[10px] font-semibold transition-all ${rightTab === "layers" ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"}`}
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

        <button
          onClick={() => setRightOpen(!rightOpen)}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-card border border-border rounded-l-md p-1 hover:bg-muted z-10 transition-all"
          style={{ right: rightOpen ? "240px" : 0 }}
        >
          {rightOpen ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </div>
    </div>
  );
};

export default BookletEditor;
