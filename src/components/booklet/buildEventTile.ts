import { EditorElement, createId, A4_WIDTH } from "@/components/editor/types";

export type TileSize = "normal" | "large";

export interface TileEvent {
  title: string;
  date?: string;
  location?: string;
  description?: string;
  price?: string;
  imageUrl?: string;
}

const MARGIN = 40;
const TILE_W_NORMAL = 340;
const TILE_W_LARGE = A4_WIDTH - MARGIN * 2; // full width within margins
const PAD = 14;
const LINE_H = 1.4;
const IMG_H_NORMAL = 110;
const IMG_H_LARGE = 180;

// Font sizes
const TITLE_SIZE = 17;
const FIELD_SIZE = 12;
const DESC_SIZE = 11;
const PRICE_SIZE = 12;

function estimateTextHeight(text: string, fontSize: number, maxWidth: number): number {
  const avgCharWidth = fontSize * 0.55;
  const charsPerLine = Math.max(1, Math.floor(maxWidth / avgCharWidth));
  const lines = Math.ceil(text.length / charsPerLine);
  return Math.max(fontSize * LINE_H, lines * fontSize * LINE_H);
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
  let curY = y + 8;

  // Calculate total height first
  const titleH = estimateTextHeight(event.title || "Événement", TITLE_SIZE, textW);
  const dateH = event.date ? FIELD_SIZE * LINE_H + 4 : 0;
  const locH = event.location ? FIELD_SIZE * LINE_H + 4 : 0;
  const descH = event.description ? estimateTextHeight(event.description, DESC_SIZE, textW) : 0;
  const priceH = event.price ? PRICE_SIZE * LINE_H + 4 : 0;
  const imgZoneH = isImg ? IMG_H + 8 : 0;
  const totalH = 8 + titleH + 4 + dateH + locH + descH + 4 + priceH + imgZoneH + PAD;

  // Background card
  elements.push({
    id: createId(), type: "rect", groupId,
    x, y, width: TILE_W, height: totalH, rotation: 0,
    fill: "#FFFFFF", stroke: catColor, strokeWidth: 1.5,
    opacity: 1, cornerRadius: 8,
    locked: false, visible: true, name: `tile-bg`,
  });

  // Color accent bar
  elements.push({
    id: createId(), type: "rect", groupId,
    x, y, width: TILE_W, height: 5, rotation: 0,
    fill: catColor, opacity: 1, cornerRadius: 8,
    locked: false, visible: true, name: `tile-accent`,
  });

  curY = y + 10;

  // Title
  elements.push({
    id: createId(), type: "text", groupId,
    x: x + PAD, y: curY, width: textW, height: titleH, rotation: 0,
    text: event.title || "Événement",
    fontSize: TITLE_SIZE, fontFamily: "Montserrat", fontStyle: "bold",
    textAlign: "left", fill: catColor,
    opacity: 1, locked: false, visible: true, name: `tile-title`,
  });
  curY += titleH + 4;

  // Date
  if (event.date) {
    elements.push({
      id: createId(), type: "text", groupId,
      x: x + PAD, y: curY, width: textW, height: 16, rotation: 0,
      text: `📅 ${event.date}`,
      fontSize: FIELD_SIZE, fontFamily: "Open Sans", fontStyle: "normal",
      textAlign: "left", fill: "#555",
      opacity: 1, locked: false, visible: true, name: `tile-date`,
    });
    curY += dateH;
  }

  // Location
  if (event.location) {
    elements.push({
      id: createId(), type: "text", groupId,
      x: x + PAD, y: curY, width: textW, height: 16, rotation: 0,
      text: `📍 ${event.location}`,
      fontSize: FIELD_SIZE, fontFamily: "Open Sans", fontStyle: "normal",
      textAlign: "left", fill: "#555",
      opacity: 1, locked: false, visible: true, name: `tile-location`,
    });
    curY += locH;
  }

  // Full description
  if (event.description) {
    elements.push({
      id: createId(), type: "text", groupId,
      x: x + PAD, y: curY, width: textW, height: descH, rotation: 0,
      text: event.description,
      fontSize: DESC_SIZE, fontFamily: "Open Sans", fontStyle: "normal",
      textAlign: "left", fill: "#333",
      opacity: 1, locked: false, visible: true, name: `tile-desc`,
    });
    curY += descH + 4;
  }

  // Price
  if (event.price) {
    elements.push({
      id: createId(), type: "text", groupId,
      x: x + PAD, y: curY, width: textW, height: 16, rotation: 0,
      text: `💰 ${event.price}`,
      fontSize: PRICE_SIZE, fontFamily: "Open Sans", fontStyle: "bold",
      textAlign: "left", fill: catColor,
      opacity: 1, locked: false, visible: true, name: `tile-price`,
    });
    curY += priceH;
  }

  // Image zone below text
  if (isImg) {
    curY += 4;
    const imgW = TILE_W - PAD * 2;
    if (event.imageUrl) {
      elements.push({
        id: createId(), type: "image", groupId,
        x: x + PAD, y: curY, width: imgW, height: IMG_H, rotation: 0,
        src: event.imageUrl,
        opacity: 1, locked: false, visible: true, name: `tile-image`,
      });
    } else {
      elements.push({
        id: createId(), type: "rect", groupId,
        x: x + PAD, y: curY, width: imgW, height: IMG_H, rotation: 0,
        fill: catColor + "15", stroke: catColor + "40", strokeWidth: 1,
        cornerRadius: 4,
        opacity: 1, locked: false, visible: true, name: `tile-img-placeholder`,
      });
      elements.push({
        id: createId(), type: "text", groupId,
        x: x + PAD, y: curY + IMG_H / 2 - 8,
        width: imgW, height: 16, rotation: 0,
        text: "📷 Image", fontSize: 10, fontFamily: "Open Sans", fontStyle: "normal",
        textAlign: "center", fill: catColor + "80",
        opacity: 1, locked: false, visible: true, name: `tile-img-label`,
      });
    }
  }

  return elements;
}

/** Get the bounding box height of a tile from its elements */
export function getTileHeight(elements: EditorElement[]): number {
  if (elements.length === 0) return 0;
  const minY = Math.min(...elements.map(e => e.y));
  const maxY = Math.max(...elements.map(e => e.y + e.height));
  return maxY - minY;
}
