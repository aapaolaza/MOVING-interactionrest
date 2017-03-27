var express = require('express');
var app = express();
var router = express.Router();
var fs = require("fs");


router.get("/",function(req,res){
    res.json({"error" : false,"message" : "MOVING interaction REST service"});
});

var featureRouter = require("./featureRouter.js");
app.use('/features', featureRouter)

var opRouter = require("./opRouter.js");
app.use('/operations', opRouter)

var server = app.listen(8081, function () {

  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port)

});


//process.stdin.resume();//so the program will not close instantly

function exitHandler(options, err) {
  if (options.adminInitiated) {
    console.log("ADMINISTRATOR STOPPED THE SERVER");
  } else {
    console.log("FATAL ERROR, CONTACT ADMINISTRATOR");
  }
  if (options.cleanup) console.log('clean');
  if (err) console.log(err.stack);
  if (options.exit) process.exit();

  featureRouter.cleanUp();
  opRouter.cleanUp();
}


//do something when app is closing
process.on('exit', exitHandler.bind(null, { cleanup: true }));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { adminInitiated: true, exit: true }));

//catches uncaught exceptions
//Do we want to close the server if there is an uncaught exception?
process.on('uncaughtException', exitHandler.bind(null, { exit: false }));