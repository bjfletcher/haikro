'use strict';

// Test stuff
var assert = require("assert");

GLOBAL.fetch = require('node-fetch');
var shellpromise = require('shellpromise');
var promiseToWait = require('./tools/promise-to-wait');

var create = require('./tools/create');
var destroy = require('./tools/destroy');
var build = require('../lib/build');
var deploy = require('../lib/deploy');

describe('run things in bin deployment', function() {
	it('can create, deploy and delete an app that runs from inside node_modules/.bin', function() {
		this.timeout(120 * 1000);
		var app, token, project = __dirname + '/fixtures/run-things-in-bin';

		return shellpromise('heroku auth:token')
			.then(function(result) {
				token = result;
				return build({ project: project });
			})
			.then(function() {
				return create();
			})
			.then(function(name) {
				app = name;
				return deploy({
					app: app,
					token: token,
					project: project
				});
			})

			// HACK - Give Heroku a second or two to sort itself out
			.then(promiseToWait(4))
			.then(function() {
				return fetch('https://' + app + '.herokuapp.com/');
			})
			.then(function(response) {
				assert.equal(200, response.status);
				return response.text();
			})
			.then(function(body) {
				assert(/the simplest webserver in the bin/.test(body));
			})
			.then(function() {
				return destroy(app);
			});
	});
});
