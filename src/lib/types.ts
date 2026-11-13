export type Kind = 'u' | 'd' | 'w' | 'q' | 'a' | 'm' | 'b' | 'o' | 'g' | 'p' | 's' | 'h' | 'n' | 'x' | 'c';
export type Flag = 'r' | 'n' | 'i' | 'u';

export const KINDS: readonly Kind[] = ['u', 'd', 'w', 'q', 'a', 'm', 'b', 'o', 'g', 'p', 's', 'h', 'n', 'x', 'c'];
export const FLAGS: readonly Flag[] = ['r', 'n', 'i', 'u'];

export interface Source {
  title: string;
  url: string;
  /** Who published it, e.g. NASA/JPL. Shown next to the link. */
  publisher?: string;
}

/** How a photograph is drawn on the canvas: cut to a disc, glowing on black, or in a rounded frame. */
export type ImageShape = 'disc' | 'glow' | 'frame';

/** Who made an image and under which licence it is used. */
export interface Credit {
  title: string;
  author: string;
  licence: string;
  licenceUrl: string;
  /** Page that hosts the file and states its licence. */
  page: string;
}

export interface ObjectRecord {
  id: string;
  /** Diameter or largest extent, in metres. */
  size: number;
  kind: Kind;
  /** Draft's fourth field: a #hex colour, an emoji, or a sprite code (0-4, E, I). */
  glyph: string;
  flags: Flag[];
  /** Base name of the files in public/img (<image>-256.webp and <image>-800.webp), or null. */
  image: string | null;
  imageShape?: ImageShape;
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
  credit?: Credit;
}

export interface SceneData {
  locale: string;
  ui: Record<string, string>;
  objects: SceneObject[];
}
