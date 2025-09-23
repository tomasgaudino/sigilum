import { Trial, RunInfo } from '../types';

// Since we can't directly access the file system from the browser,
// we'll create a simple API that can be replaced with a proper backend later

export async function scanRunsDirectory(): Promise<RunInfo[]> {
  // This would be replaced with actual file system scanning
  // For now, we'll simulate the runs we know exist
  const runs = [
    {
      id: '20250921_232156__cheque_test_01',
      name: 'cheque_test_01',
      timestamp: '2025-09-21 23:21:56',
      trials: 15,
      totalTime: 520.5,
      avgTime: 34.7,
      bottleneckPhase: 'AutoResize',
      bottleneckTime: 6.2
    },
    {
      id: '20250921_232728__cheque_test_01',
      name: 'cheque_test_01',
      timestamp: '2025-09-21 23:27:28',
      trials: 22,
      totalTime: 680.3,
      avgTime: 30.9,
      bottleneckPhase: 'Illumination',
      bottleneckTime: 5.8
    },
    {
      id: '20250921_233353__cheque_test_01',
      name: 'cheque_test_01',
      timestamp: '2025-09-21 23:33:53',
      trials: 18,
      totalTime: 590.1,
      avgTime: 32.8,
      bottleneckPhase: 'DeskewBorder',
      bottleneckTime: 6.1
    }
  ];

  return runs;
}

export async function loadTrialsForRun(runId: string): Promise<Trial[]> {
  // This would scan the actual trials directory
  // For now, return mock data that represents the variety of trials

  const baseTrials = [
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
    }
  ];

  // Generate variations for different search space combinations
  const variations = [
    { AutoResize: { max_side: 1200, ms: 4.8 }, Illumination: { mode: "clahe", ms: 6.1 }, Binarization: { mode: "adaptive", ms: 4.1 } },
    { AutoResize: { max_side: 1600, ms: 6.2 }, Illumination: { mode: "none", ms: 4.9 }, Binarization: { mode: "sauvola", ms: 3.8 } },
    { AutoResize: { max_side: 1400, ms: 5.5 }, Illumination: { mode: "clahe", ms: 6.0 }, Binarization: { mode: "otsu", ms: 3.3 } },
  ];

  const trials = variations.map((variation, index) => ({
    ...baseTrials[0],
    signature: `trial_${index + 1}`,
    steps: baseTrials[0].steps.map(step => {
      if (variation[step.phase as keyof typeof variation]) {
        const override = variation[step.phase as keyof typeof variation];
        return {
          ...step,
          params: { ...step.params, ...override },
          ms: override.ms || step.ms
        };
      }
      return { ...step, ms: step.ms + (Math.random() - 0.5) * 2 }; // Add some variance
    })
  }));

  return trials;
}

// Helper function to create a simple file server endpoint
// This would be replaced with a proper backend API
export function createLocalFileServer() {
  // This could be implemented as a simple Node.js server
  // that serves the run data from the file system
  console.log('To fully integrate with your file system, create a simple Express server that:');
  console.log('1. Scans the runs/ directory');
  console.log('2. Reads each trial\'s phases_chain.json');
  console.log('3. Serves the data via REST API');
  console.log('4. Update the dataLoader.ts to fetch from this API');
}