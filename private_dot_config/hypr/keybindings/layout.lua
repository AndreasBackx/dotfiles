hl.bind("SUPER + Q", hl.dsp.window.close())
hl.bind("SUPER + F", hl.dsp.window.float())
hl.bind("SUPER + P", hl.dsp.window.pin())

hl.bind("SUPER + left", hl.dsp.focus({ workspace = "m-1" }))
hl.bind("SUPER + right", hl.dsp.focus({ workspace = "m+1" }))
hl.bind("SUPER + mouse_down", hl.dsp.focus({ workspace = "e+1" }))
hl.bind("SUPER + mouse_up", hl.dsp.focus({ workspace = "e-1" }))

hl.bind("SUPER + mouse:272", hl.dsp.window.drag())
hl.bind("SUPER + SHIFT + mouse:272", hl.dsp.window.resize())
hl.bind("SUPER + mouse:273", hl.dsp.window.resize())

hl.bind("SUPER + SHIFT + F", hl.dsp.window.fullscreen())
