const GuideHeader = ({ pageNum }: { pageNum: number }) => (
  <div className="flex items-center justify-between px-9 py-3 border-b-[3px]" style={{ borderColor: 'hsl(var(--guide-orange))' }}>
    <img src="/images/logo.png" alt="OT" className="h-10" />
    <div className="font-bold text-lg" style={{ fontFamily: 'Montserrat', fontWeight: 900, color: 'hsl(var(--guide-orange))' }}>
      {String(pageNum).padStart(2, '0')}
    </div>
  </div>
);

export default GuideHeader;
