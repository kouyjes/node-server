
const filePath = require('../file/file-path');
const config = {
  levels:{
    'server-console':'INFO',
    'server-sys':'INFO'
  },
  appenders: [
    {
      type: 'console',
      category: 'server-console'
    },
    {
      type: 'file',
      absolute: true,
      filename: filePath.resolve('log/node-server.log'),
      maxLogSize: 204800,
      backups: 10,
      category: 'server-sys'
    }
  ]
}
exports.config = config;