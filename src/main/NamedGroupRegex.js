/**
 * @exports NamedGroupRegex
 */
var NamedGroupRegex = (function () {

   /**
    *
    * @param {String} source
    *
    * @name NamedGroupRegex
    * @constructor
    */
   function NamedGroupRegex(source) {
      var groups = this._groups = [];
      this._regex = new RegExp(
          source
              .replace(/:([a-zA-Z0-9]+)/g, function (match, group, position, all) {
                 groups.push(group);
                 return '([^/]+)';
              }));
   }

   NamedGroupRegex.prototype.test = function (comparison) {
      return this._regex.test(comparison.replace(/\/$/, ''));
   };

   NamedGroupRegex.prototype.exec = function (comparison) {
      var result = this._regex.exec(comparison);
      if (result) {
         result = result.slice(0);
         for (var i = 0, l = this._groups.length; i < l; i++) {
            result[this._groups[i]] = result[i + 1];
         }
      }
      return result;
   };

   return NamedGroupRegex;

}());
