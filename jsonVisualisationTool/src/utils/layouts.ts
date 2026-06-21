import { GraphNode, GraphEdge } from '../types';

export interface Position {
  x: number;
  y: number;
}

// Adjacence non orientée : indispensable car les données réelles (Neo4j) ne forment
// pas un arbre descendant propre (ex. les sous-types pointent « vers le haut » via IS_A).
function undirectedAdjacency(nodes: GraphNode[], edges: GraphEdge[]): Map<string, string[]> {
  const ids = new Set(nodes.map((n) => n.id));
  const adj = new Map<string, string[]>();
  nodes.forEach((n) => adj.set(n.id, []));
  edges.forEach((e) => {
    if (!ids.has(e.from) || !ids.has(e.to)) return;
    adj.get(e.from)!.push(e.to);
    adj.get(e.to)!.push(e.from);
  });
  return adj;
}

function connectedComponents(nodes: GraphNode[], adj: Map<string, string[]>): string[][] {
  const seen = new Set<string>();
  const comps: string[][] = [];
  for (const n of nodes) {
    if (seen.has(n.id)) continue;
    const comp: string[] = [];
    const queue = [n.id];
    seen.add(n.id);
    while (queue.length) {
      const u = queue.shift()!;
      comp.push(u);
      for (const v of adj.get(u) || []) {
        if (!seen.has(v)) {
          seen.add(v);
          queue.push(v);
        }
      }
    }
    comps.push(comp);
  }
  return comps;
}

/**
 * Range des « blobs » (disques de rayon r) en étagères compactes, le plus grand
 * d'abord, en visant un format paysage. Renvoie le centre de chaque blob.
 * Sert à empaqueter les composantes (radial) ou les bulles (grappes) sans gâcher
 * d'espace — sinon le graphe s'étale et `fit()` dézoome jusqu'à l'illisible.
 */
function packBlobs(radii: number[], gap = 70): Position[] {
  const n = radii.length;
  if (n === 0) return [];
  const order = radii.map((_, i) => i).sort((i, j) => radii[j] - radii[i]);
  const area = radii.reduce((s, r) => s + (2 * r + gap) ** 2, 0);
  const rowW = Math.max(2 * radii[order[0]], Math.sqrt(area) * 1.8); // *1.8 → privilégie la largeur
  const centers: Position[] = new Array(n);
  let x = 0;
  let y = 0;
  let rowH = 0;
  for (const i of order) {
    const d = 2 * radii[i];
    if (x > 0 && x + d > rowW) {
      x = 0;
      y += rowH + gap;
      rowH = 0;
    }
    centers[i] = { x: x + radii[i], y: y + radii[i] };
    x += d + gap;
    rowH = Math.max(rowH, d);
  }
  return centers;
}

const RING = 150; // écart radial entre deux niveaux

/**
 * Disposition RADIALE (radial tree), robuste aux graphes réels.
 *
 * Chaque composante connexe est disposée en arbre radial autour de son propre centre :
 * arbre couvrant en BFS **non orienté** (gère les arêtes « montantes »), racine = nœud
 * de degré max en privilégiant un « domaine », et secteur angulaire proportionnel au
 * nombre de feuilles du sous-arbre. Les composantes sont ensuite empaquetées de façon
 * compacte. Sur une donnée propre (un seul arbre), on obtient l'éventail classique
 * « domaine au centre, compétences en anneaux ».
 */
export function radialPositions(nodes: GraphNode[], edges: GraphEdge[]): Map<string, Position> {
  const adj = undirectedAdjacency(nodes, edges);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const comps = connectedComponents(nodes, adj).sort((a, b) => b.length - a.length);

  // Dispose chaque composante autour de (0,0) ; renvoie ses positions locales et son rayon.
  const localLayout = (comp: string[]): { local: Map<string, Position>; radius: number } => {
    const compSet = new Set(comp);
    let root = comp[0];
    let best = -1;
    for (const id of comp) {
      const deg = (adj.get(id) || []).filter((v) => compSet.has(v)).length;
      const score = deg + (byId.get(id)?.group === 'domain' ? 1000 : 0);
      if (score > best) {
        best = score;
        root = id;
      }
    }

    const depth = new Map<string, number>([[root, 0]]);
    const children = new Map<string, string[]>();
    comp.forEach((id) => children.set(id, []));
    const seen = new Set<string>([root]);
    const queue = [root];
    let maxDepth = 0;
    while (queue.length) {
      const u = queue.shift()!;
      for (const v of adj.get(u) || []) {
        if (!seen.has(v)) {
          seen.add(v);
          const d = (depth.get(u) || 0) + 1;
          depth.set(v, d);
          maxDepth = Math.max(maxDepth, d);
          children.get(u)!.push(v);
          queue.push(v);
        }
      }
    }

    const leaves = new Map<string, number>();
    const countLeaves = (u: string): number => {
      const ch = children.get(u)!;
      if (ch.length === 0) {
        leaves.set(u, 1);
        return 1;
      }
      let sum = 0;
      for (const c of ch) sum += countLeaves(c);
      leaves.set(u, sum);
      return sum;
    };
    countLeaves(root);

    const local = new Map<string, Position>();
    const place = (u: string, a0: number, a1: number) => {
      const d = depth.get(u) || 0;
      const mid = (a0 + a1) / 2;
      const r = d * RING;
      local.set(u, { x: r * Math.cos(mid), y: r * Math.sin(mid) });
      const ch = children.get(u)!;
      const lu = leaves.get(u) || 1;
      let a = a0;
      for (const c of ch) {
        const span = (a1 - a0) * ((leaves.get(c) || 1) / lu);
        place(c, a, a + span);
        a += span;
      }
    };
    place(root, 0, 2 * Math.PI);
    return { local, radius: Math.max(maxDepth * RING, 60) };
  };

  const laid = comps.map(localLayout);
  const centers = packBlobs(laid.map((l) => l.radius));

  const pos = new Map<string, Position>();
  comps.forEach((comp, i) => {
    const { local } = laid[i];
    const c = centers[i];
    for (const id of comp) {
      const p = local.get(id)!;
      pos.set(id, { x: c.x + p.x, y: c.y + p.y });
    }
  });
  return pos;
}

