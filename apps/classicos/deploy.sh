#!/bin/sh
# Install a classicOS build on a mounted iPod running the Rockbox bootloader.
#   apps/classicos/deploy.sh <build dir> "/Volumes/<iPod>"
# Backs up the existing firmware to .rockbox/rockbox.ipod.orig once. Only
# .rockbox/ is touched; the bootloader and Apple firmware stay as they are.
set -e
B="$1"; V="$2"
[ -f "$B/rockbox.ipod" ] || { echo "no rockbox.ipod in $B"; exit 1; }
[ -d "$V/.rockbox" ] || { echo "not a Rockbox iPod: $V"; exit 1; }
[ -f "$V/.rockbox/rockbox.ipod.orig" ] || cp "$V/.rockbox/rockbox.ipod" "$V/.rockbox/rockbox.ipod.orig"
cp "$B/rockbox.ipod" "$V/.rockbox/rockbox.ipod"
mkdir -p "$V/.rockbox/classicos"
cp -R "$B/classicos/data/." "$V/.rockbox/classicos/"
sync
diskutil eject "$V"
