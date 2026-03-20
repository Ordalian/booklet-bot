import { useState, useRef } from "react";
import GuidePreview from "@/components/guide/GuidePreview";
import ControlPanel, { type UpdateConfig } from "@/components/ControlPanel";
import defaultData from "@/data/events_data.json";
import type { EventsData } from "@/types/events";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Index = () => {
  const [eventsData, setEventsData] = useState<EventsData>(defaultData as EventsData);
  const [isUpdating, setIsUpdating] = useState(false);
  const guideRef = useRef<HTMLDivElement>(null);

  const handleUpdate = async (config: UpdateConfig) => {
    setIsUpdating(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-events", {
        body: {
          dateDebut: config.dateDebut,
          dateFin: config.dateFin,
          additionalInfo: config.additionalInfo,
        },
      });

      if (error) throw error;
      if (data?.eventsData) {
        setEventsData(data.eventsData);
        toast.success("Guide mis à jour avec succès !");
      } else {
        toast.error("Aucune donnée reçue");
      }
    } catch (err: any) {
      console.error("Update error:", err);
      toast.error("Erreur lors de la mise à jour: " + (err.message || "Erreur inconnue"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownload = async () => {
    if (!guideRef.current) return;
    toast.info("Génération du PDF en cours...");
    
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const pages = guideRef.current.querySelectorAll('.guide-page');
      const container = document.createElement('div');
      pages.forEach(p => container.appendChild(p.cloneNode(true)));

      await html2pdf().set({
        margin: 0,
        filename: `guide_animations_${eventsData.meta.mois_debut.toLowerCase()}_${eventsData.meta.mois_fin.toLowerCase()}_${eventsData.meta.annee}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], before: '.guide-page' },
      }).from(container).save();
      
      toast.success("PDF téléchargé !");
    } catch (err) {
      console.error("PDF error:", err);
      toast.error("Erreur lors de la génération du PDF");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/logo.png" alt="OT" className="h-9" />
            <div>
              <h1 className="font-bold text-sm" style={{ fontFamily: 'Montserrat', color: 'hsl(var(--guide-orange))' }}>La Porte du Hainaut Tourisme</h1>
              <p className="text-xs text-muted-foreground">Générateur de Guide des Animations</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground" style={{ fontFamily: 'Montserrat' }}>
            {eventsData.meta.mois_debut} – {eventsData.meta.mois_fin} {eventsData.meta.annee}
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto flex gap-6 p-4">
        {/* Sidebar */}
        <aside className="w-80 flex-shrink-0 sticky top-20 self-start">
          <ControlPanel onUpdate={handleUpdate} onDownload={handleDownload} isUpdating={isUpdating} />
        </aside>

        {/* Guide preview */}
        <main className="flex-1 overflow-x-auto">
          <GuidePreview data={eventsData} guideRef={guideRef} />
        </main>
      </div>
    </div>
  );
};

export default Index;
