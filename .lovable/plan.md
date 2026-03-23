

# Draggable Event Tiles + Unified Pages

## Overview

Remove the "visual vs event" page distinction. All pages become freeform visual pages where scraped events appear as draggable, editable tiles that users drop from the sidebar. Each tile has two format modes (with/without image) and an image upload area.

## Changes

### 1. Remove Page Type Distinction

**Files: `useBookletState.ts`, `PageListPanel.tsx`, `BookletEditor.tsx`**

- Remove `type: "visual" | "event"` from `BookletPage` — all pages are just pages
- Remove the "Visual / Event" page type selector from the add-page dropdown
- Remove event-specific badges from `PageListPanel`
- Simplify `addPage` to just create a blank page

### 2. Make Scraped Events Draggable Tiles in EventPanel

**File: `EventPanel.tsx`**

- After scraping, each event result becomes a draggable card in the sidebar
- Each event card has:
  - A drag handle (using HTML5 drag or `@dnd-kit`)
  - A format toggle: "with image" / "without image" (two icons)
  - In "with image" mode: a small upload zone / click-to-upload area for the event illustration
- Dragging an event onto the canvas inserts it as a group of `EditorElement[]` (rect background + title text + date text + description text + optional image)
- The tile is fully editable once placed (user can resize, move, edit text)

### 3. Event Tile Builder Function

**New file: `src/components/booklet/buildEventTile.ts`**

- `buildEventTile(event, x, y, format: "withImage" | "noImage", catColor, brandPrimary): EditorElement[]`
- "withImage" format: card rect + image placeholder/uploaded image + title + date + location + description + price
- "noImage" format: compact card rect + title + date + location + description + price (taller text area)
- Returns an array of `EditorElement` objects positioned at x,y
- All elements are unlocked and editable (unlike current locked pagination output)

### 4. Canvas Drop Zone

**File: `BookletEditor.tsx` + `EditorCanvas.tsx`**

- Add `onDrop` handler on the canvas wrapper div
- When an event tile is dropped, calculate the drop position relative to the A4 canvas (accounting for scale/scroll)
- Call `buildEventTile()` with the drop coordinates
- Insert resulting elements into the current page via `editor.addElement` or direct elements update

### 5. Event Image Upload in Sidebar

**File: `EventPanel.tsx`**

- Each scraped event card in the results section gets:
  - A toggle button (image icon) to switch between "with pic" / "without pic" format
  - When "with pic" is active: a small clickable area to upload/attach an image
  - Uploaded image URL is stored on the `ScrapedEvent` object (`imageUrl` field, already exists)
  - The image is uploaded to the `uploads` bucket

### 6. Remove Auto-Pagination as Default

**File: `BookletEditor.tsx`**

- Remove `handleGenerateEventPages` that bulk-creates event pages
- Replace the "Générer X événements en pages" button with a note: "Drag events onto your pages"
- Keep `eventPagination.ts` available as an optional "Auto-layout" button for users who want automatic placement

## Flow

```text
1. User scrapes events in sidebar
2. Results appear as draggable cards
3. User toggles pic/no-pic per event, uploads images if needed
4. User drags event card onto any page canvas
5. Tile lands as editable elements (rect + texts + optional image)
6. User can move, resize, edit text of each tile element
```

## Technical Details

- HTML5 Drag and Drop API for sidebar→canvas transfer (simpler than dnd-kit cross-container)
- `dataTransfer.setData("application/json", JSON.stringify({event, format}))` on drag start
- Canvas div `onDragOver` + `onDrop` to receive and position elements
- Drop coordinates: `(e.clientX - canvasRect.left) / scale` for accurate A4 positioning
- All generated elements are `locked: false` so users can freely edit them

