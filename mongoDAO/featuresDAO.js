

var constants = require("./MapReduceConstantsNode.js");

function cleanUp() {
  constants.closeConnection();
}

/**
 * TEST function. It returns a set of "feature events".
 * This test returns all occurrences of "right click"
 * example query:
 * db.events.find({sid: "w62zkMya3kBE", timestampms: {$gte: "1454136343379",$lte: "1456137344379"},event: "mousedown",button: "r"})
 * The upcoming functions should work using the same set of parameters:
 * @param userID
 * @param featureName
 * @param startTimestamp EPOCH
 * @param endTimestamp EPOCH
 */

function testFeatureQuery(userID, featureName, startTimestamp, endTimestamp, callback) {
  console.log("featuresDAO:testFeatureQuery()");

  constants.connectAndValidateNodeJs(function (err, db) {
    if (err) return console.error("testFeatureQuery() ERROR connecting to DB" + err);
    console.log("featuresDAO:testFeatureQuery() running the query with the following parameters:");
    console.log(userID + ":" + typeof (userID));
    console.log(startTimestamp + ":" + typeof (startTimestamp));
    console.log(endTimestamp + ":" + typeof (endTimestamp));
    //Construct the query
    db.collection(constants.eventCollection).find({
      sid: userID,
      timestampms: {
        $gte: startTimestamp,
        $lte: endTimestamp
      },
      event: "mousedown",
      button: "r"
    }).toArray(function (err, featuresList) {
      console.log("featuresDAO:testFeatureQuery() Query ended");
      callback(null, featuresList);
    });
  });
}


function mockFeatureQuery(userID, featureName, startTimestamp, endTimestamp, callback) {
  console.log("featuresDAO:mockFeatureQuery()");

  constants.connectAndValidateNodeJs(function (err, db) {
    if (err) return console.error("testFeatureQuery() ERROR connecting to DB" + err);
    
    var fs = require('fs');
    var parsedJSON = JSON.parse(fs.readFileSync('./mongoDAO/testData.json', 'utf8'));

    console.log("featuresDAO.js: mockFeatureQuery Query ended");
    callback(null, parsedJSON);
  });
}

module.exports.cleanUp = cleanUp;
module.exports.testFeatureQuery = testFeatureQuery;
module.exports.mockFeatureQuery = mockFeatureQuery;