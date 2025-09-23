import React, { useState, useEffect } from 'react';
import { ArrowLeft, BarChart3, PieChart, TrendingUp, Settings } from 'lucide-react';
import { Trial, BottleneckAnalysis } from '../types';
import { analyzeBottlenecks } from '../utils/dataLoader';
import BottleneckChart from './BottleneckChart';
import TrialTimeline from './TrialTimeline';

interface RunDetailsProps {
  runId: string;
  onBack: () => void;
}

export default function RunDetails({ runId, onBack }: RunDetailsProps) {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [bottlenecks, setBottlenecks] = useState<BottleneckAnalysis[]>([]);
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [selectedTrial, setSelectedTrial] = useState<Trial | null>(null);

  useEffect(() => {
    // Load trial data for this run
    loadTrialData();
  }, [runId]);

  const loadTrialData = async () => {
    // This would normally load from the actual run directory
    // For now, using mock data based on the structure we observed
    const mockTrials: Trial[] = [
      {
        steps: [
          { idx: 1, phase: "AutoResize", params: { max_side: 1600 }, cache_key: "AutoResize_1", ms: 6.2 },
          { idx: 2, phase: "DeskewBorder", params: { canny_low: 50 }, cache_key: "DeskewBorder_1", ms: 5.0 },
          { idx: 3, phase: "BorderBlur", params: { gauss_sigma: 3.0 }, cache_key: "BorderBlur_1", ms: 5.1 },
          { idx: 4, phase: "Illumination", params: { mode: "none" }, cache_key: "Illumination_1", ms: 4.9 },
          { idx: 5, phase: "Denoise", params: { mode: "bilateral" }, cache_key: "Denoise_1", ms: 4.8 },
          { idx: 6, phase: "Binarization", params: { mode: "otsu" }, cache_key: "Binarization_1", ms: 3.3 },
          { idx: 7, phase: "Morphology", params: { open_sz: 1 }, cache_key: "Morphology_1", ms: 3.3 },
          { idx: 8, phase: "OCRMask", params: { enabled: true }, cache_key: "OCRMask_1", ms: 3.3 },
          { idx: 9, phase: "Candidate", params: { min_area: 2300 }, cache_key: "Candidate_1", ms: 2.2 },
          { idx: 10, phase: "Skeletonization", params: { enabled: true }, cache_key: "Skeletonization_1", ms: 0.4 }
        ],
        steps_def: [],
        signature: "trial1"
      },
      // Add variations for different trials
      {
        steps: [
          { idx: 1, phase: "AutoResize", params: { max_side: 1200 }, cache_key: "AutoResize_2", ms: 4.8 },
          { idx: 2, phase: "DeskewBorder", params: { canny_low: 40 }, cache_key: "DeskewBorder_2", ms: 4.2 },
          { idx: 3, phase: "BorderBlur", params: { gauss_sigma: 2.0 }, cache_key: "BorderBlur_2", ms: 3.9 },
          { idx: 4, phase: "Illumination", params: { mode: "clahe" }, cache_key: "Illumination_2", ms: 6.1 },
          { idx: 5, phase: "Denoise", params: { mode: "none" }, cache_key: "Denoise_2", ms: 0.1 },
          { idx: 6, phase: "Binarization", params: { mode: "adaptive" }, cache_key: "Binarization_2", ms: 4.1 },
          { idx: 7, phase: "Morphology", params: { open_sz: 2 }, cache_key: "Morphology_2", ms: 4.8 },
          { idx: 8, phase: "OCRMask", params: { enabled: false }, cache_key: "OCRMask_2", ms: 0.1 },
          { idx: 9, phase: "Candidate", params: { min_area: 2000 }, cache_key: "Candidate_2", ms: 1.9 },
          { idx: 10, phase: "Skeletonization", params: { enabled: false }, cache_key: "Skeletonization_2", ms: 0.1 }
        ],
        steps_def: [],
        signature: "trial2"
      }
    ];

    setTrials(mockTrials);
    setBottlenecks(analyzeBottlenecks(mockTrials));
  };

  const totalTrials = trials.length;
  const avgTotalTime = trials.reduce((sum, trial) =>
    sum + trial.steps.reduce((stepSum, step) => stepSum + step.ms, 0), 0
  ) / (totalTrials || 1);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Runs</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Run Details: {runId}</h1>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-600">Total Trials</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{totalTrials}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-600">Avg Time</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{avgTotalTime.toFixed(1)}ms</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-red-500" />
              <span className="text-sm text-gray-600">Bottleneck</span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {bottlenecks[0]?.phase || 'None'}
            </div>
            <div className="text-sm text-red-600">
              {bottlenecks[0]?.avgTime.toFixed(1)}ms avg
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-gray-600">Phases</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{bottlenecks.length}</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Bottleneck Analysis */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Phase Performance</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setChartType('bar')}
                  className={`p-2 rounded ${chartType === 'bar' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setChartType('pie')}
                  className={`p-2 rounded ${chartType === 'pie' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
                >
                  <PieChart className="w-4 h-4" />
                </button>
              </div>
            </div>
            <BottleneckChart data={bottlenecks} type={chartType} />
          </div>

          {/* Trial Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Trial Timeline</h2>
            <TrialTimeline trials={trials} />
          </div>
        </div>

        {/* Detailed Phase Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Phase Analysis</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-4 font-medium text-gray-900">Phase</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-900">Avg Time</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-900">Max Time</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-900">Min Time</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-900">% of Total</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-900">Occurrences</th>
                </tr>
              </thead>
              <tbody>
                {bottlenecks.map((phase, index) => (
                  <tr key={phase.phase} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-2 px-4 font-medium text-gray-900">{phase.phase}</td>
                    <td className="py-2 px-4 text-gray-700">{phase.avgTime.toFixed(2)}ms</td>
                    <td className="py-2 px-4 text-gray-700">{phase.maxTime.toFixed(2)}ms</td>
                    <td className="py-2 px-4 text-gray-700">{phase.minTime.toFixed(2)}ms</td>
                    <td className="py-2 px-4">
                      <div className="flex items-center">
                        <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min(phase.percentage, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-gray-700">{phase.percentage.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-gray-700">{phase.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}