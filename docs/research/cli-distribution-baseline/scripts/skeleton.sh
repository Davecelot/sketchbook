#!/bin/bash
# usage: skeleton.sh <project> <source-repo> <cli-args...>
# Runs the CLI; each time it fails on a missing file, copies that file from the source repo and retries.
P=$1; SRC=$2; shift 2
cd "$P" || exit 1
for i in $(seq 1 40); do
  out=$(node harness/cli.mjs "$@" --json 2>&1)
  m=$(echo "$out" | grep -oE "(open|scandir|lstat|stat) '[^']+'" | head -1 | sed -E "s#^[a-z]+ '##; s#'\$##; s#^$P/##")
  [ -z "$m" ] && break
  case "$m" in /*) echo "outside project: $m"; break;; esac
  if [ -e "$SRC/$m" ]; then echo "added: $m"; mkdir -p "$(dirname "$m")"; cp -R "$SRC/$m" "$m"; else echo "missing, no source: $m"; break; fi
done
echo "$out" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s.slice(s.indexOf("{")));console.log("ok:",j.ok,"errors:",JSON.stringify(j.errors).slice(0,400))}catch{console.log(s.slice(0,600))}})'
