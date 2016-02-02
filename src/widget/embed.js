(function () {
	// get userId
	var userId = document.currentScript.src.match(/userId\=([^&]*)(&|$)/)[1];
	if ( ! userId) return;
	
	// helpers
	function httpGetAsync(theUrl, callback) {
		var xmlHttp = new XMLHttpRequest();
		xmlHttp.onreadystatechange = function() {
			if (xmlHttp.readyState == 4 && xmlHttp.status == 200) callback(xmlHttp.responseText);
		}
		xmlHttp.open("GET", theUrl, true);
		xmlHttp.send(null);
	}
	
	// set base url
	var base = document.querySelector('base');
	base = base && base.href || '';
	
	// inline external stylesheets
	for(var i = 0, links = document.getElementsByTagName('link'); i < links.length; i++) {
		if (links[i].rel === 'stylesheet') {
			var link = links[i]
			//if (link.href.indexOf(base) === 0) { // it is a local resource
				var style = document.createElement('style');
				httpGetAsync(link.href, function (responseText) {
					style.appendChild(document.createTextNode(responseText));
				});
				link.parentNode.replaceChild(style, link);
			//}
		}
	}
	
	// load dependencies
	var deferreds = [];
	[
		'https://cdn.firebase.com/js/client/2.4.0/firebase.js',
		'https://cdn.rawgit.com/rafaelw/mutation-summary/master/src/mutation-summary.js',
		'https://cdn.rawgit.com/rafaelw/mutation-summary/master/util/tree-mirror.js',
	].forEach(function(src) {
		deferreds.push(new Promise(function(resolve, reject) {
			var script = document.createElement('script');
			script.src = src;
			script.async = true;
			document.head.appendChild(script);
			
			script.addEventListener('load', resolve);
		}));
	});
	Promise.all(deferreds).then(function () {
		// wait for everything to be loaded
		window.addEventListener('load', function () {
			var firebase = new Firebase('https://session-replay.firebaseio.com/users/' + userId);
			
			// initialize a session
			var sessionRef = firebase.child('sessions').push({
				width: window.innerWidth || null,
				height: window.innerHeight || null,
				userAgent: navigator.userAgent || null,
				url: window.location.href || null,
				base: base || null,
				createdAt: new Date().toISOString(),
			});
			var messagesRef = firebase.child('messages/' + sessionRef.key());
			
			// send DOM change messages
			new TreeMirrorClient(document, {
				initialize: function(rootId, children) {
					messagesRef.push({
						fn: 'initialize',
						timestamp: +new Date(),
						args: JSON.stringify([rootId, children]),
					});
				},
				applyChanged: function(removed, addedOrMoved, attributes, text) {
					messagesRef.push({
						fn: 'applyChanged',
						timestamp: +new Date(),
						args: JSON.stringify([removed, addedOrMoved, attributes, text]),
					});
				},
			});
			
			// send event messages
			[
				'mousemove',
				'click',
				'dblclick',
				'contextmenu',
				'change',
				'scroll',
				'keydown',
				'keyup',
			].map(function (type) {
				document.addEventListener(type, function (e) {
					if (e.target.tagName === 'INPUT') {
						// since certain prop changes don't affect the DOM, they aren't registered, so let's change the DOM to make sure they are reflected
						e.target.checked ? e.target.setAttribute('checked', true) : e.target.removeAttribute('checked');
						e.target.setAttribute('value', e.target.value);
					}
					
					messagesRef.push({
						event: e.type,
						timestamp: +new Date(),
						targetId: e.target.__mutation_summary_node_map_id__ || null, // @HACK: is this reliable?
						
						x: e.clientX || null,
						y: e.clientY || null,
						
						keyCode: e.keyCode || null,
						
						scrollTop: e.target.scrollTop || null,
					});
				}, true);
			});
			window.addEventListener('resize', function (e) {
				messagesRef.push({
					event: e.type,
					timestamp: +new Date(),
					
					width: window.innerWidth || null,
					height: window.innerHeight || null,
				});
			}, true);
		});
	});
})();
