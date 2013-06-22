if (typeof define !== 'function') { var define = require('amdefine')(module); }

/**
 * @exports BrowserRoute
 */
define(['./Route', 'promise'], function (Route, Promise) {

   'use strict';

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

         var model = handlerConfig.model || data;
         var view = jQuery(template.trim());
         var controller = handlerConfig.controller;

         if(typeof handlerConfig.view == 'function') {
            view = new handlerConfig.view(view);
         }

         // wire up the m, v and c with standard getter/setter methods
         if(handlerConfig.getModel(controller) !== model) {
            handlerConfig.setModel(controller, model);
         }
         handlerConfig.setView(controller, view);
         handlerConfig.setModel(view, model);

         view.appendTo(handlerConfig.container || document.body);
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

      if(typeof handlerConfig.controller === 'string') {
         dependencies.add(require([handlerConfig.controller], function(controller) {
            handlerConfig.controller = controller;
            dependencies.done(null);
         }));
      }

      if(typeof handlerConfig.view === 'string') {
         dependencies.add(require([handlerConfig.view], function(view) {
            handlerConfig.view = view;
            dependencies.done(null);
         }));
      }

      dependencies.start();

      return result;
   };

   return BrowserRoute;

});
