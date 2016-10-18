set serverDir=%~df0
echo "shutdow server ..."
ping 127.0.0.1 -n 3 >nul
set serverDir=%serverDir:bin\shutdown.bat=%
set /p pidContent=<%serverDir%server-pid\server.pid
echo process pid:%pidContent%
echo break>%serverDir%server-pid\state
taskkill /F -pid %pidContent%
echo 0>%serverDir%server-pid\server.pid


