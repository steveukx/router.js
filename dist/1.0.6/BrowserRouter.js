


/**
 * @exports NamedGroupRegex
 */
define('NamedGroupRegex',[],  function () {

   

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
              .replace(/:([a-zA-Z0-9]+)/g, function (match, group) {
                 groups.push(group);
                 return '([^/]+)';
              }));
   }

   NamedGroupRegex.prototype.test = function (comparison) {
      return this._regex.test(comparison);
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

});



/**
 * @exports Route
 */
define('Route',['promise'], function (Promise) {

   

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
            this._handler(routeParameters, url, function(err, data) {
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
      else if(this._handler.length < 3) {
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



/**
 * @exports Router
 */
define('Router',['./NamedGroupRegex', './Route', 'subscribable'], function(NamedGroupRegex, Route, Subscribable) {

   

   /**
    *
    * @name Router
    * @constructor
    */
   function Router() {
      this._routes = [];
      this._initialiseEvents();
   }

   Router.prototype = Object.create(Subscribable.prototype);

   /**
    * @type {Boolean}
    */
   Router.prototype['config.strip.trailing.slash'] = false;

   /**
    * @type {String}
    */
   Router.prototype['config.model.getter'] = 'getModel';

   /**
    * @type {String}
    */
   Router.prototype['config.model.setter'] = 'setModel';

   /**
    * @type {String}
    */
   Router.prototype['config.view.setter'] = 'setView';

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
      var cleanUrl = this._cleanUrl(url);

      var routes = this._getRoutesForUrl(cleanUrl);
      if(!routes.length) {
         this.fire('router.bad.path', cleanUrl);
      }
      this._processRoutes(routes, url);
   };

   /**
    * Gets the correct URL given a source URL
    * @param {String} url
    * @returns {String}
    */
   Router.prototype._cleanUrl = function(url) {
      if(this.config('strip.trailing.slash')) {
         url = url.replace(/\/$/, '');
      }
      return url;
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
            var route = routes.shift();
            var param = route.getRouteParameters(url) || {};
            param.data = param.data || result || {};
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
         throw new TypeError('Must create a route with a string, regular expression or a Route instance');
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



/**
 * @exports BrowserRoute
 */
define('BrowserRoute',['./Route', 'promise'], function (Route, Promise) {

   

   var merge = function(input, options) {
      return String(input).replace(/\{([^\}]+)\}/g, function (all, key) {
         return options && options[key];
      });
   };

   /**
    *
    * @constructor
    * @name BrowserRoute
    * @extends Route
    */
   function BrowserRoute() {
      Route.apply(this, arguments);
   }
   BrowserRoute.prototype = Object.create(BrowserRoute.superclass = Route.prototype);

   BrowserRoute.prototype._handler = function(routeParams, url) {
      var result = new Promise;
      var handlerConfig = this._configuration;

      var onDataReady = function (template, data) {
         handlerConfig.template = template;

         data = data || routeParams;

         // is the model a constructor
         if(typeof handlerConfig.model === 'function') {
            data = new handlerConfig.model(data);
            if(data.setData) {
               handlerConfig.model = data;
            }
         }

         // is the model a persisted model that can accept new data
         else if(handlerConfig.model && typeof handlerConfig.model.setData === 'function') {
            handlerConfig.model.setData(data);
         }

         // is the controller a constructor
         if(typeof handlerConfig.controller === 'function') {
            handlerConfig.controller = new handlerConfig.controller(handlerConfig.model);
         }

         if(handlerConfig.controller && typeof handlerConfig.controller.setRoute === 'function') {
            handlerConfig.controller.setRoute(routeParams, handlerConfig.model || data);
         }

         var model = handlerConfig.model || data;
         var element = jQuery(template.trim());
         var view = (typeof handlerConfig.view == 'function') ? new handlerConfig.view(element) : element;
         var controller = handlerConfig.controller;

         // wire up the m, v and c with standard getter/setter methods
         if(handlerConfig.getModel(controller) !== model) {
            handlerConfig.setModel(controller, model);
         }
         handlerConfig.setView(controller, view);
         handlerConfig.setModel(view, model);

         if(handlerConfig.replace) {
            jQuery(handlerConfig.replace).replaceWith(element);
         }
         else {
            element.appendTo(handlerConfig.container || document.body);
         }
      };

      var dependencies = {
         done: function(data) {
            this._data = this._data || data;
            if(--this._pending <= 0) {
               onDataReady(this.template || '<div />', this._data);
            }
         },
         start: function() {
            if(!this._pending) {
               this.done(null);
            }
         },
         add: function() {
            this._pending++;
         },
         template: handlerConfig.template,
         _data: null,
         _pending: 0
      };

      if(handlerConfig.templateUrl) {
         dependencies.add(require(['text!' + merge(handlerConfig.templateUrl, routeParams)],
             function (template) {
                dependencies.template = template;
                dependencies.done(null);
             }));
      }

      if(!handlerConfig.noData || handlerConfig.dataUrl) {
         dependencies.add(require(['text!' + merge(handlerConfig.dataUrl || url, routeParams)], function(data) {
            if('{['.indexOf(String(data).trim().charAt(0)) >= 0) {
               try {
                  data = JSON.parse(data);
               }
               catch (e) {}
            }
            dependencies.done(data);
         }));
      }

      'model view controller'.split(' ').forEach(function(component) {
         if(typeof handlerConfig[component] === 'string') {
            dependencies.add(require([handlerConfig[component]], function(cls) {
               handlerConfig[component] = cls;
               dependencies.done(null);
            }));
         }
      });

      dependencies.start();

      return result;
   };

   return BrowserRoute;

});



/**
 * @exports BrowserRouter
 */
define('BrowserRouter',['./Router', './BrowserRoute', 'subscribable'], function (Router, BrowserRoute, Subscribable) {

   

   /**
    *
    * @constructor
    * @name BrowserRouter
    * @extends Router
    */
   function BrowserRouter() {
      Router.call(this);
   }
   BrowserRouter.prototype = Object.create(BrowserRouter.superclass = Router.prototype);

   Subscribable.prepareInstance(BrowserRouter);

   /**
    * @type {String} Configurable name that a controller should expose as a function to retrieve the current model
    */
   BrowserRouter.prototype['config.model.getter'] = 'getModel';

   /**
    * @type {String} Configurable name that a controller should expose as a function to have a model set on it
    */
   BrowserRouter.prototype['config.model.setter'] = 'setModel';

   /**
    * @type {String} Configurable name that a controller should expose as a function to have a view set on it
    */
   BrowserRouter.prototype['config.view.setter'] = 'setView';

   /**
    * Sets up event listeners for hooking into user interaction
    */
   BrowserRouter.prototype._initialiseEvents = function() {
      jQuery(window).on('popstate', this._handleHistoryNavigation.bind(this));
      jQuery(document).on('click', 'a[href]', this._handleClickNavigation.bind(this));
      this.on('route.before', BrowserRouter._cacheCurrentRoute, BrowserRouter);
      this.on('route.before', BrowserRouter.fire, BrowserRouter);
   };

   /**
    * Sets the currently processing route on the constructor for static access by any listener
    *
    * @param {Route} route
    * @param {String[]} parameters
    */
   BrowserRouter._cacheCurrentRoute = function(route, parameters) {
      BrowserRouter.currentRoute = route;
      BrowserRouter.currentRouteParameters = parameters;
   };

   /**
    * Handles a navigation as a result of a history change
    */
   BrowserRouter.prototype._handleHistoryNavigation = function() {
      this._handleNavigation(location.pathname);
   };

   /**
    * Handles a navigation as a result of a user clicking on a link
    */
   BrowserRouter.prototype._handleClickNavigation = function(e) {
      e.preventDefault();
      history.pushState({}, '', e.currentTarget.getAttribute('href'));
      this._handleNavigation(location.pathname);
   };

   BrowserRouter.prototype._buildRoute = function(regExp, routeHandler) {
      if(typeof routeHandler !== 'function') {
         var browserRouter = this;
         routeHandler.getModel = function(component) {
            return component && component[browserRouter.config('model.getter')] && component[browserRouter.config('model.getter')]();
         };
         routeHandler.setModel = function(component, model) {
            return component && component[browserRouter.config('model.setter')] && component[browserRouter.config('model.setter')](model);
         };
         routeHandler.setView = function(component, view) {
            return component && component[browserRouter.config('view.setter')] && component[browserRouter.config('view.setter')](view);
         };
      }

      return new BrowserRoute(regExp, routeHandler);
   };

   return BrowserRouter;

});
