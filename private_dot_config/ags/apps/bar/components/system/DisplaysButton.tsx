import GLib from "gi://GLib?version=2.0"
import AstalDisplays from "gi://AstalDisplays?version=0.1"

import { For, createState, onCleanup } from "ags"
import { Gtk } from "ags/gtk4"

import SystemMenuButton from "./SystemMenuButton"

const DISPLAY_BRIGHTNESS_STEP = 5
const DEFAULT_MINIMUM_BRIGHTNESS = 0

type DisplaysButtonProps = {
  instanceId: string
}

type DisplayBrightnessItem = {
  key: string
  name: string
  serial: string
  brightness: number
}

function getProperty<T>(value: any, ...keys: string[]) {
  for (const key of keys) {
    if (value && typeof value === "object" && key in value && value[key] != null) {
      return value[key] as T
    }

    if (value && typeof value.get_property === "function") {
      try {
        const propertyValue = value.get_property(key)
        if (propertyValue != null) {
          return propertyValue as T
        }
      } catch {
        // Ignore missing GI properties so we can try fallback names.
      }
    }
  }

  return null
}

function clampBrightness(value: number, minimumBrightness: number) {
  const rounded = Math.round(value / DISPLAY_BRIGHTNESS_STEP) * DISPLAY_BRIGHTNESS_STEP
  return Math.max(minimumBrightness, Math.min(100, rounded))
}

function clampMinimumBrightness(value: number) {
  return Math.max(0, Math.min(100, value))
}

function averageBrightness(items: DisplayBrightnessItem[]) {
  if (items.length === 0) {
    return 0
  }

  const sum = items.reduce((total, item) => total + item.brightness, 0)
  return Math.round(sum / items.length)
}

function itemLabel(item: DisplayBrightnessItem) {
  return item.name || item.serial || "Unknown display"
}

function buildDisplayItem(display: any): DisplayBrightnessItem | null {
  const identifier = getProperty<any>(display, "id")
  const physical = getProperty<any>(display, "physical")
  const brightness = getProperty<number>(physical, "brightness")

  if (!physical || typeof brightness !== "number") {
    return null
  }

  const name = getProperty<string>(identifier, "name") || "Unknown display"
  const serial = getProperty<string>(identifier, "serialNumber", "serial-number", "serial_number") || ""
  const key = serial || name

  return {
    key,
    name,
    serial,
    brightness,
  }
}

function buildDisplayIdentifier(item: DisplayBrightnessItem) {
  return new AstalDisplays.DisplayIdentifier({
    name: item.name || null,
    serial_number: item.serial || null,
  })
}

type BrightnessScaleProps = {
  value: number | (() => number)
  minimumBrightness: number | (() => number)
  onBrightnessChanged: (value: number) => void
}

function isReactiveNumber(value: number | (() => number)): value is (() => number) & { subscribe(callback: () => void): () => void } {
  return typeof value === "function" && "subscribe" in value
}

function readReactiveNumber(value: number | (() => number)) {
  return isReactiveNumber(value) ? value() : value
}

function BrightnessScale({ value, minimumBrightness, onBrightnessChanged }: BrightnessScaleProps) {
  const adjustment = new Gtk.Adjustment({
    lower: readReactiveNumber(minimumBrightness),
    upper: 100,
    stepIncrement: DISPLAY_BRIGHTNESS_STEP,
    pageIncrement: DISPLAY_BRIGHTNESS_STEP,
    pageSize: 0,
    value: readReactiveNumber(value),
  })

  return (
    <Gtk.Scale
      class="display-slider"
      orientation={Gtk.Orientation.HORIZONTAL}
      hexpand
      drawValue={false}
      roundDigits={0}
      digits={0}
      adjustment={adjustment}
      $={() => {
        const syncAdjustment = () => {
          const nextMinimum = readReactiveNumber(minimumBrightness)
          const nextValue = clampBrightness(readReactiveNumber(value), nextMinimum)

          adjustment.set_lower(nextMinimum)
          if (Math.abs(adjustment.get_value() - nextValue) > 0.01) {
            adjustment.set_value(nextValue)
          }
        }

        syncAdjustment()

        const disposers = new Array<() => void>()
        if (isReactiveNumber(minimumBrightness)) {
          disposers.push(minimumBrightness.subscribe(syncAdjustment))
        }
        if (isReactiveNumber(value)) {
          disposers.push(value.subscribe(syncAdjustment))
        }

        onCleanup(() => {
          for (const dispose of disposers) {
            dispose()
          }
        })
      }}
      onValueChanged={(self) => {
        const next = clampBrightness(self.get_value(), readReactiveNumber(minimumBrightness))
        if (Math.abs(self.get_value() - next) > 0.01) {
          self.set_value(next)
        }

        if (next === readReactiveNumber(value)) {
          return
        }

        onBrightnessChanged(next)
      }}
    />
  )
}

