const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dateDebut, dateFin, categories, templateId } = await req.json();

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
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

    // 4. Build the template context for AI
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

    // 5. AI prompt to generate full HTML pages
    const systemPrompt = `Tu es un designer web expert qui crée des brochures touristiques au format A4 (794px × 1123px).

MISSION: Génère un tableau JSON de pages HTML. Chaque page est un objet avec "html" (le HTML complet de la page) et "type" ("fixed" ou "dynamic").

RÈGLES DE STYLE:
- Chaque page DOIT faire exactement 794px de large et 1123px de haut (format A4).
- Utilise du CSS inline uniquement (pas de <style> ni de classes).
- Le style doit être professionnel, moderne, inspiré du monde du tourisme.
${template ? `- Tu DOIS t'inspirer de la charte graphique décrite dans le template. Respecte les couleurs, polices et mise en page indiquées.` : '- Crée un style propre et professionnel avec des couleurs chaudes (orange, bleu, vert).'}
- Utilise des polices web-safe: Arial, Georgia, Trebuchet MS, Verdana.
- Chaque page doit avoir overflow: hidden.
- Les images fournies doivent être utilisées avec des balises <img> et leurs URLs exactes.

STRUCTURE:
${template ? `
Le template définit ${template.fixed_pages_count} pages fixes. Le contenu dynamique (événements) doit être inséré après la page ${template.dynamic_insert_after}.

Pages fixes à générer:
${templatePages.map(p => `- Page ${p.page_number}: "${p.title}" — ${p.content_instructions || 'Pas d instructions'} | Layout: ${p.layout_description || 'Libre'} | Images: ${(p.image_urls || []).join(', ') || 'Aucune'}`).join('\n')}

Les pages fixes avant la position d'insertion viennent EN PREMIER, puis les pages dynamiques, puis les pages fixes restantes.
` : `
Crée une page de couverture, puis les pages d'événements, puis une page de contact/fin.
`}

PAGES DYNAMIQUES:
- Crée autant de pages A4 que nécessaire pour afficher TOUS les événements trouvés.
- Chaque page d'événements doit bien remplir l'espace A4 sans déborder.
- Organise par catégorie avec des titres de section.
- Affiche: titre, dates, lieu, description, prix, tags (gratuit/payant/famille).
- NE JAMAIS inventer d'événement. Utilise UNIQUEMENT les données fournies.

${template?.logo_url ? `Logo URL: ${template.logo_url}` : ''}
${template?.contact_info ? `Contact: ${JSON.stringify(template.contact_info)}` : ''}

FORMAT DE SORTIE (JSON strict, rien d'autre):
{ "pages": [ { "html": "<div style=\\"width:794px;height:1123px;...\\">...</div>", "type": "fixed|dynamic" } ] }

IMPORTANT: Retourne UNIQUEMENT le JSON, sans markdown, sans commentaire, sans backticks.`;

    const userPrompt = `Période: du ${dateDebut} au ${dateFin}
Catégories actives: ${activeCats}

${templateContext}

${scrapedContent.length > 0 ? `Contenu scrapé:\n${scrapedContent.join('\n\n')}` : 'Aucun contenu scrapé.'}

${manualInfo.length > 0 ? `Informations manuelles:\n${manualInfo.join('\n\n')}` : ''}

RAPPEL: Ne crée que des événements basés sur les données ci-dessus. NE RIEN INVENTER. Génère autant de pages dynamiques A4 que nécessaire.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

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
