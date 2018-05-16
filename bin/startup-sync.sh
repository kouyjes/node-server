#!/bin/bash
if node -v
then
  currentPath=`pwd`
  serverPath=$(dirname "$0")
  cd $serverPath
  node ../slib/main.js
else
  echo "node is not installed !"
  exit 127
fi
