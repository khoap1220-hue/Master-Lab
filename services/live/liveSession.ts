
import { LiveServerMessage, Modality, FunctionDeclaration, Type } from "@google/genai";
import { getAI } from "../../lib/gemini";

// --- AUDIO UTILS ---
const AUDIO_INPUT_SAMPLE_RATE = 16000;
const AUDIO_OUTPUT_SAMPLE_RATE = 24000;
const BUFFER_LOOKAHEAD = 0.05; // 50ms buffer to prevent audio glitching

function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function floatTo16BitPCM(input: Float32Array) {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// --- TOOL DEFINITIONS ---
const triggerDesignTool: FunctionDeclaration = {
    name: "trigger_design_system",
    description: "Kích hoạt hệ thống xử lý hình ảnh để Vẽ mới, Chỉnh sửa, hoặc Phân tích theo yêu cầu người dùng.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            prompt: {
                type: Type.STRING,
                description: "Mô tả chi tiết yêu cầu thị giác (Visual Prompt) bằng tiếng Anh hoặc tiếng Việt."
            },
            intent: {
                type: Type.STRING,
                description: "Loại tác vụ: 'CREATE' (Vẽ mới), 'EDIT' (Sửa ảnh/Mask), hoặc 'PLAN' (Lập kế hoạch/Tư vấn).",
                enum: ["CREATE", "EDIT", "PLAN"]
            }
        },
        required: ["prompt", "intent"]
    }
};

// --- MAIN CLASS ---
export class LiveSessionManager {
  private session: any = null;
  private sessionPromise: Promise<any> | null = null;
  private isDisconnected = false;
  private audioContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private analyzer: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private currentSessionId: number = 0;
  
  // Audio Queue Management
  private outputCtx: AudioContext | null = null;
  private nextStartTime = 0;
  private scheduledSources: AudioBufferSourceNode[] = [];

  // Callbacks
  private onStatusChange: (status: string, detail?: string) => void;
  private onVolumeChange: (vol: number, type: 'input' | 'output') => void;
  private onActionTrigger: (prompt: string, intent: string) => void;

  constructor(
      onStatus: (s: string, d?: string) => void,
      onVolume: (v: number, t: 'input' | 'output') => void,
      onAction: (p: string, i: string) => void
  ) {
    this.onStatusChange = onStatus;
    this.onVolumeChange = onVolume;
    this.onActionTrigger = onAction;
  }

  public async connect(retryCount = 0) {
    try {
        // 1. CLEANUP FIRST
        this.cleanupResources();
        this.isDisconnected = false;
        this.currentSessionId++;
        const sessionId = this.currentSessionId;

        this.onStatusChange("initializing", "Khởi động Neural Audio Core...");

        // 2. INIT AUDIO CONTEXTS
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioContextClass({ sampleRate: AUDIO_INPUT_SAMPLE_RATE });
        this.outputCtx = new AudioContextClass({ sampleRate: AUDIO_OUTPUT_SAMPLE_RATE });

        // 3. WARM UP AUDIO
        if (this.audioContext.state === 'suspended') await this.audioContext.resume();
        if (this.outputCtx.state === 'suspended') await this.outputCtx.resume();

        if (this.isDisconnected) {
            this.cleanupResources();
            return;
        }

        // 4. GET MICROPHONE ACCESS
        this.onStatusChange("initializing", "Đang kết nối Micro...");
        this.stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                channelCount: 1,
                sampleRate: AUDIO_INPUT_SAMPLE_RATE,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });

        if (this.isDisconnected) {
            this.cleanupResources();
            return;
        }

        this.onStatusChange("connecting", "Đang đồng bộ với Fenrir...");

