import { For, createState, onCleanup } from "ags"
import { Gtk } from "ags/gtk4"
import GLib from "gi://GLib?version=2.0"

import type { StateAccessor } from "../../../../common/utils/state"
import { createPerfSpan, logShowCenterStage } from "../../utils/perf"
import type { MonitorIdentity } from "../../utils/types"
import {
  averageBrightness,
  brightnessSummaryForMonitor,
  clampBrightness,
  DisplayBrightnessItem,
  getDisplaysState,
  itemLabel,
} from "./DisplaysState"
import SystemMenuButton from "../system/SystemMenuButton"

const DISPLAY_BRIGHTNESS_STEP = 5
const DISPLAY_BRIGHTNESS_DEBOUNCE_MS = 125
const DEFAULT_MINIMUM_BRIGHTNESS = 0

function clampMinimumBrightness(value: number) {
  return Math.max(0, Math.min(100, value))
}

type DisplaysButtonProps = {
  instanceId: string
  monitor: StateAccessor<MonitorIdentity>
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
  let syncingAdjustment = false

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
            // Keep state-driven slider refreshes from being interpreted as user
            // input. Gtk may emit value-changed for programmatic updates, and
            // brightness writes must only happen from deliberate interaction.
            syncingAdjustment = true
            adjustment.set_value(nextValue)
            syncingAdjustment = false
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
        if (syncingAdjustment) {
          return
        }

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
 *
 * Unlike the old implementation, this widget no longer keeps a permanent timer
 * alive. Display queries now use adaptive polling, so hidden bars stop polling
 * entirely and visible bars refresh immediately when they become active again.
 */
export default function DisplaysButton({ instanceId, monitor }: DisplaysButtonProps) {
  logShowCenterStage("displays button render enter", `instance=${instanceId}`)
  const resolveDisplaysState = createPerfSpan("displays button getDisplaysState")
  const {
    items,
    visible,
    tooltip,
    displayErrors,
    attachInstance,
    applyBrightness: applySharedBrightness,
  } = getDisplaysState()
  resolveDisplaysState(`instance=${instanceId}`)
  const [globalControl, setGlobalControl] = createState(false)
  const [minimumBrightness, setMinimumBrightness] = createState(DEFAULT_MINIMUM_BRIGHTNESS)
  const [minimumBrightnessInput, setMinimumBrightnessInput] = createState(`${DEFAULT_MINIMUM_BRIGHTNESS}`)
  const [summary, setSummary] = createState("--")
  const popoverId = `displays-popover-${instanceId}`
  const attachDisplaysInstance = createPerfSpan("displays button attachInstance")
  const detach = attachInstance(instanceId)
  attachDisplaysInstance(`instance=${instanceId}`)

  const syncSummary = () => {
    setSummary(brightnessSummaryForMonitor(items.get(), monitor.get()))
  }
  const detachItems = (items as any).subscribe?.(syncSummary) ?? (() => {})
  const detachMonitor = (monitor as any).subscribe?.(syncSummary) ?? (() => {})
  const initialSummary = createPerfSpan("displays button initial summary")
  syncSummary()
  initialSummary(`instance=${instanceId} summary=${summary.get()}`)
  const pendingBrightnessUpdates = new Map<string, { sourceId: number; brightness: number }>()

  const applyBrightness = (targetItems: DisplayBrightnessItem[], requestedBrightness: number) => {
    const nextBrightness = clampBrightness(requestedBrightness, minimumBrightness.get())
    const itemsNeedingUpdate = targetItems.filter((item) => item.brightness !== nextBrightness)

    if (itemsNeedingUpdate.length === 0) {
      return
    }

    // Compare against the normalized 5%-step target so the no-op check matches
    // the real write path. This avoids backend updates when GTK reports a raw
    // slider value that would clamp/round back to the brightness already stored.
    void applySharedBrightness(itemsNeedingUpdate, nextBrightness, minimumBrightness.get())
  }

  const clearPendingBrightnessUpdate = (scope: string) => {
    const pending = pendingBrightnessUpdates.get(scope)
    if (!pending) {
      return
    }

    pendingBrightnessUpdates.delete(scope)

    try {
      GLib.source_remove(pending.sourceId)
    } catch {
      // The timeout may already have fired or been removed during teardown.
    }
  }

  const scheduleBrightnessApply = (scope: string, requestedBrightness: number, targetKey?: string) => {
    clearPendingBrightnessUpdate(scope)

    // Slider drags emit a large stream of intermediate values. Queue only the
    // final paused value so display writes happen once interaction settles.
    const sourceId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, DISPLAY_BRIGHTNESS_DEBOUNCE_MS, () => {
      const pending = pendingBrightnessUpdates.get(scope)
      if (!pending || pending.sourceId !== sourceId) {
        return GLib.SOURCE_REMOVE
      }

      pendingBrightnessUpdates.delete(scope)

      const currentItems = items.get()
      const targetItems = targetKey
        ? currentItems.filter((item) => item.key === targetKey)
        : currentItems

      applyBrightness(targetItems, requestedBrightness)
      return GLib.SOURCE_REMOVE
    })

    pendingBrightnessUpdates.set(scope, { sourceId, brightness: requestedBrightness })
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

  onCleanup(() => {
    for (const scope of pendingBrightnessUpdates.keys()) {
      clearPendingBrightnessUpdate(scope)
    }
    detachItems()
    detachMonitor()
    detach()
  })

  return (
    <box visible={visible}>
      <SystemMenuButton
        popoverId={popoverId}
        instanceId={instanceId}
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
              onBrightnessChanged={(value) => scheduleBrightnessApply("all-displays", value)}
            />
            <box visible={displayErrors((errors) => Object.keys(errors).length > 0)} orientation={Gtk.Orientation.VERTICAL} spacing={4}>
              <For each={items}>
                {(item) => (
                  <label
                    visible={displayErrors((errors) => Boolean(errors[item.key]))}
                    class="panel-status display-slider-error"
                    label={displayErrors((errors) => `${itemLabel(item)}: ${errors[item.key] ?? ""}`)}
                    xalign={0}
                    wrap
                  />
                )}
              </For>
            </box>
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
                    onBrightnessChanged={(value) => scheduleBrightnessApply(item.key, value, item.key)}
                  />
                  <label
                    visible={displayErrors((errors) => Boolean(errors[item.key]))}
                    class="panel-status display-slider-error"
                    label={displayErrors((errors) => errors[item.key] ?? "")}
                    xalign={0}
                    wrap
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
