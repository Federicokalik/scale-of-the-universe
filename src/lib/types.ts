export type Kind = 'u' | 'd' | 'w' | 'q' | 'a' | 'm' | 'b' | 'o' | 'g' | 'p' | 's' | 'h' | 'n' | 'x' | 'c';
export type Flag = 'r' | 'n' | 'i' | 'u';

export const KINDS: readonly Kind[] = ['u', 'd', 'w', 'q', 'a', 'm', 'b', 'o', 'g', 'p', 's', 'h', 'n', 'x', 'c'];
export const FLAGS: readonly Flag[] = ['r', 'n', 'i', 'u'];

export interface Source {
  title: string;
  url: string;
}

export interface ObjectRecord {
  id: string;
  /** Diameter or largest extent, in metres. */
  size: number;
  kind: Kind;
  /** Draft's fourth field: a #hex colour, an emoji, or a sprite code (0-4, E, I). */
  glyph: string;
  flags: Flag[];
  image: string | null;
  sources: Source[];
  /** ISO date of the last check against the sources. */
  verified: string | null;
}

export interface LocaleFile {
  ui: Record<string, string>;
  objects: Record<string, { name: string; desc: string }>;
}

export interface SceneObject extends ObjectRecord {
  name: string;
  desc: string;
}

export interface SceneData {
  locale: string;
  ui: Record<string, string>;
  objects: SceneObject[];
}
