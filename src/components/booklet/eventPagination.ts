import { EditorElement, createId, A4_WIDTH, A4_HEIGHT } from "@/components/editor/types";
import { ScrapedEvent } from "./EventPanel";
import { BrandConfig } from "@/components/editor/types";

const MARGIN = 40;
const BANNER_HEIGHT = 50;
const HEADER_HEIGHT = 56;
const FOOTER_GAP = 8;
const USABLE_TOP = MARGIN + HEADER_HEIGHT + 8;
const USABLE_BOTTOM = A4_HEIGHT - MARGIN - BANNER_HEIGHT - FOOTER_GAP;
const USABLE_HEIGHT = USABLE_BOTTOM - USABLE_TOP;
const COL_GAP = 14;
const CARD_PADDING = 10;
const COL_WIDTH = (A4_WIDTH - MARGIN * 2 - COL_GAP) / 2;
const IMAGE_HEIGHT = 80;
const TEXT_BLOCK_MIN = 90;
const CARD_HEIGHT = IMAGE_HEIGHT + TEXT_BLOCK_MIN + CARD_PADDING * 2 + 4; // ~194
const ROW_GAP = 12;
const CARDS_PER_COL = Math.floor(USABLE_HEIGHT / (CARD_HEIGHT + ROW_GAP));
const CARDS_PER_PAGE = CARDS_PER_COL * 2;

interface EventCategory {
  id: string;
  label: string;
  color: string;
  events: ScrapedEvent[];
}

function buildCard(
  event: ScrapedEvent,
  x: number,
  y: number,
  catColor: string,
  brandPrimary: string,
): EditorElement[] {
  const els: EditorElement[] = [];

  // Card bg
  els.push({
    id: createId(), type: "rect",
    x, y, width: COL_WIDTH, height: CARD_HEIGHT,
    rotation: 0, opacity: 1,
    fill: "#FFFFFF", cornerRadius: 8,
    stroke: catColor, strokeWidth: 1.5,
    visible: true, locked: true, name: `card-${event.title}`,
  });

  // Image placeholder
  const imgSrc = (event as any).imageUrl;
  if (imgSrc) {
    els.push({
      id: createId(), type: "image",
      x: x + CARD_PADDING, y: y + CARD_PADDING,
      width: COL_WIDTH - CARD_PADDING * 2, height: IMAGE_HEIGHT,
      rotation: 0, opacity: 1, src: imgSrc,
      visible: true, locked: true, name: "card-img",
    });
  } else {
    // Colored placeholder
    els.push({
      id: createId(), type: "rect",
      x: x + CARD_PADDING, y: y + CARD_PADDING,
      width: COL_WIDTH - CARD_PADDING * 2, height: IMAGE_HEIGHT,
      rotation: 0, opacity: 0.12,
      fill: catColor, cornerRadius: 4,
      visible: true, locked: true, name: "card-img-placeholder",
    });
    els.push({
      id: createId(), type: "text",
      x: x + CARD_PADDING, y: y + CARD_PADDING + IMAGE_HEIGHT / 2 - 8,
      width: COL_WIDTH - CARD_PADDING * 2, height: 16,
      rotation: 0, opacity: 0.4,
      text: "📷 Illustration", fontSize: 10, fontFamily: "Lato",
      textAlign: "center", fill: catColor,
      visible: true, locked: true, name: "card-img-label",
    });
  }

  const textY = y + CARD_PADDING + IMAGE_HEIGHT + 6;
  const textW = COL_WIDTH - CARD_PADDING * 2;

  // Title
  els.push({
    id: createId(), type: "text",
    x: x + CARD_PADDING, y: textY,
    width: textW, height: 18,
    rotation: 0, opacity: 1,
    text: event.title, fontSize: 11,
    fontFamily: "Montserrat", fontStyle: "bold",
    textAlign: "left", fill: "#1A1A2E",
    visible: true, locked: true, name: "card-title",
  });

  // Date + Location
  const meta = [event.date, event.location].filter(Boolean).join(" • ");
  if (meta) {
    els.push({
      id: createId(), type: "text",
      x: x + CARD_PADDING, y: textY + 20,
      width: textW, height: 14,
      rotation: 0, opacity: 1,
      text: meta, fontSize: 8.5,
      fontFamily: "Lato", fill: catColor,
      visible: true, locked: true, name: "card-meta",
    });
  }

  // Description (truncated to fit)
  const desc = (event.description || "").slice(0, 120);
  if (desc) {
    els.push({
      id: createId(), type: "text",
      x: x + CARD_PADDING, y: textY + 36,
      width: textW, height: 36,
      rotation: 0, opacity: 1,
      text: desc, fontSize: 7.5,
      fontFamily: "Lato", fill: "#555555",
      visible: true, locked: true, name: "card-desc",
    });
  }

  // Price
  if (event.price) {
    els.push({
      id: createId(), type: "text",
      x: x + CARD_PADDING, y: textY + TEXT_BLOCK_MIN - 18,
      width: textW, height: 14,
      rotation: 0, opacity: 1,
      text: event.price, fontSize: 8,
      fontFamily: "Montserrat", fontStyle: "bold",
      fill: brandPrimary,
      visible: true, locked: true, name: "card-price",
    });
  }

  return els;
}

