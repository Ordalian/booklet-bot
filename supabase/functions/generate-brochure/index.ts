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
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: 'FIRECRAWL_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Generating brochure from ${dateDebut} to ${dateFin}, categories:`, Object.keys(categories));

    // Collect all links to scrape from all categories
    const allLinks: { url: string; category: string }[] = [];
    for (const [catId, catData] of Object.entries(categories) as [string, any][]) {
      for (const link of (catData.links || [])) {
        if (link.trim()) allLinks.push({ url: link.trim(), category: catId });
      }
    }

    // Also scrape default tourism sources
    const defaultUrls = [
      { url: 'https://www.tourisme-porteduhainaut.com/preparer/agenda', category: 'general' },
      { url: 'https://www.agglo-porteduhainaut.fr/culture-sports-loisirs/culture/scenes-plurielles', category: 'spectacles' },
    ];

    const allToScrape = [...defaultUrls, ...allLinks];
    const scrapedContent: string[] = [];

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
        } else {
          console.error(`Failed to scrape ${url}:`, data);
        }
      } catch (e) {
        console.error(`Error scraping ${url}:`, e);
      }
    }

    // Collect manual info per category
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

    const systemPrompt = `Tu es un assistant qui structure des données d'événements touristiques pour La Porte du Hainaut Tourisme.

RÈGLE ABSOLUE: Tu ne dois JAMAIS inventer d'événement. Utilise UNIQUEMENT les informations fournies dans les sources. Si une section n'a pas assez de données, laisse-la vide plutôt que d'inventer.

Tu dois produire un JSON valide au format suivant:
{
  "meta": { "titre": "Programme des Animations", "mois_debut": "...", "mois_fin": "...", "annee": "...", "date_debut": "...", "date_fin": "..." },
  "highlights": [{ "icon": "emoji", "couleur": "orange|bleu|vert", "label": "...", "texte": "..." }],
  "page2_veloroute": { "titre": "...", "date": "...", "sous_titre": "...", "sous_desc": "...", "programme": [{ "horaire": "...", "titre": "...", "desc": "...", "tags": [{ "type": "free|paid|loc", "texte": "..." }] }] },
  "page3_paris_roubaix": { "titre": "PARIS-ROUBAIX", "edition": "...", "date": "...", "sous": "...", "desc": "...", "infos": [{ "label": "...", "valeur": "..." }], "visites": [{ "dates": "...", "mois": "...", "couleur": "vert|bleu", "titre": "...", "desc": "...", "prix": "..." }] },
  "page4_culture": { "expositions": [{ "dates": "...", "couleur": "o|b|g|p|y", "titre": "...", "desc": "...", "lieu": "...", "tags": [] }], "spectacles": [...] },
  "page5_nature": { "nature": [{ "dates": "...", "titre": "...", "desc": "...", "lieu": "...", "tags": [] }], "paques": [...] },
  "page8_scenes": [{ "dates": "...", "titre": "...", "desc": "...", "lieu": "..." }],
  "page8_vie_locale": [{ "dates": "...", "couleur": "o|b|g|y", "titre": "...", "desc": "...", "lieu": "...", "tags": [] }]
}

Catégories actives: ${activeCats}
Remplis UNIQUEMENT les sections qui correspondent aux catégories activées. Les autres doivent être des tableaux vides.

Couleurs: o=orange, b=bleu, g=vert, p=violet, y=jaune, d=gris
Tags type: free=gratuit, paid=payant, fam=famille, loc=localisation

IMPORTANT: Retourne UNIQUEMENT le JSON, sans markdown, sans commentaire.`;

    const userPrompt = `Période couverte: du ${dateDebut} au ${dateFin}

${scrapedContent.length > 0 ? `Contenu scrapé:\n${scrapedContent.join('\n\n')}` : 'Aucun contenu scrapé disponible.'}

${manualInfo.length > 0 ? `Informations manuelles:\n${manualInfo.join('\n\n')}` : ''}

RAPPEL: Ne crée que des événements pour lesquels tu as des données réelles ci-dessus. NE RIEN INVENTER.`;

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
        return new Response(JSON.stringify({ error: 'Limite de requêtes atteinte, réessayez dans quelques instants.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Crédits IA épuisés.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'AI gateway error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || '';
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    let eventsData;
    try {
      eventsData = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response:', content.substring(0, 500));
      return new Response(JSON.stringify({ error: 'Failed to parse structured data from AI' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Successfully generated brochure data');

    return new Response(JSON.stringify({ eventsData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
