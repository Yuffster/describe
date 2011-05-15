require('./describe');
var assert = require('assert');

describe("Does it work?", {

	'Yes, it appears to': function() {
		assert.ok(true);
	},

	'This test should fail.': function() {
		assert.ok(false);
	},

	'But this should pass.': function() {
		assert.ok(true);
	}

});
