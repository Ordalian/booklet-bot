import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Download, RefreshCw, Upload, FileText, Loader2 } from "lucide-react";

interface ControlPanelProps {
  onUpdate: (config: UpdateConfig) => Promise<void>;
  onDownload: () => void;
  isUpdating: boolean;
}

export interface UpdateConfig {
  dateDebut: string;
  dateFin: string;
  additionalInfo: string;
  uploadedFiles: File[];
}

const ControlPanel = ({ onUpdate, onDownload, isUpdating }: ControlPanelProps) => {
  const [dateDebut, setDateDebut] = useState("2026-03-29");
  const [dateFin, setDateFin] = useState("2026-04-30");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleUpdate = () => {
    onUpdate({ dateDebut, dateFin, additionalInfo, uploadedFiles: files });
  };

  return (
    <div className="bg-card rounded-xl shadow-lg border border-border p-6 space-y-5">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: 'Montserrat' }}>
          <FileText className="w-5 h-5" style={{ color: 'hsl(var(--guide-orange))' }} />
          Générateur de Guide
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Mettez à jour le guide des animations automatiquement</p>
      </div>

      {/* Date range */}
      <div className="space-y-2">
        <label className="text-sm font-semibold flex items-center gap-1.5">
          <Calendar className="w-4 h-4" style={{ color: 'hsl(var(--guide-blue))' }} />
          Période couverte
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-xs text-muted-foreground">Début</span>
            <Input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Fin</span>
            <Input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Additional info */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">Informations supplémentaires</label>
        <Textarea
          placeholder="Décrivez les événements à ajouter, thématiques spécifiques, ou instructions particulières..."
          value={additionalInfo}
          onChange={e => setAdditionalInfo(e.target.value)}
          rows={3}
        />
      </div>

      {/* File upload */}
      <div className="space-y-2">
        <label className="text-sm font-semibold flex items-center gap-1.5">
          <Upload className="w-4 h-4" style={{ color: 'hsl(var(--guide-green))' }} />
          Documents & Images
        </label>
        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors relative">
          <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
          <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
          <p className="text-sm text-muted-foreground">PDF, JPG, PNG</p>
        </div>
        {files.length > 0 && (
          <div className="space-y-1">
            {files.map((f, i) => (
              <div key={i} className="text-xs flex items-center justify-between bg-muted rounded px-2 py-1">
                <span className="truncate">{f.name}</span>
                <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-destructive hover:underline ml-2">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-2">
        <Button
          onClick={handleUpdate}
          disabled={isUpdating}
          className="w-full text-white font-bold"
          style={{ background: 'hsl(var(--guide-orange))', fontFamily: 'Montserrat' }}
          size="lg"
        >
          {isUpdating ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mise à jour en cours…</>
          ) : (
            <><RefreshCw className="w-4 h-4 mr-2" />Mettre à jour</>
          )}
        </Button>
        <Button
          onClick={onDownload}
          variant="outline"
          className="w-full font-bold"
          style={{ fontFamily: 'Montserrat', borderColor: 'hsl(var(--guide-blue))', color: 'hsl(var(--guide-blue))' }}
          size="lg"
        >
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
      </div>
    </div>
  );
};

export default ControlPanel;
