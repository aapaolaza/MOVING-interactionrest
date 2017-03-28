var async = require('async');
var constants = require("./MapReduceConstantsNode.js");
var mongoLog = require("./mongoLog.js");


var db;

function initialiseDB(callback) {
  console.log("initialiseDB()")
  var startTimems = new Date();

  constants.connectAndValidateNodeJs(function (err, databaseConnection) {
    if (err) return console.error("initialiseDB() ERROR connecting to DB" + err);
    db = databaseConnection;
    async.waterfall([
      /*function (callback) {
        urlFixer("0", callback);
      },*/
      initialiseIndexes
      //,databaseCleanUp
    ], function (err, result) {
      if (err) return console.error("initialiseDB() ERROR occured in one of the functions: " + err);
      console.log("all initialisation functions finished");
      mongoLog.logMessage("optime", "initialiseDB",
        constants.websiteId, "All initialisation functions finished", startTimems, new Date());
      callback(null, "All initialisation functions finished:" + constants.datestampToReadable(startTimems)
        + "end: " + constants.datestampToReadable(new Date()));
    });
  });
}

/**
 * UNUSED FOR THE TIME BEING! I have made some changes that remove the need to usethese functions.
 * These functions are prepared to be run at any time, as they only update the lastly created events.
 * 
 */
function routineFunctions(callback) {
  var startTimems = new Date();

  constants.connectAndValidateNodeJs(function (err, databaseConnection) {
    if (err) return console.error("initialiseDB() ERROR connecting to DB" + err);
    db = databaseConnection;
    async.waterfall([
      createUserList,
      addEpisodeCounter
    ], function (err, result) {
      if (err) {
        mongoLog.logMessage("error", "routineFunctions",
          constants.websiteId, err, startTimems, new Date());
        return console.error("initialiseDB() ERROR occured in one of the functions: " + err);
      }
      console.log("all routine functions finished");
      mongoLog.logMessage("optime", "routineFunctions",
        constants.websiteId, "All routine functions finished", startTimems, new Date());
      callback("All routine functions finished start:" + constants.datestampToReadable(startTimems)
        + "end: " + constants.datestampToReadable(new Date()));
    });
  });
}

function cleanUp() {
  constants.closeConnection();
}

function initialiseIndexes(callback) {
  var startTimems = new Date();

  constants.connectAndValidateNodeJs(function (err, db) {
    if (err) return console.error("initialiseDB() ERROR connecting to DB" + err);

    async.parallel([
      function (callback) {
        db.collection(constants.eventCollection).createIndex({ "timestampms": 1 }, function (err) {
          if (err) return callback(err);
          callback();
        });
      },
      function (callback) {
        db.collection(constants.eventCollection).createIndex({ "url": 1 }, function (err) {
          if (err) return callback(err);
          callback();
        });
      },
      function (callback) {
        db.collection(constants.eventCollection).createIndex({ "sid": 1 }, function (err) {
          if (err) return callback(err);
          callback();
        });
      },
      function (callback) {
        db.collection(constants.eventCollection).createIndex({ "sd": 1 }, function (err) {
          if (err) return callback(err);
          callback();
        });
      },
      function (callback) {
        db.collection(constants.eventCollection).createIndex({ "timestamp": 1 }, function (err) {
          if (err) return callback(err);
          callback();
        });
      },
      function (callback) {
        db.collection(constants.eventCollection).createIndex({ "timestampms": 1 }, function (err) {
          if (err) return callback(err);
          callback();
        });
      },
      function (callback) {
        db.collection(constants.eventCollection).createIndex({ "sid": 1, "url": 1 }, function (err) {
          if (err) return callback(err);
          callback();
        });
      },
      function (callback) {
        db.collection(constants.eventCollection).createIndex({ "sid": 1, "sd": 1 }, function (err) {
          if (err) return callback(err);
          callback();
        });
      },
      function (callback) {
        db.collection(constants.eventCollection).createIndex({ "sid": 1, "sd": 1, "timestamp": 1 }, function (err) {
          if (err) return callback(err);
          callback();
        });
      },
      function (callback) {
        db.collection(constants.eventCollection).createIndex({ "sid": 1, "url": 1, "timestamp": 1 }, function (err) {
          if (err) return callback(err);
          callback();
        });
      },
      function (callback) {
        db.collection(constants.eventCollection).createIndex({ "sid": 1, "sd": 1, "sessionstartms": 1 }, function (err) {
          if (err) return callback(err);
          callback();
        });
      },
      function (callback) {
        //This index prevents any duplicates in the database
        //For a single user, in a single browser tab, there can't be 2 same events with the same timestamp
        db.collection(constants.eventCollection).createIndex({ sid: 1, sd: 1, sessionstartms: 1, event: 1, timestampms: 1 }, { unique: true }, function (err) {
          if (err) return callback(err);
          callback();
        });
      }
    ],
      // optional callback
      function (err, results) {
        if (err)
          return console.error("initialiseIndexes() ERROR creating the indexes:" + err);
        else {
          console.log("All indexes have been created");
          mongoLog.logMessage("optime", "initialiseIndexes",
            constants.websiteId, "All indexes have been created", startTimems, new Date());
          callback(null);
        }
      }
    );
  });
}

