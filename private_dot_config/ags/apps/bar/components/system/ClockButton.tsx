import GLib from "gi://GLib?version=2.0"

import { For, createState } from "ags"
import { Gtk } from "ags/gtk4"
import { createPoll, timeout } from "ags/time"
import { execAsync } from "ags/process"

import { trimOutput } from "../../utils/runtime"
import SystemMenuButton from "./SystemMenuButton"

type ClockButtonProps = {
  instanceId: string
}

function parseTimezones(stdout: string) {
  return stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
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
 */
export default function ClockButton({ instanceId }: ClockButtonProps) {
  const time = createPoll("", 1000, () => GLib.DateTime.new_now_local().format("%a %d %b %H:%M") ?? "")
  const tooltip = createPoll("", 1000, () =>
    GLib.DateTime.new_now_local().format("%a %d %b %Y %H:%M:%S %Z") ?? "",
  )
  const [timezoneFilter, setTimezoneFilter] = createState("")
  const [currentTimezone, setCurrentTimezone] = createState("")
  const [displayedTimezone, setDisplayedTimezone] = createState("loading...")
  const [availableTimezones, setAvailableTimezones] = createState(new Array<string>())
  const [filteredTimezones, setFilteredTimezones] = createState(new Array<string>())
  const [timezoneLoading, setTimezoneLoading] = createState(true)
  const popoverId = `clock-popover-${instanceId}`

  const updateFilteredTimezones = (query: string, zones = availableTimezones.get()) => {
    setFilteredTimezones(filteredTimezoneList(zones, query))
  }

  const setCurrentTimezoneState = (value: string) => {
    setCurrentTimezone(value)
    setDisplayedTimezone(value || "loading...")
    setTimezoneLoading(false)
    setFilteredTimezones([...filteredTimezoneList(availableTimezones.get(), timezoneFilter.get())])
  }

  const loadCurrentTimezone = async () => {
    try {
      setCurrentTimezoneState(trimOutput(await execAsync(["timedatectl", "show", "--property=Timezone", "--value"])))
    } catch (error) {
      setTimezoneLoading(false)
      console.error(error)
    }
  }

  if (availableTimezones.get().length === 0) {
    loadCurrentTimezone()

    execAsync(["timedatectl", "list-timezones"])
      .then((stdout) => {
        const zones = parseTimezones(stdout)
        setAvailableTimezones(zones)
        updateFilteredTimezones(timezoneFilter.get(), zones)
      })
      .catch((error) => console.error(error))
  }

  const applyTimezone = async (nextTimezone: string) => {
    if (!nextTimezone || nextTimezone === currentTimezone.get()) {
      return
    }

    setTimezoneLoading(true)
    setDisplayedTimezone(nextTimezone)

    try {
      await execAsync(["timedatectl", "set-timezone", nextTimezone])
      setCurrentTimezoneState(nextTimezone)
      timeout(250, () => loadCurrentTimezone())
    } catch (error) {
      setDisplayedTimezone(currentTimezone.get() || "loading...")
      setTimezoneLoading(false)
      console.error(error)
    }
  }

  return (
    <SystemMenuButton
      popoverId={popoverId}
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
