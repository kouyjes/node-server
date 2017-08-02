#!/bin/bash
currentPath=`pwd`
serverPath=$(dirname "$0")
cd $serverPath
stateFile="../runtime/state"
echo "" > $stateFile
while true
do
    stateContent=`cat ../runtime/state`
    if [ "$stateContent" = "break" ]
    then
        break
    else
        node ../slib/main.js 
    fi
done
cd $currentPath
