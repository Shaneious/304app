
// UTILITY FUNCTIONS ----------------------
function Utils() {
    var interval = 0;

    String.prototype.replaceAll = function(search, replacement) {
        var target = this;
        return target.split(search).join(replacement);
      };

    this.escape = function(pageTitle) {
        return encodeURI(pageTitle).replaceAll("&", "%26")
                                    .replaceAll("+","%2B");
      }
    this.startAnim = function(word, speed){
        let counter = 0;
        interval = setInterval(function() {
            if(counter == 0) {
                console.log(`  . ${word} .  `);
                counter ++;
                } else if(counter == 1) {
                console.log(` .. ${word} .. `);
                counter ++;
                } else if(counter == 2){
                console.log(`... ${word} ...`);
                counter ++;
                } else {
                console.log(` .. ${word} .. `);
                counter = 0;
            }
        }, speed);
      }
    
    this.stopAnim = function(){
        clearInterval(interval);
    }

    
    this.doesContain = function(checkPage, pageLst) {
        for(var idx in pageLst) {
          if(checkPage.title == pageLst[idx].title) {
            return true;
          }
        }
        return false;
      }
    
    this.filterPages = function(pages) {
        let newPages = [];
        for(var idx in pages) {
          if(!this.doesContain(pages[idx], newPages)) {
            newPages.push({
              title: pages[idx].title,
              pageid: pages[idx].pageid
            });
          }
        }
        return newPages;
      }
    
    this.parseTimestamp = function(timestamp, pageTitle) {
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
                  `${period}`,
          title: pageTitle
        }
        return ret;
      }
      
    this.randomSamplePages = function(pages, sampleSize){
      let newPages = [];

      if (sampleSize > pages.length){
        return pages;
      }

      while (sampleSize>0){
        var randomnumber = Math.floor(Math.random()*pages.length);
        if (!newPages.includes(pages[randomnumber])){
          newPages.push(pages[randomnumber]);
          sampleSize--;
        }
      }
      return newPages;
    }
}

var utils = new Utils();
module.exports = utils;


