#!/usr/bin/env zsh

set -o errexit -o nounset

wayland_args="--enable-features=WaylandWindowDecorations --ozone-platform-hint=auto"

declare -A WRAPPERS=(
  [discord]="discord $wayland_args || Discord $wayland_args || flatpak run --socket=wayland com.discordapp.Discord $wayland_args"
  [mattermost-desktop]="mattermost-desktop $wayland_args"
  [obsidian]="obsidian $wayland_args"
  [signal-desktop]="signal-desktop $wayland_args"
  [spotify]="spotify $wayland_args"
  [zulip]="zulip $wayland_args || flatpak run --socket=wayland org.zulip.Zulip $wayland_args"
)

wrappers_directory="$HOME/.bin/wrappers"
mkdir -p $wrappers_directory

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
