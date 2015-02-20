angular
  .module('door3.css', [])
  .config(['$logProvider', function ($logProvider) {
    // Turn off/on in order to see console logs during dev mode
    $logProvider.debugEnabled(false);
  }])
  /**
   * Run - auto instantiate the $css provider by injecting it in the run phase of this module
   **/
  .run(['$css', function ($css) { }])
  .provider('$css', [$cssProvider])
  .filter('$cssLinks', $cssLinksFilter);
