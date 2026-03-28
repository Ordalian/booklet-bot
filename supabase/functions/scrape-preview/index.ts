const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Realistic browser headers that pass most WAF / bot checks
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

interface PageContent {
  text: string;
  imageUrls: string[];
}

// Attempt scraping via Firecrawl (handles JS-rendered pages and WAF-protected sites)
async function fetchViaFirecrawl(url: string, apiKey: string): Promise<PageContent> {
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
      includeTags: ['article', 'main', 'section', 'p', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'table'],
      excludeTags: ['nav', 'footer', 'header', 'aside', 'script', 'style'],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Firecrawl error ${res.status}: ${errText.substring(0, 200)}`);
  }

  const data = await res.json();
  const markdown = data?.data?.markdown || data?.markdown || '';
  const ogImage = data?.data?.metadata?.ogImage || data?.metadata?.ogImage || '';
  return {
    text: markdown.substring(0, 30000),
    imageUrls: ogImage ? [ogImage] : [],
  };
}

async function fetchPageAsText(url: string): Promise<PageContent> {
  try {
    const res = await fetch(url, { headers: BROWSER_HEADERS });
    if (!res.ok) {
      const blocked = res.status === 403 || res.status === 429 || res.status === 401;
      console.warn(`HTTP ${res.status} for ${url} (blocked=${blocked})`);
      return { text: '', imageUrls: [], blocked } as PageContent & { blocked: boolean };
    }
    const html = await res.text();

    // Body-level block detection (Envoy proxy, CDN, WAF returning 200 with block message)
    if (html.length < 500 || /host\s*(is\s*)?not\s*allowed|access\s*denied|request\s*forbidden|blocked\s*by|bot\s*detected/i.test(html)) {
      console.warn(`Body-level block detected for ${url} (length=${html.length})`);
      return { text: '', imageUrls: [], blocked: true } as PageContent & { blocked: boolean };
    }

    // ── 1. Extract JSON-LD structured data (events, articles, etc.)
    const jsonLdSections: string[] = [];
    const jsonLdRe = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let jMatch: RegExpExecArray | null;
    while ((jMatch = jsonLdRe.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(jMatch[1]);
        jsonLdSections.push(JSON.stringify(parsed, null, 2));
      } catch { /* ignore malformed */ }
    }

    // ── 2. Extract <meta> tags (og:, twitter:, description…)
    const metaLines: string[] = [];
    const imageUrls: string[] = [];
    const metaRe = /<meta\s[^>]+>/gi;
    let mMatch: RegExpExecArray | null;
    while ((mMatch = metaRe.exec(html)) !== null) {
      const tag = mMatch[0];
      const propMatch = tag.match(/(?:property|name)=["']([^"']+)["']/i);
      const contentMatch = tag.match(/content=["']([^"']+)["']/i);
      if (propMatch && contentMatch) {
        const prop = propMatch[1].toLowerCase();
        const content = contentMatch[1];
        metaLines.push(`${prop}: ${content}`);
        if (prop === 'og:image' || prop === 'twitter:image') {
          imageUrls.push(content);
        }
      }
    }

    // ── 3. Remove noise: scripts, styles, nav, footer, header, aside
    let cleaned = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');

    // ── 4. Try to isolate the main content block
    const mainMatch =
      cleaned.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
      cleaned.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
      cleaned.match(/<div[^>]*(?:class|id)=["'][^"']*(?:content|main|article|events?|agenda|programme)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);

    const bodyHtml = mainMatch ? mainMatch[1] : cleaned;

    // ── 5. Convert to plain text
    const plainText = bodyHtml
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#[0-9]+;/gi, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .substring(0, 25000);

    // ── 6. Assemble sections, most structured first
    const parts: string[] = [];
    if (jsonLdSections.length > 0) {
      parts.push(`## Données structurées (JSON-LD)\n${jsonLdSections.join('\n\n')}`);
    }
    if (metaLines.length > 0) {
      parts.push(`## Métadonnées de la page\n${metaLines.join('\n')}`);
    }
    parts.push(`## Contenu principal\n${plainText}`);

    return {
      text: parts.join('\n\n---\n\n').substring(0, 32000),
      imageUrls,
      blocked: false,
    } as PageContent & { blocked: boolean };
  } catch (e) {
    console.warn('Failed to fetch URL:', url, e);
    return { text: '', imageUrls: [], blocked: false } as PageContent & { blocked: boolean };
  }
}

