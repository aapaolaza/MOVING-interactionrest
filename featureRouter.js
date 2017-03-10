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
router.get('/', function (req, res) {
  res.send('MOVING interaction REST service')
})
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
    var endTimestamp = req.query.endtime.toString();//1456137344379

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




module.exports = router