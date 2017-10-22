var unirest = require('unirest');
var express = require('express');
var bodyParser = require('body-parser');
var wikiData = require('./data.json');
var htmlToText = require('html-to-text');
var wtf = require('wtf_wikipedia');
var nodeWiki = require('node-wikipedia');
var sentiment = require('sentiment');
var emotional = require('emotional');
var wordcount = require('word-count');
var WordPOS = require('wordpos'),
    wordpos = new WordPOS();
var fs = require('fs');
var COUNTER = 0;

require('dotenv').config()
var app = express();

console.log("We are rolling bois");

app.use('/',express.static('public'));

function processingAnim(){
  if(COUNTER == 0) {
    console.log("  . processing .  ");
    COUNTER ++;
  } else if(COUNTER == 1) {
    console.log(" .. processing .. ");
    COUNTER ++;
  } else if(COUNTER == 2){
    console.log("... processing ...");
    COUNTER ++;
  } else {
    console.log(" .. processing .. ");
    COUNTER = 0;
  }
}

function getCategoryItems(categoryName) {
	categoryName = categoryName.slice(9, categoryName.length);
	return new Promise((resolve, reject) => {
    unirest.get(`https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmlimit=500&format=json&cmtitle=Category:${categoryName}`)
    .end(function (response) {
			let categoryMembers = [];
			if(response && response.body && response.body.query && 
				response.body.query.categorymembers) {
				categoryMembers = response.body.query.categorymembers;
			}
			let categories = [];
			let portals = [];
			let pages = [];
			for(var i=0; i < categoryMembers.length; i++) {
				if(categoryMembers[i].title.slice(0,9) == "Category:") {
					categories.push(categoryMembers[i]);
				} else if(categoryMembers[i].title.slice(0,7) == "Portal:") {
					portals.push(categoryMembers[i]);
				} else {
					pages.push(categoryMembers[i]);
				}
      }

      processingAnim();
      
			resolve(
				{
					subCategories: categories,
          pageCount: pages.length,
          pages: pages
				}
			);
		  });
	});
}

function doesContain(checkPage, pageLst) {
  for(var idx in pageLst) {
    if(checkPage.title == pageLst[idx].title) {
      return true;
    }
  }
  return false;
}

function filterPages(pages) {
  let newPages = [];
  for(var idx in pages) {
    if(!doesContain(pages[idx], newPages)) {
      newPages.push({
        title: pages[idx].title,
        pageid: pages[idx].pageid
      });
    }
  }
  return newPages;
}


function mainCall() {
  getAllPages([{pageid: 1, title:"Category:Artificial intelligence"}], 4)
	.then(allPages => {
    console.log("finished.");
    console.log("--------------------");
    console.log(`NUM PAGES: ${allPages.length}`);

    setTimeout(function() {
      const filteredPages = filterPages(allPages);
      console.log(`NUM PAGES (verified): ${filteredPages.length}`);
    }, 1000);
    
  });
}

// UNCOMMENT THIS TO RUN
//mainCall();

// wtf_wikipedia node module <-- WAY BETTER
wtf.from_api("Artificial intelligence", "en", function(markup){
  var text= wtf.plaintext(markup)
  // "The Toronto Blue Jays are a Canadian professional baseball team..."
  console.log("---------- CHARACTERISTICS ----------");
  console.log(`word count: ${wordcount(text)}`);
  wordpos.getPOS(text, obj => {
    console.log(`noun count: ${obj.nouns.length}`);
    console.log(`verb count: ${obj.verbs.length}`);
    console.log(`adjective count: ${obj.adjectives.length}`);
    console.log(`adverb count: ${obj.adverbs.length}`);
    console.log(`rest count: ${obj.rest.length}`);
  });
  const textSentiment = sentiment(text);
  console.log(`sentiment score: ${textSentiment.score}`);
  console.log(`sentiment comparative: ${textSentiment.comparative}`);
  emotional.load(function() {
    const textEmotion = emotional.get(text);
    console.log(`polarity: ${textEmotion.polarity}`);
    console.log(`subjectivity: ${textEmotion.subjectivity}`);
    const textPositive = emotional.positive(text)? "yes": "no";
    console.log(`positive?: ${textPositive}`);
  });
});

function parseTimestamp(timestamp) {
  let timeDate = timestamp.split("T");
  let date = timeDate[0].split("-");
  let time = timeDate[1].split(":");
  let hour = parseInt(time[0]);
  let oldHour = hour;
  let period = "";
  if((hour-12) < 0) {
    period = "am";
  } else {
    hour = (hour-12);
    period = "pm";
  }
  const ret = {
    year: parseInt(date[0]), month: parseInt(date[1]), day: parseInt(date[2]),
    hour: hour, period: period, minute: parseInt(time[1]), "24hour": oldHour,
    second: time[2], pretty: `${date[2]}/${date[1]}/`+
            `${date[0]} @ ${hour}:${time[1]}:${time[2].slice(0,2)}`+
            `${period}`
  }
  return ret;
}

nodeWiki.revisions.all("42", { comment: false }, function(response) {
  // info on each revision made to Miles Davis' page
  const parsed = parseTimestamp(response[response.length-1].timestamp);
  console.log(`creation date: ${parsed.pretty}`);
});

// My content extract attempt
// var queryString = `https://en.wikipedia.org/w/api.php?action=query&`+
// `prop=revisions&rvprop=content&rvparse&rvsection=0&format=json`+
// `&titles=${"Artificial intelligence"}`;
// unirest.get(queryString)
// .end(function (response) {
//   let pages = response.body.query.pages;
//   let html = "";
//   for(var id in pages) {
//     html = pages[id].revisions[0]["*"];
//   }
//   let text = htmlToText.fromString(html);
//   console.log(html.length);
//   console.log(text.length);
//   console.log(text);
// });

function getAllPages(categories, depth) {
	return new Promise(resolve => {
		if(depth <= 0 || categories.length <= 0) {
			//console.log("depth reached");
			resolve([]);
		} else {
			// traverse each category
			let allPages = [];
			let callCount = 0;
			for(var i=0; i < categories.length; i++) {
				getCategoryItems(categories[i].title).then(obj => {

          // increment page count
          getAllPages(obj.subCategories, depth-1)
            .then(subPages => {
              callCount ++;
              allPages = allPages.concat(obj.pages);
              allPages = allPages.concat(subPages);
              if(callCount == categories.length) {
                resolve(allPages);
              }
            });
        });
			}
		}
	});
}


//Then this returns a promise that will resolve when ALL are so.
// Promise.all(promises).then(() => {
//     //All operations done
// });
//Promise.all(promiseChain).then(() => {console.log("TOTAL PAGES: " + TOTAL_PAGES)});



app.use('/api/database', require('./api/database'));

app.listen(8000, function () {
	console.log("listening on port 8000");
});