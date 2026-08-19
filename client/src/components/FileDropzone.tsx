import React, { useState, useRef } from 'react';
import { UploadCloud, File, X, CheckCircle } from 'lucide-react';

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
}

const FileDropzone: React.FC<FileDropzoneProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.type.match(/image.*|application\/pdf/)) {
      setSelectedFile(file);
      onFileSelect(file);
      simulateUpload();
    } else {
      alert("Invalid file format. Please upload PDF or Images.");
    }
  };

  const simulateUpload = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-emerald-400 bg-slate-50'
          }`}
        >
          <input
            type="file"
            ref={inputRef}
            onChange={(e) => e.target.files && handleFile(e.target.files[0])}
            accept="image/*,application/pdf"
            className="hidden"
          />
          <UploadCloud className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <p className="text-slate-700 font-medium text-lg">Click or drag prescription here</p>
          <p className="text-slate-500 text-sm mt-2">Supports PDF, JPG, PNG up to 10MB</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <File size={24} />
            </div>
            <div>
              <p className="font-medium text-slate-800 text-sm">{selectedFile.name}</p>
              <p className="text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {uploadProgress < 100 ? (
              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            ) : (
              <CheckCircle className="text-emerald-500 h-6 w-6" />
            )}
            <button onClick={clearFile} className="text-slate-400 hover:text-rose-500 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileDropzone;
