import GLib from "gi://GLib?version=2.0"

import { createPoll } from "ags/time"
import { execAsync } from "ags/process"

export const HOME = GLib.get_home_dir()
export const BIN = `${HOME}/.bin`
export const BAR_HEIGHT = 56
export const CENTER_HIDE_DELAY_MS = 320
export const INITIAL_AUTOHIDE_DELAY_MS = 1200
export const WORKSPACE_STRIP_HIDE_DELAY_MS = 300

/**
 * Builds an absolute command path inside `~/.bin`.
 *
 * Example: `command("eww-network", "tooltip")`
 */
export function command(name: string, ...args: string[]) {
  return [`${BIN}/${name}`, ...args]
}

/**
 * Wraps a shell fragment for `execAsync`.
 *
 * Example: `shell("nmcli general status")`
 */
export function shell(cmd: string) {
  return ["bash", "-lc", cmd]
}

/**
 * Fire-and-forget command execution for click handlers and async side effects.
 *
 * Example: `run(command("eww-audio", "toggle-mute"))`
 */
export function run(cmd: string | string[]) {
  execAsync(cmd).catch((error) => console.error(error))
}

/**
 * Trims command output before it is bound into a label or tooltip.
 *
 * Example: `trimOutput("hello\n") // => "hello"`
 */
export function trimOutput(out: string) {
  return out.trim()
}

/**
 * Parses JSON and falls back to the previous value when the payload is invalid.
 *
 * Example: `parseJson("{\"ok\":true}", { ok: false })`
 */
export function parseJson<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T
  } catch {
    return fallback
  }
}

/**
 * Creates a polling binding whose value is the trimmed stdout of a command.
 *
 * Example: `createTextPoll(3000, command("eww-network", "tooltip"))`
 */
export function createTextPoll(interval: number, cmd: string[]) {
  return createPoll("", interval, cmd, trimOutput)
}

/**
 * Creates a named set of text polls for helper scripts that expose multiple
 * subcommands like `icon`, `text`, `tooltip`, and `state`.
 *
 * Example:
 * `createCommandTextPolls(3000, "eww-network", ["icon", "tooltip", "state"] as const)`
 */
export function createCommandTextPolls<const T extends readonly string[]>(
  interval: number,
  name: string,
  fields: T,
): Record<T[number], ReturnType<typeof createTextPoll>> {
  return Object.fromEntries(fields.map((field) => [field, createTextPoll(interval, command(name, field))])) as Record<
    T[number],
    ReturnType<typeof createTextPoll>
  >
}
