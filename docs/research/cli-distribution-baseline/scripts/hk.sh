#!/bin/bash
# usage: hk.sh <project>  — is the pre-commit check active in a fresh repository?
cd "$1" || exit 1
[ -d .git ] || git init -q
v=$(git config --local core.hooksPath)
if [ -n "$v" ]; then echo "core.hooksPath=$v"; else echo "core.hooksPath unset: .githooks/pre-commit never runs (only npm install's prepare script sets it)"; fi
