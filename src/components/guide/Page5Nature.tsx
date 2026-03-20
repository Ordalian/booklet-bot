import type { EventsData } from "@/types/events";
import GuideHeader from "./GuideHeader";
import GuideFooter from "./GuideFooter";
import GuideCard from "./GuideCard";
import { TagList } from "./GuideTag";

const Page5Nature = ({ data }: { data: EventsData }) => {
  const p = data.page5_nature;
  return (
    <div className="guide-page">
      <GuideHeader pageNum={5} />
      <div className="guide-strip" style={{ background: 'hsl(var(--guide-green))' }}>🌿 Nature &amp; Sorties Famille</div>
      <div style={{ padding: '14px 36px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {p.nature.map((e, i) => (
            <div key={i} className="guide-card" style={{ background: 'hsl(var(--guide-bg-green))', borderLeft: '4px solid hsl(var(--guide-green))' }}>
              <div style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 4, color: 'hsl(var(--guide-green))' }}>{e.dates}</div>
              <h4 style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '12.5px', color: '#2C2C2C', marginBottom: 3, lineHeight: 1.3 }}>{e.titre}</h4>
              <p style={{ fontSize: '10.5px', color: '#555', lineHeight: 1.5 }}>{e.desc}</p>
              <div style={{ fontSize: '10px', fontWeight: 700, marginTop: 5, color: 'hsl(var(--guide-green))' }}>📍 {e.lieu}</div>
              <TagList tags={e.tags} />
            </div>
          ))}
        </div>
      </div>
      <div className="guide-strip" style={{ background: 'hsl(var(--guide-orange))' }}>🐣 Famille &amp; Enfants – Vacances de Pâques</div>
      <div style={{ padding: '14px 36px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {p.paques.map((e, i) => <GuideCard key={i} event={e} />)}
        </div>
      </div>
      <GuideFooter title="Infos & Réservations" lines={["📞 +33 (0)3 27 48 39 65 · tourisme-porteduhainaut.com/preparer/agenda"]} />
    </div>
  );
};

export default Page5Nature;
