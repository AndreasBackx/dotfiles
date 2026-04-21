local dir = "/usr/share/fb-editor-support/nvim"

if vim.fn.isdirectory(dir) == 0 then
  return {}
end

return {
  {
    dir = dir,
    name = "meta.nvim",
    dependencies = {
      "neovim/nvim-lspconfig",
      "nvim-telescope/telescope.nvim",
      "nvim-lua/plenary.nvim",
      "nvim-treesitter/nvim-treesitter",
    },
    config = function()
      require("meta").setup()

      require("meta.lsp")
      vim.lsp.enable({
        "rust-analyzer@meta",
        "fb-pyright-ls@meta",
        "pyre@meta",
        "pyre-codenav@meta",
        "thriftlsp@meta",
        "cppls@meta",
        "buckls@meta",
        "buck2@meta",
        -- "erlang@meta",
        "gopls@meta",
        "eslint@meta",
        "prettier@meta",
        "flow@meta",
        "hhvm",
        "linttool@meta",
        -- "sourcekit-lsp@meta",
        "relay@meta",
        -- "kotlin@meta",
      })

      require("meta.keymaps")
      require("meta.cmds")

      require("telescope").load_extension("myles")
      require("telescope").load_extension("biggrep")
      require("telescope").load_extension("hg")

      require("meta.hg").setup()
    end,
  },
  {
    "nvimtools/none-ls.nvim",
    dependencies = { dir = dir, name = "meta.nvim" },
    config = function()
      local meta = require("meta")
      local null_ls = require("null-ls")

      null_ls.setup({
        sources = {
          meta.null_ls.diagnostics.arclint,
          meta.null_ls.formatting.arclint,
        },
      })
    end,
  },
  {
    "saghen/blink.cmp",
    opts = {
      fuzzy = {
        prebuilt_binaries = {
          proxy = {
            url = "http://fwdproxy:8080",
          },
        },
      },
      sources = {
        default = {
          "meta_title",
          "meta_tags",
          "meta_tasks",
          "meta_revsub",
        },
        providers = {
          meta_title = {
            name = "MetaTitle",
            module = "meta.cmp.title",
          },
          meta_tags = {
            name = "MetaTags",
            module = "meta.cmp.tags",
          },
          meta_tasks = {
            name = "MetaTasks",
            module = "meta.cmp.tasks",
          },
          meta_revsub = {
            name = "MetaRevSub",
            module = "meta.cmp.revsub",
          },
        },
      },
    },
    opts_extend = { "sources.default" },
  },
}
