var constants = require("./MapReduceConstantsNode.js");


/**
 *  * Given a message and a timestamp, it logs the operation,
 * or error to the db.
 * @param {string} type can be either error,message, or optime
 * @param {*} operation that called this function
 * @param {*} sd code of the URL where this funciton is operating
 * @param {*} message to store
 * @param {*} startTimems if given, the start of the operation to store
 * @param {*} endTimems  if given, the end of the operation to store
 */
function logMessage(type, operation, sd, message, startTimems, endTimems) {
  constants.connectAndValidateNodeJs(function (err, db) {
    if (err) return console.error("initialiseDB() ERROR connecting to DB" + err);
    logDocument = {
      type,
      operation,
      sd,
      message,
      startTimems,
      startTime = datestampToReadable(startTimems),
      endTimems,
      endTime = datestampToReadable(endTimems)
    };
    db.collection(constants.mongoLogCollection).insert(logDocument, function (err, records) {
      if (err) return console.error("logMessage() ERROR INSERTING LOG DOCUMENT " + err);
      else console.log("logMessage() new Log document stored correctly");
    });
  });
}

/**
 * Given an epoch date, it returns a readable format of the date
 * @param {epoch date} datems 
 */
function datestampToReadable(datems) {
  var currentDate = new Date(datems);
  return currentDate.getFullYear() + "-" + completeDateVals(currentDate.getMonth() + 1) + "-"
    + completeDateVals(currentDate.getDate()) + "," + completeDateVals(currentDate.getHours())
    + ":" + completeDateVals(currentDate.getMinutes())
    + ":" + completeDateVals(currentDate.getSeconds())
    + ":" + completeDateValsMilliseconds(currentDate.getMilliseconds());
}

module.exports.logMessage = logMessage;
