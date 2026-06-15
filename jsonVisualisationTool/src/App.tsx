import { useState, useEffect } from 'react';
import { Database } from 'lucide-react';
import { Header } from './components/Header';
import { FileUploader } from './components/FileUploader';
import { GraphVisualization } from './components/GraphVisualization';
import { transformDataToGraph } from './utils/graphUtils';
import { loadGraphFromNeo4j } from './utils/neo4jSource';
import { sampleData } from './data/sampleData';
import { FiliereMetier, GraphNode, GraphEdge } from './types';

function App() {
  const [data, setData] = useState<FiliereMetier | null>(null);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[], edges: GraphEdge[] } | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [loadingNeo4j, setLoadingNeo4j] = useState(false);
  const [neo4jError, setNeo4jError] = useState<string | null>(null);

  useEffect(() => {
    // Load sample data on start
    setData(sampleData);
  }, []);

  useEffect(() => {
    if (data) {
      const transformed = transformDataToGraph(data);
      setGraphData(transformed);
      setShowUploader(false);
    }
  }, [data]);

  const handleFileLoad = (newData: FiliereMetier) => {
    setData(newData);
  };

  const handleUploadClick = () => {
    setShowUploader(true);
  };

  const handleLoadFromNeo4j = async () => {
    setLoadingNeo4j(true);
    setNeo4jError(null);
    try {
      const graph = await loadGraphFromNeo4j();
      setData(null); // on quitte la source JSON
      setGraphData(graph);
      setShowUploader(false);
    } catch (error) {
      console.error('Erreur de connexion à Neo4j :', error);
      setNeo4jError(
        "Impossible de se connecter à Neo4j. Vérifiez que la base est démarrée (docker compose up -d dans neo4jDocker) et accessible sur bolt://localhost:7687."
      );
    } finally {
      setLoadingNeo4j(false);
    }
  };

  if (showUploader || !graphData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Header onUploadClick={handleUploadClick} onLoadNeo4j={handleLoadFromNeo4j} hasData={!!graphData} />
        <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 4rem)' }}>
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-gray-900">
                Visualisez vos données métier
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Transformez vos fichiers JSON en graphiques interactifs pour explorer
                les relations entre vocabulaire, procédures, expertise et connaissances expérimentales.
              </p>
            </div>
            <FileUploader onFileLoad={handleFileLoad} />

            <div className="flex items-center gap-3 max-w-md mx-auto">
              <div className="flex-1 h-px bg-gray-300" />
              <span className="text-sm text-gray-400">ou</span>
              <div className="flex-1 h-px bg-gray-300" />
            </div>

            <div className="space-y-3">
              <button
                onClick={handleLoadFromNeo4j}
                disabled={loadingNeo4j}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Database className="w-5 h-5" />
                {loadingNeo4j ? 'Connexion à Neo4j…' : 'Charger depuis Neo4j'}
              </button>
              {neo4jError && (
                <p className="text-sm text-red-600 max-w-md mx-auto">{neo4jError}</p>
              )}
            </div>

            {graphData && (
              <div className="mt-4">
                <button
                  onClick={() => setShowUploader(false)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {data ? 'Voir le graphique des données exemple' : 'Revenir au graphe'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Header onUploadClick={handleUploadClick} onLoadNeo4j={handleLoadFromNeo4j} hasData={true} />
      <div className="flex-1 p-4">
        <div className="h-full bg-white rounded-lg shadow-lg overflow-hidden">
          <GraphVisualization nodes={graphData.nodes} edges={graphData.edges} />
        </div>
      </div>
    </div>
  );
}

export default App;