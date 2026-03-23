import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Plus } from "lucide-react";
import { BrandConfig } from "@/components/editor/types";
import { BookletSettings } from "@/hooks/useBookletState";
import { useState } from "react";

interface Props {
  brand: BrandConfig;
  onBrandChange: (brand: BrandConfig) => void;
  settings: BookletSettings;
  onSettingsChange: (settings: BookletSettings) => void;
  onLogoUpload: (file: File) => void;
}

const SettingsPanel = ({ brand, onBrandChange, settings, onSettingsChange, onLogoUpload }: Props) => {
  const [newColor, setNewColor] = useState("#E85D04");

  const addColor = () => {
    if (brand.colors.length < 12) {
      onBrandChange({ ...brand, colors: [...brand.colors, newColor] });
    }
  };

  const updateColor = (idx: number, val: string) => {
    const next = [...brand.colors];
    next[idx] = val;
    onBrandChange({ ...brand, colors: next });
  };

  const removeColor = (idx: number) => {
    onBrandChange({ ...brand, colors: brand.colors.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">Paramètres</h3>

      {/* Booklet name */}
      <div className="space-y-1">
        <Label className="text-[11px]">Nom du booklet</Label>
        <Input
          className="h-7 text-xs"
          value={settings.templateName}
          onChange={e => onSettingsChange({ ...settings, templateName: e.target.value })}
          placeholder="Mon booklet..."
        />
      </div>

      {/* Date range */}
      <div className="space-y-1">
        <Label className="text-[11px]">Période</Label>
        <div className="grid grid-cols-2 gap-1.5">
          <Input
            type="date"
            className="h-7 text-[10px]"
            value={settings.dateDebut}
            onChange={e => onSettingsChange({ ...settings, dateDebut: e.target.value })}
          />
          <Input
            type="date"
            className="h-7 text-[10px]"
            value={settings.dateFin}
            onChange={e => onSettingsChange({ ...settings, dateFin: e.target.value })}
          />
        </div>
      </div>

      {/* Brand colors */}
      <div className="space-y-1.5">
        <Label className="text-[11px]">Couleurs de marque</Label>
        <div className="flex flex-wrap gap-1.5">
          {brand.colors.map((c, i) => (
            <div key={i} className="relative group">
              <input
                type="color"
                value={c}
                onChange={e => updateColor(i, e.target.value)}
                className="w-7 h-7 rounded border border-border cursor-pointer"
              />
              <button
                onClick={() => removeColor(i)}
                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-3 h-3 text-[7px] flex items-center justify-center opacity-0 group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="w-6 h-6 rounded border cursor-pointer" />
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={addColor} disabled={brand.colors.length >= 12}>
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Logo */}
      <div className="space-y-1">
        <Label className="text-[11px]">Logo</Label>
        {brand.logoUrl ? (
          <div className="flex items-center gap-2">
            <img src={brand.logoUrl} alt="Logo" className="h-8 object-contain rounded border border-border p-0.5" />
            <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => onBrandChange({ ...brand, logoUrl: "" })}>
              Retirer
            </Button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-border rounded p-2 text-center cursor-pointer hover:border-primary/40 relative">
            <input type="file" accept="image/*" onChange={e => { if (e.target.files?.[0]) onLogoUpload(e.target.files[0]); }} className="absolute inset-0 opacity-0 cursor-pointer" />
            <Upload className="w-3.5 h-3.5 mx-auto text-muted-foreground" />
            <p className="text-[9px] text-muted-foreground">Upload logo</p>
          </div>
        )}
      </div>

      {/* Contact info */}
      <div className="space-y-1">
        <Label className="text-[11px]">Points d'accueil</Label>
        <Textarea
          className="text-[10px] min-h-[50px]"
          value={(settings.accueilHoraires as any)?.points_accueil || ""}
          onChange={e => onSettingsChange({
            ...settings,
            accueilHoraires: { ...settings.accueilHoraires, points_accueil: e.target.value },
          })}
          placeholder="Points d'accueil..."
        />
      </div>

      <div className="space-y-1">
        <Label className="text-[11px]">Horaires</Label>
        <Textarea
          className="text-[10px] min-h-[50px]"
          value={(settings.accueilHoraires as any)?.horaires || ""}
          onChange={e => onSettingsChange({
            ...settings,
            accueilHoraires: { ...settings.accueilHoraires, horaires: e.target.value },
          })}
          placeholder="Horaires..."
        />
      </div>
    </div>
  );
};

export default SettingsPanel;
