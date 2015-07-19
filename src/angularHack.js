/**
 * AngularJS hack - This way we can get and decorate all custom directives
 * in order to broadcast a custom $directiveAdd event
 **/
var $directives = [];
var originalModule = angular.module;
angular.module = function () {
  var module = originalModule.apply(this, arguments);
  var originalDirective = module.directive;
  module.directive = function (directiveName, directiveFactory) {
    var originalDirectiveFactory = angular.isFunction(directiveFactory) ?
      directiveFactory : directiveFactory[directiveFactory.length - 1];
    try {
      var directive = angular.copy(originalDirectiveFactory)();
      directive.directiveName = directiveName;
      if (directive.hasOwnProperty('css')) {
        $directives.push(directive);
      }
    } catch (e) {
    }
    return originalDirective.apply(this, arguments);
  };
  module.config(['$provide', '$injector', function ($provide, $injector) {
    angular.forEach($directives, function ($directive) {
      var dirProvider = $directive.directiveName + 'Directive';
      if ($injector.has(dirProvider)) {
        $provide.decorator(dirProvider, ['$delegate', '$rootScope', '$timeout', function ($delegate, $rootScope, $timeout) {
          var directive = $delegate[0];
          var compile = directive.compile;
          if (directive.css) {
            $directive.css = directive.css;
          }
          directive.compile = function () {
            var link = compile ? compile.apply(this, arguments) : false;
            return function (scope) {
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
