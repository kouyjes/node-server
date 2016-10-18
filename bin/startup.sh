#!/bin/bash
currentPath=`pwd`
serverPath=$(dirname "$0")
cd $serverPath
./shutdown.sh 
echo "starting web ..."
sleep 2s
nohup  ./startup-sync.sh &
echo "startup success !"
cd $currentPath
