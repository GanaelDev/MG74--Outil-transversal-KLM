import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { Play, Pause, Maximize2, GitFork, Share2, Target, Boxes } from 'lucide-react';
import { GraphNode, GraphEdge } from '../types';
import { NodeDetails } from './NodeDetails';
import { Minimap } from './Minimap';
import { radialPositions, clusterPositions } from '../utils/layouts';

interface GraphVisualizationProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

type LayoutMode = 'force' | 'hierarchical' | 'radial' | 'cluster';

// Construit les options vis-network selon le mode de disposition choisi.
function buildOptions(layout: LayoutMode) {
  const common = {
    nodes: {
      shape: 'dot',
      size: 20,
      font: { size: 14, color: '#0f172a' },
      borderWidth: 2,
      shadow: { enabled: true, color: 'rgba(15,23,42,0.18)', size: 10, x: 2, y: 2 },
    },
    edges: {
      width: 1,
      color: { color: 'rgba(100,116,139,0.30)', highlight: '#4f46e5', hover: '#6366f1', inherit: false },
      smooth: { enabled: true, type: 'continuous', roundness: 0.25 },
      arrows: { to: { enabled: true, scaleFactor: 0.5 } },
      font: { size: 0 }, // labels de relation masqués (désencombrement) — visibles via le tooltip au survol
      hoverWidth: 0.8,
      selectionWidth: 1.2,
    },
    interaction: { hover: true, selectConnectedEdges: true, tooltipDelay: 200 },
  };

  if (layout === 'hierarchical') {
    return {
      ...common,
      layout: {
        improvedLayout: true,
        hierarchical: {
          enabled: true,
          direction: 'UD',
          sortMethod: 'directed',
          shakeTowards: 'roots',
          levelSeparation: 150,
          nodeSpacing: 160,
          treeSpacing: 220,
        },
      },
      physics: {
        enabled: true,
        solver: 'hierarchicalRepulsion',
        hierarchicalRepulsion: { nodeDistance: 160, springLength: 120, damping: 0.2, avoidOverlap: 1 },
        stabilization: { iterations: 150, fit: true },
        minVelocity: 0.5,
      },
    };
  }

  // Modes statiques : les positions (x/y) sont calculées en amont, vis ne fait que les afficher.
  if (layout === 'radial' || layout === 'cluster') {
    return {
      ...common,
      layout: { improvedLayout: false, hierarchical: { enabled: false } },
      physics: { enabled: false },
    };
  }

  return {
    ...common,
    layout: { improvedLayout: true, hierarchical: { enabled: false } },
    physics: {
      enabled: true,
      solver: 'barnesHut',
      stabilization: { iterations: 150, fit: true },
      barnesHut: {
        gravitationalConstant: -2000,
        centralGravity: 0.15,
        springLength: 260,
        springConstant: 0.001,
        damping: 0.18,
        avoidOverlap: 1,
      },
      minVelocity: 0.1,
    },
  };
}

