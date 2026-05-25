import { ZONE_IMAGE_H, type Crop } from "@/lib/oracle/cardLayout";

type ImageBandProps = {
  src?: string | null;
  crop: Crop;
  placeholder?: React.ReactNode;
};

export function ImageBand({ src, crop, placeholder }: ImageBandProps) {
  return (
    <div
      style={{
        height: ZONE_IMAGE_H,
        flexShrink: 0,
        overflow: "hidden",
        position: "relative",
        background: "#111",
      }}
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
    </div>
  );
}
