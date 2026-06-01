const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

// Determine the log level based on environment
const logLevel = process.env.DEBUG === 'true' ? 'debug' : (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Create a Winston logger with daily rotate file transport
const logger = winston.createLogger({
  level: logLevel,  // Dynamic log level
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: [
    // Daily rotate file for logLevel level and above
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '15d'  // Keep logs for 15 days
    }),
    // Separate file for error logs (above file will still contain error logs)
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d'  // Keep error logs for 30 days
    }),
    // Optionally, add logging to the console in development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
      ),
      level: 'debug'  // Console logs at debug level
    })
  ]
});

// Export the logger instance for use in other files
module.exports = logger;
