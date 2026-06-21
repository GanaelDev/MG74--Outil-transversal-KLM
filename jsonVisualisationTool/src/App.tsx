import { useState, useEffect } from 'react';
import { Database } from 'lucide-react';
import { Header } from './components/Header';
import { FileUploader } from './components/FileUploader';
import { GraphVisualization } from './components/GraphVisualization';
import { ErrorBoundary } from './components/ErrorBoundary';
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

  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      try {
        const transformed = transformDataToGraph(data);
        setGraphData(transformed);
        setShowUploader(false);
        setFileError(null);
      } catch (error) {
        console.error('Erreur de transformation du JSON :', error);
        setFileError(error instanceof Error ? error.message : 'Fichier JSON invalide.');
      }
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
      <div className="relative min-h-screen overflow-hidden bg-slate-50">
        {/* Halo décoratif discret en fond */}
        <div className="pointer-events-none absolute inset-0 -z-0">
          <div className="absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-brand-200/40 blur-3xl" />
        </div>
        <Header onUploadClick={handleUploadClick} onLoadNeo4j={handleLoadFromNeo4j} hasData={!!graphData} />
        <div className="relative flex items-center justify-center px-4" style={{ height: 'calc(100vh - 4rem)' }}>
          <div className="w-full max-w-2xl space-y-8 text-center">
            <div className="space-y-4">
              <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                Knowledge Lifecycle Management
              </span>
              <h2 className="text-4xl font-bold tracking-tight text-slate-900">
                Visualisez vos données métier
              </h2>
              <p className="mx-auto max-w-xl text-lg text-slate-600">
                Transformez vos fichiers JSON en graphes interactifs pour explorer les relations
                entre vocabulaire, procédures, expertise et connaissances expérimentales.
              </p>
            </div>
            <FileUploader onFileLoad={handleFileLoad} />
            {fileError && (
              <p className="mx-auto max-w-md text-sm text-red-600">{fileError}</p>
            )}

            <div className="mx-auto flex max-w-md items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-sm text-slate-400">ou</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="space-y-3">
              <button
                onClick={handleLoadFromNeo4j}
                disabled={loadingNeo4j}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Database className="h-5 w-5" />
                {loadingNeo4j ? 'Connexion à Neo4j…' : 'Charger depuis Neo4j'}
              </button>
              {neo4jError && (
                <p className="mx-auto max-w-md text-sm text-red-600">{neo4jError}</p>
              )}
            </div>

            {graphData && (
              <div className="mt-4">
                <button
                  onClick={() => setShowUploader(false)}
                  className="rounded-lg border border-slate-200 bg-white px-6 py-3 font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                >
                  {data ? 'Voir le graphe des données exemple' : 'Revenir au graphe'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      <Header onUploadClick={handleUploadClick} onLoadNeo4j={handleLoadFromNeo4j} hasData={true} />
      <div className="flex-1 p-4">
        <div className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-panel">
          <ErrorBoundary onReset={() => setShowUploader(true)}>
            <GraphVisualization nodes={graphData.nodes} edges={graphData.edges} />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}

export default App;