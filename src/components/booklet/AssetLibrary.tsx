import { useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Plus } from "lucide-react";
import { AssetItem } from "@/hooks/useBookletState";
import { toast } from "sonner";

interface Props {
  assets: AssetItem[];
  onUpload: (file: File) => Promise<AssetItem>;
  onDelete: (id: string) => void;
  onInsert: (url: string) => void;
}

const AssetLibrary = ({ assets, onUpload, onDelete, onInsert }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList) => {
    for (const file of Array.from(files)) {
      try {
        await onUpload(file);
        toast.success(`${file.name} uploadé`);
      } catch (err: any) {
        toast.error(`Erreur: ${err.message}`);
      }
    }
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assets</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => fileRef.current?.click()}>
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={e => e.target.files && handleFiles(e.target.files)}
      />

      <div
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-border rounded-lg p-3 text-center hover:border-primary/40 transition-colors cursor-pointer"
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
        <p className="text-[10px] text-muted-foreground">Glisser ou cliquer</p>
      </div>

      {assets.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {assets.map(asset => (
            <div key={asset.id} className="relative group">
              <img
                src={asset.url}
                alt={asset.name}
                className="w-full aspect-square object-cover rounded border border-border cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all"
                onClick={() => onInsert(asset.url)}
                title="Cliquer pour insérer"
              />
              <button
                onClick={e => { e.stopPropagation(); onDelete(asset.id); }}
                className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full w-4 h-4 text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
              <p className="text-[8px] text-muted-foreground truncate mt-0.5">{asset.name}</p>
            </div>
          ))}
        </div>
      )}

      {assets.length === 0 && (
        <p className="text-[10px] text-muted-foreground text-center py-2">Aucun asset</p>
      )}
    </div>
  );
};

export default AssetLibrary;
