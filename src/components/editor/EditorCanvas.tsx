import React, { useRef, useEffect, useCallback } from "react";
import { Stage, Layer, Rect, Circle, Text, Line, Transformer, Image as KImage } from "react-konva";
import { EditorElement, A4_WIDTH, A4_HEIGHT } from "./types";
import useImage from "use-image";

interface Props {
  elements: EditorElement[];
  selectedId: string | null;
  scale: number;
  onSelect: (id: string | null) => void;
  onTransform: (id: string, changes: Partial<EditorElement>) => void;
}

const URLImage = ({ src, ...props }: any) => {
  const [image] = useImage(src, "anonymous");
  return <KImage image={image} {...props} />;
};

const GUIDE_COLOR = "#FF00FF";

const EditorCanvas = ({ elements, selectedId, scale, onSelect, onTransform }: Props) => {
  const trRef = useRef<any>(null);
  const stageRef = useRef<any>(null);
  const selectedRef = useRef<any>(null);

  useEffect(() => {
    if (trRef.current && selectedRef.current) {
      trRef.current.nodes([selectedRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId]);

  const handleStageClick = useCallback((e: any) => {
    if (e.target === e.target.getStage() || e.target.attrs.id === "bg") {
      onSelect(null);
    }
  }, [onSelect]);

  const handleDragEnd = useCallback((id: string, e: any) => {
    onTransform(id, { x: Math.round(e.target.x()), y: Math.round(e.target.y()) });
  }, [onTransform]);

  const handleTransformEnd = useCallback((id: string, e: any) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    onTransform(id, {
      x: Math.round(node.x()),
      y: Math.round(node.y()),
      width: Math.round(Math.max(5, node.width() * scaleX)),
      height: Math.round(Math.max(5, node.height() * scaleY)),
      rotation: Math.round(node.rotation()),
    });
  }, [onTransform]);

  const renderElement = (el: EditorElement) => {
    if (!el.visible) return null;
    const isSelected = el.id === selectedId;
    const commonProps = {
      key: el.id,
      id: el.id,
      x: el.x,
      y: el.y,
      rotation: el.rotation,
      opacity: el.opacity,
      draggable: !el.locked,
      onClick: () => onSelect(el.id),
      onTap: () => onSelect(el.id),
      onDragEnd: (e: any) => handleDragEnd(el.id, e),
      onTransformEnd: (e: any) => handleTransformEnd(el.id, e),
      ref: isSelected ? selectedRef : undefined,
    };

    switch (el.type) {
      case "rect":
        return <Rect {...commonProps} width={el.width} height={el.height} fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth} cornerRadius={el.cornerRadius} />;
      case "circle":
        return <Circle {...commonProps} x={el.x + el.width / 2} y={el.y + el.height / 2} radiusX={el.width / 2} radiusY={el.height / 2} fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth}
          onDragEnd={(e: any) => handleDragEnd(el.id, { target: { x: () => e.target.x() - el.width / 2, y: () => e.target.y() - el.height / 2 } } as any)}
        />;
      case "text":
        return <Text {...commonProps} text={el.text} fontSize={el.fontSize} fontFamily={el.fontFamily} fontStyle={el.fontStyle} align={el.textAlign as any} fill={el.fill} width={el.width} />;
      case "image":
        return <URLImage {...commonProps} src={el.src} width={el.width} height={el.height} />;
      case "line":
        return <Line {...commonProps} points={el.points || [0, 0, 200, 0]} stroke={el.stroke || "#000"} strokeWidth={el.strokeWidth || 2} />;
      default:
        return null;
    }
  };

  // Snapping guides
  const getGuideLines = () => {
    if (!selectedId) return [];
    const lines: { points: number[]; stroke: string }[] = [];
    const sel = elements.find(e => e.id === selectedId);
    if (!sel) return lines;
    const cx = sel.x + sel.width / 2;
    const cy = sel.y + sel.height / 2;
    // Center guides
    if (Math.abs(cx - A4_WIDTH / 2) < 5) {
      lines.push({ points: [A4_WIDTH / 2, 0, A4_WIDTH / 2, A4_HEIGHT], stroke: GUIDE_COLOR });
    }
    if (Math.abs(cy - A4_HEIGHT / 2) < 5) {
      lines.push({ points: [0, A4_HEIGHT / 2, A4_WIDTH, A4_HEIGHT / 2], stroke: GUIDE_COLOR });
    }
    return lines;
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center" style={{ padding: 16 }}>
      <Stage
        ref={stageRef}
        width={A4_WIDTH * scale}
        height={A4_HEIGHT * scale}
        scaleX={scale}
        scaleY={scale}
        onClick={handleStageClick}
        onTap={handleStageClick}
        style={{ background: "#f0f0f0", boxShadow: "0 2px 16px rgba(0,0,0,0.12)" }}
      >
        <Layer>
          {/* A4 background */}
          <Rect id="bg" x={0} y={0} width={A4_WIDTH} height={A4_HEIGHT} fill="white" />
          {/* Margin guides */}
          <Rect x={40} y={40} width={A4_WIDTH - 80} height={A4_HEIGHT - 80} stroke="#eee" strokeWidth={0.5} dash={[4, 4]} />

          {elements.map(renderElement)}

          {/* Snapping guides */}
          {getGuideLines().map((g, i) => (
            <Line key={`guide-${i}`} points={g.points} stroke={g.stroke} strokeWidth={1} dash={[4, 4]} />
          ))}

          {selectedId && (
            <Transformer
              ref={trRef}
              rotateEnabled
              enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right", "middle-left", "middle-right", "top-center", "bottom-center"]}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) return oldBox;
                return newBox;
              }}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
};

export default EditorCanvas;
