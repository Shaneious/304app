var unirest = require('unirest');
var wtf = require('wtf_wikipedia');
var sentiment = require('sentiment');
var emotional = require('emotional');
var wordcount = require('word-count');
var WordPOS = require('wordpos'),
    wordpos = new WordPOS();
var utils = require('./utils');
var fetch = require('./fetch');

function Analyze() {
    this.doAnalysis = function(pageTitle, year) {
        return new Promise(resolve => {
        utils.startAnim("analyzing", 50);
        fetch.fetchText(pageTitle, year).then(text => {
            let ret = {};
            ret["wordcount"] = wordcount(text);
            wordpos.getPOS(text, obj => {
                ret["numNouns"] = obj.nouns.length;
                ret["numverbs"] = obj.verbs.length;
                ret["numAdjectives"] = obj.adjectives.length;
                ret["numAdverbs"] = obj.adverbs.length;
                ret["remaining"] = obj.rest.length;
                const textSentiment = sentiment(text);
                ret["sentiment"] = textSentiment.score;
                ret["comparative"] = textSentiment.comparative;
                emotional.load(function() {
                    const textEmotion = emotional.get(text);
                    ret["polarity"] = textEmotion.polarity;
                    ret["subjectivity"] = textEmotion.subjectivity;
                    const textPositive = emotional.positive(text);
                    ret["positive?"] = textPositive;
                    utils.stopAnim();
                    resolve(ret);
                });
            });
        });
    });
    }
}

var analyze = new Analyze();
module.exports = analyze;