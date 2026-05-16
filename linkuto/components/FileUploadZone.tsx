"use client";

import { useState, useRef } from "react";
import { Upload, FileText, X } from "lucide-react";

interface FileUploadZoneProps {
  onFileSelect?: (file: File | null) => void;
}

export default function FileUploadZone({ onFileSelect }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        handleFileChange(file);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the click on the dropzone
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onFileSelect) {
      onFileSelect(null);
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileInput}
      />
      
      {!selectedFile ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative cursor-pointer flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed transition-all
            ${isDragging 
              ? "border-accent bg-accent/5" 
              : "border-gray-300 hover:border-accent hover:bg-gray-50/50"}
          `}
        >
          <div className="p-3 bg-white rounded-full shadow-sm mb-2 text-text-muted">
            <Upload size={20} className={isDragging ? "text-accent" : ""} />
          </div>
          <p className="text-sm font-medium text-text-primary">
            Click or drag to upload
          </p>
          <p className="text-xs text-text-muted mt-1">PDF documents only</p>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-accent/10 text-accent rounded-lg flex-shrink-0">
              <FileText size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate pr-4">
                {selectedFile.name}
              </p>
              <p className="text-xs text-text-muted">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
            aria-label="Remove file"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
