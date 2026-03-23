

# Unified Booklet Editor — Restructuring Plan

## Overview

Replace the current two-tab layout (Template Creator + Brochure Generator) with a single-screen booklet editor featuring a left sidebar, central A4 canvas, and collapsible right properties panel.

## Current State

- **TemplateCreator.tsx** (344 lines): Form-based template creation with per-page VisualEditor
- **BrochureGenerator.tsx** (485 lines): Separate tab for generating brochures from templates + scraping
- **VisualEditor.tsx**: Konva-based drag-and-drop A4 editor (text, images, shapes, layers)
- **LiveBrochurePreview.tsx**: Read-only HTML preview of event pages
- **EditorCanvas.tsx**: Konva Stage rendering elements
- Persistence: `templates` and `template_pages` tables in database

## Architecture

```text
┌─────────────────────────────────────────────────────┐
│ Header bar (logo, title, export PDF, save)           │
├──────────┬──────────────────────────┬───────────────┤
│ LEFT     │   CENTER                 │ RIGHT (collapse)│
│ SIDEBAR  │   A4 CANVAS              │ PROPERTIES     │
│          │                          │                │
│ Pages    │   Konva Stage            │ Element props  │
│ list     │   (zoom + grid)          │ Text/Image/    │
│ (drag    │                          │ Shape options  │
│ reorder) │                          │                │
│          │                          │                │
│ Event    │                          │                │
│ Types    │                          │                │
│ (scrape) │                          │                │
│          │                          │                │
│ Assets   │                          │                │
│ Library  │                          │                │
│          │                          │                │
│ Settings │                          │                │
│ (brand,  │                          │                │
│ contact) │                          │                │
└──────────┴──────────────────────────┴───────────────┘
```

## Implementation Steps

### Step 1: Create Booklet State Manager
**New file: `src/hooks/useBookletState.ts`**

Central state managing:
- `pages[]` — ordered list of pages, each with `type: 'visual' | 'event'`, `elements: EditorElement[]`, `eventData?`
- `currentPageIndex` — which page is active on canvas
- `assets[]` — uploaded images library
- `brand` — colors, logo, fonts
- `contactInfo`, `accueilHoraires`
- Actions: addPage, deletePage, duplicatePage, reorderPages, setCurrentPage
- Persist to Supabase on changes (debounced)

### Step 2: Create Page List Sidebar Component
**New file: `src/components/booklet/PageListPanel.tsx`**

- Thumbnail list of all pages (miniature A4 previews)
- Drag-and-drop reorder (use `@dnd-kit/core`)
- Right-click context menu: duplicate, delete, change type
- "Add Page" button with type selector (Visual / Event)
- Badge showing page type (visual vs event)

### Step 3: Create Event Scraping Panel
**New file: `src/components/booklet/EventPanel.tsx`**

- Accordion of event categories (Culture, Événementiel, Nature, etc.)
- Each category: toggle, add URLs/PDFs, scrape button
- Scraped results display as cards
- "Generate Pages" button → auto-creates event pages in the page list
- Reuse existing `scrape-preview` edge function

### Step 4: Create Asset Library Panel
**New file: `src/components/booklet/AssetLibrary.tsx`**

- Grid of thumbnail images from uploads bucket
- Upload button + drag-and-drop zone
- Click to insert into current page
- Rename, delete capabilities
- Persisted to Supabase storage `uploads` bucket

### Step 5: Create Settings Panel
**New file: `src/components/booklet/SettingsPanel.tsx`**

- Brand colors (palette picker)
- Logo upload
- Contact info fields
- Accueil/horaires
- Style presets (save/load)
- Charter PDF uploads for AI style inspiration

### Step 6: Build Main Booklet Editor Layout
**New file: `src/components/booklet/BookletEditor.tsx`**

- Replace `Index.tsx` content
- Left sidebar with collapsible sections (Pages, Events, Assets, Settings)
- Center: enhanced `EditorCanvas` with zoom controls, grid snapping
- Right: collapsible `PropertiesPanel` (existing, adapted)
- Toolbar above canvas (existing `EditorToolbar`, enhanced with multi-select, group/ungroup)

### Step 7: Enhance EditorCanvas
**Modify: `src/components/editor/EditorCanvas.tsx`**

- Add grid snapping (configurable grid size)
- Multi-select (shift-click or rubber-band selection)
- Group/ungroup support
- Zoom controls (+/-, fit to page)
- For event-type pages: render read-only event layout using Konva elements

### Step 8: Auto-Pagination for Events
**New file: `src/components/booklet/eventPagination.ts`**

- Takes scraped events + brand config
- Calculates how many events fit per A4 page (with contact banners)
- Returns `EditorElement[][]` — one array per generated page
- Maintains visual consistency (headers, footers, spacing)

### Step 9: PDF Export
**Modify export logic**

- Iterate all pages in order
- For visual pages: render Konva stage to image
- For event pages: render from their element arrays
- Combine into multi-page PDF using existing html2pdf.js or switch to jsPDF for better canvas support
- Respect A4 dimensions exactly

### Step 10: Update Database Schema
**Migration needed:**

Add an `assets` table for the persistent asset library:
```sql
CREATE TABLE public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  thumbnail_url text,
  file_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage assets" ON public.assets FOR ALL USING (true) WITH CHECK (true);
```

Add `page_type` column to `template_pages`:
```sql
ALTER TABLE public.template_pages ADD COLUMN page_type text NOT NULL DEFAULT 'visual';
ALTER TABLE public.template_pages ADD COLUMN event_data jsonb DEFAULT '[]'::jsonb;
```

### Step 11: Install Dependencies

- `@dnd-kit/core` + `@dnd-kit/sortable` for page reordering
- `jspdf` for better PDF export (optional, evaluate vs html2pdf.js)

## Files Summary

| Action | File |
|--------|------|
| Create | `src/hooks/useBookletState.ts` |
| Create | `src/components/booklet/BookletEditor.tsx` |
| Create | `src/components/booklet/PageListPanel.tsx` |
| Create | `src/components/booklet/EventPanel.tsx` |
| Create | `src/components/booklet/AssetLibrary.tsx` |
| Create | `src/components/booklet/SettingsPanel.tsx` |
| Create | `src/components/booklet/eventPagination.ts` |
| Modify | `src/components/editor/EditorCanvas.tsx` (grid, multi-select, zoom) |
| Modify | `src/components/editor/useEditorState.ts` (multi-select support) |
| Modify | `src/pages/Index.tsx` (replace tabs with BookletEditor) |
| Keep   | `src/components/editor/types.ts`, `EditorToolbar.tsx`, `PropertiesPanel.tsx`, `BrandPanel.tsx`, `LayersPanel.tsx` |
| Deprecate | `src/components/TemplateCreator.tsx`, `src/components/BrochureGenerator.tsx` (functionality absorbed) |
| Migration | Add `assets` table, add columns to `template_pages` |

## Key Decisions

- **Konva stays** as the canvas engine — already integrated and working
- **Single document model**: all pages live in one booklet state, mixing visual and event pages freely
- **Event pages use the same Konva canvas** but with auto-generated elements (not a separate HTML preview)
- **No auth** per existing mono-user requirement
- **Scraping reuses** existing `scrape-preview` and `generate-brochure` edge functions

