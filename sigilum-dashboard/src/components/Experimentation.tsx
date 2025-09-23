import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Settings, Eye, Save, Download, Upload, Zap } from 'lucide-react';
import SearchSpaceViewer from './SearchSpaceViewer';
import PipelineConfigurator from './PipelineConfigurator';
import ExperimentRunner from './ExperimentRunner';

interface ExperimentationProps {
  onBack: () => void;
}

type TabType = 'search-spaces' | 'pipeline' | 'experiment' | 'results';

export default function Experimentation({ onBack }: ExperimentationProps) {
  const [activeTab, setActiveTab] = useState<TabType>('search-spaces');
  const [experimentConfig, setExperimentConfig] = useState({
    searchSpace: null,
    pipelineConfig: null,
    metrics: null
  });
  const [isRunning, setIsRunning] = useState(false);

  const tabs = [
    { id: 'search-spaces', label: 'Search Spaces', icon: Eye },
    { id: 'pipeline', label: 'Pipeline Config', icon: Settings },
    { id: 'experiment', label: 'Run Experiment', icon: Play },
    { id: 'results', label: 'Live Results', icon: Zap }
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'search-spaces':
        return (
          <SearchSpaceViewer
            onSearchSpaceSelect={(searchSpace) => {
              setExperimentConfig(prev => ({ ...prev, searchSpace }));
            }}
          />
        );
      case 'pipeline':
        return (
          <PipelineConfigurator
            onConfigChange={(pipelineConfig) => {
              setExperimentConfig(prev => ({ ...prev, pipelineConfig }));
            }}
          />
        );
      case 'experiment':
        return (
          <ExperimentRunner
            config={experimentConfig}
            onRunStart={() => setIsRunning(true)}
            onRunComplete={() => setIsRunning(false)}
          />
        );
      case 'results':
        return (
          <div className="p-6 text-center text-gray-500">
            <Zap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Live Results</h3>
            <p>Real-time experiment results will appear here when running experiments.</p>
            {isRunning && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-blue-600">Experiment running...</p>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
              <div className="h-6 border-l border-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">Experimentation Lab</h1>
            </div>

            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Upload className="w-4 h-4" />
                <span className="text-sm">Import Config</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                <span className="text-sm">Export Config</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Save className="w-4 h-4" />
                <span className="text-sm">Save Experiment</span>
              </button>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-6">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white min-h-[calc(100vh-200px)]">
          {renderActiveTab()}
        </div>

        {/* Status Bar */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>
                Search Space: {experimentConfig.searchSpace ? '✓ Loaded' : '⚠ Not selected'}
              </span>
              <span>
                Pipeline: {experimentConfig.pipelineConfig ? '✓ Configured' : '⚠ Default'}
              </span>
              <span>
                Status: {isRunning ? '🔄 Running' : '⏸ Ready'}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Last saved: Never
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}