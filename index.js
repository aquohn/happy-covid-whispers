const express = require("express");
const fs = require("fs");
const partials = require("express-partials");
const request = require("request");
const app = express();
app.set('view engine', 'ejs');
app.use(partials());
app.use("/static", express.static("public"));

const port = 80;

app.get('/', function(req, res){
  var data = {
    overall: 0.6,
    breakdown: [30, 20, 50], //positive, neutral, negative
    healthcare: {
      overall: 0.7,
      breakdown: [50, 30, 20]
    },
    finance: {
      overall: 0.3,
      breakdown: [10, 30, 60]
    },
    education: {
      overall: 0.5,
      breakdown: [30, 10, 60]
    }
  }
  res.render("\index", {
    data: data
  });
})

app.get('/articles', function( req, res){
  let rawdata = fs.readFileSync('./sample.json');
  let data = JSON.parse(rawdata);
  var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (var i = 0; i < Object.keys(data["date"]).length; i++) {
    var d = new Date(data["date"][i]);
    data["date"][i] = days[d.getDay()] + ", " + d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear();
  }
  var prev = 0;
  res.render("\articles.ejs", {
    data: data,
    onclick: "test()",
    prev: prev
  });
})

app.get('/pi', function(req, res){
  res.sendFile(__dirname + "/views/pi.html");
})

app.get('/ownquote', function(req, res){
  res.sendFile(__dirname + "/views/ownquote.html");
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
