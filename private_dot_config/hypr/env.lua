hl.config({
    xwayland = {
        force_zero_scaling = true,
    },
})

hl.env("XCURSOR_SIZE", "20")
hl.env("_JAVA_AWT_WM_NONREPARENTING", "1")
hl.env("QT_QPA_PLATFORM", "wayland")
hl.env("QT_QPA_PLATFORMTHEME", "gtk3")
hl.env("QT_QPA_PLATFORMTHEME_QT6", "gtk3")
hl.env("ELECTRON_OZONE_PLATFORM_HINT", "auto")
hl.env("TERMINAL", "ghostty")
hl.env("DMS_DISABLE_MATUGEN", "1")
