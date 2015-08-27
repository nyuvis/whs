/*global App, ejs, d3*/
App.directive('hTagCloud', function(){
    return {
        restrict: 'A',
        scope: {
            interface: '=interface'
        },
        link: function(scope, element){
            scope.dimentions = [{
                "key": "V1",
                "name": "Main",
                "default": 0,
                "options": [
                    {name: "National Context", field: "National Context"},
                    {name: "Public Input", field: "Public Input"},
                    {name: "Topic", field: "type"},
                    {name: "Document", field: "Name"},
                    {name: "Stakeholder Group", field: "Stakeholder Group"}
                ]
            },
            {
                "key": "V2",
                "name": "Detail",
                "default": 0,
                "options": [
                    {name: "-- None --", field: "None"},
                    {name: "National Context", field: "National Context"},
                    {name: "Public Input", field: "Public Input"},
                    {name: "Topic", field: "type"},
                    {name: "Document", field: "Name"},
                    {name: "Stakeholder Group", field: "Stakeholder Group"}
                    
                ]
            },
            {
                "key": "V3",
                "name": "Values",
                "default": 4,
                "options": [
                    {name: "National Context", field: "National Context"},
                    {name: "Public Input", field: "Public Input"},
                    {name: "Topic", field: "type"},
                    {name: "Document", field: "Name"},
                    {name: "Text", field: "text"},
                    {name: "Bi-grams", field: "bigrams"},
                    {name: "Stakeholder Group", field: "Stakeholder Group"}
                ]
            }];
            scope.init = function() {
                scope.interface.register(scope);
                scope.loadData();
            };
            
            /*Style and Definitions */
            var style = {
                lineHeight: 50,
                wordsSize: [8, 30],
                relevanceColors: ["#9aafb9", "#FF5722"]
            };
            
            
            /*Data Handlers ***********************************/
            scope.getAggregation = function(dimention) {
                var agg = ejs.TermsAggregation(dimention.key);
                if(dimention.value.field === "text" || dimention.value.field === "bigrams"){
                    agg = ejs.SignificantTermsAggregation(dimention.key).exclude(".*_.*|see table|see|table");
                }
                return agg
                    .field(dimention.value.field)
                    .size(50);
            };
            scope.loadData = function() {
                var aggsV1 = scope.getAggregation(scope.dimentions[0]);
                var aggsV3 = scope.getAggregation(scope.dimentions[2]);
                aggsV1.agg(aggsV3);
                scope.interface.getData(aggsV1, {updateText: true});
            };
            scope.handleData = function(newData) {
                var data = newData.aggregations.V1.buckets.map(function(v){
                    return {
                        key: v.key,
                        count: v.doc_count,
                        values: v.V3.buckets.map(function(c) {
                            return {
                                overall: c.bg_count,
                                count: c.doc_count,
                                key: c.key,
                                relevance: c.score
                            };
                        })
                    };
                });
                return data;
            };
            
            /*Preparation ****************************************************/
            scope.build = function(args) {
                scope.board = d3.select(element[0]);
                scope.board.attr("id", "hTagCloud");
                return args;
            };
            
            scope.layout = function(newData) {
                
                newData.forEach(function(v) {
                    v.sizeScale = d3.scale.linear()
                        .range(style.wordsSize)
                        .domain(d3.extent(v.values, function(c) { return c.count; }));
                    
                    v.relevanceScale = d3.scale.linear()
                        .range(style.relevanceColors)
                        .domain(d3.extent(v.values, function(c) { return c.relevance; }));
                });
                return newData;
            };
            
            scope.applyData = function(newData) {
                if(!scope.board) { scope.build(); }
                scope.board.selectAll(".line").data([], function(d) { return d.key; });
                var selection = scope.board.selectAll(".line").data(newData, function(d) { return d.key; });
                return selection;
            };
            
            scope.update = function(selection) {
                /*Entering */
                selection.enter()
                    .append("div")
                    .attr("class", "line")
                    //.style({ height: style.lineHeight + "px" })
                    .each(function(d){
                        var that = d3.select(this);
                        that.append("div")
                            .attr("class", "header")
                            .text(d.key);
                        
                        that.append("div").attr("class", "detail");
                    //    var selectionValues = scope.applyDataValues(detail, d);
                    //    selectionValues.master = d;
                    //    scope.updateValues(selectionValues);
                    });
                    
                
                /*Updating */
                selection.each(function(d){
                        var that = d3.select(this);
                        var detail = that.selectAll(".detail");
                        var header = that.select(".header");
                        header.style({height: "auto"});
                        var selectionValues = scope.applyDataValues(detail, d);
                        selectionValues.master = d;
                        scope.updateValues(selectionValues);
                    });
                
                var maxHeight = d3.max(selection[0], function(e) {
                    return d3.select(e)
                        .select(".header")
                        .node()
                        .getBoundingClientRect()
                        .height;
                });
                
                selection.each(function(){
                    var that = d3.select(this);
                    var header = that.select(".header");
                    header.style({height: maxHeight + "px"});
                });
                
                /*Removing */
                selection.exit().remove();
            };
            
            scope.applyDataValues = function(elm, master) {
                return elm.selectAll(".mark").data(master.values, function(d) { return d.key; });
            };
            
            scope.updateValues = function(selection) {
                selection.enter()
                    .append("div")
                    .attr("class", "mark")
                    .append("div");
                
                selection.selectAll("div").text(function(d) { return d.key; })
                    .style({
                        'font-size': function(d) { return selection.master.sizeScale(d.count); },
                        'color': function(d) { return selection.master.relevanceScale(d.relevance); }
                    });
                
                selection.exit().remove();
            };
            
            
            /*Pipelines ****************************************************/
            scope.pipes = {
                newData: [scope.handleData, scope.layout, scope.applyData, scope.update]
            };
            
            scope.pipe = function(pipeline, args) {
                pipeline.forEach(function(p){
                    args = p.call(scope, args);
                });
                return args;
            };
            /*Listeners ******************************************************/
            scope.$on("newData", function(evt, data) {
                scope.pipe(scope.pipes.newData, data);
            });
            scope.$on("dimUpdated", scope.loadData);
            
            
            scope.init();
        }
    };
});