var listinator = require("../../");

var scopeEl = document.body;
var list = listinator.attach(".handle", scopeEl);

window.list = list;

// list.on("reorder", function(e) {
//   console.log("reordered", e);
// });
