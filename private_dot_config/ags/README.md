# AGS Apps

This folder contains the AGS v2 apps and their shared support code.

## Layout

- `apps/bar/*`: the desktop bar app entrypoint, bar-specific components, bar runtime helpers, and bar theming.
- `apps/ottolangy/*`: the Ottolangy app entrypoint, app-local components, app-local utilities, and theming.
- `common/components/*`: reserved for widgets reused by multiple AGS apps.
- `common/utils/*`: shared helpers and shared types such as generic state accessors.
- `common/theming/*`: shared GTK styling that more than one AGS app imports.

## Bar

- Entry point: `apps/bar/app.tsx`
- Main component tree: `apps/bar/components/*`
- Runtime helpers: `apps/bar/utils/*`
- Theme files: `apps/bar/theming/*`

The bar still runs with instance name `dotfiles-bar` and still accepts the same AGS requests:

- `show-center`
- `show-workspaces`

Monitor role behavior still lives in `apps/bar/utils/bar-logic.ts`.
Workspace-strip behavior remains Hyprland-only for now and is disabled automatically when AGS is running inside Niri.
Center auto-hide policy still lives in `apps/bar/utils/center-visibility.ts`.

## Ottolangy

- Entry point: `apps/ottolangy/app.tsx`
- UI components: `apps/ottolangy/components/*`
- App utilities and data shaping: `apps/ottolangy/utils/*`
- Theme files: `apps/ottolangy/theming/*`

`ottolangy` now follows the same pattern as the bar: a thin entrypoint that wires state and actions into app-local components instead of keeping the full UI in one file.

## External Commands

The bar depends on helper scripts in `~/.bin` such as:

- `bar-workspaces`
- `bar-audio`
- `bar-battery`
- `bar-bluetooth`
- `bar-brightness`
- `bar-network`
- `bar-spotify`

Ottolangy depends on local translation tooling such as:

- `argos-translate`
- `mlconjug3`
- `wl-copy`

## Templates

The bar still uses chezmoi-rendered template files for host-specific values:

- `apps/bar/utils/config.ts.tmpl`
- `apps/bar/theming/theme.css.tmpl`

When changing shared styles or helpers, prefer `common/*` only when at least two apps genuinely use the code.
