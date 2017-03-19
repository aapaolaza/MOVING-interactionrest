///Same as MapReduceConstants, but I changed it so it can be used with Node JS  http://stackoverflow.com/questions/5625569/include-external-js-file-in-node-js-app

///Module exports to act as interface can be found at the end, after all variables and functions are defined
var MongoClient = require('mongodb').MongoClient
  , Server = require('mongodb').Server;

//This tag can be found in the "msg" field in the current ops command of MapReduce commands
const mapReduceTag = "m/r";
const xmlQueryResults = "xmlQueryResults";
const xmlQueryCatalog = "xmlQueryCatalog";

const mongoLogCollection = "log";

//This prefix will be added to all queries
const queryCollectionPrefix = "xmlQuery_"

///MongoDB connection info
const mongoPath = "localhost/ucivitdb";//SERVERIP/DATABASENAME
const mongoAuthenticateDB = "admin";//DO NOT CHANGE
const mongoQueryDB = "ucivitdb";
const mongoUser = "DBUSERNAME";
const mongoPass = "DBPASSWORD";

const mongoTimeout = 300000;//0

const userCollection = "activeUsers";
const eventCollection = "events";

//web site to be analysed, determined by its "sd" value. 10002 is kupb, 10006 is CS
const websiteId = "10006";


/** Connects to the database, authenticates the connection against the correspondent
 * This function is not available to NodeJs in the interface
 * as it won't work 
 * */
function connectAndValidate() {
  connect(mongoPath);

  if (mongoUser !== "" && mongoUser !== "DBUSERNAME") {
    print("Authentication is required");
    db = db.getSiblingDB(mongoAuthenticateDB);
    db.auth(mongoUser, mongoPass);
    db = db.getSiblingDB(mongoQueryDB);
  }
  else {
    db = db.getSiblingDB(mongoQueryDB);
  }
  console.log("connection secured");
  return db;
}

/**
 * Connect to the mongoDB and authenticate (if necessary)
 */
function connectAndValidateNodeJs(callback) {
  //var mongoclient = new MongoClient(new Server(mongoPath), {native_parser: true});

  mongoConnectionPath = mongoPath;
  //For authentication we add the parameter to the mongoPath
  //From http://mongodb.github.io/node-mongodb-native/2.0/tutorials/connecting/
  //Authentication > Indirectly Against Another Database
  if (mongoUser !== "" && mongoUser !== "DBUSERNAME")
    mongoConnectionPath = mongoUser + ":" + mongoPass + "@" + mongoPath
      + "?authSource=" + mongoAuthenticateDB;

  var options = { 
    server: { 
      socketOptions: { 
        keepAlive: mongoTimeout, connectTimeoutMS: mongoTimeout 
      } 
    }, 
    replset: { 
      socketOptions: { 
        keepAlive: mongoTimeout, 
        connectTimeoutMS : mongoTimeout 
      }
    }
  };

  // Open the connection to the server
  MongoClient.connect("mongodb://" + mongoPath, options, function (err, db) {
    if (err) { callback(err, null); }
    callback(err, db);
  });
}

/** Completes single-digit numbers by a "0"-prefix
 * This is a special case for milliseconds, in which we will add up to two zeros 
 * */
function completeDateValsMilliseconds(dateVal) {
  var dateVal = "" + dateVal;
  if (dateVal.length < 2) return "00" + dateVal;
  if (dateVal.length < 3) return "0" + dateVal;
  else return dateVal;
}


/////////////////////////////////////////////START OF CONSTANTS/////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const scopeObject = {};

//list of banned IP addresses
//const bannedIPlist = [ { "ip" : "130.88.193.26"} , { "ip" : "IP1"} , { "ip" : "IP2"}];
const bannedIPlist = ["130.88.193.26", "IP1", "IP2"];
//the following query tests that the sid related with the ip 130.88.193.26 are filtered (it should be empty).
//db.map_reduce_example.find({"_id.sid":{$in:["8hgYRPR2x1Jz", "7O25l3TPWVkp", "1l8yDX2ehiEv", "ZrZ2OrGb6fAY", "qptygSdE0H1z", "uAWrwKFf00rY", "5ZGlnqS1CPAE", "EVJZCfwAXF7j", "01v2m0HonZ3r", "pSaMH85B0Adz", "dzJnQXxQBKJT", "Qcs4OFkpPIbB", "x8UVE8L4598v", "4YWnL6iA0UpF"]}});

scopeObject["bannedIPlist"] = bannedIPlist;


