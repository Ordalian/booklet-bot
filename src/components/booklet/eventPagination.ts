import { EditorElement, createId, A4_WIDTH, A4_HEIGHT } from "@/components/editor/types";
import { ScrapedEvent } from "./EventPanel";
import { BrandConfig } from "@/components/editor/types";

const MARGIN = 40;
const BANNER_HEIGHT = 50;
const HEADER_HEIGHT = 60;
const EVENT_CARD_HEIGHT = 140;
const EVENT_CARD_GAP = 12;
const USABLE_HEIGHT = A4_HEIGHT - MARGIN * 2 - BANNER_HEIGHT - HEADER_HEIGHT;
const EVENTS_PER_PAGE = Math.floor(USABLE_HEIGHT / (EVENT_CARD_HEIGHT + EVENT_CARD_GAP));

interface EventCategory {
  id: string;
  label: string;
  color: string;
  events: ScrapedEvent[];
}

export function paginateEvents(
  categories: EventCategory[],
  brand: BrandConfig,
): EditorElement[][] {
  const allPages: EditorElement[][] = [];
  let currentPageElements: EditorElement[] = [];
  let yOffset = MARGIN + HEADER_HEIGHT;
  let eventCountOnPage = 0;

  const flushPage = (categoryLabel: string, categoryColor: string) => {
    // Add header
    currentPageElements.unshift({
      id: createId(),
      type: "rect",
      x: 0, y: 0,
      width: A4_WIDTH, height: HEADER_HEIGHT,
      rotation: 0, opacity: 1,
      fill: brand.colors[0] || "#E85D04",
      visible: true, locked: true,
      name: "header-bg",
    });
    currentPageElements.unshift({
      id: createId(),
      type: "text",
      x: MARGIN, y: 15,
      width: A4_WIDTH - MARGIN * 2, height: 30,
      rotation: 0, opacity: 1,
      text: categoryLabel,
      fontSize: 18,
      fontFamily: "Montserrat",
      fontStyle: "bold",
      textAlign: "left",
      fill: "#FFFFFF",
      visible: true, locked: true,
      name: "header-title",
    });

    // Add banner
    currentPageElements.push({
      id: createId(),
      type: "rect",
      x: 0, y: A4_HEIGHT - BANNER_HEIGHT,
      width: A4_WIDTH, height: BANNER_HEIGHT,
      rotation: 0, opacity: 0.9,
      fill: brand.colors[1] || "#0077B6",
      visible: true, locked: true,
      name: "contact-banner",
    });
    currentPageElements.push({
      id: createId(),
      type: "text",
      x: MARGIN, y: A4_HEIGHT - BANNER_HEIGHT + 12,
      width: A4_WIDTH - MARGIN * 2, height: 26,
      rotation: 0, opacity: 1,
      text: allPages.length % 2 === 0 ? "Points d'accueil" : "Horaires & Contact",
      fontSize: 11,
      fontFamily: "Montserrat",
      fontStyle: "bold",
      fill: "#FFFFFF",
      visible: true, locked: true,
      name: "banner-text",
    });

    allPages.push(currentPageElements);
    currentPageElements = [];
    yOffset = MARGIN + HEADER_HEIGHT;
    eventCountOnPage = 0;
  };

  for (const cat of categories) {
    for (const event of cat.events) {
      if (eventCountOnPage >= EVENTS_PER_PAGE) {
        flushPage(cat.label, cat.color);
      }

      // Card background
      currentPageElements.push({
        id: createId(),
        type: "rect",
        x: MARGIN, y: yOffset,
        width: A4_WIDTH - MARGIN * 2, height: EVENT_CARD_HEIGHT,
        rotation: 0, opacity: 1,
        fill: "#F8F9FA",
        cornerRadius: 8,
        stroke: cat.color,
        strokeWidth: 1,
        visible: true, locked: true,
        name: `event-card-${event.title}`,
      });

      // Title
      currentPageElements.push({
        id: createId(),
        type: "text",
        x: MARGIN + 12, y: yOffset + 10,
        width: A4_WIDTH - MARGIN * 2 - 24, height: 22,
        rotation: 0, opacity: 1,
        text: event.title,
        fontSize: 14,
        fontFamily: "Montserrat",
        fontStyle: "bold",
        fill: "#1A1A2E",
        visible: true, locked: true,
        name: "event-title",
      });

      // Date + Location
      currentPageElements.push({
        id: createId(),
        type: "text",
        x: MARGIN + 12, y: yOffset + 34,
        width: A4_WIDTH - MARGIN * 2 - 24, height: 16,
        rotation: 0, opacity: 1,
        text: [event.date, event.location].filter(Boolean).join(" • "),
        fontSize: 10,
        fontFamily: "Lato",
        fill: cat.color,
        visible: true, locked: true,
        name: "event-meta",
      });

      // Description
      currentPageElements.push({
        id: createId(),
        type: "text",
        x: MARGIN + 12, y: yOffset + 54,
        width: A4_WIDTH - MARGIN * 2 - 24, height: 60,
        rotation: 0, opacity: 1,
        text: (event.description || "").slice(0, 200),
        fontSize: 9,
        fontFamily: "Lato",
        fill: "#555555",
        visible: true, locked: true,
        name: "event-desc",
      });

      // Price tag
      if (event.price) {
        currentPageElements.push({
          id: createId(),
          type: "text",
          x: MARGIN + 12, y: yOffset + EVENT_CARD_HEIGHT - 22,
          width: 150, height: 14,
          rotation: 0, opacity: 1,
          text: event.price,
          fontSize: 9,
          fontFamily: "Montserrat",
          fontStyle: "bold",
          fill: brand.colors[0] || "#E85D04",
          visible: true, locked: true,
          name: "event-price",
        });
      }

      yOffset += EVENT_CARD_HEIGHT + EVENT_CARD_GAP;
      eventCountOnPage++;
    }

    // Flush remaining
    if (currentPageElements.length > 0) {
      flushPage(cat.label, cat.color);
    }
  }

  return allPages;
}
