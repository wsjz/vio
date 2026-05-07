// src/hooks/useThumbnail.ts

import { useState, useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';

export function useThumbnail(containerId: string) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const generatingRef = useRef(false);

  const generate = useCallback(async () => {
    if (generatingRef.current) return;
    generatingRef.current = true;

    try {
      const element = document.querySelector(`[data-container-id="${containerId}"]`);
      if (!element) return;

      // Check if content is canvas/webgl-heavy
      const hasCanvas = element.querySelector('canvas') !== null;
      if (hasCanvas) {
        setThumbnail(null);
        return;
      }

      const canvas = await html2canvas(element as HTMLElement, {
        scale: 0.3,
        logging: false,
        backgroundColor: null,
        useCORS: true,
      });

      setThumbnail(canvas.toDataURL('image/png'));
    } catch {
      setThumbnail(null);
    } finally {
      generatingRef.current = false;
    }
  }, [containerId]);

  const clear = useCallback(() => {
    setThumbnail(null);
  }, []);

  return { thumbnail, generate, clear };
}
