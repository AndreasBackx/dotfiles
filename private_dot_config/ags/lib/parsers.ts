import type { AudioEndpoint, BluetoothDevice, WifiAccessPoint } from "./types"

function nonEmptyLines(stdout: string) {
  return stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

export function sanitizedTitle(title: string) {
  const trimmed = title.trim()
  return trimmed.length > 0 ? trimmed : "Desktop"
}

export function parseWifiAccessPoints(stdout: string) {
  return nonEmptyLines(stdout)
    .map((line) => {
      const [inUse = "", bssid = "", ssid = "", signal = "0", ...securityParts] = line.split(":")
      return {
        inUse: inUse === "*",
        bssid,
        ssid,
        signal: Number.parseInt(signal, 10),
        security: securityParts.join(":"),
      } satisfies WifiAccessPoint
    })
    .filter((ap) => ap.ssid)
    .sort((left, right) => right.signal - left.signal)
}

export function parseBluetoothDevices(allDevices: string, connectedDevices: string) {
  const connected = new Set(nonEmptyLines(connectedDevices).map((line) => line.split(/\s+/)[1]))

  return nonEmptyLines(allDevices)
    .map((line) => {
      const parts = line.split(/\s+/)
      const mac = parts[1] ?? ""
      return {
        mac,
        name: parts.slice(2).join(" "),
        connected: connected.has(mac),
      } satisfies BluetoothDevice
    })
    .filter((device) => device.mac && device.name)
}

export function parseWpSection(stdout: string, sectionName: string) {
  const lines = stdout.split("\n")
  const results: AudioEndpoint[] = []
  let inSection = false

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()

    if (line.includes(`${sectionName}:`)) {
      inSection = true
      continue
    }

    if (inSection && /^[A-Za-z].*:/.test(line.trim())) {
      break
    }

    if (!inSection || !/[0-9]+\./.test(line)) {
      continue
    }

    const active = line.includes("*")
    const idMatch = line.match(/([0-9]+)\./)
    const id = idMatch?.[1] ?? ""
    const name = line
      .replace(/^.*?[0-9]+\.\s*/, "")
      .replace(/\s*\[vol:.*$/, "")
      .trim()

    if (id && name) {
      results.push({ id, name, active })
    }
  }

  return results
}
