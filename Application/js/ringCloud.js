/*global angular, d3 */
function getXY(center, radius) {
    return function(angle) {
        var x = center[1] + radius * Math.sin(angle);
        var y = center[0] + radius * (1 - Math.cos(angle));
        return [x, y];
    };
}

function middle(a, b) {
    if(a > b) {
        var t = a;
        a = b;
        b = t;
    }
    return a + (b - a) / 2;
}

function diffAngle(a, b) {
    if(a > b) {
        var t = a;
        a = b;
        b = t;
    }
    return (b - a);
}

function addAlpha(color, alpha) {
    var c = d3.rgb(color);
    return "rgba(" + c.r + "," + c.g + "," + c.b + "," + alpha + ")";
}

function get(arr, key) {
    for(var i = 0; i < arr.length; i++) {
        if (arr[i].key === key) {
            return arr[i];
        }
    }
}

function getRing(arr, key) {
    for(var i = 0; i < arr.length; i++) {
        if (arr[i].data.key === key) {
            return arr[i];
        }
    }
}

angular.module("App").directive("ringCloud", function() {
    return {
        restrict: 'EA',
        scope: {},
        link: function (scope, element) {
            
            scope.boardHTML = d3.select(element[0]).append("div")
                .attr("id", "ringCloudHTML");
            scope.board = d3.select(element[0]).append("svg")
                .style({
                    position: "absolute",
                    'z-index': 10
                })
                .attr("width", "100%")
                .attr("height", "100%")
                .on("click", function() {
                    if(scope.selectedWord) {
                        scope.$emit('word-clicked', undefined);
                        scope.$emit('group-reload', scope.selectedGroup);
                    } else {
                        scope.$emit('group-clicked', undefined);
                    }
                    
                });
            scope.board.append("defs").append("clipPath").attr("id", "ringClip").append("circle");
            
            scope.board.wordGroup = scope.board.append("g").attr("clip-path", "url(#ringClip)");
            scope.board.wordRect = scope.board.wordGroup.append("rect")
                .style("fill", "rgb(241, 241, 241)");
            scope.board.ringGroup = scope.board.append("g");
            scope.board.ringGroupHighlight = scope.board.append("g");
            
            
            
            scope.style = {
                padding: 70
            };
            
            scope.layout();
        },
        controller: function($scope) {
            var width = 0,
                height = 0,
                radius = Math.min(width, height) / 2;

            var color = d3.scale.ordinal().range([
                    "#a6cee3",
                    "#1f78b4",
                    "#b2df8a",
                    "#33a02c",
                    "#fb9a99",
                    "#e31a1c",
                    "#fdbf6f",
                    "#ff7f00",
                    "#cab2d6"
                ]);
            color = d3.scale.category20();

            var arc = d3.svg.arc();

            var pie = d3.layout.pie()
                .sort(function(a, b) { return d3.ascending(a.key, b.key); })
                .value(function(d) { return d.count; })
                .padAngle(0.01);
            
            /*Drawing*******************************************************/
            $scope.layout = function(data) {
                var rect = $scope.board.node().getBoundingClientRect();
                width = rect.width;
                height = rect.height;
                radius = Math.min(width, height) / 2 - $scope.style.padding;
                
                arc.outerRadius(radius - 10)
                   .innerRadius(radius);
                
                $scope.board.ringGroup
                    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
                
                $scope.board.select("#ringClip").select("circle")
                    
                    .attr("r", radius - 10);
                $scope.board.ringGroupHighlight
                    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
                return data;
            };
            $scope.update = function(data) {
                $scope.updateRing(data);
                $scope.updateCloud(data);
            };
            $scope.updateRing = function(data) {
                /*Configure Data */
                var ringData = pie(data.groups);
                $scope.ringData = ringData;
                ringData.forEach(function(d) { d.middleAngle = middle(d.startAngle, d.endAngle); });
                
                //Functions ****************************
                
                var arcPosition = getXY([$scope.style.padding, width / 2], radius);
                function tweenArc(b) {
                  return function(a) {
                    var d = b.call(this, a, i), i = d3.interpolate(a, d);
                    for (var k in d) a[k] = d[k]; // update data
                    return function(t) { return arc(i(t)); };
                  };
                }
                function getLeft(d) {
                    var x = arcPosition(d.middleAngle)[0];
                    if(d.middleAngle < Math.PI) {
                        x = x + 10;
                        return x;
                    }
                    return undefined;
                }
                
                function getRight(d) {
                    var x = arcPosition(d.middleAngle)[0];
                    if(d.middleAngle >= Math.PI) {
                        x = width - x + 10;
                        return x;
                    }
                    return undefined;
                }
                
                
                
                function getTop(d) {
                    var y = arcPosition(d.middleAngle)[1];
                    var rect = d3.select(this).node().getBoundingClientRect();
                    if(d.middleAngle < Math.PI / 2 || d.middleAngle > Math.PI + Math.PI / 2) {
                        y = y - rect.height;
                    }
                    return y;
                }
                
                //Entering **********
                var g = $scope.board.ringGroup.selectAll(".arc")
                    .data(ringData);
                g.enter()
                    .append("g")
                    .attr("class", "arc")
                    .append("path")
                    .on("click", function(d){
                        d3.event.stopPropagation();
                        $scope.$emit('group-clicked', d.data);
                    });
                g.exit().remove();
                
                var labels = $scope.boardHTML.selectAll(".labelGroup")
                    .data(ringData, function(d) {return d.data.key; });
                labels.enter()
                        .append("div")
                        .attr("class", "labelGroup");
                
                labels.exit().remove();
                
                //Updating ********************************
                //Updating Ring
                g.select("path")
                    .style("fill", function(d) { return color(d.data.key); })
                    .transition()
                    .attrTween("d", tweenArc(function(d) {
                        return {
                          innerRadius: d.innerRadius,
                          outerRadius: d.outerRadius
                        };
                      }));
                
                $scope.boardHTML.selectAll(".labelGroup")
                    .text(function(d) { return d.data.key; })
                    .style({
                        'background-color': function(d) { return addAlpha(color(d.data.key), 0.2); },
                        'border-left': function(d) { return "5px solid " + color(d.data.key); }
                    }).transition().style({
                        left: getLeft,
                        right: getRight,
                        top: getTop
                    });
                return data;
            };
            $scope.updateCloud = function(data) {
                var words = data.words;
                var fontSize = d3.scale.linear()
                    .range([10, 40])
                    .domain(d3.extent(words, function(d) { return d.bg_count; }));
                
                var layout = d3.layout.cloud()
                    .size([height - $scope.style.padding - 10, height - $scope.style.padding - 10])
                    .words(words)
                    .padding(3)
                    .rotate(function() { return 0; })
                    .text(function(d) {return d.key; })
                    .font("Arial")
                    .spiral("archimedean")
                    .fontSize(function(d) { return fontSize(d.bg_count); })
                    .on("end", $scope.drawCloud);

                layout.start();
            };
            $scope.drawCloud = function(words) {
                var fill = d3.scale.linear().range(["#98abc5", "#e079b8"])
                    .domain(d3.extent(words, function(d) { return d.score / d.classCount; }));
                var sel = $scope.board.wordGroup
                  .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")")
                .selectAll("text")
                  .data(words, function(d){ return d.text; });
                var enterText = sel.enter().append("text")
                    .style("font-family", "Arial")
                    .attr("text-anchor", "middle")
                    .style("fill", function(d) { return fill(d.score); })
                    //.style("fill", "white")
                    .attr("class", "cloudWord")
                    .text(function(d) { return d.text; })
                    .on("click", function(d) {
                        d3.event.stopPropagation();
                        d.elemBox = this.getBBox();
                        $scope.$emit('word-clicked', d);
                    })
                    .on("mouseover", function(d) {
                        d3.event.stopPropagation();
                        $scope.$emit('word-hover', d);
                    })
                    .on("mouseout", function(d) {
                        d3.event.stopPropagation();
                        $scope.$emit('word-out', d);
                    });
                
                var arcPosition = getXY([$scope.style.padding, width / 2], radius);
                var groupArc;
                if($scope.selectedGroup){
                    groupArc = getRing($scope.ringData, $scope.selectedGroup.key);
                    enterText.attr("transform", function(d) {
                        var pos = arcPosition(groupArc.middleAngle);
                        return "translate(" +
                            [pos[0] - (width / 2), pos[1] - (height / 2)] + ")rotate(" + d.rotate + ")";
                    });
                } else {
                    enterText.attr("transform", function(d) {
                        var arcIdx = Math.floor(Math.random() * $scope.ringData.length);
                        groupArc = $scope.ringData[arcIdx];
                        var pos = arcPosition(groupArc.middleAngle);
                        return "translate(" +
                            [pos[0] - (width / 2), pos[1] - (height / 2)] + ")rotate(" + d.rotate + ")";
                    });
                }
                
                sel.exit().remove();
                var duration = 500;
                
                sel.transition()
                  .delay(function(d, i) { return i / words.length * duration; })
                  .style("fill", function(d) { return fill(d.score); })
                  .style("font-size", function(d) { return d.size + "px"; })
                  .attr("transform", function(d) {
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                  });
            };
            
            $scope.showLinks = function(word, groups){
                /*Configure Data */
                var ringData = pie(groups);
                
                ringData.forEach(function(r) {
                    var prop = r.data.doc_count / r.data.count;
                    var minAngle = 0.02;
                    r.prop = prop;
                    var angDiff = diffAngle(r.startAngle, r.endAngle) * prop;
                    if(prop > 0 && angDiff < minAngle){
                        angDiff = minAngle;
                    }
                    
                    r.endAngle = r. startAngle + angDiff;
                });
                //Entering ****************
                var g = $scope.board.ringGroupHighlight.selectAll(".arcHigh")
                    .data(ringData);
                g.enter()
                    .append("g")
                    .attr("class", "arcHigh")
                    .append("path")
                    .on("click", function(d){
                        d3.event.stopPropagation();
                        $scope.$emit('group-clicked', d);
                    });
                g.exit().remove();
                
                //Updating ********************************
                g.select("path")
                    .style("fill", function(d) { return color(d.data.key); })
                    .attr("d", function (d) {
                        return arc(d);
                    });
                
                $scope.board.ringGroup.selectAll(".arc").classed("gray", true);
                $scope.boardHTML.selectAll(".labelGroup").each(function(d) {
                    var r = ringData.filter(function(f) { return f.data.key === d.data.key; })[0];
                    d3.select(this).classed("grayDiv", r.prop === 0);
                });
            };
            
            /***************************************************************/
            
            /*Interaction **************************************************/
            $scope.selectGroup = function(group, noWord) {
                
                $scope.selectedGroup = group;
                
                if(!noWord) { $scope.selectWord(undefined, true); }
                if(!group) {
                    $scope.updateCloud($scope.data);
                    $scope.board.ringGroup.selectAll(".arc")
                        .classed("selected", false)
                        .classed("dimmed", false);
                    
                    $scope.board.ringGroupHighlight.selectAll(".arc")
                        .classed("selected", false)
                        .classed("dimmed", false);
                    
                    $scope.boardHTML.selectAll(".labelGroup")
                        .classed("dimmed", false);
                }else {
                    console.log('gona call with:', group);
                    $scope.updateCloud(group);
                    $scope.board.ringGroup.selectAll(".arc")
                        .classed("selected", function(d) { return d.data.key === group.key; })
                        .classed("dimmed", function(d) { return d.data.key !== group.key; });
                    
                     $scope.board.ringGroupHighlight.selectAll(".arc")
                        .classed("selected", function(d) { return d.data.key === group.key; })
                        .classed("dimmed", function(d) { return d.data.key !== group.key; });
                    
                    $scope.boardHTML.selectAll(".labelGroup")
                        .classed("dimmed", function(d) { return d.data.key !== group.key; });
                }
            };
            $scope.selectWord = function(word) {
                $scope.selectedWord = word;
                
                if(!word) {
                    $scope.board.wordRect.attr({
                        height: 0
                    });
                    $scope.board.wordGroup.selectAll('text').classed("dimmed", false);
                    $scope.unHighlightWord();
                    return;
                }
                
                $scope.board.wordRect.attr({
                    width: word.elemBox.width,
                    height: word.elemBox.height,
                    x: word.x + width / 2 - word.elemBox.width / 2,
                    y: word.y + height / 2 - word.elemBox.height / 1.5 - word.padding
                });
                $scope.board.wordGroup.selectAll('text')
                    .classed("dimmed", function(d) { return d.key !== word.key; });
                
                $scope.highlightWord(word);
            };
            $scope.highlightWord = function(d) {
                if($scope.links) {
                    var word = get($scope.links, d.key);
                    
                    var groups = $scope.data.groups.map(function(g){
                        var gA = get(word.groups, g.key);
                        g = JSON.parse(JSON.stringify(g));
                        g.doc_count = gA ? gA.doc_count : 0;
                        return g;
                    });
                    $scope.showLinks(d, groups);
                }
            };
            $scope.unHighlightWord = function() {
                $scope.board
                    .ringGroupHighlight.selectAll(".arcHigh")
                    .data([]).exit().remove();
                $scope.board.ringGroup.selectAll(".arc").classed("gray", false);
                $scope.boardHTML.selectAll(".labelGroup").classed("grayDiv", false);
                if($scope.selectedWord) {
                    $scope.highlightWord($scope.selectedWord);
                }
                
            };
            /***********************************************************/
            
            /*Events **************************************************/
            $scope.$on('group-selected', function(evt, data) {
                $scope.selectGroup(data);
            });
            $scope.$on('word-selected', function(evt, data) {
                $scope.selectWord(data);
            });
            $scope.$on('word-highlighted', function(evt, data) {
                clearTimeout($scope.unHighlightTime);
                $scope.highlightWord(data);
            });
            $scope.$on('word-unHighlighted', function() {
                $scope.unHighlightTime = setTimeout($scope.unHighlightWord, 150);
            });
            $scope.$on('data-updated', function(evt, data) {
                $scope.links = undefined;
                $scope.update(data, $scope.data);
                $scope.data = data;
            });
            $scope.$on('links-updated', function(evt, links) {
                $scope.links = links;
            });
            $scope.$on('layout-updated', function() {
                $scope.layout($scope.data);
                $scope.update($scope.data);
            });
            /***********************************************************/
            
        }
    };
});