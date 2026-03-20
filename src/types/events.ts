export interface EventTag {
  type: "free" | "paid" | "fam" | "loc";
  texte: string;
}

export interface Highlight {
  icon: string;
  couleur: string;
  label: string;
  texte: string;
}

export interface ProgrammeItem {
  horaire: string;
  titre: string;
  desc: string;
  tags: EventTag[];
}

export interface Visite {
  dates: string;
  mois: string;
  couleur: string;
  titre: string;
  desc: string;
  prix: string;
}

export interface CardEvent {
  dates: string;
  couleur?: string;
  titre: string;
  desc: string;
  lieu: string;
  tags?: EventTag[];
  span?: number;
}

export interface NatureEvent {
  dates: string;
  titre: string;
  desc: string;
  lieu: string;
  tags?: EventTag[];
}

export interface SceneEvent {
  dates: string;
  titre: string;
  desc: string;
  lieu: string;
}

export interface EventsData {
  meta: {
    titre: string;
    mois_debut: string;
    mois_fin: string;
    annee: string;
    date_debut: string;
    date_fin: string;
  };
  highlights: Highlight[];
  page2_veloroute: {
    titre: string;
    date: string;
    sous_titre: string;
    sous_desc: string;
    programme: ProgrammeItem[];
  };
  page3_paris_roubaix: {
    titre: string;
    edition: string;
    date: string;
    sous: string;
    desc: string;
    infos: { label: string; valeur: string }[];
    visites: Visite[];
  };
  page4_culture: {
    expositions: CardEvent[];
    spectacles: CardEvent[];
  };
  page5_nature: {
    nature: NatureEvent[];
    paques: CardEvent[];
  };
  page8_scenes: SceneEvent[];
  page8_vie_locale: CardEvent[];
}
