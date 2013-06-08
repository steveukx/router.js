if (typeof define !== 'function') { var define = require('amdefine')(module) }

/**
 * @exports Router
 */
define(['./NamedGroupRegex', './Route'], function(NamedGroupRegex, Route) {

   /**
    * @name Router
    * @constructor
    */
   function Router() {
      Subscribable.prepareInstance(this);

      this._routes = [];
      this._initialiseEvents();
   }

   /**
    * @type {Boolean}
    */
   Router.prototype['config.strip.trailing.slash'] = false;

   /**
    * Config getter/setter. Called with just a key gets and returns the value of that configuration option,
    * called with a key and value, sets the configuration option to that value and returns the Router instance
    * for convenience of chaining requests.
    *
    * @param {String} key
    * @param [value]
    */
   Router.prototype.config = function(key, value) {
      if(value === undefined) {
         return this['config.' + key];
      }
      else {
         this['config.' + key] = value;
         return this;
      }
   };

   /**
    * Sets up the event handlers the router requires to operate
    */
   Router.prototype._initialiseEvents = function () {
   };

   /**
    * Handles the URL changing no matter which mechanism invoked the change.
    * @param {String} url
    */
   Router.prototype._handleNavigation = function (url) {
      var routes = this._getRoutesForUrl(url);
      if(!routes.length) {
         this.fire('router.bad.path', url);
      }
      else {
         this._processRoutes(routes, url);
      }
   };

   /**
    * Consumes an array of routes and handles each in series. Any additional arguments supplied will be passed
    * to each route being called, when objects they will be mutable between routes.
    *
    * @param {Route[]} routes
    * @param {String} url
    */
   Router.prototype._processRoutes = function(routes, url) {
      var args = [].slice.call(arguments, 2);
      var fire = this.fire.bind(this);
      var next = function(err, result) {
         if(err) {
            fire('route.error', err);
         }
         else if(routes.length) {
            var route = routes.unshift();
            var param = route.getRouteParameters(url);
            fire('route.before', route, param);

            route.handleUrl.apply(route, [url, param].concat(args)).then(
                function(result) {
                   next(null, fire('route.passed', route, result));
                },
                next
            );
         }
         else {
            fire('router.path.finished', url);
         }
      };

      fire('router.path.starting', url);
      next();
   };

   /**
    * Gets all routes that are active in the supplied URL
    * @param {String} url
    * @returns {Route[]}
    */
   Router.prototype._getRoutesForUrl = function (url) {
      if(this.config('strip.trailing.slash')) {
         url = url.replace(/\/$/, '');
      }

      return this._routes.filter(function (route) {
         return route.test(url);
      });
   };

   /**
    * Pushes a new route to the router.
    *
    * @param {RegExp|String|Route} route
    * @param {Function|Object} [routeHandler]
    */
   Router.prototype.route = function (route, routeHandler) {

      if (typeof route == 'string') {
         if(this.config('strip.trailing.slash')) {
            route = route.replace(/\/$/, '');
         }
         route = this._buildRoute(new NamedGroupRegex(route), routeHandler);
      }
      else if (route instanceof RegExp) {
         route = this._buildRoute(route, routeHandler);
      }
      else if (!(route instanceof Route)) {
         throw new TypeError("Must create a route with a string, regular expression or a Route instance");
      }

      this._routes.push(route);
      return this;
   };

   /**
    * Constructs the Route for the supplied regular expression implementation and function route handler
    *
    * @param regExp
    * @param routeHandler
    * @returns {Route}
    */
   Router.prototype._buildRoute = function(regExp, routeHandler) {
      return new Route(regExp, routeHandler);
   };

   return Router;

});
