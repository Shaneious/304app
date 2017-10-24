var unirest = require('unirest');
var utils = require('./utils');
var wtf = require('wtf_wikipedia');

function Fetch() {

    var counter = 0;
    var failed = [];

    this.getCategoryItems = function(categoryName) {
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

    this.getCreationDate = getCreationDate;
    this.fetchText = fetchText;

    function fetchText(pageTitle, year) {
        url = `https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvlimit=1`+
        `&rvprop=content&rvdir=newer&rvstart=${year}-01-01T00:00:00Z&format=json&`+
        `titles=${utils.escape(pageTitle)}`;

        return new Promise(resolve => {
            unirest.get(url).end(function(response) {
        
            let wikipages = response.body.query.pages;
            let wikitext = "";
            for(var idx in wikipages) {
                wikitext = wikipages[idx].revisions[0]["*"];
                break;
            }
            let text = wtf.plaintext(wikitext);
            resolve(text);
            });
        });
      }
    
    function getCreationDate(pageTitle) {
        return new Promise(resolve => {
          let escaped = utils.escape(pageTitle);
      
          unirest.get(`https://en.wikipedia.org/w/api.php?`+
          `action=query&prop=revisions&rvlimit=1&rvprop=timestamp&`+
          `rvdir=newer&format=json&titles=${escaped}`)
          .end(function (response) {
            s0ts = "2000-01-01T14:10:17Z";
            if(response.body && response.body.query && response.body.query.pages) {
              let pages = response.body.query.pages;
              for(idx in pages) {
                if(pages[idx].revisions && pages[idx].revisions[0] &&
                    pages[idx].revisions[0].timestamp) {
                  let ret = utils.parseTimestamp(pages[idx].revisions[0].timestamp, pageTitle);
                  counter ++;
                  console.log(`${counter}: ${ret.pretty}`);
                  resolve(ret);
                } else {
                  counter ++;
                  let ret3 = utils.parseTimestamp(s0ts, pageTitle);
                  console.log(`${counter}: ${ret3.pretty} : ${pageTitle}`);
                  failed.push(pageTitle);
                  resolve(ret3);
                }
                break;
              }
            } else {
              counter ++;
              let ret2 = utils.parseTimestamp(s0ts, pageTitle);
              console.log(`${counter}: ${ret2.pretty} : ${pageTitle}`);
              failed.push(pageTitle);
              resolve(ret2);
            }
          });
        });
      }

    this.stratify = function(pages) {
        let counter = pages.length-1;
        let promises = [];

        return new Promise(resolve => {
            let interval = setInterval(function() {
                promises.push(getCreationDate(pages[counter].title));
                counter--;
                if(counter < 0) {
                    clearInterval(interval);
                    categorize(promises).then(strata => {resolve(strata)});
                }
            }, 50);
        });

        function categorize(promises) {
            let stratum = {s0:0, s1:0, s2:0, s3:0, s4:0};
            let strata = {s0:[], s1:[], s2:[], s3:[], s4:[]};

            return new Promise(resolve => {
            Promise.all(promises)
            .then(data => {
                data.forEach((parsed, idx) => {
                    if(parsed.year < 2001) {
                        stratum.s0 ++;
                        strata.s0.push(parsed.title);
                    } else if(parsed.year <= 2004) {
                        stratum.s1 ++;
                        strata.s1.push(parsed.title);
                    } else if(parsed.year <= 2008) {
                        stratum.s2 ++;
                        strata.s2.push(parsed.title);
                    } else if(parsed.year <= 2012) {
                        stratum.s3 ++;
                        strata.s3.push(parsed.title);
                    } else { // i.e. parsed.year <= 2017
                        stratum.s4 ++;
                        strata.s4.push(parsed.title);
                    }
                });
                console.log("----------- END -------------");
                console.log(stratum);
                failed.forEach((value,idx) => {
                    console.log(`FAILED: ${value}`);
                });
                resolve(strata);
            });
            });
        }
    }

    this.getAllPages = function(categories, depth) {
        return new Promise(resolve => {
            if(depth <= 0 || categories.length <= 0) {
                //console.log("depth reached");
                resolve([]);
            } else {
                // traverse each category
                let allPages = [];
                let callCount = 0;
                for(var i=0; i < categories.length; i++) {
                    this.getCategoryItems(categories[i].title).then(obj => {
    
              // increment page count
              this.getAllPages(obj.subCategories, depth-1)
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
}

var fetch = new Fetch();
module.exports = fetch;