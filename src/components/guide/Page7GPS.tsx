import GuideHeader from "./GuideHeader";

const Page7GPS = () => (
  <div className="guide-page">
    <GuideHeader pageNum={7} />
    <div style={{ background: 'linear-gradient(135deg,#EDF4F1,#E0F0EB)', padding: '0 0 14px', borderTop: '3px solid hsl(var(--guide-green))' }}>
      <img src="/images/gps.jpg" style={{ width: '100%', height: 155, objectFit: 'cover', objectPosition: 'center 30%', display: 'block' }} alt="GPS" />
      <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 18, alignItems: 'center', padding: '14px 36px 0' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 110, height: 110, borderRadius: '50%', background: 'hsl(var(--guide-green))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'white', fontFamily: 'Montserrat', fontWeight: 900, fontSize: '26px', lineHeight: 1, margin: '0 auto 6px' }}>
            GPS<span style={{ fontSize: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', opacity: .9, textAlign: 'center' }}>Guide Privé<br />Sympathique</span>
          </div>
          <div style={{ fontSize: '10px', color: '#555' }}>Groupes<br /><strong style={{ color: 'hsl(var(--guide-green))' }}>2 à 12 personnes</strong></div>
        </div>
        <div>
          <h3 style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: '18px', color: 'hsl(var(--guide-green))', textTransform: 'uppercase', marginBottom: 3 }}>Visites GPS</h3>
          <div style={{ fontStyle: 'italic', fontSize: '12px', fontWeight: 600, color: '#333', marginBottom: 7 }}>"Guide Privé Sympathique"</div>
          <p style={{ fontSize: '11px', color: '#555', lineHeight: 1.6, marginBottom: 7 }}>Un guide passionné pour explorer le territoire en famille, entre amis ou entre collègues. 1h de visite personnalisée.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 7 }}>
            {[{ l: 'Lun–Sam', a: '50€' }, { l: 'Dimanche', a: '70€' }, { l: 'Jours Fériés', a: '95€' }].map((p, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 6, padding: 6, textAlign: 'center', border: '1px solid #DDD' }}>
                <div style={{ fontSize: '8.5px', fontWeight: 600, color: '#888', textTransform: 'uppercase' }}>{p.l}</div>
                <div style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: '15px', color: 'hsl(var(--guide-green))' }}>{p.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    <div className="guide-rainbow-bar" />

    {/* Thermes */}
    <div style={{ background: 'linear-gradient(135deg,#EAF4FA,#D6EBF5)', padding: '16px 36px', borderTop: '3px solid hsl(var(--guide-blue))', display: 'grid', gridTemplateColumns: '1fr 180px', gap: 16, alignItems: 'center' }}>
      <div>
        <h3 style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: '16px', color: 'hsl(var(--guide-blue))', textTransform: 'uppercase', marginBottom: 4 }}>
          Thermes de <span style={{ color: 'hsl(var(--guide-orange))' }}>Saint-Amand-les-Eaux</span>
        </h3>
        <p style={{ fontSize: '11px', color: '#444', lineHeight: 1.6, marginBottom: 7 }}>Seul établissement thermal au nord de Paris. Le <strong>Pass Curiste 2026</strong> disponible à l'Office de Tourisme.</p>
        <div style={{ fontSize: '10.5px', color: 'hsl(var(--guide-blue))', fontWeight: 600 }}>📍 1303 Route de la Fontaine Bouillon – 59230 Saint-Amand-les-Eaux</div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 6 }}>
          {[{ t: '💆 Soins thermaux', c: 'hsl(var(--guide-blue))' }, { t: '🏊 Piscine', c: 'hsl(var(--guide-green))' }, { t: '🌿 Bien-être', c: 'hsl(var(--guide-orange))' }].map((tag, i) => (
            <div key={i} style={{ color: 'white', fontFamily: 'Montserrat', fontWeight: 700, fontSize: '9.5px', padding: '4px 10px', borderRadius: 16, background: tag.c }}>{tag.t}</div>
          ))}
        </div>
      </div>
      <img src="/images/pass_curiste.jpg" style={{ width: '100%', borderRadius: 8, boxShadow: '0 3px 10px rgba(0,0,0,.15)' }} alt="Pass Curiste" />
    </div>
  </div>
);

export default Page7GPS;
