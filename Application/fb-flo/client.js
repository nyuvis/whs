/*global reload*/
window.addEventListener("fb-flo-reload", function(ev) {
    if(reload) {
        location.reload();
    }
    else if(ev.data.url.indexOf('.html') > 0) {
        var pageBody = document.createElement('div');
        pageBody.innerHTML = ev.data.contents;
        var discard = pageBody.querySelectorAll("script, link");
        Array.prototype.forEach.call(discard, function(node) {
            node.parentNode.removeChild(node);
        });

        document.querySelector("body").innerHTML = pageBody.innerHTML;
    }
});