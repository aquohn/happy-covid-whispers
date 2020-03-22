const express = require("express");
const request = require("request");
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

let buf = ["No messages yet!"];
let writeidx = 0;

app.get('/', function(req, res){
  request('http://f330e25c.ngrok.io/aggregate', function(err, response, body) {
    var body = JSON.parse(body);
    var overallTotal = body["overall"]["counts"]["negative"] + body["overall"]["counts"]["neutral"] + body["overall"]["counts"]["positive"];
    var healthTotal = body["health"]["counts"]["negative"] + body["health"]["counts"]["neutral"] + body["health"]["counts"]["positive"];
    var othersTotal = body["others"]["counts"]["negative"] + body["others"]["counts"]["neutral"] + body["others"]["counts"]["positive"];
    var manpowerTotal = body["manpower"]["counts"]["negative"] + body["manpower"]["counts"]["neutral"] + body["manpower"]["counts"]["positive"];
    var data = {
      overall: (body["overall"]["sentiment"]).toFixed(1),
      breakdown: [((body["overall"]["counts"]["positive"]/overallTotal) * 100).toFixed(1), ((body["overall"]["counts"]["neutral"]/overallTotal) * 100).toFixed(1), ((body["overall"]["counts"]["negative"]/overallTotal) * 100).toFixed(1)], //positive, neutral, negative
      healthcare: {
        overall: (body["health"]["sentiment"]).toFixed(1),
        breakdown: [((body["health"]["counts"]["positive"]/healthTotal) * 100).toFixed(1), ((body["health"]["counts"]["neutral"]/healthTotal) * 100).toFixed(1), ((body["health"]["counts"]["negative"]/healthTotal) * 100).toFixed(1)], //positive, neutral, negative
      },
      manpower: {
        overall: (body["manpower"]["sentiment"]).toFixed(1),
        breakdown: [((body["manpower"]["counts"]["positive"]/manpowerTotal) * 100).toFixed(1), ((body["manpower"]["counts"]["neutral"]/manpowerTotal) * 100).toFixed(1), ((body["manpower"]["counts"]["negative"]/manpowerTotal) * 100).toFixed(1)], //positive, neutral, negative
      },
      education: {
        overall: (body["others"]["sentiment"]).toFixed(1),
        breakdown: [((body["others"]["counts"]["positive"]/othersTotal) * 100).toFixed(1), ((body["others"]["counts"]["neutral"]/othersTotal) * 100).toFixed(1), ((body["others"]["counts"]["negative"]/othersTotal) * 100).toFixed(1)], //positive, neutral, negative
      }
    }
    console.log(data);
    res.render("\index", {
      data: data
    });
  })
})

app.get('/articles', function( req, res){
  request("http://f330e25c.ngrok.io/overall", function(err, response, body) {
    var body = JSON.parse(body);
    //-----------function for arranging everything------------------------------
    var data = [];
    var c = 0;
    Object.keys(body["title"]).forEach(function(key) {
      c++;
      var totalCount = body["counts"][key]["positive"] + body["counts"][key]["neutral"] + body["counts"][key]["negative"];
      var d = new Date(body["date"][key]);
      var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      var datestring = days[d.getDay()] + ", " + d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear();
      var article = {
        "title": body["title"][key],
        "date" : datestring,
        "url" : body["url"][key],
        "summary" : body["summary"][key],
        "sentiment" : (body["sentiment"][key]).toFixed(1),
        "breakdown" : {
          "positive" : Math.round((body["counts"][key]["positive"]) / totalCount * 100),
          "neutral" : Math.round((body["counts"][key]["neutral"]) / totalCount * 100),
          "negative" : Math.round((body["counts"][key]["negative"]) / totalCount * 100),
        },
        "wordcloud" : body["comments"][key]
      };
      data.push([body["date"][key], article]);
    })
    data.sort();
    var jsonData = {};
    for (var i = 0; i < data.length; i++) {
      jsonData[i] = data[i][1];
      console.log(jsonData[i]["wordcloud"]);
    }
    // console.log(jsonData);
    //--------------------------------------------------------------------------
    var prev = 0;
    res.render("\articles.ejs", {
      data: jsonData,
      onclick: "test()",
      prev: prev
    });
  })
  /*
  let rawdata = fs.readFileSync('./sample.json');
  let data = JSON.parse(rawdata);
  var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (var i = 0; i < Object.keys(data["date"]).length; i++) {
    var d = new Date(data["date"][i]);
    data["date"][i] = days[d.getDay()] + ", " + d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear();
  }
  var prev = 0;
  */
})

app.get('/aboutUs', function(req, res) {
  res.render("\aboutUs.ejs");
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
  request('http://f330e25c.ngrok.io/overall', function(err, response, body) {
    var data = JSON.parse(body);
  const important_event_cutoff = 0;
  // const startUTC = 1579712400000; //23 jan 
  const startUTC = 1584032400000;//13th march
  const firstDayUTC = 1579712400000;//23 jan 
  const dayConst = 24 * 3600000;
  const startDay = Math.floor((startUTC - firstDayUTC) / dayConst);
  let news = {};
  for ([post_index, utcx] of Object.entries(data['date'])) {
    dayNumber = Math.floor((utcx - firstDayUTC) /dayConst).toString()
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
      for (var j = 0; j < news[i.toString()].length; j ++) { 
        positive[0] += parseInt(data['counts'][(news[i.toString()][j]).toString()]['positive']);
        neutral[0] += parseInt(data['counts'][(news[i.toString()][j]).toString()]['neutral']);
        negative[0] += parseInt(data['counts'][(news[i.toString()][j]).toString()]['negative']);
        if (positive[0] + neutral[0] + negative[0] >= important_event_cutoff) { 
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
     firstDayUTC: firstDayUTC,
  });
})
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
