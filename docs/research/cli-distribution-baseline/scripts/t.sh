#!/bin/bash
# usage: LOGS=<dir> t.sh <id> <cwd> <command...>   logs to $LOGS/<id>.log and appends a row to $LOGS/index.tsv
id=$1; cwd=$2; shift 2
: "${LOGS:?set LOGS}"; : "${SANDBOX:?set SANDBOX}"
mkdir -p "$LOGS"
{ echo "\$ cd ${cwd/#$SANDBOX/\$SANDBOX}"; echo "\$ $*"; echo "----"; } > "$LOGS/$id.log"
( set -o pipefail; cd "$cwd" && eval "$@" ) >> "$LOGS/$id.log" 2>&1; code=$?
echo "---- exit $code" >> "$LOGS/$id.log"
sed -i '' "s#$SANDBOX#\$SANDBOX#g; s#$REPO#\$REPO#g; s#~#~#g" "$LOGS/$id.log"
printf '%s\t%s\t%s\n' "$id" "$code" "$*" >> "$LOGS/index.tsv"
echo "[$id] exit $code"; tail -n "${TAILN:-15}" "$LOGS/$id.log"
