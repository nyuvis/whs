/*global angular, get, c3, d3, countries*/
angular.module("App").directive("chart", function() {
    return {
        restrict: 'EA',
        scope: {data: '=data', key: '=key', selected: '=selected'},
        templateUrl: "templates/chart.html",
        link: function($scope, element) {
            $scope.chart = d3.select(element[0]).select(".chart");
            $scope.linked();
        },
        controller: function($scope, srv) {
            $scope.def = get(srv.fields, $scope.key);
            $scope.data.sort(function(a, b) { return d3.ascending(a.key, b.key); });
            
            var width = 200;
            var height = 200;
            
            $scope.linked = function() {
                if($scope.key === 'National Contexts'){
                    var svg = $scope.chart.append("svg");
                    var graticule = d3.geo.graticule();
                    var projection = d3.geo.mercator()
                          .scale((width + 1) / 2 / Math.PI)
                          .translate([width / 2, height / 2])
                          .precision(.1);
                    var path = d3.geo.path()
                        .projection(projection);
                    
                    svg.append("path")
                       .datum(graticule)
                       .attr("class", "choropleth")
                       .attr("d", path);
                    
                    var g = svg.append("g");

                    var country = g.selectAll(".country").data(countries);
                    var color = d3.scale.linear().range(["#ccc", "#8200b2"])
                        .domain(d3.extent(function(d){ return d.doc_count / d.count; }));
                    country.enter().insert("path")
                        .attr("class", "country")
                        .attr("d", path)
                        .attr("id", function(d) { return d.id; })
                        .attr("title", function(d) { return d.properties.name; })
                        .style("fill", function(d) {
                            var obj = get($scope.data, d.properties.name);
                          if (obj) {
                            return color(obj.doc_count / obj.count);
                          } else {
                            return "#ccc";
                          }
                        });

                    
                  } else {
                    c3.generate({
                    bindto: $scope.chart,
                    size: {
                      height: 100
                    },
                    data: {
                        columns: [
                            ['Percentage'].concat($scope.data.map(function(d) { return d.doc_count / d.count; }))
                        ],
                        type: 'bar',
                        color: function() {
                            // d will be 'id' when called for legends
                            return 'rgba(106, 48, 163, 0.85)';
                        },
                        onclick: function (d) {
                            var obj = $scope.data[d.index];
                            $scope.$emit('detail-clicked', { field: $scope.key, value: obj.key});
                        }
                    },
                    axis: {
                        x: {
                            type: 'category',
                            show: false,
                            categories: $scope.data.map(function(d) { return d.key; })
                        },
                        y: {
                            tick: {
                                format: d3.format("%"),
                                count: 2
                            }
                        }
                    },
                    legend: {
                        show: false
                    },
                    bar: {
                        width: {
                            ratio: 0.7
                        }
                    },
                    padding: {
                      left: 30
                    },
                    tooltip: {
                        contents: function (d) {
                            var obj = $scope.data[d[0].index];
                            return '<div class="tooltipBody">' +
                                        '<h4>' + obj.key + '</h4>' +
                                        'Paragraphs: ' + obj.doc_count + ' / ' + (obj.doc_count / obj.count * 100).toFixed(0) + '%' +
                                    '</div>';
                        },
                        position: function (data, local_width, local_height) {
                            return {top: -local_height, left: 0};
                        }
                    }
                });
                }
            };
            
        }
    };
});