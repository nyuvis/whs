/*global angular*/
angular.module("App").directive("docList", function() {
    return {
        restrict: 'EA',
        scope: {state: '=state'},
        templateUrl: "templates/docList.html",
        controller: function($scope, $sce, $timeout) {
            $scope.HTML = function (html) {
                return $sce.trustAsHtml(html);
            };
            
             $scope.$watch('state.detailsFilter', function() {
                 $timeout(function() {
                     var elm = document.getElementById('filterDetails');
                     var height = 40;
                     var rect;
                     if(elm) {
                         rect = elm.getBoundingClientRect();
                     } else {
                         rect = { height: 0};
                     }
                     console.log(document.querySelector('.snippetList').style.top = height + rect.height);
                     
                 }, 100);
             });
            
            /*Events */
            $scope.$on('data-updated', function(evt, data) {
                $scope.data = data;
            });
            $scope.$on('documents-updated', function(evt, data) {
                $scope.data.documents = data;
            });
        }
    };
});