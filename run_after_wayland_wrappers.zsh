#!/usr/bin/env zsh

set -o errexit -o nounset

source $HOME/.config/.variables

wayland_args="--enable-features=WaylandWindowDecorations --ozone-platform-hint=auto"

declare -A WAYLAND_WRAPPERS=(
  [discord]="discord $wayland_args || Discord $wayland_args || flatpak run --socket=wayland com.discordapp.Discord $wayland_args"
  [mattermost-desktop]="mattermost-desktop $wayland_args"
  [obsidian]="obsidian $wayland_args || flatpak run --socket=wayland md.obsidian.Obsidian $wayland_args"
  # [tuba]="tuba || flatpak run --socket=wayland dev.geopjr.Tuba $wayland_args"
  [signal-desktop]="signal-desktop $wayland_args"
  [spotify]="spotify $wayland_args || flatpak run --socket=wayland com.spotify.Client $wayland_args"
  [zulip]="zulip $wayland_args || flatpak run --socket=wayland org.zulip.Zulip $wayland_args"
)
declare -A X_WRAPPERS=(
  [discord]="discord || Discord || flatpak run com.discordapp.Discord"
  #[mattermost-desktop]="mattermost-desktop"
  #[obsidian]="obsidian"
  #[signal-desktop]="signal-desktop"
  [spotify]="spotify || flatpak run com.spotify.Client"
  [zulip]="zulip || flatpak run --socket=wayland org.zulip.Zulip"
)

wrappers_directory="$HOME/.bin/wrappers"
rm -rf $wrappers_directory
mkdir -p $wrappers_directory

if [[ $CHEZMOI_DATA_MONITORS_SELECTED == "home" ]]; then
  set -A WRAPPERS ${(kv)X_WRAPPERS}
else
  set -A WRAPPERS ${(kv)WAYLAND_WRAPPERS}
fi

for key value in ${(kv)WRAPPERS}; do
  CONTENTS="#!/usr/bin/env zsh

FILE_PATH="\${0:a}"
PARENT_DIR="\${FILE_PATH:h}"
export PATH=\${PATH//\$PARENT_DIR:/:}

if [[ \$(which $key) == "\$FILE_PATH" ]]; then
    notify-send \"Tried recursively running $key wrapper, exiting...\" --urgency=critical
    exit 1
fi
$value
"

  to="$wrappers_directory/$key"
  cmp --silent <(echo $CONTENTS) $to || (
    echo "$key wrapper changed, copying to $to..."
    echo $CONTENTS > $to
    chmod +x $to
  )
done
