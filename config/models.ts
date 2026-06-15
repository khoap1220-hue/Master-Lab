import { getCurrentKey } from '../lib/keyManager';

export const isProTier = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('has_user_api_key') === 'true' || !!process.env.GEMINI_API_KEY || !!process.env.API_KEY;
  }
  return !!process.env.API_KEY || !!process.env.GEMINI_API_KEY;
};

export const MODELS = {
  // Text & Reasoning Models (Brain, Prompting, Analysis)
  get TEXT_PRIMARY() { return isProTier() ? "gemini-3.1-pro-preview" : "gemma-4-31b-it"; },
  get TEXT_FAST() { return isProTier() ? "gemini-3.5-flash" : "gemma-4-26b-it"; },

  // Image Generation & Editing Models
  get IMAGE_PRIMARY() { return isProTier() ? "gemini-3.1-flash-image" : "gemini-2.5-flash-image"; },
  get IMAGE_PRO() { return isProTier() ? "gemini-3-pro-image" : "gemini-2.5-flash-image"; },
  get IMAGE_FAST() { return isProTier() ? "gemini-3.1-flash-image" : "gemini-2.5-flash-image"; },

  // Video Generation Models
  get VIDEO_FAST() { return isProTier() ? "veo-3.1-lite-generate-preview" : "veo-3.1-lite-generate-preview"; },
  get VIDEO_PRO() { return isProTier() ? "veo-3.1-generate-preview" : "veo-3.1-lite-generate-preview"; },

  // Audio Models
  get AUDIO_TTS() { return "gemini-3.1-flash-tts-preview"; },
  get AUDIO_NATIVE() { return "gemini-3.1-flash-live-preview"; },
};
