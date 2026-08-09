import type { Focal } from "../types";
import { clamp } from "./crop";

export async function detectFocal(bmp: ImageBitmap): Promise<Focal | null> {
  if (typeof window === "undefined" || !("FaceDetector" in window)) return null;

  try {
    const Ctor = (window as unknown as {
      FaceDetector: new (o: { maxDetectedFaces: number; fastMode: boolean }) => {
        detect: (s: ImageBitmap) => Promise<
          { boundingBox: { x: number; y: number; width: number; height: number } }[]
        >;
      };
    }).FaceDetector;

    const faces = await new Ctor({ maxDetectedFaces: 6, fastMode: true }).detect(bmp);
    if (!faces.length) return null;

    const avg = (n: number[]) => n.reduce((a, b) => a + b, 0) / n.length;
    const cx = avg(faces.map((f) => f.boundingBox.x + f.boundingBox.width / 2)) / bmp.width;
    const cy = avg(faces.map((f) => f.boundingBox.y + f.boundingBox.height / 2)) / bmp.height;

    return { x: clamp(cx, 0.15, 0.85), y: clamp(cy, 0.15, 0.85), zoom: 1 };
  } catch {
    return null;
  }
}
