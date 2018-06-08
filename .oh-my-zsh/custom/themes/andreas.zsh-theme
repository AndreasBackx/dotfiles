PROMPT='%F{9}%c ➤ %f'
RPROMPT='%{%F{10}%}%p $(git_prompt_info)%{%F{11}%}[%T]%{$reset_color%}'

ZSH_THEME_GIT_PROMPT_PREFIX=""
ZSH_THEME_GIT_PROMPT_SUFFIX=" "
ZSH_THEME_GIT_PROMPT_DIRTY="*"
ZSH_THEME_GIT_PROMPT_CLEAN=""

# See http://geoff.greer.fm/lscolors/
# export LSCOLORS="gxfxcxdxbxbxbxbxbxbxbx" # We don't want BSD color shit
LS_COLORS="di=96:ln=95:so=92:pi=93:ex=91:bd=91:cd=91:su=91:sg=91:tw=91:ow=91:"

export LS_COLORS
export PROMPT_EOL_MARK=""
