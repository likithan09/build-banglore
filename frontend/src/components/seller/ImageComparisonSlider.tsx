import React, { useState, useRef, useCallback } from 'react';
import { Sliders, Sparkles, Image as ImageIcon } from 'lucide-react';

interface ImageComparisonSliderProps {
  originalSrc: string;
  enhancedSrc: string;
  className?: string;
  aspectRatio?: string;
}

export const ImageComparisonSlider: React.FC<ImageComparisonSliderProps> = ({
  originalSrc,
  enhancedSrc,
  className = '',
  aspectRatio = 'aspect-square'
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isDragging && e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  }, [isDragging, handleMove]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  }, [isDragging, handleMove]);

  return (
    <div className={`relative select-none ${className}`}>
      {/* Slider viewport */}
      <div
        ref={containerRef}
        className={`relative w-full ${aspectRatio} max-h-[380px] rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-100 cursor-ew-resize`}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onTouchStart={() => setIsDragging(true)}
        onTouchEnd={() => setIsDragging(false)}
        onTouchMove={handleTouchMove}
      >
        {/* Right Image (Enhanced Branded Image - Full width base layer) */}
        <img
          src={enhancedSrc}
          alt="Enhanced product"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />

        {/* Left Image (Original Unedited Photo - Clipped via width) */}
        <div
          className="absolute inset-y-0 left-0 overflow-hidden pointer-events-none"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={originalSrc}
            alt="Original product"
            className="absolute inset-0 w-full h-full object-contain max-w-none"
            style={{
              width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
              height: containerRef.current ? `${containerRef.current.clientHeight}px` : '100%'
            }}
          />
        </div>

        {/* Vertical Divider Line */}
        <div
          className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)] z-20 pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* Circular Drag Handle */}
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-lg border-2 border-amber-600 flex items-center justify-center text-amber-800 text-xs font-bold pointer-events-auto cursor-ew-resize">
            <span className="text-[10px] tracking-tighter font-mono font-black">◀▶</span>
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 z-30 pointer-events-none">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-sm flex items-center gap-1 shadow">
            <ImageIcon className="w-3 h-3 text-slate-300" />
            <span>Before (Original)</span>
          </span>
        </div>

        <div className="absolute top-3 right-3 z-30 pointer-events-none">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-700/80 text-white backdrop-blur-sm flex items-center gap-1 shadow">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>After (KALASETU Branded)</span>
          </span>
        </div>
      </div>

      {/* Range slider input for keyboard/assistive accessibility */}
      <div className="mt-2.5 flex items-center justify-between gap-3 text-xs text-slate-500">
        <span className="text-[11px] font-medium text-slate-600">Original (0%)</span>
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPosition}
          onChange={(e) => setSliderPosition(Number(e.target.value))}
          aria-label="Before and after comparison slider"
          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
        />
        <span className="text-[11px] font-medium text-amber-700 font-bold">Enhanced (100%)</span>
      </div>
    </div>
  );
};
