#!/bin/bash
currentPath=`pwd`
serverPath=$(dirname "$0")
cd $serverPath
stateFile="../server-pid/state"
echo "" > $stateFile
while true
do
    stateContent=`cat ../server-pid/state`
    if [ "$stateContent" = "break" ]
    then
        break
    else
        node ../slib/main.js 
    fi
done
cd $currentPath
