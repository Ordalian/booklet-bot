import { Button } from "@/components/ui/button";
import { Type, Square, Circle, Minus, ImagePlus, Undo2, Redo2, Trash2, Copy, ArrowUp, ArrowDown, Grid3X3, ZoomIn, ZoomOut, LayoutGrid } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

interface Props {
  onAdd: (type: "text" | "rect" | "circle" | "line" | "image") => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  hasSelection: boolean;
  onImageUpload: (file: File) => void;
  gridEnabled?: boolean;
  onToggleGrid?: () => void;
  onAutoLayout?: () => void;
  zoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

const tools = [
  { type: "text" as const, icon: Type, label: "Texte (T)" },
  { type: "rect" as const, icon: Square, label: "Rectangle (R)" },
  { type: "circle" as const, icon: Circle, label: "Cercle (C)" },
  { type: "line" as const, icon: Minus, label: "Ligne (L)" },
] as const;

const EditorToolbar = ({
  onAdd, onUndo, onRedo, onDelete, onDuplicate, onMoveUp, onMoveDown,
  hasSelection, onImageUpload, gridEnabled, onToggleGrid, onAutoLayout,
  zoom, onZoomIn, onZoomOut,
}: Props) => {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-1 flex-wrap">
        {/* Shapes group */}
        <div className="flex items-center gap-0.5 bg-muted/50 rounded-md px-1 py-0.5">
          <span className="text-[8px] text-muted-foreground font-semibold uppercase px-1">Formes</span>
          {tools.map(t => (
            <Tooltip key={t.type}>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAdd(t.type)}>
                  <t.icon className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{t.label}</TooltipContent>
            </Tooltip>
          ))}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 relative">
                <ImagePlus className="w-3.5 h-3.5" />
                <input
                  type="file" accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={e => { const f = e.target.files?.[0]; if (f) onImageUpload(f); e.target.value = ""; }}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Image</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        {/* View group */}
        <div className="flex items-center gap-0.5 bg-muted/50 rounded-md px-1 py-0.5">
          <span className="text-[8px] text-muted-foreground font-semibold uppercase px-1">Vue</span>
          {onToggleGrid && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant={gridEnabled ? "secondary" : "ghost"} size="icon" className="h-7 w-7" onClick={onToggleGrid}>
                  <Grid3X3 className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Grille {gridEnabled ? "ON" : "OFF"}</TooltipContent>
            </Tooltip>
          )}
          {onZoomOut && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onZoomOut}>
                  <ZoomOut className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Zoom -</TooltipContent>
            </Tooltip>
          )}
          {zoom !== undefined && (
            <span className="text-[10px] font-mono text-muted-foreground min-w-[32px] text-center">{Math.round(zoom * 100)}%</span>
          )}
          {onZoomIn && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onZoomIn}>
                  <ZoomIn className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Zoom +</TooltipContent>
            </Tooltip>
          )}
        </div>

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        {/* Actions group */}
        <div className="flex items-center gap-0.5 bg-muted/50 rounded-md px-1 py-0.5">
          <span className="text-[8px] text-muted-foreground font-semibold uppercase px-1">Actions</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onUndo}>
                <Undo2 className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Annuler (Ctrl+Z)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRedo}>
                <Redo2 className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Refaire (Ctrl+Y)</TooltipContent>
          </Tooltip>
          {onAutoLayout && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-[10px] px-2" onClick={onAutoLayout}>
                  <LayoutGrid className="w-3 h-3 mr-1" /> Auto-Layout
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Réorganiser les tuiles automatiquement</TooltipContent>
            </Tooltip>
          )}
        </div>

        {hasSelection && (
          <>
            <Separator orientation="vertical" className="h-5 mx-0.5" />
            <div className="flex items-center gap-0.5 bg-muted/50 rounded-md px-1 py-0.5">
              <span className="text-[8px] text-muted-foreground font-semibold uppercase px-1">Sélection</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDuplicate}>
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Dupliquer (Ctrl+D)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMoveUp}>
                    <ArrowUp className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Monter</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMoveDown}>
                    <ArrowDown className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Descendre</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Supprimer (Del)</TooltipContent>
              </Tooltip>
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  );
};

export default EditorToolbar;