/**
 * Removes erroneous events
 */
function databaseCleanUp(callback) {
  var startTimems = new Date();
  async.parallel([
    /*function (callback) {
      db.collection(constants.eventCollection).remove({ 'sd': { $ne: '$websiteId' } }, function (err) {
        if (err) return callback(err);
        callback();
      });
    },*/
    function (callback) {
      db.collection(constants.eventCollection).remove({ 'sessionstartms': { $exists: false } }, function (err) {
        if (err) return callback(err);
        callback();
      });
    },
    function (callback) {
      db.collection(constants.eventCollection).remove({ 'timestamp': { $exists: false } }, function (err) {
        if (err) return callback(err);
        callback();
      });
    },
    function (callback) {
      db.collection(constants.eventCollection).remove({ 'timestamp': '' }, function (err) {
        if (err) return callback(err);
        callback();
      });
    }
  ],
    // optional callback
    function (err, results) {
      console.log("Erroneous events have been deleted");
      mongoLog.logMessage("optime", "databaseCleanUp()",
        constants.websiteId, "Erroneous events have been deleted", startTimems, new Date());

      callback(null);
    }
  );
}


/**
 * Remove duplicates from the DB.
 * It's a long mapReduce (it checks all the events in the DB), so it should only run before a unique index can be created.
 * Once this unique index has been created, it will prevent duplicates from being introduced into the DB
 * To be run only for old interaction databases.
 * For example, in the test data set, 29,438 out of 5,666,319 events were duplicates
 */
