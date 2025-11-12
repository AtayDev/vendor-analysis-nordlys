import React, { useState } from 'react';
// FIX: Replaced DocumentTextIcon with DocumentIcon and added missing icons.
import { PaperAirplaneIcon, PaperClipIcon, XCircleIcon, DocumentIcon } from './icons';

interface TaskInputProps {
  onSubmit: (prompt: string, file: File | null) => void;
  isLoading: boolean;
}

const TaskInput: React.FC<TaskInputProps> = ({ onSubmit, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    // Reset file input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSubmit(prompt, file);
    }
  };

  return (
    <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50 h-full flex flex-col">
      <h2 className="text-lg font-bold text-gray-100 mb-4 border-b border-gray-700 pb-3">New Unification Task</h2>
      <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
        <div className="flex-grow">
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-400 mb-2">
            Data Extraction Requirements
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., 'Extract vendor name, total price, delivery lead time, and warranty period from the attached quotes.'"
            className="w-full h-48 p-3 bg-gray-900/50 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition resize-none text-sm"
            disabled={isLoading}
          />
        </div>
        
        <div className="mt-4">
          <label htmlFor="file-upload" className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-600 rounded-md cursor-pointer hover:bg-gray-700/50 hover:border-cyan-500 transition">
             <PaperClipIcon className="w-5 h-5 text-gray-400" />
             <span className="text-sm font-medium text-gray-400">{file ? 'Replace file' : 'Attach Vendor Document'}</span>
          </label>
          <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} disabled={isLoading}/>
        </div>
        
        {file && (
            <div className="mt-3 flex items-center justify-between bg-gray-700/50 p-2 rounded-md">
                <div className="flex items-center gap-2 overflow-hidden">
                    {/* FIX: Replaced DocumentTextIcon with DocumentIcon as suggested by the error message. */}
                    <DocumentIcon className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <span className="text-sm text-gray-300 truncate">{file.name}</span>
                </div>
                <button type="button" onClick={handleRemoveFile} disabled={isLoading} className="p-1 rounded-full hover:bg-gray-600">
                    <XCircleIcon className="w-5 h-5 text-gray-400" />
                </button>
            </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="mt-6 w-full flex items-center justify-center gap-2 bg-cyan-600 text-white font-bold py-3 px-4 rounded-md hover:bg-cyan-500 transition-colors duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <PaperAirplaneIcon className="w-5 h-5" />
              Generate Summary
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default TaskInput;
