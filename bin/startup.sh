#!/bin/bash
log_file="../log/console.log"
if node -v > /dev/null 2>&1
then
  currentPath=`pwd`
  serverPath=$(dirname "$0")
  cd "$serverPath"
  ./mkdirs.sh
  ./shutdown.sh
  sleep 1s
  echo "" > $log_file
  ./startup-sync.sh > $log_file 2>&1 &
  cd $currentPath
else
  echo "node is not installed !"
fi

