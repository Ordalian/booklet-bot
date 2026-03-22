import { useEffect, useCallback, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEditorState } from "./useEditorState";
import EditorCanvas from "./EditorCanvas";
import EditorToolbar from "./EditorToolbar";
import PropertiesPanel from "./PropertiesPanel";
import BrandPanel from "./BrandPanel";
import LayersPanel from "./LayersPanel";
import { EditorElement, BrandConfig, CANVAS_SCALE } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  initialElements?: EditorElement[];
  initialBrand?: BrandConfig;
  onSave?: (elements: EditorElement[], brand: BrandConfig) => void;
  pageTitle?: string;
}

const sanitizeFilename = (name: string) =>
  name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");

const uploadFile = async (file: File, path: string): Promise<string> => {
  const safePath = path.split("/").map((seg, i, arr) => i === arr.length - 1 ? sanitizeFilename(seg) : seg).join("/");
  const { data, error } = await supabase.storage.from("uploads").upload(safePath, file, { upsert: true });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(data.path);
  return urlData.publicUrl;
};

const VisualEditor = ({ initialElements = [], initialBrand, onSave, pageTitle }: Props) => {
  const {
    elements, selectedId, setSelectedId,
    brandConfig, setBrandConfig,
    addElement, updateElement, deleteElement,
    moveLayer, duplicateElement, undo, redo,
  } = useEditorState(initialElements);

  const [sideTab, setSideTab] = useState("properties");

  useEffect(() => {
    if (initialBrand) setBrandConfig(initialBrand);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.key === "y" && (e.ctrlKey || e.metaKey)) || (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey)) { e.preventDefault(); redo(); }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) { e.preventDefault(); deleteElement(selectedId); }
      }
      if (e.key === "d" && (e.ctrlKey || e.metaKey) && selectedId) { e.preventDefault(); duplicateElement(selectedId); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, undo, redo, deleteElement, duplicateElement]);

  // Auto-save on change
  useEffect(() => {
    onSave?.(elements, brandConfig);
  }, [elements, brandConfig]);

  const handleImageUpload = useCallback(async (file: File) => {
    try {
      const url = await uploadFile(file, `editor/${Date.now()}_${file.name}`);
      const img = new window.Image();
      img.onload = () => {
        const maxW = 300;
        const ratio = img.width / img.height;
        const w = Math.min(img.width, maxW);
        const h = w / ratio;
        addElement("image", { src: url, width: w, height: h });
      };
      img.src = url;
    } catch (err: any) {
      toast.error("Erreur upload: " + err.message);
    }
  }, [addElement]);

  const handleLogoUpload = useCallback(async (file: File) => {
    try {
      const url = await uploadFile(file, `editor/brand/logo_${Date.now()}_${file.name}`);
      setBrandConfig(prev => ({ ...prev, logoUrl: url }));
    } catch (err: any) {
      toast.error("Erreur upload: " + err.message);
    }
  }, [setBrandConfig]);

  const handleAssetUpload = useCallback(async (file: File) => {
    try {
      const url = await uploadFile(file, `editor/brand/asset_${Date.now()}_${file.name}`);
      setBrandConfig(prev => ({ ...prev, additionalAssets: [...prev.additionalAssets, url] }));
    } catch (err: any) {
      toast.error("Erreur upload: " + err.message);
    }
  }, [setBrandConfig]);

  const selectedElement = elements.find(e => e.id === selectedId) || null;

  return (
    <div className="space-y-3">
      {pageTitle && <h3 className="text-sm font-semibold" style={{ fontFamily: "Montserrat" }}>{pageTitle}</h3>}

      <EditorToolbar
        onAdd={(type) => addElement(type)}
        onUndo={undo}
        onRedo={redo}
        onDelete={() => selectedId && deleteElement(selectedId)}
        onDuplicate={() => selectedId && duplicateElement(selectedId)}
        onMoveUp={() => selectedId && moveLayer(selectedId, "up")}
        onMoveDown={() => selectedId && moveLayer(selectedId, "down")}
        hasSelection={!!selectedId}
        onImageUpload={handleImageUpload}
      />

      <div className="flex gap-4">
        {/* Canvas */}
        <div className="flex-1 overflow-auto">
          <EditorCanvas
            elements={elements}
            selectedId={selectedId}
            scale={CANVAS_SCALE}
            onSelect={setSelectedId}
            onTransform={updateElement}
          />
        </div>

        {/* Side panel */}
        <div className="w-64 flex-shrink-0 border border-border rounded-lg bg-card overflow-hidden">
          <Tabs value={sideTab} onValueChange={setSideTab}>
            <TabsList className="w-full grid grid-cols-3 h-9">
              <TabsTrigger value="properties" className="text-xs">Props</TabsTrigger>
              <TabsTrigger value="layers" className="text-xs">Calques</TabsTrigger>
              <TabsTrigger value="brand" className="text-xs">Marque</TabsTrigger>
            </TabsList>
            <TabsContent value="properties" className="m-0">
              <PropertiesPanel element={selectedElement} brandConfig={brandConfig} onChange={updateElement} />
            </TabsContent>
            <TabsContent value="layers" className="m-0">
              <LayersPanel
                elements={elements}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onToggleVisible={id => updateElement(id, { visible: !(elements.find(e => e.id === id)?.visible ?? true) })}
                onToggleLock={id => updateElement(id, { locked: !elements.find(e => e.id === id)?.locked })}
              />
            </TabsContent>
            <TabsContent value="brand" className="m-0">
              <BrandPanel config={brandConfig} onChange={setBrandConfig} onLogoUpload={handleLogoUpload} onAssetUpload={handleAssetUpload} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default VisualEditor;
