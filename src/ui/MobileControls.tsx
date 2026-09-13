/**
 * BloxVerse 3D - MobileControls
 * Virtual joystick, camera swipe zone, and tactile jump/run/interact buttons.
 * Specially designed for fluid performance on Android devices.
 */

import React, { useRef, useState, useEffect } from 'react';
import { InputManager } from '../core/InputManager';
import { ArrowUp, Zap, MessageSquare } from 'lucide-react';

interface MobileControlsProps {
  showInteractPrompt: boolean;
  interactPromptText: string;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  showInteractPrompt,
  interactPromptText,
}) => {
  const input = InputManager.getInstance();

  // Joystick state
  const joystickRef = useRef<HTMLDivElement>(null);
  const [joystickActive, setJoystickActive] = useState(false);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);
  const joystickCenterRef = useRef({ x: 0, y: 0 });

  // Camera swipe zone state
  const cameraZoneRef = useRef<HTMLDivElement>(null);
  const cameraTouchIdRef = useRef<number | null>(null);
  const lastCameraTouchRef = useRef({ x: 0, y: 0 });

  // Run state toggle
  const [isRunning, setIsRunning] = useState(false);

  // Joystick handlers
  const handleJoystickStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (touchIdRef.current !== null) return;

    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;

    if (joystickRef.current) {
      const rect = joystickRef.current.getBoundingClientRect();
      joystickCenterRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }

    setJoystickActive(true);
    handleJoystickMoveTouch(touch.clientX, touch.clientY);
  };

  const handleJoystickMoveTouch = (clientX: number, clientY: number) => {
    const center = joystickCenterRef.current;
    const maxRadius = 46;

    let dx = clientX - center.x;
    let dy = clientY - center.y;
    const dist = Math.hypot(dx, dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setStickPos({ x: dx, y: dy });

    // Output normalized coordinates (-1 to 1)
    // Note: in game coordinates, dragging UP means forward (+moveY)
    const normX = dx / maxRadius;
    const normY = -dy / maxRadius;
    input.setMobileMove(normX, normY);
  };

  const handleJoystickMove = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        handleJoystickMoveTouch(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleJoystickEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setJoystickActive(false);
        setStickPos({ x: 0, y: 0 });
        input.setMobileMove(0, 0);
        break;
      }
    }
  };

  // Camera swipe handlers
  const handleCameraStart = (e: React.TouchEvent) => {
    // Only capture touch if on the right half of the screen
    const touch = e.changedTouches[0];
    if (cameraTouchIdRef.current === null) {
      cameraTouchIdRef.current = touch.identifier;
      lastCameraTouchRef.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleCameraMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === cameraTouchIdRef.current) {
        const dx = touch.clientX - lastCameraTouchRef.current.x;
        const dy = touch.clientY - lastCameraTouchRef.current.y;
        lastCameraTouchRef.current = { x: touch.clientX, y: touch.clientY };

        // Send to InputManager
        input.addMobileCameraDelta(dx, dy);
        break;
      }
    }
  };

  const handleCameraEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === cameraTouchIdRef.current) {
        cameraTouchIdRef.current = null;
        break;
      }
    }
  };

  // Run toggle
  const toggleRun = () => {
    const next = !isRunning;
    setIsRunning(next);
    input.setMobileRun(next);
  };

  return (
    <div id="mobile-controls-root" className="pointer-events-none absolute inset-0 z-20 select-none touch-none overflow-hidden">
      {/* Right Side Camera Look Area (Full right half except UI buttons) */}
      <div
        id="mobile-camera-zone"
        ref={cameraZoneRef}
        className="pointer-events-auto absolute top-16 right-0 bottom-32 w-1/2 touch-none"
        onTouchStart={handleCameraStart}
        onTouchMove={handleCameraMove}
        onTouchEnd={handleCameraEnd}
        onTouchCancel={handleCameraEnd}
      />

      {/* Virtual Joystick (Bottom Left) */}
      <div className="pointer-events-auto absolute bottom-6 left-6 touch-none">
        <div
          id="virtual-joystick-base"
          ref={joystickRef}
          className="relative w-32 h-32 rounded-full bg-slate-900/60 border-2 border-sky-400/40 backdrop-blur-sm flex items-center justify-center shadow-lg"
          onTouchStart={handleJoystickStart}
          onTouchMove={handleJoystickMove}
          onTouchEnd={handleJoystickEnd}
          onTouchCancel={handleJoystickEnd}
        >
          {/* Inner Joystick Thumb */}
          <div
            id="virtual-joystick-thumb"
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-sky-500 to-cyan-300 border-2 border-white/80 shadow-md transform transition-transform duration-75 flex items-center justify-center"
            style={{
              transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
            }}
          >
            <div className="w-4 h-4 rounded-full bg-white/60" />
          </div>
        </div>
      </div>

      {/* Action Buttons (Bottom Right) */}
      <div className="pointer-events-auto absolute bottom-6 right-6 flex flex-col items-end gap-3 touch-none">
        {/* Interact button (appears or pulses when near target) */}
        {showInteractPrompt && (
          <button
            id="btn-mobile-interact"
            className="px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-black text-sm tracking-wide shadow-xl shadow-emerald-500/30 border-2 border-white/80 animate-bounce flex items-center gap-2 active:scale-95 transition-all"
            onTouchStart={(e) => {
              e.preventDefault();
              input.triggerMobileInteract();
            }}
            onClick={() => input.triggerMobileInteract()}
          >
            <MessageSquare className="w-5 h-5" />
            <span>ACCION</span>
          </button>
        )}

        <div className="flex items-center gap-3">
          {/* Run Toggle Button */}
          <button
            id="btn-mobile-run"
            className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold text-xs shadow-lg border-2 active:scale-90 transition-all ${
              isRunning
                ? 'bg-amber-500 text-white border-amber-300 shadow-amber-500/40 ring-4 ring-amber-400/30'
                : 'bg-slate-900/70 text-slate-300 border-white/20'
            }`}
            onTouchStart={(e) => {
              e.preventDefault();
              toggleRun();
            }}
            onClick={toggleRun}
          >
            <Zap className="w-5 h-5" />
            <span>CORRER</span>
          </button>

          {/* Jump Button (Primary & Big) */}
          <button
            id="btn-mobile-jump"
            className="w-18 h-18 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 active:from-sky-400 active:to-blue-500 text-white font-black text-base shadow-xl shadow-sky-500/40 border-3 border-white/80 flex flex-col items-center justify-center active:scale-90 transition-all"
            onTouchStart={(e) => {
              e.preventDefault();
              input.setMobileJump(true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              input.setMobileJump(false);
            }}
            onMouseDown={() => input.setMobileJump(true)}
            onMouseUp={() => input.setMobileJump(false)}
          >
            <ArrowUp className="w-7 h-7 stroke-[3]" />
            <span className="text-[11px] font-black -mt-1 tracking-wider">SALTO</span>
          </button>
        </div>
      </div>
    </div>
  );
};
