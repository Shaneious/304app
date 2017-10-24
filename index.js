// created modules
var utils = require('./modules/utils');
var analyze = require('./modules/analyze');
var fetch = require('./modules/fetch');


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
        console.log(strata); // this is the strata (page titles, for use with analyze)
      });
    }, 200);
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