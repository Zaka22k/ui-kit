/**
 * Marks a node portaled into `document.body` that must stay reachable while a modal dialog is open
 * (toasts, for example). Modal makes every other body child `inert`.
 * Помечает узел, вынесенный порталом в `document.body`, который должен оставаться доступным при открытом
 * модальном окне (например, тосты). Modal делает `inert` все остальные дочерние узлы `body`.
 */
export const TOP_LAYER_ATTR = "data-uikit-top-layer";
