/*global angular get, d3, topojson*/
var App = angular.module("App", ["Services", "ngSanitize"]);
var scopeTest;
var countries;
App.controller("AppCtrl", ["$scope", "srv", "$window", function(scope, srv, $window) {
    scope.state = {};
    scope.fields = srv.fields;
    scope.state.field = get(srv.fields, "topic");
    scope.data = {groups: [], words: []};
    
    scope.init = function() {
        scope.loading = 0;
        scope.layout();
        scope.loadData();
         d3.json("js/world-topo-min.json", function(error, world) {
            countries = topojson.feature(world, world.objects.countries).features;
         });
    };
    
    scope.loadData = function() {
        scope.loading++;
        if(scope.state.selectedGroup) {
            scope.$broadcast('group-selected', undefined);
        }
        if(scope.state.selectedWord) {
            scope.$broadcast('word-selected', undefined);
        }
        
        scope.state.detailsFilter = undefined;
        scope.state.selectedGroup = undefined;
        scope.state.selectedWord = undefined;
        
        return srv.getData(scope.state).then(function(result){
            result.links.then(scope.setLinks);
            scope.setData(result);
            scope.loading--;
            return result;
        });
    };
    
    scope.setState = function(state) {
        if(state) {
            scope.state = state;
        }
        scope.loadData();
    };
    scope.setData = function(data) {
        scope.data = data;
        scope.$broadcast("data-updated", data);
        
        /*Temp */
        scope.loadState(data);
    };
    
    scope.setLinks = function(links) {
        scope.$broadcast("links-updated", links);
    };
    
    scope.layout = function(noEmit) {
        var headerRect = document.getElementById("header").getBoundingClientRect();
        document.getElementById("vizBoard").style.height = $window.innerHeight - headerRect.height;
        document.getElementById("vizBoard").style['margin-right'] = 450;
        
        var hasSelecteion = scope.state.selectedGroup || scope.state.selectedWord;
        
        var sideBarWidth = hasSelecteion ? 400 : 200;
        
        document.getElementById("sideBar").style.width = sideBarWidth;
        
        document.getElementById("docList").style.width = 200;
        document.getElementById("docList").style.right = 0;
        document.getElementById("docList").style.top = headerRect.height;
        
        document.getElementById("selectionDetails").style.display = hasSelecteion ? "block" : "none";
        document.getElementById("selectionDetails").style.width = 200;
        document.getElementById("selectionDetails").style.right = 205;
        document.getElementById("selectionDetails").style.top = headerRect.height;
        
        if(!noEmit) {scope.$broadcast('layout-updated'); }
    };
    
    scope.getDetails = function(data, field) {
        return srv.getDetails(data, field);
    };
    
    scope.loadState = function(data) {
        data.links.then(function(){
            //scope.$broadcast('word-clicked', data.words[0]);
        });
    };
    /*Watchers *************************************************/
    scope.$watch('state.field', function() {
        scope.loadData();
    });
    /***********************************************************/
    scope.$on('group-clicked', function(evt, data) {
        scope.state.detailsFilter = undefined;
        
        if(scope.state.selectedGroup !== data) {
            scope.state.selectedGroup = data;
            if(data) {
                data.details = scope.getDetails(data, scope.state.field.key);
            }
            srv.getDocuments(scope.state).then(function(documents){
                scope.$broadcast('documents-updated', documents);
            });
            scope.$broadcast('group-selected', data);
        }
        
        scope.layout(true);
    });
    scope.$on('group-reload', function(evt, data) {
        scope.state.detailsFilter = undefined;
        if(data) {
            data.details = scope.getDetails(data, scope.state.field.key);
        }
        srv.getDocuments(scope.state).then(function(documents){
            scope.$broadcast('documents-updated', documents);
        });
        scope.$broadcast('group-reloaded', data);
        scope.state.selectedGroup = data;
    });
    scope.$on('detail-clicked', function(evt, data){
        scope.state.detailsFilter = data;
        srv.getDocuments(scope.state).then(function(documents){
            scope.$broadcast('documents-updated', documents);
        });
    });
    scope.$on('word-clicked', function(evt, data) {
        scope.state.detailsFilter = undefined;
        if(scope.state.selectedWord !== data) {
            scope.state.selectedWord = data;
            if(data) {
                data.details = scope.getDetails(data, "text");
            }
            srv.getDocuments(scope.state).then(function(documents){
                scope.$broadcast('documents-updated', documents);
            });
            scope.$broadcast('word-selected', data);
        }
        scope.layout(true);
    });
    
    scope.$on('word-hover', function(evt, data){
         scope.$broadcast('word-highlighted', data);
    });
    
    scope.$on('word-out', function(evt, data){
         scope.$broadcast('word-unHighlighted', data);
    });
    
    scope.$on('remove-word', function(evt, data) {
        scope.$broadcast('word-clicked', undefined);
        srv.exclude.push(data);
        scope.loadData();
    });
    
    
    angular.element($window).bind('resize', scope.layout);
    scopeTest = scope;
}]);

App.directive('ngEnter', function() {
    return function(scope, element, attrs) {
      return element.bind('search', function(event) {
        scope.$apply(function() {
          return scope.$eval(attrs.ngEnter);
        });
        return event.preventDefault();
      });
    };
  });