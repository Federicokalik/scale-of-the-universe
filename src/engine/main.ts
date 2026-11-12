import type { SceneData } from '../lib/types';
import { createMusic } from './audio';
import { bindInput } from './input';
import { createScene, type Scene } from './scene';
import { bindUi } from './ui';

/**
 * Starts the experience inside `root`, which holds the page markup
 * (canvas #stage, card, search, slider, dialog, ...). Returns the scene so the
 * page can drive it, e.g. to open the object named in the address.
 */
export function mountScene(root: HTMLElement, data: SceneData): Scene {
  const find = <T extends Element>(selector: string) => root.querySelector<T>(selector)!;
  const scene = createScene(find<HTMLCanvasElement>('#stage'), data);
  const ui = bindUi(root, scene, data, createMusic());

  bindInput(scene, {
    canvas: find<HTMLCanvasElement>('#stage'),
    slider: find<HTMLInputElement>('#zoom'),
    minus: find<HTMLElement>('#minus'),
    plus: find<HTMLElement>('#plus'),
    onEscape: ui.closeResults,
  });

  // Ids are ASCII slugs, so the hash is used as written (no decoding that could
  // throw on a malformed address). An unknown id is ignored: the page just opens.
  const openFromAddress = () => {
    const id = location.hash.slice(1);
    if (id) scene.selectById(id);
  };
  addEventListener('hashchange', openFromAddress);

  scene.start();
  openFromAddress();
  return scene;
}
