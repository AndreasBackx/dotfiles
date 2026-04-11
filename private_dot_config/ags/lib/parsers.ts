import type { AudioEndpoint, BluetoothDevice, WifiAccessPoint } from "./types"

/** Splits command output into trimmed, non-empty lines. */
function nonEmptyLines(stdout: string) {
  return stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

/**
 * Parses an integer and falls back to zero when stdout is empty or invalid.
 */
function parseIntegerOrZero(value: string) {
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? 0 : parsed
}

/**
 * Splits a `bluetoothctl devices` line on runs of whitespace.
 */
function splitBluetoothLine(line: string) {
  return line.split(/\s+/)
}

/**
 * Parses one `nmcli -t` Wi-Fi row into the app's access-point shape.
 */
function parseWifiAccessPoint(line: string): WifiAccessPoint {
  const [inUse = "", bssid = "", ssid = "", signal = "0", ...securityParts] = line.split(":")

  return {
    inUse: inUse === "*",
    bssid,
    ssid,
    signal: parseIntegerOrZero(signal),
    security: securityParts.join(":"),
  }
}

/**
 * Parses one `bluetoothctl devices` row and marks whether it is connected.
 */
function parseBluetoothDevice(line: string, connected: Set<string>): BluetoothDevice {
  const parts = splitBluetoothLine(line)
  const mac = parts[1] ?? ""

  return {
    mac,
    name: parts.slice(2).join(" "),
    connected: connected.has(mac),
  }
}

/**
 * Detects the next named section header in `wpctl status` output.
 */
function isWpSectionHeading(line: string) {
  return /^[A-Za-z].*:/.test(line.trim())
}

/**
 * Parses one endpoint row from a `wpctl status` section.
 */
function parseWpEndpoint(line: string): AudioEndpoint | null {
  if (!/[0-9]+\./.test(line)) {
    return null
  }

  const active = line.includes("*")
  const idMatch = line.match(/([0-9]+)\./)
  const id = idMatch?.[1] ?? ""
  const name = line
    .replace(/^.*?[0-9]+\.\s*/, "")
    .replace(/\s*\[vol:.*$/, "")
    .trim()

  if (!id || !name) {
    return null
  }

  return { id, name, active }
}

/**
 * Normalizes the focused window title used in the left segment.
 *
 * Example: `sanitizedTitle("   ") // => "Desktop"`
 */
export function sanitizedTitle(title: string) {
  const trimmed = title.trim()
  return trimmed.length > 0 ? trimmed : "Desktop"
}

/**
 * Parses the visible Wi-Fi list returned by `nmcli`.
 *
 * Example: `parseWifiAccessPoints(stdout)`
 */
export function parseWifiAccessPoints(stdout: string) {
  return nonEmptyLines(stdout)
    .map(parseWifiAccessPoint)
    .filter((ap) => ap.ssid)
    .sort((left, right) => right.signal - left.signal)
}

/**
 * Parses known Bluetooth devices and marks the connected subset.
 *
 * Example: `parseBluetoothDevices(allDevices, connectedDevices)`
 */
export function parseBluetoothDevices(allDevices: string, connectedDevices: string) {
  const connected = new Set(nonEmptyLines(connectedDevices).map((line) => splitBluetoothLine(line)[1]).filter(Boolean))

  return nonEmptyLines(allDevices)
    .map((line) => parseBluetoothDevice(line, connected))
    .filter((device) => device.mac && device.name)
}

/**
 * Extracts one named section from `wpctl status` output.
 *
 * Example: `parseWpSection(stdout, "Sinks")`
 */
export function parseWpSection(stdout: string, sectionName: string) {
  const results: AudioEndpoint[] = []
  let inSection = false

  for (const rawLine of stdout.split("\n")) {
    const line = rawLine.trimEnd()

    if (line.includes(`${sectionName}:`)) {
      inSection = true
      continue
    }

    if (inSection && isWpSectionHeading(line)) {
      break
    }

    if (!inSection) {
      continue
    }

    const endpoint = parseWpEndpoint(line)
    if (endpoint) {
      results.push(endpoint)
    }
  }

  return results
}
