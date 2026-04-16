import AudioButton from "../audio/AudioButton"
import BluetoothButton from "../bluetooth/BluetoothButton"
import ClockButton from "../clock/ClockButton"
import DisplaysButton from "../displays/DisplaysButton"
import NetworkButton from "../network/NetworkButton"
import WarningItems from "../warnings/WarningItems"
import BatteryButton from "./BatteryButton"
import PowerButton from "./PowerButton"
import TraySegment from "./TraySegment"

type SystemSegmentProps = {
  instanceId: string
}

/**
 * Groups the right-hand status widgets for one bar instance.
 */
export default function SystemSegment({ instanceId }: SystemSegmentProps) {
  return (
    <box class="system-segment" spacing={1}>
      <NetworkButton instanceId={instanceId} />
      <BluetoothButton instanceId={instanceId} />
      <DisplaysButton instanceId={instanceId} />
      <AudioButton instanceId={instanceId} />
      <WarningItems instanceId={instanceId} />
      <BatteryButton />
      <PowerButton instanceId={instanceId} />
      <ClockButton instanceId={instanceId} />
      <TraySegment instanceId={instanceId} />
    </box>
  )
}
