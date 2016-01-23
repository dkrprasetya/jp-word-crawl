var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var http = require('http');
var express = require('express');
var app = express();

var START_URL = "http://www.kayac.com";
var MAX_PAGES_TO_VISIT = 1000;

var pagesVisited = {};
var kanji = {};
var numPagesVisited = 0;
var pagesToVisit = [];
var url = new URL(START_URL);
var baseUrl = url.protocol + "//" + url.hostname;

const PORT=8080; 

pagesToVisit.push(START_URL);
crawl();

app.get('/', function(request, response){
	var sorted = [];
	for (var cc in kanji){
		sorted.push([cc, kanji[cc]]);
	}
	sorted.sort(function(a, b){ return b[1] - a[1]});

	kanji = {};
	for (var i = 0; i < sorted.length; ++i){
		kanji[sorted[i][0]]= sorted[i][1];
	}

	response.header("Content-Type", "application/json; charset=utf-8");
    response.write(JSON.stringify(kanji), 'utf8');
    response.end();

    console.log("Handling request, size of sorted: " + sorted.length);
});

var server = app.listen(PORT, function(){
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Server listening on: http://localhost:%s", PORT);
});


function crawl() {
  if(numPagesVisited >= MAX_PAGES_TO_VISIT) {
    console.log("Reached max limit of number of pages to visit.");
    return;
  }
  var nextPage = pagesToVisit.pop();
  if (nextPage in pagesVisited) {
    // We've already visited this page, so repeat the crawl
    crawl();
  } else {
    // New page we haven't visited
    visitPage(nextPage, crawl);
  }
}

function visitPage(url, callback) {
	// Add page to our set
	pagesVisited[url] = true;
	numPagesVisited++;

	// Make the request
	console.log("Visiting page " + url);
	request(url, function(error, response, body) {
		// Check status code (200 is HTTP OK)
		console.log("Status code: " + response.statusCode);
		if(response.statusCode !== 200) {
			callback();
			return;
		}
	    // Parse the document body
	    var $ = cheerio.load(body);
	    processKanji($);
	    collectInternalLinks($);
	    callback();
	});
}

function processKanji($) {
	var i = 0;
	var str = $('html > body').text().toLowerCase();
	var len = str.length;
	for (; i < len; i++){
		var cc = str.charAt(i);
		if (/^[\u4e00-\u9faf]+$/.test(cc)){
			if (cc in kanji){
				var val = kanji[cc];
				kanji[cc] = (val+1);
			} else {
				kanji[cc] = 1;
			}
		}
	}
}

function collectInternalLinks($) {
    var relativeLinks = $("a[href^='/']");
    console.log("Found " + relativeLinks.length + " relative links on page");
    relativeLinks.each(function() {
		pagesToVisit.push(baseUrl + $(this).attr('href'));
    });
}