        // 5. ESTABLISH WEBSOCKET CONNECTION
        const ai = getAI();
        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-12-2025', 
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } },
                systemInstruction: `[IDENTITY]
Bạn là Fenrir, AI Giám đốc Sáng tạo (Creative Director) của "Tiệm Ảnh Tức Thời" trong chế độ xLive Mode.
Phong cách: Chuyên nghiệp, Sắc bén, Đầy cảm hứng. Nói giọng Việt Nam tự nhiên.

[CORE PROTOCOL]
1. NHIỆM VỤ: Không chỉ làm theo yêu cầu, mà phải TƯ VẤN, LÀM RÕ và NÂNG TẦM yêu cầu của người dùng lên một tầm cao mới trước khi thực hiện.
2. QUY TRÌNH TƯ VẤN (xLive Mode):
   - Khi người dùng đưa ra yêu cầu cơ bản (VD: "Vẽ con mèo"), đừng vẽ ngay. Hãy hỏi lại để làm rõ phong cách, bối cảnh, cảm xúc (VD: "Bạn muốn một chú mèo cyberpunk neon hay mèo hoàng gia cổ điển?").
   - Gợi ý những ý tưởng đột phá, góc nhìn độc đáo, ánh sáng nghệ thuật để bức ảnh ấn tượng hơn.
   - Khi người dùng chốt ý tưởng, mới gọi Tool "trigger_design_system".
3. QUY TẮC NÓI: 
   - Phản hồi ngắn gọn, súc tích nhưng gợi mở (dưới 3 câu).
   - Khi gọi Tool, xác nhận đầy năng lượng: "Tuyệt vời, đang khởi tạo kiệt tác...", "Đã rõ, nâng tầm ngay."
4. VISUAL AWARENESS: Bạn kiểm soát hệ thống thị giác. Hãy hành xử như một Đạo diễn Nghệ thuật thực thụ.`,
                tools: [{ functionDeclarations: [triggerDesignTool] }]
            },
            callbacks: {
                onopen: async () => {
                    if (this.currentSessionId !== sessionId || this.isDisconnected) return;
                    console.log("[LiveSession] Connected to Gemini 2.5 Flash Native");
                    this.onStatusChange("connected");
                    this.startAudioPipeline(sessionPromise, sessionId); 
                },
                onmessage: async (msg: LiveServerMessage) => {
                    if (this.currentSessionId !== sessionId || this.isDisconnected) return;
                    // 1. Audio Response Processing
                    const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (audioData) {
                        this.queueAudioOutput(audioData);
                    }
                    
                    // 2. Tool Call Logic (Aggregated Response)
                    if (msg.toolCall) {
                        console.log("[LiveSession] Tool Triggered:", msg.toolCall);
                        const functionResponses = [];
                        
                        for (const fc of msg.toolCall.functionCalls) {
                            if (fc.name === 'trigger_design_system') {
                                const args = fc.args as any;
                                // Execute Client Action
                                this.onActionTrigger(args.prompt, args.intent);
                                
                                // Collect Response
                                functionResponses.push({
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: `Success. Action ${args.intent} triggered for: ${args.prompt}` }
                                });
                            }
                        }

                        // Send ALL responses in ONE message to prevent 503/Protocol Error
                        if (functionResponses.length > 0) {
                            sessionPromise.then(s => {
                                if (this.currentSessionId === sessionId) {
                                    s.sendToolResponse({ functionResponses: functionResponses });
                                }
                            });
                        }
                    }

                    // 3. Smart Interruption Handling
                    if (msg.serverContent?.interrupted) {
                        console.log("[LiveSession] User Interrupted Model");
                        this.clearAudioQueue();
                    }
                },
                onclose: (e) => {
                    if (this.currentSessionId !== sessionId || this.isDisconnected) return;
                    console.log("[LiveSession] Closed", e);
                    this.onStatusChange("disconnected", "Đã ngắt kết nối");
                    this.cleanupResources();
                },
                onerror: (err: any) => {
                    if (this.currentSessionId !== sessionId || this.isDisconnected) return;
                    console.error("[LiveSession] Error", err);
                    const msg = err.message || "";
                    if (msg.includes("Deadline")) this.onStatusChange("error", "Mạng chậm (Timeout)");
                    else if (msg.includes("unavailable")) this.onStatusChange("error", "Máy chủ quá tải");
                    else if (msg.includes("not implemented")) this.onStatusChange("error", "Lỗi Cấu Hình (Tools/Prompt)");
                    else this.onStatusChange("error", "Lỗi kết nối");
                    this.disconnect();
                }
            }
        });

        this.sessionPromise = sessionPromise;
        this.session = await sessionPromise;

        if (this.isDisconnected) {
            this.cleanupResources();
            return;
        }

    } catch (err: any) {
        if (this.isDisconnected) return;
        console.error("Connection Failed:", err);
        
        if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError' || err.message?.includes("device not found")) {
             this.onStatusChange("error", "Không tìm thấy Micro. Vui lòng kiểm tra thiết bị.");
             this.cleanupResources();
             return;
        }

        // RETRY LOGIC for transient errors
        if (retryCount < 2 && (err.message?.includes("Deadline") || err.message?.includes("unavailable"))) {
            console.log(`[LiveSession] Retrying connection (${retryCount + 1}/2)...`);
            this.onStatusChange("connecting", `Đang thử lại (${retryCount + 1}/2)...`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
            if (this.isDisconnected) return; // Do not retry if disconnected during wait
            return this.connect(retryCount + 1);
        }

        this.onStatusChange("error", "Không thể truy cập Micro hoặc lỗi kết nối.");
        this.cleanupResources();
    }
  }

  // --- AUDIO INPUT (MIC -> GEMINI) ---
  private startAudioPipeline(sessionPromise: Promise<any>, sessionId: number) {
      if (!this.audioContext || !this.stream || this.isDisconnected) return;

      this.inputSource = this.audioContext.createMediaStreamSource(this.stream);
      
      // Use ScriptProcessor for raw PCM access
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.analyzer = this.audioContext.createAnalyser();
      this.analyzer.fftSize = 256;
      this.inputSource.connect(this.analyzer);
      this.visualizeVolume(); 

      this.processor.onaudioprocess = (e) => {
          if (this.currentSessionId !== sessionId || this.isDisconnected) return;
          const inputData = e.inputBuffer.getChannelData(0);
          
          const pcm16 = floatTo16BitPCM(inputData);
          const base64 = arrayBufferToBase64(pcm16.buffer);

          sessionPromise.then(session => {
              if (this.currentSessionId !== sessionId || this.isDisconnected) return;
              try {
                  session.sendRealtimeInput({
                      audio: {
                          mimeType: `audio/pcm;rate=${AUDIO_INPUT_SAMPLE_RATE}`,
                          data: base64
                      }
                  });
              } catch (e) {
                  // Session might be closed
              }
          });
      };

      this.inputSource.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
  }

  // --- AUDIO OUTPUT (GEMINI -> SPEAKERS) ---
  private async queueAudioOutput(base64Data: string) {
      if (!this.outputCtx || this.isDisconnected) return;

      try {
          const audioBytes = base64ToUint8Array(base64Data);
          const dataInt16 = new Int16Array(audioBytes.buffer);
          
          const buffer = this.outputCtx.createBuffer(1, dataInt16.length, AUDIO_OUTPUT_SAMPLE_RATE);
          const channelData = buffer.getChannelData(0);
          for(let i=0; i<dataInt16.length; i++) {
              channelData[i] = dataInt16[i] / 32768.0;
          }

          const source = this.outputCtx.createBufferSource();
          source.buffer = buffer;
          source.connect(this.outputCtx.destination);
          
          // Drift Correction
          const currentTime = this.outputCtx.currentTime;
          if (this.nextStartTime < currentTime) {
              this.nextStartTime = currentTime + BUFFER_LOOKAHEAD; 
          }

          source.start(this.nextStartTime);
          this.nextStartTime += buffer.duration;
          this.scheduledSources.push(source);
          
          source.onended = () => {
              const idx = this.scheduledSources.indexOf(source);
              if (idx > -1) this.scheduledSources.splice(idx, 1);
          };

          // Visual Feedback
          this.onVolumeChange(Math.random() * 40 + 60, 'output');

      } catch (e) {
          console.error("Audio Decode Error", e);
      }
  }

  private visualizeVolume() {
      if (!this.analyzer || !this.stream?.active || this.isDisconnected) return;
      
      const dataArray = new Uint8Array(this.analyzer.frequencyBinCount);
      this.analyzer.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for(let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      const avg = sum / dataArray.length;
      
      this.onVolumeChange(Math.min(100, avg * 1.5), 'input');
      this.animationFrameId = requestAnimationFrame(() => this.visualizeVolume());
  }

  private clearAudioQueue() {
      this.scheduledSources.forEach(s => {
          try { s.stop(); } catch(e) {}
      });
      this.scheduledSources = [];
      if (this.outputCtx) {
          this.nextStartTime = this.outputCtx.currentTime;
      }
  }

  private cleanupResources() {
      this.isDisconnected = true;
      this.clearAudioQueue();
      
      if (this.animationFrameId) {
          cancelAnimationFrame(this.animationFrameId);
          this.animationFrameId = null;
      }
      
      this.stream?.getTracks().forEach(t => t.stop());
      
      if (this.processor) {
          this.processor.onaudioprocess = null;
          this.processor.disconnect();
      }
      if (this.inputSource) {
          this.inputSource.disconnect();
      }
      if (this.analyzer) {
          this.analyzer.disconnect();
      }
      
      if (this.audioContext && this.audioContext.state !== 'closed') this.audioContext.close();
      if (this.outputCtx && this.outputCtx.state !== 'closed') this.outputCtx.close();
      
      if (this.session) {
          try {
              if (typeof this.session.close === 'function') {
                  this.session.close();
              }
          } catch(e) {}
      } else if (this.sessionPromise) {
          this.sessionPromise.then(s => {
              try {
                  if (typeof s.close === 'function') s.close();
              } catch(e) {}
          }).catch(() => {});
      }

      this.stream = null;
      this.inputSource = null;
      this.processor = null;
      this.analyzer = null;
      this.audioContext = null;
      this.outputCtx = null;
      this.session = null;
      this.sessionPromise = null;
  }

  public disconnect() {
      this.cleanupResources();
      this.onStatusChange("disconnected");
  }
}
