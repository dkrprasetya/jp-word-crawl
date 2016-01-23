var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var http = require('http');
var express = require('express');
var app = express();

var START_URL = "http://www.kayac.com";
var MAX_DEPTH = 10;

var pagesVisited = {};
var kanji = {};
var numPagesVisited = 0;
var pagesToVisit = [];
var url = new URL(START_URL);
var baseUrl = url.protocol + "//" + url.hostname;

const PORT=8080; 

pagesToVisit.push(START_URL);
pagesVisited.push
crawl(START_URL, 0);
initServer();

function initServer(){
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
}




function crawl(url, depth) {
  if(depth >= MAX_DEPTH){
    //console.log("Reached max limit of number of pages to visit.");
    return;
  } else
  if (url in pagesVisited){
  	return;
  } else {
  	visitPage(url,crawl,depth+1);
  }
}

function visitPage(url, callback, depth) {
	// Add page to our set
	pagesVisited[url] = true;
	numPagesVisited++;

	// Make the request
	console.log("Visiting page " + url);
	request(url, function(error, response, body) {
		// Check status code (200 is HTTP OK)
		//console.log("Status code: " + response.statusCode);
		if(!response || !response.statusCode || response.statusCode !== 200) {
			return;
		}
	    // Parse the document body
	    var $ = cheerio.load(body);
	    processKanji($);

	    if (depth < MAX_DEPTH){
	    	var nextPages = [];
		    collectInternalLinks($, nextPages);

		    console.log("next pages link: " + nextPages.length);
		    for (var i = 0; i < nextPages.length; i++){
		    	var f = function(j){
		    		callback(nextPages[j], depth+1);
		    	};

		    	setTimeout(f(i), 100);
		    }
	    }
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

function collectInternalLinks($, nextPages) {
    var relativeLinks = $("a[href^='/']");
    console.log("Found " + relativeLinks.length + " relative links on page");
    relativeLinks.each(function() {
		nextPages.push(baseUrl + $(this).attr('href'));
    });
}


