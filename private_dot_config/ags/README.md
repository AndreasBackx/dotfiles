# AGS Bar

This folder contains the AGS v2 configuration for the desktop bar.

## Overview

- `app.tsx` starts the AGS application and owns the top-level runtime state.
- `components/bar/*` creates one or more overlay windows per monitor.
- `components/workspaces/*` renders the workspace strip.
- `components/title/*` renders the focused window title.
- `components/spotify/*` renders the Spotify status segment.
- `components/system/*` renders the right-hand status and control widgets.
- `components/system/TraySegment.tsx` renders AppIndicator / StatusNotifier tray icons through `AstalTray`.
- `lib/*` contains shared runtime helpers, monitor/workspace logic, and output parsers.
- `theme.css.tmpl` and `lib/config.ts.tmpl` are chezmoi templates, so their output depends on host data.
- `app.css` plus colocated `*.css` files next to components provide the global GTK stylesheet that `app.tsx` assembles at startup.

## Runtime Flow

1. `app.tsx` starts AGS with a custom instance name and CSS.
2. It subscribes to `bar-workspaces listen json`, which streams Hyprland workspace and monitor state.
3. The streamed state is stored in `hyprState` and passed down as an accessor.
4. `MonitorBars.tsx` decides which bar windows should exist on each physical monitor.
5. Each `BarWindow.tsx` renders `BarRoot.tsx`, which composes the workspace strip, title, Spotify segment, and system segment.
6. When the center bar is auto-hidden, `WorkspaceRevealWindow.tsx` shows a temporary workspace-only strip so the center segment can still be recalled.

## Monitor Roles

The bar treats monitors as one of four roles:

- `left`
- `center`
- `right`
- `laptop`

The role mapping comes from `lib/config.ts.tmpl`, which is rendered by chezmoi from monitor metadata.

`lib/bar-logic.ts` is the source of truth for role behavior:

- `monitorMatches()` prefers monitor serial numbers when available, then falls back to the monitor description.
- `centerTargetRole()` decides whether the center segment should live on the external center monitor or fall back to the laptop display.
- `centerAutoHideEnabled()` enables auto-hide only on the home-center monitor or the laptop fallback.
- `baseForRole()` maps monitor roles to workspace ranges.

## Workspace Model

Workspaces are grouped into fixed ranges:

- left monitor: `1-12`
- center or laptop monitor: `101-112`
- right monitor: `201-212`

Only active, visible, or populated workspaces are rendered in the strip.

When only the laptop display is present, `assignCenterWorkspacesToLaptop()` reassigns the center workspace range to the laptop monitor so the workspace strip still matches the visible layout.

## Visibility And Auto-Hide

`app.tsx` owns center visibility policy.

- `centerVisible` controls whether the center bar window is shown.
- `workspaceStripVisible` controls whether the reveal-only workspace strip is shown.
- Hover state from bar windows and popovers is reported through `lib/widget-helpers.ts`.
- Timers are used to delay auto-hide and avoid flicker.

Important behavior:

- Hovering the center bar or any attached popover keeps the center bar visible long enough for interaction.
- `show-center` and `show-workspaces` requests can be sent to the AGS instance through the request handler.
- When auto-hide is disabled, the center bar is forced visible and the reveal strip is hidden.
- `lib/widget-helpers.ts` intentionally tracks popover state from the popover itself. Manually forcing `GtkMenuButton` active state during popover setup caused Gtk "broken accounting of active state" warnings and stuck menu buttons during reload/open races.

## External Command Contracts

Most widgets are thin wrappers around existing shell helpers in `~/.bin`:

- `bar-workspaces`
- `bar-audio`
- `bar-battery`
- `bar-bluetooth`
- `bar-brightness`
- `bar-network`
- `bar-spotify`
- `AstalTray`
- `power-options`

The widgets also depend on standard tools:

- `hyprctl`
- `nmcli`
- `bluetoothctl`
- `wpctl`
- `playerctl`
- `pavucontrol`
- `top`
- `free`

The tray segment depends on the `AstalTray` GI typelib being available to the
AGS process. On this machine the source-built Astal libraries were installed
under `/usr/local`, so AGS needs `GI_TYPELIB_PATH=/usr/local/lib64/girepository-1.0`
in its runtime environment. If AGS is launched from a systemd user service or a
desktop autostart entry, export that path there so `import "gi://AstalTray"`
resolves during startup.

If a widget breaks after a system upgrade, check the output format of those commands first. `lib/parsers.ts` contains the parsing assumptions for several of them.

## Folder Guide

- `app.tsx`: application entry point, monitor subscription, visibility timers, request handling.
- `components/bar/MonitorBars.tsx`: per-monitor visibility selectors.
- `components/bar/OverlayWindow.tsx`: shared overlay window wrapper for bar surfaces.
- `components/bar/BarWindow.tsx`: overlay window for a full bar instance.
- `components/bar/WorkspaceRevealWindow.tsx`: overlay window for the reveal-only workspace strip.
- `components/bar/BarRoot.tsx`: layout root for the bar contents.
- `components/workspaces/*`: workspace buttons and strip.
- `components/system/*`: polled status widgets and popover panels.
- `components/title/TitleSegment.tsx`: focused window title label.
- `components/spotify/SpotifySegment.tsx`: Spotify track display and play/pause action.
- `lib/runtime.ts`: command helpers, polling helpers, shared constants.
- `lib/bar-logic.ts`: monitor role logic and workspace helpers.
- `lib/center-visibility.ts`: timer and interaction policy for center-bar auto-hide.
- `lib/widget-helpers.ts`: hover and popover tracking bridge.
- `lib/parsers.ts`: command output parsing helpers.
- `lib/types.ts`: shared application types.

## Template Files

Two files in this folder are generated from chezmoi templates:

- `lib/config.ts.tmpl`
- `theme.css.tmpl`

That means host-specific monitor names, serial numbers, bar positions, and theme values are injected at render time. Most styling now lives in plain `*.css` files beside the TSX components that use those classes, while `theme.css.tmpl` centralizes the host-specific color values they reference. When changing monitor behavior or theme styling, confirm whether the right fix belongs in TypeScript, in a colocated CSS file, or in the chezmoi data source that feeds the templates.
