// created modules
var utils = require('./modules/utils');
var analyze = require('./modules/analyze');
var fetch = require('./modules/fetch');
var fs = require('fs');

function mainCall() {
  utils.startAnim("fetching pages", 100);
  fetch.getAllPages([{pageid: 1164, title:"Category:Artificial intelligence"}], 1)
	.then(allPages => {
    utils.stopAnim();
    console.log("finished.");
    console.log("--------------------");
    console.log(`NUM PAGES: ${allPages.length}`);

    setTimeout(function() {
      const filteredPages = utils.filterPages(allPages);
      console.log(`NUM PAGES (verified): ${filteredPages.length}`);
      fetch.stratify(filteredPages.slice(0,10)).then(strata => {
        console.log("These are the stratas");
        console.log(strata); // this is the strata (page titles, for use with analyze)
        writeJSON(strata);
      });
    }, 200);
  });
}


function getAnalysis(strata){
  let promises = [];
  return new Promise(resolve=>{

    for (stratum in strata){
      for (index in strata[stratum]){
        var i = 5 - parseInt(stratum[1]);
        while (i > 0){
          var year = 2001 + (i*4);
          promises.push(analyze.doAnalysis(strata[stratum][index], year));
          i--;
        }
      }
    }
    resolve(promises); 
  });
}

function writeJSON(strata){
  let aiPages = {
    title: [], year: [], wordcount: [], numNouns: [], numverbs: [], numAdjectives: [], numAdverbs: [],
    remaining: [], sentiment: [], comparative: [], polarity: [], subjectivity: [], positive: [] 
  }

  console.log("Creating JSON document...");
  getAnalysis(strata)
  .then(promises=>{
    Promise.all(promises)
    .then(data=>{
      for (index in data){
        aiPages.title.push(data[index].title);
        aiPages.year.push(data[index].year);
        aiPages.wordcount.push(data[index].wordcount);
        aiPages.numNouns.push(data[index].numNouns);
        aiPages.numverbs.push(data[index].numverbs);
        aiPages.numAdjectives.push(data[index].numAdjectives);
        aiPages.numAdverbs.push(data[index].numAdverbs);
        aiPages.remaining.push(data[index].remaining);
        aiPages.sentiment.push(data[index].sentiment);
        aiPages.comparative.push(data[index].comparative);
        aiPages.polarity.push(data[index].polarity);
        aiPages.subjectivity.push(data[index].subjectivity);
        aiPages.positive.push(data[index].positive);
      }

      var jsonData =  JSON.stringify(aiPages);
      fs.writeFile('data.json', jsonData, 'utf8',()=>{});
      console.log("JSON document Completed")
    });
  });
}

// UNCOMMENT THIS TO RUN
mainCall();

// UNCOMMENT to ANALYZE (e.g. AI page)
// analyze.doAnalysis("Artificial intelligence", 2017).then(analyzed => {console.log(analyzed)});






// DB / APP stuff
// require('dotenv').config()
// var app = express();

// app.use('/',express.static('public'));
// app.use('/api/database', require('./api/database'));

// app.listen(8000, function () {
// 	console.log("listening on port 8000");
// });