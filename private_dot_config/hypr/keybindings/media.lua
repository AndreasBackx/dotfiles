local bind = require("bind")

bind.exec("XF86AudioRaiseVolume", "wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%+", { repeating = true })
bind.exec("XF86AudioLowerVolume", "wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%-", { repeating = true })
bind.exec("XF86AudioMute", "wpctl set-mute @DEFAULT_AUDIO_SINK@ toggle")

bind.exec("XF86AudioPlay", "playerctl play-pause")
bind.exec("XF86AudioPause", "playerctl play-pause")
bind.exec("XF86AudioStop", "dbus-send --print-reply --dest=org.mpris.MediaPlayer2.spotify /org/mpris/MediaPlayer2 org.mpris.MediaPlayer2.Player.Stop")
bind.exec("XF86AudioPrev", "dbus-send --print-reply --dest=org.mpris.MediaPlayer2.spotify /org/mpris/MediaPlayer2 org.mpris.MediaPlayer2.Player.Previous")
bind.exec("XF86AudioNext", "dbus-send --print-reply --dest=org.mpris.MediaPlayer2.spotify /org/mpris/MediaPlayer2 org.mpris.MediaPlayer2.Player.Next")

bind.exec("XF86MonBrightnessUp", "brightnessctl set 5%+", { repeating = true })
bind.exec("XF86MonBrightnessDown", "brightnessctl set 5%-", { repeating = true })

for _, key in ipairs({ "F20", "F21", "XF86AudioMicMute", "XF86TouchpadToggle" }) do
    hl.bind(key, hl.dsp.pass({ window = "class:^(discord)$" }))
end
