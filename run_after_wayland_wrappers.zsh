#!/usr/bin/env zsh

set -o errexit -o nounset

source $HOME/.config/.variables

# --enable-features=WaylandWindowDecorations --ozone-platform-hint=auto
wayland_args="--enable-features=UseOzonePlatform --ozone-platform=wayland"

declare -A WAYLAND_WRAPPERS=(
  [code]="code $wayland_args"
  [code-fb]="code-fb $wayland_args"
  [discord]="flatpak run --socket=wayland com.discordapp.Discord $wayland_args || discord $wayland_args || Discord $wayland_args"
  [mattermost-desktop]="mattermost-desktop $wayland_args"
  [obsidian]="obsidian $wayland_args || flatpak run --socket=wayland md.obsidian.Obsidian $wayland_args"
  # [tuba]="tuba || flatpak run --socket=wayland dev.geopjr.Tuba $wayland_args"
  [1password]="1password $wayland_args"
  [signal-desktop]="flatpak run --socket=wayland org.signal.Signal $wayland_args || signal-desktop $wayland_args"
  [spotify]="spotify $wayland_args --force-device-scale-factor=1.25 || flatpak run --socket=wayland com.spotify.Client $wayland_args --force-device-scale-factor=1.25"
  [zulip]="zulip $wayland_args || flatpak run --socket=wayland org.zulip.Zulip $wayland_args"
  [google-chrome]="google-chrome $wayland_args"
  [google-chrome-stable]="google-chrome-stable $wayland_args"
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

# if [[ $CHEZMOI_DATA_MONITORS_SELECTED == "home" ]]; then
#   set -A WRAPPERS ${(kv)X_WRAPPERS}
# else
  set -A WRAPPERS ${(kv)WAYLAND_WRAPPERS}
# ficc

for key value in ${(kv)WRAPPERS}; do
  CONTENTS="#!/usr/bin/env zsh

FILE_PATH="\${0:a}"
PARENT_DIR="\${FILE_PATH:h}"
export PATH=\${PATH//\$PARENT_DIR:/:}

if [[ \$(which $key) == "\$FILE_PATH" ]]; then
    notify-send \"Tried recursively running $key wrapper, exiting...\" --urgency=critical
    exit 1
fi
$value \$@
"

  to="$wrappers_directory/$key"
  cmp --silent <(echo $CONTENTS) $to || (
    echo "$key wrapper changed, copying to $to..."
    echo $CONTENTS > $to
    chmod +x $to
  )
done
