import GuideHeader from "./GuideHeader";
import GuideFooter from "./GuideFooter";

const activities = (items: { icon: string; nom: string; desc: string }[]) =>
  items.map((a, i) => (
    <div key={i} style={{ background: 'rgba(255,255,255,.14)', borderRadius: 6, padding: '7px 5px', textAlign: 'center', fontSize: '8.5px', fontWeight: 600, lineHeight: 1.4 }}>
      <span style={{ fontSize: 16, display: 'block', marginBottom: 2 }}>{a.icon}</span>
      {a.nom}<br /><em style={{ opacity: .7, fontStyle: 'normal' }}>{a.desc}</em>
    </div>
  ));

const parc = [
  { icon: "⛳", nom: "Mini-Golf", desc: "Dès 6 ans" },
  { icon: "🎿", nom: "Tyrolienne", desc: "25kg/1m20" },
  { icon: "🥏", nom: "Disc-Golf", desc: "45 pers." },
  { icon: "🚣", nom: "Bateaux", desc: "2 ou 4 pl." },
  { icon: "🚲", nom: "Vélos", desc: "VTC, VAE" },
  { icon: "🗺️", nom: "Orientation", desc: "4 niveaux" },
];
const port = [
  { icon: "🛶", nom: "Kayak", desc: "Dès 8 ans" },
  { icon: "🏄", nom: "Paddle", desc: "Dès 8 ans" },
  { icon: "🐉", nom: "Dragon Boat", desc: "Encadré" },
  { icon: "⚡", nom: "Élec.", desc: "Tout âge" },
  { icon: "🚲", nom: "Vélos", desc: "Dès 6 ans" },
  { icon: "🎊", nom: "Privatisation", desc: "500 pers." },
];

const Page6Loisirs = () => (
  <div className="guide-page">
    <GuideHeader pageNum={6} />
    <div style={{ padding: '14px 36px 10px', textAlign: 'center', flexShrink: 0 }}>
      <div style={{ fontFamily: 'Montserrat', fontSize: '11px', fontWeight: 700, color: 'hsl(var(--guide-green))', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 5 }}>Saison Loisirs 2026 – À partir d'Avril</div>
      <h2 style={{ fontFamily: 'Montserrat', fontSize: '20px', fontWeight: 900, color: '#2C2C2C', textTransform: 'uppercase' }}>Nos Espaces Loisirs Ouvrent !</h2>
    </div>
    <div style={{ padding: '0 36px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      {[
        { img: '/images/parc.jpg', title: 'Parc Loisirs\n& Nature', sub: '📍 Av. Fontaine Bouillon – 59590 Raismes', desc: 'Dans le Parc Naturel Régional Scarpe-Escaut, activités pour toute la famille.', acts: parc, grad: 'linear-gradient(135deg,rgba(46,107,85,.97),rgba(30,80,60,.97))', note: 'Avr-Sep · Sous resp. accompagnateurs' },
        { img: '/images/port.jpg', title: 'Port Fluvial\nLa Porte du Hainaut', sub: "📍 Chemin de l'Empire – 59230 Saint-Amand", desc: "Au bord de l'Escaut, loisirs nautiques et terrestres. Privatisation possible.", acts: port, grad: 'linear-gradient(135deg,rgba(26,106,154,.97),rgba(26,60,96,.97))', note: 'Avr-Sep · Savoir nager requis' },
      ].map((card, i) => (
        <div key={i} style={{ borderRadius: 12, overflow: 'hidden', color: 'white' }}>
          <img src={card.img} style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} alt={card.title} />
          <div style={{ padding: '14px 16px', background: card.grad }}>
            <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(255,255,255,.65)', marginBottom: 4 }}>{card.sub}</div>
            <div style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: '16px', textTransform: 'uppercase', lineHeight: 1.1, marginBottom: 5 }} dangerouslySetInnerHTML={{ __html: card.title.replace('\n', '<br/>') }} />
            <div style={{ fontSize: '10.5px', opacity: .9, lineHeight: 1.5, marginBottom: 10 }}>{card.desc}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>{activities(card.acts)}</div>
            <div style={{ fontSize: '9px', opacity: .7, marginTop: 7 }}>{card.note}</div>
          </div>
        </div>
      ))}
    </div>
    <GuideFooter title="On prend contact" lines={["📞 +33 (0)3 27 48 39 65 · contact@tourisme-porteduhainaut.fr"]} />
  </div>
);

export default Page6Loisirs;
