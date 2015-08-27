/*global angular, ejs*/
var App = angular.module("WHS", ['Services', 'ngSanitize']);
App.controller("MainCtrl", ["$scope", "Data", "$sce", function($scope, data, $sce){
    var interface = $scope.interface = {};
    var views = [];
   
    $scope.HTML = function (html) {
        return $sce.trustAsHtml(html);
    };
    
    interface.register = function(view) {
        $scope.dimentions = view.dimentions;
        $scope.dimentions.forEach(function(d) {
            d.value = d.options[d.default];
        });
        views.push(view);
    };
    
    interface.getData = function(aggs, options) {
        options = options || {};
        var query;
        if($scope.search && $scope.search.length > 0){
            query = ejs.MatchQuery('text', $scope.search);
        }
        data.run(query, [aggs]).then(function(result){
            if(options.exclusive){
                return result;
            } else {
                $scope.currentHits = result.hits.total;
                $scope.hits = result.hits.hits;
                if($scope.search && $scope.search.length > 0) {
                    $scope.noHighlight = false;
                } else {
                    $scope.noHighlight = true;
                }
                $scope.$broadcast("newData", result);
            }
        });
    };
    
    $scope.doSearch = function() {
        $scope.$broadcast("dimUpdated", {});
    };
    
    $scope.$watchCollection(function(){
        if(!$scope.dimentions) { return undefined; }
        return $scope.dimentions.map(function(v) {
            return v.value;
        });
    }, function(d, old) {
        if(old && old.length > 0) {
            $scope.$broadcast("dimUpdated", d);
        }
    });
}]);
