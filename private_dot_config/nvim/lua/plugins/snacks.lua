return {
  "folke/snacks.nvim",
  opts = {
    picker = {
      win = {
        input = {
          keys = {
            ["<c-a>"] = { "<home>", mode = "i", expr = true, desc = "beginning of line" },
            ["<c-e>"] = { "<end>", mode = "i", expr = true, desc = "end of line" },
            ["<c-b>"] = { "<left>", mode = "i", expr = true, desc = "move left" },
            ["<c-f>"] = { "<right>", mode = "i", expr = true, desc = "move right" },
            ["<c-u>"] = { "<c-u>", mode = "i", expr = true, desc = "delete before cursor" },
            ["<c-k>"] = { "<c-o>D", mode = "i", expr = true, desc = "delete after cursor" },
            ["<c-w>"] = { "<c-s-w>", mode = "i", expr = true, desc = "delete word before cursor" },
            ["<c-d>"] = { "<del>", mode = "i", expr = true, desc = "delete char" },
            ["<c-h>"] = { "<bs>", mode = "i", expr = true, desc = "backspace" },
            ["<c-y>"] = { "<c-r>\"", mode = "i", expr = true, desc = "paste" },
            ["<c-p>"] = { "history_back", mode = "i", desc = "previous history" },
            ["<c-n>"] = { "history_forward", mode = "i", desc = "next history" },
            ["<a-b>"] = { "<c-left>", mode = "i", expr = true, desc = "word left" },
            ["<a-f>"] = { "<c-right>", mode = "i", expr = true, desc = "word right" },
            ["<a-d>"] = { "<c-o>de", mode = "i", expr = true, desc = "delete word forward" },
            ["<a-bs>"] = { "<c-s-w>", mode = "i", expr = true, desc = "delete word backward" },
            ["<a-backspace>"] = { "<c-s-w>", mode = "i", expr = true, desc = "delete word backward" },
          },
        },
      },
      sources = {
        explorer = {
          hidden = true,
          ignored = true,
        },
      },
    },
  },
}
