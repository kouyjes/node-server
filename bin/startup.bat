set serverDir=%~df0
echo %serverDir%
set serverDir=%serverDir:bin\startup.bat=%
:startServer
echo 0>%serverDir%runtime\state
node %serverDir%slib/main.js
set /p state=<%serverDir%runtime\state
if not "%state%"=="break" goto startServer