var unirest = require('unirest');
var express = require('express');
var bodyParser = require('body-parser');
var wikiData = require('./data.json');
var htmlToText = require('html-to-text');
var wtf = require('wtf_wikipedia');
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
  console.log(text);
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