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

      // not sampling here...
      const sampledPages = utils.randomSamplePages(filteredPages,10000000);
      console.log(`NUM SAMPLES PAGES: ${sampledPages.length}`);

      fetch.stratify(sampledPages).then(strata => {
        console.log("These are the stratas");
        console.log(strata); // this is the strata (page titles, for use with analyze)
        // Stratified sampling...
        // let randomRevisions = utils.randomRevisionsStratified(strata, 1000);
        // Regular random sampling...
        let randomRevisions = utils.allRevisions(strata);
        console.log(randomRevisions.length);
        writeJSON(randomRevisions);
      });
    }, 200);
  });
}

//analyze.doAnalysis("Artificial intelligence",2016);
function getAnalysis(revisions){
  let promises = [];
  return new Promise(resolve=>{

    // for (stratum in strata){
    //   for (index in strata[stratum]){
    //     var min = parseInt(stratum[1]); 
    //     var year = 2000 + ((Math.floor(Math.random()*(5-min)) + min)*4);
    //     promises.push(analyze.doAnalysis(strata[stratum][index], year));
    //   }
    // }
    // for (i in revisions) {
    //   promises.push(analyze.doAnalysis(revisions[i].title,
    //                                     revisions[i].year));
    // }
    let counter = revisions.length-1;
    let interval = setInterval(function() {
      console.log(`${counter}: analyzing ...`);
      promises.push(analyze.doAnalysis(revisions[counter].title,
              revisions[counter].year));
      counter --;
      if(counter < 0) {
        clearInterval(interval);
        resolve(promises);
      }
    }, 50);

    
  });
}

function writeJSON(revisions){
  let aiPages = {
    title: [], year: [], strata: [], wordcount: [], numNouns: [], numUniqueNouns: [], numVerbs: [], 
    numUniqueVerbs: [], numAdjectives: [], numUniqueAdjectives: [], numAdverbs: [], numUniqueAdverbs:[],
    remaining: [], popularNoun: [], popularVerb: [], popularAdjective: [], popularAdverb: [],
    popularWord: [], sentiment: [], comparative: [], polarity: [], subjectivity: [], positive: [] 
  }
  getAnalysis(revisions)
  .then(promises=>{
    Promise.all(promises)
    .then(data=>{
      for (index in data){
        if (data[index]["nullCase"]) continue;

        for (characteristic in aiPages){
          aiPages[characteristic].push(data[index][characteristic]);
        }
      }

      var jsonData =  JSON.stringify(aiPages);
      fs.writeFile('data.json', jsonData, 'utf8',()=>{});
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