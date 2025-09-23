import React, { useState, useEffect } from 'react';
import { Play, Square, Pause, RotateCcw, Download, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';

interface ExperimentRunnerProps {
  config: {
    searchSpace: any;
    pipelineConfig: any;
    metrics: any;
  };
  onRunStart: () => void;
  onRunComplete: () => void;
}

interface ExperimentRun {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  parameters: { [key: string]: any };
  results?: {
    metrics: { [key: string]: number };
    execution_time: number;
    bottleneck_phase?: string;
  };
  progress?: number;
  error?: string;
}

export default function ExperimentRunner({ config, onRunStart, onRunComplete }: ExperimentRunnerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [runs, setRuns] = useState<ExperimentRun[]>([]);
  const [currentRun, setCurrentRun] = useState<ExperimentRun | null>(null);
  const [experimentSettings, setExperimentSettings] = useState({
    max_trials: 10,
    timeout_per_trial: 300,
    parallel_trials: 1,
    early_stopping: true,
    optimization_metric: 'accuracy',
    optimization_direction: 'maximize'
  });

  const generateExperimentRuns = () => {
    if (!config.searchSpace) return [];

    // Generate parameter combinations based on search space
    const { parameters } = config.searchSpace;
    const runs: ExperimentRun[] = [];

    for (let i = 0; i < experimentSettings.max_trials; i++) {
      const runParams: { [key: string]: any } = {};

      // Generate random parameter values based on search space
      Object.entries(parameters).forEach(([paramName, paramConfig]: [string, any]) => {
        if (paramConfig.type === 'categorical') {
          runParams[paramName] = paramConfig.values[Math.floor(Math.random() * paramConfig.values.length)];
        } else if (paramConfig.type === 'numeric') {
          const range = paramConfig.max - paramConfig.min;
          const steps = Math.floor(range / paramConfig.step);
          const randomStep = Math.floor(Math.random() * steps);
          runParams[paramName] = paramConfig.min + (randomStep * paramConfig.step);
        } else if (paramConfig.type === 'boolean') {
          runParams[paramName] = Math.random() > 0.5;
        }
      });

      runs.push({
        id: `run_${i + 1}`,
        status: 'pending',
        parameters: runParams
      });
    }

    return runs;
  };

  const startExperiment = async () => {
    if (!config.searchSpace) {
      alert('Please select a search space first');
      return;
    }

    const experimentRuns = generateExperimentRuns();
    setRuns(experimentRuns);
    setIsRunning(true);
    setIsPaused(false);
    onRunStart();

    // Simulate running experiments
    for (let i = 0; i < experimentRuns.length && isRunning && !isPaused; i++) {
      const run = experimentRuns[i];
      setCurrentRun(run);

      // Update run status to running
      setRuns(prev => prev.map(r => r.id === run.id ? { ...r, status: 'running' as const, progress: 0 } : r));

      // Simulate progress
      for (let progress = 0; progress <= 100; progress += 10) {
        if (!isRunning || isPaused) break;

        setRuns(prev => prev.map(r => r.id === run.id ? { ...r, progress } : r));
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      if (!isRunning || isPaused) break;

      // Simulate results
      const mockResults = {
        metrics: {
          accuracy: 0.7 + Math.random() * 0.3,
          precision: 0.6 + Math.random() * 0.4,
          recall: 0.65 + Math.random() * 0.35,
          f1_score: 0.68 + Math.random() * 0.32
        },
        execution_time: 50 + Math.random() * 200,
        bottleneck_phase: ['AutoResize', 'Binarization', 'OCRMask', 'Candidate'][Math.floor(Math.random() * 4)]
      };

      const finalStatus = Math.random() > 0.1 ? 'completed' : 'failed';

      setRuns(prev => prev.map(r =>
        r.id === run.id
          ? {
              ...r,
              status: finalStatus as const,
              results: finalStatus === 'completed' ? mockResults : undefined,
              error: finalStatus === 'failed' ? 'Simulation error occurred' : undefined,
              progress: finalStatus === 'completed' ? 100 : undefined
            }
          : r
      ));

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
    setCurrentRun(null);
    onRunComplete();
  };

  const stopExperiment = () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentRun(null);
    onRunComplete();
  };

  const pauseExperiment = () => {
    setIsPaused(!isPaused);
  };

  const resetExperiment = () => {
    setRuns([]);
    setCurrentRun(null);
    setIsRunning(false);
    setIsPaused(false);
  };

  const getStatusIcon = (status: ExperimentRun['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-gray-400" />;
      case 'running': return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getBestRun = () => {
    const completedRuns = runs.filter(r => r.status === 'completed' && r.results);
    if (completedRuns.length === 0) return null;

    return completedRuns.reduce((best, current) => {
      const bestMetric = best.results?.metrics[experimentSettings.optimization_metric] || 0;
      const currentMetric = current.results?.metrics[experimentSettings.optimization_metric] || 0;

      if (experimentSettings.optimization_direction === 'maximize') {
        return currentMetric > bestMetric ? current : best;
      } else {
        return currentMetric < bestMetric ? current : best;
      }
    });
  };

  const completedRuns = runs.filter(r => r.status === 'completed').length;
  const failedRuns = runs.filter(r => r.status === 'failed').length;
  const bestRun = getBestRun();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Experiment Runner</h2>
          <p className="text-gray-600 mt-1">
            Run experiments with your configured search space and pipeline
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {!isRunning ? (
            <button
              onClick={startExperiment}
              disabled={!config.searchSpace}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              <span>Start Experiment</span>
            </button>
          ) : (
            <>
              <button
                onClick={pauseExperiment}
                className="flex items-center space-x-2 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                <Pause className="w-4 h-4" />
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>
              <button
                onClick={stopExperiment}
                className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Square className="w-4 h-4" />
                <span>Stop</span>
              </button>
            </>
          )}

          <button
            onClick={resetExperiment}
            disabled={isRunning}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Experiment Settings */}
        <div className="space-y-6">
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-4">Experiment Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Trials
                </label>
                <input
                  type="number"
                  value={experimentSettings.max_trials}
                  onChange={(e) => setExperimentSettings(prev => ({ ...prev, max_trials: parseInt(e.target.value) || 10 }))}
                  disabled={isRunning}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Optimization Metric
                </label>
                <select
                  value={experimentSettings.optimization_metric}
                  onChange={(e) => setExperimentSettings(prev => ({ ...prev, optimization_metric: e.target.value }))}
                  disabled={isRunning}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="accuracy">Accuracy</option>
                  <option value="precision">Precision</option>
                  <option value="recall">Recall</option>
                  <option value="f1_score">F1 Score</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Direction
                </label>
                <select
                  value={experimentSettings.optimization_direction}
                  onChange={(e) => setExperimentSettings(prev => ({ ...prev, optimization_direction: e.target.value }))}
                  disabled={isRunning}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="maximize">Maximize</option>
                  <option value="minimize">Minimize</option>
                </select>
              </div>
            </div>
          </div>

          {/* Progress Summary */}
          {runs.length > 0 && (
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-4">Progress Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completed:</span>
                  <span className="text-sm font-medium text-green-600">{completedRuns}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Failed:</span>
                  <span className="text-sm font-medium text-red-600">{failedRuns}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Remaining:</span>
                  <span className="text-sm font-medium text-gray-600">
                    {runs.filter(r => r.status === 'pending').length}
                  </span>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Overall Progress</span>
                    <span className="text-gray-600">
                      {Math.round(((completedRuns + failedRuns) / runs.length) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((completedRuns + failedRuns) / runs.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Best Result */}
          {bestRun && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-3">Best Result So Far</h3>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-green-700 font-medium">Run:</span> {bestRun.id}
                </div>
                <div className="text-sm">
                  <span className="text-green-700 font-medium">{experimentSettings.optimization_metric}:</span>{' '}
                  {bestRun.results?.metrics[experimentSettings.optimization_metric]?.toFixed(4)}
                </div>
                <div className="text-sm">
                  <span className="text-green-700 font-medium">Time:</span>{' '}
                  {bestRun.results?.execution_time?.toFixed(1)}ms
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Experiment Results */}
        <div className="lg:col-span-2">
          <div className="bg-white border rounded-lg">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Experiment Runs</h3>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {runs.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Zap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No experiments started yet</p>
                  <p className="text-sm">Configure your settings and click "Start Experiment"</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {runs.map((run) => (
                    <div key={run.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(run.status)}
                          <span className="font-medium text-gray-900">{run.id}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            run.status === 'completed' ? 'bg-green-100 text-green-800' :
                            run.status === 'failed' ? 'bg-red-100 text-red-800' :
                            run.status === 'running' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {run.status}
                          </span>
                        </div>

                        {run.results && (
                          <div className="text-sm text-gray-600">
                            {experimentSettings.optimization_metric}: {run.results.metrics[experimentSettings.optimization_metric]?.toFixed(4)}
                          </div>
                        )}
                      </div>

                      {run.status === 'running' && run.progress !== undefined && (
                        <div className="mb-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Progress</span>
                            <span className="text-gray-600">{run.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${run.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {run.error && (
                        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          {run.error}
                        </div>
                      )}

                      {run.results && (
                        <div className="mt-2 text-sm text-gray-600">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="font-medium">Execution time:</span> {run.results.execution_time.toFixed(1)}ms
                            </div>
                            <div>
                              <span className="font-medium">Bottleneck:</span> {run.results.bottleneck_phase}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}