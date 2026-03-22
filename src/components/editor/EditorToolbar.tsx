import { Button } from "@/components/ui/button";
import { Type, Square, Circle, Minus, ImagePlus, Undo2, Redo2, Trash2, Copy, ArrowUp, ArrowDown } from "lucide-react";
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
}

const tools = [
  { type: "text" as const, icon: Type, label: "Texte" },
  { type: "rect" as const, icon: Square, label: "Rectangle" },
  { type: "circle" as const, icon: Circle, label: "Cercle" },
  { type: "line" as const, icon: Minus, label: "Ligne" },
] as const;

const EditorToolbar = ({ onAdd, onUndo, onRedo, onDelete, onDuplicate, onMoveUp, onMoveDown, hasSelection, onImageUpload }: Props) => {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-1 p-2 bg-card border border-border rounded-lg flex-wrap">
        {tools.map(t => (
          <Tooltip key={t.type}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAdd(t.type)}>
                <t.icon className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t.label}</TooltipContent>
          </Tooltip>
        ))}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 relative">
              <ImagePlus className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) onImageUpload(f);
                  e.target.value = "";
                }}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Image</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onUndo}>
              <Undo2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Annuler (Ctrl+Z)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRedo}>
              <Redo2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Refaire (Ctrl+Y)</TooltipContent>
        </Tooltip>

        {hasSelection && (
          <>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDuplicate}>
                  <Copy className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Dupliquer</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onMoveUp}>
                  <ArrowUp className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Monter</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onMoveDown}>
                  <ArrowDown className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Descendre</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Supprimer</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </TooltipProvider>
  );
};

export default EditorToolbar;