function removeDuplicates(callback) {
  const duplicateCollection = "duplicateValues";

  var startTimems = new Date();

  async.waterfall([
    //createDuplicateCollection,
    //deleteDuplicates
    createDuplicateIndex
  ], function (err, result) {
    if (err) return console.error("removeDuplicates() ERROR occured in one of the functions: " + err);
    console.log("removeDuplicates() all duplicates removed");
    mongoLog.logMessage("optime", "removeDuplicates()",
      constants.websiteId, "Duplicates have been deleted", startTimems, new Date());
    callback(null);
  });

  function createDuplicateCollection(callback) {
    constants.connectAndValidateNodeJs(function (err, db) {
      if (err) return console.error("createDuplicateCollection() ERROR connecting to DB" + err);

      function mapFunction() {
        emit({
          sid: this.sid,
          sessionstartms: this.sessionstartms,
          event: this.event,
          timestampms: this.timestampms,
          sd: this.sd
        }
          , 1);
      }

      function reduceFunction(key, values) {
        return Array.sum(values);
      }

      db.collection(constants.eventCollection).mapReduce(mapFunction, reduceFunction, { out: duplicateCollection }, function (err, db) {
        if (err) {
          mongoLog.logMessage("error", "removeDuplicates()",
            constants.websiteId, "Error executing MapReduce " + err + ", " + constants.getCurrentConnectionOptions(),
            startTimems, new Date());
          return console.error("removeDuplicates() ERROR executing mapReduce " + err);
        }

        callback(null);
      });
    });
  }

  /**
   * Once the mapReduce function has found all the duplicates, this function deletes them
   * @param {*} callback 
   */
  function deleteDuplicates(callback) {
    constants.connectAndValidateNodeJs(function (err, db) {
      if (err) return console.error("deleteDuplicates() ERROR connecting to DB" + err);
      db.collection(duplicateCollection).find({ value: { $gt: 1 } }).toArray(function (err, duplicatesList) {
        if (err || !duplicatesList) {
          console.log("No duplicates found");
          callback();
        }
        else {
          var duplicatesProcessed = 0;
          duplicatesList.forEach(function (duplicateItem) {
            //For each duplicate, find all "fakes" in the database
            db.collection(constants.eventCollection).find({
              "sid": duplicateItem._id.sid,
              "sessionstartms": duplicateItem._id.sessionstartms,
              "event": duplicateItem._id.event,
              "timestampms": duplicateItem._id.timestampms,
              "sd": duplicateItem._id.sd
            }).toArray(function (err, duplicateEventsList) {
              //IMPORTANT!! remove the first element in array as we only want to delete the duplicates after the "real" event
              duplicateEventsList.shift();

              // assuming openFiles is an array of file names
              async.each(duplicateEventsList, function (duplicateEventItem, callback) {
                db.collection(constants.eventCollection).remove({ _id: duplicateEventItem._id },
                  function (err, numberOfRemovedDocs) {
                    console.log(numberOfRemovedDocs + " duplicates deleted");
                    callback();
                  }
                );
              }, function (err) {
                if (err) {
                  console.error("deleteDuplicates() ERROR deleting duplicates " + err);
                } else {
                  //keep a counter to know when all the foreach have finished
                  duplicatesProcessed++;
                  console.log(duplicatesProcessed + " duplicates deleted out of " + duplicatesList.length)
                  if (duplicatesProcessed === duplicatesList.length) {
                    callback(null);
                  }
                }
              });
            });
          });
        }
      });
    });
  }

  /**
   * Creates the unique index that prevents duplicates, so this function doesn't need to be called again.
   */
  function createDuplicateIndex(callback) {
    db.collection(constants.eventCollection).createIndex(
      { sid: 1, sd: 1, sessionstartms: 1, event: 1, timestampms: 1 },
      { unique: true },
      function (err) {
        if (err) return callback(err);
        callback();
      });
  }
}

/**
 * For each user found in the database but not in the users list, create a new profile
 * This profiles enable subsequent updates over the next user. Only the new information generated by that user will be updated
 * If this is the first time is executed, it creates a unique index for the users
 */
function createUserList(callback) {
  console.log("createUserList(): start at " + constants.datestamp());
  var startTimems = new Date();

  constants.connectAndValidateNodeJs(function (err, db) {
    if (err) return console.error("initialiseDB() ERROR connecting to DB" + err);

    //When called this way, the results of each function is stored as  {processedUserList: [list1], capturedUserList: [list2]}
    async.parallel({
      processedUserList: function (callback) {
        db.collection(constants.userProfileCollection).distinct('sid', { sd: constants.websiteId }, function (err, processedUserList) {
          callback(null, processedUserList);
        });
      },
      capturedUserList: function (callback) {
        db.collection(constants.eventCollection).distinct('sid', { sd: constants.websiteId }, function (err, capturedUserList) {
          callback(null, capturedUserList);
        });
      }
    },
      function (err, results) {
        //the capturedUserList will necessarily be bigger than processedUserList
        console.log("User Lists retrieved from DB, " + results.capturedUserList.length + " users retrieved from the captured data");
        var processedUserCount = 0;
        results.capturedUserList.forEach(function (userItem) {
          //For each item in capturedUserList which is not available in processedUserList, create a new profile
          if (results.processedUserList.indexOf(userItem) == -1) {
            userDocument = {
              sid: userItem,
              sd: constants.websiteId,
              lastUrlEventProcessed: 0,
              lastUrlEpisodeList: [
                {
                  url: "templateUrl",
                  lastUrlEpisodeCount: 1,
                  lastUrlEpisodeTimestampms: 0,
                }
              ],
              lastSdEpisodeCount: 1,
              lastSdEpisodeTimestampms: 0
            };

            db.collection(constants.userProfileCollection).insert(userDocument, function (err, records) {
              if (err) return console.error("createUserList() ERROR INSERTING USER DOCUMENT " + err);
              //else console.log("createUserList() new User document stored correctly");
            });
          }

          //When we finish processing all captured users
          processedUserCount++;
          if (processedUserCount == results.capturedUserList.length) {
            mongoLog.logMessage("optime", "createUserList",
              constants.websiteId, results.capturedUserList.length + " users' have been created", startTimems, new Date());
          }
        });

        //Before ending, ensure the indexes for the collection exist, only necessary if processedUserList was empty to start with
        if (results.processedUserList.length == 0) {
          db.collection(constants.userProfileCollection).createIndex({ "sid": 1 }, { unique: true }, function (err) {
            if (err) return callback(err);
            callback();
          });
        }
        else
          callback();
      });
  });
}


