import React from 'react';
import { X, BookOpen, Settings, Lightbulb, Zap, Globe, Database } from 'lucide-react';
import { GraphNode } from '../types';

interface NodeDetailsProps {
  node: GraphNode;
  onClose: () => void;
}

export const NodeDetails: React.FC<NodeDetailsProps> = ({ node, onClose }) => {
  const getIcon = () => {
    switch (node.data.type) {
      case 'vocabulary':
        return <BookOpen className="w-5 h-5" />;
      case 'procedural':
        return <Settings className="w-5 h-5" />;
      case 'expertise':
        return <Lightbulb className="w-5 h-5" />;
      case 'experimental':
        return <Zap className="w-5 h-5" />;
      case 'domaine':
        return <Globe className="w-5 h-5" />;
      case 'neo4j':
        return <Database className="w-5 h-5" />;
      default:
        return <Globe className="w-5 h-5" />;
    }
  };

  const getTypeLabel = () => {
    switch (node.data.type) {
      case 'vocabulary':
        return 'Vocabulaire';
      case 'procedural':
        return 'Procédural';
      case 'expertise':
        return 'Expertise Métier';
      case 'experimental':
        return 'Expérimental';
      case 'domaine':
        return 'Domaine Métier';
      case 'filiere':
        return 'Filière Métier';
      case 'neo4j':
        return (node.data.labels && node.data.labels[0]) || 'Nœud Neo4j';
      default:
        return 'Élément';
    }
  };

  const renderContent = () => {
    const { data } = node;

    switch (data.type) {
      case 'vocabulary':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-sm text-gray-600">{data.description}</p>
            </div>
            {data.Lien && data.Lien.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Liens</h4>
                <div className="space-y-2">
                  {data.Lien.map((lien: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {lien.type}
                      </span>
                      <span className="text-gray-600">→ Terme {lien.terme}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'procedural':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-sm text-gray-600">{data.description}</p>
            </div>
            {data.etape && data.etape.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Étapes</h4>
                <div className="space-y-3">
                  {data.etape.map((etape: any, index: number) => (
                    <div key={index} className="flex gap-3 p-3 bg-green-50 rounded-lg">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {etape.numero}
                      </span>
                      <p className="text-sm text-gray-700">{etape.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'expertise':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-sm text-gray-600">{data.description || 'Aucune description disponible'}</p>
            </div>
            {data.regles && data.regles.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Règles</h4>
                <div className="space-y-3">
                  {data.regles.map((regle: any, index: number) => (
                    <div key={index} className="p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                          {regle.type}
                        </span>
                        <h5 className="font-medium text-sm">{regle.nom}</h5>
                      </div>
                      <p className="text-sm text-gray-600 font-mono bg-gray-100 p-2 rounded">
                        {regle.expression}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'experimental':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-sm text-gray-600">{data.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                Type: {data.type}
              </span>
            </div>
          </div>
        );

      case 'neo4j':
        return (
          <div className="space-y-4">
            {data.labels && data.labels.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Labels</h4>
                <div className="flex flex-wrap gap-2">
                  {data.labels.map((label: string) => (
                    <span key={label} className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Propriétés</h4>
              {data.properties && Object.keys(data.properties).length > 0 ? (
                <div className="space-y-1">
                  {Object.entries(data.properties).map(([key, value]) => (
                    <div key={key} className="flex gap-2 text-sm">
                      <span className="font-medium text-gray-700 flex-shrink-0">{key}</span>
                      <span className="text-gray-600 break-all">= {String(value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Aucune propriété.</p>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div>
            <p className="text-sm text-gray-600">
              {data.description || 'Informations détaillées non disponibles pour ce type d\'élément.'}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-full flex-col animate-slide-in-right">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/80 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${node.color?.background}1A`, color: node.color?.background }}
          >
            {getIcon()}
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-slate-900" title={node.label}>{node.label}</h3>
            <p className="truncate text-sm text-slate-500">{getTypeLabel()}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
          title="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
        {renderContent()}
      </div>
    </div>
  );
};