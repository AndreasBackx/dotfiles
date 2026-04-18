return {
  {
    -- "Rubecula/nvim",
    name = "rubecula",
    dir = "~/dev/rubecula-nvim",
    dev = true,
    priority = 1000,
    opts = {
      -- variant = "auto",
    },
  },
  {
    "LazyVim/LazyVim",
    opts = {
      colorscheme = "rubecula",
    },
  },
}
