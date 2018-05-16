#!/bin/bash
currentPath=`pwd`
serverPath=$(dirname "$0")
cd $serverPath
./mkdirs.sh
pidPath=../runtime/server.pid
IFS_OLD=$IFS
IFS=" "
if [ -e "$pidPath" ]
then
  pids=`cat $pidPath`
  for pid in $pids
  do
    if ps -p $pid > /dev/null 2>&1
    then
      kill $pid > /dev/null 2>&1
    fi
  done
fi
IFS=$IFS_OLD
echo "" > $pidPath
cd $currentPath