/**
 * Takes the list of users, and updates all the URLs for the events after the last updated timestamp
 */
function urlFixer(lastTimestamp, callback) {
  console.log("urlFixer()");
  constants.connectAndValidateNodeJs(function (err, db) {
    if (err) return console.error("urlFixer() ERROR connecting to DB" + err);
    db.collection(constants.userProfileCollection).find({ "sd": constants.websiteId }).toArray(function (err, userList) {

      var userCounter = 0;
      //For each user
      userList.forEach(function (userItem) {

        //prevent updating the last timestamp with an earlier one
        var lastUpdatedTimestamp = 0;

        //Look for url missing events
        db.collection(constants.eventCollection).find(
          {
            "sid": userItem.sid, "sd": constants.websiteId, "url": { $exists: false }, timestampms: { $gte: userItem.lastUrlEventProcessed }
          }).toArray(function (err, urlMissingEventList) {
            if (err) return console.error("urlFixer() ERROR retrieving empty URLs " + err);

            //For each url missing event
            for (var i = 0; i < urlMissingEventList.length; i++) {
              var urlMissingEvent = urlMissingEventList[i];

              //print(JSON.stringify(urlMissingEvent));
              //Look for distinct urls in its sessionstartms
              db.collection(constants.eventCollection).distinct("url",
                {
                  "sid": userItem.sid, "sd": constants.websiteId,
                  "sessionstartms": urlMissingEvent.sessionstartms
                },
                function (err, urlsForSession) {
                  if (err) return console.error("urlFixer() ERROR retrieving distinct URLs in session " + err);

                  //remove null and empty occurrences from the retrieved URLs (those are the cases we want to fix)
                  //splice only removes the first occurrence, but the array should contain unique items, so it should not be a problem (otherwise mongo failed)
                  urlsForSession.splice(urlsForSession.indexOf(null), 1);
                  urlsForSession.splice(urlsForSession.indexOf(""), 1);

                  //If unique url for sessionstartms --> update event with that url
                  if (urlsForSession.length == 1) {
                    console.log(urlsForSession);

                    db.collection(constants.eventCollection).update(
                      { "_id": urlMissingEvent._id },
                      { $set: { "url": urlsForSession[0] } }
                    );

                    if (urlMissingEvent.timestampms > lastUpdatedTimestamp) {
                      db.collection(constants.userProfileCollection).update(
                        { "sid": userItem.sid, "sd": userSd },
                        { $set: { "lastUrlEventProcessed": urlMissingEvent.timestampms } }
                      )
                    }
                  }
                  //Else, try to fix multiple URLs
                  else {
                    console.error("urlFixer() Muliple URLs found in a single session");
                    console.log(urlsForSession);
                    fixMultipleUrlEpisode(userItem.sid, urlMissingEvent.sessionstartms);
                  }
                });
            }
          });

        userCounter++;
        console.log(userCounter + " users processed out of " + userList.length)
        if (userCounter === userList.length) {
          callback(null);
        }
      });
    });
  });
}



/**
 * This function will take the sessionstartms and sid, and will update events which don't have a url set, but are surrounded by
 *  events the url of which is the same.
 * In the following example, event2 and event3 will be set to the same url as event1 and event4
 * event1: www.url1.com
 * event2: ?
 * event3: ?
 * event4: www.url1.com
 * 
 * I will have to be cautious with multiple useless callings to these method. If it has been run for a give sid and
 * sessionstartmsValue, it should not do anything.
 */

