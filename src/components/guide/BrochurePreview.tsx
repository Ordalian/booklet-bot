import React from "react";

export interface BrochurePage {
  html: string;
  type: "fixed" | "dynamic";
}

interface BrochurePreviewProps {
  pages: BrochurePage[];
  guideRef: React.RefObject<HTMLDivElement>;
}

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

const BrochurePreview = ({ pages, guideRef }: BrochurePreviewProps) => (
  <div ref={guideRef} className="flex flex-col items-center gap-6 py-6">
    {pages.map((page, i) => (
      <div
        key={i}
        className="guide-page bg-white shadow-lg relative"
        style={{
          width: `${A4_WIDTH}px`,
          height: `${A4_HEIGHT}px`,
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: page.html }} />
        {/* Page number */}
        <div
          style={{
            position: "absolute",
            bottom: 8,
            right: 16,
            fontSize: "10px",
            color: "#999",
            fontFamily: "Arial, sans-serif",
          }}
        >
          {i + 1} / {pages.length}
        </div>
      </div>
    ))}
  </div>
);

export default BrochurePreview;
