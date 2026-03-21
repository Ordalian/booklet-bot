import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout, FileText } from "lucide-react";
import TemplateCreator from "@/components/TemplateCreator";
import BrochureGenerator from "@/components/BrochureGenerator";

const Index = () => {
  const [activeTab, setActiveTab] = useState("generate");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/logo.png" alt="OT" className="h-9" />
            <div>
              <h1 className="font-bold text-sm" style={{ fontFamily: 'Montserrat', color: 'hsl(var(--guide-orange))' }}>
                La Porte du Hainaut Tourisme
              </h1>
              <p className="text-xs text-muted-foreground">Générateur de Brochures</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
            <TabsTrigger value="template" className="flex items-center gap-2">
              <Layout className="w-4 h-4" />
              Créer un Template
            </TabsTrigger>
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Générer une Brochure
            </TabsTrigger>
          </TabsList>

          <TabsContent value="template">
            <TemplateCreator />
          </TabsContent>

          <TabsContent value="generate">
            <BrochureGenerator />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
