import type { EventsData } from "@/types/events";
import Page1Cover from "./Page1Cover";
import Page2Veloroute from "./Page2Veloroute";
import Page3ParisRoubaix from "./Page3ParisRoubaix";
import Page4Culture from "./Page4Culture";
import Page5Nature from "./Page5Nature";
import Page6Loisirs from "./Page6Loisirs";
import Page7GPS from "./Page7GPS";
import Page8Final from "./Page8Final";
import React from "react";

interface GuidePreviewProps {
  data: EventsData;
  guideRef: React.RefObject<HTMLDivElement>;
}

const GuidePreview = ({ data, guideRef }: GuidePreviewProps) => (
  <div ref={guideRef} className="flex flex-col items-center gap-5 py-6">
    <Page1Cover data={data} />
    <Page2Veloroute data={data} />
    <Page3ParisRoubaix data={data} />
    <Page4Culture data={data} />
    <Page5Nature data={data} />
    <Page6Loisirs />
    <Page7GPS />
    <Page8Final data={data} />
  </div>
);

export default GuidePreview;
