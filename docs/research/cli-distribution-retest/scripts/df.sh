#!/bin/bash
# usage: df.sh <dir> — tracked-file diff stat and the src/index.ts diff.
cd "$1" && git --no-pager diff --stat && git --no-pager diff -- src/index.ts | head -14
