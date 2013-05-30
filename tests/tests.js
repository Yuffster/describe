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

function addThingsPromise() {
	var n = 0;
	for (var i in arguments) n+=arguments[i];
	return {
		then: function(success, failure) {
			success(n);
		}
	};
}

function failedPromise() {
	return {
		then: function(success, failure) {
			failure(new Error("expected error"));
		}
	};
}

function promiseTimout() {
	return {
		thing: function(success, failure) {
			setTimeout(success, 1000);
		}
	}
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

describe("promise callback style", {

	'promises-style addition': function() {
		this.expect(addThingsPromise(2, 2), 4);
	},

	'promises-style failure (this should fail)': function() {
		this.expect(failedPromise(2, 2), 4);
	},

	'promises-style timeout (this should fail)': function() {
		this.expect(promiseTimeout(), 42);
	}

}, {
	callbackMode: 'promises'
});