#!/bin/bash
# usage: restore.sh <dir> <path...> — put tracked files back to the committed version.
D=$1; shift; cd "$D" && git checkout -- "$@" && echo "restored: $*"
