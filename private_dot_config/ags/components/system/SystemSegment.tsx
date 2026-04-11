import AudioButton from "./AudioButton"
import BatteryButton from "./BatteryButton"
import BluetoothButton from "./BluetoothButton"
import BrightnessButton from "./BrightnessButton"
import ClockButton from "./ClockButton"
import NetworkButton from "./NetworkButton"
import PowerButton from "./PowerButton"
import WarningItems from "./WarningItems"

export default function SystemSegment() {
  return (
    <box class="system-segment" spacing={1}>
      <NetworkButton />
      <BluetoothButton />
      <BrightnessButton />
      <AudioButton />
      <WarningItems />
      <BatteryButton />
      <PowerButton />
      <ClockButton />
    </box>
  )
}
