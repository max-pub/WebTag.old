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


CustomElements['todo-app'] = class {
    
	connectedCallback(){
		this.oo = new ObjectObserver({title:'test',todos:[]}); 
		new GLUE(this.DOM, this.oo);
		// new EVENTS(this.DOM, this);
   	}
   	addTodo(){
   		return; 
   		this.oo.data.todos.push({title:this.data.title});
   		this.data.title = '';
   	}

}


class GLUE {
	constructor(root, data = {}) {
		this.oneWay = [];
		this.twoWay = [];
		this.root = root;
		this.regex = new RegExp(/(\[\[[A-Za-z0-9\.]+\]\])/g);

		this.view = new DOMObserver(root);
		if (data instanceof ObjectObserver) this.model = data;
		else this.model = new ObjectObserver(data);

		this.view.onChange((event) => {
			// console.log('GLUE.viewChange', event);
			this.twoWay.forEach(glue => {
				// console.log('--test',event.node, glue.node, event.node == glue.node);
				if (event.node == glue.node)
					this.model.set(glue.keys[0], event.value);
			})
		});
		this.model.onChange(event => {
			// console.log('GLUE.dataChange', event);
			this.twoWay.forEach(glue => {
				if (glue.keys.includes(event.key))
					this.updateNode(glue)
			});
			this.oneWay.forEach(glue => {
				if (glue.keys.includes(event.key))
					this.updateNode(glue)
			});
		});

		root.querySelectorAll("*").forEach(this.checkNode.bind(this));
		// console.log(this.oneWay);
		// console.log(this.twoWay);
	}
	updateNode(glue) {
		// console.log('updateNode', glue.keys);
		var string = glue.string;
		glue.keys.forEach(key => {
			string = string.replace('[[' + key + ']]', this.model.get(key));
		})
		new NODE(glue.node).set(glue.attribute, string);
	}
	add(domElement, domProperty, string, keys) {
		// console.log(domElement, domProperty, string, keys);
		var glue = {
			node: domElement,
			attribute: domProperty,
			keys: keys,
			string: string
		};
		if (domProperty == 'textContent') var attr = domElement.textContent;
		else var attr = domElement.getAttribute(domProperty);
		if (attr == '[[' + keys[0] + ']]')
			this.twoWay.push(glue);
		else
			this.oneWay.push(glue);
		this.updateNode(glue);
	}

	checkNode(domElement) {
		var props = domElement.attributes;
		for (var i = 0; i < props.length; i++) {
			this.checkAttribute(domElement, props[i].name, props[i].value);
		}
		this.checkAttribute(domElement, 'textContent', domElement.textContent);
	}
	checkAttribute(node, key, val) {
		if (this.regex.test(val)) { // contains bindings
			var keys = val.match(this.regex).map(item => {
				return item.slice(2, -2)
			});
			this.add(node, key, val, keys);
		}

	}

}class ObjectObserver {
	constructor(data = {}) {
		this.changeHandlers = [];
		this.data = this.observe(data);
	}

	observe(data, prefix = '') {
		if (!(data instanceof Object)) return data;
		// console.log('observe', prefix);

		for (var key in data)
			data[key] = this.observe(data[key], prefix + key + '.');

		return new Proxy(data, {
			set: (target, prop, value) => {
				if (value instanceof Object) // object? observe it too!
					value = this.observe(value, prefix + prop + '.');
				if (data[prop] === value) return true; // no change (oldValue==newValue)
				var ret = Reflect.set(target, prop, value);
				this.fireChange(prefix + prop, value, data[prop]);
				return ret;
			}
		});
	}

	onChange(f) {
		this.changeHandlers.push(f);
		return this;
	}

	fireChange(path, newValue, oldValue) {
		// console.log('DATA.fireChange', path, '=', newValue, '(' + oldValue + ')');
		this.changeHandlers.forEach(f => f({
			key: path,
			value: newValue,
			oldValue: oldValue
		}));
	}

	get(path, value) {
		let o = this.data;
		path.split('.').slice(0, -1).forEach(item => {
			if (o[item]) o = o[item];
		});
		return o[path.split('.').slice(-1)[0]];
	}

	set(path, value) {
		// console.log('O.set', path, value);
		let o = this.data;
		path.split('.').slice(0, -1).forEach(item => {
			o = o[item];
		});
		o[path.split('.').slice(-1)[0]] = value;
	}

}class DOMObserver {
	constructor(root) {
		this.changeHandlers = [];
		this.observe(root);
		// if ('shadowRoot' in root) this.observe(root.shadowRoot);
	}
	observe(root) {
		new MutationObserver(mutations => {
			mutations.forEach(event => {
				// console.log(event.type, event);
				if (event.type == 'characterData')
					this.fireChange(event.target.parentNode, 'textContent', event.target.textContent);
				if (event.type == 'attributes')
					this.fireChange(event.target, event.attributeName, event.target.getAttribute(event.attributeName));
				// this.fireChange(event.target, event.attributeName, this.find(event.target).get(event.attributeName));
			})
		}).observe(root, {
			attributes: true,
			childList: true,
			characterData: true,
			subtree: true
		});

		root.addEventListener('input', event => {
			if (!this.find(event.target).isCheckElement())
				this.fireChange(event.path[0], 'value', event.path[0].value);
		});
		root.addEventListener('change', event => {
			if (this.find(event.target).isCheckElement())
				this.fireChange(event.target, 'checked', event.target.checked);
		});
	}

	onChange(f) {
		this.changeHandlers.push(f);
		return this;
	}

	fireChange(node, attribute, value) {
		this.changeHandlers.forEach(f => f({
			node,
			attribute,
			value
		}))
	}

	find(node) {
		return new NODE(node);
	}
}class NODE {
	constructor(node) {
		this.node = node;
	}
	getDefaultProperty() {
		if (this.isCheckElement()) return 'checked';
		if ('value' in this.node) return 'value';
		return 'html';
	}

	get(property) {
		if (!property) property = this.getDefaultProperty();
		if (['value', 'checked', 'hidden', 'innerHTML', 'textContent'].includes(property))
			return this.node[property];
		return this.node.getAttribute(property);
	}

	set(property, value) {
		// console.log('Node.set', this.node, property, this.get(property), value);
		// if (!property) property = this.getDefaultProperty();
		if (this.get(property) == value) return;
		if (['value', 'checked', 'hidden', 'innerHTML', 'textContent'].includes(property))
			this.node[property] = value;
		else
			this.node.setAttribute(property, value);
	}

	isCheckElement() {
		return ['radio', 'checkbox'].includes(this.node.type)
	}
}