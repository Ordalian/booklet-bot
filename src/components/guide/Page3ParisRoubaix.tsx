import type { EventsData } from "@/types/events";
import GuideHeader from "./GuideHeader";
import GuideFooter from "./GuideFooter";

const Page3ParisRoubaix = ({ data }: { data: EventsData }) => {
  const pr = data.page3_paris_roubaix;
  const visBg: Record<string, string> = { vert: 'hsl(var(--guide-green))', bleu: 'hsl(var(--guide-blue))' };
  return (
    <div className="guide-page">
      <GuideHeader pageNum={3} />
      {/* Hero */}
      <div style={{ position: 'relative', flexShrink: 0, overflow: 'hidden' }}>
        <img src="/images/trouee.jpg" style={{ width: '100%', height: 200, objectFit: 'cover', objectPosition: 'center 35%', display: 'block' }} alt="Paris-Roubaix" />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right,rgba(10,20,50,.82) 0%,rgba(10,20,50,.25) 70%)' }}>
          <div style={{ padding: '20px 36px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ background: 'hsl(var(--guide-yellow))', color: '#111', fontFamily: 'Montserrat', fontWeight: 900, fontSize: '10px', padding: '4px 14px', borderRadius: 16, display: 'inline-block', marginBottom: 9, textTransform: 'uppercase', letterSpacing: '2px', width: 'fit-content' }}>⭐ Grand Événement Cycliste</div>
            <h2 style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: '34px', color: 'white', textTransform: 'uppercase', lineHeight: 1, marginBottom: 4 }}>
              PARIS-<span style={{ color: 'hsl(var(--guide-yellow))' }}>ROUBAIX</span>
            </h2>
            <div style={{ fontFamily: 'Montserrat', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,.75)', marginBottom: 9 }}>{pr.edition} · {pr.date} · {pr.sous}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {pr.infos.map((info, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,.14)', borderRadius: 7, padding: '6px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '8px', color: 'rgba(255,255,255,.6)', textTransform: 'uppercase' }}>{info.label}</div>
                  <div style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '11px', color: 'white' }}>{info.valeur}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 36px 6px' }}>
        <div className="guide-section-title" style={{ color: 'hsl(var(--guide-blue))' }}>🗓️ La Semaine Paris-Roubaix · Visites guidées du Site Minier UNESCO</div>
      </div>

      {pr.visites.map((v, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '68px 1fr auto', gap: 12, padding: '11px 36px', borderBottom: i < pr.visites.length - 1 ? '1px solid #EEE' : 'none', alignItems: 'center' }}>
          <div style={{ background: visBg[v.couleur] || 'hsl(var(--guide-blue))', color: 'white', borderRadius: 7, padding: '7px 4px', textAlign: 'center' }}>
            <span style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: '19px', lineHeight: 1, display: 'block' }}>{v.dates}</span>
            <span style={{ fontFamily: 'Montserrat', fontWeight: 600, fontSize: '9px', textTransform: 'uppercase' }}>{v.mois}</span>
          </div>
          <div>
            <h4 style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '12px', color: '#2C2C2C', marginBottom: 3 }}>{v.titre}</h4>
            <p style={{ fontSize: '10.5px', color: '#555', lineHeight: 1.4 }}>{v.desc}</p>
          </div>
          <div style={{ background: 'hsl(var(--guide-bg-orange))', color: 'hsl(var(--guide-orange))', fontFamily: 'Montserrat', fontWeight: 800, fontSize: '14px', padding: '7px 11px', borderRadius: 7, textAlign: 'center', whiteSpace: 'nowrap' }}>
            {v.prix}<span style={{ display: 'block', fontSize: '9px', fontWeight: 600, color: '#888' }}>/ pers.</span>
          </div>
        </div>
      ))}

      <div style={{ margin: '10px 36px 0', background: 'hsl(var(--guide-blue))', borderRadius: 8, padding: '10px 15px', display: 'flex', alignItems: 'center', gap: 11, color: 'white' }}>
        <span style={{ fontSize: 19, flexShrink: 0 }}>📞</span>
        <div style={{ fontSize: '10.5px', lineHeight: 1.5, flex: 1 }}>
          <strong style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '11.5px', display: 'block', marginBottom: 1 }}>Réservation conseillée – paiement sur place ou en ligne</strong>
          03 27 48 39 65 · contact@tourisme-porteduhainaut.fr
        </div>
        <div style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: '11px', textAlign: 'right', whiteSpace: 'nowrap' }}>Max 25 pers.<br /><span style={{ fontSize: '9px', opacity: .8 }}>/ visite</span></div>
      </div>
      <div style={{ height: 8 }} />
      <GuideFooter title="On reste en contact" lines={["📞 +33 (0)3 27 48 39 65 · contact@tourisme-porteduhainaut.fr", "📍 Centre-Ville : 25 rue Thiers (Mar-Ven 9h30-17h)"]} />
    </div>
  );
};

export default Page3ParisRoubaix;
