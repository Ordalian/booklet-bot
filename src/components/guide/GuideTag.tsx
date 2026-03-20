import type { EventTag } from "@/types/events";

const tagStyles: Record<string, string> = {
  free: "background: #E8F5E9; color: #2E7D32;",
  paid: "background: #FFF8E1; color: #E65100;",
  fam: "background: #FCE4EC; color: #C62828;",
  loc: "background: hsl(var(--guide-bg-blue)); color: #1a6a9a;",
};

const GuideTag = ({ tag }: { tag: EventTag }) => (
  <span className="guide-tag" style={Object.fromEntries(
    (tagStyles[tag.type] || "").split(";").filter(Boolean).map(s => {
      const [k, v] = s.split(":").map(x => x.trim());
      return [k, v];
    })
  )}>
    {tag.texte}
  </span>
);

export const TagList = ({ tags }: { tags?: EventTag[] }) => (
  <>{(tags || []).map((t, i) => <GuideTag key={i} tag={t} />)}</>
);

export default GuideTag;
