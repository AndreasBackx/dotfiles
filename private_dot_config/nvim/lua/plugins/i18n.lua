return {
  -- "yelog/i18n.nvim",
  dir = "/home/andreas/dev/i18n.nvim",
  dependencies = {
    "nvim-treesitter/nvim-treesitter",
    -- optional pickers:
    -- 'ibhagwan/fzf-lua',
    -- 'nvim-telescope/telescope.nvim',
  },
  keys = {
    {
      "gI",
      function()
        require("i18n").i18n_definition()
      end,
      desc = "i18n definition",
    },
    {
      "<leader>i",
      desc = "i18n",
    },
    {
      "<leader>I",
      function()
        require("i18n").i18n_keys()
      end,
      desc = "i18n keys",
    },
    {
      "<leader>ik",
      function()
        require("i18n").i18n_keys()
      end,
      desc = "keys",
    },
    {
      "<leader>il",
      function()
        require("i18n").next_locale()
      end,
      desc = "next locale",
    },
    {
      "<leader>it",
      function()
        require("i18n").toggle_translation()
      end,
      desc = "toggle translation",
    },
    {
      "<leader>io",
      function()
        require("i18n").toggle_origin()
      end,
      desc = "toggle origin",
    },
    {
      "<leader>ip",
      function()
        require("i18n").show_popup()
      end,
      desc = "i18n popup",
    },
    {
      "<leader>id",
      function()
        require("i18n").i18n_definition()
      end,
      desc = "definition",
    },
    {
      "<leader>iu",
      function()
        require("i18n").i18n_key_usages()
      end,
      desc = "usages",
    },
  },
  config = function()
    require("i18n").setup({
      locales = { "nl", "en-BE", "nl-BE", "nl-NL", "fr-BE" },
      sources = {
        "shared/locales/src/{locales}.json",
        --"shared/locales/dist/locales/stamhoofd/{locales}.json",
      },
      auto_detect = false,
      usage = {
        scan_on_startup = false,
      },
      func_pattern = {
        { call = "$t", quotes = { "'", '"', "`" } },
        { call = "t", quotes = { "'", '"', "`" } },
      },
      namespace_resolver = false,
    })
  end,
}
