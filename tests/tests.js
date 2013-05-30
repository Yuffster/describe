if (typeof module !== 'undefined' && typeof require !== 'undefined') {
	var describe = require('../describe');
}

function addThingsSync() {
	var n = 0;
	for (var i in arguments) n+=arguments[i];
	return n;
}

function addThingsAsync() {
	var n = 0, callback;
	for (var i in arguments) {
		if (i==arguments.length-1) callback = arguments[i];
		else n+=arguments[i];
	} callback(n);
}

function asyncNodeError(callback) {
	callback('test error', null);
}

function asyncNodeData(callback) {
	callback(null, 'data');
}

describe("synchronous operations", {

	'basic expectation': function() {
		this.expect(true, true);
	},

	'log error on exception (this should fail)': function() {
		throw new Error("intentional failure");
	},

	'failed expectation (this should fail)': function() {
		this.expect(false, true);
	},

	'synchronous function call': function() {
		this.expect(addThingsSync(1,2,3), 6);
	}

});

describe("asynchronous operations", {

	'asynchronous function call': function() {
		addThingsAsync(1,2,3,this.expect(6));
	},

	'asynchronous timeout (this should fail)': function() {
		var my = this;
		setTimeout(function() { my.expect(42); }, 1000);
	}

});

describe("node error style", {

	'asynchronous node-style error (this should fail)': function() {
		asyncNodeError(this.expect(true));
	},

	'asynchronous node-style data': function() {
		asyncNodeData(this.expect('data'));
	}

}, {
	callbackMode: 'node'
});