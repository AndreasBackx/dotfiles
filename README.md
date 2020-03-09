
# Dotfiles

This repository contains most if not all of the changes made to my machines that run Arch Linux, Ubuntu, or CentOS, but primarily Arch Linux as it's what I use on my personal computers.

### Other changes

These are some changes made elsewhere in the system that are not easy to incorporate in the repository otherwise.

#### Disable HDMI output so it doesn't get switched to by PulseAudio

```toml
# /etc/modprobe.d/blacklist.conf
blacklist snd_hda_intel
blacklist snd_hda_codec_hdmi
```
