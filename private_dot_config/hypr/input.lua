hl.config({
    input = {
        kb_layout = "us",
        kb_variant = "",
        kb_model = "",
        kb_options = "compose:ralt",
        kb_rules = "",
        follow_mouse = 1,
        touchpad = {
            natural_scroll = true,
            scroll_factor = 0.50,
        },
        sensitivity = 0,
    },
    gestures = {
        workspace_swipe_distance = 300,
        workspace_swipe_invert = true,
        workspace_swipe_min_speed_to_force = 5,
        workspace_swipe_cancel_ratio = 0.35,
        workspace_swipe_direction_lock = false,
        workspace_swipe_direction_lock_threshold = 12,
        workspace_swipe_forever = false,
        workspace_swipe_create_new = false,
    },
})

hl.device({
    name = "ven_2c2f:00-2c2f:0034-touchpad",
    sensitivity = 0.25,
    accel_profile = "adaptive",
    scroll_points = "0.20 0.0 0.25 0.40 0.65 1.00 1.00 1.45 1.30 2.00",
})

hl.gesture({ fingers = 3, direction = "horizontal", action = "workspace", scale = 1.0 })
