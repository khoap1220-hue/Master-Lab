
import { useState, useCallback, useEffect, useRef } from 'react';
import { get, set } from 'idb-keyval';
import { BatchJob, ProcessStatus, RefreshStrategy } from '../../../types';
import { base64ToBlob } from '../../../lib/utils';
import { globalAgentRegistry } from '../logic';
import { generateVeoVideo } from '../logic/viral/video';
import { confirmViralHook, resetViralHook, generateQuoteVisual } from '../logic/viral/workflow';
import { getExecutionTiers } from '../../../lib/tieredExecutor';

export type BatchMode = string;

export interface BatchConfig {
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
    // Video Params
    videoResolution?: string;
    videoAudioEnabled?: boolean;
}

export const useBatchProcessing = (initialJobs: BatchJob[], config: BatchConfig) => {
    const [jobs, setJobs] = useState<BatchJob[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [mode, setMode] = useState<BatchMode>('remove-bg');
    const initializedRef = useRef(false);
    const dbLoadedRef = useRef(false);

    // Load from IndexedDB on mount
    useEffect(() => {
        const loadJobs = async () => {
            try {
                const savedJobs = await get('batch_jobs');
                if (savedJobs && Array.isArray(savedJobs)) {
                    // Reset any 'processing' or 'analyzing_context' etc. states back to 'queued' or 'failed'
                    // so they don't get stuck forever
                    const cleanedJobs = savedJobs.map((j: BatchJob) => {
                        const activeStates = ['preprocessing', 'matting', 'refining', 'analyzing_context', 'placing_neural', 'decomposing', 'localizing', 'vectorizing', 'refreshing', 'scripting', 'visualizing_hooks', 'rendering_video', 'drafting_content', 'rendering_visuals', 'processing'];
                        if (activeStates.includes(j.status)) {
                            j.status = 'failed';
                            j.error = 'Process interrupted by page reload.';
                        }
                        
                        // Re-create object URLs for Blobs to save memory and fix dead blob URLs from previous sessions
                        if (j.file && (!j.originalUrl || j.originalUrl.startsWith('data:') || j.originalUrl.startsWith('blob:'))) {
                            j.originalUrl = URL.createObjectURL(j.file);
                            j.thumbnailUrl = j.originalUrl;
                        }
                        if (j.resultBlob && (!j.resultUrl || j.resultUrl.startsWith('data:') || j.resultUrl.startsWith('blob:'))) {
                            j.resultUrl = URL.createObjectURL(j.resultBlob);
                        }
                        if (j.resultVideoBlob && (!j.resultVideoUrl || j.resultVideoUrl.startsWith('data:') || j.resultVideoUrl.startsWith('blob:'))) {
                            j.resultVideoUrl = URL.createObjectURL(j.resultVideoBlob);
                        }
                        if (j.maskBlob && (!j.maskUrl || j.maskUrl.startsWith('data:') || j.maskUrl.startsWith('blob:'))) {
                            j.maskUrl = URL.createObjectURL(j.maskBlob);
                        }
                        if (j.referenceBlobs && j.referenceBlobs.length > 0) {
                            j.referenceUrls = j.referenceBlobs.map(blob => URL.createObjectURL(blob));
                        }
                        if (j.extractedAssets) {
                            j.extractedAssets = j.extractedAssets.map(asset => {
                                if (asset.flattenedBlob && (!asset.flattenedUrl || asset.flattenedUrl.startsWith('data:') || asset.flattenedUrl.startsWith('blob:'))) {
                                    asset.flattenedUrl = URL.createObjectURL(asset.flattenedBlob);
                                }
                                if (asset.rebrandedBlob && (!asset.rebrandedUrl || asset.rebrandedUrl.startsWith('data:') || asset.rebrandedUrl.startsWith('blob:'))) {
                                    asset.rebrandedUrl = URL.createObjectURL(asset.rebrandedBlob);
                                }
                                return asset;
                            });
                        }
                        
                        return j;
                    });
                    setJobs(cleanedJobs);
                }
            } catch (e) {
                console.error("Failed to load jobs from DB", e);
            } finally {
                dbLoadedRef.current = true;
            }
        };
        loadJobs();
    }, []); // Run only once on mount

    // Apply initialJobs once DB is loaded
    useEffect(() => {
        if (dbLoadedRef.current && initialJobs.length > 0 && !initializedRef.current) {
            setJobs(prev => {
                const existingIds = new Set(prev.map(j => j.id));
                const newJobs = initialJobs.filter(j => !existingIds.has(j.id));
                return [...prev, ...newJobs];
            });
            initializedRef.current = true;
        }
    }, [initialJobs, jobs]);

    const jobsRef = useRef(jobs);
    useEffect(() => {
        jobsRef.current = jobs;
    }, [jobs]);

    // Save to IndexedDB whenever jobs change
    useEffect(() => {
        if (dbLoadedRef.current) {
            set('batch_jobs', jobs).catch(e => console.error("Failed to save jobs to DB", e));
        }
    }, [jobs]);

    // Cleanup object URLs on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            jobsRef.current.forEach(job => {
                if (job.originalUrl && job.originalUrl.startsWith('blob:')) URL.revokeObjectURL(job.originalUrl);
                if (job.resultUrl && job.resultUrl.startsWith('blob:')) URL.revokeObjectURL(job.resultUrl);
                if (job.resultVideoUrl && job.resultVideoUrl.startsWith('blob:')) URL.revokeObjectURL(job.resultVideoUrl);
                if (job.maskUrl && job.maskUrl.startsWith('blob:')) URL.revokeObjectURL(job.maskUrl);
                if (job.referenceUrls) {
                    job.referenceUrls.forEach(url => {
                        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
                    });
                }
                if (job.extractedAssets) {
                    job.extractedAssets.forEach(asset => {
                        if (asset.flattenedUrl && asset.flattenedUrl.startsWith('blob:')) URL.revokeObjectURL(asset.flattenedUrl);
                        if (asset.rebrandedUrl && asset.rebrandedUrl.startsWith('blob:')) URL.revokeObjectURL(asset.rebrandedUrl);
                    });
                }
            });
        };
    }, []);

    const updateJobStatus = useCallback((id: string, status: ProcessStatus, updates?: Partial<BatchJob>) => {
        setJobs(prev => prev.map(j => {
            if (j.id === id) {
                const newJob = { ...j, status, ...updates };
                // Convert base64 resultUrl to Blob to save memory
                if (newJob.resultUrl && newJob.resultUrl.startsWith('data:image/')) {
                    try {
                        const blob = base64ToBlob(newJob.resultUrl);
                        newJob.resultBlob = blob;
                        newJob.resultUrl = URL.createObjectURL(blob);
                    } catch (e) {
                        console.error("Failed to convert base64 to Blob", e);
                    }
                }
                // Convert base64 maskUrl to Blob to save memory
                if (newJob.maskUrl && newJob.maskUrl.startsWith('data:image/')) {
                    try {
                        const blob = base64ToBlob(newJob.maskUrl);
                        newJob.maskBlob = blob;
                        newJob.maskUrl = URL.createObjectURL(blob);
                    } catch (e) {
                        console.error("Failed to convert base64 to Blob", e);
                    }
                }
                // Convert referenceUrls to referenceBlobs if they are base64
                if (newJob.referenceUrls && newJob.referenceUrls.length > 0) {
                    if (!newJob.referenceBlobs) {
                        newJob.referenceBlobs = [];
                    }
                    newJob.referenceUrls = newJob.referenceUrls.map((url, idx) => {
                        if (url.startsWith('data:image/')) {
                            try {
                                const blob = base64ToBlob(url);
                                newJob.referenceBlobs![idx] = blob;
                                return URL.createObjectURL(blob);
                            } catch (e) {
                                console.error("Failed to convert base64 to Blob", e);
                                return url;
                            }
                        }
                        return url;
                    });
                }
                // Convert extractedAssets base64 to Blob
                if (newJob.extractedAssets) {
                    newJob.extractedAssets = newJob.extractedAssets.map(asset => {
                        const newAsset = { ...asset };
                        if (newAsset.flattenedUrl && newAsset.flattenedUrl.startsWith('data:image/')) {
                            try {
                                const blob = base64ToBlob(newAsset.flattenedUrl);
                                newAsset.flattenedBlob = blob;
                                newAsset.flattenedUrl = URL.createObjectURL(blob);
                            } catch (e) {}
                        }
                        if (newAsset.rebrandedUrl && newAsset.rebrandedUrl.startsWith('data:image/')) {
                            try {
                                const blob = base64ToBlob(newAsset.rebrandedUrl);
                                newAsset.rebrandedBlob = blob;
                                newAsset.rebrandedUrl = URL.createObjectURL(blob);
                            } catch (e) {}
                        }
                        return newAsset;
                    });
                }
                return newJob;
            }
            return j;
        }));
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
        const agent = globalAgentRegistry.getAgent(mode);
        if (agent) {
            await agent.processFn(job, config, updateJobStatus);
        } else {
            updateJobStatus(job.id, 'failed', { error: `Unknown Mode: ${mode}` });
        }
    };

    useEffect(() => {
        if (!isProcessing) return;
        const activeStates = ['preprocessing', 'matting', 'refining', 'analyzing_context', 'placing_neural', 'decomposing', 'localizing', 'vectorizing', 'refreshing', 'scripting', 'visualizing_hooks', 'rendering_video', 'drafting_content', 'rendering_visuals', 'processing'];
        const runningCount = jobs.filter(j => activeStates.includes(j.status)).length;
        
        // OPTIMIZATION: High concurrency modes
        // Giới hạn luồng (Concurrency Control) dựa trên Tier và Key Pool
        const tiers = getExecutionTiers();
        const concurrencyLimit = tiers.BATCH.concurrency;

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
