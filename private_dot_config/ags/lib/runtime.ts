import GLib from "gi://GLib?version=2.0"

import { createPoll } from "ags/time"
import { execAsync } from "ags/process"

export const HOME = GLib.get_home_dir()
export const BIN = `${HOME}/.bin`
export const BAR_HEIGHT = 56
export const CENTER_HIDE_DELAY_MS = 320
export const INITIAL_AUTOHIDE_DELAY_MS = 1200
export const WORKSPACE_STRIP_HIDE_DELAY_MS = 300

export function command(name: string, ...args: string[]) {
  return [`${BIN}/${name}`, ...args]
}

export function shell(cmd: string) {
  return ["bash", "-lc", cmd]
}

export function run(cmd: string | string[]) {
  execAsync(cmd).catch((error) => console.error(error))
}

export function trimOutput(out: string) {
  return out.trim()
}

export function parseJson<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T
  } catch {
    return fallback
  }
}

// Most widgets only need trimmed stdout from a command at a fixed interval.
export function createTextPoll(interval: number, cmd: string[]) {
  return createPoll("", interval, cmd, trimOutput)
}
