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
var Tokenizer = require('sentence-tokenizer');
var tokenizer = new Tokenizer('Chuck');

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
                
                /*handle null case*/
                if (Object.keys(wordList).length <= 0)
                    ret["nullCase"] = true;

                /*Strata*/
                ret["strata"] = "S"+(year-2000)/4;

                /* Noun Counts*/
                nounProperties = getProperties(wordList,obj.nouns);
                ret["numNouns"] = nounProperties["count"];
                ret["numUniqueNouns"] = obj.nouns.length;
                ret["popularNoun"] = nounProperties["commonWord"];

                /* Verb Counts*/
                verbProperties = getProperties(wordList,obj.verbs);
                ret["numVerbs"] = verbProperties["count"];
                ret["numUniqueVerbs"] = obj.verbs.length;
                ret["popularVerb"] = verbProperties["commonWord"];

                /* Ajective Counts*/
                adjectiveProperties = getProperties(wordList,obj.adjectives);
                ret["numAdjectives"] = adjectiveProperties["count"];
                ret["numUniqueAdjectives"] = obj.adjectives.length;
                ret["popularAdjective"] = adjectiveProperties["commonWord"];

                /* Adverb Counts*/
                adverbProperties = getProperties(wordList,obj.adverbs)
                ret["numAdverbs"] = adverbProperties["count"];
                ret["numUniqueAdverbs"] = obj.adverbs.length;
                ret["popularAdverb"] = adverbProperties["commonWord"];

                /* Rest*/
                ret["remaining"] = obj.rest.length;

                /* Get most popular word*/
                ret["popularWord"] = getPopular([nounProperties,verbProperties,
                    adjectiveProperties,adverbProperties]);

                /* Sentiments*/
                const textSentiment = sentiment(text);
                ret["sentiment"] = textSentiment.score;
                ret["comparative"] = textSentiment.comparative;

                emotional.load(function() {
                    count = 0;
                    sumSubj = 0;
                    sumPolar = 0;
                    sumPositive = 0;
                    tokenizer.setEntry(text);
                    tokenizer.getSentences().forEach((sentence)=>{
                        data = emotional.get(sentence);
                        sumSubj += data.subjectivity;
                        sumPolar += data.polarity;

                        if (emotional.positive(sentence))
                            sumPositive ++;
                        else 
                            sumPositive --;

                        count++;
                    });

                    ret["polarity"] = sumPolar/count;
                    ret["subjectivity"] = sumSubj/count;
                    ret["positive"] = (sumPositive>0);
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

    if (words){
        words.forEach((word)=>{
            newWord = word.toLowerCase();

            if (!wordList[newWord])
                wordList[newWord] = 1;
            else
                wordList[newWord]++;
        });
    }

    return wordList;
}

function getProperties(wordList, searchList){
    properties = {};
    commonWord = "";
    commonCount = 0;
    count = 0;

    searchList.forEach((word)=>{
        word = word.toLowerCase();
        count = count + wordList[word];

        if (commonCount < wordList[word] && word.length>=4){
            commonWord = word;
            commonCount = wordList[word];
        }
    });
    
    properties["count"] = count;
    properties["commonCount"] = commonCount;
    properties["commonWord"] = commonWord;
    return properties;
}

function getPopular(words){
    popular = "";
    count = 0;

    words.forEach(word=>{
        if (count < word["commonCount"]){     
            count = word["commonCount"];
            popular = word["commonWord"];
        }
    });
    return popular;
}

var analyze = new Analyze();
module.exports = analyze;

