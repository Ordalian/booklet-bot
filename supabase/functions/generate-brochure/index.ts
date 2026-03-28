const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function callAI(apiKey: string, model: string, messages: { role: string; content: string }[]): Promise<Response> {
  return fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages }),
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dateDebut, dateFin, categories, templateId, brand, contactInfo, accueilHoraires, userApiKey } = await req.json();

    const GOOGLE_AI_API_KEY = userApiKey || Deno.env.get('GOOGLE_AI_API_KEY');
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!GOOGLE_AI_API_KEY) {
      return new Response(JSON.stringify({ error: 'GOOGLE_AI_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Generating brochure from ${dateDebut} to ${dateFin}, template: ${templateId}`);

    // 1. Fetch template data if provided
    let template: any = null;
    let templatePages: any[] = [];
    if (templateId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const tRes = await fetch(`${SUPABASE_URL}/rest/v1/templates?id=eq.${templateId}&select=*`, {
        headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
      });
      const templates = await tRes.json();
      template = templates?.[0] || null;

      if (template) {
        const pRes = await fetch(`${SUPABASE_URL}/rest/v1/template_pages?template_id=eq.${templateId}&select=*&order=page_number.asc`, {
          headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
        });
        templatePages = await pRes.json() || [];
      }
    }

    // 2. Scrape category links
    const allLinks: { url: string; category: string }[] = [];
    for (const [catId, catData] of Object.entries(categories) as [string, any][]) {
      for (const link of (catData.links || [])) {
        if (link.trim()) allLinks.push({ url: link.trim(), category: catId });
      }
    }

    const defaultUrls = [
      { url: 'https://www.tourisme-porteduhainaut.com/preparer/agenda', category: 'general' },
    ];

    const allToScrape = [...defaultUrls, ...allLinks];
    const scrapedContent: string[] = [];

    if (FIRECRAWL_API_KEY) {
      for (const { url, category } of allToScrape) {
        try {
          const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true }),
          });
          const data = await response.json();
          if (response.ok && (data.data?.markdown || data.markdown)) {
            scrapedContent.push(`=== Source [${category}]: ${url} ===\n${data.data?.markdown || data.markdown}`);
            console.log(`Scraped ${url} successfully`);
          }
        } catch (e) {
          console.error(`Error scraping ${url}:`, e);
        }
      }

      // 2b. Enrichment: extract event names then search for more details
      if (scrapedContent.length > 0) {
        try {
          const extractRes = await callAI(GOOGLE_AI_API_KEY, 'gemini-2.5-flash-8b', [
            { role: 'user', content: `Extrais les noms/titres d'événements trouvés dans ce contenu. Retourne un JSON: { "events": ["nom1", "nom2", ...] }. Max 10 événements. Retourne UNIQUEMENT le JSON.\n\n${scrapedContent.join('\n').substring(0, 6000)}` },
          ]);

          if (extractRes.ok) {
            const extractData = await extractRes.json();
            let extractContent = extractData.choices?.[0]?.message?.content || '';
            extractContent = extractContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            try {
              const { events: eventNames } = JSON.parse(extractContent);
              if (eventNames?.length) {
                console.log(`Found ${eventNames.length} events to enrich`);
                for (const name of eventNames.slice(0, 5)) {
                  try {
                    const searchRes = await fetch('https://api.firecrawl.dev/v1/search', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        query: `${name} événement ${dateDebut} ${dateFin}`,
                        limit: 2,
                        scrapeOptions: { formats: ['markdown'] },
                      }),
                    });
                    const searchData = await searchRes.json();
                    if (searchRes.ok && searchData.data?.length) {
                      for (const result of searchData.data) {
                        if (result.markdown) {
                          scrapedContent.push(`=== Enrichissement: ${name} ===\n${result.markdown.substring(0, 2000)}`);
                        }
                      }
                      console.log(`Enriched: ${name}`);
                    }
                  } catch (e) {
                    console.error(`Enrichment search error for ${name}:`, e);
                  }
                }
              }
            } catch { /* ignore parse errors */ }
          }
        } catch (e) {
          console.error('Enrichment extraction error:', e);
        }
      }
    }

    // 3. Collect manual info
    const manualInfo: string[] = [];
    for (const [catId, catData] of Object.entries(categories) as [string, any][]) {
      if (catData.additionalInfo?.trim()) {
        manualInfo.push(`=== Info manuelle [${catId}] ===\n${catData.additionalInfo}`);
      }
    }

    const categoryNames: Record<string, string> = {
      culture: "Culture et Exposition",
      evenementiel: "Événementiel",
      nature: "Nature",
      famille: "Famille et enfants",
      spectacles: "Spectacles",
      brocantes: "Brocantes",
    };

    const activeCats = Object.keys(categories).map(id => categoryNames[id] || id).join(", ");

    // 4. Build template context for AI
    let templateContext = '';
    if (template) {
      templateContext = `
=== TEMPLATE DE RÉFÉRENCE ===
Nom: ${template.name}
Description: ${template.description || ''}
Logo: ${template.logo_url || 'Aucun'}
Contact: ${JSON.stringify(template.contact_info || {})}
Accueil/Horaires: ${JSON.stringify(template.accueil_horaires || {})}
Nombre de pages fixes: ${template.fixed_pages_count}
Insertion contenu dynamique après page: ${template.dynamic_insert_after}
PDFs de charte graphique: ${(template.charter_pdfs || []).join(', ') || 'Aucun'}

=== PAGES FIXES DU TEMPLATE ===
${templatePages.map(p => `Page ${p.page_number}: "${p.title}"
  Instructions: ${p.content_instructions || 'Aucune'}
  Layout: ${p.layout_description || 'Aucune'}
  Images: ${(p.image_urls || []).join(', ') || 'Aucune'}`).join('\n\n')}
`;
    }

    // 5. Build AI prompt
    const resolvedContact = contactInfo || template?.contact_info || {};
    const resolvedAccueil = accueilHoraires || template?.accueil_horaires || {};

    const d1 = new Date(dateDebut);
    const d2 = new Date(dateFin);
    const coverDateRange = `${String(d1.getDate()).padStart(2,'0')}/${String(d1.getMonth()+1).padStart(2,'0')} au ${String(d2.getDate()).padStart(2,'0')}/${String(d2.getMonth()+1).padStart(2,'0')} ${d2.getFullYear()}`;

    const systemPrompt = `Tu es un designer web expert qui crée des brochures touristiques au format A4 (794px × 1123px).

MISSION: Génère un tableau JSON de pages HTML. Chaque page est un objet avec "html" (le HTML complet de la page) et "type" ("fixed" ou "dynamic").

RÈGLES DE STYLE:
- Chaque page DOIT faire exactement 794px de large et 1123px de haut (format A4).
- Utilise du CSS inline uniquement (pas de <style> ni de classes).
- Le style doit être professionnel, moderne, inspiré du monde du tourisme.
${template ? `- Tu DOIS t'inspirer UNIQUEMENT du DÉCOR, des COULEURS et des FORMES décrits dans les PDFs de charte graphique du template. NE COPIE PAS le contenu textuel des PDFs — utilise-les UNIQUEMENT comme inspiration visuelle (palette, typographie, formes décoratives, ornements).` : '- Crée un style propre et professionnel.'}
${brand ? `- Couleurs de marque à utiliser: ${JSON.stringify(brand.colors)}` : ''}
- Utilise des polices web-safe: Arial, Georgia, Trebuchet MS, Verdana.
- Chaque page doit avoir overflow: hidden.
- Les images fournies doivent être utilisées avec des balises <img> et leurs URLs exactes.