function fixMultipleUrlEpisode(sidValue, sessionstartmsValue) {

  console.log("fixMultipleUrlEpisode()," + sidValue + "," + sessionstartmsValue)
  //Important! it MUST be cronologically sorted
  db.collection(constants.eventCollection).find({ "sid": sidValue, "sessionstartms": sessionstartmsValue }).toArray(function (err, eventList) {
    if (err) return console.error("fixMultipleUrlEpisode() ERROR retrieving session from user " + err);

    //we sort it ourselves rather than asking mongo (faster)
    eventList = eventList.sort(constants.compareEventTS);

    //What if the first event doesn't have a url??
    lastUrl = eventList[0].url;

    //We will keep a list of the events to be updated with the 
    var eventsToUpdate = new Array();

    for (var eventIndex = 1; eventIndex < eventList.length; eventIndex++) {

      //if the first event's URL doesn't exist, we will set it (and all the following undefined) to the first valid URL
      if (typeof (lastUrl) === 'undefined') {
        console.log("undefined URL at the start");
        lastUrl = eventList[eventIndex].url;
        eventsToUpdate.push(eventList[eventIndex - 1]);
      }

      //We test if event being processed has url
      if (typeof (eventList[eventIndex].url) !== 'undefined') {

        //If there is any event in the list, then we need to update it!
        if (eventsToUpdate.length != 0) {
          //was the previous and this url the same?
          if (lastUrl == eventList[eventIndex].url) {
            //if so, we can just update all events stored so far
            console.log(" Updating " + eventsToUpdate.length + "events with url:" + lastUrl);
            for (var updateEventIndex = 0; updateEventIndex < eventsToUpdate.length; updateEventIndex++) {
              db.collection(constants.eventCollection).update(
                { "_id": eventsToUpdate[updateEventIndex]._id },
                { $set: { "url": lastUrl } });
            }
          }
          //if not, there is nothing we can do so far, apart from reporting it.
          else {
            console.log("ERROR: urls were different:" + lastUrl + " vs " + eventList[eventIndex].url + ", events after the following could not be updated:");
            console.log(eventsToUpdate[0])
          }
          //updated or not, we need to reset the array
          eventsToUpdate = new Array();
        }
        //remember to update current url
        lastUrl = eventList[eventIndex].url;
      }
      else {
        //If not, we may have to update it with a proper url at the end of the "non-url" events section
        eventsToUpdate.push(eventList[eventIndex])
      }
    }
  });
}


/**
 * Add episode counters. User profiles are employed to update only the events following from the last updated episodes
 * 
 */

function addEpisodeCounter(callback) {
  console.log("addEpisodeCounter(): start");
  var startTimems = new Date();
  constants.connectAndValidateNodeJs(function (err, db) {
    if (err) return console.error("urlFixer() ERROR connecting to DB" + err);
    db.collection(constants.userProfileCollection).find({ "sd": constants.websiteId }).toArray(
      function (err, userList) {
        var userCounter = 0;
        userList.forEach(function (userItem) {
          //From the user, retrieve the following information, and update it when the process ends.
          /*sid: userItem,
            sd: constants.websiteId,
            lastEventProcessed: 0,
            lastUrlEpisodeList:[
              {
                url:string,
                lastUrlEpisodeCount: 1,
                lastUrlEpisodeTimestampms: -1,
              }
            ],
            lastSdEpisodeCount: 1,
            lastSdEpisodeTimestampms: -1,*/


          async.parallel([
            function (callback) {
              updateEventsWithUrlSession(userItem.sid, userItem.sd, userItem.lastUrlEpisodeList, callback);
            },
            function (callback) {
              updateEventsWithSdSession(userItem.sid, userItem.sd,
                userItem.lastSdEpisodeCount, userItem.lastSdEpisodeTimestampms, callback);
            }
          ],
            // final callback
            function (err, results) {
              console.log("Updated user " + userItem.sid + ", " + userCounter + " of " + userList.length);

              userCounter++;
              //All users have been processed
              if (userCounter == userList.length) {
                mongoLog.logMessage("optime", "addEpisodeCounter",
                  constants.websiteId, userList.length + " users' episodes have been updated", startTimems, new Date());
              }
              console.log("addEpisodeCounter(): All users processed");
              callback(null);
            }
          );
        });

      });
  });
}


