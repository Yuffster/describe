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

function throwError() {
	throw new Error("expected error");
}

function promiseTimeout() {
	return {
		thing: function(success, failure) {
			setTimeout(success, 1000);
		}
	}
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

(function() {

	var arr = [], bowties;

	describe('test hooks', {
		beforeAll: function() {
			bowties = 'cool';
		},
		beforeEach: function() {
			arr[arr.length] = 1;
			arr[arr.length] = 2;
			arr[arr.length] = 3;
		},
		afterEach: function() {
			arr = [];
		},
		afterAll: function() {
			bowties = null;
		},
		'bowties are cool [beforeAll]': function() {
			this.expect(bowties, 'cool');
		},
		'arrays have three things [beforeEach]': function() {
			this.expect(arr.length, 3);
			arr[arr.length] = 5;
		},
		'arrays still have three things [afterEach]': function() {
			this.expect(arr.length, 3);
		}
	});

	describe('final test hook test', {
		"bowties aren't cool [afterAll]": function() {
			this.expect(bowties, null);
		}
	});

}());