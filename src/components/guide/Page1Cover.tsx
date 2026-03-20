import type { EventsData } from "@/types/events";

const HL_COLORS: Record<string, string> = {
  orange: 'hsl(var(--guide-orange))',
  bleu: 'hsl(var(--guide-blue))',
  vert: 'hsl(var(--guide-green))',
};

const Page1Cover = ({ data }: { data: EventsData }) => {
  const M = data.meta;
  return (
    <div className="guide-page" style={{ height: '1123px', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative circles */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: -70, right: -70, width: 220, height: 220, borderRadius: '50%', border: '45px solid hsl(var(--guide-blue))', opacity: 0.12 }} />
        <div style={{ position: 'absolute', top: -40, right: 30, width: 140, height: 140, borderRadius: '50%', border: '32px solid hsl(var(--guide-orange))', opacity: 0.16 }} />
        <div style={{ position: 'absolute', bottom: 60, left: -55, width: 170, height: 170, borderRadius: '50%', border: '38px solid hsl(var(--guide-green))', opacity: 0.10 }} />
        <div style={{ position: 'absolute', bottom: -25, right: 110, width: 130, height: 130, borderRadius: '50%', border: '30px solid hsl(var(--guide-orange))', opacity: 0.14 }} />
      </div>

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 10, padding: '28px 36px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img src="/images/logo.png" style={{ height: 68 }} alt="OT" />
        <div style={{ fontFamily: 'Montserrat', fontSize: '11px', fontWeight: 700, color: 'hsl(var(--guide-green))', textTransform: 'uppercase', letterSpacing: '2px', textAlign: 'right', lineHeight: 1.5 }}>
          Terre d'Inattendus…<br />Hauts-de-France
        </div>
      </div>

      {/* Center */}
      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 36px', textAlign: 'center' }}>
        <div style={{ background: 'hsl(var(--guide-orange))', color: 'white', fontFamily: 'Montserrat', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '3px', padding: '7px 22px', borderRadius: '28px', marginBottom: '18px', display: 'inline-block' }}>
          {M.titre}
        </div>
        <div style={{ fontFamily: 'Montserrat', fontSize: '68px', fontWeight: 900, lineHeight: 1, color: 'hsl(var(--guide-orange))', textTransform: 'uppercase', letterSpacing: '-2px', marginBottom: '8px' }}>
          {M.mois_debut.toUpperCase()}
        </div>
        <div style={{ fontFamily: 'Montserrat', fontSize: '40px', fontWeight: 800, color: 'hsl(var(--guide-blue))', textTransform: 'uppercase', letterSpacing: '-1px', marginBottom: '6px' }}>
          — {M.mois_fin.toUpperCase()} —
        </div>
        <div style={{ display: 'inline-block', background: 'hsl(var(--guide-blue))', color: 'white', fontFamily: 'Montserrat', fontSize: '26px', fontWeight: 900, padding: '5px 28px', borderRadius: '28px', margin: '8px 0 20px' }}>
          {M.annee}
        </div>
        <div style={{ width: 220, margin: '0 auto' }}>
          <img src="/images/brochure_cover.jpg" style={{ width: '100%', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,.2)' }} alt="Brochure" />
        </div>
      </div>

      {/* Highlights */}
      <div style={{ position: 'relative', zIndex: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '16px 36px 22px' }}>
        {data.highlights.map((hl, i) => {
          const c = HL_COLORS[hl.couleur] || 'hsl(var(--guide-orange))';
          return (
            <div key={i} style={{ background: '#F5F5F5', borderRadius: 10, padding: '12px 15px', borderLeft: `4px solid ${c}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 26 }}>{hl.icon}</span>
              <div>
                <div style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: c, marginBottom: 2 }}>{hl.label}</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#2C2C2C', lineHeight: 1.3 }} dangerouslySetInnerHTML={{ __html: hl.texte.replace(/\n/g, '<br/>') }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom bar */}
      <div style={{ position: 'relative', zIndex: 10, background: 'hsl(var(--guide-orange))', color: 'white', padding: '13px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'Montserrat', fontSize: '11.5px', fontWeight: 700 }}>📞 +33 (0)3 27 48 39 65</span>
        <span style={{ fontFamily: 'Montserrat', fontSize: '11.5px', fontWeight: 700 }}>tourisme-porteduhainaut.com</span>
        <span style={{ fontFamily: 'Montserrat', fontSize: '11.5px', fontWeight: 700 }}>@porteduhainauttourisme</span>
      </div>
    </div>
  );
};

export default Page1Cover;