/**
 * Shows brightness-capable displays from AstalDisplays and exposes per-display
 * or merged brightness control.
 */
export default function DisplaysButton({ instanceId }: DisplaysButtonProps) {
  const manager = AstalDisplays.Manager.get_default() as any
  const [items, setItems] = createState(new Array<DisplayBrightnessItem>())
  const [summary, setSummary] = createState("--")
  const [tooltip, setTooltip] = createState("Displays unavailable")
  const [visible, setVisible] = createState(false)
  const [globalControl, setGlobalControl] = createState(false)
  const [minimumBrightness, setMinimumBrightness] = createState(DEFAULT_MINIMUM_BRIGHTNESS)
  const [minimumBrightnessInput, setMinimumBrightnessInput] = createState(`${DEFAULT_MINIMUM_BRIGHTNESS}`)
  const popoverId = `displays-popover-${instanceId}`
  let pollId = 0
  let started = false

  const refreshDisplays = () => {
    try {
      const queried = (manager.query() as any[])
        .map((display) => buildDisplayItem(display))
        .filter((item): item is DisplayBrightnessItem => item !== null)

      setItems(queried)
      setVisible(queried.length > 0)

      if (queried.length === 0) {
        setSummary("--")
        setTooltip("Displays unavailable")
        setGlobalControl(false)
        return
      }

      if (queried.length < 2 && globalControl.get()) {
        setGlobalControl(false)
      }

      const average = averageBrightness(queried)
      setSummary(queried.length === 1 ? `${queried[0].brightness}%` : `${average}%`)
      setTooltip(queried.map((item) => `${itemLabel(item)}: ${item.brightness}%`).join("\n"))
    } catch (error) {
      console.error(error)
      setItems([])
      setSummary("--")
      setTooltip("Displays unavailable")
      setVisible(false)
      setGlobalControl(false)
    }
  }

  const applyBrightness = (targetItems: DisplayBrightnessItem[], requestedBrightness: number) => {
    if (targetItems.length === 0) {
      return
    }

    const nextBrightness = clampBrightness(requestedBrightness, minimumBrightness.get())
    const updates = targetItems.map(
      (item) =>
        new AstalDisplays.DisplayUpdate({
          id: buildDisplayIdentifier(item),
          physical: new AstalDisplays.PhysicalDisplayUpdateContent({
            has_brightness: true,
            brightness: nextBrightness,
          }),
        }),
    )

    try {
      const unresolved = manager.update(updates) as any[]
      if (unresolved.length > 0) {
        console.warn("[ags][displays] unresolved brightness updates", unresolved)
      }
    } catch (error) {
      console.error(error)
    }

    refreshDisplays()
  }

  const commitMinimumBrightness = (entry?: Gtk.Entry) => {
    const currentMinimum = minimumBrightness.get()
    const rawText = entry?.get_text() ?? minimumBrightnessInput.get()
    const parsed = Number.parseInt(rawText.trim(), 10)

    if (!Number.isFinite(parsed)) {
      const fallback = `${currentMinimum}`
      setMinimumBrightnessInput(fallback)
      entry?.set_text(fallback)
      return
    }

    const nextMinimum = clampMinimumBrightness(parsed)
    const normalized = `${nextMinimum}`
    setMinimumBrightnessInput(normalized)
    entry?.set_text(normalized)

    if (nextMinimum === currentMinimum) {
      return
    }

    setMinimumBrightness(nextMinimum)

    const itemsBelowMinimum = items.get().filter((item) => item.brightness < nextMinimum)
    if (itemsBelowMinimum.length > 0) {
      applyBrightness(itemsBelowMinimum, nextMinimum)
    }
  }

  const start = () => {
    if (started) {
      return
    }

    started = true
    refreshDisplays()
    pollId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 3, () => {
      refreshDisplays()
      return GLib.SOURCE_CONTINUE
    })
  }

  onCleanup(() => {
    if (pollId > 0) {
      GLib.source_remove(pollId)
    }
  })

  return (
    <box
      visible={visible}
      $={() => {
        start()
      }}
    >
      <SystemMenuButton
        popoverId={popoverId}
        tooltipText={tooltip}
        button={
          <box class="bar-item with-text" halign={Gtk.Align.CENTER}>
            <box class="system-button-content with-text" halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER}>
              <label class="item-icon" label="󰍹" xalign={0.5} yalign={0.5} widthRequest={16} />
              <label class="item-text" label={summary} />
            </box>
          </box>
        }
      >
        <box class="panel displays-panel" orientation={Gtk.Orientation.VERTICAL} spacing={10}>
          <label class="panel-title" label="Displays" xalign={0} />
          <label class="panel-status" label={tooltip} xalign={0} wrap />
          <centerbox class="display-minimum-row" orientation={Gtk.Orientation.HORIZONTAL}>
            <label $type="start" label="Minimum brightness" xalign={0} />
            <box $type="end" class="display-minimum-control" spacing={6}>
              <entry
                class="display-minimum-entry"
                inputPurpose={Gtk.InputPurpose.DIGITS}
                widthChars={4}
                maxWidthChars={4}
                text={minimumBrightnessInput}
                $={(self: Gtk.Entry) => {
                  self.connect("changed", () => {
                    setMinimumBrightnessInput(self.get_text())
                  })
                  self.connect("activate", () => {
                    commitMinimumBrightness(self)
                  })
                  self.connect("notify::has-focus", () => {
                    if (!self.has_focus()) {
                      commitMinimumBrightness(self)
                    }
                  })
                }}
              />
              <label class="panel-status display-minimum-value" label="%" />
            </box>
          </centerbox>
          <box visible={items((value) => value.length > 1)}>
            <Gtk.CheckButton active={globalControl} onToggled={(self) => setGlobalControl(self.get_active())}>
              <label label="Global control" />
            </Gtk.CheckButton>
          </box>
          <box visible={globalControl((value) => value)} orientation={Gtk.Orientation.VERTICAL} spacing={8}>
            <centerbox class="display-slider-header" orientation={Gtk.Orientation.HORIZONTAL}>
              <label $type="start" label="All displays" xalign={0} />
              <label
                $type="end"
                class="panel-status display-slider-value"
                label={items((value) => `${averageBrightness(value)}%`)}
              />
            </centerbox>
            <BrightnessScale
              value={items((currentItems) => averageBrightness(currentItems))}
              minimumBrightness={minimumBrightness}
              onBrightnessChanged={(value) => applyBrightness(items.get(), value)}
            />
          </box>
          <box visible={globalControl((value) => !value)} orientation={Gtk.Orientation.VERTICAL} spacing={10}>
            <For each={items}>
              {(item) => (
                <box class="display-slider-row" orientation={Gtk.Orientation.VERTICAL} spacing={6}>
                  <centerbox class="display-slider-header" orientation={Gtk.Orientation.HORIZONTAL}>
                    <label $type="start" label={itemLabel(item)} xalign={0} hexpand />
                    <label $type="end" class="panel-status display-slider-value" label={`${item.brightness}%`} xalign={1} />
                  </centerbox>
                  <BrightnessScale
                    value={items(
                      (currentItems) => currentItems.find((currentItem) => currentItem.key === item.key)?.brightness ?? item.brightness,
                    )}
                    minimumBrightness={minimumBrightness}
                    onBrightnessChanged={(value) => applyBrightness([item], value)}
                  />
                </box>
              )}
            </For>
          </box>
        </box>
      </SystemMenuButton>
    </box>
  )
}
