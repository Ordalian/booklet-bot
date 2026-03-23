import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Copy, Trash2, FileText } from "lucide-react";
import { BookletPage } from "@/hooks/useBookletState";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  pages: BookletPage[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (from: number, to: number) => void;
}

const SortablePageItem = ({
  page, index, isActive, onSelect, onDuplicate, onDelete,
}: {
  page: BookletPage; index: number; isActive: boolean;
  onSelect: () => void; onDuplicate: () => void; onDelete: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: page.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onSelect}
      className={`group flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer text-xs transition-colors ${
        isActive ? "bg-primary/10 ring-1 ring-primary/30 text-primary" : "hover:bg-muted"
      }`}
    >
      <div className="w-8 h-11 rounded border flex items-center justify-center text-[9px] font-bold shrink-0 bg-card border-border">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium">{page.title}</p>
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <FileText className="w-2.5 h-2.5" /> {page.elements.length} éléments
        </p>
      </div>
      <div className="opacity-0 group-hover:opacity-100 flex gap-0.5">
        <button onClick={e => { e.stopPropagation(); onDuplicate(); }} className="p-1 hover:bg-muted rounded" title="Dupliquer">
          <Copy className="w-3 h-3" />
        </button>
        <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-1 hover:bg-destructive/10 text-destructive rounded" title="Supprimer">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

const PageListPanel = ({ pages, currentIndex, onSelect, onAdd, onDuplicate, onDelete, onReorder }: Props) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const ids = useMemo(() => pages.map(p => p.id), [pages]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = pages.findIndex(p => p.id === active.id);
      const newIndex = pages.findIndex(p => p.id === over.id);
      onReorder(oldIndex, newIndex);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pages</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onAdd}>
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {pages.map((page, idx) => (
              <SortablePageItem
                key={page.id}
                page={page}
                index={idx}
                isActive={idx === currentIndex}
                onSelect={() => onSelect(idx)}
                onDuplicate={() => onDuplicate(page.id)}
                onDelete={() => onDelete(page.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default PageListPanel;
