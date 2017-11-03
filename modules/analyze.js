var unirest = require('unirest');
var wtf = require('wtf_wikipedia');
var sentiment = require('sentiment');
var emotional = require('emotional');
var wordcount = require('word-count');
var WordPOS = require('wordpos'),
    wordpos = new WordPOS();
var utils = require('./utils');
var fetch = require('./fetch');
var regex = require('word-regex')();

function Analyze() {
    this.doAnalysis = function(pageTitle, year) {
        return new Promise(resolve => {
        // utils.startAnim("analyzing", 50);
        fetch.fetchText(pageTitle, year).then(text => {
            let ret = {};
            ret["title"] = pageTitle;
            ret["year"] = year;
            ret["wordcount"] = wordcount(text);
            wordpos.getPOS(text, obj => {
                wordList = getWordList(text);
                
                /* Noun Counts*/
                ret["numNouns"] = duplicateCount(wordList,obj.nouns);
                ret["numUniqueNouns"] = obj.nouns.length;

                /* Verb Counts*/
                ret["numVerbs"] = duplicateCount(wordList,obj.verbs);
                ret["numUniqueVerbs"] = obj.verbs.length;

                /* Ajective Counts*/
                ret["numAdjectives"] = duplicateCount(wordList,obj.adjectives);
                ret["numUniqueAdjectives"] = obj.adjectives.length;

                /* Adverb Counts*/
                ret["numAdverbs"] = duplicateCount(wordList,obj.adverbs);
                ret["numUniqueAdverbs"] = obj.adverbs.length;

                /* Rest*/
                ret["remaining"] = obj.rest.length;

                /* Sentiments*/
                const textSentiment = sentiment(text);
                ret["sentiment"] = textSentiment.score;
                ret["comparative"] = textSentiment.comparative;
                emotional.load(function() {
                    const textEmotion = emotional.get(text);
                    ret["polarity"] = textEmotion.polarity;
                    ret["subjectivity"] = textEmotion.subjectivity;
                    const textPositive = emotional.positive(text);
                    ret["positive"] = textPositive;
                    // utils.stopAnim();
                    resolve(ret);
                });
            });         
        });
    });
    } 
}

function getWordList(text){
    words = text.match(regex);
    wordList = {};

    words.forEach((word)=>{
        newWord = word.toLowerCase();

        if (!wordList[newWord])
            wordList[newWord] = 1;
        else
            wordList[newWord]++;
    });

    return wordList;
}

function duplicateCount(wordList, searchList){
    count = 0;

    searchList.forEach((word)=>{
        word = word.toLowerCase();
        count = count + wordList[word];
    });
    
    return count;
}

var analyze = new Analyze();
module.exports = analyze;

