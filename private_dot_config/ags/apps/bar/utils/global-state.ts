const globalStateRegistry = new Map<string, unknown>()

/**
 * Returns a lazily created singleton for app-wide shared state.
 *
 * The bar renders multiple windows across monitors and roles, so widgets like
 * the clock or Spotify segment would otherwise duplicate identical timers,
 * subprocesses, and expensive initialization work once per window instance.
 *
 * This registry lets a widget-specific helper expose one long-lived state
 * source for the whole app while keeping widget code simple at the call site.
 *
 * Example:
 * `const clock = getGlobalState("bar-clock-state", createClockState)`
 */
export function getGlobalState<T>(key: string, factory: () => T): T {
  if (!globalStateRegistry.has(key)) {
    globalStateRegistry.set(key, factory())
  }

  return globalStateRegistry.get(key) as T
}
