/*global angular*/
angular.module("App").directive("selectionDetails", function() {
    return {
        restrict: 'EA',
        scope: { state: '=state'},
        templateUrl: "templates/selectionDetails.html",
        controller: function($scope, $sce, $timeout) {
            $scope.HTML = function (html) {
                return $sce.trustAsHtml(html);
            };
            $scope.keys = function(obj) {
                if(!obj) {
                    return [];
                }
                return Object.keys(obj);
            };
            
            $scope.selectGroup = function(data){
                $scope.type = "group";
                $scope.select(data);
            };
            
            $scope.selectWord = function(data){
                $scope.type = "word";
                $scope.select(data);
            };
            $scope.keysList = [];
            $scope.select = function(data) {
                $scope.selected = data;
                $scope.loading = true;
                if(data) {
                    $scope.keysList = [];
                    data.details.then(function(det){
                        $timeout(function() {
                            data.numDocuments = det.numDocuments;
                            data.numParagraphs = det.numParagraphs;
                            delete det.numDocuments;
                            delete det.numParagraphs;
                            data.detailsList = det;
                            $scope.keysList = $scope.keys(det);
                            $scope.loading = false;
                        }, 600);
                    });
                    
                }
                $scope.$broadcast('selected-updated', data);
            };
            
            $scope.removeWord = function() {
                $scope.$emit("remove-word", $scope.selected.key);
            };
            
            
            $scope.$on('group-reloaded', function(evt, data) {
                $scope.selectGroup(data);
            });
            
            $scope.$on('group-selected', function(evt, data) {
                $scope.selectGroup(data);
            });
            $scope.$on('word-selected', function(evt, data) {
                $scope.selectWord(data);
            });
        }
    };
});