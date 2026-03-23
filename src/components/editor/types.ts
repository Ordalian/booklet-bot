export interface EditorElement {
  id: string;
  type: "text" | "image" | "rect" | "circle" | "line";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  // Text
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  textAlign?: string;
  // Appearance
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  cornerRadius?: number;
  // Text background
  textBgEnabled?: boolean;
  textBgColor?: string;
  textBgPadding?: number;
  textBgRadius?: number;
  // Image
  src?: string;
  // Line
  points?: number[];
  // Layer
  locked?: boolean;
  visible?: boolean;
  name?: string;
  // Grouping (for event tiles)
  groupId?: string;
}

export interface BrandConfig {
  colors: string[];
  logoUrl: string;
  additionalAssets: string[];
}

export interface EditorState {
  elements: EditorElement[];
  selectedId: string | null;
  brandConfig: BrandConfig;
}

export const DEFAULT_BRAND: BrandConfig = {
  colors: ["#E85D04", "#0077B6", "#2D6A4F", "#FFFFFF", "#1A1A2E"],
  logoUrl: "",
  additionalAssets: [],
};

export const A4_WIDTH = 794;
export const A4_HEIGHT = 1123;
export const CANVAS_SCALE = 0.55; // Scale for display

export function createId(): string {
  return Math.random().toString(36).slice(2, 10);
}
