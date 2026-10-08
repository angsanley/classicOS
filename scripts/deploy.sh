#!/bin/sh
# Install a classicOS build (firmware, codecs, app data) on a mounted iPod
# running the Rockbox bootloader.
#   scripts/deploy.sh <build dir> "/Volumes/<iPod>"
# Backs up the existing firmware and codecs (rockbox.ipod.orig, codecs.orig)
# once, so the previous Rockbox can be restored. Only
# .rockbox/ is touched; the bootloader and Apple firmware stay as they are.
set -e
B="$1"; V="$2"
[ -f "$B/rockbox.ipod" ] || { echo "no rockbox.ipod in $B"; exit 1; }
[ -d "$V/.rockbox" ] || { echo "not a Rockbox iPod: $V"; exit 1; }
# Back up once. Listing the directory avoids opening the backup itself
# (stat on it has hit flaky sectors on an old HDD).
ls "$V/.rockbox" | grep -qx rockbox.ipod.orig || cp "$V/.rockbox/rockbox.ipod" "$V/.rockbox/rockbox.ipod.orig"
cp "$B/rockbox.ipod" "$V/.rockbox/rockbox.ipod"
# Codecs must match the firmware's codec API version.
ls "$V/.rockbox" | grep -qx codecs.orig || [ ! -d "$V/.rockbox/codecs" ] || cp -R "$V/.rockbox/codecs" "$V/.rockbox/codecs.orig"
mkdir -p "$V/.rockbox/codecs"
cp "$B"/lib/rbcodec/codecs/*.codec "$V/.rockbox/codecs/"
mkdir -p "$V/.rockbox/classicos"
cp -R "$B/classicos/data/." "$V/.rockbox/classicos/"
cp "$(dirname "$0")/../host/tagnavi_user.config" "$V/.rockbox/"
sync
cmp "$B/rockbox.ipod" "$V/.rockbox/rockbox.ipod"
echo "deployed and verified"
diskutil eject "$V"
