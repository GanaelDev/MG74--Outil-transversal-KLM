import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { FileUploader } from './components/FileUploader';
import { GraphVisualization } from './components/GraphVisualization';
import { transformDataToGraph } from './utils/graphUtils';
import { sampleData } from './data/sampleData';
import { FiliereMetier, GraphNode, GraphEdge } from './types';

function App() {
  const [data, setData] = useState<FiliereMetier | null>(null);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[], edges: GraphEdge[] } | null>(null);
  const [showUploader, setShowUploader] = useState(false);

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

  if (showUploader || !data || !graphData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Header onUploadClick={handleUploadClick} hasData={!!data} />
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
            {data && (
              <div className="mt-8">
                <button
                  onClick={() => setShowUploader(false)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Voir le graphique des données exemple
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
      <Header onUploadClick={handleUploadClick} hasData={true} />
      <div className="flex-1 p-4">
        <div className="h-full bg-white rounded-lg shadow-lg overflow-hidden">
          <GraphVisualization nodes={graphData.nodes} edges={graphData.edges} />
        </div>
      </div>
    </div>
  );
}

export default App;