export const GraphVisualization: React.FC<GraphVisualizationProps> = ({ nodes, edges }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [network, setNetwork] = useState<Network | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [layout, setLayout] = useState<LayoutMode>('force');
  // La physique tourne pendant la stabilisation puis se coupe automatiquement.
  const [physicsOn, setPhysicsOn] = useState(true);
  // Miroir synchrone de physicsOn (les handlers vis-network captureraient sinon une valeur figée).
  const physicsOnRef = useRef(true);

  // Active/désactive la physique en gardant l'UI et le ref synchronisés.
  const applyPhysics = (net: Network, on: boolean) => {
    net.setOptions({ physics: { enabled: on } });
    physicsOnRef.current = on;
    setPhysicsOn(on);
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Assainit les données avant de les passer à vis-network, qui lève une exception
    // (et fait planter le rendu) sur un id dupliqué ou une arête vers un nœud absent.
    const seenNodeIds = new Set<string>();
    const safeNodes = nodes.filter((n) => {
      if (n.id == null || seenNodeIds.has(n.id)) return false;
      seenNodeIds.add(n.id);
      return true;
    });

    const seenEdgeIds = new Set<string>();
    const safeEdges = edges.filter((e) => {
      if (!seenNodeIds.has(e.from) || !seenNodeIds.has(e.to)) return false; // arête orpheline
      if (e.id != null) {
        if (seenEdgeIds.has(e.id)) return false; // id dupliqué
        seenEdgeIds.add(e.id);
      }
      return true;
    });

    // Modes statiques : on calcule les positions (radial / grappes) et on les fixe sur les nœuds.
    const staticLayout = layout === 'radial' || layout === 'cluster';
    let displayNodes = safeNodes;
    if (staticLayout) {
      const positions = layout === 'radial' ? radialPositions(safeNodes, safeEdges) : clusterPositions(safeNodes, safeEdges);
      displayNodes = safeNodes.map((n) => {
        const p = positions.get(n.id);
        return p ? { ...n, x: p.x, y: p.y } : { ...n };
      });
    }

    // Le type de relation passe en infobulle (title) plutôt qu'en label permanent (désencombrement).
    // On retire aussi la couleur par-arête pour laisser s'appliquer le style global clair/uniforme.
    const displayEdges = safeEdges.map((e) => ({ ...e, title: e.label, label: undefined, color: undefined }));

    // Voisinage de chaque nœud (pour le focus au survol).
    const neighbors = new Map<string, Set<string>>();
    displayNodes.forEach((n) => neighbors.set(n.id, new Set([n.id])));
    safeEdges.forEach((e) => {
      neighbors.get(e.from)?.add(e.to);
      neighbors.get(e.to)?.add(e.from);
    });

    const nodesDS = new DataSet<any>(displayNodes);
    const edgesDS = new DataSet<any>(displayEdges);
    const data = { nodes: nodesDS, edges: edgesDS };

    const net = new Network(containerRef.current, data, buildOptions(layout));
    networkRef.current = net;
    setNetwork(net);
    physicsOnRef.current = !staticLayout;
    setPhysicsOn(!staticLayout);

    if (staticLayout) {
      // Pas de stabilisation physique : on cadre la vue une fois le premier rendu fait.
      net.once('afterDrawing', () => net.fit());
    } else {
      // Coupe la physique une fois le graphe stabilisé : évite que la simulation
      // tourne en continu et sature le CPU (cause de plantage sur les gros graphes).
      net.on('stabilizationIterationsDone', () => {
        applyPhysics(net, false);
      });
    }

    // Drag réactif : on réveille la physique le temps de déplacer un nœud (le graphe
    // « réagit »), puis on la re-fige peu après — sauf si l'utilisateur l'a laissée active.
    let dragWokePhysics = false;
    let refreezeTimer: ReturnType<typeof setTimeout> | undefined;
    net.on('dragStart', (params) => {
      if (staticLayout) return; // en radial/grappes on ne réveille pas la physique (garde la disposition)
      if (params.nodes.length === 0) return; // déplacement de la vue, pas d'un nœud
      clearTimeout(refreezeTimer);
      if (!physicsOnRef.current) {
        dragWokePhysics = true;
        applyPhysics(net, true);
      }
    });
    net.on('dragEnd', (params) => {
      if (params.nodes.length === 0 || !dragWokePhysics) return;
      dragWokePhysics = false;
      refreezeTimer = setTimeout(() => applyPhysics(net, false), 1200);
    });

    net.on('click', (params) => {
      if (params.nodes.length > 0) {
        const node = safeNodes.find((n) => n.id === params.nodes[0]);
        setSelectedNode(node || null);
      } else {
        setSelectedNode(null);
      }
    });

    // Survol = focus : on met en évidence le nœud et ses voisins, on estompe le reste
    // pour pouvoir suivre les liens même dans un graphe dense.
    const FADED_NODE = { background: 'rgba(203,213,225,0.30)', border: 'rgba(148,163,184,0.40)' };
    const FADED_FONT = { color: 'rgba(100,116,139,0.30)' };
    const FADED_EDGE = { color: 'rgba(203,213,225,0.18)' };
    const HL_EDGE = { color: 'rgba(79,70,229,0.85)' };

    net.on('hoverNode', (params) => {
      if (containerRef.current) containerRef.current.style.cursor = 'pointer';
      const focus = neighbors.get(params.node) ?? new Set([params.node]);
      nodesDS.update(
        displayNodes.map((n) => (focus.has(n.id)
          ? { id: n.id, color: n.color, font: { color: '#0f172a' } }
          : { id: n.id, color: FADED_NODE, font: FADED_FONT }))
      );
      edgesDS.update(
        displayEdges
          .filter((e) => e.id != null)
          .map((e) => ({ id: e.id, color: e.from === params.node || e.to === params.node ? HL_EDGE : FADED_EDGE }))
      );
    });
    net.on('blurNode', () => {
      if (containerRef.current) containerRef.current.style.cursor = 'default';
      // Restaure les couleurs d'origine.
      nodesDS.update(displayNodes.map((n) => ({ id: n.id, color: n.color, font: { color: '#0f172a' } })));
      edgesDS.update(displayEdges.filter((e) => e.id != null).map((e) => ({ id: e.id, color: null })));
    });

    return () => {
      clearTimeout(refreezeTimer);
      net.destroy();
      networkRef.current = null;
      setNetwork(null);
    };
  }, [nodes, edges, layout]);

  const handleResetView = () => {
    networkRef.current?.fit({
      animation: { duration: 1200, easingFunction: 'easeInOutCubic' },
    });
  };

  // Relance la disposition (physique) ou la fige.
  const handleTogglePhysics = () => {
    const net = networkRef.current;
    if (!net) return;
    if (physicsOn) {
      applyPhysics(net, false);
    } else {
      applyPhysics(net, true);
      net.stabilize(); // force une nouvelle stabilisation (→ recoupe la physique à la fin)
    }
  };

  const legend = [
    { label: 'Vocabulaire', color: '#3B82F6' },
    { label: 'Procédural', color: '#10B981' },
    { label: 'Expertise', color: '#8B5CF6' },
    { label: 'Expérimental', color: '#F59E0B' },
    { label: 'Domaine', color: '#EF4444' },
    { label: 'Compétence', color: '#64748B' },
  ];

  return (
    <div className="flex h-full">
      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
        {/* Conteneur vis-network en absolu : il prend la taille du parent sans pouvoir
            la repousser (sinon le canvas et le conteneur s'agrandissent en boucle → graphe blanc). */}
        <div
          ref={containerRef}
          className="absolute inset-0 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100"
        />

        {/* Légende */}
        <div className="absolute left-4 top-4 rounded-xl border border-slate-200 bg-white/90 p-3 shadow-soft backdrop-blur-sm">
          <div className="flex flex-col gap-2 text-sm">
            {legend.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Barre d'outils : disposition, physique, recentrage */}
        <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/90 p-1.5 shadow-soft backdrop-blur-sm">
          <div className="flex items-center rounded-lg bg-slate-100 p-0.5">
            <button
              onClick={() => setLayout('force')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
                layout === 'force' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Disposition par forces"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden md:inline">Force</span>
            </button>
            <button
              onClick={() => setLayout('hierarchical')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
                layout === 'hierarchical' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Disposition hiérarchique"
            >
              <GitFork className="h-4 w-4" />
              <span className="hidden md:inline">Hiérarchie</span>
            </button>
            <button
              onClick={() => setLayout('radial')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
                layout === 'radial' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Disposition radiale (domaine au centre, niveaux en anneaux)"
            >
              <Target className="h-4 w-4" />
              <span className="hidden md:inline">Radial</span>
            </button>
            <button
              onClick={() => setLayout('cluster')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
                layout === 'cluster' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Disposition en grappes (chaque domaine et ses compétences dans sa bulle)"
            >
              <Boxes className="h-4 w-4" />
              <span className="hidden md:inline">Grappes</span>
            </button>
          </div>

          <div className="mx-0.5 h-6 w-px bg-slate-200" />

          <button
            onClick={handleTogglePhysics}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
            title={physicsOn ? 'Figer la disposition' : 'Relancer la disposition'}
          >
            {physicsOn ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span className="hidden lg:inline">{physicsOn ? 'Figer' : 'Relancer'}</span>
          </button>

          <button
            onClick={handleResetView}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
            title="Recentrer la vue"
          >
            <Maximize2 className="h-4 w-4" />
            <span className="hidden lg:inline">Recentrer</span>
          </button>
        </div>

        {/* Mini-carte */}
        <div className="absolute bottom-4 right-4">
          <Minimap network={network} nodes={nodes} />
        </div>
      </div>

      {selectedNode && (
        <div className="w-80 border-l border-slate-200 bg-white">
          <NodeDetails node={selectedNode} onClose={() => setSelectedNode(null)} />
        </div>
      )}
    </div>
  );
};
