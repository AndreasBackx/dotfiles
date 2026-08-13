local bind = require("bind")

bind.exec("XF86AudioRaiseVolume", "dms ipc call audio increment 3", { locked = true, repeating = true })
bind.exec("XF86AudioLowerVolume", "dms ipc call audio decrement 3", { locked = true, repeating = true })
bind.exec("XF86AudioMute", "dms ipc call audio mute", { locked = true })
bind.exec("XF86AudioMicMute", "dms ipc call mic mute", { locked = true })

bind.exec("XF86AudioPlay", "dms ipc call mpris playPause", { locked = true })
bind.exec("XF86AudioPause", "dms ipc call mpris playPause", { locked = true })
bind.exec("XF86AudioStop", "dms ipc call mpris stop", { locked = true })
bind.exec("XF86AudioPrev", "dms ipc call mpris previous", { locked = true })
bind.exec("XF86AudioNext", "dms ipc call mpris next", { locked = true })

bind.exec("XF86MonBrightnessUp", 'dms ipc call brightness increment 5 ""', { locked = true, repeating = true })
bind.exec("XF86MonBrightnessDown", 'dms ipc call brightness decrement 5 ""', { locked = true, repeating = true })

for _, key in ipairs({ "F20", "F21", "XF86TouchpadToggle" }) do
    hl.bind(key, hl.dsp.pass({ window = "class:^(discord)$" }))
end
