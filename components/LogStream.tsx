
import React, { useEffect, useRef } from 'react';
import { LogEntry, LogLevel } from '../types';
import { TerminalIcon } from './icons';

interface LogStreamProps {
  logs: LogEntry[];
}

const getLogLevelColor = (level: LogLevel): string => {
  switch (level) {
    case LogLevel.INFO:
      return 'text-blue-400';
    case LogLevel.SUCCESS:
      return 'text-green-400';
    case LogLevel.WARN:
      return 'text-yellow-400';
    case LogLevel.ERROR:
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
};

const LogStream: React.FC<LogStreamProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-gray-900/70 rounded-xl p-4 border border-gray-700/50 flex flex-col h-full flex-grow">
      <div className="flex items-center gap-2 mb-3 border-b border-gray-700 pb-3 flex-shrink-0">
        <TerminalIcon className="w-6 h-6 text-cyan-400" />
        <h2 className="text-lg font-bold text-gray-100">Execution Log</h2>
      </div>
      <div ref={scrollRef} className="font-mono text-xs text-gray-300 space-y-1.5 overflow-y-auto pr-2 flex-grow">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 items-start">
            <span className="text-gray-500 flex-shrink-0">{log.timestamp.toLocaleTimeString()}</span>
            <span className={`font-bold w-48 flex-shrink-0 ${getLogLevelColor(log.level)}`}>{`[${log.agentName}]`}</span>
            <span className="flex-grow break-words whitespace-pre-wrap">{log.message}</span>
          </div>
        ))}
        {logs.length === 0 && (
            <div className="flex items-center justify-center h-full text-gray-500">
                <p>Awaiting task initiation...</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default LogStream;
