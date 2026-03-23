import { EditorElement, createId } from "@/components/editor/types";

export interface TileEvent {
  title: string;
  date?: string;
  location?: string;
  description?: string;
  price?: string;
  imageUrl?: string;
}

const TILE_W_IMG = 340;
const TILE_H_IMG = 260;
const TILE_W_NO = 300;
const TILE_H_NO = 180;
const IMG_W = 120;
const IMG_H = 100;
const PAD = 10;

export function buildEventTile(
  event: TileEvent,
  x: number,
  y: number,
  format: "withImage" | "noImage",
  catColor: string,
  brandPrimary?: string
): EditorElement[] {
  const elements: EditorElement[] = [];
  const isImg = format === "withImage";
  const tileW = isImg ? TILE_W_IMG : TILE_W_NO;
  const tileH = isImg ? TILE_H_IMG : TILE_H_NO;
  const bgColor = catColor + "12"; // very light tint

  // Background card
  elements.push({
    id: createId(),
    type: "rect",
    x, y,
    width: tileW,
    height: tileH,
    rotation: 0,
    fill: "#FFFFFF",
    stroke: catColor,
    strokeWidth: 1.5,
    opacity: 1,
    cornerRadius: 8,
    locked: false,
    visible: true,
    name: `tile-bg-${event.title?.slice(0, 15)}`,
  });

  // Color accent bar at top
  elements.push({
    id: createId(),
    type: "rect",
    x, y,
    width: tileW,
    height: 6,
    rotation: 0,
    fill: catColor,
    opacity: 1,
    cornerRadius: 8,
    locked: false,
    visible: true,
    name: `tile-accent`,
  });

  const textStartX = isImg ? x + IMG_W + PAD * 2 : x + PAD;
  const textW = isImg ? tileW - IMG_W - PAD * 3 : tileW - PAD * 2;
  let curY = y + 14;

  // Title
  elements.push({
    id: createId(),
    type: "text",
    x: textStartX,
    y: curY,
    width: textW,
    height: 22,
    rotation: 0,
    text: event.title || "Événement",
    fontSize: 13,
    fontFamily: "Montserrat",
    fontStyle: "bold",
    textAlign: "left",
    fill: catColor,
    opacity: 1,
    locked: false,
    visible: true,
    name: `tile-title`,
  });
  curY += 24;

  // Date
  if (event.date) {
    elements.push({
      id: createId(),
      type: "text",
      x: textStartX, y: curY,
      width: textW, height: 16, rotation: 0,
      text: `📅 ${event.date}`,
      fontSize: 10, fontFamily: "Open Sans", fontStyle: "normal",
      textAlign: "left", fill: "#555",
      opacity: 1, locked: false, visible: true,
      name: `tile-date`,
    });
    curY += 16;
  }

  // Location
  if (event.location) {
    elements.push({
      id: createId(),
      type: "text",
      x: textStartX, y: curY,
      width: textW, height: 16, rotation: 0,
      text: `📍 ${event.location}`,
      fontSize: 10, fontFamily: "Open Sans", fontStyle: "normal",
      textAlign: "left", fill: "#555",
      opacity: 1, locked: false, visible: true,
      name: `tile-location`,
    });
    curY += 16;
  }

  // Description
  if (event.description) {
    const descH = isImg ? 60 : 50;
    elements.push({
      id: createId(),
      type: "text",
      x: textStartX, y: curY,
      width: textW, height: descH, rotation: 0,
      text: event.description.slice(0, 200),
      fontSize: 9, fontFamily: "Open Sans", fontStyle: "normal",
      textAlign: "left", fill: "#333",
      opacity: 1, locked: false, visible: true,
      name: `tile-desc`,
    });
    curY += descH + 4;
  }

  // Price
  if (event.price) {
    elements.push({
      id: createId(),
      type: "text",
      x: textStartX, y: curY,
      width: textW, height: 16, rotation: 0,
      text: `💰 ${event.price}`,
      fontSize: 10, fontFamily: "Open Sans", fontStyle: "bold",
      textAlign: "left", fill: catColor,
      opacity: 1, locked: false, visible: true,
      name: `tile-price`,
    });
  }

  // Image placeholder or actual image
  if (isImg) {
    if (event.imageUrl) {
      elements.push({
        id: createId(),
        type: "image",
        x: x + PAD, y: y + 14,
        width: IMG_W, height: IMG_H,
        rotation: 0,
        src: event.imageUrl,
        opacity: 1, locked: false, visible: true,
        name: `tile-image`,
      });
    } else {
      // Placeholder rect
      elements.push({
        id: createId(),
        type: "rect",
        x: x + PAD, y: y + 14,
        width: IMG_W, height: IMG_H,
        rotation: 0,
        fill: catColor + "20",
        stroke: catColor + "40",
        strokeWidth: 1,
        cornerRadius: 4,
        opacity: 1, locked: false, visible: true,
        name: `tile-img-placeholder`,
      });
      elements.push({
        id: createId(),
        type: "text",
        x: x + PAD, y: y + 14 + IMG_H / 2 - 8,
        width: IMG_W, height: 16, rotation: 0,
        text: "📷 Image",
        fontSize: 10, fontFamily: "Open Sans", fontStyle: "normal",
        textAlign: "center", fill: catColor + "80",
        opacity: 1, locked: false, visible: true,
        name: `tile-img-label`,
      });
    }
  }

  return elements;
}
