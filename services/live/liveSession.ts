
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
  private audioContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private analyzer: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  
  // Audio Queue Management
  private outputCtx: AudioContext | null = null;
  private nextStartTime = 0;
  private scheduledSources: AudioBufferSourceNode[] = [];

  // Callbacks
  private onStatusChange: (status: string, detail?: string) => void;
  private onVolumeChange: (vol: number) => void;
  private onActionTrigger: (prompt: string, intent: string) => void;

  constructor(
      onStatus: (s: string, d?: string) => void,
      onVolume: (v: number) => void,
      onAction: (p: string, i: string) => void
  ) {
    this.onStatusChange = onStatus;
    this.onVolumeChange = onVolume;
    this.onActionTrigger = onAction;
  }

  public async connect(retryCount = 0) {
    try {
        // 1. CLEANUP FIRST
        await this.disconnect();

        this.onStatusChange("initializing", "Khởi động Neural Audio Core...");

        // 2. INIT AUDIO CONTEXTS
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioContextClass({ sampleRate: AUDIO_INPUT_SAMPLE_RATE });
        this.outputCtx = new AudioContextClass({ sampleRate: AUDIO_OUTPUT_SAMPLE_RATE });

        // 3. WARM UP AUDIO
        if (this.audioContext.state === 'suspended') await this.audioContext.resume();
        if (this.outputCtx.state === 'suspended') await this.outputCtx.resume();

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

        this.onStatusChange("connecting", "Đang đồng bộ với Fenrir...");

        // 5. ESTABLISH WEBSOCKET CONNECTION
        const ai = getAI();
        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-12-2025', 
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } },
                // FIX: Passed as string to avoid "Not Implemented" error with some backend versions
                systemInstruction: `
[IDENTITY]
Bạn là Fenrir, AI Thiết kế Giọng nói của "Tiệm Ảnh Tức Thời".
Phong cách: Chuyên nghiệp, Nhanh gọn, Hóm hỉnh. Nói giọng Việt Nam tự nhiên.

[CORE PROTOCOL]
1. NHIỆM VỤ: Lắng nghe yêu cầu hình ảnh -> Gọi Tool "trigger_design_system".
2. QUY TẮC NÓI: 
   - Phản hồi cực ngắn (dưới 2 câu) để giảm độ trễ.
   - Khi gọi Tool, hãy nói xác nhận ngắn gọn: "OK, đang vẽ...", "Đã rõ, sửa ngay."
   - Đừng mô tả lại quy trình kỹ thuật, hãy tập trung vào kết quả.
3. VISUAL AWARENESS: Bạn không nhìn thấy màn hình, nhưng bạn kiểm soát nó. Hãy hành xử như một Đạo diễn.
`,
                tools: [{ functionDeclarations: [triggerDesignTool] }]
            },
            callbacks: {
                onopen: async () => {
                    console.log("[LiveSession] Connected to Gemini 2.5 Flash Native");
                    this.onStatusChange("connected");
                    this.startAudioPipeline(sessionPromise); 
                },
                onmessage: async (msg: LiveServerMessage) => {
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
                            sessionPromise.then(s => s.sendToolResponse({
                                functionResponses: functionResponses
                            }));
                        }
                    }

                    // 3. Smart Interruption Handling
                    if (msg.serverContent?.interrupted) {
                        console.log("[LiveSession] User Interrupted Model");
                        this.clearAudioQueue();
                    }
                },
                onclose: (e) => {
                    console.log("[LiveSession] Closed", e);
                    this.onStatusChange("disconnected", "Đã ngắt kết nối");
                    this.cleanupResources();
                },
                onerror: (err: any) => {
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

        this.session = await sessionPromise;

    } catch (err: any) {
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
            return this.connect(retryCount + 1);
        }

        this.onStatusChange("error", "Không thể truy cập Micro hoặc lỗi kết nối.");
        this.cleanupResources();
    }
  }

  // --- AUDIO INPUT (MIC -> GEMINI) ---
  private startAudioPipeline(sessionPromise: Promise<any>) {
      if (!this.audioContext || !this.stream) return;

      this.inputSource = this.audioContext.createMediaStreamSource(this.stream);
      
      // Use ScriptProcessor for raw PCM access
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.analyzer = this.audioContext.createAnalyser();
      this.analyzer.fftSize = 256;
      this.inputSource.connect(this.analyzer);
      this.visualizeVolume(); 

      this.processor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          
          const pcm16 = floatTo16BitPCM(inputData);
          const base64 = arrayBufferToBase64(pcm16.buffer);

          sessionPromise.then(session => {
              try {
                  session.sendRealtimeInput({
                      media: {
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
      if (!this.outputCtx) return;

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
          this.onVolumeChange(Math.random() * 40 + 60);

      } catch (e) {
          console.error("Audio Decode Error", e);
      }
  }

  private visualizeVolume() {
      if (!this.analyzer || !this.stream?.active) return;
      
      const dataArray = new Uint8Array(this.analyzer.frequencyBinCount);
      this.analyzer.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for(let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      const avg = sum / dataArray.length;
      
      this.onVolumeChange(Math.min(100, avg * 1.5));
      requestAnimationFrame(() => this.visualizeVolume());
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
      this.clearAudioQueue();
      
      this.stream?.getTracks().forEach(t => t.stop());
      this.inputSource?.disconnect();
      this.processor?.disconnect();
      this.analyzer?.disconnect();
      
      if (this.audioContext && this.audioContext.state !== 'closed') this.audioContext.close();
      if (this.outputCtx && this.outputCtx.state !== 'closed') this.outputCtx.close();
      
      if (this.session) {
          try {
              if (typeof this.session.close === 'function') {
                  this.session.close();
              }
          } catch(e) {}
      }

      this.stream = null;
      this.inputSource = null;
      this.processor = null;
      this.audioContext = null;
      this.outputCtx = null;
      this.session = null;
  }

  public async disconnect() {
      this.cleanupResources();
      this.onStatusChange("disconnected");
  }
}
