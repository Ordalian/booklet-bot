import React from "react";
import type { ScrapedEvent } from "@/components/BrochureGenerator";

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
  events: ScrapedEvent[];
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
  const dateRange = `${String(d1.getDate()).padStart(2,'0')}/${String(d1.getMonth()+1).padStart(2,'0')} au ${String(d2.getDate()).padStart(2,'0')}/${String(d2.getMonth()+1).padStart(2,'0')} ${d2.getFullYear()}`;

  return (
    <PageShell brand={brand}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60 }}>
        {brand.logoUrl && <img src={brand.logoUrl} alt="Logo" style={{ maxHeight: 120, maxWidth: 300, marginBottom: 40, objectFit: "contain" }} />}
        <div style={{ width: "100%", textAlign: "center", padding: "40px 0", borderTop: `3px solid ${primary}`, borderBottom: `3px solid ${primary}` }}>
          <h1 style={{ fontSize: 42, fontWeight: 800, color: primary, letterSpacing: -1, lineHeight: 1.1, margin: 0 }}>
            Guide des Animations
          </h1>
          <p style={{ fontSize: 28, fontWeight: 600, color: secondary, marginTop: 16, lineHeight: 1.2 }}>
            {dateRange}
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

const ContactBanner = ({ isOdd, brand, contactInfo, accueilHoraires }: { isOdd: boolean; brand: BrandColors; contactInfo?: Record<string, any>; accueilHoraires?: Record<string, any> }) => {
  const bgColor = brand.colors[0] || "#E85D04";
  const label = isOdd ? "Points d'accueil" : "Horaires & Contact";
  const data = isOdd ? accueilHoraires : contactInfo;
  const summary = data ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(" • ") : "Non renseigné";

  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0, height: 70,
      background: bgColor, color: "#fff", display: "flex", alignItems: "center",
      padding: "0 40px", fontSize: 10, fontFamily: "Arial, sans-serif",
    }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
        <div style={{ opacity: 0.9, lineHeight: 1.4 }}>{summary.substring(0, 120)}</div>
      </div>
    </div>
  );
};

