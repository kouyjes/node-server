set serverDir=%~df0
echo %serverDir%
set serverDir=%serverDir:bin\startup.bat=%
:startServer
node %serverDir%slib/main.js