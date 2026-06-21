import { FiliereMetier, GraphNode, GraphEdge } from '../types';

export const nodeColors = {
  vocabulary: {
    background: '#3B82F6',
    border: '#1E40AF',
    highlight: { background: '#60A5FA', border: '#1E40AF' }
  },
  procedural: {
    background: '#10B981',
    border: '#047857',
    highlight: { background: '#34D399', border: '#047857' }
  },
  expertise: {
    background: '#8B5CF6',
    border: '#5B21B6',
    highlight: { background: '#A78BFA', border: '#5B21B6' }
  },
  experimental: {
    background: '#F59E0B',
    border: '#D97706',
    highlight: { background: '#FBBF24', border: '#D97706' }
  },
  domain: {
    background: '#EF4444',
    border: '#DC2626',
    highlight: { background: '#F87171', border: '#DC2626' }
  },
  // Nœud « Competence » : niveau intermédiaire abstrait (entre Domaine et les 4 types).
  competence: {
    background: '#64748B',
    border: '#475569',
    highlight: { background: '#94A3B8', border: '#475569' }
  }
};

export function transformDataToGraph(data: FiliereMetier): { nodes: GraphNode[], edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Le fichier uploadé peut ne pas respecter le format attendu : on valide pour
  // éviter une exception qui ferait planter tout le rendu.
  const filiere = data?.filliereMetier;
  if (!filiere || !Array.isArray(filiere.domaineMetier)) {
    throw new Error(
      "Format JSON invalide : la clé 'filliereMetier' (avec un tableau 'domaineMetier') est attendue."
    );
  }

  // Add main filiere node
  nodes.push({
    id: 'filiere-main',
    label: filiere.nom,
    group: 'domain',
    title: `Filière: ${filiere.nom}`,
    color: nodeColors.domain,
    data: { type: 'filiere', ...filiere }
  });

  filiere.domaineMetier.forEach((domaine, domaineIndex) => {
    const domaineId = `domaine-${domaineIndex}`;
    
    // Add domain node
    nodes.push({
      id: domaineId,
      label: domaine.nom,
      group: 'domain',
      title: `Domaine: ${domaine.nom}`,
      color: nodeColors.domain,
      data: { type: 'domaine', ...domaine }
    });

    // Connect filiere to domain
    edges.push({
      id: `filiere-${domaineId}`,
      from: 'filiere-main',
      to: domaineId,
      color: { color: '#6B7280', highlight: '#374151' }
    });

    // Add vocabulary nodes
    (domaine.Vocabulaire ?? []).forEach((vocab) => {
      const vocabId = `vocab-${vocab.id}`;
      nodes.push({
        id: vocabId,
        label: vocab.nom,
        group: 'vocabulary',
        title: `${vocab.nom}: ${vocab.description}`,
        color: nodeColors.vocabulary,
        data: { type: 'vocabulary', ...vocab }
      });

      // Connect domain to vocabulary
      edges.push({
        id: `${domaineId}-${vocabId}`,
        from: domaineId,
        to: vocabId,
        color: { color: '#3B82F6', highlight: '#1E40AF' }
      });

      // Add vocabulary links
      (vocab.Lien ?? []).forEach((lien, linkIndex) => {
        const targetId = `vocab-${lien.terme}`;
        edges.push({
          id: `${vocabId}-${targetId}-${linkIndex}`,
          from: vocabId,
          to: targetId,
          label: lien.type,
          color: { color: '#60A5FA', highlight: '#3B82F6' }
        });
      });
    });

    // Add procedural nodes
    (domaine.Procedural ?? []).forEach((proc, procIndex) => {
      const procId = `proc-${domaineIndex}-${procIndex}`;
      nodes.push({
        id: procId,
        label: proc.nom,
        group: 'procedural',
        title: `${proc.nom}: ${proc.description}`,
        color: nodeColors.procedural,
        data: { type: 'procedural', ...proc }
      });

      edges.push({
        id: `${domaineId}-${procId}`,
        from: domaineId,
        to: procId,
        color: { color: '#10B981', highlight: '#047857' }
      });
    });

    // Add expertise nodes
    (domaine.ExpertiseMetier ?? []).forEach((expertise, expIndex) => {
      const expId = `exp-${domaineIndex}-${expIndex}`;
      nodes.push({
        id: expId,
        label: expertise.nom,
        group: 'expertise',
        title: `${expertise.nom}: ${expertise.description}`,
        color: nodeColors.expertise,
        data: { type: 'expertise', ...expertise }
      });

      edges.push({
        id: `${domaineId}-${expId}`,
        from: domaineId,
        to: expId,
        color: { color: '#8B5CF6', highlight: '#5B21B6' }
      });
    });

    // Add experimental nodes
    (domaine.Experimental ?? []).forEach((experimental, experimIndex) => {
      const experimId = `experim-${domaineIndex}-${experimIndex}`;
      nodes.push({
        id: experimId,
        label: experimental.nom,
        group: 'experimental',
        title: `${experimental.nom}: ${experimental.description}`,
        color: nodeColors.experimental,
        data: { ...experimental, type: 'experimental' }
      });

      edges.push({
        id: `${domaineId}-${experimId}`,
        from: domaineId,
        to: experimId,
        color: { color: '#F59E0B', highlight: '#D97706' }
      });
    });
  });

  return { nodes, edges };
}