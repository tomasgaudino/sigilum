import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, ArrowUp, ArrowDown, Copy, RotateCcw, Save } from 'lucide-react';

interface PipelineConfiguratorProps {
  onConfigChange: (config: any) => void;
}

interface PipelineStep {
  id: string;
  name: string;
  enabled: boolean;
  parameters: { [key: string]: any };
  description: string;
}

interface PipelineConfig {
  name: string;
  description: string;
  steps: PipelineStep[];
  global_settings: { [key: string]: any };
}

export default function PipelineConfigurator({ onConfigChange }: PipelineConfiguratorProps) {
  const [config, setConfig] = useState<PipelineConfig | null>(null);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [availableSteps, setAvailableSteps] = useState<Omit<PipelineStep, 'id'>[]>([]);

  useEffect(() => {
    // Load available pipeline steps
    const steps: Omit<PipelineStep, 'id'>[] = [
      {
        name: 'AutoResize',
        enabled: true,
        description: 'Automatically resize images to a maximum dimension',
        parameters: {
          max_side: 1600,
          maintain_aspect_ratio: true,
          interpolation: 'lanczos'
        }
      },
      {
        name: 'DeskewBorder',
        enabled: true,
        description: 'Detect and correct image skew using border detection',
        parameters: {
          canny_low: 50,
          canny_high: 150,
          angle_threshold: 45
        }
      },
      {
        name: 'BorderBlur',
        enabled: true,
        description: 'Apply gaussian blur to image borders',
        parameters: {
          gauss_sigma: 3.0,
          border_width: 10
        }
      },
      {
        name: 'Illumination',
        enabled: true,
        description: 'Correct illumination issues in the image',
        parameters: {
          mode: 'none',
          clahe_clip_limit: 2.0,
          clahe_tile_size: 8
        }
      },
      {
        name: 'Denoise',
        enabled: true,
        description: 'Remove noise from the image',
        parameters: {
          mode: 'bilateral',
          d: 9,
          sigma_color: 75,
          sigma_space: 75
        }
      },
      {
        name: 'Binarization',
        enabled: true,
        description: 'Convert image to binary (black and white)',
        parameters: {
          mode: 'otsu',
          threshold: 127,
          max_value: 255
        }
      },
      {
        name: 'Morphology',
        enabled: true,
        description: 'Apply morphological operations',
        parameters: {
          open_sz: 1,
          close_sz: 1,
          iterations: 1
        }
      },
      {
        name: 'OCRMask',
        enabled: true,
        description: 'Create mask for OCR regions',
        parameters: {
          enabled: true,
          min_area: 100,
          max_area: 50000
        }
      },
      {
        name: 'Candidate',
        enabled: true,
        description: 'Detect candidate regions for processing',
        parameters: {
          min_area: 2300,
          max_area: 100000,
          aspect_ratio_min: 0.1,
          aspect_ratio_max: 10.0
        }
      },
      {
        name: 'Skeletonization',
        enabled: false,
        description: 'Apply skeletonization to thin structures',
        parameters: {
          enabled: true,
          method: 'zhang_suen'
        }
      }
    ];

    setAvailableSteps(steps);

    // Load default pipeline
    const defaultPipeline: PipelineConfig = {
      name: 'Default Processing Pipeline',
      description: 'Standard image processing pipeline for document analysis',
      global_settings: {
        debug_mode: false,
        save_intermediates: false,
        parallel_processing: true,
        max_workers: 4
      },
      steps: steps.filter(step => step.enabled).map((step, index) => ({
        ...step,
        id: `step_${index}`
      }))
    };

    setConfig(defaultPipeline);
    onConfigChange(defaultPipeline);
  }, [onConfigChange]);

  const updateConfig = (newConfig: PipelineConfig) => {
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const addStep = (stepTemplate: Omit<PipelineStep, 'id'>) => {
    if (!config) return;

    const newStep: PipelineStep = {
      ...stepTemplate,
      id: `step_${Date.now()}`
    };

    const newConfig = {
      ...config,
      steps: [...config.steps, newStep]
    };

    updateConfig(newConfig);
  };

  const removeStep = (stepId: string) => {
    if (!config) return;

    const newConfig = {
      ...config,
      steps: config.steps.filter(step => step.id !== stepId)
    };

    updateConfig(newConfig);
  };

  const moveStep = (stepId: string, direction: 'up' | 'down') => {
    if (!config) return;

    const currentIndex = config.steps.findIndex(step => step.id === stepId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= config.steps.length) return;

    const newSteps = [...config.steps];
    [newSteps[currentIndex], newSteps[newIndex]] = [newSteps[newIndex], newSteps[currentIndex]];

    updateConfig({
      ...config,
      steps: newSteps
    });
  };

  const updateStepParameter = (stepId: string, paramName: string, value: any) => {
    if (!config) return;

    const newConfig = {
      ...config,
      steps: config.steps.map(step =>
        step.id === stepId
          ? { ...step, parameters: { ...step.parameters, [paramName]: value } }
          : step
      )
    };

    updateConfig(newConfig);
  };

  const toggleStepEnabled = (stepId: string) => {
    if (!config) return;

    const newConfig = {
      ...config,
      steps: config.steps.map(step =>
        step.id === stepId ? { ...step, enabled: !step.enabled } : step
      )
    };

    updateConfig(newConfig);
  };

  const resetToDefault = () => {
    const defaultSteps = availableSteps.filter(step => step.enabled).map((step, index) => ({
      ...step,
      id: `step_${index}`
    }));

    const defaultConfig: PipelineConfig = {
      name: 'Default Processing Pipeline',
      description: 'Standard image processing pipeline for document analysis',
      global_settings: {
        debug_mode: false,
        save_intermediates: false,
        parallel_processing: true,
        max_workers: 4
      },
      steps: defaultSteps
    };

    updateConfig(defaultConfig);
  };

  const renderParameter = (stepId: string, paramName: string, value: any) => {
    const handleChange = (newValue: any) => {
      updateStepParameter(stepId, paramName, newValue);
    };

    if (typeof value === 'boolean') {
      return (
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => handleChange(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">{paramName}</span>
        </label>
      );
    } else if (typeof value === 'number') {
      return (
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">{paramName}</label>
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            step={value % 1 === 0 ? 1 : 0.1}
          />
        </div>
      );
    } else if (typeof value === 'string') {
      return (
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">{paramName}</label>
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      );
    }

    return null;
  };

  if (!config) return <div>Loading...</div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Pipeline Configuration</h2>
          <p className="text-gray-600 mt-1">
            Configure processing steps and parameters for your experiments
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={resetToDefault}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Default</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Steps */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Processing Steps</h3>
            <span className="text-sm text-gray-500">
              {config.steps.filter(s => s.enabled).length} of {config.steps.length} enabled
            </span>
          </div>

          <div className="space-y-3">
            {config.steps.map((step, index) => (
              <div
                key={step.id}
                className={`border rounded-lg p-4 ${
                  step.enabled ? 'bg-white' : 'bg-gray-50 border-gray-200'
                } ${selectedStep === step.id ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center justify-center w-6 h-6 bg-gray-100 text-gray-600 text-xs rounded-full">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className={`font-medium ${step.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                        {step.name}
                      </h4>
                      <p className={`text-sm ${step.enabled ? 'text-gray-600' : 'text-gray-400'}`}>
                        {step.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleStepEnabled(step.id)}
                      className={`px-3 py-1 text-xs rounded-full ${
                        step.enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {step.enabled ? 'Enabled' : 'Disabled'}
                    </button>

                    <button
                      onClick={() => setSelectedStep(selectedStep === step.id ? null : step.id)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Settings className="w-4 h-4" />
                    </button>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => moveStep(step.id, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveStep(step.id, 'down')}
                        disabled={index === config.steps.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeStep(step.id)}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {selectedStep === step.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="font-medium text-gray-900 mb-3">Parameters</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(step.parameters).map(([paramName, value]) => (
                        <div key={paramName}>
                          {renderParameter(step.id, paramName, value)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Add Steps */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Available Steps</h3>
            <div className="space-y-2">
              {availableSteps
                .filter(step => !config.steps.some(s => s.name === step.name))
                .map((step) => (
                  <button
                    key={step.name}
                    onClick={() => addStep(step)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{step.name}</div>
                        <div className="text-sm text-gray-600">{step.description}</div>
                      </div>
                      <Plus className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>
                ))}
            </div>
          </div>

          {/* Global Settings */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Global Settings</h3>
            <div className="space-y-3">
              {Object.entries(config.global_settings).map(([key, value]) => (
                <div key={key}>
                  {renderParameter('global', key, value)}
                </div>
              ))}
            </div>
          </div>

          {/* Pipeline Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Pipeline Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="text-blue-700">
                <span className="font-medium">Name:</span> {config.name}
              </div>
              <div className="text-blue-700">
                <span className="font-medium">Steps:</span> {config.steps.length}
              </div>
              <div className="text-blue-700">
                <span className="font-medium">Enabled:</span> {config.steps.filter(s => s.enabled).length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}