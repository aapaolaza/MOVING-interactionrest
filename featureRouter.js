/**
 * Modular router to handle requests of the features
 * https://expressjs.com/en/guide/routing.html
 */


var express = require('express')
var featuresDAO = require('./mongoDAO/featuresDAO.js')




var router = express.Router()

// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log('Features router Time: ', Date.now())
  next()
})

// define the home page route
router.get("/", function (req, res) {
  res.json({
    "error": false, "message": "MOVING interaction REST service",
    "routes": router.stack          // registered routes
      .filter(r => r.route)    // take out all the middleware
      .map(r => r.route.path)  // get all the paths
  });
});

// define the about route
router.get('/about', function (req, res) {
  res.send('MOVING interaction REST service')
})

router.route("/test/:id/")
  .get(function (req, res) {
    //Parameters from the HTTP request, retrieved from the ":" marked fields
    //Provides access to the parameters marked as ":param", as in ":id"
    console.log(req.params);
    //Provides access to the parameters following the conventional ?name=value&name2=value2
    console.log(req.query);

    res.json({ "error": false, "message": "MOVING interaction REST service" });
  })
  .post(function (req, res) {
    //Access to post values
    //req.body.FIELDNAME
  });

// /rightClick/w62zkMya3kBE/?starttime=1454136343379&endtime=1456137344379
router.route("/rightClick/:userid/")
  .get(function (req, res) {

    var featureName = "rightClick";
    var userID = req.params.userid;//w62zkMya3kBE
    //Provides access to the parameters following the conventional ?name=value&name2=value2

    var startTimestamp = req.query.starttime.toString();//1454136343379

    //Configure default parameter values
    var endTimestamp = req.query.endtime;


    endTimestamp = typeof endTimestamp !== 'undefined' ? endTimestamp.toString() : new Date().getTime().toString();

    //If any of the variables has not been defined, return an error
    if (featureName && userID && startTimestamp && endTimestamp) {
      featuresDAO.testFeatureQuery(userID, featureName, startTimestamp, endTimestamp,
        function (err, featuresList) {
          console.log("rightClick route query results received: " + featuresList.length + "items")
          res.json(featuresList);
        });
    }
    else
      res.json({ "error": true, "message": "featureRouter /rightClick/:userid/ is missing variables" });
  })

// /submitevent/admin/?starttime=1454136343379
router.route("/submitevent/:userid/")
  .get(function (req, res) {

    var userID = req.params.userid;//w62zkMya3kBE
    //Provides access to the parameters following the conventional ?name=value&name2=value2

    var startTimestamp = req.query.starttime.toString();//1454136343379

    //Configure default parameter values
    var endTimestamp = req.query.endtime;

    endTimestamp = typeof endTimestamp !== 'undefined' ? endTimestamp.toString() : new Date().getTime().toString();

    //If any of the variables has not been defined, return an error
    if (userID && startTimestamp && endTimestamp) {
      featuresDAO.querySubmitEvent(userID, startTimestamp, endTimestamp,
        function (err, featuresList) {
          console.log("rightClick route query results received: " + featuresList.length + "items")
          res.json(featuresList);
        });
    }
    else
      res.json({ "error": true, "message": "featureRouter /submitevent/:userid/ is missing variables" });
  })
  

router.route("/mockData/:userid/")
  .get(function (req, res) {

    var featureName = "rightClick";
    var userID = req.params.userid;//w62zkMya3kBE
    //Provides access to the parameters following the conventional ?name=value&name2=value2

    var startTimestamp = req.query.starttime.toString();//1454136343379

    //Configure default parameter values
    var endTimestamp = req.query.endtime;


    endTimestamp = typeof endTimestamp !== 'undefined' ? endTimestamp.toString() : new Date().getTime().toString();

    //If any of the variables has not been defined, return an error
    if (featureName && userID && startTimestamp && endTimestamp) {
      featuresDAO.mockFeatureQuery(userID, featureName, startTimestamp, endTimestamp,
        function (err, featuresList) {
          console.log("rightClick route query results received: " + featuresList.length + "items")
          res.json(featuresList);
        });
    }
    else
      res.json({ "error": true, "message": "featureRouter /rightClick/:userid/ is missing variables" });
  })

// /atsmock/?userid=w62zkMya3kBE&starttime=1454136343379&endtime=1456137344379
router.route("/atsmock/")
  .get(function (req, res) {

    var userID = req.query.userid;
    var startTimestamp = req.query.starttime;
    var endTimestamp = req.query.endtime;

    featuresDAO.mockATSEventsQuery(userID, startTimestamp, endTimestamp,
      function (err, featuresList) {
        console.log("atsmock route query results received: " + featuresList.length + "items")
        res.json(featuresList);
      });
  });

// /atsmockRandom/?userid=w62zkMya3kBE&starttime=1454136343379&endtime=1456137344379&documentcount=10
router.route("/atsmockRandom/")
  .get(function (req, res) {
    console.log( req.query);

    var userID = req.query.userid;
    var startTimestamp = req.query.starttime;
    var endTimestamp = req.query.endtime;
    var documentcount = req.query.documentcount;

    //Configure default parameter value for number of random docs
    documentcount = typeof documentcount !== 'undefined' ? documentcount : 10;

    featuresDAO.mockATSEventsQueryRandom(userID, startTimestamp, endTimestamp,documentcount,
      function (err, featuresList) {
        console.log("atsmockRandom route query results received: " + featuresList.length + " items")
        res.json(featuresList);
      });
  });


function cleanUp() {
  featuresDAO.cleanUp();
}

module.exports = router;
module.exports.cleanUp = cleanUp;