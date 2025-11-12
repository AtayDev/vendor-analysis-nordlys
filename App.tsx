import React, { useState, useCallback, useEffect } from 'react';
import { AppState, Report, PlanningReport } from './types';
import { generateReport, generatePlan } from './services/geminiService';
import { PROMPT_TEMPLATE, PLANNING_PROMPT_TEMPLATE } from './constants';
import { fileToBase64 } from './utils/fileUtils';
import { ScanLineIcon, RotateCcwIcon, UploadCloudIcon, FileUpIcon, FolderOpenIcon, Loader2Icon, ClipboardListIcon, TargetIcon, ArrowRightIcon, XCircleIcon } from './components/icons';
import AnalysisWorkspace from './components/AnalysisWorkspace';
import Modal from './components/Modal';

// Main Application Component
const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [planningReport, setPlanningReport] = useState<PlanningReport | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlanningReportModalVisible, setIsPlanningReportModalVisible] = useState<boolean>(false);

  useEffect(() => {
    // Cleanup function to revoke the object URL when the component unmounts or the preview changes
    return () => {
        if (filePreview) {
            URL.revokeObjectURL(filePreview);
        }
    };
  }, [filePreview]);

  const resetWorkflow = useCallback(() => {
    setAppState('upload');
    setFile(null);
    setFilePreview(null);
    setPlanningReport(null);
    setReport(null);
    setError(null);
  }, []);

  const handleFileSelect = useCallback(async (selectedFile: File | null) => {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/') && selectedFile.type !== 'application/pdf') {
        setError('Invalid File Type. Please upload a valid image (PNG, JPG) or PDF file.');
        setAppState('error');
        return;
    }
    
    // Revoke previous URL if it exists
    if (filePreview) {
        URL.revokeObjectURL(filePreview);
    }

    setFile(selectedFile);
    setAppState('planning');
    
    const objectUrl = URL.createObjectURL(selectedFile);
    setFilePreview(objectUrl);

    try {
        const base64Data = await fileToBase64(selectedFile);
        const fileData = { mimeType: selectedFile.type, data: base64Data };
        const planPrompt = PLANNING_PROMPT_TEMPLATE(selectedFile.name);
        
        const plan = await generatePlan(planPrompt, fileData);
        setPlanningReport(plan);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during analysis planning.';
        setError(errorMessage);
        setAppState('error');
    }
  }, [filePreview]);
  
  const handleProceedToAnalysis = useCallback(async () => {
    if (!file) return;

    setAppState('processing');

    try {
        const base64Data = await fileToBase64(file);
        const fileData = { mimeType: file.type, data: base64Data };
        const fullPrompt = PROMPT_TEMPLATE(file.name);

        const rawReport = await generateReport(fullPrompt, fileData);
        
        const sections = rawReport.split(/^#\s\d\.\s/m).slice(1);
        const parsedReport: Report = {
            overview: sections[0]?.split('\n').slice(1).join('\n').trim() || "No overview generated.",
            technical: sections[1]?.split('\n').slice(1).join('\n').trim() || "No technical data generated.",
            operational: sections[2]?.split('\n').slice(1).join('\n').trim() || "No operational data generated.",
            financial: sections[3]?.split('\n').slice(1).join('\n').trim() || "No financial data generated.",
        };

        setReport(parsedReport);
        setAppState('analysis');

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during analysis.';
        setError(errorMessage);
        setAppState('error');
    }
  }, [file]);

  const renderContent = () => {
    switch (appState) {
      case 'upload':
        return <UploadView onFileSelect={handleFileSelect} />;
      case 'planning':
          return <PlanningView planningReport={planningReport} onProceed={handleProceedToAnalysis} />;
      case 'processing':
        return <ProcessingView fileName={file?.name || 'document'} />;
      case 'analysis':
        return <AnalysisWorkspace file={file!} filePreview={filePreview} report={report!} />;
      case 'error':
        return <Modal title="Analysis Failed" message={error!} onClose={resetWorkflow} />;
      default:
        return null;
    }
  };

  const isPlanningWithReport = appState === 'planning' && planningReport;
  const isAnalysis = appState === 'analysis';

  const getContainerClasses = () => {
    if (isPlanningWithReport || isAnalysis) {
        return 'w-full max-w-[95%]';
    }
    return 'w-full mx-auto max-w-6xl';
  };

  return (
    <div className="app-shell flex h-screen overflow-hidden bg-[--color-bg]">
      <Sidebar 
        onReset={resetWorkflow} 
        planningReport={planningReport} 
        onShowPlanningReport={() => setIsPlanningReportModalVisible(true)}
      />
      <main id="main-content" className="flex-1 custom-scrollbar p-10 overflow-y-auto">
        <div className={`transition-all duration-300 ease-in-out ${getContainerClasses()}`}>
            <h1 className="text-3xl font-bold mb-8 text-[--color-text]">Analysis Workflow</h1>
            {renderContent()}
        </div>
      </main>
      {isPlanningReportModalVisible && planningReport && (
        <PlanningReportModal report={planningReport} onClose={() => setIsPlanningReportModalVisible(false)} />
      )}
    </div>
  );
};

