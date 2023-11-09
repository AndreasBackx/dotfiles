#!/usr/bin/env zsh

set -o errexit -o nounset

wayland_args="--enable-features=WaylandWindowDecorations --ozone-platform-hint=auto"

declare -A WRAPPERS=(
  [discord]="discord $wayland_args || Discord $wayland_args || flatpak run --socket=wayland com.discordapp.Discord $wayland_args"
  [mattermost-desktop]="mattermost-desktop $wayland_args"
  [obsidian]="obsidian $wayland_args || flatpak run --socket=wayland md.obsidian.Obsidian $wayland_args"
  [signal-desktop]="signal-desktop $wayland_args"
  [spotify]="spotify $wayland_args"
  [zulip]="zulip $wayland_args || flatpak run --socket=wayland org.zulip.Zulip $wayland_args"
)

wrappers_directory="$HOME/.bin/wrappers"
mkdir -p $wrappers_directory

for key value in ${(kv)WRAPPERS}; do
  CONTENTS="#!/usr/bin/env zsh

export PATH=\${PATH//:\$HOME\/.bin\/wrappers:/:}
$value
"

  to="$wrappers_directory/$key"
  cmp --silent <(echo $CONTENTS) $to || (
    echo "$key wrapper changed, copying to $to..."
    # cp $from $to
    echo $CONTENTS > $to
    chmod +x $to
  )
done
