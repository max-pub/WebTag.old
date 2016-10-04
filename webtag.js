'use strict';
var CustomElements = {};
document.addEventListener('DOMContentLoaded', function() {
	new MutationObserver(function(mutations) {
		for (var i = 0; i < mutations.length; i++) {
			addTags(mutations[i].target)
		}
	}).observe(document.body, {
		childList: true,
		subtree: true
	});
	var addTags = function addTags(root) { // console.log('add Tags to', root);
		var todo = [];
		var templates = document.querySelectorAll('template');
		for (var i = 0; i < templates.length; i++) {
			var tags = root.querySelectorAll(templates[i].id);
			for (var j = 0; j < tags.length; j++) {
				todo.push([tags[j], templates[i]])
			}
		}
		for (var k = 0; k < todo.length; k++) {
			var tag = todo[k][0],
				template = todo[k][1];
			// console.log('add CustomElement', tag, template); // console.log('parent', tag.parentNode);
			tag.innerHTML = template.innerHTML;
			var ce = new CustomElements[template.id](tag);
			ce.DOM = tag;
			tag.CE = ce;
			if ('connectedCallback' in ce) ce.connectedCallback()
		}
	};
	addTags(document.body)
});