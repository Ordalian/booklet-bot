import React, { useRef, useEffect, useCallback, Fragment, useMemo } from "react";
import { Stage, Layer, Rect, Circle, Text, Line, Transformer, Image as KImage, Group } from "react-konva";
import { EditorElement, A4_WIDTH, A4_HEIGHT } from "./types";
import useImage from "use-image";

interface Props {
  elements: EditorElement[];
  selectedId: string | null;
  scale: number;
  onSelect: (id: string | null) => void;
  onTransform: (id: string, changes: Partial<EditorElement>) => void;
  onBatchTransform?: (updates: { id: string; changes: Partial<EditorElement> }[]) => void;
  gridEnabled?: boolean;
  gridSize?: number;
}

const URLImage = ({ src, ...props }: any) => {
  const [image] = useImage(src, "anonymous");
  return <KImage image={image} {...props} />;
};

const GUIDE_COLOR = "#FF00FF";
const GRID_COLOR = "#e0e0e0";

const EditorCanvas = ({ elements, selectedId, scale, onSelect, onTransform, gridEnabled = false, gridSize = 20 }: Props) => {
  const trRef = useRef<any>(null);
  const stageRef = useRef<any>(null);
  const selectedRef = useRef<any>(null);

  // Find selected element's groupId
  const selectedGroupId = useMemo(() => {
    if (!selectedId) return null;
    const el = elements.find(e => e.id === selectedId);
    return el?.groupId || null;
  }, [selectedId, elements]);

  useEffect(() => {
    if (trRef.current && selectedRef.current) {
      trRef.current.nodes([selectedRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId]);

  const snapToGrid = useCallback((val: number) => {
    if (!gridEnabled) return val;
    return Math.round(val / gridSize) * gridSize;
  }, [gridEnabled, gridSize]);

  const handleStageClick = useCallback((e: any) => {
    if (e.target === e.target.getStage() || e.target.attrs.id === "bg") {
      onSelect(null);
    }
  }, [onSelect]);

  // Group drag: move all elements in group together
  const handleGroupDragEnd = useCallback((groupId: string, e: any) => {
    const groupEls = elements.filter(el => el.groupId === groupId);
    const originX = Math.min(...groupEls.map(el => el.x));
    const originY = Math.min(...groupEls.map(el => el.y));
    const newX = e.target.x();
    const newY = e.target.y();
    const dx = newX - originX;
    const dy = newY - originY;
    // No snap-to-grid for grouped tiles — keep elements perfectly aligned
    for (const el of groupEls) {
      onTransform(el.id, {
        x: Math.round(el.x + dx),
        y: Math.round(el.y + dy),
      });
    }
  }, [elements, onTransform]);

  const handleDragEnd = useCallback((id: string, e: any) => {
    const x = snapToGrid(Math.round(e.target.x()));
    const y = snapToGrid(Math.round(e.target.y()));
    onTransform(id, { x, y });
  }, [onTransform, snapToGrid]);

  const handleTransformEnd = useCallback((id: string, e: any) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    onTransform(id, {
      x: snapToGrid(Math.round(node.x())),
      y: snapToGrid(Math.round(node.y())),
      width: Math.round(Math.max(5, node.width() * scaleX)),
      height: Math.round(Math.max(5, node.height() * scaleY)),
      rotation: Math.round(node.rotation()),
    });
  }, [onTransform, snapToGrid]);

  const renderElement = (el: EditorElement, inGroup = false, groupOrigin?: { x: number; y: number }) => {
    if (!el.visible) return null;
    const isSelected = el.id === selectedId;
    const isGroupHighlighted = !inGroup && selectedGroupId && el.groupId === selectedGroupId;

    // Use relative positions inside groups
    const elX = inGroup && groupOrigin ? el.x - groupOrigin.x : el.x;
    const elY = inGroup && groupOrigin ? el.y - groupOrigin.y : el.y;

    const commonProps = {
      key: el.id,
      id: el.id,
      x: elX,
      y: elY,
      rotation: el.rotation,
      opacity: el.opacity,
      draggable: !el.locked && !inGroup,
      onClick: () => onSelect(el.id),
      onTap: () => onSelect(el.id),
      onDragEnd: inGroup ? undefined : (e: any) => handleDragEnd(el.id, e),
      onTransformEnd: inGroup ? undefined : (e: any) => handleTransformEnd(el.id, e),
      ref: isSelected && !inGroup ? selectedRef : undefined,
    };

    switch (el.type) {
      case "rect":
        return <Rect {...commonProps} width={el.width} height={el.height} fill={el.fill} stroke={isGroupHighlighted ? "#6366f1" : el.stroke} strokeWidth={isGroupHighlighted ? 2 : el.strokeWidth} cornerRadius={el.cornerRadius} />;
      case "circle":
        return <Circle {...commonProps} x={elX + el.width / 2} y={elY + el.height / 2} radiusX={el.width / 2} radiusY={el.height / 2} fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth}
          onDragEnd={inGroup ? undefined : (e: any) => handleDragEnd(el.id, { target: { x: () => e.target.x() - el.width / 2, y: () => e.target.y() - el.height / 2 } } as any)}
        />;
      case "text":
        if (el.textBgEnabled && el.textBgColor) {
          const pad = el.textBgPadding || 8;
          const bgW = el.width + pad * 2;
          const bgH = (el.height || 40) + pad * 2;
          return (
            <Fragment key={el.id}>
              <Rect x={elX - pad} y={elY - pad} width={bgW} height={bgH} fill={el.textBgColor} cornerRadius={el.textBgRadius || 0} rotation={el.rotation} opacity={el.opacity} />
              <Text {...commonProps} text={el.text} fontSize={el.fontSize} fontFamily={el.fontFamily} fontStyle={el.fontStyle} align={el.textAlign as any} verticalAlign="middle" fill={el.fill} width={el.width} height={el.height || 40} />
            </Fragment>
          );
        }
        return <Text {...commonProps} text={el.text} fontSize={el.fontSize} fontFamily={el.fontFamily} fontStyle={el.fontStyle} align={el.textAlign as any} verticalAlign="middle" fill={el.fill} width={el.width} height={el.height || 40} />;
      case "image":
        return <URLImage {...commonProps} src={el.src} width={el.width} height={el.height} />;
      case "line":
        return <Line {...commonProps} points={el.points || [0, 0, 200, 0]} stroke={el.stroke || "#000"} strokeWidth={el.strokeWidth || 2} />;
      default:
        return null;
    }
  };

  // Separate elements into groups and ungrouped, compute group origins
  const { groups, ungrouped } = useMemo(() => {
    const groupMap = new Map<string, EditorElement[]>();
    const ungrouped: EditorElement[] = [];
    for (const el of elements) {
      if (el.groupId) {
        const arr = groupMap.get(el.groupId) || [];
        arr.push(el);
        groupMap.set(el.groupId, arr);
      } else {
        ungrouped.push(el);
      }
    }
    return { groups: Array.from(groupMap.entries()), ungrouped };
  }, [elements]);

  // Compute group bounding box origins
  const getGroupOrigin = useCallback((groupEls: EditorElement[]) => {
    const minX = Math.min(...groupEls.map(e => e.x));
    const minY = Math.min(...groupEls.map(e => e.y));
    return { x: minX, y: minY };
  }, []);

  const renderGrid = () => {
    if (!gridEnabled) return null;
    const lines: React.ReactNode[] = [];
    for (let x = 0; x <= A4_WIDTH; x += gridSize) {
      lines.push(<Line key={`gv-${x}`} points={[x, 0, x, A4_HEIGHT]} stroke={GRID_COLOR} strokeWidth={0.5} />);
    }
    for (let y = 0; y <= A4_HEIGHT; y += gridSize) {
      lines.push(<Line key={`gh-${y}`} points={[0, y, A4_WIDTH, y]} stroke={GRID_COLOR} strokeWidth={0.5} />);
    }
    return <>{lines}</>;
  };

  const getGuideLines = () => {
    if (!selectedId) return [];
    const lines: { points: number[]; stroke: string }[] = [];
    const sel = elements.find(e => e.id === selectedId);
    if (!sel) return lines;
    const cx = sel.x + sel.width / 2;
    const cy = sel.y + sel.height / 2;
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
      <div style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)", borderRadius: 4 }}>
        <Stage
          ref={stageRef}
          width={A4_WIDTH * scale}
          height={A4_HEIGHT * scale}
          scaleX={scale}
          scaleY={scale}
          onClick={handleStageClick}
          onTap={handleStageClick}
          style={{ background: "#fff" }}
        >
          <Layer>
            <Rect id="bg" x={0} y={0} width={A4_WIDTH} height={A4_HEIGHT} fill="white" />
            {renderGrid()}
            <Rect x={40} y={40} width={A4_WIDTH - 80} height={A4_HEIGHT - 80} stroke="#eee" strokeWidth={0.5} dash={[4, 4]} />

            {/* Render ungrouped elements */}
            {ungrouped.map(el => renderElement(el))}

            {/* Render grouped elements in Konva Groups with relative positioning */}
            {groups.map(([gId, groupEls]) => {
              const origin = getGroupOrigin(groupEls);
              return (
                <Group
                  key={gId}
                  x={origin.x}
                  y={origin.y}
                  draggable={!groupEls.some(e => e.locked)}
                  onClick={() => onSelect(groupEls[0]?.id || null)}
                  onTap={() => onSelect(groupEls[0]?.id || null)}
                  onDragEnd={(e) => handleGroupDragEnd(gId, e)}
                >
                  {groupEls.map(el => renderElement(el, true, origin))}
                </Group>
              );
            })}
            {getGuideLines().map((g, i) => (
              <Line key={`guide-${i}`} points={g.points} stroke={g.stroke} strokeWidth={1} dash={[4, 4]} />
            ))}

            {selectedId && !selectedGroupId && (
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
    </div>
  );
};

export default EditorCanvas;
