local bind = require("bind")

bind.exec("SUPER + Return", "ghostty || kitty-cwd || kitty")
bind.exec("SUPER + SHIFT + Return", "pypr toggle dropterm")

bind.exec("SUPER + Space", "dms ipc call spotlight toggle")
bind.exec("SUPER + D", "dms ipc call spotlight toggle")
bind.exec("SUPER + V", "dms ipc call clipboard toggle")
bind.exec("SUPER + M", "dms ipc call processlist focusOrToggle")
bind.exec("SUPER + Comma", "dms ipc call settings focusOrToggle")
bind.exec("SUPER + N", "dms ipc call notifications toggle")
bind.exec("SUPER + Y", "dms ipc call dankdash wallpaper")
bind.exec("SUPER + Tab", "dms ipc call hypr toggleOverview")
bind.exec("SUPER + CTRL + Space", "emoji")
bind.exec("SUPER + A", "rofai")
bind.exec("SUPER + C", "rofi -show calc -modi calc -no-show-match -no-sort")
bind.exec("SUPER + O", "ottolangy")

bind.exec("SUPER + SHIFT + E", "dms ipc call powermenu toggle")
bind.exec("SUPER + SHIFT + O", "dms ipc call settings openWith displays")

bind.exec("SUPER + SHIFT + S", "screenshot")
bind.exec("SUPER + SHIFT + CTRL + S", "grim - | wl-copy")

bind.exec("CTRL + SHIFT + Space", "1password --quick-access")
bind.exec("SUPER + L", "dms ipc call lock lock")
bind.exec("SUPER + SHIFT + C", "upload")

bind.exec("SUPER + ALT + D", 'echo "start" > /home/andreas/.config/hyprwhspr/recording_control')
bind.exec("SUPER + ALT + D", 'echo "stop" > /home/andreas/.config/hyprwhspr/recording_control', { release = true })
