#!/usr/local/bin/node

const path = require('path');
const fs = require('fs');
const cheerio = require('cheerio');
const less = require('less');


class Builder {

	constructor(root = 'index.html') {
		this.tags = {};
		this.scripts = {};
		this.parseFiles(root);
		this.index = this.tags['index.html'];
		delete this.tags['index.html'];
		this.compile();
		this.addScripts();
		this.createIndex();
		this.write();
	}


	parseFiles(filename) {
		let $ = cheerio.load(fs.readFileSync(filename, 'utf-8'));
		this.tags[filename] = {
			filename: filename,
			$: $,
			links: [],
			scripts: [],
			template: $('template').html(),
			script: $('script').text(),
			style: $('style').text()
		};
		$('link').each((i, el) => {
			var link = path.normalize(path.dirname(filename) + '/' + $(el).attr('tag'));
			this.tags[filename].links.push(link);
			this.parseFiles(link);
		});
		$('script[src]').each((i, el) => {
			var script = path.normalize(path.dirname(filename) + '/' + $(el).attr('src'));
			this.tags[filename].scripts.push(script);
			this.scripts[script] = fs.readFileSync(script, 'utf-8');
			$(el).remove();
		});
	}


	compile() {
		this.legacy = {
			script: fs.readFileSync('../webtag.js', 'utf-8') + '\n\n\n',
			style: ''
		};
		this.templates = '';
		for (var filename in this.tags) {
			// if (filename == 'index.html') continue;
			let file = this.tags[filename];
			console.log('compile now', file.filename);
			file.legacy = {};
			file.tagName = path.basename(file.filename).split('.')[0];
			this.templates += "<template id='" + file.tagName + "'>\n" + (file.template ? file.template : '') + "\n</template>\n\n\n";
			this.legacy.script += "CustomElements['" + file.tagName + "'] = class {\n" + file.script + '\n}\n\n\n';
			less.render(file.tagName + '{' + file.style + '}', (e, output) => {
				this.legacy.style += output.css;
			});
		}
	}

	addScripts() {
		// this.loadScripts();
		for (var script in this.scripts)
			this.legacy.script += this.scripts[script];
	}

	createIndex() {
		// let index = this.tags['index.html'];
		this.index.$('link[tag]').eq(0).before(this.templates);
		this.index.$('link[tag]').eq(0).before("<script src='index.js'></script>\n");
		this.index.$('link[tag]').eq(0).before('<link rel="stylesheet" type="text/css" href="index.css">\n');
		this.index.$('link[tag]').remove();
		// this.index = index.$.html();
	}

	write() {
		try {
			fs.mkdirSync('build');
			fs.mkdirSync('build/legacy');
		} catch (e) {}
		fs.writeFileSync('build/legacy/index.html', this.index.$.html(), 'utf-8');
		fs.writeFileSync('build/legacy/index.js', this.legacy.script, 'utf-8');
		fs.writeFileSync('build/legacy/index.css', this.legacy.style, 'utf-8');
	}


}

let build = new Builder('index.html');
// console.log(build.scripts);
// return;

var watch = Object.keys(build.tags).concat(Object.keys(build.scripts));

console.log('watch', watch);
fs.watch(".", {
	recursive: true
}, (event, filename) => {
	if (watch.indexOf(filename) == -1) return;
	console.log('change', filename);
	new Builder('index.html');
	// console.log('recompile!!!!!!!!!!');
});



// aggregate() {
// 	this.templates = '';
// 	this.legacy.script = fs.readFileSync('../WebTag/webtag.js', 'utf-8') + '\n\n\n';
// 	for (var filename in this.tags) {
// 		let file = this.tags[filename];
// 		this.legacy.script += file.legacy.script;
// 		this.legacy.style += file.legacy.style;
// 		this.templates += file.legacy.template;
// 	}
// }


// loadScripts() {
// 	this.scripts = {};
// 	for (var file in this.tags)
// 		for (var i = 0; i < this.tags[file].scripts.length; i++)
// 			this.scripts[this.tags[file].scripts[i]] = fs.readFileSync(this.tags[file].scripts[i], 'utf-8');
// }