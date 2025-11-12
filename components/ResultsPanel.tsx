import React from 'react';
// FIX: Replaced DocumentReportIcon with DocumentIcon as suggested by the error message.
import { DocumentIcon, DownloadIcon, CheckCircleIcon } from './icons';

interface ResultsPanelProps {
  csvData: string;
  isLoading: boolean;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ csvData, isLoading }) => {
  const handleDownload = () => {
    if (!csvData) return;
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'vendor_summary.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50 flex flex-col h-full flex-shrink-0">
      <div className="flex items-center gap-2 mb-3 border-b border-gray-700 pb-3">
        {/* FIX: Replaced DocumentReportIcon with DocumentIcon. */}
        <DocumentIcon className="w-6 h-6 text-cyan-400" />
        <h2 className="text-lg font-bold text-gray-100">Unified Summary</h2>
      </div>
      <div className="flex-grow flex items-center justify-center text-gray-500">
        {isLoading && !csvData && (
          <p>Generating summary...</p>
        )}
        {!isLoading && !csvData && (
          <p>CSV summary will be available here upon task completion.</p>
        )}
        {csvData && !isLoading && (
          <div className="text-center p-4">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-200">Summary Generated Successfully</h3>
            <p className="text-sm text-gray-400 mb-6">Your unified vendor data is ready for download.</p>
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 bg-cyan-600 text-white font-bold py-3 px-6 rounded-md hover:bg-cyan-500 transition-colors duration-200"
            >
              <DownloadIcon className="w-5 h-5" />
              Download as CSV
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsPanel;