PAGE DE COUVERTURE (PAGE 1):
- La page 1 DOIT afficher en grand et de manière stylée:
  * Le titre "Guide des Animations" (ou "Guide Animation")
  * Les dates couvertes au format: "${coverDateRange}"
- Le style de la couverture doit être impactant et professionnel.
${brand?.logoUrl ? `- Logo URL à afficher: ${brand.logoUrl}` : ''}

PAGES DYNAMIQUES — RÈGLES CRITIQUES:
- Le contenu de chaque page dynamique DOIT tenir dans le format A4 (794×1123px) SANS DÉBORDER.
- Prévois des marges latérales (40px minimum de chaque côté) et du padding vertical.
- Si le contenu est trop long, CRÉE UNE NOUVELLE PAGE plutôt que de déborder.

BANDEAUX DE CONTACT SUR LES PAGES DYNAMIQUES:
- Sur chaque page dynamique IMPAIRE: ajoute un bandeau en bas avec les POINTS D'ACCUEIL.
  Points d'accueil: ${JSON.stringify(resolvedAccueil)}
- Sur chaque page dynamique PAIRE: ajoute un bandeau en bas avec les HORAIRES et CONTACT.
  Contact/Horaires: ${JSON.stringify(resolvedContact)}
- Le bandeau doit faire ~80px de haut, avec un fond coloré (couleur de marque), texte blanc, en bas de page.

