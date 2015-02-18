/**
 * AngularCSS - CSS on-demand for AngularJS
 * @version v1.0.7
 * @author DOOR3, Alex Castillo
 * @link http://door3.github.io/angular-css
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */

'use strict';

(function (angular) {

  /**
   * AngularCSS Module
   * Contains: config, constant, provider and run
   **/
   /*global angular*/
  var angularCSS = angular.module('door3.css', []);

  // Config
  angularCSS.config(['$logProvider', function ($logProvider) {
    // Turn off/on in order to see console logs during dev mode
    $logProvider.debugEnabled(false);
  }]);

  // Provider
  angularCSS.provider('$css', [function $cssProvider() {

    // Defaults - default options that can be overridden from application config
    var defaults = this.defaults = {
      element: 'link',
      rel: 'stylesheet',
      type: 'text/css',
      container: 'head',
      method: 'append',
      weight: 0
    };

    this.$get = ['$rootScope','$injector','$q','$window','$timeout','$compile','$http','$filter','$log',
                function $get($rootScope, $injector, $q, $window, $timeout, $compile, $http, $filter, $log) {

      var $css = {};
      var currentStack = {
        routes: [],
        states: []
      };
      var uiResolved;
      var uiRouterPromise;



      var template = '<link ng-repeat="stylesheet in stylesheets track by $index | orderBy: \'weight\' " rel="{{ stylesheet.rel }}" type="{{ stylesheet.type }}" ng-href="{{ stylesheet.href }}" ng-attr-media="{{ stylesheet.media }}">';

      // Variables - default options that can be overridden from application config
      var mediaQuery = {}, mediaQueryListener = {}, mediaQueriesToIgnore = ['print'], options = angular.extend({}, defaults),
        container = angular.element(document.querySelector ? document.querySelector(options.container) : document.getElementsByTagName(options.container)[0]),
        dynamicPaths = [];

      // Parse all directives
      angular.forEach($directives, function (directive, key) {
        if (directive.hasOwnProperty('css')) {
          $directives[key] = parse(directive.css);
        }
      });

      // Apply Css on Change
      function _applyCssStateOnChange (event, current, params, prev) {
        // Removes previously added css rules
        if (prev) {
          $css.remove($css.getFromState(prev).concat(dynamicPaths));
          // Reset dynamic paths array
          dynamicPaths.length = 0;
        }
        uiResolved.$$promises._door3CssState.then(function () {
          currentStack.states.forEach(function (cssItem) {
            $css.add(cssItem);
          });
        });
      }

      // Apply Css on Change
      function _applyCssRouteOnChange (event, current, prev) {
        // Removes previously added css rules
        if (prev) {
          $css.remove($css.getFromRoute(prev).concat(dynamicPaths));
          // Reset dynamic paths array
          dynamicPaths.length = 0;
        }
        currentStack.routes.forEach(function (cssItem) {
          console.log(cssItem);
          $css.add(cssItem);
        });
      }

      // Inject and resolve css added to routes/states
      function _resolveStatePromises (current, prev, resolveProp, params) {
        console.log(current.resolve);
        var
          uiResolve,
          currentRoute = $css.getFromState(current, 'resolve');
          uiResolve = $injector.get('$resolve');
        if (prev) {
          if (current) {
            // resolve to ui.router
            currentStack.states = [];
            uiRouterPromise = function () {
                var defer = $q.defer();
                $css.preload(currentRoute, function () {
                  currentStack.states.push(currentRoute);
                }, 'resolve', defer, current.url);
                return defer.promise;
            };
            uiResolved = uiResolve.resolve({
              _door3CssState: uiRouterPromise
            });
          }
        } else {
          currentStack.states.push(currentRoute);
        }
      }

      // Inject and resolve css added to routes/states
      function _resolveRoutePromises (current, prev, resolveProp) {
        var
          ngResolve,
          currentRoute = $css.getFromRoute(current, 'resolve');
          ngResolve = current.$$route;
        if (prev) {
          if (current) {
            // resolve to ngRoute
            if (!ngResolve.resolve) {
              ngResolve.resolve = {};
            }
            currentStack.routes = [];
            ngResolve.resolve[resolveProp] = function () {
              var defer = $q.defer();
              $css.preload(currentRoute, function () {
                currentStack.routes.push(currentRoute);
              }, 'resolve', defer, ngResolve.originalPath);
              return defer.promise;
            };
          }
        } else {
            currentStack.routes.push(currentRoute);
        }
      }

      /**
       * Listen for directive add event in order to add stylesheet(s)
       **/
      function $directiveAddEventListener(event, directive, scope) {
        // Binds directive's css
        if (scope && directive.hasOwnProperty('css')) {
          $css.bind([parse(directive.css)], scope);
        }
      }

      /**
       * Listen for route change event and add/remove stylesheet(s)
       **/
      function $routeEventListener(event, current, prev) {
        // Adds current css rules and queued to resolve
        if (current) {
          // Adds to resolve
          _resolveRoutePromises(current, prev, '_door3CssRoute');
        }
      }

      /**
       * Listen for state change event and add/remove stylesheet(s)
       **/
      function $stateEventListener(event, current, params, prev) {
        // Adds current css rules and queued to resolve
        if (current) {
          _resolveStatePromises(current, prev, '_door3CssState', params);
        }
      }

      /**
       * Map breakpoitns defined in defaults to stylesheet media attribute
       **/
      function mapBreakpointToMedia(stylesheet) {
        if (angular.isDefined(options.breakpoints)) {
          if (stylesheet.breakpoint in options.breakpoints) {
            stylesheet.media = options.breakpoints[stylesheet.breakpoint];
          }
          delete stylesheet.breakpoints;
        }
      }

      /**
       * Parse: returns array with full all object based on defaults
       **/
      function parse(obj) {
        if (!obj) {
          return;
        }
        // Function syntax
        if (angular.isFunction(obj)) {
          obj = angular.copy($injector.invoke(obj));
        }
        // String syntax
        if (angular.isString(obj)) {
          obj = angular.extend({
            href: obj
          }, options);
        }
        // Array of strings syntax
        if (angular.isArray(obj) && angular.isString(obj[0])) {
          angular.forEach(obj, function (item) {
            obj = angular.extend({
              href: item
            }, options);
          });
        }
        // Object syntax
        if (angular.isObject(obj) && !angular.isArray(obj)) {
          obj = angular.extend(obj, options);
        }
        // Array of objects syntax
        if (angular.isArray(obj) && angular.isObject(obj[0])) {
          angular.forEach(obj, function (item) {
            obj = angular.extend(item, options);
          });
        }
        // Map breakpoint to media attribute
        mapBreakpointToMedia(obj);
        return obj;
      }

      // Add stylesheets to scope
      $rootScope.stylesheets = [];

      // Adds compiled link tags to container element
      container[options.method]($compile(template)($rootScope));

      // Directive event listener (emulated internally)
      $rootScope.$on('$directiveAdd', $directiveAddEventListener);

      // Routes event listener ($route required)
      $rootScope.$on('$routeChangeStart', $routeEventListener);

      // States event listener ($state required)
      $rootScope.$on('$stateChangeStart', $stateEventListener);

      // Routes event listener ($route required)
      $rootScope.$on('$routeChangeSuccess', _applyCssRouteOnChange);

      // States event listener ($route required)
      $rootScope.$on('$stateChangeSuccess', _applyCssStateOnChange);
       /**
       * Bust Cache
       **/
      function bustCache(stylesheet) {
        if (!stylesheet) {
          return $log.error('No stylesheets provided');
        }
        var queryString = '?cache=';
        // Append query string for bust cache only once
        if (stylesheet.href.indexOf(queryString) === -1) {
          stylesheet.href = stylesheet.href + (stylesheet.bustCache ? queryString + (new Date().getTime()) : '');
        }
      }

      /**
       * Filter By: returns an array of routes based on a property option
       **/
      function filterBy(array, prop) {
        if (!array || !prop) {
          return $log.error('filterBy: missing array or property');
        }
        return $filter('filter')(array, function (item) {
          return item[prop];
        });
      }

      /**
       * Add Media Query
       **/
      function addViaMediaQuery(stylesheet) {
        if (!stylesheet) {
          return $log.error('No stylesheet provided');
        }
        // Media query object
        mediaQuery[stylesheet.href] = $window.matchMedia(stylesheet.media);
        // Media Query Listener function
        mediaQueryListener[stylesheet.href] = function(mediaQuery) {
          // Trigger digest
          $timeout(function () {
            if (mediaQuery.matches) {
              // Add stylesheet
              $rootScope.stylesheets.push(stylesheet);
            } else {
              var index = $rootScope.stylesheets.indexOf($filter('filter')($rootScope.stylesheets, {
                href: stylesheet.href
              })[0]);
              // Remove stylesheet
              if (index !== -1) {
                $rootScope.stylesheets.splice(index, 1);
              }
            }
          });
        }
        // Listen for media query changes
        mediaQuery[stylesheet.href].addListener(mediaQueryListener[stylesheet.href]);
        // Invoke first media query check
        mediaQueryListener[stylesheet.href](mediaQuery[stylesheet.href]);
      }

      /**
       * Remove Media Query
       **/
      function removeViaMediaQuery(stylesheet) {
        if (!stylesheet) {
          return $log.error('No stylesheet provided');
        }
        // Remove media query listener
        if ($rootScope && angular.isDefined(mediaQuery)
          && mediaQuery[stylesheet.href]
          && angular.isDefined(mediaQueryListener)) {
          mediaQuery[stylesheet.href].removeListener(mediaQueryListener[stylesheet.href]);
        }
      }

      /**
       * Is Media Query: checks for media settings, media queries to be ignore and match media support
       **/
      function isMediaQuery(stylesheet) {
        if (!stylesheet) {
          return $log.error('No stylesheet provided');
        }
        return !!(
          // Check for media query setting
          stylesheet.media
          // Check for media queries to be ignored
          && (mediaQueriesToIgnore.indexOf(stylesheet.media) === -1)
          // Check for matchMedia support
          && $window.matchMedia
        );
      }

      /**
       * Get From Route: returns array of css objects from single route
       **/
      $css.getFromRoute = function (route, condition) {
        var cssItem;
        if (!route) {
          return $log.error('Get From Route: No route provided');
        }
        var css = null, result = [];
        if (route.$$route && route.$$route.css) {
          css = route.$$route.css;
        }
        else if (route.css) {
          css = route.css;
        }
        // Adds route css rules to array
        if (css) {
          if (angular.isArray(css)) {
            angular.forEach(css, function (cssItem) {
              cssItem = parse(cssItem);
              if (angular.isFunction(cssItem)) {
                dynamicPaths.push(cssItem);
              }
              if (condition) {
                cssItem.resolve = true;
              }
              result.push(cssItem);
            });
          } else {
            cssItem = parse(css);
            if (angular.isFunction(css)) {
              dynamicPaths.push(cssItem);
            }
            if (condition) {
              cssItem.resolve = true;
            }
            result.push(cssItem);
          }
        }
        return result;
      };

      /**
       * Get From Routes: returns array of css objects from ng routes
       **/
      $css.getFromRoutes = function (routes) {
        if (!routes) {
          return $log.error('Get From Routes: No routes provided');
        }
        var result = [];
        // Make array of all routes
        angular.forEach(routes, function (route) {
          var css = $css.getFromRoute(route);
          if (css.length) {
            result.push(css[0]);
          }
        });
        return result;
      };

      /**
       * Get From State: returns array of css objects from single state
       **/
      $css.getFromState = function (state, condition) {
        var cssItem;
        if (!state) {
          return $log.error('Get From State: No state provided');
        }
        var result = [];
        // State "views" notation
        if (angular.isDefined(state.views)) {
          angular.forEach(state.views, function (item) {
            if (item.css) {
              cssItem = parse(item.css);
              if (angular.isFunction(item.css)) {
                dynamicPaths.push(cssItem);
              }
              if (condition) {
                cssItem.resolve = true;
              }
              result.push(cssItem);
            }
          });
        }
        // State "children" notation
        if (angular.isDefined(state.children)) {
          angular.forEach(state.children, function (child) {
            if (child.css) {
              cssItem = parse(child.css);
              if (angular.isFunction(child.css)) {
                dynamicPaths.push(cssItem);
                if (condition) {
                  cssItem.resolve = true;
                }
              }
              result.push(cssItem);
            }
            if (angular.isDefined(child.children)) {
              angular.forEach(child.children, function (childChild) {
                if (childChild.css) {
                  cssItem = parse(childChild.css);
                  if (angular.isFunction(childChild.css)) {
                    dynamicPaths.push(cssItem);
                    if (condition) {
                      cssItem.resolve = true;
                    }
                  }
                  result.push(cssItem);
                }
              });
            }
          });
        }
        // State default notation
        if (angular.isDefined(state.css)) {
          // For multiple stylesheets
          if (angular.isArray(state.css)) {
              angular.forEach(state.css, function (itemCss) {
                cssItem = parse(itemCss);
                if (angular.isFunction(itemCss)) {
                  dynamicPaths.push(cssItem);
                  if (condition) {
                    cssItem.resolve = true;
                  }
                }
                result.push(cssItem);
              });
            // For single stylesheets
          } else {
            if (angular.isFunction(state.css)) {
              dynamicPaths.push(parse(state.css));
              if (condition) {
                var stateCss = {
                  href: state.css
                };
                angular.extend(stateCss, defaults);
              }
            }
            result.push(parse(state.css));
          }
        }
        return result;
      };

      /**
       * Get From States: returns array of css objects from states
       **/
      $css.getFromStates = function (states) {
        if (!states) {
          return $log.error('Get From States: No states provided');
        }
        var result = [];
        // Make array of all routes
        angular.forEach(states, function (state) {
          var css = $css.getFromState(state);
          if (angular.isArray(css)) {
            angular.forEach(css, function (cssItem) {
              result.push(cssItem);
            });
          } else {
            result.push(css);
          }
        });
        return result;
      };

      /**
       * Preload: preloads css via http request
       **/
      $css.preload = function (stylesheets, callback, condition, defer, path) {
        var promise;
        if (condition === 'resolve') {
          promise = true;
        } else {
          condition = 'preload';
        }
        // If no stylesheets provided, then preload all
        if (!stylesheets) {
          stylesheets = [];
          // Add all stylesheets from custom directives to array
          if ($directives.length) {
            Array.prototype.push.apply(stylesheets, $directives);
          }
          // Add all stylesheets from ngRoute to array
          if ($injector.has('$route')) {
            Array.prototype.push.apply(stylesheets, $css.getFromRoutes($injector.get('$route').routes));
          }
          // Add all stylesheets from UI Router to array
          if ($injector.has('$state')) {
            Array.prototype.push.apply(stylesheets, $css.getFromStates($injector.get('$state').get()));
          }
        }
        if (!angular.isArray(stylesheets)) {
          stylesheets = [stylesheets];
        }
        stylesheets = filterBy(stylesheets, condition);
        var stylesheetLoadPromises = [];
        angular.forEach(stylesheets, function(stylesheet, key) {
          stylesheet = stylesheets[key] = parse(stylesheet);
          stylesheetLoadPromises.push(
            // Preload via ajax request
            $http.get(stylesheet.href).error(function (response) {
              $log.error('AngularCSS: Incorrect path for ' + stylesheet.href);
            })
          );
        });
        if (angular.isFunction(callback)) {
          $q.all(stylesheetLoadPromises).then(function () {
            if (promise) {
              defer.resolve(path || '');
              callback(stylesheets);
            } else {
              callback(stylesheets);
            }
          }, function () {
            if (promise) {
              defer.reject();
            }
            $log.error('Promise array failed.');
          });
        }
      };

      /**
       * Bind: binds css in scope with own scope create/destroy events
       **/
       $css.bind = function (css, $scope) {
        if (!css || !$scope) {
          return $log.error('No scope or stylesheets provided');
        }
        var result = [];
        // Adds route css rules to array
        if (angular.isArray(css)) {
          angular.forEach(css, function (cssItem) {
            result.push(parse(cssItem));
          });
        } else {
          result.push(parse(css));
        }
        $css.add(result);
        $log.debug('$css.bind(): Added', result);
        $scope.$on('$destroy', function () {
          $css.remove(result);
          $log.debug('$css.bind(): Removed', result);
        });
       };

      /**
       * Add: adds stylesheets to scope
       **/
      $css.add = function (stylesheets, callback) {
        if (!stylesheets) {
          return $log.error('No stylesheets provided');
        }
        if (!angular.isArray(stylesheets)) {
          stylesheets = [stylesheets];
        }
        angular.forEach(stylesheets, function(stylesheet) {
          stylesheet = parse(stylesheet);
          // Avoid adding duplicate stylesheets
          if (stylesheet.href && !$filter('filter')($rootScope.stylesheets, { href: stylesheet.href }).length) {
            // Bust Cache feature
            bustCache(stylesheet)
            // Media Query add support check
            if (isMediaQuery(stylesheet)) {
              addViaMediaQuery(stylesheet);
            }
            else {
              $rootScope.stylesheets.push(stylesheet);
            }
            $log.debug('$css.add(): ' + stylesheet.href);
          }
        });
        // Broadcasts custom event for css add
        $rootScope.$broadcast('$cssAdd', stylesheets, $rootScope.stylesheets);
      };

      /**
       * Remove: removes stylesheets from scope
       **/
      $css.remove = function (stylesheets, callback) {
        if (!stylesheets) {
          return $log.error('No stylesheets provided');
        }
        if (!angular.isArray(stylesheets)) {
          stylesheets = [stylesheets];
        }
        // Only proceed based on persist setting
        stylesheets = $filter('filter')(stylesheets, function (stylesheet) {
          return !stylesheet.persist;
        });
        angular.forEach(stylesheets, function(stylesheet) {
          stylesheet = parse(stylesheet);
          // Get index of current item to be removed based on href
          var index = $rootScope.stylesheets.indexOf($filter('filter')($rootScope.stylesheets, {
            href: stylesheet.href
          })[0]);
          // Remove stylesheet from scope (if found)
          if (index !== -1) {
            $rootScope.stylesheets.splice(index, 1);
          }
          // Remove stylesheet via media query
          removeViaMediaQuery(stylesheet);
          $log.debug('$css.remove(): ' + stylesheet.href);
        });
        // Broadcasts custom event for css remove
        $rootScope.$broadcast('$cssRemove', stylesheets, $rootScope.stylesheets);
      };

      /**
       * Remove All: removes all style tags from the DOM
       **/
      $css.removeAll = function () {
        // Remove all stylesheets from scope
        if ($rootScope && $rootScope.hasOwnProperty('stylesheets')) {
          $rootScope.stylesheets.length = 0;
        }
        $log.debug('all stylesheets removed');
      };

      // Preload all stylesheets
      $css.preload();

      return $css;

    }];

  }]);

  /**
   * Links filter - renders the stylesheets array in html format
   **/
  angularCSS.filter('$cssLinks', function () {
    return function (stylesheets) {
      if (!stylesheets || !angular.isArray(stylesheets)) {
        return stylesheets;
      }
      var result = '';
      angular.forEach(stylesheets, function (stylesheet) {
        result += '<link rel="' + stylesheet.rel + '" type="' + stylesheet.type + '" href="' + stylesheet.href + '"';
        result += (stylesheet.media ? ' media="' + stylesheet.media + '"' : '')
        result += '>\n\n';
      });
      return result;
    }
  });

  /**
   * Run - auto instantiate the $css provider by injecting it in the run phase of this module
   **/
  angularCSS.run(['$css', function ($css) { } ]);

  /**
   * AngularJS hack - This way we can get and decorate all custom directives
   * in order to broadcast a custom $directiveAdd event
   **/
  var $directives = [];
  var originalModule = angular.module;
  angular.module = function () {
    var module = originalModule.apply(this, arguments);
    var originalDirective = module.directive;
    module.directive = function(directiveName, directiveFactory) {
      var originalDirectiveFactory = angular.isFunction(directiveFactory) ?
      directiveFactory : directiveFactory[directiveFactory.length - 1];
      try {
        var directive = angular.copy(originalDirectiveFactory)();
        directive.directiveName = directiveName;
        if (directive.hasOwnProperty('css')) {
          $directives.push(directive);
        }
      } catch (e) { }
      return originalDirective.apply(this, arguments);
    };
    module.config(['$provide','$injector', function ($provide, $injector) {
      angular.forEach($directives, function ($directive) {
        var dirProvider = $directive.directiveName + 'Directive';
        if ($injector.has(dirProvider)) {
          $provide.decorator(dirProvider, ['$delegate', '$rootScope', '$timeout', function ($delegate, $rootScope, $timeout) {
            var directive = $delegate[0];
            var compile = directive.compile;
            if (directive.css) {
              $directive.css = directive.css;
            }
            directive.compile = function() {
              var link = compile ? compile.apply(this, arguments): false;
              return function(scope) {
                var linkArgs = arguments;
                $timeout(function () {
                  if (link) {
                    link.apply(this, linkArgs);
                  }
                });
                $rootScope.$broadcast('$directiveAdd', directive, scope);
              };
            };
            return $delegate;
          }]);
        }
      });
    }]);
    return module;
  };
  /* End of hack */

})(angular);
