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

const FONTS = [
  "Arial", "Montserrat", "Georgia", "Times New Roman", "Courier New",
  "Verdana", "Trebuchet MS", "Impact", "Lato", "Roboto",
  "Open Sans", "Playfair Display", "Oswald", "Raleway", "Poppins",
  "Merriweather", "Nunito", "Ubuntu", "Cabin", "Dancing Script",
];

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72, 96, 120];

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

          {/* Font family */}
          <div className="space-y-1">
            <Label className="text-xs">Police</Label>
            <Select value={element.fontFamily} onValueChange={v => update({ fontFamily: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-60">
                {FONTS.map(f => <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Font size */}
          <div className="space-y-1">
            <Label className="text-xs">Taille</Label>
            <div className="flex items-center gap-2">
              <Select value={String(element.fontSize || 24)} onValueChange={v => update({ fontSize: Number(v) })}>
                <SelectTrigger className="h-7 text-xs w-20"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {FONT_SIZES.map(s => <SelectItem key={s} value={String(s)}>{s}px</SelectItem>)}
                </SelectContent>
              </Select>
              <Input className="h-7 text-xs flex-1" type="number" min={6} max={200} value={element.fontSize || 24} onChange={e => update({ fontSize: Number(e.target.value) })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Alignment */}
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

            {/* Style */}
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
          </div>

          {/* Text color */}
          <div className="space-y-1">
            <Label className="text-xs">Couleur du texte</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={element.fill || "#000000"} onChange={e => update({ fill: e.target.value })} className="w-8 h-7 rounded border cursor-pointer" />
              <Input className="h-7 text-xs flex-1" value={element.fill || ""} onChange={e => update({ fill: e.target.value })} />
            </div>
            <div className="flex gap-1 mt-1">
              {brandConfig.colors.map((c, i) => (
                <button key={i} className="w-5 h-5 rounded border border-border hover:scale-110 transition-transform" style={{ background: c }} onClick={() => update({ fill: c })} title={c} />
              ))}
            </div>
          </div>

          {/* Text background */}
          <div className="space-y-2 border border-border rounded-md p-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Fond du texte</Label>
              <Switch checked={element.textBgEnabled || false} onCheckedChange={v => update({ textBgEnabled: v })} />
            </div>
            {element.textBgEnabled && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">Couleur de fond</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={element.textBgColor || "#FFFFFF"} onChange={e => update({ textBgColor: e.target.value })} className="w-8 h-7 rounded border cursor-pointer" />
                    <Input className="h-7 text-xs flex-1" value={element.textBgColor || "#FFFFFF"} onChange={e => update({ textBgColor: e.target.value })} />
                  </div>
                  <div className="flex gap-1 mt-1">
                    {brandConfig.colors.map((c, i) => (
                      <button key={i} className="w-5 h-5 rounded border border-border hover:scale-110 transition-transform" style={{ background: c }} onClick={() => update({ textBgColor: c })} title={c} />
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Padding ({element.textBgPadding || 8}px)</Label>
                  <Slider min={0} max={40} step={1} value={[element.textBgPadding || 8]} onValueChange={([v]) => update({ textBgPadding: v })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Arrondi ({element.textBgRadius || 0}px)</Label>
                  <Slider min={0} max={30} step={1} value={[element.textBgRadius || 0]} onValueChange={([v]) => update({ textBgRadius: v })} />
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Fill color (non-text, non-line, non-image) */}
      {element.type !== "line" && element.type !== "image" && element.type !== "text" && (
        <div className="space-y-1">
          <Label className="text-xs">Couleur de remplissage</Label>
          <div className="flex items-center gap-2">
            <input type="color" value={element.fill || "#000000"} onChange={e => update({ fill: e.target.value })} className="w-8 h-7 rounded border cursor-pointer" />
            <Input className="h-7 text-xs flex-1" value={element.fill || ""} onChange={e => update({ fill: e.target.value })} />
          </div>
          <div className="flex gap-1 mt-1">
            {brandConfig.colors.map((c, i) => (
              <button key={i} className="w-5 h-5 rounded border border-border hover:scale-110 transition-transform" style={{ background: c }} onClick={() => update({ fill: c })} title={c} />
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
