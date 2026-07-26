'use client';

import { useState, useRef, useEffect } from 'react';
import { fetchApi } from '@/lib/api';

export default function MemberWorkout() {
  const [exercise, setExercise] = useState('Squat');
  const [weight, setWeight] = useState('80');
  const [reps, setReps] = useState('10');
  const [rir, setRir] = useState('2');
  
  // HUD simulation states
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(180);
  const [voiceCue, setVoiceCue] = useState('Calibrating posture...');
  const [repCount, setRepCount] = useState(0);
  const [postureScore, setPostureScore] = useState(100);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // WebRTC camera startup
  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 320 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraActive(true);
          startSkeletonSimulation();
        }
      }
    } catch (err) {
      console.warn('Camera blocked or unavailable, starting skeleton-only viewport', err);
      setCameraActive(true); // Treat as active for simulation
      startSkeletonSimulation();
    }
  };

  const stopCamera = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setScanning(false);
  };

  // Text-To-Speech browser integration
  const speakCue = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Cancel previous speech to avoid queue buildup
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startSkeletonSimulation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let localRepCount = 0;
    let lastDir = 1; // 1 = going down, -1 = going up

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Squat simulation calculations: oscillate knee/hip coordinates
      // Oscillation wave mimics squatting down to 80 degrees and rising to 180 degrees
      frame += 0.03;
      const progress = (Math.sin(frame) + 1) / 2; // 0 to 1
      const angle = Math.round(180 - progress * 100); // 180 (standing) down to 80 (bottom squat)
      setCurrentAngle(angle);

      // Check Direction for Rep Counting
      const currentDir = Math.cos(frame) > 0 ? 1 : -1;
      if (currentDir === -1 && lastDir === 1) {
        // Bottom squat reached
        if (angle > 90) {
          // Failure cue
          const cue = 'Go deeper! Squat below parallel.';
          setVoiceCue(cue);
          speakCue('Go deeper');
          setPostureScore((prev) => Math.max(prev - 5, 60));
        } else {
          // Success cue
          const cue = 'Good depth. Keep chest elevated.';
          setVoiceCue(cue);
          speakCue('Good depth');
        }
      } else if (currentDir === 1 && lastDir === -1) {
        // Standing rep completed
        localRepCount += 1;
        setRepCount(localRepCount);
        speakCue(`Rep ${localRepCount}`);
      }
      lastDir = currentDir;

      // Draw mock skeleton landmark coordinates based on calculated angle
      const shoulderX = 160;
      const shoulderY = 80 + progress * 20;

      const hipX = 160 - progress * 15;
      const hipY = 160 + progress * 50;

      const kneeX = 200 + progress * 25;
      const kneeY = 220 + progress * 20;

      const ankleX = 200;
      const ankleY = 280;

      // Draw skeleton lines
      ctx.strokeStyle = '#10b981'; // Emerald color
      ctx.lineWidth = 3;

      // Shoulder to Hip
      ctx.beginPath();
      ctx.moveTo(shoulderX, shoulderY);
      ctx.lineTo(hipX, hipY);
      ctx.stroke();

      // Hip to Knee
      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(kneeX, kneeY);
      ctx.stroke();

      // Knee to Ankle
      ctx.beginPath();
      ctx.moveTo(kneeX, kneeY);
      ctx.lineTo(ankleX, ankleY);
      ctx.stroke();

      // Draw Landmark Dots
      ctx.fillStyle = '#22d3ee'; // Cyan color
      const dots = [
        { x: shoulderX, y: shoulderY, label: 'Shoulder' },
        { x: hipX, y: hipY, label: 'Hip' },
        { x: kneeX, y: kneeY, label: 'Knee' },
        { x: ankleX, y: ankleY, label: 'Ankle' },
      ];

      dots.forEach((dot) => {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 6, 0, Math.PI * 2);
        ctx.fill();

        // Label offset text
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 8px sans-serif';
        ctx.fillText(dot.label, dot.x + 10, dot.y + 3);
        ctx.fillStyle = '#22d3ee';
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleStartSet = () => {
    setScanning(true);
    setRepCount(0);
    setPostureScore(100);
    setVoiceCue('Starting Form Check. Squat when ready.');
    speakCue('Starting Form check. Squat when ready');
    startCamera();
  };

  const handleStopSet = async () => {
    stopCamera();
    
    // Save Log to backend
    try {
      await fetchApi('member/workout', {
        method: 'POST',
        body: JSON.stringify({
          date: new Date(),
          durationMinutes: 3,
          notes: `Simulated form session. Core Stability score: ${postureScore}%`,
          sets: [
            {
              exerciseName: exercise,
              setNumber: 1,
              weight: parseFloat(weight),
              reps: repCount > 0 ? repCount : parseInt(reps),
              rir: parseInt(rir),
              postureScore: postureScore,
              feedbackSummary: `Completed ${repCount} reps with ${postureScore}% posture alignment rating. Cues resolved: depth validation.`,
            },
          ],
        }),
      });
      alert('Workout set logged successfully to dashboard database!');
    } catch (err) {
      console.error(err);
      alert('Failed to save set to DB logs.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center pb-2 border-b border-slate-850">
        <h4 className="font-extrabold text-sm text-slate-200">Form HUD Coach</h4>
        <span className="text-[10px] font-bold text-slate-500 uppercase">MoveNet MultiPose</span>
      </div>

      {cameraActive ? (
        /* Camera overlay viewports */
        <div className="relative w-full aspect-square bg-black border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center">
          {videoRef.current?.srcObject ? (
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-60 z-0"
              muted
              playsInline
            />
          ) : (
            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-slate-700">
              <span className="text-4xl mb-2">📷</span>
              <p className="text-[10px] tracking-widest font-bold">LIVE WEBCAM PREVIEW</p>
            </div>
          )}

          {/* Skeleton drawing layer */}
          <canvas
            ref={canvasRef}
            width={320}
            height={320}
            className="absolute inset-0 w-full h-full z-10 pointer-events-none scale-x-[-1]"
          />

          {/* Live HUD statistics */}
          <div className="absolute bottom-4 left-4 right-4 z-20 bg-slate-950/80 border border-slate-850 p-3 rounded-2xl space-y-2 backdrop-blur-sm">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-slate-400">Joint Knee Angle:</span>
              <span className={`font-mono text-xs ${currentAngle < 100 ? 'text-emerald-400' : 'text-slate-200'}`}>
                {currentAngle}°
              </span>
            </div>
            
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-slate-400">Audio Cues:</span>
              <span className="text-cyan-400 animate-pulse text-[9px] uppercase font-bold max-w-[70%] text-right truncate">
                {voiceCue}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-850/60 text-center">
              <div>
                <p className="text-[8px] text-slate-500 font-bold uppercase">Rep Count</p>
                <p className="font-black text-emerald-400 text-sm">{repCount}</p>
              </div>
              <div>
                <p className="text-[8px] text-slate-500 font-bold uppercase">Form Rating</p>
                <p className="font-black text-cyan-400 text-sm">{postureScore}%</p>
              </div>
            </div>
          </div>

          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={handleStopSet}
              className="bg-red-500 hover:bg-red-400 text-slate-950 font-black px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wider transition cursor-pointer"
            >
              Stop & Save Set
            </button>
          </div>
        </div>
      ) : (
        /* Parameters setup */
        <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl space-y-4">
          <div>
            <label className="block text-[9px] uppercase font-black tracking-widest text-slate-400 mb-1.5">Exercise Type</label>
            <select
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-xl px-3.5 py-3 text-xs text-slate-300 focus:outline-none"
            >
              <option value="Squat">Squat Form Check</option>
              <option value="Deadlift">Deadlift Form Check</option>
              <option value="Bench Press">Bench Press Alignment</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[9px] uppercase font-black tracking-widest text-slate-400 mb-1.5">Weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-center text-slate-200"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase font-black tracking-widest text-slate-400 mb-1.5">Reps</label>
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-center text-slate-200"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase font-black tracking-widest text-slate-400 mb-1.5">RIR Goal</label>
              <input
                type="number"
                value={rir}
                onChange={(e) => setRir(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-center text-slate-200"
              />
            </div>
          </div>

          <button
            onClick={handleStartSet}
            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black py-4 px-4 rounded-xl text-xs uppercase tracking-widest transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
          >
            <span>🎥</span> Open HUD Camera
          </button>
        </div>
      )}

      {/* Static Logs List */}
      <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl space-y-3">
        <h4 className="font-extrabold text-xs text-slate-200 border-b border-slate-850/60 pb-2">Exercise target zones</h4>
        <div className="space-y-2 text-[10px] text-slate-400">
          <div className="flex justify-between py-1 border-b border-slate-850/30">
            <span>Bottom depth parallel hip angle</span>
            <span className="text-cyan-400 font-bold">&lt; 75°</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-850/30">
            <span>Flexion bottom knee angle</span>
            <span className="text-cyan-400 font-bold">80° - 110°</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Allowable lumbar spinal deviation</span>
            <span className="text-cyan-400 font-bold">&lt; 20°</span>
          </div>
        </div>
      </div>

    </div>
  );
}