//These events should be ignored when calculating active times.
const incorrectActTimeEvents = ["mobileGyroscopeEvent", "mouseOverEvent", "resizeEvent"]
scopeObject["incorrectActTimeEvents"] = incorrectActTimeEvents;

///////////List of events
const loadEvent = "load";
scopeObject["loadEvent"] = loadEvent;

const mouseWheelEvent = "mousewheel";
scopeObject["mouseWheelEvent"] = mouseWheelEvent;

const mouseDownEvent = "mousedown";
scopeObject["mouseDownEvent"] = mouseDownEvent;

const mouseUpEvent = "mouseup";
scopeObject["mouseUpEvent"] = mouseUpEvent;

const mouseOverEvent = "mouseover";
scopeObject["mouseOverEvent"] = mouseOverEvent;

const mouseOutEvent = "mouseout";
scopeObject["mouseOutEvent"] = mouseOutEvent;

const mouseMoveEvent = "mousemove";
scopeObject["mouseMoveEvent"] = mouseMoveEvent;

const dblclickEvent = "dblclick";
scopeObject["dblclickEvent"] = dblclickEvent;

const mobileGyroscopeEvent = "mobileGyroscope";
scopeObject["mobileGyroscope"] = mobileGyroscopeEvent;

const scrollEvent = "scroll";
scopeObject["scrollEvent"] = scrollEvent;

const resizeEvent = "resize";
scopeObject["resize"] = resizeEvent;


//////Session timeout
const sessionTimeout = 40 * 60 * 1000;//40 mintues
scopeObject["sessionTimeout"] = sessionTimeout;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////END OF CONSTANTS/////////////////////////////////////////////////



/////////////////////////////////////////////START OF CONSTANTS/////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Parse a date in "yyyy-mm-dd,HH:mm:ss:SSS" format, and return the ms.
 * I will do it manually to avoid problems with implementation dependant functions
 * new Date(year, month [, date [, hours[, minutes[, seconds[, ms]]]]])
 * 2013-07-05,09:25:53:970
 */
function parseDateToMs2(input) {
  var parts = input.split(',');

  var date = parts[0].split('-');
	/*var year = date[0];
	var month = date[1];
	var day = date[2];*/

  var time = parts[1].split(':');
	/*var hour = time[0];
	var minute = time[1];
	var secs = time[2];
	var millisecs = time[3];*/
  // new Date(year, month [, day [, hours[, minutes[, seconds[, ms]]]]])
  return new Date(date[0], date[1] - 1, date[2], time[0], time[1], time[2], time[3]).getTime(); // Note: months are 0-based
}

/**
 * Returns current date in a readable format
 */
function datestamp() {
  var currentDate = new Date();
  return currentDate.getFullYear() + "-" + completeDateVals(currentDate.getMonth() + 1) + "-"
    + completeDateVals(currentDate.getDate()) + "," + completeDateVals(currentDate.getHours())
    + ":" + completeDateVals(currentDate.getMinutes())
    + ":" + completeDateVals(currentDate.getSeconds())
    + ":" + completeDateValsMilliseconds(currentDate.getMilliseconds());

}

/** Completes single-digit numbers by a "0"-prefix
 *  */
function completeDateVals(dateVal) {
  var dateVal = "" + dateVal;
  if (dateVal.length < 2) return "0" + dateVal;
  else return dateVal;
}

/** Completes single-digit numbers by a "0"-prefix
 * This is a special case for milliseconds, in which we will add up to two zeros 
 * */
function completeDateValsMilliseconds(dateVal) {
  var dateVal = "" + dateVal;
  if (dateVal.length < 2) return "00" + dateVal;
  if (dateVal.length < 3) return "0" + dateVal;
  else return dateVal;
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////END OF CONSTANTS/////////////////////////////////////////////////


//////Modules
module.exports.mongoQueryDB = mongoQueryDB;
module.exports.connectAndValidateNodeJs = connectAndValidateNodeJs;
module.exports.completeDateValsMilliseconds = completeDateValsMilliseconds;
module.exports.parseDateToMs2 = parseDateToMs2;
module.exports.datestamp = datestamp;
module.exports.completeDateVals = completeDateVals;
module.exports.completeDateValsMilliseconds = completeDateValsMilliseconds;
module.exports.websiteId = websiteId;
module.exports.userCollection = userCollection;
module.exports.scopeObject = scopeObject;
module.exports.eventCollection = eventCollection;
module.exports.bannedIPlist = bannedIPlist;
module.exports.sessionTimeout = sessionTimeout;
module.exports.mongoLogCollection = mongoLogCollection;