async function fetchFileContent(fileUrl: string): Promise<string> {
  try {
    const res = await fetch(fileUrl);
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('image')) {
      return `[IMAGE FILE: ${fileUrl}]`;
    }
    const text = await res.text();
    // Clean up PDF extracted text (lots of whitespace/control chars)
    return text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .substring(0, 20000);
  } catch (e) {
    console.warn('Failed to fetch file:', fileUrl, e);
    return '';
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { url, fileUrls, directives, categoryLabel, userApiKey, firecrawlApiKey } = body;

    // Prefer user-supplied key, fall back to server env
    const GOOGLE_AI_API_KEY = userApiKey || Deno.env.get('GOOGLE_AI_API_KEY');
    if (!GOOGLE_AI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Aucune clé API Gemini configurée. Ajoutez la vôtre dans les Réglages.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // User-supplied Firecrawl key takes priority over server env
    const FIRECRAWL_API_KEY = firecrawlApiKey || Deno.env.get('FIRECRAWL_API_KEY');
    const contentParts: string[] = [];
    const allImageUrls: string[] = [];

    // ── Scrape web URL
    if (url) {
      console.log('Fetching URL:', url);
      const result = await fetchPageAsText(url) as any;
      const meaningfulLength = (result.text || '').replace(/[#\-\s]/g, '').length;
      console.log(`Content length for ${url}: ${meaningfulLength} chars (blocked=${!!result.blocked})`);

      // If blocked and Firecrawl is configured, retry through Firecrawl
      if (result.blocked && FIRECRAWL_API_KEY) {
        console.log('Direct fetch blocked, retrying via Firecrawl:', url);
        try {
          const fc = await fetchViaFirecrawl(url, FIRECRAWL_API_KEY);
          if (fc.text) contentParts.push(`## Contenu du lien (Firecrawl): ${url}\n${fc.text}`);
          allImageUrls.push(...fc.imageUrls);
        } catch (fcErr) {
          const fcMsg = String(fcErr).substring(0, 300);
          console.warn('Firecrawl also failed:', fcMsg);
          return new Response(
            JSON.stringify({ error: `Site bloqué et Firecrawl a aussi échoué: ${fcMsg}` }),
            { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else if (result.blocked) {
        return new Response(
          JSON.stringify({ error: 'Site bloqué (WAF/proxy). Ajoutez une clé Firecrawl dans Réglages pour contourner.' }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        if (result.text) contentParts.push(`## Contenu du lien: ${url}\n${result.text}`);
        allImageUrls.push(...(result.imageUrls || []));
      }
    }

    // ── Process uploaded files
    if (fileUrls && Array.isArray(fileUrls)) {
      for (const fUrl of fileUrls) {
        console.log('Processing file:', fUrl);
        const content = await fetchFileContent(fUrl);
        if (content) contentParts.push(`## Fichier: ${fUrl}\n${content}`);
      }
    }

    if (contentParts.length === 0) {
      return new Response(
        JSON.stringify({ events: [], raw: 'Aucun contenu trouvé' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const combinedContent = contentParts.join('\n\n---\n\n').substring(0, 32000);

    let directiveSection = '';
    if (categoryLabel) {
      directiveSection += `\n\n## SECTION CIBLE\nTu extrais les contenus pertinents pour la section "${categoryLabel}". Ignore tout contenu hors sujet.`;
    }
    if (directives && directives.trim()) {
      directiveSection += `\n\n## DIRECTIVES UTILISATEUR (PRIORITÉ ABSOLUE)\n${directives.trim()}\n\nCes directives ont priorité sur tout le reste. Respecte-les impérativement.`;
    }

    // Provide og:image candidates to the model
    const imageHint = allImageUrls.length > 0
      ? `\n\n## Images trouvées sur la page\n${allImageUrls.slice(0, 5).join('\n')}\nAttribue l'image la plus pertinente à chaque événement si elle correspond.`
      : '';

    const aiPayload = {
      model: 'gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: `Tu es un extracteur de contenu expert. Tu analyses du contenu brut (pages web, PDF, JSON-LD, métadonnées) et tu en extrais des éléments structurés pour un agenda ou guide touristique.

Tu extrais DEUX types de contenus :
A) ÉVÉNEMENTS : activités ponctuelles avec une date (concerts, expositions temporaires, marchés, randonnées, fêtes…)
B) LIEUX / ATTRACTIONS : musées, sites touristiques, restaurants, parcs, monuments — sans date fixe

RÈGLES STRICTES:
1. N'invente JAMAIS d'informations. Extrais UNIQUEMENT ce qui est explicitement présent.
2. Si un champ est absent du contenu source, utilise une chaîne vide "".
3. Extrais TOUS les éléments pertinents trouvés — n'en omet aucun. Si la page décrit un seul lieu, extrais ce lieu.
4. La description doit être COMPLÈTE et RICHE : programme, intervenants, horaires détaillés, conditions d'accès, public cible, tarifs. Ne résume pas si le contenu est détaillé.
5. Pour le champ "date" :
   - Événement : "Samedi 15 mars 2025 de 14h à 18h". Si plusieurs dates, liste-les toutes.
   - Lieu permanent : utilise les horaires d'ouverture, ex. "Ouvert mar-dim 10h-18h, fermé lundi".
   - Si aucune info temporelle, laisse "".
6. Pour le prix : "Gratuit" si c'est gratuit, sinon les tarifs exacts avec les conditions (adulte, enfant, réduit…).
7. Pour la localisation : nom du lieu + adresse complète + ville si disponibles.
8. Pour imageUrl : utilise l'URL d'image la plus pertinente trouvée (og:image, JSON-LD image, etc.), ou "".
9. Les tags reflètent les caractéristiques clés : "musée", "gratuit", "famille", "plein air", "accessible PMR", "sur réservation", "tout public", "patrimoine", "nature", etc.
10. Priorité aux données JSON-LD et métadonnées — elles sont plus fiables que le texte brut.
${directiveSection}${imageHint}

FORMAT DE SORTIE (JSON strict, sans markdown, sans backticks):
{ "events": [ { "title": "...", "date": "...", "location": "...", "description": "...", "price": "...", "tags": ["..."], "imageUrl": "..." } ] }`,
        },
        {
          role: 'user',
          content: `Extrais tous les éléments pertinents de ce contenu:\n\n${combinedContent}`,
        },
      ],
    };

    // Retry logic with exponential backoff for 429 rate limits
    let aiRes: Response | null = null;
    const maxRetries = 3;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      aiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GOOGLE_AI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(aiPayload),
      });

      if (aiRes.status !== 429 || attempt === maxRetries) break;

      // Extract retry delay from error body, default to exponential backoff
      const errBody = await aiRes.text();
      const retryMatch = errBody.match(/"retryDelay":\s*"(\d+)s"/);
      const waitSec = retryMatch ? Math.min(parseInt(retryMatch[1]), 60) : Math.pow(2, attempt + 1) * 5;
      console.log(`Rate limited (429), waiting ${waitSec}s before retry ${attempt + 1}/${maxRetries}...`);
      await new Promise(r => setTimeout(r, waitSec * 1000));
    }

    if (!aiRes!.ok) {
      const errText = await aiRes!.text();
      console.error('AI error:', aiRes!.status, errText);
      if (aiRes!.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Quota Gemini épuisé (free tier = 20 req/jour). Passez à un plan payant sur https://ai.google.dev ou réessayez demain.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiRes!.status === 401 || aiRes!.status === 403) {
        return new Response(
          JSON.stringify({ error: 'Clé API Gemini invalide ou non autorisée.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ events: [], raw: combinedContent.substring(0, 500) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiRes!.json();
    let content = aiData.choices?.[0]?.message?.content || '';
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    let result: { events: any[] };
    try {
      result = JSON.parse(content);
    } catch {
      // Try extracting JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[0]);
        } catch {
          console.error('Parse error after fallback:', content.substring(0, 300));
          result = { events: [] };
        }
      } else {
        result = { events: [] };
      }
    }

    // Filter out events without a title
    if (Array.isArray(result.events)) {
      result.events = result.events.filter(ev => ev?.title?.trim());
    }

    console.log(`Extracted ${result.events?.length || 0} events`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur inconnue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
