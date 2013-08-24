/**
 * Powered by Andy <andy@away.name>.
 * Date: 03.08.13
 */

var request = require('request')
	, Iconv = require('iconv').Iconv
	, iconv_win1251_to_utf8 = new Iconv('cp1251', 'utf-8')
	, zlib = require('zlib');

function request_unzip(options, cb) {
	var enc = options.encoding;
	options.encoding = null;
	var r = request(options).on('error', function(err){
		cb(err);
	}).on('response', function (response) {
		var bufarr = [];
		var errored = false;
		switch (response.headers['content-encoding']) {
			// or, just use zlib.createUnzip() to handle both cases
			case 'gzip':
			case 'deflate':
				if (response.headers['content-encoding'] == 'gzip')
					var zpipe = zlib.createGunzip();
				else
					var zpipe = zlib.createInflate();

				zpipe
					.on('data', function (d) {
						bufarr.push(d);
					})
					.on('end', function () {
						if (errored) return;
						errored = true;
						cb(null, response, enc ? Buffer.concat(bufarr).toString(enc) : Buffer.concat(bufarr));
					})
					.on('error', function (err) {
						if (errored) return;
						errored = true;
						cb(err, response, null);
					});
				response.pipe(zpipe);
				response
					.on('error', function (err) {
						if (errored) return;
						errored = true;
						cb(err, response, null);
					});
				break;
			default:
				response
					.on('data', function (d) {
						bufarr.push(d);
					})
					.on('end', function () {
						if (errored) return;
						errored = true;
						cb(null, response, enc ? Buffer.concat(bufarr).toString(enc) : Buffer.concat(bufarr));
					})
					.on('error', function (err) {
						if (errored) return;
						errored = true;
						cb(err, response, null);
					});
				break;
		}
	});
	return r;
}

exports.request = function(options, cb){
	if (options.encoding == 'UTF-8') {
		options.encoding = 'binary';
		return request_unzip(options, function (error, request, data) {
			if (data == null) {
				cb(error, request);
			}
			else {
				try {
					var body = new Buffer(data, 'binary');
					cb(error, request, iconv_win1251_to_utf8.convert(body).toString('utf8'));
				}
				catch (e) {
					error = e;
					cb(error, request);
				}
			}
		});
	}
	else
		return request_unzip(options, function (error, request, data) {
			if (data == null) {
				cb(error, request);
			}
			else {
				try {
					var body = new Buffer(data, 'binary').toString('utf8');
					cb(error, request, body);
				}
				catch (e) {
					error = e;
					cb(error, request);
				}
			}
		});
};