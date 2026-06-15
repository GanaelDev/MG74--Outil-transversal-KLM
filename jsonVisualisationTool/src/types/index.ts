export interface VocabularyTerm {
  id: number;
  nom: string;
  description: string;
  Lien: Array<{
    type: string;
    terme: number;
  }>;
  parametres: Record<string, any>;
}

export interface ProceduralStep {
  nom: string;
  description: string;
  etape: Array<{
    numero: string;
    description: string;
  }>;
  parametres: Record<string, any>;
}

export interface ExpertiseRule {
  nom: string;
  type: string;
  expression: string;
  parametres: Record<string, any>;
}

export interface ExpertiseMetier {
  nom: string;
  description: string;
  regles: ExpertiseRule[];
  parametres: Record<string, any>;
}

export interface Experimental {
  nom: string;
  description: string;
  type: string;
  parametres: Record<string, any>;
}

export interface DomaineMetier {
  nom: string;
  Vocabulaire: VocabularyTerm[];
  Procedural: ProceduralStep[];
  ExpertiseMetier: ExpertiseMetier[];
  Experimental: Experimental[];
}

export interface FiliereMetier {
  filliereMetier: {
    nom: string;
    domaineMetier: DomaineMetier[];
  };
}

export interface GraphNode {
  id: string;
  label: string;
  group: string;
  title: string;
  color?: {
    background: string;
    border: string;
    highlight: {
      background: string;
      border: string;
    };
  };
  data: any;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  color?: {
    color: string;
    highlight: string;
  };
}