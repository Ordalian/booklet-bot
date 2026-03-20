const IG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
    <defs><linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" style={{stopColor:'#f09433'}}/><stop offset="50%" style={{stopColor:'#dc2743'}}/><stop offset="100%" style={{stopColor:'#bc1888'}}/></linearGradient></defs>
    <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig)"/><circle cx="12" cy="12" r="4" fill="none" stroke="white" strokeWidth="1.8"/><circle cx="17.5" cy="6.5" r="1.2" fill="white"/>
  </svg>
);

const FB = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
    <rect width="24" height="24" rx="4" fill="#1877F2"/><path d="M16 8h-2c-.55 0-1 .45-1 1v2h3l-.5 3H13v7h-3v-7H8v-3h2V9c0-2.21 1.79-4 4-4h2v3z" fill="white"/>
  </svg>
);

const GuideFooter = ({ title, lines }: { title: string; lines: string[] }) => (
  <>
    <div className="guide-rainbow-bar" />
    <div className="grid" style={{ gridTemplateColumns: '160px 1fr 190px', background: '#1A1A1A' }}>
      <div className="flex items-center justify-center p-3" style={{ background: '#111' }}>
        <img src="/images/logo.png" alt="OT" className="h-11" style={{ filter: 'brightness(10)' }} />
      </div>
      <div className="flex flex-col justify-center gap-0.5 px-3.5 py-2.5">
        <div style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: '10.5px', color: 'hsl(var(--guide-orange))', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '2px' }}>{title}</div>
        {lines.map((l, i) => <div key={i} style={{ fontSize: '10px', color: 'rgba(255,255,255,.83)' }}>{l}</div>)}
      </div>
      <div className="flex flex-col items-end justify-center gap-1.5 px-3.5 py-2.5" style={{ background: '#242424' }}>
        <div style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '9.5px', color: 'hsl(var(--guide-blue))', marginBottom: '3px' }}>tourisme-porteduhainaut.com</div>
        <div className="flex items-center gap-1.5" style={{ fontSize: '10px', color: 'rgba(255,255,255,.82)' }}><IG /><span>@porteduhainauttourisme</span></div>
        <div className="flex items-center gap-1.5" style={{ fontSize: '10px', color: 'rgba(255,255,255,.82)' }}><FB /><span>/porteduhainauttourisme</span></div>
      </div>
    </div>
  </>
);

export default GuideFooter;
