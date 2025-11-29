'use client';

import { Canvas} from '@react-three/fiber';
import { View as DreiView, Preload } from '@react-three/drei';
import { ReactNode, useRef, forwardRef, useImperativeHandle, MutableRefObject } from 'react';

interface ViewProps {
  children: ReactNode;
  className?: string;
}

// ViewCanvas - A component that renders 3D content inside a DOM element
// This allows for portal-like 3D views that track their DOM container
const ViewCanvas = forwardRef<HTMLDivElement, ViewProps>(({ children, className }, ref) => {
  const localRef = useRef<HTMLDivElement>(null);
  
  useImperativeHandle(ref, () => localRef.current!, []);
  
  return (
    <div ref={localRef} className={className}>
      <DreiView track={localRef as MutableRefObject<HTMLElement>}>
        {children}
      </DreiView>
    </div>
  );
});

ViewCanvas.displayName = 'ViewCanvas';

export default ViewCanvas;

// Common canvas container for multiple View portals
export function ViewCanvasContainer({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Canvas
        className="!fixed !inset-0 !w-full !h-full pointer-events-none"
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}
        eventSource={document.body}
        eventPrefix="client"
      >
        <DreiView.Port />
        <Preload all />
      </Canvas>
    </>
  );
}
