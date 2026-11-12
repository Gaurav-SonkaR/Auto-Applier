/**
 * Compatibility entry point for older imports such as `from '../types'`.
 * Keep the canonical definitions in `src/types/`; having two independent
 * copies caused the UI and API modules to disagree about the model shape.
 */
export * from './types/index'
