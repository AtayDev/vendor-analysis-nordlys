export type AppState = 'upload' | 'planning' | 'processing' | 'analysis' | 'error';

export interface Report {
  overview: string;
  technical: string;
  operational: string;
  financial: string;
}

export interface Kpi {
  kpi: string;
  rationale: string;
  location: string;
}

export interface KpiTier {
  tierTitle: string;
  kpis: Kpi[];
}

export interface PlanningReport {
    strategyTitle: string;
    kpiTiers: KpiTier[];
}

export type ReportSection = keyof Report;

// FIX: Added missing type definitions for Agent, AgentStatus, LogEntry, and LogLevel.
export enum AgentStatus {
  IDLE,
  WORKING,
  SUCCESS,
  ERROR,
}

export interface Agent {
  id: string;
  name: string;
  specialty: string;
  status: AgentStatus;
}

export enum LogLevel {
  INFO,
  SUCCESS,
  WARN,
  ERROR,
}

export interface LogEntry {
  id: number;
  timestamp: Date;
  agentName: string;
  level: LogLevel;
  message: string;
}