// --- Sub-components for different states ---

const Sidebar: React.FC<{ onReset: () => void; planningReport: PlanningReport | null; onShowPlanningReport: () => void; }> = ({ onReset, planningReport, onShowPlanningReport }) => (
    <aside id="sidebar" className="w-[22rem] bg-[--color-panel] border-r border-[--color-border] flex flex-col p-6 flex-shrink-0">
        <div className="flex items-center text-xl font-bold mb-8 text-[--color-text] border-b border-[--color-border] pb-4">
            <ScanLineIcon className="w-8 h-8 mr-3 text-[--color-active-pill]" />
            Vendor Analysis Tool
        </div>
        <nav className="space-y-3 mb-8">
            <a href="#" className="flex items-center p-3 rounded-lg bg-[--color-active-selection] text-[--color-text] font-semibold">
                <UploadCloudIcon className="w-5 h-5 mr-3" />
                Analysis Workflow
            </a>
            {planningReport && (
                <button
                    onClick={onShowPlanningReport}
                    className="w-full flex items-center p-3 rounded-lg text-[--color-text] font-semibold hover:bg-[--color-accent-hover] text-left"
                >
                    <ClipboardListIcon className="w-5 h-5 mr-3" />
                    View Extraction Strategy
                </button>
            )}
        </nav>
        <div className="flex-grow"></div>
        <button onClick={onReset} className="w-full flex items-center justify-center gap-2 text-sm font-medium text-[--color-text-muted] p-3 rounded-lg hover:bg-[--color-accent-hover] mb-4">
            <RotateCcwIcon className="w-4 h-4" />
            Start New Analysis
        </button>
        <div className="text-xs text-[--color-text-muted] text-center border-t border-[--color-border] pt-4 mt-auto">
            v3.5 (Final Layout)
        </div>
    </aside>
);

const UploadView: React.FC<{ onFileSelect: (file: File | null) => void }> = ({ onFileSelect }) => {
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.currentTarget.classList.add('dragover'); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.currentTarget.classList.remove('dragover'); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    onFileSelect(e.dataTransfer.files[0] || null);
  };
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="animate-fade-in-up">
        <h2 className="text-xl font-semibold mb-4">Step 1: Upload Vendor Document</h2>
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="upload-zone bg-[--color-panel] border-2 border-dashed border-[--color-border] p-12 rounded-xl text-center transition-all cursor-pointer hover:border-[--color-text-muted]"
        >
            <FileUpIcon className="w-12 h-12 mx-auto mb-4 text-[--color-text-muted]" />
            <p className="text-xl font-medium text-[--color-text] mb-2">Drag & Drop document here</p>
            <p className="text-sm text-[--color-text-muted] mb-6">Supported formats: PDF, PNG, JPG</p>
            <button type="button" className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[--color-primary-button] text-white font-semibold transition hover:bg-[--color-primary-button-hover]">
                <FolderOpenIcon className="w-5 h-5 mr-2" />
                Browse Files
            </button>
        </div>
        <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => onFileSelect(e.target.files?.[0] || null)} accept="image/png, image/jpeg, application/pdf" />
    </div>
  );
};

