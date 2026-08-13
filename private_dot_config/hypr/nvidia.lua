hl.env("NVD_BACKEND", "direct")
hl.env("__GLX_VENDOR_LIBRARY_NAME", "nvidia")

hl.config({
    cursor = {
        use_cpu_buffer = true,
    },
    misc = {
        vfr = 0,
    },
})
