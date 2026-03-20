import type { CardEvent } from "@/types/events";
import { TagList } from "./GuideTag";

const colorMap: Record<string, { bg: string; border: string; text: string }> = {
  o: { bg: 'hsl(var(--guide-bg-orange))', border: 'hsl(var(--guide-orange))', text: 'hsl(var(--guide-orange))' },
  b: { bg: 'hsl(var(--guide-bg-blue))', border: 'hsl(var(--guide-blue))', text: 'hsl(var(--guide-blue))' },
  g: { bg: 'hsl(var(--guide-bg-green))', border: 'hsl(var(--guide-green))', text: 'hsl(var(--guide-green))' },
  p: { bg: '#F3E5F5', border: 'hsl(var(--guide-purple))', text: 'hsl(var(--guide-purple))' },
  y: { bg: '#FFF8E1', border: 'hsl(var(--guide-yellow))', text: 'hsl(var(--guide-yellow))' },
  d: { bg: '#F5F5F5', border: '#888', text: '#888' },
};

const GuideCard = ({ event, style }: { event: CardEvent; style?: React.CSSProperties }) => {
  const c = colorMap[event.couleur || 'b'] || colorMap.b;
  return (
    <div className="guide-card" style={{
      background: c.bg,
      borderLeft: `4px solid ${c.border}`,
      ...(event.span ? { gridColumn: `span ${event.span}` } : {}),
      ...style,
    }}>
      <div style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '4px', color: c.text }}>
        {event.dates}
      </div>
      <h4 style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '12.5px', color: '#2C2C2C', marginBottom: '3px', lineHeight: 1.3 }}
        dangerouslySetInnerHTML={{ __html: event.titre }} />
      <p style={{ fontSize: '10.5px', color: '#555', lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: event.desc }} />
      <div style={{ fontSize: '10px', fontWeight: 700, marginTop: '5px', color: c.text }}>📍 {event.lieu}</div>
      <TagList tags={event.tags} />
    </div>
  );
};

export default GuideCard;
