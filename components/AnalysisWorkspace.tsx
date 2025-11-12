import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Report, ReportSection } from '../types';
import { FileTextIcon, SlidersHorizontalIcon, FileCogIcon, ShieldCheckIcon, ExcelIcon, ExpandIcon, XCircleIcon, Loader2Icon, ClipboardCopyIcon, CheckIcon } from './icons';
import { downloadReportAsXLSX } from '../utils/fileUtils';

// Add type declaration for the markdown-it and pdf.js libraries loaded from script tags.
declare global {
    interface Window {
        markdownit: any;
        pdfjsLib: any;
    }
}

interface AnalysisWorkspaceProps {
    file: File;
    filePreview: string | null;
    report: Report;
}

const AnalysisWorkspace: React.FC<AnalysisWorkspaceProps> = ({ file, filePreview, report }) => {
    const [activeTab, setActiveTab] = useState<ReportSection>('overview');
    const [isPdfModalVisible, setIsPdfModalVisible] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [thumbnailStatus, setThumbnailStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [copiedTab, setCopiedTab] = useState<ReportSection | null>(null);

    const handleCopy = (content: string, tabId: ReportSection) => {
        navigator.clipboard.writeText(content).then(() => {
            setCopiedTab(tabId);
            setTimeout(() => setCopiedTab(null), 2000); // Reset after 2 seconds
        }, (err) => {
            console.error('Failed to copy text: ', err);
        });
    };

    useEffect(() => {
        if (file.type === 'application/pdf' && filePreview && thumbnailStatus === 'idle') {
            const generateThumbnail = async () => {
                if (typeof window === 'undefined' || !window.pdfjsLib) {
                    console.error("pdf.js library not loaded.");
                    setThumbnailStatus('error');
                    return;
                }

                setThumbnailStatus('loading');
                try {
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

                    const pdf = await window.pdfjsLib.getDocument(filePreview).promise;
                    const page = await pdf.getPage(1);

                    const canvas = canvasRef.current;
                    const container = canvas?.parentElement;
                    if (!canvas || !container) {
                        setThumbnailStatus('error');
                        return;
                    }
                    
                    const context = canvas.getContext('2d');
                    if (!context) {
                        setThumbnailStatus('error');
                        return;
                    }

                    const desiredWidth = container.clientWidth;
                    const viewport = page.getViewport({ scale: 1 });
                    const scale = desiredWidth / viewport.width;
                    const scaledViewport = page.getViewport({ scale });

                    canvas.height = scaledViewport.height;
                    canvas.width = scaledViewport.width;

                    await page.render({
                        canvasContext: context,
                        viewport: scaledViewport,
                    }).promise;

                    setThumbnailStatus('success');

                } catch (error) {
                    console.error('Error generating PDF thumbnail:', error);
                    setThumbnailStatus('error');
                }
            };

            // Delay thumbnail generation slightly to ensure the UI is responsive
            setTimeout(generateThumbnail, 100);
        }
    }, [file, filePreview, thumbnailStatus]);


    const reportSections: { id: ReportSection, name: string, icon: React.ReactNode }[] = [
        { id: 'overview', name: 'Overview', icon: <FileTextIcon className="w-5 h-5 mr-2" /> },
        { id: 'technical', name: 'Technical Data', icon: <SlidersHorizontalIcon className="w-5 h-5 mr-2" /> },
        { id: 'operational', name: 'Operational & Planning', icon: <FileCogIcon className="w-5 h-5 mr-2" /> },
        { id: 'financial', name: 'Financial & Commercial', icon: <ShieldCheckIcon className="w-5 h-5 mr-2" /> },
    ];
    
    const activeReportContent = report[activeTab];

    const renderedHtml = useMemo(() => {
        if (typeof window !== 'undefined' && window.markdownit) {
            const md = window.markdownit({
                html: false,
                linkify: true,
                typographer: true,
            });
            return md.render(activeReportContent);
        }
        return `<pre>${activeReportContent.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;
    }, [activeReportContent]);


    return (
        <div className="animate-fade-in-up">
            <h2 className="text-xl font-semibold mb-6">Step 3: Review Full Analysis Report</h2>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Center Column: Report (wider) */}
                <div className="lg:col-span-9 bg-[--color-panel] border border-[--color-border] rounded-xl flex flex-col" style={{minHeight: '400px', maxHeight: 'calc(100vh - 12rem)'}}>
                    <div className="p-6 border-b border-[--color-border] flex-shrink-0 flex justify-between items-center">
                         <div className="flex items-center gap-4">
                            <h3 className="text-lg font-semibold text-[--color-text]">Report</h3>
                            <button
                                onClick={() => handleCopy(activeReportContent, activeTab)}
                                className="flex items-center gap-1.5 text-sm text-[--color-text-muted] hover:text-[--color-text] transition-colors"
                            >
                                {copiedTab === activeTab ? (
                                    <>
                                        <CheckIcon className="w-4 h-4 text-green-500" />
                                        <span>Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <ClipboardCopyIcon className="w-4 h-4" />
                                        <span>Copy Section</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <button
                            onClick={() => downloadReportAsXLSX(report)}
                            className="inline-flex items-center justify-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-[--color-primary-button] text-white transition hover:bg-[--color-primary-button-hover]"
                        >
                            <ExcelIcon className="w-4 h-4" />
                            Download Excel Report
                        </button>
                    </div>
                    
                    <div className="flex border-b border-[--color-border] flex-shrink-0">
                        {reportSections.map(section => (
                            <button
                                key={section.id}
                                onClick={() => setActiveTab(section.id)}
                                className={`flex-grow flex items-center justify-center p-4 text-sm font-medium transition-colors focus:outline-none ${
                                    activeTab === section.id
                                        ? 'text-[--color-text] border-b-2 border-[--color-active-pill] bg-[--color-active-selection]'
                                        : 'text-[--color-text-muted] hover:bg-[--color-accent-hover]'
                                }`}
                            >
                                {section.icon}
                                {section.name}
                            </button>
                        ))}
                    </div>

                    <div className="p-8 custom-scrollbar overflow-y-auto">
                        <div 
                            className="markdown-body"
                            dangerouslySetInnerHTML={{ __html: renderedHtml }}
                        />
                    </div>
                </div>

                {/* Right Column: File Preview */}
                <div className="lg:col-span-3 bg-[--color-panel] border border-[--color-border] rounded-xl p-6 h-fit self-start">
                    <h3 className="text-lg font-semibold mb-4 text-[--color-text] border-b border-[--color-border] pb-3">Source Document</h3>
                    
                    {file.type === 'application/pdf' && filePreview ? (
                         <div
                            onClick={() => setIsPdfModalVisible(true)}
                            className="pdf-placeholder relative bg-gray-200 border border-[--color-border] rounded-lg aspect-square flex flex-col items-center justify-center p-1 text-center cursor-pointer hover:border-[--color-text-muted] transition-all overflow-hidden"
                        >
                            {thumbnailStatus === 'loading' && (
                                <>
                                    <Loader2Icon className="w-10 h-10 spin-loading text-[--color-text-muted]" />
                                    <p className="text-xs text-[--color-text-muted] mt-2">Generating preview...</p>
                                </>
                            )}
                            <canvas ref={canvasRef} className={`${thumbnailStatus === 'success' ? 'block' : 'hidden'}`} />
                             {thumbnailStatus === 'error' && (
                                <>
                                    <FileTextIcon className="w-12 h-12 text-[--color-text-muted] mb-2" />
                                    <p className="font-semibold text-sm">Preview unavailable</p>
                                </>
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-60 transition-all flex flex-col items-center justify-center opacity-0 hover:opacity-100 text-white">
                                <ExpandIcon className="w-8 h-8" />
                                <p className="font-semibold mt-2 text-sm">Click to View</p>
                            </div>
                        </div>
                    ) : filePreview ? (
                        <img src={filePreview} alt={file.name} className="w-full h-auto rounded-lg mb-4 object-contain max-h-96 border border-[--color-border]" />
                    ) : (
                        <div className="flex flex-col items-center justify-center bg-[--color-bg] p-8 rounded-lg mb-4 border border-[--color-border]">
                            <FileTextIcon className="w-16 h-16 text-[--color-text-muted] mb-3" />
                            <p className="text-sm text-center text-[--color-text-muted]">No preview available for this file type.</p>
                        </div>
                    )}

                    <div className="space-y-2 text-sm break-words mt-4">
                        <p className="font-semibold text-[--color-text]">{file.name}</p>
                        <p className="text-[--color-text-muted]">Type: {file.type}</p>
                        <p className="text-[--color-text-muted]">Size: {(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                </div>
            </div>

            {isPdfModalVisible && filePreview && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex z-50 items-center justify-center" onClick={() => setIsPdfModalVisible(false)}>
                    <div className="bg-white rounded-lg shadow-2xl w-[60vw] max-w-6xl h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center border-b p-4 flex-shrink-0 bg-gray-50 rounded-t-lg">
                            <h3 className="font-bold text-gray-800">{file.name}</h3>
                            <button onClick={() => setIsPdfModalVisible(false)} className="p-1 rounded-full hover:bg-gray-200 transition">
                                <XCircleIcon className="w-6 h-6 text-gray-600" />
                            </button>
                        </div>
                        <div className="flex-grow bg-gray-200">
                            <iframe src={filePreview} className="w-full h-full border-0" title={file.name} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalysisWorkspace;