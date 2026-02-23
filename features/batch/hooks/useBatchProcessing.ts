
import { useState, useCallback, useEffect, useRef } from 'react';
import { BatchJob, ProcessStatus, RefreshStrategy } from '../../../types';
import { 
    processRefreshJob, 
    processStyledTextGeneration,
    processRemoveBg,
    processUpscale,
    processDecompose,
    processAutoMockup,
    processPrintPrep,
    processProduct360,
    processUniversalStructure,
    processAdCampaign,
    processUXFlow
} from '../logic/batchProcessors';
import { processProductPhotography } from '../logic/productShootProcessor'; 
import { processViralStory, confirmViralHook, resetViralHook, generateQuoteVisual } from '../logic/viral/workflow';
import { generateVeoVideo } from '../logic/viral/video';

export type BatchMode = 'remove-bg' | 'upscale' | 'print-prep' | 'auto-mockup' | 'decompose' | 'font-creation' | 'full-refresh' | 'viral-story' | 'product-360' | 'structural-architect' | 'ad-campaign' | 'product-photography' | 'ux-flow';

interface BatchConfig {
    brandVibe: string;
    brandColor: string;
    rebrandStyle: string;
    brandLogo: string | null;
    brandAssets: string[];
    targetText?: string;
    refreshStrategy?: RefreshStrategy;
    platform?: string;
    duration?: string;
    // Packaging/Structure Params
    packDimensions?: { w: number, h: number, d: number };
    packType?: string;
    // Photography Params
    batchCount?: number;
    isAutoPilot?: boolean; 
    modelRefImage?: string | null; 
}

export const useBatchProcessing = (initialJobs: BatchJob[], config: BatchConfig) => {
    const [jobs, setJobs] = useState<BatchJob[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [mode, setMode] = useState<BatchMode>('remove-bg');
    const initializedRef = useRef(false);

    useEffect(() => {
        if (initialJobs.length > 0 && !initializedRef.current) {
            setJobs(prev => [...prev, ...initialJobs]);
            initializedRef.current = true;
        }
    }, [initialJobs]);

    const updateJobStatus = useCallback((id: string, status: ProcessStatus, updates?: Partial<BatchJob>) => {
        setJobs(prev => prev.map(j => j.id === id ? { ...j, status, ...updates } : j));
    }, []);

    const triggerVideoGeneration = useCallback(async (job: BatchJob) => {
        await generateVeoVideo(job, updateJobStatus);
    }, [updateJobStatus]);

    const selectViralHook = useCallback((job: BatchJob, hookId: string) => {
        confirmViralHook(job, hookId, updateJobStatus);
    }, [updateJobStatus]);

    const deselectViralHook = useCallback((job: BatchJob) => {
        resetViralHook(job, updateJobStatus);
    }, [updateJobStatus]);

    const triggerQuoteGeneration = useCallback(async (job: BatchJob, quoteIndex: number) => {
        setIsProcessing(true);
        await generateQuoteVisual(job, quoteIndex, updateJobStatus);
        setIsProcessing(false);
    }, [updateJobStatus]);

    const processJob = async (job: BatchJob) => {
        switch (mode) {
            case 'remove-bg':
                await processRemoveBg(job, updateJobStatus);
                break;
            case 'upscale':
                await processUpscale(job, updateJobStatus);
                break;
            case 'decompose':
                await processDecompose(job, updateJobStatus);
                break;
            case 'auto-mockup':
                await processAutoMockup(job, config, updateJobStatus);
                break;
            case 'print-prep':
                await processPrintPrep(job, updateJobStatus);
                break;
            case 'font-creation':
                await processStyledTextGeneration(job, config, updateJobStatus);
                break;
            case 'full-refresh':
                await processRefreshJob(job, config, updateJobStatus);
                break;
            case 'viral-story':
                await processViralStory(job, config, updateJobStatus);
                break;
            case 'product-360':
                await processProduct360(job, config, updateJobStatus);
                break;
            case 'structural-architect':
                await processUniversalStructure(job, config, updateJobStatus);
                break;
            case 'ad-campaign': 
                await processAdCampaign(job, config, updateJobStatus);
                break;
            case 'product-photography': 
                await processProductPhotography(job, config, updateJobStatus);
                break;
            case 'ux-flow': // NEW MODE
                await processUXFlow(job, config, updateJobStatus);
                break;
            default:
                updateJobStatus(job.id, 'failed', { error: "Unknown Mode" });
        }
    };

    useEffect(() => {
        if (!isProcessing) return;
        const activeStates = ['preprocessing', 'matting', 'refining', 'analyzing_context', 'placing_neural', 'decomposing', 'localizing', 'vectorizing', 'refreshing', 'scripting', 'visualizing_hooks', 'rendering_video', 'drafting_content', 'rendering_visuals'];
        const runningCount = jobs.filter(j => activeStates.includes(j.status)).length;
        
        // OPTIMIZATION: High concurrency modes
        const concurrencyLimit = (mode === 'ad-campaign' || mode === 'product-360' || mode === 'product-photography' || mode === 'ux-flow') ? 5 : 3;

        if (runningCount >= concurrencyLimit) return;
        
        const queuedJobs = jobs.filter(j => j.status === 'queued');
        if (queuedJobs.length === 0) {
            if (runningCount === 0) setIsProcessing(false);
            return;
        }
        
        queuedJobs.slice(0, concurrencyLimit - runningCount).forEach(job => {
            updateJobStatus(job.id, 'preprocessing');
            processJob(job);
        });
    }, [isProcessing, jobs, mode, config]); 

    return { 
        jobs, setJobs, isProcessing, setIsProcessing, mode, setMode, 
        fontSubMode: 'generate' as 'generate' | 'trace', 
        setFontSubMode: (_m: 'generate' | 'trace') => {}, 
        updateJobStatus,
        triggerVideoGeneration,
        selectViralHook,
        deselectViralHook,
        triggerQuoteGeneration,
        regenerateChars: async (_jobId: string, _chars: string[]) => {}, 
        regenerateCharsWithRename: async (_jobId: string, _glyphId: string, _newChar: string) => {} 
    };
};
