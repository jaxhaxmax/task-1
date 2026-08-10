
export type FormatId = "pfp" | "idcard" | "team" | "og";

export type Rarity = "common" | "rare" | "epic" | "legendary";

export type Focal = { x: number; y: number; zoom: number };

export type RenderInput = {
    photos: (ImageBitmap | null)[];
  focals: Focal[];
  name: string;
  role: string;
  team: string;
  memberNames: string[];
  title: string;
  rarity: Rarity;
  serial: string;
};

export type Dyn<T> = T | ((i: RenderInput) => T);

export type Stop = [number, string];

export type PhotoSlot = {
  x: number;
  y: number;
  w: number;
  h: number;
  shape: "circle" | "rect";
    radius?: number;
  ring?: { width: number; colors: string[] };
};

type TextCommon = {
  x: number;
  y: number;
  font: string;
  color: Dyn<string>;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
    maxW?: number;
    minScale?: number;
  letterSpacing?: number;
  upper?: boolean;
  opacity?: number;
  blend?: GlobalCompositeOperation;
};

export type Layer =
  | { kind: "fill"; color: string }
  | {
      kind: "linearGradient";
      x0: number;
      y0: number;
      x1: number;
      y1: number;
      stops: Stop[];
    }
  | {
      kind: "radialGradient";
      cx: number;
      cy: number;
      r0: number;
      r1: number;
      stops: Stop[];
    }
  | {
      kind: "asset";
      src: string;
      x: number;
      y: number;
      w: number;
      h: number;
      fit?: "cover" | "contain";
      opacity?: number;
      blend?: GlobalCompositeOperation;
    }
  | {
      kind: "rect";
      x: number;
      y: number;
      w: number;
      h: number;
      radius?: number;
      fill?: string;
      stroke?: string;
      lineWidth?: number;
      opacity?: number;
    }
  | {
      kind: "gradientRect";
      x: number;
      y: number;
      w: number;
      h: number;
      radius?: number;
      stops: Stop[];
            vertical?: boolean;
    }
  | {
      kind: "dashed";
      x0: number;
      y0: number;
      x1: number;
      y1: number;
      dash: number[];
      color: string;
      width: number;
    }
  | { kind: "notch"; cx: number; cy: number; r: number; color: string }
  | {
      kind: "marquee";
      text: string;
      y: number;
      h: number;
      font: string;
      color: string;
      bg: string;
      letterSpacing?: number;
    }
  | {
      kind: "arcText";
      value: Dyn<string>;
      cx: number;
      cy: number;
      r: number;
      centerAngle: number;
      flip?: boolean;
      font: string;
      color: string;
      letterSpacing?: number;
    }
  | {
      kind: "stamp";
      x: number;
      y: number;
      w: number;
      h: number;
      rotate: number;
      lines: [Dyn<string>, Dyn<string>];
      color: string;
      seed: Dyn<number>;
      fonts: { top: string; bottom: string };
    }
  | { kind: "grain"; opacity: number }
  | ({ kind: "text"; value: Dyn<string> } & TextCommon)
  | {
      kind: "chip";
      value: Dyn<string>;
      x: number;
      y: number;
      h: number;
      font: string;
      color: Dyn<string>;
      bg: Dyn<string>;
      border: Dyn<string>;
      padX: number;
      maxW?: number;
    }
  | {
      kind: "vertText";
      value: Dyn<string>;
      cx: number;
      cy: number;
      font: string;
      color: string;
      letterSpacing?: number;
    }
  | {
      kind: "barcode";
      x: number;
      y: number;
      w: number;
      h: number;
      color: string;
      seed: Dyn<number>;
    }
  | {
      kind: "custom";
      draw: (ctx: CanvasRenderingContext2D, i: RenderInput) => void;
    }
  | { kind: "when"; cond: (i: RenderInput) => boolean; layers: Layer[] };

export type FormatSpec = {
  id: FormatId;
  w: number;
  h: number;
  background: Layer[];
    photoSlots: PhotoSlot[] | ((i: RenderInput) => PhotoSlot[]);
  foreground: Layer[] | ((i: RenderInput) => Layer[]);
};
