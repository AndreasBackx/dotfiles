
# Sway to use legacy mode for gamma changing for redshift
export WLR_DRM_NO_ATOMIC=1

if [ -z "$DISPLAY" ] && [ -n "$XDG_VTNR" ] && [ "$XDG_VTNR" -eq 1 ]; then
  exec sway > /var/log/sway.log 2>&1
fi
