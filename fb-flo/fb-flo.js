var flo = require('fb-flo'),
    path = require('path'),
    fs = require('fs');

var server = flo(
  "/Users/cristianfelix/Developer/WHS/Application",
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
    // 1. Call into your compiler / bundler.
    // 2. Assuming that `bundle.js` is your output file, update `bundle.js`
    //    and `bundle.css` when a JS or CSS file changes.
    console.log(filepath);
    callback({
      reload: true,
      resourceURL: filepath,
      // any string-ish value is acceptable. i.e. strings, Buffers etc.
      contents: fs.readFileSync("/Users/cristianfelix/Developer/WHS/Application/" + filepath),
      update: function(_window, _resourceURL) {
        // this function is executed in the browser, immediately after the resource has been updated with new content
        // perform additional steps here to reinitialize your application so it would take advantage of the new resource
        console.log("Resource " + _resourceURL + " has just been updated with new content");
        //if(_resourceURL.indexOf("html") > 0){
            fblo()
        //}
      }
    });
  }
);

server.once('ready', function() {
  console.log('Ready!');
});