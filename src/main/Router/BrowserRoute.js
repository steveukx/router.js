if (typeof define !== 'function') { var define = require('amdefine')(module); }

/**
 * @exports BrowserRoute
 */
define(['./Route', 'promise'], function (Route, Promise) {

   'use strict';

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
      var route = this;

      var onDataReady = function (template, data) {
         handlerConfig.template = template;

         // is the model a constructor
         if(typeof handlerConfig.model == 'function') {
            data = new handlerConfig.model(data);
            if(data.setData) {
               handlerConfig.model = data;
            }
         }

         // is the model a persisted model that can accept new data
         else if(handlerConfig.model && typeof handlerConfig.model.setData == 'function') {
            handlerConfig.model.setData(data);
         }

         // is the controller a constructor
         if(typeof handlerConfig.controller == 'function') {
            handlerConfig.controller = new handlerConfig.controller(handlerConfig.model);
         }

         // is the controller persisted and can accept a replacement model
         if(handlerConfig.controller && typeof handlerConfig.controller.setModel == 'function') {
            handlerConfig.controller.setModel(data);
         }

         var model = handlerConfig.model || data;
         var view = jQuery(template.trim());
         var controller = handlerConfig.controller;

         // wire up the m, v and c with standard getter/setter methods
         if(handlerConfig.getModel() !== model) {
            handlerConfig.setModel(controller, model);
         }
         handlerConfig.setView(controller, view);
         handlerConfig.setModel(view, model);

         view.appendTo(handlerConfig.container || document.body);
      };

      if(handlerConfig.templateUrl) {
         require(['text!' + handlerConfig.templateUrl, 'text!' + url], onDataReady);
      }
      else {
         require(['text!' + url], function(data) {
            onDataReady(handlerConfig.template || '<div />', data);
         });
      }

      return result;
   };

   return BrowserRoute;

});
