import { EditorElement, createId, A4_WIDTH } from "@/components/editor/types";

export type TileSize = "normal" | "large";
export type FontScale = 1 | 1.2 | 1.5;

export interface TileEvent {
  title: string;
  date?: string;
  location?: string;
  description?: string;
  price?: string;
  imageUrl?: string;
  tags?: string[];
}

const MARGIN = 40;
const TILE_W_NORMAL = 340;
const TILE_W_LARGE = A4_WIDTH - MARGIN * 2;
const PAD = 16;
const LINE_H = 1.45;

// Base font sizes — readable at print scale
const TITLE_SIZE  = 19;
const META_SIZE   = 13;
const DESC_SIZE   = 12;
const PRICE_SIZE  = 13;
const TAG_SIZE    = 10;

const IMG_H_NORMAL = 120;
const IMG_H_LARGE  = 200;

function estimateTextHeight(text: string, fontSize: number, maxWidth: number): number {
  const avgCharWidth = fontSize * 0.52;
  const charsPerLine = Math.max(1, Math.floor(maxWidth / avgCharWidth));
  const lines = Math.ceil(text.length / charsPerLine);
  return Math.max(fontSize * LINE_H, lines * fontSize * LINE_H) + 2;
}

export function buildEventTile(
  event: TileEvent,
  x: number,
  y: number,
  format: "withImage" | "noImage",
  catColor: string,
  _brandPrimary?: string,
  size: TileSize = "normal",
  fontScale: FontScale = 1,
): EditorElement[] {
  const groupId = createId();
  const elements: EditorElement[] = [];
  const isImg = format === "withImage";
  const TILE_W = size === "large" ? TILE_W_LARGE : TILE_W_NORMAL;
  const IMG_H  = size === "large" ? IMG_H_LARGE  : IMG_H_NORMAL;
  const textW  = TILE_W - PAD * 2;

  // Scaled font sizes
  const tSize  = TITLE_SIZE  * fontScale;
  const mSize  = META_SIZE   * fontScale;
  const dSize  = DESC_SIZE   * fontScale;
  const pSize  = PRICE_SIZE  * fontScale;
  const tagSz  = TAG_SIZE    * fontScale;

  // ── Heights: use estimateTextHeight everywhere so text never clips
  const titleH  = estimateTextHeight(event.title || "Événement", tSize, textW);
  const dateH   = event.date
    ? estimateTextHeight(`📅 ${event.date}`, mSize, textW) + 2
    : 0;
  const locH    = event.location
    ? estimateTextHeight(`📍 ${event.location}`, mSize, textW) + 2
    : 0;
  const descH   = event.description
    ? estimateTextHeight(event.description, dSize, textW) + 4
    : 0;
  const priceText = event.price ? `💰 ${event.price}` : "";
  const priceH  = event.price
    ? estimateTextHeight(priceText, pSize, textW - 12) + 10
    : 0;
  const tagsH   = event.tags?.length ? tagSz * LINE_H + 4 : 0;
  // Compact separator — just enough room for the 1 px line
  const separatorH = (event.date || event.location) && (event.description || event.price) ? 6 : 0;
  const imgZoneH = isImg ? IMG_H + 10 : 0;

  const ACCENT_BAR_H    = 5;
  const INNER_TOP_PAD   = 12;
  const INNER_BOTTOM_PAD = PAD;

  const totalH =
    ACCENT_BAR_H +
    INNER_TOP_PAD +
    titleH +
    4 +           // tight gap below title
    dateH +
    locH +
    separatorH +
    descH +
    priceH +
    tagsH +
    imgZoneH +
    INNER_BOTTOM_PAD;

  let curY = y;

  // ── Background card
  elements.push({
    id: createId(), type: "rect", groupId,
    x, y, width: TILE_W, height: totalH, rotation: 0,
    fill: "#FFFFFF", stroke: "", strokeWidth: 0,
    opacity: 1, cornerRadius: 10,
    locked: false, visible: true, name: "tile-bg",
  });

  // Thin border overlay (separate so it doesn't affect fill)
  elements.push({
    id: createId(), type: "rect", groupId,
    x, y, width: TILE_W, height: totalH, rotation: 0,
    fill: "", stroke: catColor, strokeWidth: 1.5,
    opacity: 0.2, cornerRadius: 10,
    locked: false, visible: true, name: "tile-border",
  });

  // ── Color accent bar at top
  elements.push({
    id: createId(), type: "rect", groupId,
    x, y, width: TILE_W, height: ACCENT_BAR_H, rotation: 0,
    fill: catColor, stroke: "", strokeWidth: 0,
    opacity: 1, cornerRadius: 10,
    locked: false, visible: true, name: "tile-accent",
  });

  curY = y + ACCENT_BAR_H + INNER_TOP_PAD;

  // ── Title
  elements.push({
    id: createId(), type: "text", groupId,
    x: x + PAD, y: curY, width: textW, height: titleH, rotation: 0,
    text: event.title || "Événement",
    fontSize: tSize, fontFamily: "Montserrat", fontStyle: "bold",
    textAlign: "left", fill: catColor,
    stroke: "", strokeWidth: 0,
    opacity: 1, locked: false, visible: true, name: "tile-title",
  });
  curY += titleH + 4;

  // ── Date
  if (event.date) {
    elements.push({
      id: createId(), type: "text", groupId,
      x: x + PAD, y: curY, width: textW, height: dateH - 2, rotation: 0,
      text: `📅 ${event.date}`,
      fontSize: mSize, fontFamily: "Open Sans", fontStyle: "normal",
      textAlign: "left", fill: "#444",
      stroke: "", strokeWidth: 0,
      opacity: 1, locked: false, visible: true, name: "tile-date",
    });
    curY += dateH;
  }

  // ── Location — full height so long addresses wrap completely
  if (event.location) {
    elements.push({
      id: createId(), type: "text", groupId,
      x: x + PAD, y: curY, width: textW, height: locH - 2, rotation: 0,
      text: `📍 ${event.location}`,
      fontSize: mSize, fontFamily: "Open Sans", fontStyle: "normal",
      textAlign: "left", fill: "#444",
      stroke: "", strokeWidth: 0,
      opacity: 1, locked: false, visible: true, name: "tile-location",
    });
    curY += locH;
  }

  // ── Compact separator (1 line of spacing)
  if (separatorH > 0) {
    elements.push({
      id: createId(), type: "rect", groupId,
      x: x + PAD, y: curY + 2, width: textW, height: 1, rotation: 0,
      fill: catColor, stroke: "", strokeWidth: 0,
      opacity: 0.2,
      locked: false, visible: true, name: "tile-sep",
    });
    curY += separatorH;
  }

  // ── Description
  if (event.description) {
    elements.push({
      id: createId(), type: "text", groupId,
      x: x + PAD, y: curY, width: textW, height: descH - 4, rotation: 0,
      text: event.description,
      fontSize: dSize, fontFamily: "Open Sans", fontStyle: "normal",
      textAlign: "left", fill: "#333",
      stroke: "", strokeWidth: 0,
      opacity: 1, locked: false, visible: true, name: "tile-desc",
    });
    curY += descH;
  }

  // ── Price — full-width badge so long price text wraps properly
  if (event.price) {
    const priceBgH = priceH;
    elements.push({
      id: createId(), type: "rect", groupId,
      x: x + PAD, y: curY, width: textW, height: priceBgH, rotation: 0,
      fill: catColor, stroke: "", strokeWidth: 0,
      opacity: 0.1, cornerRadius: 4,
      locked: false, visible: true, name: "tile-price-bg",
    });
    elements.push({
      id: createId(), type: "text", groupId,
      x: x + PAD + 8, y: curY + 5, width: textW - 12, height: priceBgH - 10, rotation: 0,
      text: priceText,
      fontSize: pSize, fontFamily: "Open Sans", fontStyle: "bold",
      textAlign: "left", fill: catColor,
      stroke: "", strokeWidth: 0,
      opacity: 1, locked: false, visible: true, name: "tile-price",
    });
    curY += priceH;
  }

  // ── Tags
  if (event.tags?.length) {
    const tagText = event.tags.slice(0, 5).map(t => `#${t}`).join("  ");
    elements.push({
      id: createId(), type: "text", groupId,
      x: x + PAD, y: curY + 2, width: textW, height: tagSz * LINE_H, rotation: 0,
      text: tagText,
      fontSize: tagSz, fontFamily: "Open Sans", fontStyle: "normal",
      textAlign: "left", fill: catColor,
      stroke: "", strokeWidth: 0,
      opacity: 0.7, locked: false, visible: true, name: "tile-tags",
    });
    curY += tagsH;
  }

  // ── Image zone
  if (isImg) {
    curY += 6;
    const imgW = TILE_W - PAD * 2;
    if (event.imageUrl) {
      elements.push({
        id: createId(), type: "image", groupId,
        x: x + PAD, y: curY, width: imgW, height: IMG_H, rotation: 0,
        src: event.imageUrl,
        opacity: 1, locked: false, visible: true, name: "tile-image",
      });
    } else {
      elements.push({
        id: createId(), type: "rect", groupId,
        x: x + PAD, y: curY, width: imgW, height: IMG_H, rotation: 0,
        fill: catColor, stroke: catColor, strokeWidth: 1,
        opacity: 0.08, cornerRadius: 6,
        locked: false, visible: true, name: "tile-img-placeholder",
      });
      elements.push({
        id: createId(), type: "text", groupId,
        x: x + PAD, y: curY + IMG_H / 2 - 8,
        width: imgW, height: 16, rotation: 0,
        text: "📷 Glissez une photo ici",
        fontSize: 11, fontFamily: "Open Sans", fontStyle: "normal",
        textAlign: "center", fill: catColor,
        stroke: "", strokeWidth: 0,
        opacity: 0.5, locked: false, visible: true, name: "tile-img-label",
      });
    }
  }

  return elements;
}

/** Bounding box height of a tile from its elements */
export function getTileHeight(elements: EditorElement[]): number {
  if (elements.length === 0) return 0;
  const minY = Math.min(...elements.map(e => e.y));
  const maxY = Math.max(...elements.map(e => e.y + e.height));
  return maxY - minY;
}
