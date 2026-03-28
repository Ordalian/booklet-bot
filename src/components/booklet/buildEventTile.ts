import { EditorElement, createId, A4_WIDTH } from "@/components/editor/types";

export type TileSize = "normal" | "large";

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
const LINE_H = 1.5;

// Font sizes
const TITLE_SIZE = 16;
const META_SIZE = 11;
const DESC_SIZE = 10.5;
const PRICE_SIZE = 11;
const TAG_SIZE = 9;

const IMG_H_NORMAL = 120;
const IMG_H_LARGE = 200;

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
  size: TileSize = "normal"
): EditorElement[] {
  const groupId = createId();
  const elements: EditorElement[] = [];
  const isImg = format === "withImage";
  const TILE_W = size === "large" ? TILE_W_LARGE : TILE_W_NORMAL;
  const IMG_H = size === "large" ? IMG_H_LARGE : IMG_H_NORMAL;
  const textW = TILE_W - PAD * 2;

  // ── Pre-calculate heights
  const titleH = estimateTextHeight(event.title || "Événement", TITLE_SIZE, textW);
  const dateH = event.date ? META_SIZE * LINE_H + 6 : 0;
  const locH = event.location ? META_SIZE * LINE_H + 6 : 0;
  const descH = event.description
    ? estimateTextHeight(event.description, DESC_SIZE, textW) + 4
    : 0;
  const priceH = event.price ? PRICE_SIZE * LINE_H + 8 : 0;
  const tagsH = event.tags?.length ? TAG_SIZE * LINE_H + 6 : 0;
  const separatorH = (event.date || event.location) && (event.description || event.price) ? 10 : 0;
  const imgZoneH = isImg ? IMG_H + 10 : 0;

  const ACCENT_BAR_H = 5;
  const INNER_TOP_PAD = 12;
  const INNER_BOTTOM_PAD = PAD;

  const totalH =
    ACCENT_BAR_H +
    INNER_TOP_PAD +
    titleH +
    6 +
    dateH +
    locH +
    separatorH +
    descH +
    priceH +
    tagsH +
    imgZoneH +
    INNER_BOTTOM_PAD;

  let curY = y;

  // ── Background card (white with subtle shadow effect via border)
  elements.push({
    id: createId(), type: "rect", groupId,
    x, y, width: TILE_W, height: totalH, rotation: 0,
    fill: "#FFFFFF",
    stroke: catColor + "30",
    strokeWidth: 1.5,
    opacity: 1, cornerRadius: 10,
    locked: false, visible: true, name: "tile-bg",
  });

  // ── Color accent bar at top
  elements.push({
    id: createId(), type: "rect", groupId,
    x, y, width: TILE_W, height: ACCENT_BAR_H, rotation: 0,
    fill: catColor, opacity: 1, cornerRadius: 10,
    locked: false, visible: true, name: "tile-accent",
  });

  curY = y + ACCENT_BAR_H + INNER_TOP_PAD;

  // ── Title
  elements.push({
    id: createId(), type: "text", groupId,
    x: x + PAD, y: curY, width: textW, height: titleH, rotation: 0,
    text: event.title || "Événement",
    fontSize: TITLE_SIZE, fontFamily: "Montserrat", fontStyle: "bold",
    textAlign: "left", fill: catColor,
    opacity: 1, locked: false, visible: true, name: "tile-title",
  });
  curY += titleH + 6;

  // ── Date
  if (event.date) {
    elements.push({
      id: createId(), type: "text", groupId,
      x: x + PAD, y: curY, width: textW, height: META_SIZE * LINE_H, rotation: 0,
      text: `📅 ${event.date}`,
      fontSize: META_SIZE, fontFamily: "Open Sans", fontStyle: "normal",
      textAlign: "left", fill: "#555",
      opacity: 1, locked: false, visible: true, name: "tile-date",
    });
    curY += dateH;
  }

  // ── Location
  if (event.location) {
    elements.push({
      id: createId(), type: "text", groupId,
      x: x + PAD, y: curY, width: textW, height: META_SIZE * LINE_H, rotation: 0,
      text: `📍 ${event.location}`,
      fontSize: META_SIZE, fontFamily: "Open Sans", fontStyle: "normal",
      textAlign: "left", fill: "#555",
      opacity: 1, locked: false, visible: true, name: "tile-location",
    });
    curY += locH;
  }

  // ── Thin separator line between meta and body
  if (separatorH > 0) {
    elements.push({
      id: createId(), type: "rect", groupId,
      x: x + PAD, y: curY + 2, width: textW, height: 1, rotation: 0,
      fill: catColor + "25", opacity: 1,
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
      fontSize: DESC_SIZE, fontFamily: "Open Sans", fontStyle: "normal",
      textAlign: "left", fill: "#333",
      opacity: 1, locked: false, visible: true, name: "tile-desc",
    });
    curY += descH;
  }

  // ── Price (highlighted)
  if (event.price) {
    // Price badge background
    elements.push({
      id: createId(), type: "rect", groupId,
      x: x + PAD, y: curY, width: 90, height: PRICE_SIZE * LINE_H + 4, rotation: 0,
      fill: catColor + "18", opacity: 1, cornerRadius: 4,
      locked: false, visible: true, name: "tile-price-bg",
    });
    elements.push({
      id: createId(), type: "text", groupId,
      x: x + PAD + 6, y: curY + 2, width: 80, height: PRICE_SIZE * LINE_H, rotation: 0,
      text: `💰 ${event.price}`,
      fontSize: PRICE_SIZE, fontFamily: "Open Sans", fontStyle: "bold",
      textAlign: "left", fill: catColor,
      opacity: 1, locked: false, visible: true, name: "tile-price",
    });
    curY += priceH;
  }

  // ── Tags
  if (event.tags?.length) {
    const tagText = event.tags.slice(0, 5).map(t => `#${t}`).join("  ");
    elements.push({
      id: createId(), type: "text", groupId,
      x: x + PAD, y: curY + 2, width: textW, height: TAG_SIZE * LINE_H, rotation: 0,
      text: tagText,
      fontSize: TAG_SIZE, fontFamily: "Open Sans", fontStyle: "normal",
      textAlign: "left", fill: catColor + "BB",
      opacity: 1, locked: false, visible: true, name: "tile-tags",
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
      // Placeholder
      elements.push({
        id: createId(), type: "rect", groupId,
        x: x + PAD, y: curY, width: imgW, height: IMG_H, rotation: 0,
        fill: catColor + "12",
        stroke: catColor + "35",
        strokeWidth: 1,
        cornerRadius: 6,
        opacity: 1, locked: false, visible: true, name: "tile-img-placeholder",
      });
      elements.push({
        id: createId(), type: "text", groupId,
        x: x + PAD, y: curY + IMG_H / 2 - 8,
        width: imgW, height: 16, rotation: 0,
        text: "📷 Glissez une photo ici",
        fontSize: 10, fontFamily: "Open Sans", fontStyle: "normal",
        textAlign: "center", fill: catColor + "70",
        opacity: 1, locked: false, visible: true, name: "tile-img-label",
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
