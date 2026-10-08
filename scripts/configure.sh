#!/bin/sh
# Run from a build directory; normally called by bun run build:sim/build:ipod.
set -e
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
"$ROOT/system/tools/configure" "$@"
{ echo 'export CLASSICOS=1'; cat Makefile; } > Makefile.tmp
mv Makefile.tmp Makefile
