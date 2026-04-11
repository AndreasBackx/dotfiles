export type StateAccessor<T> = {
  (): T
  <R>(map: (value: T) => R): R
  get(): T
}

export type Role = "left" | "center" | "right" | "laptop"

export type HyprMonitor = {
  connector: string
  description: string
  serial: string
  activeWorkspaceId: number
}

export type HyprState = {
  activeWorkspaceId: number
  visibleWorkspaceIds: number[]
  populatedWorkspaceIds: number[]
  monitors: HyprMonitor[]
  windowTitle: string
}

export type WifiAccessPoint = {
  inUse: boolean
  bssid: string
  ssid: string
  signal: number
  security: string
}

export type BluetoothDevice = {
  mac: string
  name: string
  connected: boolean
}

export type AudioEndpoint = {
  id: string
  name: string
  active: boolean
}

export type HyprStateAccessor = StateAccessor<HyprState>
export type BooleanAccessor = StateAccessor<boolean>
