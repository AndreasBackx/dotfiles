import AudioButton from "../audio/AudioButton"
import BluetoothButton from "../bluetooth/BluetoothButton"
import BatteryButton from "../battery/BatteryButton"
import ClockButton from "../clock/ClockButton"
import DisplaysButton from "../displays/DisplaysButton"
import NetworkButton from "../network/NetworkButton"
import PowerButton from "../power/PowerButton"
import TraySegment from "../tray/TraySegment"
import WarningItems from "../warnings/WarningItems"
import type { StateAccessor } from "../../../../common/utils/state"
import type { MonitorIdentity } from "../../utils/types"

type SystemSegmentProps = {
  instanceId: string
  monitor: StateAccessor<MonitorIdentity>
}

/**
 * Groups the right-hand status widgets for one bar instance.
 */
export default function SystemSegment({ instanceId, monitor }: SystemSegmentProps) {
  return (
    <box class="system-segment" spacing={1}>
      <NetworkButton instanceId={instanceId} />
      <BluetoothButton instanceId={instanceId} />
      <DisplaysButton instanceId={instanceId} monitor={monitor} />
      <AudioButton instanceId={instanceId} />
      <WarningItems instanceId={instanceId} />
      <BatteryButton instanceId={instanceId} />
      <PowerButton instanceId={instanceId} />
      <ClockButton instanceId={instanceId} />
      <TraySegment instanceId={instanceId} />
    </box>
  )
}
