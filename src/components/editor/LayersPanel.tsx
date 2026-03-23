import { EditorElement } from "./types";
import { Eye, EyeOff, Lock, Unlock, Type, Square, Circle, Minus, Image, Package, Save } from "lucide-react";
import { toast } from "sonner";

interface Props {
  elements: EditorElement[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onToggleLock: (id: string) => void;
  onSaveGroupAsAsset?: (groupId: string, name: string, elements: EditorElement[]) => void;
}

const ICONS: Record<string, any> = {
  text: Type,
  rect: Square,
  circle: Circle,
  line: Minus,
  image: Image,
};

interface LayerItem {
  id: string; // id of the first element (used for selection)
  type: string;
  name: string;
  visible: boolean;
  locked: boolean;
  isGroup: boolean;
  groupId?: string;
  elementIds: string[];
}

function buildLayerItems(elements: EditorElement[]): LayerItem[] {
  const items: LayerItem[] = [];
  const seenGroups = new Set<string>();

  for (const el of [...elements].reverse()) {
    if (el.groupId) {
      if (seenGroups.has(el.groupId)) continue;
      seenGroups.add(el.groupId);
      const groupEls = elements.filter(e => e.groupId === el.groupId);
      // Use the tile-title element's text for name, or fallback
      const titleEl = groupEls.find(e => e.name === "tile-title");
      const name = titleEl?.text || el.name || "Groupe";
      items.push({
        id: groupEls[0].id,
        type: "group",
        name,
        visible: groupEls.every(e => e.visible !== false),
        locked: groupEls.some(e => e.locked),
        isGroup: true,
        groupId: el.groupId,
        elementIds: groupEls.map(e => e.id),
      });
    } else {
      items.push({
        id: el.id,
        type: el.type,
        name: el.name || el.type,
        visible: el.visible !== false,
        locked: !!el.locked,
        isGroup: false,
        elementIds: [el.id],
      });
    }
  }
  return items;
}

const LayersPanel = ({ elements, selectedId, onSelect, onToggleVisible, onToggleLock }: Props) => {
  const items = buildLayerItems(elements);

  // Check if selectedId belongs to any group
  const selectedEl = elements.find(e => e.id === selectedId);
  const selectedGroupId = selectedEl?.groupId;

  return (
    <div className="p-3 space-y-1 text-sm">
      <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">Calques</h3>
      {items.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">Aucun élément</p>
      )}
      {items.map(item => {
        const Icon = item.isGroup ? Package : (ICONS[item.type] || Square);
        const isSelected = item.elementIds.includes(selectedId || "") || (item.groupId && item.groupId === selectedGroupId);
        return (
          <div
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors text-xs ${
              isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"
            }`}
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="flex-1 truncate">{item.name}</span>
            {item.isGroup && (
              <span className="text-[9px] text-muted-foreground bg-muted px-1 rounded">{item.elementIds.length}</span>
            )}
            <button
              onClick={e => {
                e.stopPropagation();
                item.elementIds.forEach(id => onToggleVisible(id));
              }}
              className="p-0.5 hover:bg-muted rounded"
            >
              {item.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-muted-foreground" />}
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                item.elementIds.forEach(id => onToggleLock(id));
              }}
              className="p-0.5 hover:bg-muted rounded"
            >
              {item.locked ? <Lock className="w-3 h-3 text-muted-foreground" /> : <Unlock className="w-3 h-3" />}
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default LayersPanel;
