#!/bin/bash
# usage: intree.sh <dir> — prints the repository root that contains <dir>, or "not in a repository".
git -C "$1" rev-parse --show-toplevel 2>/dev/null || echo "not in a repository"
