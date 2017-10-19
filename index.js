var unirest = require('unirest');
var express = require('express');
var bodyParser = require('body-parser');

require('dotenv').config()
var app = express();

console.log("We are rolling bois");

app.use('/',express.static('public'));

function getCategoryItems(categoryName) {
	categoryName = categoryName.slice(9, categoryName.length);
	return new Promise((resolve, reject) => {
		unirest.get(`https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmlimit=500&format=json&cmtitle=Category:${categoryName}`).end(function (response) {
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

			resolve(
				{
					subCategories: categories,
					pageCount: pages.length
				}
			);
		  });
	});
}

getCategoriesPageCount([{title:"Category:Artificial intelligence"}], 2)
	.then(pageCount => {
    console.log(pageCount);
    console.log("finished.");
  });

function getCategoriesPageCount(categories, depth) {
	return new Promise(resolve => {
		if(depth <= 0 || categories.length <= 0) {
			//console.log("depth reached");
			resolve(0);
		} else {
			// traverse each category
			let fullPageCount = 0;
			let callCount = 0;
			for(var i=0; i < categories.length; i++) {
				getCategoryItems(categories[i].title).then(obj => {

					// increment page count
					getCategoriesPageCount(obj.subCategories, depth-1)
						.then(subPageCount => {
							callCount ++;
							fullPageCount += (subPageCount + obj.pageCount);
							if(callCount == categories.length){
								resolve(fullPageCount);
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