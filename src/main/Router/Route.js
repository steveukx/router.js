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
    * @param request
    * @returns {Promise}
    */
   Route.prototype._handler = function () {
      throw new Error('Route._handler: Unable to handle route without being supplied a function.');
   };

   /**
    * Calls the handler associated with this route
    *
    * @param {Object} request request.url and request.param contain the URL for the request and route parameters for
    *                         this route and will change between routes on the same request. The request can be used
    *                         to maintain state between routes.
    * @return {Promise}
    */
   Route.prototype.handleUrl = function (request) {
      var result;
      var response = new Promise;

      try {
         if(this._handler.length < 2) {
            result = this._handler(request);
         }
         else {
            this._handler(request, function(err, data) {
               if(err) {
                  response.reject(err);
               }
               else {
                  response.resolve(data);
               }
            });
         }
      }
      catch (e) {
         return response.reject(e);
      }

      if (result && typeof result.then == 'function') {
         return result;
      }
      else if(this._handler.length < 2) {
         return response.resolve(result);
      }
      else {
         return response;
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
