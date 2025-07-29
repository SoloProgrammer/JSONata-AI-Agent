'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';

interface JsonUploadProps {
  onJsonLoaded: (json: any) => void;
  jsonContext: any;
}

export function JsonUpload({ onJsonLoaded, jsonContext }: JsonUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isValid, setIsValid] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      
      setUploadedFile(file);
      setIsValid(true);
      onJsonLoaded(json);
    } catch (error) {
      console.error('Invalid JSON file:', error);
      setIsValid(false);
      setUploadedFile(null);
    }
  };

  const clearFile = () => {
    setUploadedFile(null);
    setIsValid(false);
    onJsonLoaded(null);
  };

  useEffect(() => {
    if(!jsonContext){
      clearFile();
    }
  },[jsonContext])

  return (
    <div className="space-y-4">
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragOver
            ? 'border-blue-400 dark:border-purple-400 bg-blue-50 dark:bg-purple-900/20'
            : isValid
            ? 'border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-6">
          {uploadedFile ? (
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex items-center justify-center space-x-2 mb-2">
                <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {uploadedFile.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFile}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                JSON file loaded successfully
              </p>
            </div>
          ) : (
            <div className="text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <div className="mb-2">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-sm font-medium text-blue-600 dark:text-purple-400 hover:text-blue-500 dark:hover:text-purple-300">
                    Click to upload
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400"> or drag and drop</span>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".json"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">JSON files only</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}