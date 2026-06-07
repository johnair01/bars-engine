import { useCallback, useRef } from "react";
import {
  DEFAULT_CROP,
  ZONE_IMAGE_H,
  clampCrop,
  type Crop,
} from "./cardLayout";

type ImageBandProps = {
  src?: string | null;
  crop: Crop;
  interactive?: boolean;
  onCropChange?: (crop: Crop) => void;
  placeholder?: React.ReactNode;
};

export function ImageBand({
  src,
  crop,
  interactive = false,
  onCropChange,
  placeholder,
}: ImageBandProps) {
  const dragRef = useRef<{ x: number; y: number; crop: Crop } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!interactive || !onCropChange || !src) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = { x: e.clientX, y: e.clientY, crop: { ...crop } };
    },
    [interactive, onCropChange, src, crop]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current || !onCropChange) return;
      const dx = e.clientX - dragRef.current.x;
      const dy = e.clientY - dragRef.current.y;
      // ~0.15% position shift per pixel of drag (tuned for 300px band width)
      const next = clampCrop({
        x: dragRef.current.crop.x - dx * 0.15,
        y: dragRef.current.crop.y - dy * 0.15,
        zoom: dragRef.current.crop.zoom,
      });
      onCropChange(next);
    },
    [onCropChange]
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  }, []);

  return (
    <div
      style={{
        height: ZONE_IMAGE_H,
        flexShrink: 0,
        overflow: "hidden",
        position: "relative",
        background: "#111",
        touchAction: interactive ? "none" : "auto",
        cursor: interactive && src ? "grab" : "default",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {src ? (
        <img
          src={src}
          alt=""
          draggable={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: `${crop.x}% ${crop.y}%`,
            transform: `scale(${crop.zoom})`,
            transformOrigin: `${crop.x}% ${crop.y}%`,
            userSelect: "none",
            pointerEvents: "none",
          }}
        />
      ) : (
        placeholder ?? null
      )}
      {interactive && src && (
        <div
          style={{
            position: "absolute",
            bottom: 6,
            left: 0,
            right: 0,
            textAlign: "center",
            color: "#C9A84C",
            fontFamily: "Georgia, serif",
            fontSize: "0.6rem",
            opacity: 0.75,
            pointerEvents: "none",
          }}
        >
          Drag to reposition
        </div>
      )}
    </div>
  );
}

export { DEFAULT_CROP };
