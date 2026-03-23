

# Improved Layout, Grouped Tiles, Dynamic Sizing & UI Polish

## Problems

1. Tile elements are separate — individual parts can be moved independently
2. Descriptions truncated at 200 chars with fixed heights
3. Images placed beside text instead of below
4. No auto-layout for dropped tiles
5. UI needs polish: sidebar too narrow, no zoom controls, flat canvas

## Changes

### 1. Add `groupId` to EditorElement (types.ts)

Add `groupId?: string` field. All elements in one tile share the same `groupId`.

### 2. Rewrite `buildEventTile.ts` — Dynamic Height, Image Below, Grouped

- Assign a shared `groupId` to all tile elements
- Calculate height dynamically from full description text (no truncation)
- Layout: accent bar → title → date → location → full description → price → image (below text, full width)
- Tile width: 340px fixed

```text
┌────────────────────────┐
│ ██ accent bar          │
│ Title (bold, color)    │
│ 📅 Date                │
│ 📍 Location            │
│ Full description...    │
│ 💰 Price               │
│ ┌────────────────────┐ │
│ │   Image / Upload   │ │
│ └────────────────────┘ │
└────────────────────────┘
```

### 3. Group-aware Canvas (EditorCanvas.tsx)

- When selecting any element with a `groupId`, highlight all elements in the group
- Wrap grouped elements in a Konva `Group` so dragging moves all together
- Transformer applies to the group container

### 4. Group-aware State (useEditorState.ts)

- `deleteElement`: if element has `groupId`, delete all elements with same `groupId`
- `duplicateElement`: duplicate entire group with new IDs and new shared `groupId`
- `updateElement`: when moving a grouped element, offset all siblings by the same delta

### 5. Auto-Layout Button (new `autoLayoutTiles.ts` + BookletEditor)

- Toolbar button "Auto-Layout"
- Collects all tiles on current page by `groupId`
- Arranges in 2-column grid within A4 margins (40px)
- Column width = (794 - 80 - 14) / 2 = 350px
- Stacks tiles vertically per column, respecting each tile's dynamic height
- If overflow, creates new pages and distributes remaining tiles

### 6. UI Polish

**BookletEditor.tsx:**
- Sidebar `w-72` (wider)
- Zoom controls: state-driven `[0.5, 0.75, 1.0]` with +/- buttons, replacing fixed `CANVAS_SCALE`
- Canvas area: subtle drop shadow on A4 page, darker muted background
- Page nav bar: pill-style indicator

**EditorToolbar.tsx:**
- Group tools into labeled sections with subtle divider labels ("Formes", "Historique", "Calques")
- Add zoom buttons (+, -, percentage display)
- Add Auto-Layout button

**PropertiesPanel.tsx:**
- Wrap sections in `Collapsible` components (Position, Apparence, Typographie, Fond)
- Section headers with icons
- Brand color swatches in a 5-column grid

**PageListPanel.tsx:**
- Mini A4 preview rectangle with element count
- Active page: left accent bar + stronger background
- Inline editable title on double-click

**EventPanel.tsx:**
- Category color left border on event cards
- Better drag affordance with handle icon
- Remove redundant "glisser →" text, use subtle drag cursor styling

**index.css:**
- Custom scrollbar styling for sidebar panels
- Smooth transitions on panel switches

## Files

| Action | File |
|--------|------|
| Modify | `types.ts` — add `groupId` |
| Rewrite | `buildEventTile.ts` — dynamic height, image below, groupId |
| Modify | `EditorCanvas.tsx` — group rendering via Konva Group |
| Modify | `useEditorState.ts` — group-aware delete/duplicate |
| Create | `autoLayoutTiles.ts` — auto-arrange logic |
| Modify | `BookletEditor.tsx` — zoom state, wider sidebar, auto-layout button, UI polish |
| Modify | `EditorToolbar.tsx` — section labels, zoom, auto-layout button |
| Modify | `PropertiesPanel.tsx` — collapsible sections |
| Modify | `PageListPanel.tsx` — better thumbnails, active state |
| Modify | `EventPanel.tsx` — card polish |
| Modify | `index.css` — scrollbar, transitions |

## Technical Details

- `groupId` is a string from `createId()`. All elements in one tile share it.
- Konva `Group` wraps elements with the same `groupId`, enabling unified drag/transform.
- Dynamic height: `charsPerLine = Math.floor(textWidth / (fontSize * 0.6))`, `lines = Math.ceil(text.length / charsPerLine)`, `height = lines * fontSize * 1.3`.
- Auto-layout sorts tiles by current Y, places in 2-column grid, calls `addPage()` for overflow.
- Zoom stored as React state in BookletEditor, passed as `scale` prop to EditorCanvas.

