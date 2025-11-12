
import React from 'react';
import { Agent, AgentStatus } from '../types';
import { ChipIcon, CheckCircleIcon, XCircleIcon, DotsCircleHorizontalIcon, BeakerIcon } from './icons';

interface AgentPanelProps {
  agents: Agent[];
}

const StatusIndicator: React.FC<{ status: AgentStatus }> = ({ status }) => {
  switch (status) {
    case AgentStatus.IDLE:
      // FIX: Replaced title attribute with <title> child element to resolve TypeScript error.
      return <DotsCircleHorizontalIcon className="w-5 h-5 text-gray-500"><title>Idle</title></DotsCircleHorizontalIcon>;
    case AgentStatus.WORKING:
      return <div className="w-4 h-4 rounded-full bg-yellow-500 animate-pulse" title="Working"></div>;
    case AgentStatus.SUCCESS:
      // FIX: Replaced title attribute with <title> child element to resolve TypeScript error.
      return <CheckCircleIcon className="w-5 h-5 text-green-500"><title>Success</title></CheckCircleIcon>;
    case AgentStatus.ERROR:
      // FIX: Replaced title attribute with <title> child element to resolve TypeScript error.
      return <XCircleIcon className="w-5 h-5 text-red-500"><title>Error</title></XCircleIcon>;
    default:
      return null;
  }
};

const AgentCard: React.FC<{ agent: Agent }> = ({ agent }) => (
  <div className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:bg-gray-700/40 transition-colors duration-200">
    <div className="flex-shrink-0">
      <StatusIndicator status={agent.status} />
    </div>
    <div className="flex-grow">
      <p className="font-semibold text-sm text-gray-200">{agent.name}</p>
      <p className="text-xs text-gray-400">{agent.specialty}</p>
    </div>
  </div>
);

const AgentPanel: React.FC<AgentPanelProps> = ({ agents }) => {
  return (
    <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4 border-b border-gray-700 pb-3">
            <BeakerIcon className="w-6 h-6 text-cyan-400" />
            <h2 className="text-lg font-bold text-gray-100">Agent Roster</h2>
        </div>
        <div className="space-y-3 overflow-y-auto">
            {agents.map(agent => <AgentCard key={agent.id} agent={agent} />)}
        </div>
    </div>
  );
};

export default AgentPanel;