STRUCTURE:
${template ? `
Le template définit ${template.fixed_pages_count} pages fixes. Le contenu dynamique (événements) doit être inséré après la page ${template.dynamic_insert_after}.

Pages fixes à générer:
${templatePages.map(p => `- Page ${p.page_number}: "${p.title}" — ${p.content_instructions || 'Pas d instructions'} | Layout: ${p.layout_description || 'Libre'} | Images: ${(p.image_urls || []).join(', ') || 'Aucune'}`).join('\n')}

Les pages fixes avant la position d'insertion viennent EN PREMIER, puis les pages dynamiques, puis les pages fixes restantes.
` : `
Crée une page de couverture, puis les pages d'événements, puis une page de contact/fin.
`}

PAGES DYNAMIQUES — CONTENU:
- Crée autant de pages A4 que nécessaire pour afficher TOUS les événements trouvés.
- Organise par catégorie avec des titres de section visuellement distincts.
- Affiche: titre, dates, lieu, description, prix, tags (gratuit/payant/famille).
- Présente les événements sous forme de cartes visuelles attrayantes, PAS comme une simple liste.
- NE JAMAIS inventer d'événement. Utilise UNIQUEMENT les données fournies.

FORMAT DE SORTIE (JSON strict, rien d'autre):
{ "pages": [ { "html": "<div style=\\"width:794px;height:1123px;overflow:hidden;...\\">...</div>", "type": "fixed|dynamic" } ] }

IMPORTANT: Retourne UNIQUEMENT le JSON, sans markdown, sans commentaire, sans backticks.`;

    const userPrompt = `Période: du ${dateDebut} au ${dateFin}
Catégories actives: ${activeCats}

${templateContext}

${scrapedContent.length > 0 ? `Contenu scrapé:\n${scrapedContent.join('\n\n')}` : 'Aucun contenu scrapé.'}

${manualInfo.length > 0 ? `Informations manuelles:\n${manualInfo.join('\n\n')}` : ''}

RAPPEL: Ne crée que des événements basés sur les données ci-dessus. NE RIEN INVENTER. Génère autant de pages dynamiques A4 que nécessaire.`;

    const aiResponse = await callAI(GOOGLE_AI_API_KEY, 'gemini-2.5-flash', [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('AI error:', aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requêtes atteinte, réessayez.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'AI gateway error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || '';
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    let result;
    try {
      result = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response:', content.substring(0, 500));
      return new Response(JSON.stringify({ error: 'Failed to parse AI output' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Generated ${result.pages?.length || 0} pages`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
