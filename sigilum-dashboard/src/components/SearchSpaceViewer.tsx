import React, { useState, useEffect } from 'react';
import { Eye, Search, Filter, Grid, List, ChevronDown, ChevronRight } from 'lucide-react';

interface SearchSpaceViewerProps {
  onSearchSpaceSelect: (searchSpace: any) => void;
}

interface SearchSpaceConfig {
  name: string;
  description: string;
  parameters: {
    [key: string]: {
      type: 'categorical' | 'numeric' | 'boolean';
      values?: any[];
      min?: number;
      max?: number;
      step?: number;
      default?: any;
    };
  };
  combinations: number;
}

export default function SearchSpaceViewer({ onSearchSpaceSelect }: SearchSpaceViewerProps) {
  const [searchSpaces, setSearchSpaces] = useState<SearchSpaceConfig[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedParams, setExpandedParams] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load search spaces - this would normally come from your configs
    const mockSearchSpaces: SearchSpaceConfig[] = [
      {
        name: 'Image Processing Pipeline',
        description: 'Search space for image preprocessing and enhancement parameters',
        parameters: {
          'AutoResize.max_side': {
            type: 'categorical',
            values: [800, 1200, 1600, 2000],
            default: 1600
          },
          'DeskewBorder.canny_low': {
            type: 'numeric',
            min: 30,
            max: 80,
            step: 10,
            default: 50
          },
          'BorderBlur.gauss_sigma': {
            type: 'numeric',
            min: 1.0,
            max: 5.0,
            step: 0.5,
            default: 3.0
          },
          'Illumination.mode': {
            type: 'categorical',
            values: ['none', 'clahe', 'histogram_eq'],
            default: 'none'
          },
          'Denoise.mode': {
            type: 'categorical',
            values: ['none', 'bilateral', 'gaussian', 'median'],
            default: 'bilateral'
          },
          'Binarization.mode': {
            type: 'categorical',
            values: ['otsu', 'adaptive', 'simple'],
            default: 'otsu'
          }
        },
        combinations: 4 * 6 * 9 * 3 * 4 * 3
      },
      {
        name: 'OCR Optimization',
        description: 'Parameters for OCR accuracy and performance tuning',
        parameters: {
          'OCRMask.enabled': {
            type: 'boolean',
            default: true
          },
          'Candidate.min_area': {
            type: 'numeric',
            min: 1000,
            max: 5000,
            step: 500,
            default: 2300
          },
          'Morphology.open_sz': {
            type: 'categorical',
            values: [1, 2, 3, 4],
            default: 1
          },
          'Skeletonization.enabled': {
            type: 'boolean',
            default: true
          }
        },
        combinations: 2 * 9 * 4 * 2
      },
      {
        name: 'Performance vs Quality',
        description: 'Balanced search space focusing on speed-quality tradeoffs',
        parameters: {
          'AutoResize.max_side': {
            type: 'categorical',
            values: [800, 1600],
            default: 1600
          },
          'processing_quality': {
            type: 'categorical',
            values: ['fast', 'balanced', 'high_quality'],
            default: 'balanced'
          },
          'parallel_processing': {
            type: 'boolean',
            default: true
          }
        },
        combinations: 2 * 3 * 2
      }
    ];
    setSearchSpaces(mockSearchSpaces);
  }, []);

  const filteredSpaces = searchSpaces.filter(space =>
    space.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    space.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleParam = (paramName: string) => {
    const newExpanded = new Set(expandedParams);
    if (newExpanded.has(paramName)) {
      newExpanded.delete(paramName);
    } else {
      newExpanded.add(paramName);
    }
    setExpandedParams(newExpanded);
  };

  const selectSearchSpace = (space: SearchSpaceConfig) => {
    setSelectedSpace(space.name);
    onSearchSpaceSelect(space);
  };

  const renderParameterValue = (param: any) => {
    if (param.type === 'categorical') {
      return (
        <div className="space-y-1">
          <div className="text-xs text-gray-500">Options:</div>
          <div className="flex flex-wrap gap-1">
            {param.values.map((value: any, idx: number) => (
              <span key={idx} className={`px-2 py-1 text-xs rounded ${
                value === param.default ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {String(value)}
              </span>
            ))}
          </div>
        </div>
      );
    } else if (param.type === 'numeric') {
      return (
        <div className="space-y-1">
          <div className="text-xs text-gray-500">Range:</div>
          <div className="text-sm">
            {param.min} → {param.max} (step: {param.step})
          </div>
          <div className="text-xs text-blue-600">Default: {param.default}</div>
        </div>
      );
    } else if (param.type === 'boolean') {
      return (
        <div className="space-y-1">
          <div className="text-xs text-gray-500">Boolean</div>
          <div className="text-xs text-blue-600">Default: {param.default ? 'true' : 'false'}</div>
        </div>
      );
    }
  };

  const renderSearchSpaceCard = (space: SearchSpaceConfig) => (
    <div
      key={space.name}
      className={`border rounded-lg p-4 cursor-pointer transition-all ${
        selectedSpace === space.name
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
      onClick={() => selectSearchSpace(space)}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{space.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{space.description}</p>
        </div>
        {selectedSpace === space.name && (
          <div className="text-blue-500">
            <Eye className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
        <div>
          <span className="font-medium">Parameters:</span> {Object.keys(space.parameters).length}
        </div>
        <div>
          <span className="font-medium">Combinations:</span> {space.combinations.toLocaleString()}
        </div>
      </div>

      <div className="space-y-2">
        {Object.entries(space.parameters).slice(0, 3).map(([paramName, param]) => (
          <div key={paramName} className="text-xs">
            <div className="font-medium text-gray-700">{paramName}</div>
            <div className="text-gray-500">{param.type}</div>
          </div>
        ))}
        {Object.keys(space.parameters).length > 3 && (
          <div className="text-xs text-gray-400">
            +{Object.keys(space.parameters).length - 3} more parameters...
          </div>
        )}
      </div>
    </div>
  );

  const renderDetailedView = (space: SearchSpaceConfig) => (
    <div className="border rounded-lg">
      <div className="p-4 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-900">{space.name}</h3>
        <p className="text-sm text-gray-600 mt-1">{space.description}</p>
        <div className="flex gap-4 mt-2 text-sm text-gray-600">
          <span><strong>Parameters:</strong> {Object.keys(space.parameters).length}</span>
          <span><strong>Total Combinations:</strong> {space.combinations.toLocaleString()}</span>
        </div>
      </div>

      <div className="p-4">
        <h4 className="font-medium text-gray-900 mb-3">Parameter Details</h4>
        <div className="space-y-3">
          {Object.entries(space.parameters).map(([paramName, param]) => (
            <div key={paramName} className="border rounded-lg">
              <button
                onClick={() => toggleParam(paramName)}
                className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{paramName}</span>
                  <span className={`px-2 py-1 text-xs rounded ${
                    param.type === 'categorical' ? 'bg-green-100 text-green-800' :
                    param.type === 'numeric' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {param.type}
                  </span>
                </div>
                {expandedParams.has(paramName) ?
                  <ChevronDown className="w-4 h-4" /> :
                  <ChevronRight className="w-4 h-4" />
                }
              </button>

              {expandedParams.has(paramName) && (
                <div className="p-3 border-t bg-gray-50">
                  {renderParameterValue(param)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Search Space Explorer</h2>
          <p className="text-gray-600 mt-1">
            Explore and select parameter search spaces for experimentation
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search search spaces..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSpaces.map(renderSearchSpaceCard)}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSpaces.map(renderDetailedView)}
        </div>
      )}

      {filteredSpaces.length === 0 && (
        <div className="text-center py-12">
          <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No search spaces found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms.' : 'No search spaces available.'}
          </p>
        </div>
      )}

      {selectedSpace && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-1">Selected Search Space</h4>
          <p className="text-blue-700">{selectedSpace}</p>
        </div>
      )}
    </div>
  );
}