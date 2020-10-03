var mkdirp = require('mkdirp');
var winston = require('winston');
var fs = require('fs');
var getDirName = require('path').dirname;

const PATH = './config/winston.json'

var options = {
  file: {
    level: 'info',
    handleExceptions: true,
    filename: `./logs/app.log`,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false,
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
  },
};

if (fs.existsSync(PATH)) 
{
  const rawData = fs.readFileSync(PATH);
  options = JSON.parse(rawData);
}

mkdirp(getDirName(PATH));

// instantiate a new Winston Logger with the settings defined above
var logger = winston.createLogger({
  transports: [
    new winston.transports.File(options.file),
    new winston.transports.Console(options.console)
  ],
  exitOnError: false, // do not exit on handled exceptions
});

winston.add(logger);

module.exports = logger;