/**
 * Given a user information, and the timestamp of the first event of the 
 * last created episode, carry on updating the following episodes.
 * 
 * It will look for the events for that user after a specific timestamp, and carry on updating the episodes starting with the given count.
 * 
 * @param {String} sid 
 * @param {String} sd 
 * @param {Array} lastUrlEpisodeList
 */

function updateEventsWithUrlSession(userSid, userSd, lastUrlEpisodeList, callback) {

  db.collection(constants.eventCollection).distinct("url", { "sid": userSid, "sd": userSd },
    function (err, urlListForUser) {

      //remove empty urls
      urlListForUser.splice(urlListForUser.indexOf(null), 1);
      urlListForUser.splice(urlListForUser.indexOf(""), 1);

      var processedUrlCount = 0;

      urlListForUser.forEach(function (urlItem) {

        //Query the URL from the users list of last episodes
        var lastUrlEpisodeItem = lastUrlEpisodeList.findByValueOfObject("url", urlItem)[0];

        var urlSessionCounter, lastUrlEpisodeTimestampms;
        //If it's the first time this URL is found, overwrite lastUrlEpisodeItem with default values
        if (typeof (lastUrlEpisodeItem) === 'undefined') {
          urlSessionCounter = 1;
          lastUrlEpisodeTimestampms = 0;
        }
        else {
          urlSessionCounter = lastUrlEpisodeItem.lastUrlEpisodeCount;
          lastUrlEpisodeTimestampms = lastUrlEpisodeItem.lastUrlEpisodeTimestampms;
        }

        updateEventsForUserUrl(userSid, userSd,
          urlItem, urlSessionCounter, lastUrlEpisodeTimestampms,
          function (err) {
            if (err) throw err;
            //If all URLs have been processed
            processedUrlCount++;
            if (processedUrlCount == urlListForUser.length) {
              callback(null);
            }
          }
        )
      });
    }
  );
}

function updateEventsForUserUrl(userSid, userSd,
  urlItem, urlSessionCounter, lastUrlEpisodeTimestampms, callback) {

  var urlTimeSinceLastSession = 0;
  var urlTimeDifference = 0;

  var lastStoredEpisode = urlSessionCounter;
  var lastStoredTimestampms = lastUrlEpisodeTimestampms;

  db.collection(constants.eventCollection).find({
    "sid": userSid, "sd": userSd,
    "url": urlItem, timestampms: { $gte: lastUrlEpisodeTimestampms.toString() }
  }).toArray(function (err, userUrlEventList) {

    userUrlEventList = userUrlEventList.sort(constants.compareEventTS);

    console.log(userUrlEventList.length + "events found for user " + userSid + " in url" + urlItem + " with time gte "+ lastUrlEpisodeTimestampms);

    if (userUrlEventList.length > 0)
      var lastEventTS = userUrlEventList[0].timestampms;

    var processedUrlEventCount = 0;
    for (var i = 0; i < userUrlEventList.length; i++) {
      //We calculate the time between current and last event
      urlTimeDifference = userUrlEventList[i].timestampms - lastEventTS;

      lastEventTS = userUrlEventList[i].timestampms;

      //if the time between events is too big, we will start a new session
      if (urlTimeDifference > constants.sessionTimeout) {
        urlSessionCounter++;
        urlTimeSinceLastSession = urlTimeDifference;

        //Update the values for the last stored episode.
        lastStoredEpisode = urlSessionCounter;
        lastStoredTimestampms = userUrlEventList[i].timestampms;
      }

      //Update current event with whatever current sessionCounter value is
      db.collection(constants.eventCollection).update(
        { "_id": userUrlEventList[i]._id },
        {
          $set: {
            "urlSessionCounter": urlSessionCounter,
            "urlSinceLastSession": urlTimeSinceLastSession,
          }
        }
      );

      //All events for that URL have been processed
      processedUrlEventCount++;
      if (processedUrlEventCount == userUrlEventList.length) {
        //At the end of processing each URL, we need to store the last updated counter and timestamp
        if (typeof (lastUrlEpisodeItem) === 'undefined') {
          db.collection(constants.userProfileCollection).update(
            {
              "sid": userSid, "sd": userSd
            },
            {
              "$push":
              {
                "lastUrlEpisodeList.$":
                {
                  "url": urlItem,
                  "lastUrlEpisodeCount": lastStoredEpisode,
                  "lastUrlEpisodeTimestampms": lastStoredTimestampms
                }
              }
            },
            function (err) {
              if (err) throw err;
              callback(null);
            }
          );
        }
        else {
          db.collection(constants.userProfileCollection).update(
            {
              "sid": userSid, "sd": userSd,
              "lastUrlEpisodeList.url": urlItem
            },
            {
              $set: {
                "lastUrlEpisodeList.$.lastUrlEpisodeCount": lastStoredEpisode,
                "lastUrlEpisodeList.$.lastUrlEpisodeTimestampms": lastStoredTimestampms
              }
            },
            function (err) {
              if (err) throw err;
              callback(null);
            }
          );
        }
      }
    }
  });
}

