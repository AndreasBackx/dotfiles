return {
  "nvim-lualine/lualine.nvim",
  dependencies = { "nvim-tree/nvim-web-devicons" },
  opts = {
    winbar = {
      lualine_a = {},
      lualine_b = {},
      lualine_c = {
        {
          "filename",
          path = 1,
          shorting_target = 0,
        },
      },
      lualine_x = {},
      lualine_y = {},
      lualine_z = {},
    },

    inactive_winbar = {
      lualine_a = {},
      lualine_b = {},
      lualine_c = {
        {
          "filename",
          path = 1,
          shorting_target = 0,
        },
      },
      lualine_x = {},
      lualine_y = {},
      lualine_z = {},
    },
  },
}
