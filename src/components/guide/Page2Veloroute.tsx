import type { EventsData } from "@/types/events";
import GuideHeader from "./GuideHeader";
import GuideFooter from "./GuideFooter";
import { TagList } from "./GuideTag";

const Page2Veloroute = ({ data }: { data: EventsData }) => {
  const pv = data.page2_veloroute;
  return (
    <div className="guide-page">
      <GuideHeader pageNum={2} />
      {/* Banner */}
      <div style={{ position: 'relative', flexShrink: 0, overflow: 'hidden' }}>
        <img src="/images/velo_banner.png" style={{ width: '100%', height: 170, objectFit: 'cover', objectPosition: 'center', display: 'block' }} alt="Véloroute" />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right,rgba(0,60,100,.65) 0%,rgba(0,60,100,.1) 60%)', display: 'flex', alignItems: 'center', padding: '0 36px', justifyContent: 'space-between' }}>
          <div>
            <div style={{ background: 'hsl(var(--guide-orange))', color: 'white', fontFamily: 'Montserrat', fontWeight: 900, fontSize: '11px', padding: '5px 15px', borderRadius: 18, display: 'inline-block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1.5px' }}>🚴 {pv.date}</div>
            <h2 style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: '22px', color: 'white', textTransform: 'uppercase', lineHeight: 1.1 }}>
              {pv.sous_titre}<br /><span style={{ fontSize: '12px', color: 'rgba(255,255,255,.8)', fontWeight: 400 }}>{pv.sous_desc}</span>
            </h2>
          </div>
          <div style={{ background: 'hsl(var(--guide-yellow))', color: '#111', fontFamily: 'Montserrat', fontWeight: 900, fontSize: '12px', padding: '8px 14px', borderRadius: 8, textTransform: 'uppercase', textAlign: 'center' }}>GRATUIT<br /><span style={{ fontSize: '9px' }}>entrée libre</span></div>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ padding: '14px 36px 6px' }}>
        <div className="guide-section-title" style={{ color: 'hsl(var(--guide-blue))' }}>Programme de la journée</div>
        {pv.programme.map((item, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '86px 1fr', gap: 13, padding: '10px 0', borderBottom: i < pv.programme.length - 1 ? '1px solid #EEE' : 'none', alignItems: 'start' }}>
            <div style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '11px', color: 'hsl(var(--guide-orange))', textAlign: 'right', paddingTop: 2 }}>{item.horaire}</div>
            <div>
              <h4 style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '12.5px', color: '#2C2C2C', marginBottom: 3 }} dangerouslySetInnerHTML={{ __html: item.titre }} />
              <p style={{ fontSize: '11px', color: '#555', lineHeight: 1.5 }}>{item.desc}</p>
              <TagList tags={item.tags} />
            </div>
          </div>
        ))}
      </div>

      <GuideFooter title="On prend contact" lines={["📞 +33 (0)3 27 48 39 65", "✉️ contact@tourisme-porteduhainaut.fr", "📍 1303 route de la Fontaine Bouillon – 59230 Saint-Amand-les-Eaux"]} />
    </div>
  );
};

export default Page2Veloroute;
