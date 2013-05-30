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

	function outputDOM(data, options) {
		String.prototype.color = function(color) {
			return '<span style="color:'+color+';font-weight:bold;">'+this+"</span>";
		};
		document.body.innerHTML = "<pre>"+outputConsole(data, options)+"</pre>";
	}

	function outputConsole(data, options) {

		var color, test, lines, errors = {},
		    passed = 0, tests = 0, totalTests = 0, totalPassed = 0,
		    output = [];

		options = options || {};

		function log(mess) {
			output[output.length] = mess;
		}

		if (!String.prototype.color) require('string-color');
		for (var groupName in data) {
			lines = [], passed = 0, tests = 0;
			for (test in data[groupName]) {
				tests++;
				if (data[groupName][test]===null) {
					color = 'green';
					passed++;
				} else {
					color = 'red';
					errors[groupName] = errors[groupName] || {};
					errors[groupName][test] = data[groupName][test];
				}
				lines[lines.length] = ('\t'+test).color(color);
			}
			color = (tests==passed) ? 'green' : 'red';
			if (options.verbose) {
				alert("HOAI");
				log((groupName+' ('+passed+'/'+tests+')').color(color));
				log(lines.join('\n'));
			}
			totalPassed += passed;
			totalTests += tests;
		}
		if (totalPassed===totalTests) {
			result = 'passed';
			color  = 'green';
		} else {
			color  = 'red';
			result = 'failed';
		}
		for (var groupName in errors) {
			for (var test in errors[groupName]) {
				log((groupName+"#"+test).color('red'));
				log(errors[groupName][test].stack);
			}
		}
		log(
			("Tests "+result+": "+totalPassed+'/'+totalTests).color(color)
		);
		if (typeof process != "undefined") {
			console.log(output.join('\n'));
			process.exit(totalTests-totalPassed);
		} else {
			return output.join('\n');
		}
	}

	function expect(subject, expected, callback, options) {
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
		} else {
			if (subject==expected) callback(null);
			else callback(new Error("Expected "+expected+" but got "+subject));
		}
	}

	function runTest(fun, callback, options) {

		var done = false, timer;

		try {
			fun.call({
				expect: function(a,b) {
					done = true;
					clearTimeout(timer);
					return expect(a,b,callback,options);
				}
			});
		} catch (e) {
			if (done) return;
			done = true;
			callback(e);
			clearTimeout(timer);
		}

		timer = setTimeout(function() {
			if (done) return;
			callback(new Error("Test timeout after "+options.timeout+"ms"));
			done = true;
		}, options.timeout);

	}

	function Group(name, tests, config) {
		this.options = options;
		for (var k in config) this.options[k] = config[k];
		this.tests = tests;
	}

	Group.prototype.execute = function(callback) {

		var pending = 0, results = {}, my = this;

		for (var name in this.tests) {
			if (this.tests.hasOwnProperty(name)) pending++;
		}

		for (name in this.tests) {
			if (this.tests.hasOwnProperty(name)) (function(name){
				var returned = false;
				runTest(my.tests[name], function(error) {
					if (returned) {
						results[name] = new Error("Duplicate callback");
						return;
					}
					returned = true;
					pending--;
					results[name] = error;
					if (pending===0) callback(results);
				}, my.options);
			}(name));
		}

	};

	var results = {}, pendingGroups = 0, resultCallbacks = [];

	function describe(name, tests, config) {
		pendingGroups++;
		new Group(name, tests, config).execute(function(data) {
			results[name] = data;
			pendingGroups--;
			if (pendingGroups===0) {
				var next = resultCallbacks.shift();
				while (next) {
					next(results);
					next = resultCallbacks.shift();
				}
			}
		});
	}

	describe.config = function(k,v) {
		if (v) options[k] = v;
		return options[k] || false;
	}

	describe.getResults = function(cb) {
		if (pendingGroups===0) cb(results);
		else resultCallbacks[resultCallbacks.length] = cb;
	}

	describe.logResults = function(options) {
		describe.getResults(function(data) {
			if (typeof window !== "undefined") outputDOM(data, options);
			else outputConsole(data, options);
		});
	}

	if (isModule) module.exports = describe;
	else scope.describe = describe;

}(this));