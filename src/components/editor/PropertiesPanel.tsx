import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { EditorElement, BrandConfig } from "./types";
import { ChevronDown, Move, Paintbrush, Type, Square } from "lucide-react";
import { useState } from "react";

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

const SectionHeader = ({ icon: Icon, label, open }: { icon: any; label: string; open: boolean }) => (
  <div className="flex items-center gap-2 py-2 cursor-pointer hover:bg-muted/50 rounded px-1 transition-colors">
    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex-1">{label}</span>
    <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`} />
  </div>
);

const PropertiesPanel = ({ element, brandConfig, onChange }: Props) => {
  const [openSections, setOpenSections] = useState({ position: true, appearance: true, typography: true, background: true });

  if (!element) {
    return (
      <div className="p-6 text-sm text-muted-foreground text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
          <Move className="w-5 h-5" />
        </div>
        Sélectionnez un élément
      </div>
    );
  }

  const update = (changes: Partial<EditorElement>) => onChange(element.id, changes);
  const toggleSection = (key: keyof typeof openSections) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const ColorSwatches = ({ value, onPick }: { value: string; onPick: (c: string) => void }) => (
    <div className="grid grid-cols-5 gap-1 mt-1">
      {brandConfig.colors.map((c, i) => (
        <button key={i} className={`w-6 h-6 rounded-md border-2 hover:scale-110 transition-transform ${value === c ? "border-primary ring-1 ring-primary" : "border-border"}`} style={{ background: c }} onClick={() => onPick(c)} title={c} />
      ))}
    </div>
  );

  return (
    <div className="p-3 space-y-1 text-sm overflow-y-auto">
      {/* Name */}
      <div className="space-y-1 pb-2">
        <Input className="h-7 text-xs font-medium" value={element.name || ""} onChange={e => update({ name: e.target.value })} placeholder="Nom de l'élément" />
      </div>

      {/* Position */}
      <Collapsible open={openSections.position} onOpenChange={() => toggleSection("position")}>
        <CollapsibleTrigger className="w-full">
          <SectionHeader icon={Move} label="Position" open={openSections.position} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pb-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">X</Label>
              <Input className="h-7 text-xs" type="number" value={element.x} onChange={e => update({ x: Number(e.target.value) })} />
            </div>
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">Y</Label>
              <Input className="h-7 text-xs" type="number" value={element.y} onChange={e => update({ y: Number(e.target.value) })} />
            </div>
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">L</Label>
              <Input className="h-7 text-xs" type="number" value={element.width} onChange={e => update({ width: Number(e.target.value) })} />
            </div>
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">H</Label>
              <Input className="h-7 text-xs" type="number" value={element.height} onChange={e => update({ height: Number(e.target.value) })} />
            </div>
          </div>
          <div className="space-y-0.5">
            <Label className="text-[10px] text-muted-foreground">Rotation ({element.rotation}°)</Label>
            <Slider min={0} max={360} step={1} value={[element.rotation]} onValueChange={([v]) => update({ rotation: v })} />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Appearance */}
      <Collapsible open={openSections.appearance} onOpenChange={() => toggleSection("appearance")}>
        <CollapsibleTrigger className="w-full">
          <SectionHeader icon={Paintbrush} label="Apparence" open={openSections.appearance} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pb-3">
          <div className="space-y-0.5">
            <Label className="text-[10px] text-muted-foreground">Opacité ({Math.round((element.opacity || 1) * 100)}%)</Label>
            <Slider min={0} max={1} step={0.01} value={[element.opacity || 1]} onValueChange={([v]) => update({ opacity: v })} />
          </div>

          {element.type !== "line" && element.type !== "image" && element.type !== "text" && (
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">Remplissage</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={element.fill || "#000000"} onChange={e => update({ fill: e.target.value })} className="w-7 h-7 rounded border cursor-pointer" />
                <Input className="h-7 text-xs flex-1" value={element.fill || ""} onChange={e => update({ fill: e.target.value })} />
              </div>
              <ColorSwatches value={element.fill || ""} onPick={c => update({ fill: c })} />
            </div>
          )}

          <div className="space-y-0.5">
            <Label className="text-[10px] text-muted-foreground">Contour</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={element.stroke || "#000000"} onChange={e => update({ stroke: e.target.value })} className="w-7 h-7 rounded border cursor-pointer" />
              <Input className="h-7 text-xs w-14" type="number" min={0} max={20} value={element.strokeWidth || 0} onChange={e => update({ strokeWidth: Number(e.target.value) })} placeholder="px" />
            </div>
          </div>

          {element.type === "rect" && (
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">Arrondi ({element.cornerRadius || 0}px)</Label>
              <Slider min={0} max={50} step={1} value={[element.cornerRadius || 0]} onValueChange={([v]) => update({ cornerRadius: v })} />
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label className="text-[10px]">Verrouillé</Label>
            <Switch checked={element.locked || false} onCheckedChange={v => update({ locked: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-[10px]">Visible</Label>
            <Switch checked={element.visible !== false} onCheckedChange={v => update({ visible: v })} />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Typography (text only) */}
      {element.type === "text" && (
        <Collapsible open={openSections.typography} onOpenChange={() => toggleSection("typography")}>
          <CollapsibleTrigger className="w-full">
            <SectionHeader icon={Type} label="Typographie" open={openSections.typography} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pb-3">
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">Texte</Label>
              <Textarea className="text-xs min-h-[50px]" value={element.text || ""} onChange={e => update({ text: e.target.value })} />
            </div>
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">Police</Label>
              <Select value={element.fontFamily} onValueChange={v => update({ fontFamily: v })}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {FONTS.map(f => <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">Taille</Label>
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
              <div className="space-y-0.5">
                <Label className="text-[10px] text-muted-foreground">Align</Label>
                <Select value={element.textAlign || "left"} onValueChange={v => update({ textAlign: v })}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Gauche</SelectItem>
                    <SelectItem value="center">Centre</SelectItem>
                    <SelectItem value="right">Droite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-0.5">
                <Label className="text-[10px] text-muted-foreground">Style</Label>
                <Select value={element.fontStyle || "normal"} onValueChange={v => update({ fontStyle: v })}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="bold">Gras</SelectItem>
                    <SelectItem value="italic">Italique</SelectItem>
                    <SelectItem value="bold italic">Gras Ital.</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">Couleur</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={element.fill || "#000000"} onChange={e => update({ fill: e.target.value })} className="w-7 h-7 rounded border cursor-pointer" />
                <Input className="h-7 text-xs flex-1" value={element.fill || ""} onChange={e => update({ fill: e.target.value })} />
              </div>
              <ColorSwatches value={element.fill || ""} onPick={c => update({ fill: c })} />
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Text background (text only) */}
      {element.type === "text" && (
        <Collapsible open={openSections.background} onOpenChange={() => toggleSection("background")}>
          <CollapsibleTrigger className="w-full">
            <SectionHeader icon={Square} label="Fond du texte" open={openSections.background} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pb-3">
            <div className="flex items-center justify-between">
              <Label className="text-[10px]">Activer</Label>
              <Switch checked={element.textBgEnabled || false} onCheckedChange={v => update({ textBgEnabled: v })} />
            </div>
            {element.textBgEnabled && (
              <>
                <div className="space-y-0.5">
                  <Label className="text-[10px] text-muted-foreground">Couleur</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={element.textBgColor || "#FFFFFF"} onChange={e => update({ textBgColor: e.target.value })} className="w-7 h-7 rounded border cursor-pointer" />
                    <Input className="h-7 text-xs flex-1" value={element.textBgColor || "#FFFFFF"} onChange={e => update({ textBgColor: e.target.value })} />
                  </div>
                  <ColorSwatches value={element.textBgColor || ""} onPick={c => update({ textBgColor: c })} />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-[10px] text-muted-foreground">Padding ({element.textBgPadding || 8}px)</Label>
                  <Slider min={0} max={40} step={1} value={[element.textBgPadding || 8]} onValueChange={([v]) => update({ textBgPadding: v })} />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-[10px] text-muted-foreground">Arrondi ({element.textBgRadius || 0}px)</Label>
                  <Slider min={0} max={30} step={1} value={[element.textBgRadius || 0]} onValueChange={([v]) => update({ textBgRadius: v })} />
                </div>
              </>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

export default PropertiesPanel;
