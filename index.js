var unirest = require('unirest');
var express = require('express');
var bodyParser = require('body-parser');
var TOTAL_PAGES = 0;
var ALL_CATEGORIES = [];

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
			// console.log(`Category: ${categoryName}`);
			// console.log(`Pages: ${pages.length}`);
			// console.log(`Categories: ${categories.length}`);
			// console.log(`Portals: ${portals.length}`);
			// console.log("--------------------------------------------------");
			resolve(
				{
					subCategories: categories,
					pageCount: pages.length
				}
			);
		  });
	});
}


var count = 0;

traverseCategories([{title: "Category:Artificial intelligence"}], 2);

function traverseCategories(categories, depth) {
	if(categories.length <= 0 || depth <= 0) {
		console.log("depth reached");
		console.log(`CURRENT TOTAL PAGES: ${TOTAL_PAGES}`);
		return;
	} else {
		console.log(`CURRENT TOTAL PAGES: ${TOTAL_PAGES}`);
		// traverse each category
		for(var i=0; i < categories.length; i++) {
			getCategoryItems(categories[i].title).then(obj => {
				// console.log(newCategories);
				// let allCategories = categories.concat(newCategories);
				// allCategories.splice(0,1);
				// console.log(allCategories);
				// idkWhat(allCategories, 0);
				TOTAL_PAGES += obj.pageCount;
				traverseCategories(obj.subCategories, depth-1);
			});
		}
		
	}
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