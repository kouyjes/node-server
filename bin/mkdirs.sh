#!/bin/bash
currentPath=`pwd`
serverPath=$(dirname "$0")
cd $serverPath
dirs=("../runtime" "../log")
for dir in ${dirs[*]}
do
  if [ ! -d $dir ]
  then
    mkdir $dir
  fi
done

