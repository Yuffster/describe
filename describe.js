(function(scope) {

	var isModule = false;

	// Export with CommonJS
	if (typeof module !== 'undefined' && typeof require !== 'undefined') {
		isModule = true;
	}

	var options = {
		timeout: 500,
		callbackMode: false
	};

	function outputDOM(data) {
		String.prototype.color = function(color) {
			return '<span style="color:'+color+
			       ';font-weight:bold;">'+this+"</span>";
		};
		document.body.innerHTML = "<pre>"+getOutput(data)+"</pre>";
	}

	function outputConsole(data, options) {

		require('string-color');

		console.log(getOutput(data));

		process.exit(data.total-data.passed);

	}

	function getOutput(data) {

		var output = "";

		for (var k in data.errors) {
			output += k.color('red')+"\n";
			output += (data.errors[k].stack || data.errors[k])+"\n";
		}

		if (data.passed!==data.total) output += "FAILED".color('red');
		else output += "PASSED".color('green');
		output += ": "+data.passed+"/"+data.total;

		return output;

	}

	function expect(subject, expected, callback, options) {
		if (subject && subject.then && options.callbackMode == "promises") {
			subject.then(function(data) {
				expect(data, expected, callback, options);
			}, callback);
		}
		if (expected===undefined) {
			expected = subject;
			subject  = null;
			return function(response,data) {
				if (options.callbackMode=='node') {
					if (response) {
						return callback(response);
					} else response = data;
				}
				expect(response, expected, callback);
			};
		}  else {
			if (subject==expected) callback(null);
			else callback(new Error("Expected "+expected+" but got "+subject));
		}
	}

	function runTest(fun, callback, options) {

		var done = false, timer;

		try {
			fun.call({
				expect: function(a,b) {
					return expect(a,b,callback,options);
				}
			});
		} catch (e) {
			if (done) return;
			done = true;
			callback(e);
			clearTimeout(timer);
		}

		var error = new Error("Test timeout after "+options.timeout+"ms");
		timer = setTimeout(function() {
			if (done) return;
			callback(error);
			done = true;
		}, options.timeout);

	}

	function Group(name, tests, config) {
		this.options = options;
		for (var k in config) this.options[k] = config[k];
		this.tests = tests;
	}

	Group.prototype.execute = function(callback) {

		var pending = 0, results = {}, my = this, errors = {},
		    total   = 0, passed = 0;

		for (var name in this.tests) {
			if (this.tests.hasOwnProperty(name)) pending++;
		}

		for (name in this.tests) {
			if (this.tests.hasOwnProperty(name)) (function(name){
				var returned = false;
				total++;
				runTest(my.tests[name], function(error) {
					if (returned) {
						results[name] = new Error("Duplicate callback");
						return;
					}
					returned = true;
					pending--;
					results[name] = error;
					if (error === null) passed++;
					else {
						errors[name] = error;
					}
					if (pending===0) {
						callback({
							total: total,
							passed: passed,
							results: results,
							errors: errors
						});
					}
				}, my.options);
			}(name));
		}

	};

	var results = {}, pendingGroups = 0, resultCallbacks = [], errors = {},
	    total = 0, passed = 0;

	function describe(name, tests, config) {
		pendingGroups++;
		new Group(name, tests, config).execute(function(data) {
			results[name] = data;
			total  += data.total;
			passed += data.passed;
			for (var k in data.errors) errors[name+'#'+k] = data.errors[k];
			pendingGroups--;
			if (pendingGroups===0) {
				result = {
					total: total, passed: passed, results: results, 
					errors: errors
				};
				var next = resultCallbacks.shift();
				while (next) {
					next(result);
					next = resultCallbacks.shift();
				}
			}
		});
	}

	describe.config = function(k,v) {
		if (v) options[k] = v;
		return options[k] || false;
	};

	describe.getResults = function(cb) {
		if (pendingGroups===0) cb(results);
		else resultCallbacks[resultCallbacks.length] = cb;
	};

	describe.logResults = function() {
		describe.getResults(function(data) {
			if (typeof window !== "undefined") outputDOM(data, options);
			else outputConsole(data, options);
		});
	};

	if (isModule) module.exports = describe;
	else scope.describe = describe;

}(this));