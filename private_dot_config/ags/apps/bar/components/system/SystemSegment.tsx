import ClockButton from "../clock/ClockButton"
import AudioButton from "./AudioButton"
import BatteryButton from "./BatteryButton"
import BluetoothButton from "./BluetoothButton"
import BrightnessButton from "./BrightnessButton"
import DisplaysButton from "./DisplaysButton"
import NetworkButton from "./NetworkButton"
import PowerButton from "./PowerButton"
import TraySegment from "./TraySegment"
import WarningItems from "./WarningItems"

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
      <BrightnessButton instanceId={instanceId} />
      <DisplaysButton instanceId={instanceId} />
      <AudioButton instanceId={instanceId} />
      <WarningItems />
      <BatteryButton />
      <PowerButton instanceId={instanceId} />
      <ClockButton instanceId={instanceId} />
      <TraySegment />
    </box>
  )
}
