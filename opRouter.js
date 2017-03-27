/**
 * Modular router to handle requests of the features
 * https://expressjs.com/en/guide/routing.html
 */


var express = require('express')
var operationsDAO = require('./mongoDAO/operationsDAO')

var router = express.Router()

// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log('Features router Time: ', Date.now())
  next()
})
// define the home page route
router.get('/', function (req, res) {
  res.send('MOVING interaction Capture Oprations service')
})
// define the about route
router.get('/about', function (req, res) {
  res.send('MOVING interaction Capture Oprations service')
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

// /operations/routine
router.route("/routine")
  .get(function (req, res) {

    operationsDAO.routineFunctions(function (err) {
      if (err) console.error("routine() ERROR occured running routine functions: " + err);
      console.log("routine query finished without errors")
      res.json(featuresList);
    });

  });


function cleanUp() {
  operationsDAO.cleanUp();
}



module.exports = router;
module.exports.cleanUp = cleanUp;