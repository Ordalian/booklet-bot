

## Fix: Fallback to Firecrawl when scraped content is too thin

### Problem
The `scrape-preview` edge function only falls back to Firecrawl when the site explicitly blocks (403/429 or block keywords). JS-rendered SPAs like `tourisme-porteduhainaut.com` return a valid 200 response with HTML, but the actual content is loaded via JavaScript — so the extracted text is empty or near-empty. Gemini receives garbage and returns 0 events.

### Solution
Add a **content quality check** after direct fetch: if the extracted plain text is very short (< 200 chars of meaningful content), treat it as a "soft block" and retry via Firecrawl.

### Changes

**File: `supabase/functions/scrape-preview/index.ts`**

1. After the direct fetch (line ~205-220), add a check: if `result.text` is empty or the plain-text content portion is under ~200 chars, AND Firecrawl key is available, retry via Firecrawl.

2. Add logging to help debug: log the content length after extraction so we can see when pages return thin content.

```text
Current flow:
  fetch URL → blocked? → yes → Firecrawl
                       → no  → send to Gemini (even if empty)

New flow:
  fetch URL → blocked OR content < 200 chars? → yes + Firecrawl key? → Firecrawl
                                               → no  → send to Gemini
```

Specifically, change the condition on line ~208 from:
```
if (result.blocked && FIRECRAWL_API_KEY)
```
to:
```
const contentTooThin = !result.text || result.text.replace(/[#\-\s]/g, '').length < 200;
if ((result.blocked || contentTooThin) && FIRECRAWL_API_KEY)
```

And add a console.log after fetch to show content length for debugging.

### Technical Details
- Only one file modified: `supabase/functions/scrape-preview/index.ts`
- The threshold of 200 chars covers SPA shells that have metadata but no body content
- Firecrawl handles JS rendering via headless browser, solving the SPA problem
- No changes needed to the frontend

