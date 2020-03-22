const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const https = require("https");
const partials = require("express-partials");
const app = express();
app.set('view engine', 'ejs');
app.use(partials());
app.use("/static", express.static("public"));
app.use(bodyParser.urlencoded({extended : false})); // no complicated post requests

const port = 80;

const maxlen = 100;
// const update_interval = 5 * 60 * 1000; // pull from Twitter every 5 minutes

let buf = ["Msg1", "Msg2", "Msg3"];
let writeidx = 3;

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

app.get('/thankyou', function(req, res){
  res.sendFile(__dirname + "/views/thankyou.html");
})

app.get('/nextquote', function(req, res){
  let currlen = buf.length;
  idx = parseInt(req.query.idx);
  if (!idx) { // default for all falsy values
    idx = 0;
  }
  let text = buf[idx];
  if (!text) {
    text = "Loading..."; // yes this is very hacky
  }
  res.send({
    text: text,
    currlen: currlen.toString()
  });
})


app.post('/postquote', function(req, res){
  let quote = req.body.quote;
  buf[writeidx] = quote;
  writeidx = (writeidx + 1) % maxlen;

  /* Code for Twitter version */
  /* quote += " _#Covid_19"; */
  res.sendFile(__dirname + "/views/thankyou.html");
})

app.get('/timeline', function(req, res){
  const important_event_cutoff = 400;
  const startUTC = 1579741200000; //starting UTC value of timeline
  
  const firstDayUTC = 1579741200000;
  const dayConst = 24 * 3600000;
  const startDay = Math.floor((startUTC - firstDayUTC) / dayConst);
  let rawdata = fs.readFileSync('./sample.json');
  let data = JSON.parse(rawdata);
  let news = {};
  for ([post_index, utc] of Object.entries(data['date'])) {
    dayNumber = Math.floor((utc - firstDayUTC) /dayConst).toString()
    if (!(dayNumber in news)) {
      news[dayNumber] = [post_index];
    } else {
      news[dayNumber].push(post_index);
    }
  }
  var d = new Date();
  var currentDay = Math.floor((d.getTime() - firstDayUTC) / dayConst);
  let positive = [];
  let neutral = [];
  let negative = [];
  let important_events = {};
  for (var i = currentDay; i >= startDay; i --) { //i number of days since strike (day 1)
    positive.unshift(0);
    neutral.unshift(0); 
    negative.unshift(0);
    if (i.toString() in news) {
      for (var j = 0; j < news[i.toString()].length; j ++) { //for every news in that day, retrieve total sentiment
        var love = 0; var wow = 0; var like = 0; var haha = 0; var sad = 0; var angry = 0;
        if ('Love' in data['reactions'][(news[i.toString()][j]).toString()]) {
          love = parseInt(data['reactions'][(news[i.toString()][j]).toString()]['Love']);
        } if ('Wow' in data['reactions'][(news[i.toString()][j]).toString()]) {
          wow = parseInt(data['reactions'][(news[i.toString()][j]).toString()]['Wow']);
        } if ('Like' in data['reactions'][(news[i.toString()][j]).toString()]) {
          like = parseInt(data['reactions'][(news[i.toString()][j]).toString()]['Like']);
        } if ('Haha' in data['reactions'][(news[i.toString()][j]).toString()]) {
          haha = parseInt(data['reactions'][(news[i.toString()][j]).toString()]['Haha']);
        } if ('Sad' in data['reactions'][(news[i.toString()][j]).toString()]) {
          sad = parseInt(data['reactions'][(news[i.toString()][j]).toString()]['Sad']);
        } if ('Angry' in data['reactions'][(news[i.toString()][j]).toString()]) {
          angry = parseInt(data['reactions'][(news[i.toString()][j]).toString()]['Angry']);
        }
        positive[0] += love + haha;
        neutral[0] += like + wow;
        negative[0] += sad + angry;
        if (love + wow + like + haha + sad + angry > important_event_cutoff) {
          important_events[(data['title'][(news[i.toString()][j]).toString()])] = i;
        }
      }
    }
  }
  let sentiments = {'positive':positive, 'neutral':neutral, 'negative':negative};
  res.render("timeline", {
     sentiments: sentiments,
     events: important_events,
     startUTC: startUTC,
     startDay: startDay,
     firstDayUTC: firstDayUTC
  });
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
