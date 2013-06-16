if (typeof define !== 'function') { var define = require('amdefine')(module); }

/**
 * @exports BrowserRouter
 */
define(['./Router', './BrowserRoute'], function (Router, BrowserRoute) {

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

   /**
    * Sets up event listeners for hooking into user interaction
    */
   BrowserRouter.prototype._initialiseEvents = function() {
      jQuery(window).on('popState', this._handleHistoryNavigation.bind(this));
      jQuery(document).on('click', 'a[href]', this._handleClickNavigation.bind(this));
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
      return new BrowserRoute(regExp, routeHandler);
   };

   return BrowserRouter;

});
