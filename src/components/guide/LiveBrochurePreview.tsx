import React from "react";

const A4_W = 794;
const A4_H = 1123;
const SCALE = 0.48;

interface BrandColors {
  colors: string[];
  logoUrl: string;
}

interface CategoryInfo {
  id: string;
  label: string;
  color: string;
  links: string[];
  additionalInfo: string;
  fileCount: number;
}

interface TemplatePage {
  page_number: number;
  title: string | null;
  content_instructions: string | null;
  layout_description: string | null;
  image_urls: string[] | null;
}

interface LiveBrochurePreviewProps {
  dateDebut: string;
  dateFin: string;
  brand: BrandColors;
  categories: CategoryInfo[];
  templatePages: TemplatePage[];
  dynamicInsertAfter: number;
  contactInfo?: Record<string, any>;
  accueilHoraires?: Record<string, any>;
}

const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

const PageShell = ({ children, brand }: { children: React.ReactNode; brand: BrandColors }) => (
  <div
    style={{
      width: A4_W,
      height: A4_H,
      transform: `scale(${SCALE})`,
      transformOrigin: "top left",
      overflow: "hidden",
      background: "#fff",
      fontFamily: "'Segoe UI', Arial, sans-serif",
      position: "relative",
      flexShrink: 0,
    }}
    className="shadow-lg rounded-sm"
  >
    {/* Top accent bar */}
    <div style={{ height: 6, background: `linear-gradient(90deg, ${brand.colors[0] || '#E85D04'}, ${brand.colors[1] || '#0077B6'})` }} />
    {children}
    {/* Bottom accent */}
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: brand.colors[0] || '#E85D04', opacity: 0.3 }} />
  </div>
);

const CoverPage = ({ brand, dateDebut, dateFin }: { brand: BrandColors; dateDebut: string; dateFin: string }) => {
  const d1 = new Date(dateDebut);
  const d2 = new Date(dateFin);
  const primary = brand.colors[0] || "#E85D04";
  const secondary = brand.colors[1] || "#0077B6";

  return (
    <PageShell brand={brand}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60 }}>
        {brand.logoUrl && <img src={brand.logoUrl} alt="Logo" style={{ maxHeight: 120, maxWidth: 300, marginBottom: 40, objectFit: "contain" }} />}
        <div style={{ width: "100%", textAlign: "center", padding: "40px 0", borderTop: `3px solid ${primary}`, borderBottom: `3px solid ${primary}` }}>
          <h1 style={{ fontSize: 42, fontWeight: 800, color: primary, letterSpacing: -1, lineHeight: 1.1, margin: 0 }}>
            Guide des Animations
          </h1>
          <p style={{ fontSize: 28, fontWeight: 600, color: secondary, marginTop: 16, lineHeight: 1.2 }}>
            {MONTHS[d1.getMonth()]} – {MONTHS[d2.getMonth()]} {d2.getFullYear()}
          </p>
        </div>
        <div style={{ marginTop: 40, display: "flex", gap: 12 }}>
          {brand.colors.slice(0, 5).map((c, i) => (
            <div key={i} style={{ width: 32, height: 32, borderRadius: "50%", background: c, border: "2px solid #eee" }} />
          ))}
        </div>
      </div>
    </PageShell>
  );
};

