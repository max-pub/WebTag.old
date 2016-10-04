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


CustomElements['tag-one'] = class {

	connectedCallback() {
		console.log('tag-one working',this);
	}

}


CustomElements['tag-two'] = class {

}


CustomElements['tag-three'] = class {

}


CustomElements['tag-four'] = class {

}


class DB {
	constructor(name = 'database', version = 1) {
		this.stores = {};
		let request = window.indexedDB.open(name, version);
		request.onsuccess = event => {
			this.db = event.target.result;
			console.log('db-init', event, this.db);
		};
		request.onupgradeneeded = event => {
			console.log('db-upgrade', event);
			for (let name in this.stores)
				DB.logState('store:' + name, event.target.result.createObjectStore(name, this.stores[name]))
		};
	}
	addStore(name, config) {
		this.stores[name] = config;
		return this;
	}
	store(name) {
		return new DBstore(this.db, name);
	}
	static logState(name, req) {
		req.onsuccess = e => console.log(name, e, req);
		req.onerror = e => console.error(name, e, req);
	}

}

class DBstore {
	constructor(db, name) {
		this.db = db;
		this.name = name;
		// this.db.getObjectStore(name);
		this.read = this.db.transaction([name]).objectStore(name);
		this.write = this.db.transaction([name], "readwrite").objectStore(name);
	}
	static promise(req) { // transform event-handlers into ES6-Promises
		return new Promise((resolve, reject) => {
			req.onsuccess = e => resolve(req.result);
			req.onerror = e => reject(e);
		});
	}
	get(key) {
		return DBstore.promise(this.read.get(key));
	}
	add(data) {
		return DBstore.promise(this.write.add(data));
	}
	put(data) {
		return DBstore.promise(this.write.put(data));
	}
	del(key) {
		return DBstore.promise(this.write.delete(data));
	}
}