if (typeof define !== 'function') { var define = require('amdefine')(module); }

/**
 * @exports BrowserRouter
 */
define(['./Router', './BrowserRoute', 'subscribable'], function (Router, BrowserRoute, Subscribable) {

   'use strict';

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
