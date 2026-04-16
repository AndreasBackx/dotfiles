import GLib from "gi://GLib?version=2.0"

let showCenterSequence = 0
let showCenterStartedAtUs = 0

function monotonicMs() {
  return Math.round(GLib.get_monotonic_time() / 1000)
}

function elapsedSince(startedAtUs: number) {
  if (startedAtUs <= 0) {
    return null
  }

  return Math.round((GLib.get_monotonic_time() - startedAtUs) / 1000)
}

function logPerf(message: string, details?: string) {
  const suffix = details ? ` ${details}` : ""
  console.log(`[bar-perf] ${message}${suffix}`)
}

export function markShowCenterRequest() {
  showCenterSequence += 1
  showCenterStartedAtUs = GLib.get_monotonic_time()
  logPerf("show-center request start", `seq=${showCenterSequence} t=${monotonicMs()}ms`)
  return showCenterSequence
}

export function showCenterContext() {
  return {
    seq: showCenterSequence,
    startedAtUs: showCenterStartedAtUs,
    elapsedMs: elapsedSince(showCenterStartedAtUs),
  }
}

export function logShowCenterStage(stage: string, details?: string) {
  const context = showCenterContext()
  const elapsed = context.elapsedMs == null ? "elapsed=unknown" : `elapsed=${context.elapsedMs}ms`
  const suffix = details ? ` ${details}` : ""
  logPerf(stage, `seq=${context.seq} ${elapsed}${suffix}`)
}

export function createPerfSpan(label: string) {
  const startedAtUs = GLib.get_monotonic_time()
  return (details?: string) => {
    const elapsedMs = Math.round((GLib.get_monotonic_time() - startedAtUs) / 1000)
    const suffix = details ? ` ${details}` : ""
    logPerf(label, `elapsed=${elapsedMs}ms${suffix}`)
  }
}