const PlanningView: React.FC<{ planningReport: PlanningReport | null, onProceed: () => void }> = ({ planningReport, onProceed }) => {
    if (!planningReport) {
        return (
            <div className="animate-fade-in-up">
                <h2 className="text-xl font-semibold mb-4">Step 2: Review Extraction Strategy</h2>
                <div className="flex flex-col items-center justify-center p-12 bg-[--color-panel] border border-[--color-border] rounded-lg">
                    <Loader2Icon className="w-12 h-12 spin-loading text-[--color-active-pill]" />
                    <p className="text-lg font-medium mt-4 text-[--color-text]">Formulating analysis strategy...</p>
                    <p className="text-sm text-[--color-text-muted] mt-1">Nordlys Analyzer is planning which KPIs to extract.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-xl font-semibold">Step 2: Review Extraction Strategy</h2>
                    <p className="text-md text-[--color-text-muted] mt-1">The AI has formulated a plan to analyze your document. Review the critical KPIs it will look for.</p>
                </div>
                <button 
                    onClick={onProceed}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[--color-primary-button] text-white font-semibold transition hover:bg-[--color-primary-button-hover] whitespace-nowrap">
                    Proceed to Full Analysis
                    <ArrowRightIcon className="w-5 h-5 ml-2" />
                </button>
            </div>

            <div className="space-y-8">
                {planningReport.kpiTiers.map(tier => (
                    <div key={tier.tierTitle} className="bg-[--color-panel] border border-[--color-border] rounded-xl overflow-hidden">
                        <div className="p-4 bg-[--color-active-selection] border-b border-[--color-border]">
                            <h3 className="text-lg font-bold text-[--color-text] flex items-center">
                                <ClipboardListIcon className="w-6 h-6 mr-3 text-[--color-active-pill]" />
                                {tier.tierTitle}
                            </h3>
                        </div>
                        <div className="kpi-table-container">
                            <table className="w-full text-left">
                                <thead className="bg-white">
                                    <tr>
                                        <th className="p-4 font-semibold w-1/3">KPI</th>
                                        <th className="p-4 font-semibold w-1/3">Why It's Critical</th>
                                        <th className="p-4 font-semibold w-1/3">Potential Location</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tier.kpis.map(kpi => (
                                        <tr key={kpi.kpi} className="border-t border-[--color-border]">
                                            <td className="p-4 font-medium text-[--color-text]">{kpi.kpi}</td>
                                            <td className="p-4 text-[--color-text-muted]">{kpi.rationale}</td>
                                            <td className="p-4 text-[--color-text-muted] flex items-center">
                                                <TargetIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                                                {kpi.location}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PlanningReportModal: React.FC<{ report: PlanningReport, onClose: () => void }> = ({ report, onClose }) => {
    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex z-50 items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b border-[--color-border] p-4 flex-shrink-0">
                    <h3 className="text-xl font-bold text-[--color-text]">Extraction Strategy</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-[--color-accent-hover]">
                        <XCircleIcon className="w-6 h-6 text-[--color-text-muted]" />
                    </button>
                </div>
                <div className="overflow-y-auto custom-scrollbar p-6">
                    <div className="space-y-8">
                        {report.kpiTiers.map(tier => (
                            <div key={tier.tierTitle} className="bg-[--color-panel] border border-[--color-border] rounded-xl overflow-hidden">
                                <div className="p-4 bg-[--color-active-selection] border-b border-[--color-border]">
                                    <h3 className="text-lg font-bold text-[--color-text] flex items-center">
                                        <ClipboardListIcon className="w-6 h-6 mr-3 text-[--color-active-pill]" />
                                        {tier.tierTitle}
                                    </h3>
                                </div>
                                <div className="kpi-table-container">
                                    <table className="w-full text-left">
                                         <thead className="bg-white">
                                            <tr>
                                                <th className="p-4 font-semibold w-1/3">KPI</th>
                                                <th className="p-4 font-semibold w-1/3">Why It's Critical</th>
                                                <th className="p-4 font-semibold w-1/3">Potential Location</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tier.kpis.map(kpi => (
                                                <tr key={kpi.kpi} className="border-t border-[--color-border]">
                                                    <td className="p-4 font-medium text-[--color-text]">{kpi.kpi}</td>
                                                    <td className="p-4 text-[--color-text-muted]">{kpi.rationale}</td>
                                                    <td className="p-4 text-[--color-text-muted] flex items-center">
                                                        <TargetIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                                                        {kpi.location}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};


const ProcessingView: React.FC<{ fileName: string }> = ({ fileName }) => (
    <div className="animate-fade-in-up">
        <h2 className="text-xl font-semibold mb-4">Step 3: Generating Full Report</h2>
        <div className="flex flex-col items-center justify-center p-12 bg-[--color-panel] border border-[--color-border] rounded-lg">
            <Loader2Icon className="w-12 h-12 spin-loading text-[--color-active-pill]" />
            <p className="text-lg font-medium mt-4 text-[--color-text]">Running analysis...</p>
            <p className="text-sm text-[--color-text-muted] mt-1">{fileName}</p>
        </div>
    </div>
);


export default App;