export interface PhaseStep {
  idx: number;
  phase: string;
  params: Record<string, any>;
  cache_key: string;
  ms: number;
}

export interface Trial {
  steps: PhaseStep[];
  steps_def: PhaseStep[];
  signature: string;
}

export interface RunInfo {
  id: string;
  name: string;
  timestamp: string;
  trials: number;
  totalTime: number;
  avgTime: number;
  bottleneckPhase: string;
  bottleneckTime: number;
}

export interface BottleneckAnalysis {
  phase: string;
  avgTime: number;
  maxTime: number;
  minTime: number;
  count: number;
  percentage: number;
}