import neo4j, { Integer } from 'neo4j-driver';
import { GraphNode, GraphEdge } from '../types';
import { nodeColors } from './graphUtils';

// Configuration de connexion : valeurs par défaut surchargeables via un fichier .env
// (voir .env.example). L'application fonctionne sans configuration sur une stack Docker locale.
const URI = import.meta.env.VITE_NEO4J_URI || 'bolt://localhost:7687';
const USER = import.meta.env.VITE_NEO4J_USER || 'neo4j';
const PASSWORD = import.meta.env.VITE_NEO4J_PASSWORD || 'Klm2025!';

type GroupKey = keyof typeof nodeColors;

// Associe un label Neo4j à un groupe de couleurs existant du visualisateur.
const LABEL_TO_GROUP: Record<string, GroupKey> = {
  Vocabulaire: 'vocabulary',
  Terme: 'vocabulary',
  Lien: 'vocabulary',
  Procedure: 'procedural',
  Etape: 'procedural',
  Expertise: 'expertise',
  Regle: 'expertise',
  Competence: 'competence',
  Experience: 'experimental',
  Organisation: 'domain',
  Filiere: 'domain',
  Domaine: 'domain',
};

function groupForLabels(labels: string[]): GroupKey {
  for (const label of labels) {
    if (LABEL_TO_GROUP[label]) return LABEL_TO_GROUP[label];
  }
  return 'domain'; // fallback
}

// Choisit un libellé lisible parmi les propriétés du nœud.
function labelForNode(properties: Record<string, unknown>, fallback: string): string {
  const preferred = properties.nom ?? properties.Name ?? properties.name ?? properties.label;
  if (typeof preferred === 'string' && preferred.length > 0) return preferred;
  const firstString = Object.values(properties).find((v) => typeof v === 'string' && v.length > 0);
  return (firstString as string) ?? fallback;
}

// neo4j-driver renvoie les entiers sous forme d'objets Integer : on les rend sérialisables.
function plainProperties(properties: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    out[key] = neo4j.isInt(value) ? (value as Integer).toNumber() : value;
  }
  return out;
}

/**
 * Lit le graphe complet depuis Neo4j et le transforme au format attendu par
 * GraphVisualization ({ nodes, edges }).
 */
export async function loadGraphFromNeo4j(): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
  const session = driver.session();

  try {
    // Vérifie la connectivité tôt pour produire une erreur claire si la base est injoignable.
    await driver.verifyConnectivity();

    const nodesResult = await session.run('MATCH (n) RETURN n');
    const nodes: GraphNode[] = nodesResult.records.map((record) => {
      const n = record.get('n');
      const labels: string[] = n.labels;
      const properties = plainProperties(n.properties);
      const group = groupForLabels(labels);
      return {
        id: n.elementId,
        label: labelForNode(properties, labels[0] ?? n.elementId),
        group,
        title: `${labels.join(', ')} — ${labelForNode(properties, n.elementId)}`,
        color: nodeColors[group],
        data: { type: 'neo4j', labels, properties },
      };
    });

    const edgesResult = await session.run(
      'MATCH (n)-[r]->(m) RETURN elementId(n) AS from, elementId(m) AS to, type(r) AS type, elementId(r) AS id'
    );
    const edges: GraphEdge[] = edgesResult.records.map((record) => ({
      id: record.get('id'),
      from: record.get('from'),
      to: record.get('to'),
      label: record.get('type'),
      color: { color: '#6B7280', highlight: '#374151' },
    }));

    return { nodes, edges };
  } finally {
    await session.close();
    await driver.close();
  }
}
