import { Trial, RunInfo, BottleneckAnalysis } from '../types';

export async function loadRunData(): Promise<RunInfo[]> {
  try {
    const response = await fetch('/api/runs');
    return await response.json();
  } catch (error) {
    // Fallback to local data scanning
    return loadLocalRunData();
  }
}

async function loadLocalRunData(): Promise<RunInfo[]> {
  const runs: RunInfo[] = [];

  // This would need to be replaced with actual file system access
  // For now, return mock data based on the structure we observed
  const runDirs = ['20250921_232156__cheque_test_01', '20250921_232728__cheque_test_01', '20250921_233353__cheque_test_01'];

  for (const runDir of runDirs) {
    const [date, time, name] = runDir.split('__');
    const timestamp = `${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)} ${time.slice(0,2)}:${time.slice(2,4)}:${time.slice(4,6)}`;

    // Load trial data for this run
    const trials = await loadTrialsForRun(runDir);
    const analysis = analyzeTrials(trials);

    runs.push({
      id: runDir,
      name: name || 'Unknown',
      timestamp,
      trials: trials.length,
      totalTime: analysis.totalTime,
      avgTime: analysis.avgTime,
      bottleneckPhase: analysis.bottleneckPhase,
      bottleneckTime: analysis.bottleneckTime
    });
  }

  return runs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

async function loadTrialsForRun(runId: string): Promise<Trial[]> {
  // This would scan the trials directory and load each phases_chain.json
  // For now, return mock trial based on the structure we saw
  return [
    {
      steps: [
        { idx: 1, phase: "AutoResize", params: { max_side: 1600 }, cache_key: "AutoResize_1eefaf82_a1268106", ms: 6.2 },
        { idx: 2, phase: "DeskewBorder", params: { canny_low: 50, canny_high: 150 }, cache_key: "DeskewBorder_b55e3d88_0f8819ed", ms: 5.0 },
        { idx: 3, phase: "BorderBlur", params: { gauss_sigma: 3.0 }, cache_key: "BorderBlur_0d49708e_0f8819ed", ms: 5.1 },
        { idx: 4, phase: "Illumination", params: { mode: "none" }, cache_key: "Illumination_51ca6ffa_8865f924", ms: 4.9 },
        { idx: 5, phase: "ColorSelect", params: { enabled: false }, cache_key: "ColorSelect_a53f225b_8865f924", ms: 4.8 },
        { idx: 6, phase: "Denoise", params: { mode: "bilateral" }, cache_key: "Denoise_ec088199_8865f924", ms: 4.8 },
        { idx: 7, phase: "Binarization", params: { mode: "otsu" }, cache_key: "Binarization_7a263481_5a535651", ms: 3.3 },
        { idx: 8, phase: "Morphology", params: { open_sz: 1 }, cache_key: "Morphology_baa48b47_f2b6f526", ms: 3.3 },
        { idx: 9, phase: "OCRMask", params: { enabled: true }, cache_key: "OCRMask_a013b32b_645d6b85", ms: 3.3 },
        { idx: 10, phase: "RemoveLinesBoxes", params: { use_hough: false }, cache_key: "RemoveLinesBoxes_f3c247ce_34afaa90", ms: 2.0 },
        { idx: 11, phase: "Candidate", params: { min_area: 2300 }, cache_key: "Candidate_24a3ece0_a2be8a36", ms: 2.2 },
        { idx: 12, phase: "AutoCrop", params: { enabled: true }, cache_key: "AutoCrop_0e0f8bf2_a2be8a36", ms: 0.6 },
        { idx: 13, phase: "Skeletonization", params: { enabled: true }, cache_key: "Skeletonization_71945752_472a55b0", ms: 0.4 }
      ],
      steps_def: [],
      signature: "dbe4860e"
    }
  ];
}

function analyzeTrials(trials: Trial[]): { totalTime: number; avgTime: number; bottleneckPhase: string; bottleneckTime: number } {
  if (trials.length === 0) {
    return { totalTime: 0, avgTime: 0, bottleneckPhase: 'None', bottleneckTime: 0 };
  }

  const phaseTimes: Record<string, number[]> = {};
  let totalTime = 0;

  trials.forEach(trial => {
    const trialTime = trial.steps.reduce((sum, step) => sum + step.ms, 0);
    totalTime += trialTime;

    trial.steps.forEach(step => {
      if (!phaseTimes[step.phase]) {
        phaseTimes[step.phase] = [];
      }
      phaseTimes[step.phase].push(step.ms);
    });
  });

  // Find bottleneck phase (highest average time)
  let bottleneckPhase = 'None';
  let bottleneckTime = 0;

  Object.entries(phaseTimes).forEach(([phase, times]) => {
    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    if (avgTime > bottleneckTime) {
      bottleneckTime = avgTime;
      bottleneckPhase = phase;
    }
  });

  return {
    totalTime,
    avgTime: totalTime / trials.length,
    bottleneckPhase,
    bottleneckTime
  };
}

export function analyzeBottlenecks(trials: Trial[]): BottleneckAnalysis[] {
  const phaseTimes: Record<string, number[]> = {};

  trials.forEach(trial => {
    trial.steps.forEach(step => {
      if (!phaseTimes[step.phase]) {
        phaseTimes[step.phase] = [];
      }
      phaseTimes[step.phase].push(step.ms);
    });
  });

  const totalTime = trials.reduce((sum, trial) =>
    sum + trial.steps.reduce((stepSum, step) => stepSum + step.ms, 0), 0
  );

  return Object.entries(phaseTimes).map(([phase, times]) => {
    const sum = times.reduce((s, t) => s + t, 0);
    return {
      phase,
      avgTime: sum / times.length,
      maxTime: Math.max(...times),
      minTime: Math.min(...times),
      count: times.length,
      percentage: (sum / totalTime) * 100
    };
  }).sort((a, b) => b.avgTime - a.avgTime);
}