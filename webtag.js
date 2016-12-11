// 'use strict';
var CustomElements = {};
var WebTagInstances = [];
document.addEventListener('DOMContentLoaded', function() {
	var addTags = function addTags(root) {
		console.log('add Tags to', root);
		var todo = [];
		var templates = document.querySelectorAll('template[id]');
		for (var i = 0; i < templates.length; i++) {
			// console.log('tags:', root.querySelectorAll(templates[i].id));
			var tags = root.querySelectorAll(templates[i].id);
			// console.log('tags', tags);
			// if (!tags) tags = [];
			for (var j = 0; j < tags.length; j++) {
				todo.push([tags[j], templates[i]])
			}
		}
		// console.log('todo', todo);
		for (var k = 0; k < todo.length; k++) {
			var tag = todo[k][0],
				template = todo[k][1];
			// console.log('add CustomElement', tag, template); // console.log('parent', tag.parentNode);
			tag.innerHTML = template.innerHTML;
			var ce = new CustomElements[template.id](tag);
			ce.DOM = tag;
			tag.JS = ce;
			if ('connectedCallback' in ce) ce.connectedCallback()
			WebTagInstances.push(ce);
		}
	};

	new MutationObserver(function(mutations) {
		for (var i = 0; i < mutations.length; i++) {
			addTags(mutations[i].target)
		}
	}).observe(document.body, {
		childList: true,
		subtree: true
	});

	addTags(document.body)
});