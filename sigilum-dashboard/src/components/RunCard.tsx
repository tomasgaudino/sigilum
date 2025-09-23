import React from 'react';
import { Clock, Play, Zap, Activity } from 'lucide-react';
import { RunInfo } from '../types';

interface RunCardProps {
  run: RunInfo;
  onClick: () => void;
}

export default function RunCard({ run, onClick }: RunCardProps) {
  return (
    <div
      className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{run.name}</h3>
        <span className="text-sm text-gray-500">{run.timestamp}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <Play className="w-4 h-4 text-blue-500" />
          <span className="text-sm text-gray-600">{run.trials} trials</span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-green-500" />
          <span className="text-sm text-gray-600">{run.avgTime.toFixed(1)}ms avg</span>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center space-x-2 mb-1">
          <Zap className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium text-gray-700">Bottleneck:</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-900">{run.bottleneckPhase}</span>
          <span className="text-sm font-semibold text-red-600">{run.bottleneckTime.toFixed(1)}ms</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500">Total: {run.totalTime.toFixed(1)}ms</span>
        </div>
        <button className="text-blue-600 text-sm font-medium hover:text-blue-800">
          View Details →
        </button>
      </div>
    </div>
  );
}