var express = require('express');
var app = express();
var router = express.Router();
var fs = require("fs");

var featureRouter = require("./featureRouter.js");

router.get("/",function(req,res){
    res.json({"error" : false,"message" : "MOVING interaction REST service"});
});

app.use('/features', featureRouter)


var processEvents = require('./mongoDAO/processEvents.js')
processEvents.initialiseDB();

var server = app.listen(8081, function () {

  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port)

})