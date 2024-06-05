#!/usr/bin/env zsh

from=$(realpath ~/.config/hypr/hyprland-shell.desktop)
to_directory="/usr/share/wayland-sessions"
to="$to_directory/hyprland-shell.desktop"

[ ! -d "$to_directory" ] && exit 0

cmp --silent $from $to || (
    echo "$from changed, copying to $to..."
    sudo cp $from $to
)

hyprland_log="/var/log/hyprland.log"
if [ ! -f "$hyprland_log" ]; then
    echo "$hyprland_log does not exist, creating it and setting ownership..."
    sudo touch "$hyprland_log" && sudo chown $USER:$GROUP "$hyprland_log"
fi
