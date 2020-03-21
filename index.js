const express = require("express");
const bodyParser = require("body-parser");
const https = require("https");
const partials = require("express-partials");
const app = express();
app.set('view engine', 'ejs');
app.use(partials());
app.use("/static", express.static("public"));
app.use(bodyParser.urlencoded({extended : false})); // no complicated post requests

const port = 80;

const maxidx = 100;
// const update_interval = 5 * 60 * 1000; // pull from Twitter every 5 minutes

let buf = [];
let writeidx = 0;

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

app.get('/pi', function(req, res){
  res.sendFile(__dirname + "/views/pi.html");
})

app.get('/ownquote', function(req, res){
  res.sendFile(__dirname + "/views/ownquote.html");
})

app.get('/thankyou', function(req, res){
  res.sendFile(__dirname + "/views/thankyou.html");
})

app.get('/nextquote', function(req, res){
  let currlen = buf.length;
  let idx = 0;
  if ("idx" in req) {
    idx = req.idx;
  }
  res.send({
    text: buf[idx],
    maxidx: currlen
  });
})


app.post('/postquote', function(req, res){
  let quote = req.body.quote;
  writeidx = (writeidx + 1) % maxidx;
  buf[writeidx] = quote;
  /* Code for Twitter version */
  /* quote += " _#Covid_19"; */
  res.sendFile(__dirname + "/views/thankyou.html");
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
