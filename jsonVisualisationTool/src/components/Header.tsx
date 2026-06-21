import React from 'react';
import { Share2, Upload, Database } from 'lucide-react';

interface HeaderProps {
  onUploadClick: () => void;
  onLoadNeo4j: () => void;
  hasData: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onUploadClick, onLoadNeo4j, hasData }) => {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm">
            <Share2 className="h-5 w-5 text-white" />
          </div>
          <div className="leading-tight">
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">GraphMétier</h1>
            <p className="text-xs text-slate-500">Visualisateur de connaissances métier</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onLoadNeo4j}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            <Database className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline">Neo4j</span>
          </button>
          <button
            onClick={onUploadClick}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">{hasData ? 'Charger un autre fichier' : 'Charger un JSON'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