/**
 * Disposition en GRAPPES (group-in-a-box, approche « compound »).
 *
 * On coupe les arêtes du backbone (entre deux nœuds « domaine ») : chaque domaine
 * devient une bulle (le domaine au centre, ses compétences autour). Les bulles sont
 * ensuite regroupées par **filière** : chaque filière est placée au centre de ses
 * domaines (super-grappe), ce qui garde chaque filière près de son monde et raccourcit
 * les arêtes. Les super-grappes sont empaquetées en format paysage. C'est l'équivalent
 * manuel d'un layout compound (type fCoSE) à deux niveaux.
 */
interface Bubble {
  head: string;
  members: string[];
  innerR: number;
  radius: number;
}

interface Blob {
  radius: number;
  render: (ox: number, oy: number) => void;
}

export function clusterPositions(nodes: GraphNode[], edges: GraphEdge[]): Map<string, Position> {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const isDomain = (id: string) => byId.get(id)?.group === 'domain';
  const pos = new Map<string, Position>();

  // 1) Bulles = composantes obtenues après coupe du backbone (domaine ↔ domaine).
  //    Chaque domaine + ses compétences forme une bulle ; les nœuds restés seuls
  //    (filières, organisations, isolés) atterrissent dans `looseSingles`.
  const innerEdges = edges.filter((e) => !(isDomain(e.from) && isDomain(e.to)));
  const adjInner = undirectedAdjacency(nodes, innerEdges);
  const comps = connectedComponents(nodes, adjInner);

  const bubbles: Bubble[] = [];
  const looseSingles: string[] = [];
  for (const comp of comps) {
    if (comp.length <= 1) {
      looseSingles.push(comp[0]);
      continue;
    }
    const set = new Set(comp);
    let head = comp.find(isDomain);
    if (!head) {
      let best = -1;
      head = comp[0];
      for (const id of comp) {
        const d = (adjInner.get(id) || []).filter((v) => set.has(v)).length;
        if (d > best) {
          best = d;
          head = id;
        }
      }
    }
    const innerR = Math.max(95, (comp.length - 1) * 20);
    bubbles.push({ head, members: comp, innerR, radius: innerR + 30 });
  }

  // 2) Rattacher chaque bulle à sa filière (le nœud domaine resté seul = backbone).
  const adjFull = undirectedAdjacency(nodes, edges);
  const backbone = new Set(looseSingles.filter(isDomain)); // filières / organisations
  const superMap = new Map<string, Bubble[]>(); // filière -> ses bulles
  const orphanBubbles: Bubble[] = [];
  for (const b of bubbles) {
    const parent = (adjFull.get(b.head) || []).find((v) => backbone.has(v));
    if (parent) {
      const arr = superMap.get(parent);
      if (arr) arr.push(b);
      else superMap.set(parent, [b]);
    } else {
      orphanBubbles.push(b);
    }
  }

  // Place les membres d'une bulle autour de son centre.
  const placeBubble = (b: Bubble, cx: number, cy: number) => {
    pos.set(b.head, { x: cx, y: cy });
    const inner = b.members.filter((id) => id !== b.head);
    inner.forEach((id, j) => {
      const a = (2 * Math.PI * j) / Math.max(1, inner.length);
      pos.set(id, { x: cx + b.innerR * Math.cos(a), y: cy + b.innerR * Math.sin(a) });
    });
  };

  // 3) Un blob par super-grappe : la filière au centre, ses bulles de domaines autour.
  const blobs: Blob[] = [];
  for (const [filiereId, bs] of superMap) {
    const maxBR = Math.max(...bs.map((b) => b.radius));
    const n = bs.length;
    const ringR = n === 1
      ? bs[0].radius + 70
      : Math.max(maxBR + 60, (2 * maxBR + 60) / (2 * Math.sin(Math.PI / n)));
    blobs.push({
      radius: ringR + maxBR,
      render: (ox, oy) => {
        pos.set(filiereId, { x: ox, y: oy }); // filière au centre de sa super-grappe
        bs.forEach((b, k) => {
          const a = (2 * Math.PI * k) / n - Math.PI / 2; // démarre en haut
          placeBubble(b, ox + ringR * Math.cos(a), oy + ringR * Math.sin(a));
        });
      },
    });
  }

  // Bulles sans filière : chacune son propre blob.
  for (const b of orphanBubbles) {
    blobs.push({ radius: b.radius, render: (ox, oy) => placeBubble(b, ox, oy) });
  }

  // Nœuds vraiment isolés / backbone non rattaché : un bloc compact.
  const leftover = looseSingles.filter((id) => !superMap.has(id));
  if (leftover.length) {
    const cols = Math.max(1, Math.ceil(Math.sqrt(leftover.length)));
    const step = 110;
    const r = Math.max((cols * step) / 2, 70);
    blobs.push({
      radius: r,
      render: (ox, oy) =>
        leftover.forEach((id, j) => {
          pos.set(id, { x: ox - r + (j % cols) * step, y: oy - r + Math.floor(j / cols) * step });
        }),
    });
  }

  // 4) Empaquetage des blobs (super-grappes + bulles orphelines + bloc restant).
  const centers = packBlobs(blobs.map((b) => b.radius));
  blobs.forEach((b, i) => b.render(centers[i].x, centers[i].y));

  return pos;
}