const FixedPage = ({ page, brand }: { page: TemplatePage; brand: BrandColors }) => {
  const primary = brand.colors[0] || "#E85D04";
  return (
    <PageShell brand={brand}>
      <div style={{ padding: "40px 48px" }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: primary, marginBottom: 16, borderBottom: `2px solid ${primary}20`, paddingBottom: 10 }}>
          {page.title || `Page ${page.page_number}`}
        </h2>
        {page.content_instructions && (
          <div style={{ background: `${primary}08`, borderRadius: 8, padding: "16px 20px", marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: "#666", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{page.content_instructions}</p>
          </div>
        )}
        {page.layout_description && (
          <p style={{ fontSize: 11, color: "#999", fontStyle: "italic", marginBottom: 16 }}>Layout: {page.layout_description}</p>
        )}
        {page.image_urls && page.image_urls.length > 0 && (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
            {page.image_urls.map((url, i) => (
              <img key={i} src={url} alt="" style={{ width: 140, height: 100, objectFit: "cover", borderRadius: 6, border: "1px solid #eee" }} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
};

const DynamicPagesPreview = ({ categories, brand }: { categories: CategoryInfo[]; brand: BrandColors }) => {
  if (categories.length === 0) return null;
  const primary = brand.colors[0] || "#E85D04";
  const secondary = brand.colors[1] || "#0077B6";
  const accent = brand.colors[2] || "#2D6A4F";

  const catColors = [primary, secondary, accent, brand.colors[3] || "#E8A838", brand.colors[4] || "#9B59B6"];

  return (
    <PageShell brand={brand}>
      <div style={{ padding: "36px 44px" }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: primary, marginBottom: 8 }}>Événements</h2>
        <div style={{ height: 3, width: 60, background: primary, borderRadius: 2, marginBottom: 24 }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {categories.map((cat, ci) => {
            const cc = catColors[ci % catColors.length];
            const hasContent = cat.links.filter(l => l.trim()).length > 0 || cat.additionalInfo.trim() || cat.fileCount > 0;

            return (
              <div key={cat.id} style={{ borderLeft: `4px solid ${cc}`, paddingLeft: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: cc }} />
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: cc, margin: 0 }}>{cat.label}</h3>
                </div>

                {hasContent ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {/* Simulated event cards based on sources */}
                    {cat.links.filter(l => l.trim()).map((link, li) => (
                      <div key={li} style={{
                        background: `${cc}0A`,
                        borderRadius: 8,
                        padding: "10px 14px",
                        border: `1px solid ${cc}20`,
                      }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: cc, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                          Source web {li + 1}
                        </div>
                        <div style={{ fontSize: 11, color: "#444", lineHeight: 1.5 }}>
                          Événements extraits de cette source seront affichés ici avec dates, lieux et descriptions.
                        </div>
                        <div style={{ fontSize: 9, color: "#999", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          🔗 {link.replace(/https?:\/\//, '').substring(0, 40)}…
                        </div>
                      </div>
                    ))}
                    {cat.additionalInfo.trim() && (
                      <div style={{
                        background: `${cc}0A`,
                        borderRadius: 8,
                        padding: "10px 14px",
                        border: `1px solid ${cc}20`,
                        gridColumn: cat.links.filter(l => l.trim()).length === 0 ? "span 2" : undefined,
                      }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: cc, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                          Directives
                        </div>
                        <div style={{ fontSize: 11, color: "#444", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                          {cat.additionalInfo.substring(0, 120)}{cat.additionalInfo.length > 120 ? "…" : ""}
                        </div>
                      </div>
                    )}
                    {cat.fileCount > 0 && (
                      <div style={{
                        background: `${cc}0A`,
                        borderRadius: 8,
                        padding: "10px 14px",
                        border: `1px solid ${cc}20`,
                      }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: cc, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                          📄 Documents
                        </div>
                        <div style={{ fontSize: 11, color: "#444" }}>
                          {cat.fileCount} fichier{cat.fileCount > 1 ? "s" : ""} à analyser
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: "12px 16px", background: "#f8f8f8", borderRadius: 8, textAlign: "center" }}>
                    <p style={{ fontSize: 11, color: "#aaa", fontStyle: "italic" }}>
                      Ajoutez des liens, fichiers ou directives pour alimenter cette section
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
};

const LiveBrochurePreview = ({ dateDebut, dateFin, brand, categories, templatePages, dynamicInsertAfter }: LiveBrochurePreviewProps) => {
  const pagesBefore = templatePages.filter(p => p.page_number <= dynamicInsertAfter);
  const pagesAfter = templatePages.filter(p => p.page_number > dynamicInsertAfter);
  const activeCategories = categories.filter(c => c.links.some(l => l.trim()) || c.additionalInfo.trim() || c.fileCount > 0);

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {/* Cover */}
      <div style={{ width: A4_W * SCALE, height: A4_H * SCALE, overflow: "hidden" }}>
        <CoverPage brand={brand} dateDebut={dateDebut} dateFin={dateFin} />
      </div>

      {/* Fixed pages before dynamic */}
      {pagesBefore.map((p, i) => (
        <div key={`before-${i}`} style={{ width: A4_W * SCALE, height: A4_H * SCALE, overflow: "hidden" }}>
          <FixedPage page={p} brand={brand} />
        </div>
      ))}

      {/* Dynamic event pages */}
      {categories.length > 0 && (
        <div style={{ width: A4_W * SCALE, height: A4_H * SCALE, overflow: "hidden", position: "relative" }}>
          <DynamicPagesPreview categories={categories} brand={brand} />
          {/* Dynamic badge */}
          <div style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: brand.colors[1] || "#0077B6",
            color: "#fff",
            fontSize: 9,
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: 12,
            letterSpacing: 0.3,
          }}>
            PAGES DYNAMIQUES
          </div>
        </div>
      )}

      {/* Fixed pages after dynamic */}
      {pagesAfter.map((p, i) => (
        <div key={`after-${i}`} style={{ width: A4_W * SCALE, height: A4_H * SCALE, overflow: "hidden" }}>
          <FixedPage page={p} brand={brand} />
        </div>
      ))}

      {/* Empty state */}
      {categories.length === 0 && templatePages.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
          <p className="text-sm font-medium">Sélectionnez un template et des catégories</p>
          <p className="text-xs mt-1">L'aperçu se mettra à jour en temps réel</p>
        </div>
      )}
    </div>
  );
};

export default LiveBrochurePreview;
