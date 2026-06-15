import React from 'react';
import { Network, Upload } from 'lucide-react';

interface HeaderProps {
  onUploadClick: () => void;
  hasData: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onUploadClick, hasData }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Network className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">GraphMétier</h1>
              <p className="text-sm text-gray-500">Visualisateur de données métier</p>
            </div>
          </div>
          
          <button
            onClick={onUploadClick}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            {hasData ? 'Charger un autre fichier' : 'Charger un fichier JSON'}
          </button>
        </div>
      </div>
    </header>
  );
};