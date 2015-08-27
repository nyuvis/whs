/*global angular, ejs */
var Services = angular.module('Services', ['elasticsearch']);

Services.factory('Data', ['esFactory', function(es){
    var self = this;
    self.client = new es({host: "http://localhost:9500"});
    
    self.run = function (query, aggs, options) {
        options = options || {};
        var size = options.size || 50;
        var request = ejs.Request();
        request.highlight(ejs.Highlight(["text"]));
        if(query) {
            
            request.query(query);
        }
        aggs.forEach(function(agg) {
            request.agg(agg);
        });
        return self.client.search({
            index: 'whs4',
            size: size,
            body: request
        });
    };
    return self;
}]);