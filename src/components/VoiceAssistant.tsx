import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2 } from "lucide-react";

const GEMINI_API_KEY = "AIzaSyDv61fq1EDqyhuq7yAJqH2XsvnN2RXlD2k";
// Notice: gemini-3.1-flash-live-preview may not exist on standard unwhitelisted v1alpha WS endpoints so we map identically to the live API model:
const MODEL = "models/gemini-2.0-flash-exp"; 
const HOST = "generativelanguage.googleapis.com";
// We use a relative Vite proxy path to completely bypass browser adblockers that blanket-ban "googleapis.com"
const WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws-gemini/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;

// Base64 helpers for Float32 to Int16 PCM Conversion
function float32ToPcm16Base64(float32Array: Float32Array): string {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  const bytes = new Uint8Array(int16Array.buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function pcm16Base64ToFloat32(base64: string): Float32Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const int16Array = new Int16Array(bytes.buffer);
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    const v = int16Array[i];
    float32Array[i] = v < 0 ? v / 0x8000 : v / 0x7FFF;
  }
  return float32Array;
}

const VoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("Hi! Tap the mic to start a live voice call with me.");
  const [errorStatus, setErrorStatus] = useState("");
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  
  // Playback state
  const playbackContextRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0);

  const cleanup = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (playbackContextRef.current) {
      playbackContextRef.current.close();
      playbackContextRef.current = null;
    }
    setIsListening(false);
  };

  useEffect(() => {
    return cleanup;
  }, []);

  const playAudioChunk = (base64Audio: string) => {
    if (!playbackContextRef.current) return;
    try {
      const float32Array = pcm16Base64ToFloat32(base64Audio);
      const buffer = playbackContextRef.current.createBuffer(1, float32Array.length, 24000);
      buffer.getChannelData(0).set(float32Array);

      const source = playbackContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(playbackContextRef.current.destination);

      const currentTime = playbackContextRef.current.currentTime;
      if (nextPlayTimeRef.current < currentTime) {
        nextPlayTimeRef.current = currentTime;
      }
      
      source.start(nextPlayTimeRef.current);
      nextPlayTimeRef.current += buffer.duration;
    } catch (err) {
      console.error("Audio playback error:", err);
    }
  };

  const startListening = async () => {
    try {
      setErrorStatus("");
      setResponse("Connecting to server...");
      setTranscript("");
      
      // 1. Init Audio contexts
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioCtx({ sampleRate: 16000 });
      playbackContextRef.current = new AudioCtx({ sampleRate: 24000 });
      nextPlayTimeRef.current = playbackContextRef.current.currentTime;

      // 2. Init WebSocket
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        // Send initial setup message connecting Voice to multimodal model
        ws.send(JSON.stringify({
          setup: {
            model: MODEL,
            systemInstruction: { parts: [{ text: "You are a helpful and caring voice assistant for elderly monitoring and care. Keep your answers short, sweet, and to the point (1-3 sentences). Talk warmly like a real person on the phone." }] }
          }
        }));
        
        ws.send(JSON.stringify({
          clientContent: {
            turns: [
              {
                role: "user",
                parts: [{ text: "Hello! the audio is connected, feel free to greet the user warmly." }]
              }
            ],
            turnComplete: true
          }
        }));
      };

      ws.onmessage = (event) => {
        try {
          const parseMessage = (data: string) => {
            const msg = JSON.parse(data);
            if (msg.serverContent?.modelTurn) {
              const parts = msg.serverContent.modelTurn.parts;
              for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                  setResponse("Assistant is speaking...");
                  playAudioChunk(part.inlineData.data);
                }
                if (part.text) {
                  // Text transcription streaming
                  setResponse(prev => (prev === "Assistant is speaking..." || prev === "Listening...") ? part.text : prev + " " + part.text);
                }
              }
            } else if (msg.serverContent?.interrupted) {
              // The model stopped speaking due to interruption
              nextPlayTimeRef.current = playbackContextRef.current?.currentTime || 0;
            }
          };

          if (event.data instanceof Blob) {
            const reader = new FileReader();
            reader.onload = () => parseMessage(reader.result as string);
            reader.readAsText(event.data);
          } else {
            parseMessage(event.data);
          }
        } catch (e) {
          console.error("Message parsing failed:", e);
        }
      };

      ws.onerror = (e) => {
        console.error("WebSocket error:", e);
        setErrorStatus("Connection error. Could not connect to Gemini.");
        cleanup();
      };

      ws.onclose = () => {
        setResponse("Call ended.");
        cleanup();
      };

      // 3. Get Mic permissions
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // If WebSocket closed or errored while user was accepting permissions, refs might be null
      if (!audioContextRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        throw new Error("Connection closed before microphone access was granted.");
      }

      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      
      // Provide raw low-latency buffered chunks 
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      processor.onaudioprocess = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        const base64Data = float32ToPcm16Base64(inputData);
        
        wsRef.current.send(JSON.stringify({
          realtimeInput: {
            mediaChunks: [{ mimeType: "audio/pcm;rate=16000", data: base64Data }]
          }
        }));
      };

      source.connect(processor);
      // Dummy connect to speakers so script node runs, but we don't output mic straight to speakers
      const audioFilter = audioContextRef.current.createGain();
      audioFilter.gain.value = 0;
      processor.connect(audioFilter);
      audioFilter.connect(audioContextRef.current.destination);

      setIsListening(true);
      setResponse("Listening...");
    } catch (err: unknown) {
      console.error("Mic access error:", err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setErrorStatus(`Failed to start: ${msg}`);
      cleanup();
    }
  };

  const stopListening = () => {
    cleanup();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
        <Volume2 className="w-5 h-5 text-voice" />
        Live Voice Call
      </h2>

      {errorStatus && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-xl text-sm font-medium">
          {errorStatus}
        </div>
      )}

      {/* Response bubble */}
      <motion.div
        key={response}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-accent p-4 rounded-2xl rounded-tl-sm transition-opacity"
      >
        <p className="text-base font-body text-accent-foreground">{response}</p>
      </motion.div>

      {/* Transcript */}
      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-secondary p-3 rounded-2xl rounded-tr-sm"
          >
            <p className="text-sm text-muted-foreground">You said:</p>
            <p className="text-base font-body text-foreground">{transcript}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mic button */}
      <div className="flex justify-center">
        <motion.button
          onClick={isListening ? stopListening : startListening}
          whileTap={{ scale: 0.9 }}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            isListening
              ? "bg-voice animate-sos-pulse"
              : "bg-voice hover:scale-105"
          }`}
        >
          {isListening ? (
            <MicOff className="w-8 h-8 text-voice-foreground" />
          ) : (
            <Mic className="w-8 h-8 text-voice-foreground" />
          )}
        </motion.button>
      </div>
      <p className="text-center text-sm text-muted-foreground">
        {isListening ? "Listening... tap to hang up" : "Tap to call Assistant"}
      </p>
    </div>
  );
};

export default VoiceAssistant;