const DynamicPagesPreview = ({ categories, brand, contactInfo, accueilHoraires }: { categories: CategoryInfo[]; brand: BrandColors; contactInfo?: Record<string, any>; accueilHoraires?: Record<string, any> }) => {
  if (categories.length === 0) return null;
  const primary = brand.colors[0] || "#E85D04";
  const secondary = brand.colors[1] || "#0077B6";
  const accent = brand.colors[2] || "#2D6A4F";
  const catColors = [primary, secondary, accent, brand.colors[3] || "#E8A838", brand.colors[4] || "#9B59B6"];

  // Build pages: each page can hold ~6 event cards or 2 categories without events
  const pageContents: { cat: CategoryInfo; cc: string }[][] = [];
  let currentPage: { cat: CategoryInfo; cc: string }[] = [];
  let currentPageWeight = 0;

  categories.forEach((cat, ci) => {
    const cc = catColors[ci % catColors.length];
    const weight = cat.events.length > 0 ? Math.ceil(cat.events.length / 3) : 1;
    if (currentPageWeight + weight > 3 && currentPage.length > 0) {
      pageContents.push(currentPage);
      currentPage = [];
      currentPageWeight = 0;
    }
    currentPage.push({ cat, cc });
    currentPageWeight += weight;
  });
  if (currentPage.length > 0) pageContents.push(currentPage);

  return (
    <>
      {pageContents.map((pageCats, pageIdx) => (
        <div key={pageIdx} style={{ width: A4_W * SCALE, height: A4_H * SCALE, overflow: "hidden", position: "relative" }}>
        <PageShell brand={brand}>
          <div style={{ padding: "36px 40px", paddingBottom: 80, overflow: "hidden", height: A4_H - 80 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: primary, marginBottom: 6 }}>Événements</h2>
            <div style={{ height: 3, width: 60, background: primary, borderRadius: 2, marginBottom: 16 }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {pageCats.map(({ cat, cc }) => {
                const hasEvents = cat.events.length > 0;
                const hasContent = hasEvents || cat.links.some(l => l.trim()) || cat.additionalInfo.trim() || cat.fileCount > 0;

                return (
                  <div key={cat.id} style={{ borderLeft: `4px solid ${cc}`, paddingLeft: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: cc }} />
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: cc, margin: 0 }}>{cat.label}</h3>
                      {hasEvents && <span style={{ fontSize: 9, color: "#999", fontWeight: 600 }}>({cat.events.length})</span>}
                    </div>

                    {hasEvents ? (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                        {cat.events.slice(0, 6).map((evt, ei) => (
                          <div key={ei} style={{
                            background: `${cc}08`, borderRadius: 8, padding: "8px 12px",
                            border: `1px solid ${cc}18`,
                          }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#333", lineHeight: 1.3, marginBottom: 3 }}>
                              {evt.title || "Sans titre"}
                            </div>
                            {evt.date && (
                              <div style={{ fontSize: 9, color: cc, fontWeight: 600, marginBottom: 2 }}>
                                📅 {evt.date}
                              </div>
                            )}
                            {evt.location && (
                              <div style={{ fontSize: 9, color: "#666", marginBottom: 2 }}>
                                📍 {evt.location}
                              </div>
                            )}
                            {evt.description && (
                              <div style={{ fontSize: 9, color: "#555", lineHeight: 1.4 }}>
                                {evt.description.substring(0, 80)}{evt.description.length > 80 ? "…" : ""}
                              </div>
                            )}
                            {evt.price && (
                              <div style={{ fontSize: 9, color: cc, fontWeight: 600, marginTop: 2 }}>
                                💰 {evt.price}
                              </div>
                            )}
                            {evt.tags?.length > 0 && (
                              <div style={{ display: "flex", gap: 3, marginTop: 3, flexWrap: "wrap" }}>
                                {evt.tags.slice(0, 3).map((tag, ti) => (
                                  <span key={ti} style={{
                                    fontSize: 7, background: `${cc}20`, color: cc,
                                    padding: "1px 5px", borderRadius: 8, fontWeight: 600,
                                  }}>{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                        {cat.events.length > 6 && (
                          <div style={{ gridColumn: "span 2", textAlign: "center", fontSize: 10, color: "#999", fontStyle: "italic", padding: 4 }}>
                            + {cat.events.length - 6} autre(s) événement(s)…
                          </div>
                        )}
                      </div>
                    ) : hasContent ? (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                        {cat.links.filter(l => l.trim()).map((link, li) => (
                          <div key={li} style={{
                            background: `${cc}0A`, borderRadius: 8, padding: "8px 12px", border: `1px solid ${cc}20`,
                          }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: cc, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>
                              🔗 En attente de scan
                            </div>
                            <div style={{ fontSize: 9, color: "#999", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {link.replace(/https?:\/\//, '').substring(0, 40)}…
                            </div>
                          </div>
                        ))}
                        {cat.additionalInfo.trim() && (
                          <div style={{
                            background: `${cc}0A`, borderRadius: 8, padding: "8px 12px", border: `1px solid ${cc}20`,
                          }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: cc, textTransform: "uppercase", marginBottom: 3 }}>Directives</div>
                            <div style={{ fontSize: 9, color: "#444", lineHeight: 1.4, whiteSpace: "pre-wrap" }}>
                              {cat.additionalInfo.substring(0, 100)}{cat.additionalInfo.length > 100 ? "…" : ""}
                            </div>
                          </div>
                        )}
                        {cat.fileCount > 0 && (
                          <div style={{ background: `${cc}0A`, borderRadius: 8, padding: "8px 12px", border: `1px solid ${cc}20` }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: cc, marginBottom: 3 }}>📄 Documents</div>
                            <div style={{ fontSize: 9, color: "#444" }}>{cat.fileCount} fichier{cat.fileCount > 1 ? "s" : ""}</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ padding: "10px 14px", background: "#f8f8f8", borderRadius: 8, textAlign: "center" }}>
                        <p style={{ fontSize: 10, color: "#aaa", fontStyle: "italic" }}>
                          Ajoutez des liens et cliquez 🔍 pour scanner
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <ContactBanner isOdd={pageIdx % 2 === 0} brand={brand} contactInfo={contactInfo} accueilHoraires={accueilHoraires} />
        </PageShell>
        </div>
      ))}
    </>
  );
};

const LiveBrochurePreview = ({ dateDebut, dateFin, brand, categories, templatePages, dynamicInsertAfter, contactInfo, accueilHoraires }: LiveBrochurePreviewProps) => {
  const pagesBefore = templatePages.filter(p => p.page_number <= dynamicInsertAfter);
  const pagesAfter = templatePages.filter(p => p.page_number > dynamicInsertAfter);

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
        <div className="flex flex-col items-center gap-4">
          <DynamicPagesPreview categories={categories} brand={brand} contactInfo={contactInfo} accueilHoraires={accueilHoraires} />
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
