hl.config({
    general = {
        gaps_in = 0,
        gaps_out = 0,
        border_size = 0,
        col = {
            active_border = { colors = { "rgba(33ccffee)", "rgba(00ff99ee)" }, angle = 45 },
            inactive_border = "rgba(595959aa)",
        },
        layout = "dwindle",
    },
    decoration = {
        rounding = 0,
        blur = {
            enabled = false,
        },
    },
    animations = {
        enabled = true,
    },
    misc = {
        disable_hyprland_logo = true,
        disable_splash_rendering = true,
        mouse_move_enables_dpms = true,
        key_press_enables_dpms = true,
        background_color = "rgb(000000)",
        middle_click_paste = false,
    },
})

hl.curve("overshot", { type = "bezier", points = { { 0.05, 0.9 }, { 0.1, 1.05 } } })
hl.curve("smoothOut", { type = "bezier", points = { { 0.36, 0 }, { 0.66, -0.56 } } })
hl.curve("smoothIn", { type = "bezier", points = { { 0.25, 1 }, { 0.5, 1 } } })
hl.curve("macos_ws", { type = "bezier", points = { { 0.22, 0.9 }, { 0.12, 1 } } })

hl.animation({ leaf = "windows", enabled = true, speed = 2, bezier = "overshot", style = "gnomed" })
hl.animation({ leaf = "windowsOut", enabled = true, speed = 2, bezier = "smoothOut", style = "gnomed" })
hl.animation({ leaf = "layers", enabled = true, speed = 3, bezier = "default", style = "popin" })
hl.animation({ leaf = "windowsMove", enabled = true, speed = 2, bezier = "default" })
hl.animation({ leaf = "border", enabled = true, speed = 2, bezier = "default" })
hl.animation({ leaf = "fade", enabled = true, speed = 2, bezier = "smoothIn" })
hl.animation({ leaf = "fadeLayersIn", enabled = false })
hl.animation({ leaf = "fadeLayersOut", enabled = true, speed = 2, bezier = "smoothOut" })
hl.animation({ leaf = "fadeDim", enabled = true, speed = 2, bezier = "smoothIn" })
hl.animation({ leaf = "workspaces", enabled = true, speed = 5, bezier = "macos_ws", style = "slide" })

hl.layer_rule({ name = "notifications", match = { namespace = "notifications" }, animation = "slide right" })
hl.layer_rule({ name = "wayshot", match = { namespace = "wayshot" }, no_anim = true })
hl.layer_rule({ name = "wayshot-selection", match = { namespace = "osk" }, no_anim = true })
hl.layer_rule({ name = "grim-selection", match = { namespace = "selection" }, no_anim = true })
hl.layer_rule({ name = "hyprpicker-hyprshot", match = { namespace = "hyprpicker" }, no_anim = true })
hl.layer_rule({ name = "bar-top", match = { namespace = "^ags-bar-top.*" }, animation = "slide top" })
hl.layer_rule({ name = "bar-bottom", match = { namespace = "^ags-bar-bottom.*" }, animation = "slide bottom" })
