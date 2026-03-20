import type { EventsData } from "@/types/events";
import GuideHeader from "./GuideHeader";
import GuideCard from "./GuideCard";

const Page8Final = ({ data }: { data: EventsData }) => (
  <div className="guide-page">
    <GuideHeader pageNum={8} />
    {/* Scènes Plurielles banner */}
    <div style={{ position: 'relative', flexShrink: 0, overflow: 'hidden' }}>
      <img src="/images/scenes_plurielles_cover.jpg" style={{ width: '100%', height: 150, objectFit: 'cover', objectPosition: 'center 20%', display: 'block' }} alt="Scènes Plurielles" />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right,rgba(74,20,140,.88) 0%,rgba(74,20,140,.3) 100%)', display: 'flex', alignItems: 'center', padding: '0 36px' }}>
        <div>
          <div style={{ fontFamily: 'Montserrat', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,.65)', marginBottom: 6 }}>Communauté d'Agglomération de La Porte du Hainaut</div>
          <h2 style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: '24px', color: 'white', textTransform: 'uppercase', lineHeight: 1.05 }}>
            Scènes Plurielles<br /><span style={{ color: '#CE93D8', fontSize: '13px', fontWeight: 600 }}>Spectacles Janv. – Juin 2026 · 5€ / Gratuit</span>
          </h2>
        </div>
      </div>
    </div>

    <div style={{ padding: '14px 36px 6px' }}>
      <div className="guide-section-title" style={{ color: 'hsl(var(--guide-purple))' }}>🎭 Mars &amp; Avril – En communes</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {data.page8_scenes.map((s, i) => (
          <div key={i} className="guide-card" style={{ background: '#F3E5F5', borderLeft: '4px solid hsl(var(--guide-purple))' }}>
            <div style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 4, color: 'hsl(var(--guide-purple))' }}>{s.dates}</div>
            <h4 style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '12.5px', color: '#2C2C2C', marginBottom: 3, lineHeight: 1.3 }}>{s.titre}</h4>
            <p style={{ fontSize: '10.5px', color: '#555', lineHeight: 1.5 }}>{s.desc}</p>
            <div style={{ fontSize: '10px', fontWeight: 700, marginTop: 5, color: 'hsl(var(--guide-purple))' }}>📍 {s.lieu}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Réservation bar */}
    <div style={{ background: 'hsl(var(--guide-purple))', color: 'white', margin: '0 36px 12px', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 11 }}>
      <span style={{ fontSize: 19, flexShrink: 0 }}>📞</span>
      <div style={{ fontSize: '10.5px', lineHeight: 1.5, flex: 1 }}>
        <strong style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '11.5px', display: 'block' }}>Réservations Scènes Plurielles : 03 27 19 04 43</strong>
        spectaclevivant@agglo-porteduhainaut.fr
      </div>
      <div style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: '13px', textAlign: 'right', whiteSpace: 'nowrap' }}>5€<small style={{ display: 'block', fontSize: '8.5px', fontWeight: 400, opacity: .8 }}>Gratuit -16 ans</small></div>
    </div>

    <div className="guide-rainbow-bar" />
    <div className="guide-strip" style={{ background: 'hsl(var(--guide-orange))' }}>🛍️ Vie Locale &amp; Brocante</div>
    <div style={{ padding: '14px 36px 12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {data.page8_vie_locale.map((e, i) => <GuideCard key={i} event={e} />)}
      </div>
    </div>

    {/* Final footer */}
    <div className="guide-rainbow-bar" />
    <div style={{ background: '#1A1A1A', padding: '18px 36px', color: 'white', fontSize: '10px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', background: '#111', borderRadius: 8 }}>
          <img src="/images/logo.png" style={{ height: 46, filter: 'brightness(10)' }} alt="OT" />
        </div>
        <div>
          <div style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: '10.5px', color: 'hsl(var(--guide-orange))', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6 }}>ON PREND CONTACT</div>
          <div style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '11.5px', color: 'white', marginBottom: 4 }}>À la Station Thermale</div>
          <div style={{ color: 'rgba(255,255,255,.75)', lineHeight: 1.6 }}>1303 Route de la Fontaine Bouillon<br />59230 Saint-Amand-les-Eaux</div>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: '11px', fontWeight: 600 }}>📞 +33 (0)3 27 48 39 65</div>
            <div style={{ color: 'rgba(255,255,255,.8)' }}>✉️ contact@tourisme-porteduhainaut.fr</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '10px', color: 'hsl(var(--guide-blue))', marginBottom: 4 }}>tourisme-porteduhainaut.com</div>
        </div>
      </div>
    </div>
  </div>
);

export default Page8Final;
