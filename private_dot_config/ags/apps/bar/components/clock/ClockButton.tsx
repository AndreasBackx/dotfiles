import { For, createState, onCleanup } from "ags"
import { Gtk } from "ags/gtk4"

import { getClockState } from "./ClockState"
import SystemMenuButton from "../system/SystemMenuButton"

type ClockButtonProps = {
  instanceId: string
}

function timezoneMatches(timezone: string, query: string) {
  if (!query) {
    return true
  }

  const normalizedTimezone = timezone.toLowerCase()
  const normalizedQuery = query.toLowerCase()
  return normalizedTimezone.includes(normalizedQuery)
}

function filteredTimezoneList(timezones: string[], query: string) {
  return timezones.filter((timezone) => timezoneMatches(timezone, query.trim())).slice(0, 100)
}

/**
 * Shows the current local time and a calendar popover.
 *
 * The expensive parts of this widget now come from `getClockState()`, which is
 * shared across all bar instances. Only the search query and filtered timezone
 * list remain local to each popover instance.
 */
export default function ClockButton({ instanceId }: ClockButtonProps) {
  const { time, tooltip, currentTimezone, availableTimezones, timezoneLoading, applyTimezone } = getClockState()
  const [timezoneFilter, setTimezoneFilter] = createState("")
  const [filteredTimezones, setFilteredTimezones] = createState(filteredTimezoneList(availableTimezones.get(), ""))
  const popoverId = `clock-popover-${instanceId}`
  const displayedTimezone = currentTimezone((value) => value || "loading...")

  const updateFilteredTimezones = (query: string, zones = availableTimezones.get()) => {
    setFilteredTimezones(filteredTimezoneList(zones, query))
  }

  // The timezone inventory is shared globally, but each open popover has its
  // own search query. Resync the filtered list whenever the shared source is
  // updated so the local query stays applied.
  const unsubscribeTimezones = (availableTimezones as any).subscribe?.(() => {
    updateFilteredTimezones(timezoneFilter.get())
  })

  onCleanup(() => {
    unsubscribeTimezones?.()
  })

  return (
    <SystemMenuButton
      popoverId={popoverId}
      instanceId={instanceId}
      tooltipText={tooltip}
      button={
        <box class="bar-item clock-item" halign={Gtk.Align.CENTER}>
          <label label={time} />
        </box>
      }
    >
      <box class="panel datetime-panel" orientation={Gtk.Orientation.VERTICAL} spacing={10}>
        <label class="panel-status" label={tooltip} xalign={0} wrap />
        <Gtk.Calendar />
        <box class="panel-divider" />
        <centerbox class="panel-heading-row" orientation={Gtk.Orientation.HORIZONTAL}>
          <label $type="start" class="panel-section-title" label="Timezone" xalign={0} />
          <label
            $type="end"
            class="panel-status panel-heading-value"
            label={displayedTimezone}
            xalign={1}
          />
        </centerbox>
        <entry
          class="timezone-search"
          placeholderText="Search timezone"
            text={timezoneFilter}
            $={(self: Gtk.Entry) => {
              self.connect("changed", () => {
                const nextFilter = self.get_text()
                setTimezoneFilter(nextFilter)
                updateFilteredTimezones(nextFilter)
              })
            }}
        />
        <scrolledwindow class="timezone-list" minContentHeight={220} propagateNaturalHeight>
          <box orientation={Gtk.Orientation.VERTICAL} spacing={4}>
            <For each={filteredTimezones}>
              {(zone) => (
                <button
                  class={currentTimezone((value) =>
                    zone === value ? "panel-button timezone-button occupied" : "panel-button timezone-button",
                  )}
                  onClicked={() => applyTimezone(zone)}
                >
                  <label label={zone} xalign={0} />
                </button>
              )}
            </For>
            <label
              visible={filteredTimezones((zones) => zones.length === 0)}
              class="panel-status"
              label={timezoneLoading((loading) => (loading ? "Loading..." : "No Matching Timezones"))}
              xalign={0}
            />
          </box>
        </scrolledwindow>
      </box>
    </SystemMenuButton>
  )
}
