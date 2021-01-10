const cron = require('node-cron');
const player = require('play-sound')(opts = {});
const winston = require('winston');

const config = require('./config.json');

const formatLog = winston.format.printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
});

const logger = winston.createLogger({
    level: 'info',
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.prettyPrint(),
            formatLog
          )
      })
    ],
  });
  

const playAudio = (audioFile) => {
    player.play(audioFile, function(err){
        if (err) {
            logger.error(`error playing file: ${err.toString()}`);
        }
    });
}

const parseTime = (timeStr, defaultReminderMinutes) => {
    // parse
    var timeParts = timeStr.split(':');

    // subtract the default reminder minutes
    let hour = parseInt(timeParts[0]);
    let minute = parseInt(timeParts[1]);
    let totalMinutes = hour * 60 + minute;
    totalMinutes -= defaultReminderMinutes; // subtract minutes before time to set reminder
    hour = Math.floor(totalMinutes / 60);
    minute = totalMinutes - (hour * 60);
    
    return {
        hour: hour,
        minute: minute
    }
}

let setSchedule = (scheduleObj) => {
    let time = parseTime(scheduleObj.time, config.defaultReminderMinutes);
    // sec, min, hour, day, month, dayofweek
    logger.info(`scheduling time for "${scheduleObj.label}": (0 ${time.minute} ${time.hour} * * ${scheduleObj.daysOfWeek})`);
    cron.schedule(`0 ${time.minute} ${time.hour} * * ${scheduleObj.daysOfWeek}`, () => {
        logger.info(`trigger time ${scheduleObj.time} for ${scheduleObj.label}`);
        if (config.defaultBell) {
            playAudio(config.defaultBell);
        }
        setTimeout(() => {
            playAudio(scheduleObj.audioFile);
        }, 1000);
    });
}

// for each schedule, setup a cron job
config.schedule.forEach(setSchedule);


// testing the audio files
let testAudio = () => {
    let timeout = 3000;
    let i = 0;
    config.schedule.forEach((scheduleObj) => {
        setTimeout(() => {
            logger.info(`playing audio: ${scheduleObj.audioFile}`);
            playAudio(scheduleObj.audioFile)
        }, timeout * i++);
        
    });
}

// testAudio();