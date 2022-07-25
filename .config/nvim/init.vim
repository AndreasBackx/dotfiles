"set nocompatible            " disable compatibility to old-time vi
"set showmatch               " show matching brackets.
"set ignorecase              " case insensitive matching
""set mouse=v                 " middle-click paste with mouse
"set hlsearch                " highlight search results
"set autoindent              " indent a new line the same amount as the line just typed
"set number                  " add line numbers
"set wildmode=longest,list   " get bash-like tab completions
"set cc=80,100               " set an 80 column border for good coding style
"filetype plugin indent on   " allows auto-indenting depending on file type
"set tabstop=4               " number of columns occupied by a tab character
"set expandtab               " converts tabs to white space
"set shiftwidth=4            " width for autoindents
"set softtabstop=4           " see multiple spaces as tabstops so <BS> does the right thing



call plug#begin('~/.config/nvim/plugged')
Plug 'junegunn/fzf', { 'do': { -> fzf#install() } }
Plug 'junegunn/fzf.vim'
Plug 'neoclide/coc.nvim', { 'branch': 'release' }
Plug 'antoinemadec/coc-fzf'
Plug 'tpope/vim-fugitive'
Plug 'tpope/vim-abolish'
Plug 'tpope/vim-surround'
Plug 'jiangmiao/auto-pairs'
Plug 'preservim/nerdtree'
Plug 'preservim/nerdcommenter'
Plug 'editorconfig/editorconfig-vim'
"Plug 'nvim-treesitter/nvim-treesitter', {'do': ':TSUpdate'}
Plug 'vim-test/vim-test'
Plug 'benmills/vimux'
Plug 'arcticicestudio/nord-vim'
Plug 'vim-airline/vim-airline'
Plug 'vim-airline/vim-airline-themes'
Plug 'sheerun/vim-polyglot'
Plug 'machakann/vim-highlightedyank'
Plug 'mg979/vim-visual-multi', {'branch': 'master'}
Plug 'kana/vim-textobj-user'
Plug 'whatyouhide/vim-textobj-xmlattr'
Plug 'jbyuki/venn.nvim'
Plug 'github/copilot.vim'
Plug 'overcache/NeoSolarized'
call plug#end()

syntax on
filetype plugin indent on

set encoding=utf-8
set autoindent

let mapleader = " "

" Neovim config
" Open current config
nnoremap <leader>rc :vsp ~/.config/nvim/init.vim<CR>
" Reload config
nnoremap <leader><CR> :source ~/.config/nvim/init.vim<CR>

" Use ctrl+\ to toggle comments
nmap <C-/> <Plug>NERDCommenterToggle
vmap <C-/> <Plug>NERDCommenterToggle<CR>gv

" Undo and redo
nnoremap <C-z> :undo<CR>
inoremap <C-z> <C-O>u<CR>
nnoremap <C-Z> :redo<CR>
inoremap <C-Z> <C-O>:redo<CR>
