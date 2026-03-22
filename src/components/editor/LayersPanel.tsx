import { EditorElement } from "./types";
import { Eye, EyeOff, Lock, Unlock, Type, Square, Circle, Minus, Image } from "lucide-react";

interface Props {
  elements: EditorElement[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onToggleLock: (id: string) => void;
}

const ICONS: Record<string, any> = {
  text: Type,
  rect: Square,
  circle: Circle,
  line: Minus,
  image: Image,
};

const LayersPanel = ({ elements, selectedId, onSelect, onToggleVisible, onToggleLock }: Props) => {
  return (
    <div className="p-3 space-y-1 text-sm">
      <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">Calques</h3>
      {elements.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">Aucun élément</p>
      )}
      {[...elements].reverse().map(el => {
        const Icon = ICONS[el.type] || Square;
        const isSelected = el.id === selectedId;
        return (
          <div
            key={el.id}
            onClick={() => onSelect(el.id)}
            className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors text-xs ${
              isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"
            }`}
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="flex-1 truncate">{el.name || el.type}</span>
            <button
              onClick={e => { e.stopPropagation(); onToggleVisible(el.id); }}
              className="p-0.5 hover:bg-muted rounded"
            >
              {el.visible !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-muted-foreground" />}
            </button>
            <button
              onClick={e => { e.stopPropagation(); onToggleLock(el.id); }}
              className="p-0.5 hover:bg-muted rounded"
            >
              {el.locked ? <Lock className="w-3 h-3 text-muted-foreground" /> : <Unlock className="w-3 h-3" />}
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default LayersPanel;
