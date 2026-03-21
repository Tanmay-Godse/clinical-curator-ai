import type {
  Calibration,
  CalibrationMode,
  OverlayTarget,
  Point,
} from "@/lib/types";

export const GUIDE_FRAME = {
  left: 0.18,
  top: 0.14,
  width: 0.64,
  height: 0.72,
} as const;

export function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function createDefaultCalibration(): Calibration {
  return {
    tl: { x: 0.18, y: 0.2 },
    tr: { x: 0.82, y: 0.2 },
    br: { x: 0.82, y: 0.8 },
    bl: { x: 0.18, y: 0.8 },
  };
}

export function mapPoint(
  u: number,
  v: number,
  tl: Point,
  tr: Point,
  br: Point,
  bl: Point,
): Point {
  return {
    x:
      (1 - u) * (1 - v) * tl.x +
      u * (1 - v) * tr.x +
      u * v * br.x +
      (1 - u) * v * bl.x,
    y:
      (1 - u) * (1 - v) * tl.y +
      u * (1 - v) * tr.y +
      u * v * br.y +
      (1 - u) * v * bl.y,
  };
}

export function getGuideRect(width: number, height: number) {
  return {
    left: GUIDE_FRAME.left * width,
    top: GUIDE_FRAME.top * height,
    width: GUIDE_FRAME.width * width,
    height: GUIDE_FRAME.height * height,
  };
}

function calibrationToPixels(
  calibration: Calibration,
  width: number,
  height: number,
): Calibration {
  return {
    tl: { x: calibration.tl.x * width, y: calibration.tl.y * height },
    tr: { x: calibration.tr.x * width, y: calibration.tr.y * height },
    br: { x: calibration.br.x * width, y: calibration.br.y * height },
    bl: { x: calibration.bl.x * width, y: calibration.bl.y * height },
  };
}

export function projectOverlayTarget(
  target: OverlayTarget,
  calibration: Calibration,
  width: number,
  height: number,
  mode: CalibrationMode,
): Point {
  if (mode === "guide") {
    const guideRect = getGuideRect(width, height);

    return {
      x: guideRect.left + target.u * guideRect.width,
      y: guideRect.top + target.v * guideRect.height,
    };
  }

  const scaledCalibration = calibrationToPixels(calibration, width, height);

  return mapPoint(
    target.u,
    target.v,
    scaledCalibration.tl,
    scaledCalibration.tr,
    scaledCalibration.br,
    scaledCalibration.bl,
  );
}
