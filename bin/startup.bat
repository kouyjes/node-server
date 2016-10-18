set serverDir=%~df0
echo %serverDir%
set serverDir=%serverDir:bin\startup.bat=%
:startServer
echo 0>%serverDir%server-pid\state
node %serverDir%slib/main.js
set /p state=<%serverDir%server-pid\state
if not "%state%"=="break" goto startServer