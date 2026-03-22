import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { EditorElement, BrandConfig } from "./types";

interface Props {
  element: EditorElement | null;
  brandConfig: BrandConfig;
  onChange: (id: string, changes: Partial<EditorElement>) => void;
}

const FONTS = ["Arial", "Montserrat", "Georgia", "Times New Roman", "Courier New", "Verdana", "Trebuchet MS", "Impact"];

const PropertiesPanel = ({ element, brandConfig, onChange }: Props) => {
  if (!element) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        Sélectionnez un élément pour modifier ses propriétés
      </div>
    );
  }

  const update = (changes: Partial<EditorElement>) => onChange(element.id, changes);

  return (
    <div className="p-3 space-y-4 text-sm overflow-y-auto max-h-[600px]">
      <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Propriétés</h3>

      {/* Name */}
      <div className="space-y-1">
        <Label className="text-xs">Nom</Label>
        <Input className="h-7 text-xs" value={element.name || ""} onChange={e => update({ name: e.target.value })} />
      </div>

      {/* Position */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">X</Label>
          <Input className="h-7 text-xs" type="number" value={element.x} onChange={e => update({ x: Number(e.target.value) })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Y</Label>
          <Input className="h-7 text-xs" type="number" value={element.y} onChange={e => update({ y: Number(e.target.value) })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Largeur</Label>
          <Input className="h-7 text-xs" type="number" value={element.width} onChange={e => update({ width: Number(e.target.value) })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Hauteur</Label>
          <Input className="h-7 text-xs" type="number" value={element.height} onChange={e => update({ height: Number(e.target.value) })} />
        </div>
      </div>

      {/* Rotation */}
      <div className="space-y-1">
        <Label className="text-xs">Rotation ({element.rotation}°)</Label>
        <Slider min={0} max={360} step={1} value={[element.rotation]} onValueChange={([v]) => update({ rotation: v })} />
      </div>

      {/* Opacity */}
      <div className="space-y-1">
        <Label className="text-xs">Opacité ({Math.round((element.opacity || 1) * 100)}%)</Label>
        <Slider min={0} max={1} step={0.01} value={[element.opacity || 1]} onValueChange={([v]) => update({ opacity: v })} />
      </div>

      {/* Text-specific */}
      {element.type === "text" && (
        <>
          <div className="space-y-1">
            <Label className="text-xs">Texte</Label>
            <Textarea className="text-xs min-h-[60px]" value={element.text || ""} onChange={e => update({ text: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Taille</Label>
            <Input className="h-7 text-xs" type="number" min={8} max={200} value={element.fontSize} onChange={e => update({ fontSize: Number(e.target.value) })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Police</Label>
            <Select value={element.fontFamily} onValueChange={v => update({ fontFamily: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FONTS.map(f => <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Alignement</Label>
            <Select value={element.textAlign || "left"} onValueChange={v => update({ textAlign: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Gauche</SelectItem>
                <SelectItem value="center">Centre</SelectItem>
                <SelectItem value="right">Droite</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Style</Label>
            <Select value={element.fontStyle || "normal"} onValueChange={v => update({ fontStyle: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="bold">Gras</SelectItem>
                <SelectItem value="italic">Italique</SelectItem>
                <SelectItem value="bold italic">Gras Italique</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Fill color */}
      {element.type !== "line" && element.type !== "image" && (
        <div className="space-y-1">
          <Label className="text-xs">Couleur de remplissage</Label>
          <div className="flex items-center gap-2">
            <input type="color" value={element.fill || "#000000"} onChange={e => update({ fill: e.target.value })} className="w-8 h-7 rounded border cursor-pointer" />
            <Input className="h-7 text-xs flex-1" value={element.fill || ""} onChange={e => update({ fill: e.target.value })} />
          </div>
          {/* Brand color swatches */}
          <div className="flex gap-1 mt-1">
            {brandConfig.colors.map((c, i) => (
              <button
                key={i}
                className="w-5 h-5 rounded border border-border hover:scale-110 transition-transform"
                style={{ background: c }}
                onClick={() => update({ fill: c })}
                title={c}
              />
            ))}
          </div>
        </div>
      )}

      {/* Stroke */}
      <div className="space-y-1">
        <Label className="text-xs">Contour</Label>
        <div className="flex items-center gap-2">
          <input type="color" value={element.stroke || "#000000"} onChange={e => update({ stroke: e.target.value })} className="w-8 h-7 rounded border cursor-pointer" />
          <Input className="h-7 text-xs w-16" type="number" min={0} max={20} value={element.strokeWidth || 0} onChange={e => update({ strokeWidth: Number(e.target.value) })} placeholder="px" />
        </div>
      </div>

      {/* Corner radius (rect only) */}
      {element.type === "rect" && (
        <div className="space-y-1">
          <Label className="text-xs">Arrondi ({element.cornerRadius || 0}px)</Label>
          <Slider min={0} max={50} step={1} value={[element.cornerRadius || 0]} onValueChange={([v]) => update({ cornerRadius: v })} />
        </div>
      )}

      {/* Lock */}
      <div className="flex items-center justify-between">
        <Label className="text-xs">Verrouillé</Label>
        <Switch checked={element.locked || false} onCheckedChange={v => update({ locked: v })} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Visible</Label>
        <Switch checked={element.visible !== false} onCheckedChange={v => update({ visible: v })} />
      </div>
    </div>
  );
};

export default PropertiesPanel;
