import { useRef, useState, useCallback } from 'react';

interface InteractiveImageProps {
  src: string;
  alt?: string;
  className?: string;
}

interface Selection {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export function InteractiveImage({ src, alt, className }: InteractiveImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const getRelativeCoordinates = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const pos = getRelativeCoordinates(e);
    setStartPos(pos);
    setIsDragging(true);
    setSelection({
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      scale: 1
    });
  }, [getRelativeCoordinates]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selection) return;

    const pos = getRelativeCoordinates(e);
    setSelection({
      ...selection,
      width: pos.x - startPos.x,
      height: pos.y - startPos.y,
      scale: 1
    });
  }, [isDragging, selection, startPos, getRelativeCoordinates]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!selection) return;

    e.preventDefault();
    const scaleDelta = e.deltaY > 0 ? 0.9 : 1.1;
    setSelection({
      ...selection,
      scale: Math.max(0.5, Math.min(2, selection.scale * scaleDelta))
    });
  }, [selection]);

  return (
    <div 
      ref={containerRef}
      className={`relative ${className || ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <img
        src={src}
        alt={alt || "Interactive image"}
        className="w-full h-full object-contain"
      />
      {selection && (
        <div
          className="absolute border-2 border-blue-500 bg-blue-500/20 cursor-move"
          style={{
            left: Math.min(startPos.x, startPos.x + selection.width),
            top: Math.min(startPos.y, startPos.y + selection.height),
            width: Math.abs(selection.width),
            height: Math.abs(selection.height),
            transform: `scale(${selection.scale})`,
            transformOrigin: 'center'
          }}
        />
      )}
    </div>
  );
}
