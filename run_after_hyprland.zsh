#!/usr/bin/env zsh

if [ ! -f /usr/share/wayland-sessions/hyprland-shell.desktop ]; then
  sudo ln -s ~/.config/hypr/hyprland-shell.desktop /usr/share/wayland-sessions/hyprland-shell.desktop
fi
