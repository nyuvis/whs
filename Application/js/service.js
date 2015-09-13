/*global angular, d3, ejs, get*/
var Services = angular.module("Services", ["elasticsearch"]);
Services.service('client', function (esFactory) {
    return esFactory({
        host: 'vgc.poly.edu/projects/r2sense/'
    });
});
Services.factory('srv', function(client) {
    var srv = {};
    srv.fields = [
        { key: "Stakeholder Group", desc: "Stakeholder Group", type: ""},
        { key: "Public Input", desc: "Public Input", type: ""},
        { key: "topic", desc: "Topic", type: ""},
        { key: "subtopic", desc: "Sub-topic", type: ""},
        { key: "Pacific Region", desc: "Pacific Region", type: ""},
        { key: "WHS Output", desc: "WHS Output", type: ""},
        { key: "National Context", desc: "National Context", type: ""}
    ];
    
    srv.exclude = ["[1-9]*", "\\w{0,3}"].join("|");
    
    srv.run = function(body, then) {
        return client.search({
          index: 'whs4',
          type: 'document',
          body: body.toJSON ? body.toJSON() : body
        }).then(function (resp) { return then(resp); });
    };
    
    srv.getData = function(state) {
        srv.state = state;
        var body = ejs.Request().size(100);
        if(state.search) {
            var query = ejs.QueryStringQuery("text:" + state.search);
            body.query(query);
        }
        
        var highlight = ejs.Highlight("text")
            .numberOfFragments(0).toJSON();
            highlight.no_match_size = 200000;
        
        var aggs = ejs.TermsAggregation("topics")
            .field(state.field.key).size(100)
            .agg(ejs.SignificantTermsAggregation("words")
                 .field("text")
                 .exclude(srv.exclude)
                 .size(100));
        
        body.agg(aggs);
        body = body.toJSON();
        body.highlight = highlight;
        return srv.run(body, srv.processData);
    };
    
    srv.getWordsInfo = function(words){
        var body = ejs.Request().size(0);
        
        var aggs = ejs.TermsAggregation("words")
            .field("text")
            .include(words.join("|"))
            .size(100000)
            .agg(ejs.TermsAggregation("topics").field(srv.state.field.key).size(100));
        body.agg(aggs);
         
        if(srv.state && srv.state.search) {
            var query = ejs.QueryStringQuery(srv.state.search);
            body.query(query);
        }
        return srv.run(body, srv.processWords);
    };
    
    srv.getDetails = function(select, field) {
        var body = ejs.Request().size(0);
        var queryString = field + ":\"" + select.key + "\"";
        
        srv.fields.forEach(function(a) {
            body.agg(ejs.TermsAggregation(a.key).field(a.key).size(20));
        });
        body.agg(ejs.CardinalityAggregation("numDocuments").field("Name"));
        
        var globalAgg = ejs.GlobalAggregation("_global");
         srv.fields.forEach(function(a) {
            globalAgg.agg(ejs.TermsAggregation(a.key).field(a.key).size(1000));
        });
        body.agg(globalAgg);
        
        if(srv.state.search) {
            queryString += " AND (text:" + srv.state.search + ")";
        }
        var search = ejs.QueryStringQuery(queryString);
        body.query(search);
        return srv.run(body, srv.processDetails);
    };
    
    srv.processDetails = function(result) {
        var aggs = result.aggregations;
        Object.keys(aggs).forEach(function(k) {
            if(k[0] !== "_" && aggs[k].buckets) {
                aggs[k] = aggs[k].buckets;
                aggs[k].forEach(function(v) {
                    v.count = get(aggs._global[k].buckets, v.key).doc_count;
                });
            }
        });
        delete aggs._global;
        return aggs;
    };
    
    srv.processWords = function(result) {
        return result.aggregations.words.buckets.map(function(w){
            w.groups = w.topics.buckets;
            delete w.topics;
            return w;
        });
    };
    
    srv.processData = function(data) {
            var topics = [];
            var topicsIndex = {};
            var words = [];
            var wordsIdx = {};
            var wordIdxPointer = 0;
            data.aggregations.topics.buckets.forEach(function(topic, i){
                var tp = {key: topic.key, count: topic.doc_count, words: topic.words.buckets};
                topics.push(tp);
                topicsIndex[topic.key] = i;
                topic.words.buckets.forEach(function(word){
                    var wordGroup = {
                        key: topic.key,
                        doc_count: word.doc_count
                    };
                    if(!wordsIdx[word.key]) {
                        wordsIdx[word.key] = wordIdxPointer;
                        wordIdxPointer++;
                        word.classCount = 1;
                        word.groups = [wordGroup];
                        words.push(word);
                    } else {
                        words[wordsIdx[word.key]].classCount++;
                        words[wordsIdx[word.key]].score += word.score;
                        words[wordsIdx[word.key]].groups.push(wordGroup);
                    }
                });
            });
            words = words.sort(function(a, b) { return d3.descending(a.score, b.score); });
            var links = srv.getWordsInfo(words.map(function(w) { return w.key; }));
            words = words.splice(0, 100);
            var documents = {
                total: data.hits.total,
                surrogates: data.hits.hits.map(function(d) {
                    var surrogate = d._source;
                    if(d.highlight) {
                        surrogate.text = d.highlight.text[0];
                        return surrogate;
                    }
                }).filter(function(d) { return d ? true : false; })
            };
            return { groups: topics, words: words, links: links, documents: documents};
        };
    return srv;
});










