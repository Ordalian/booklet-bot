import { EditorElement, A4_WIDTH, A4_HEIGHT } from "@/components/editor/types";

const MARGIN = 40;
const GAP = 14;
const COL_WIDTH = Math.floor((A4_WIDTH - MARGIN * 2 - GAP) / 2);

interface TileGroup {
  groupId: string;
  elements: EditorElement[];
  height: number;
  width: number;
}

function getTileGroups(elements: EditorElement[]): { tiles: TileGroup[]; loose: EditorElement[] } {
  const groupMap = new Map<string, EditorElement[]>();
  const loose: EditorElement[] = [];

  for (const el of elements) {
    if (el.groupId) {
      const arr = groupMap.get(el.groupId) || [];
      arr.push(el);
      groupMap.set(el.groupId, arr);
    } else {
      loose.push(el);
    }
  }

  const tiles: TileGroup[] = [];
  for (const [groupId, els] of groupMap) {
    const minX = Math.min(...els.map(e => e.x));
    const maxX = Math.max(...els.map(e => e.x + e.width));
    const minY = Math.min(...els.map(e => e.y));
    const maxY = Math.max(...els.map(e => e.y + e.height));
    tiles.push({ groupId, elements: els, height: maxY - minY, width: maxX - minX });
  }

  // Sort by current Y position for stable ordering
  tiles.sort((a, b) => {
    const aY = Math.min(...a.elements.map(e => e.y));
    const bY = Math.min(...b.elements.map(e => e.y));
    return aY - bY;
  });

  return { tiles, loose };
}

function repositionTile(tile: TileGroup, newX: number, newY: number): EditorElement[] {
  const minX = Math.min(...tile.elements.map(e => e.x));
  const minY = Math.min(...tile.elements.map(e => e.y));
  const dx = newX - minX;
  const dy = newY - minY;
  return tile.elements.map(el => ({ ...el, x: el.x + dx, y: el.y + dy }));
}

export interface AutoLayoutResult {
  pages: EditorElement[][];
}

export function autoLayoutTiles(elements: EditorElement[]): AutoLayoutResult {
  const { tiles, loose } = getTileGroups(elements);

  if (tiles.length === 0) {
    return { pages: [elements] };
  }

  const usableWidth = A4_WIDTH - MARGIN * 2;
  const isLarge = (tile: TileGroup) => tile.width > COL_WIDTH + 20;

  const pages: EditorElement[][] = [];
  let currentPage: EditorElement[] = [...loose];
  let col1Y = MARGIN;
  let col2Y = MARGIN;

  for (const tile of tiles) {
    // Large tiles span full width
    if (isLarge(tile)) {
      const startY = Math.max(col1Y, col2Y);
      if (startY + tile.height > A4_HEIGHT - MARGIN) {
        pages.push(currentPage);
        currentPage = [];
        col1Y = MARGIN;
        col2Y = MARGIN;
      }
      const placeY = Math.max(col1Y, col2Y);
      const repositioned = repositionTile(tile, MARGIN, placeY);
      currentPage.push(...repositioned);
      col1Y = placeY + tile.height + GAP;
      col2Y = col1Y;
      continue;
    }

    // Normal tile — pick shorter column
    const useCol1 = col1Y <= col2Y;
    const colX = useCol1 ? MARGIN : MARGIN + COL_WIDTH + GAP;
    const colY = useCol1 ? col1Y : col2Y;

    if (colY + tile.height > A4_HEIGHT - MARGIN) {
      // Try other column
      const otherY = useCol1 ? col2Y : col1Y;
      const otherX = useCol1 ? MARGIN + COL_WIDTH + GAP : MARGIN;

      if (otherY + tile.height <= A4_HEIGHT - MARGIN) {
        const repositioned = repositionTile(tile, otherX, otherY);
        currentPage.push(...repositioned);
        if (useCol1) col2Y = otherY + tile.height + GAP;
        else col1Y = otherY + tile.height + GAP;
        continue;
      }

      // New page
      pages.push(currentPage);
      currentPage = [];
      col1Y = MARGIN;
      col2Y = MARGIN;

      const repositioned = repositionTile(tile, MARGIN, MARGIN);
      currentPage.push(...repositioned);
      col1Y = MARGIN + tile.height + GAP;
      continue;
    }

    const repositioned = repositionTile(tile, colX, colY);
    currentPage.push(...repositioned);
    if (useCol1) col1Y = colY + tile.height + GAP;
    else col2Y = colY + tile.height + GAP;
  }

  pages.push(currentPage);
  return { pages };
}
