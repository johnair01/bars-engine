/**
 * Inner Garden — data-driven world representation.
 *
 * The buildable core of the mobile pixel-farm: a farm is a pure projection of OS state
 * plus a sparse player-edit overlay (the No Man's Sky model), rendered by a thin,
 * swappable layer that holds no truth.
 *
 * Design doc: docs/handoffs/2026-07-12-inner-garden-world-representation.md
 */
export * from './scene'
export * from './project'
export * from './visuals'
export { fnv32 } from './hash'
