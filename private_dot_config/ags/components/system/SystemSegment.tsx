import AudioButton from "./AudioButton"
import BatteryButton from "./BatteryButton"
import BluetoothButton from "./BluetoothButton"
import BrightnessButton from "./BrightnessButton"
import ClockButton from "./ClockButton"
import NetworkButton from "./NetworkButton"
import PowerButton from "./PowerButton"
import WarningItems from "./WarningItems"

type SystemSegmentProps = {
  instanceId: string
}

export default function SystemSegment({ instanceId }: SystemSegmentProps) {
  return (
    <box class="system-segment" spacing={1}>
      <NetworkButton instanceId={instanceId} />
      <BluetoothButton instanceId={instanceId} />
      <BrightnessButton instanceId={instanceId} />
      <AudioButton instanceId={instanceId} />
      <WarningItems />
      <BatteryButton />
      <PowerButton instanceId={instanceId} />
      <ClockButton instanceId={instanceId} />
    </box>
  )
}
