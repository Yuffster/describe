require("string-color");
describe = function(series, obj) {

	console.log(series.toUpperCase().color('yellow')+":");

	var passed = 0, failed = 0, total = 0;

	for (var k in obj) {

		if (!obj.hasOwnProperty(k)) continue;

		var test = obj[k], desc = k;

		total++;
		try {
			test();
		} catch (e) {
			failed++;
			console.log("\t"+desc.color('red'));
			console.log("\t\t====> "+e.stack);
			continue;
		}

		passed++;

		console.log("\t"+desc.color('green'));

	};

	console.log(
		"PASSED".color('green')+": "+passed+
		" / "+total
	);


};
