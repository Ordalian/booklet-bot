import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Upload } from "lucide-react";
import { BrandConfig } from "./types";

interface Props {
  config: BrandConfig;
  onChange: (config: BrandConfig) => void;
  onLogoUpload: (file: File) => void;
  onAssetUpload: (file: File) => void;
}

const BrandPanel = ({ config, onChange, onLogoUpload, onAssetUpload }: Props) => {
  const [newColor, setNewColor] = useState("#E85D04");

  const addColor = () => {
    if (config.colors.length < 12) {
      onChange({ ...config, colors: [...config.colors, newColor] });
    }
  };

  const removeColor = (idx: number) => {
    onChange({ ...config, colors: config.colors.filter((_, i) => i !== idx) });
  };

  const updateColor = (idx: number, value: string) => {
    const newColors = [...config.colors];
    newColors[idx] = value;
    onChange({ ...config, colors: newColors });
  };

  return (
    <div className="p-3 space-y-4 text-sm">
      <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Marque</h3>

      {/* Colors */}
      <div className="space-y-2">
        <Label className="text-xs">Couleurs de marque</Label>
        <div className="flex flex-wrap gap-2">
          {config.colors.map((c, i) => (
            <div key={i} className="relative group">
              <input
                type="color"
                value={c}
                onChange={e => updateColor(i, e.target.value)}
                className="w-8 h-8 rounded-md border border-border cursor-pointer"
              />
              <button
                onClick={() => removeColor(i)}
                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-3.5 h-3.5 text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="w-7 h-7 rounded border cursor-pointer" />
          <Input className="h-7 text-xs flex-1" value={newColor} onChange={e => setNewColor(e.target.value)} />
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={addColor} disabled={config.colors.length >= 12}>
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Logo */}
      <div className="space-y-2">
        <Label className="text-xs">Logo</Label>
        {config.logoUrl ? (
          <div className="flex items-center gap-2">
            <img src={config.logoUrl} alt="Logo" className="h-10 object-contain rounded border border-border p-1" />
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onChange({ ...config, logoUrl: "" })}>
              Retirer
            </Button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-border rounded-lg p-3 text-center cursor-pointer hover:border-primary/50 transition-colors relative">
            <input type="file" accept="image/*" onChange={e => { if (e.target.files?.[0]) onLogoUpload(e.target.files[0]); }} className="absolute inset-0 opacity-0 cursor-pointer" />
            <Upload className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">Uploader le logo</p>
          </div>
        )}
      </div>

      {/* Additional assets */}
      <div className="space-y-2">
        <Label className="text-xs">Éléments additionnels</Label>
        <div className="border-2 border-dashed border-border rounded-lg p-3 text-center cursor-pointer hover:border-primary/50 transition-colors relative">
          <input type="file" accept="image/*" onChange={e => { if (e.target.files?.[0]) onAssetUpload(e.target.files[0]); }} className="absolute inset-0 opacity-0 cursor-pointer" />
          <Upload className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
          <p className="text-xs text-muted-foreground">Ajouter un visuel</p>
        </div>
        {config.additionalAssets.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {config.additionalAssets.map((url, i) => (
              <div key={i} className="relative group">
                <img src={url} alt="" className="w-12 h-12 object-cover rounded border border-border" />
                <button
                  onClick={() => onChange({ ...config, additionalAssets: config.additionalAssets.filter((_, j) => j !== i) })}
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-3.5 h-3.5 text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandPanel;
