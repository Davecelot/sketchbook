#!/bin/bash
# usage: cl.sh <source-repo> <dest> — the fork/clone path that works today (control case).
rm -rf "$2"; git clone -q "$1" "$2" && cd "$2" && ln -s $REPO_NODE_MODULES node_modules && echo "cloned $(git rev-parse --short HEAD), $(git ls-files | wc -l | tr -d ' ') tracked files"
