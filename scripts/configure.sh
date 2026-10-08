#!/bin/sh
# Run from an empty build dir, e.g.:
#   mkdir build-pp-sim && cd build-pp-sim && ../apps/classicos/configure.sh --target=ipodvideo --type=s
set -e
"$(dirname "$0")/../../tools/configure" "$@"
{ echo 'export CLASSICOS=1'; cat Makefile; } > Makefile.tmp && mv Makefile.tmp Makefile
