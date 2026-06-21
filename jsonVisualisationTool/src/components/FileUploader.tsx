import React, { useRef } from 'react';
import { Upload, FileText } from 'lucide-react';

interface FileUploaderProps {
  onFileLoad: (data: any) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileLoad }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        onFileLoad(jsonData);
      } catch (error) {
        alert('Erreur lors du parsing du fichier JSON. Vérifiez le format.');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target?.result as string);
          onFileLoad(jsonData);
        } catch (error) {
          alert('Erreur lors du parsing du fichier JSON. Vérifiez le format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div
        className="group cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-white/60 p-8 text-center shadow-soft backdrop-blur-sm transition-colors hover:border-brand-400 hover:bg-brand-50/40"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-brand-100 p-4 transition-transform group-hover:scale-105">
            <Upload className="h-8 w-8 text-brand-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-700">
              Glissez votre fichier JSON ici
            </p>
            <p className="mt-1 text-sm text-slate-500">
              ou cliquez pour sélectionner un fichier
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <FileText className="h-4 w-4" />
            <span>Formats supportés : .json</span>
          </div>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};