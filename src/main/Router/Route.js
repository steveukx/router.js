if (typeof define !== 'function') { var define = require('amdefine')(module); }

/**
 * @exports Route
 */
define(['promise'], function (Promise) {

   'use strict';

   /**
    *
    * @param regex
    * @param {Function|Object} handler
    *
    * @name Route
    * @constructor
    */
   function Route(regex, handler) {
      this._regex = regex;

      if(typeof handler === 'function') {
         this._handler = handler;
      }
      else {
         this._configuration = handler;
      }
   }

   /**
    * @type {Function} The function that will handler this route being used.
    */
   Route.prototype._handler = null;

   /**
    * @type {Function|Object}
    */
   Route.prototype._configuration = null;

   /**
    *
    * @param routeParams
    * @returns {Promise}
    */
   Route.prototype._handler = function (routeParams) {
      throw new Error("Route._handler: Unable to handle route without being supplied a function.");
   };

   /**
    * Calls the handler associated with this route
    *
    * @param {String} url
    * @param {Object|String[]} routeParameters
    * @return {Promise}
    */
   Route.prototype.handleUrl = function (url, routeParameters) {
      var result;
      var response = new Promise;

      try {
         if(this._handler.length < 3) {
            result = this._handler(routeParameters, url);
         }
         else {
            result = this._handler(routeParameters, url, function(err, data) {
               err ? response.reject(err) : response.resolve(data);
            });
         }
      }
      catch (e) {
         return response.reject(e);
      }

      if (result && typeof result.then == 'function') {
         return result;
      }
      else {
         return response.resolve(result);
      }
   };

   /**
    * Evaluates whether this route is appropriate for the supplied URL.
    *
    * @param {String} url
    * @returns {Boolean}
    */
   Route.prototype.test = function (url) {
      return this._regex.test(url);
   };

   /**
    * Gets the array of matches for this Route against the given URL.
    *
    * @param {String} url
    * @returns {String[]}
    */
   Route.prototype.getRouteParameters = function (url) {
      return this._regex.exec(url);
   };

   return Route;

});
