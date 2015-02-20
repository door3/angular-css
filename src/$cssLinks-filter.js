/**
 * Links filter - renders the stylesheets array in html format
 **/
function $cssLinksFilter() {
  return function $cssLinks(stylesheets) {
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
  };
}
