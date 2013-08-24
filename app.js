/**
 * Powered by Andy <andy@away.name>.
 * Date: 03.08.13
 */


var JobServer = require("job-server"),
	downloader = require("./downloader"),
	exec = require('child_process').exec;


var downloadUrl = function(url, useragent, cookies, charser, callback){

	var headers = {
		followAllRedirects: true,
		headers: {
			"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
			"Accept-Language": "he-IL,he;q=0.8,en-US;q=0.6,en;q=0.4",
			"User-Agent": useragent,
			"Accept-Charset": "utf-8;q=0.7,*;q=0.3",
			"Accept-Encoding": "gzip,deflate,sdch",
			"Cookies": cookies
		},
		encoding: charser,
		url: url
	};

	downloader.request(headers, function(err, req, data){
		callback(err, data || "");
	});
};

var execute = function(command, callback){
	console.log("Exec: " + command);
	exec(command, function(error, stdout, stderr){
		console.log("----complete: " + stdout);
		callback(null, stdout);
	});
};

var jobWorker = null;
function initWorker(){

	var worker = JobServer.createWorker({port: 8080, host:"192.168.56.1", maxqps: 3});
	worker.on('error', function(err){
		console.error("Worker: ", err);
	});

	worker.on('close', function(err){
		jobWorker = null;
	});

	worker.on('register', function(){
		jobWorker = worker;
	});

	worker.on('job-complete', function(job){
		console.log(new Date(), 'Complete job - ' + job.name, " ", job.args[0]);
	});

	worker.registerFunction('download', downloadUrl);
	worker.registerFunction('exec', execute);
}

setInterval(function(){
	if (jobWorker == null) initWorker();
}, 5000);
initWorker();
