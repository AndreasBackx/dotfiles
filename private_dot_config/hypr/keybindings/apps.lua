local bind = require("bind")

bind.exec("SUPER + Return", "ghostty || kitty-cwd || kitty")
bind.exec("SUPER + SHIFT + Return", "pypr toggle dropterm")

bind.exec("SUPER + D", "pkill rofi; rofi -show run")
bind.exec("SUPER + Space", "pkill rofi; rofi -show run")
bind.exec("SUPER + CTRL + Space", "emoji")
bind.exec("SUPER + A", "rofai")
bind.exec("SUPER + C", "rofi -show calc -modi calc -no-show-match -no-sort")
bind.exec("SUPER + O", "ottolangy")

bind.exec("SUPER + SHIFT + E", "power-options selection")
bind.exec("SUPER + SHIFT + O", "monitor-profiles selection")

bind.exec("SUPER + SHIFT + S", "screenshot")
bind.exec("SUPER + SHIFT + CTRL + S", "grim - | wl-copy")

bind.exec("CTRL + Space", "makoctl dismiss")
bind.exec("CTRL + Grave", "makoctl restore")
bind.exec("CTRL + SHIFT + Space", "1password --quick-access")
bind.exec("SUPER + L", "loginctl lock-session")
bind.exec("SUPER + SHIFT + C", "upload")

bind.exec("SUPER + ALT + D", 'echo "start" > /home/andreas/.config/hyprwhspr/recording_control')
bind.exec("SUPER + ALT + D", 'echo "stop" > /home/andreas/.config/hyprwhspr/recording_control', { release = true })
