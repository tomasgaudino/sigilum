import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Trial } from '../types';

interface TrialTimelineProps {
  trials: Trial[];
}

export default function TrialTimeline({ trials }: TrialTimelineProps) {
  const timelineData = trials.map((trial, index) => {
    const totalTime = trial.steps.reduce((sum, step) => sum + step.ms, 0);
    const phaseBreakdown: Record<string, number> = {};

    trial.steps.forEach(step => {
      phaseBreakdown[step.phase] = step.ms;
    });

    return {
      trial: index + 1,
      totalTime,
      ...phaseBreakdown
    };
  });

  // Get all unique phases for legend
  const allPhases = Array.from(
    new Set(trials.flatMap(trial => trial.steps.map(step => step.phase)))
  );

  const colors = [
    '#F0B90B', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#EAECEF'
  ];

  return (
    <div className="h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={timelineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="trial"
            label={{ value: 'Trial Number', position: 'insideBottom', offset: -10 }}
          />
          <YAxis
            label={{ value: 'Time (ms)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            formatter={(value, name) => [`${Number(value).toFixed(2)}ms`, name]}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="totalTime"
            stroke="#EAECEF"
            strokeWidth={3}
            name="Total Time"
          />
          {allPhases.slice(0, 5).map((phase, index) => (
            <Line
              key={phase}
              type="monotone"
              dataKey={phase}
              stroke={colors[index]}
              strokeWidth={2}
              name={phase}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}