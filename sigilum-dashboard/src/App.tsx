import React, { useState, useEffect } from 'react';
import { Search, BarChart3, RefreshCw } from 'lucide-react';
import { RunInfo } from './types';
import { loadRunData } from './utils/dataLoader';
import RunCard from './components/RunCard';
import RunDetails from './components/RunDetails';

function App() {
  const [runs, setRuns] = useState<RunInfo[]>([]);
  const [filteredRuns, setFilteredRuns] = useState<RunInfo[]>([]);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRuns();
  }, []);

  useEffect(() => {
    const filtered = runs.filter(run =>
      run.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      run.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRuns(filtered);
  }, [runs, searchTerm]);


  const loadRuns = async () => {
    setIsLoading(true);
    try {
      const data = await loadRunData();
      setRuns(data);
    } catch (error) {
      console.error('Failed to load runs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (selectedRun) {
    return (
      <RunDetails
        runId={selectedRun}
        onBack={() => setSelectedRun(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Sigilum Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadRuns}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search runs by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 bg-white text-gray-900 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">{runs.length}</div>
            <div className="text-sm text-gray-600">Total Runs</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">
              {runs.reduce((sum, run) => sum + run.trials, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Trials</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">
              {runs.length > 0 ? (runs.reduce((sum, run) => sum + run.avgTime, 0) / runs.length).toFixed(1) : '0'}ms
            </div>
            <div className="text-sm text-gray-600">Avg Trial Time</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">
              {runs.length > 0 ? runs.reduce((prev, run) =>
                run.bottleneckTime > prev.bottleneckTime ? run : prev, runs[0])?.bottleneckPhase || 'None' : 'None'}
            </div>
            <div className="text-sm text-gray-600">Common Bottleneck</div>
          </div>
        </div>

        {/* Runs Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading runs...</span>
          </div>
        ) : filteredRuns.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No runs found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms.' : 'Start by running some experiments!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRuns.map((run) => (
              <RunCard
                key={run.id}
                run={run}
                onClick={() => setSelectedRun(run.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;