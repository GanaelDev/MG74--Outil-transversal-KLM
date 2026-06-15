import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { GraphNode, GraphEdge } from '../types';
import { NodeDetails } from './NodeDetails';

interface GraphVisualizationProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const GraphVisualization: React.FC<GraphVisualizationProps> = ({ nodes, edges }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const nodesDataSet = new DataSet(nodes);
    const edgesDataSet = new DataSet(edges);

    const data = {
      nodes: nodesDataSet,
      edges: edgesDataSet,
    };

    const options = {
      nodes: {
        shape: 'dot',
        size: 20,
        font: {
          size: 14,
          color: '#000000',
        },
        borderWidth: 2,
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.2)',
          size: 10,
          x: 2,
          y: 2,
        },
      },
      edges: {
        width: 2,
        smooth: {
          enabled: true,
          type: 'continuous',
          roundness: 0.2,
        },
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 0.8,
          },
        },
        font: {
          size: 12,
          color: '#374151',
          background: 'rgba(255,255,255,0.8)',
          strokeWidth: 0,
        },
      },
      physics: {
        enabled: true,
        stabilization: { 
          iterations: 150,
          fit: true
        },
        barnesHut: {
          gravitationalConstant: -2000, // répulsion encore plus forte
          centralGravity: 0.15, // moins d'attraction vers le centre
          springLength: 260, // ressort beaucoup plus long
          springConstant: 0.001, // ressort très souple (force minimale)
          damping: 0.18, // friction modérée
          avoidOverlap: 1 // évite le chevauchement au maximum
        },
        // Empêche le recentrage automatique après un drag
        minVelocity: 0.1,
        solver: 'barnesHut',
      },
      interaction: {
        hover: true,
        selectConnectedEdges: true,
        tooltipDelay: 300,
      },
      layout: {
        improvedLayout: true,
      },
      configure: {
        enabled: false
      },
    };

    networkRef.current = new Network(containerRef.current, data, options);

    // Handle node selection
    networkRef.current.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node = nodes.find(n => n.id === nodeId);
        setSelectedNode(node || null);
      } else {
        setSelectedNode(null);
      }
    });

    // Handle hover effects
    networkRef.current.on('hoverNode', () => {
      containerRef.current!.style.cursor = 'pointer';
    });

    networkRef.current.on('blurNode', () => {
      containerRef.current!.style.cursor = 'default';
    });

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
      }
    };
  }, [nodes, edges]);

  const handleResetView = () => {
    if (networkRef.current) {
      // Stabilise le graphe avant de recentrer
      networkRef.current.stabilize();
      setTimeout(() => {
        networkRef.current!.fit({
          animation: {
            duration: 1800,
            easingFunction: 'easeInOutCubic'
          }
        });
      }, 100);
    }
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 relative">
        <div
          ref={containerRef}
          className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-inner"
        />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span>Vocabulaire</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span>Procédural</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-purple-500"></div>
              <span>Expertise</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span>Expérimental</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span>Domaine</span>
            </div>
          </div>
        </div>
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg">
          <button
            onClick={handleResetView}
            className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Recentrer la vue"
          >
            Recentrer
          </button>
        </div>
      </div>
      {selectedNode && (
        <div className="w-80 border-l border-gray-200 bg-white">
          <NodeDetails node={selectedNode} onClose={() => setSelectedNode(null)} />
        </div>
      )}
    </div>
  );
};