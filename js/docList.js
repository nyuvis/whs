/*global angular*/
angular.module("App").directive("docList", function() {
    return {
        restrict: 'EA',
        scope: {},
        templateUrl: "templates/docList.html",
        controller: function($scope, $sce) {
            $scope.HTML = function (html) {
                return $sce.trustAsHtml(html);
            };
            /*Events */
            $scope.$on('data-updated', function(evt, data) {
                $scope.data = data;
            });
        }
    };
});