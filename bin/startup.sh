#!/bin/bash
if node -v > /dev/null 2>&1
then
  currentPath=`pwd`
  serverPath=$(dirname "$0")
  cd "$serverPath"
  ./mkdirs.sh
  ./shutdown.sh
  sleep 1s
  node ../slib/main.js &
  cd $currentPath
else
  echo "node is not installed !"
fi

