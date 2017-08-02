#!/bin/bash
currentPath=`pwd`
serverPath=$(dirname "$0")
cd $serverPath
echo "break" > ../runtime/state
pid=`pgrep startup-sync.sh`
kill $pid
pid=`pgrep node`
kill $pid
cd $currentPath


