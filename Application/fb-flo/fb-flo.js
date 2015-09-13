var flo = require('fb-flo'),
    path = require('path'),
    fs = require('fs');

var server = flo(
  "/Users/cristianfelix/Developer/VisualizeChange/",
  {
    port: 8889,
    host: 'localhost',
    verbose: false,
    glob: [
      '**/*.js',
      '**/*.html',
      '**/*.css'
    ]
  },
  function resolver(filepath, callback) {
    callback({
      resourceURL: filepath,
      contents: fs.readFileSync("/Users/cristianfelix/Developer/VisualizeChange/" + filepath).toString(),
    });
  }
);

server.once('ready', function() {
  console.log('Ready!');
});