/**
 * Given a user information, and the timestamp of the first event of the 
 * last created episode, carry on updating the following episodes.
 * 
 * It will look for the events for that user after a specific timestamp, and carry on updating the episodes starting with the given count.
 * 
 * @param {String} sid 
 * @param {String} sd 
 * @param {String} lastSdEpisodeCount 
 * @param {String} lastSdEpisodeTimestampms 
 */
function updateEventsWithSdSession(sid, sd,
  lastSdEpisodeCount, lastSdEpisodeTimestampms, callback) {

  var sdSessionCounter = lastSdEpisodeCount;
  var sdTimeSinceLastSession = 0;
  var sdTimeDifference = 0;

  var lastStoredEpisode = lastSdEpisodeCount;
  var lastStoredTimestampms = lastSdEpisodeTimestampms;

  db.collection(constants.eventCollection).find({ "sid": sid, "sd": sd, timestampms: { $gte: lastSdEpisodeTimestampms.toString() } }).toArray(
    function (err, userSdEventList) {

      userSdEventList = userSdEventList.sort(constants.compareEventTS);

      console.log(userSdEventList.length + "events found for user " + sid + " in SD "+sd + " gte " + lastSdEpisodeTimestampms);

      if (userSdEventList.length > 0)
        var lastEventTS = userSdEventList[0].timestampms;

      var processedSdEventCount = 0;

      for (var i = 0; i < userSdEventList.length; i++) {
        //We calculate the time between current and last event
        sdTimeDifference = userSdEventList[i].timestampms - lastEventTS;

        lastEventTS = userSdEventList[i].timestampms;

        //if the time between events is too big, we will start a new session
        if (sdTimeDifference > constants.sessionTimeout) {
          sdSessionCounter++;
          sdTimeSinceLastSession = sdTimeDifference;

          //Update the values for the last stored episode.
          lastStoredEpisode = sdSessionCounter;
          lastStoredTimestampms = userSdEventList[i].timestampms;
        }

        //Update current event with whatever current sessionCounter value is
        db.collection(constants.eventCollection).update(
          { "_id": userSdEventList[i]._id },
          {
            $set: {
              "sdSessionCounter": sdSessionCounter,
              "sdTimeSinceLastSession": sdTimeSinceLastSession,
            }
          }
        );

        processedSdEventCount++;
        if (processedSdEventCount == userSdEventList.length) {
          db.collection(constants.userProfileCollection).update(
            {
              "sid": sid, "sd": sd
            },
            {
              $set: {
                "lastSdEpisodeCount": lastStoredEpisode,
                "lastSdEpisodeTimestampms": lastStoredTimestampms
              }
            },
            function (err) {
              if (err) throw err;
              callback(null);
            }
          );
        }
      }
    }
  );
}

/**
 * Add episode durations (can we merge this function into the previous one?)
 * 
 */





/**
 * To be called from an array, it returns the item with the given key/value pair
 * It returns a list of all matched values
 * http://stackoverflow.com/questions/36259921/nodejs-find-object-in-array-by-value-of-a-key
 */
Array.prototype.findByValueOfObject = function (key, value) {
  return this.filter(function (item) {
    return (item[key] === value);
  });
}



module.exports.initialiseDB = initialiseDB;
module.exports.routineFunctions = routineFunctions;
module.exports.cleanUp = cleanUp;