export function paginateEvents(
  categories: EventCategory[],
  brand: BrandConfig,
): EditorElement[][] {
  const allPages: EditorElement[][] = [];
  const brandPrimary = brand.colors[0] || "#E85D04";
  const brandSecondary = brand.colors[1] || "#0077B6";

  for (const cat of categories) {
    const events = cat.events;
    if (events.length === 0) continue;

    const totalPages = Math.ceil(events.length / CARDS_PER_PAGE);

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      const pageElements: EditorElement[] = [];
      const globalPageNum = allPages.length;
      const isOdd = globalPageNum % 2 === 0; // 0-indexed, so first page = odd

      // --- Header with category type ---
      pageElements.push({
        id: createId(), type: "rect",
        x: 0, y: 0, width: A4_WIDTH, height: HEADER_HEIGHT,
        rotation: 0, opacity: 1, fill: cat.color,
        visible: true, locked: true, name: "header-bg",
      });
      pageElements.push({
        id: createId(), type: "text",
        x: MARGIN, y: 10, width: A4_WIDTH - MARGIN * 2, height: 24,
        rotation: 0, opacity: 1,
        text: cat.label.toUpperCase(),
        fontSize: 16, fontFamily: "Montserrat", fontStyle: "bold",
        textAlign: "left", fill: "#FFFFFF",
        visible: true, locked: true, name: "header-category",
      });
      // Page sub-info
      if (totalPages > 1) {
        pageElements.push({
          id: createId(), type: "text",
          x: MARGIN, y: 34, width: A4_WIDTH - MARGIN * 2, height: 14,
          rotation: 0, opacity: 0.8,
          text: `Page ${pageIdx + 1} / ${totalPages}`,
          fontSize: 9, fontFamily: "Lato",
          textAlign: "left", fill: "#FFFFFF",
          visible: true, locked: true, name: "header-page",
        });
      }

      // --- Event cards in 2 columns ---
      const startIdx = pageIdx * CARDS_PER_PAGE;
      const pageEvents = events.slice(startIdx, startIdx + CARDS_PER_PAGE);

      pageEvents.forEach((event, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const cardX = MARGIN + col * (COL_WIDTH + COL_GAP);
        const cardY = USABLE_TOP + row * (CARD_HEIGHT + ROW_GAP);

        const cardEls = buildCard(event, cardX, cardY, cat.color, brandPrimary);
        pageElements.push(...cardEls);
      });

      // --- Footer banner ---
      pageElements.push({
        id: createId(), type: "rect",
        x: 0, y: A4_HEIGHT - BANNER_HEIGHT,
        width: A4_WIDTH, height: BANNER_HEIGHT,
        rotation: 0, opacity: 0.92, fill: brandSecondary,
        visible: true, locked: true, name: "footer-banner",
      });
      pageElements.push({
        id: createId(), type: "text",
        x: MARGIN, y: A4_HEIGHT - BANNER_HEIGHT + 14,
        width: A4_WIDTH - MARGIN * 2, height: 22,
        rotation: 0, opacity: 1,
        text: isOdd ? "📍 Points d'accueil" : "🕐 Horaires & Contact",
        fontSize: 11, fontFamily: "Montserrat", fontStyle: "bold",
        textAlign: "center", fill: "#FFFFFF",
        visible: true, locked: true, name: "footer-text",
      });

      allPages.push(pageElements);
    }
  }

  return allPages;
}
