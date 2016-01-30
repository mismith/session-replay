'use strict';

angular.module('miUtil', []).run(["$rootScope", "$document", "$timeout", function ($rootScope, $document, $timeout) {
	// remove 300ms click delay on touch devices
	FastClick.attach(document.body);

	// fix vh units in ios7 (and others)
	viewportUnitsBuggyfill.init();

	// menu
	var $menu = $rootScope.$menu = {
		active: false,
		open: function open(e) {
			$menu.active = true;
			if (e) e.stopPropagation();
		},
		close: function close(e) {
			$menu.active = false;
			if (e) e.stopPropagation();
		},
		toggle: function toggle(e) {
			$menu.active = !$menu.active;
			if (e) e.stopPropagation();
		}
	};
	// close the menu as soon as you click
	$document.on('click', function () {
		$timeout(function () {
			$menu.close();
		});
	});
	// allow Esc key to close menu
	$document.on('keyup', function (e) {
		if (e.keyCode === 27 /*esc*/) {
				$timeout(function () {
					$menu.close();
				});
			}
	});
	// prevent scroll bubbling when menu open
	$rootScope.$watch('$menu.active', function (v) {
		angular.element(document.body).css({
			overflow: v ? 'hidden' : ''
		});
	});

	// modal
	var $modal = $rootScope.$modal = {
		active: false,
		open: function open(id) {
			$modal.active = id;
		},
		close: function close() {
			$modal.active = false;
		},
		toggle: function toggle(id) {
			$modal.active = $modal.active === id ? false : id;
		},
		isOpen: function isOpen(id) {
			return $modal.active === id;
		}
	};
	// allow Esc key to close modal
	$document.on('keyup', function (e) {
		if (e.keyCode === 27 /*esc*/) {
				$timeout(function () {
					$modal.close();
				});
			}
	});
	// prevent scroll bubbling when modal open
	$rootScope.$watch('$modal.active', function (v) {
		angular.element(document.body).css({
			overflow: v ? 'hidden' : ''
		});
		$rootScope.$broadcast('$modal.' + (v ? 'open' : 'close'));
	});
}]).filter('length', function () {
	return function (obj) {
		return angular.isArray(obj) ? obj.length : angular.isObject(obj) ? Object.keys(obj).filter(function (v) {
			return v[0] != '$';
		}).length : 0;
	};
}).filter('unique', function () {
	return function (array, key) {
		if (!array) return array;

		var o = {},
		    r = [];

		for (var i = 0; i < array.length; i++) {
			o[angular.isFunction(key) ? key(array[i]) : array[i][key]] = array[i];
		}
		for (var k in o) {
			r.push(o[k]);
		}
		return r;
	};
}).directive('miIcon', function () {
	return {
		scope: { svg: '@', size: '@' },
		restrict: 'E',
		replace: true,
		templateNamespace: 'svg',
		template: '<svg xmlns="http://www.w3.org/2000/svg" class="mi-icon" style="display: inline-block; width: {{ size || 16 }}px; height: {{ size || 16 }}px; fill: currentColor; vertical-align: middle;"><use xlink:href="" /></svg>',
		link: function link($scope, $element, $attrs) {
			// manual scope override to avoid initial svg attr set issue/error
			$attrs.$observe('svg', function (svg) {
				$element.children().attr('xlink:href', 'assets/icons.svg#' + svg);
			});
		}
	};
}).directive('miModal', function () {
	return {
		scope: { id: '@' },
		restrict: 'E',
		replace: true,
		transclude: true,
		template: '<aside ng-show="$modal.isOpen(id)" ng-click="$modal.close()" class="mi-modal-container" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0;">\n\t\t\t\t<div class="mi-modal">\n\t\t\t\t\t<div ng-click="$event.stopPropagation()" class="mi-modal-content" ng-transclude></div>\n\t\t\t\t\t<a ng-click="$modal.close()" class="mi-modal-close">\n\t\t\t\t\t\t<mi-icon svg="x"></mi-icon>\n\t\t\t\t\t</a>\n\t\t\t\t</div>\n\t\t\t</aside>'
	};
}).directive('miClickToggle', ["$timeout", "$parse", function ($timeout, $parse) {
	return {
		restrict: 'A',
		link: function link($scope, $element, $attrs) {
			var obj = $scope.$eval($attrs.miClickToggle);
			$element.on('click', function (e) {
				e.preventDefault();

				$timeout(function () {
					angular.forEach(obj, function (v, k) {
						return $parse(k).assign($scope, v);
					});
				});
			});
			angular.forEach(obj, function (v, k) {
				$scope.$watch(k, function (newV) {
					if (newV !== undefined) $element[v === newV ? 'addClass' : 'removeClass']($scope.$eval($attrs.miClickToggleActive) || 'active');
				});
			});
		}
	};
}]);
'use strict';

angular.module('session-replay', ['ui.router', 'ui.router.title', 'miUtil']).config(["$locationProvider", "$urlRouterProvider", "$urlMatcherFactoryProvider", "$stateProvider", function ($locationProvider, $urlRouterProvider, $urlMatcherFactoryProvider, $stateProvider) {
	// routing
	$locationProvider.html5Mode(true).hashPrefix('!');
	$urlRouterProvider.when('', '/');
	$urlRouterProvider.when('home', '/');
	$urlMatcherFactoryProvider.strictMode(false); // make trailing slashes optional

	// pages
	var pages = ['home'];
	$stateProvider.state('main', {
		abstract: true,
		templateUrl: 'views/main.html'
	}).state('page', {
		parent: 'main',
		url: '/{page:|' + pages.join('|') + '}',
		templateUrl: function templateUrl($stateParams) {
			return 'views/page/' + ($stateParams.page || 'home') + '.html';
		},
		resolve: {
			$title: ["$stateParams", function $title($stateParams) {
				switch ($stateParams.page) {
					case '':
					case 'home':
						return '';
					default:
						return $stateParams.page[0].toUpperCase() + $stateParams.page.slice(1);
				}
			}]
		}
	})
	// fallbacks
	.state('404', {
		parent: 'main',
		templateUrl: 'views/page/404.html'
	});
	$urlRouterProvider.otherwise(function ($injector, $location) {
		var $state = $injector.get('$state');
		$state.go('404', null, { location: false });
		return $location.path();
	});
}]).controller('AppCtrl', ["$rootScope", "$state", function ($rootScope, $state) {
	$rootScope.$state = $state;

	$rootScope.menus = [{
		name: 'Home',
		sref: 'page({page: "", "#": ""})'
	}];
}]);