import React from 'react';
import { Trial } from '../types';

interface TrialTimelineProps {
  trials: Trial[];
}

export default function TrialTimeline({ trials }: TrialTimelineProps) {
  if (!trials || trials.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No trial data available
      </div>
    );
  }

  // Calculate max time for scaling
  const maxTime = Math.max(
    ...trials.map(trial =>
      trial.steps.reduce((sum, step) => sum + step.ms, 0)
    )
  );

  return (
    <div className="space-y-4">
      {trials.map((trial, index) => {
        const totalTime = trial.steps.reduce((sum, step) => sum + step.ms, 0);

        return (
          <div key={trial.signature || index} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Trial {index + 1}
              </span>
              <span className="text-sm text-gray-500">
                {totalTime.toFixed(1)}ms
              </span>
            </div>

            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div className="flex h-4 rounded-full overflow-hidden">
                  {trial.steps.map((step, stepIndex) => {
                    const widthPercent = (step.ms / totalTime) * 100;
                    const colors = [
                      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
                      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-gray-500',
                      'bg-orange-500', 'bg-teal-500'
                    ];
                    const color = colors[stepIndex % colors.length];

                    return (
                      <div
                        key={step.idx}
                        className={`${color} flex items-center justify-center text-xs text-white font-medium`}
                        style={{ width: `${widthPercent}%` }}
                        title={`${step.phase}: ${step.ms.toFixed(1)}ms`}
                      >
                        {widthPercent > 8 && step.phase.substring(0, 4)}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              {trial.steps.map((step, stepIndex) => {
                const colors = [
                  'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
                  'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-gray-500',
                  'bg-orange-500', 'bg-teal-500'
                ];
                const color = colors[stepIndex % colors.length];

                return (
                  <div key={step.idx} className="flex items-center space-x-1">
                    <div className={`w-3 h-3 ${color} rounded-sm`}></div>
                    <span className="text-gray-600">
                      {step.phase}: {step.ms.toFixed(1)}ms
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}