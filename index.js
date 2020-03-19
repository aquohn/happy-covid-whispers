const express = require("express");
const partials = require("express-partials");
const app = express();
app.set('view engine', 'ejs');
app.use(partials());


const port = 80;

app.get('/', function(req, res){
  var data = {
    overall: 0.7
  }
  res.render("\index", {
    data: data
  });
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
