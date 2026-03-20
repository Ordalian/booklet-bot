import type { EventsData } from "@/types/events";
import GuideHeader from "./GuideHeader";
import GuideFooter from "./GuideFooter";
import GuideCard from "./GuideCard";

const Page4Culture = ({ data }: { data: EventsData }) => {
  const p = data.page4_culture;
  return (
    <div className="guide-page">
      <GuideHeader pageNum={4} />
      <div className="guide-strip" style={{ background: 'hsl(var(--guide-orange))' }}>🎨 Culture &amp; Expositions</div>
      <div style={{ padding: '14px 36px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {p.expositions.map((e, i) => <GuideCard key={i} event={e} />)}
        </div>
        <div className="guide-section-title" style={{ color: 'hsl(var(--guide-blue))', marginTop: 8 }}>🎭 Spectacles &amp; Animations</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {p.spectacles.map((s, i) => <GuideCard key={i} event={s} />)}
        </div>
      </div>
      <GuideFooter title="Infos & Réservations" lines={["📞 +33 (0)3 27 48 39 65 · contact@tourisme-porteduhainaut.fr"]} />
    </div>
  );
};

export default Page4Culture;
