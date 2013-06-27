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

   BrowserRoute.prototype._handler = function(request) {
      var routeParams = request.param;
      var result = new Promise;
      var handlerConfig = this._configuration;

      var routeHandlerConfig = Object.create(handlerConfig);
      routeHandlerConfig.url = request.url;

      var onDataReady = function (template, data) {
         handlerConfig.template = template;

         data = data || request;

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

         if(handlerConfig.controller && typeof handlerConfig.controller.handleRequest === 'function') {
            handlerConfig.controller.handleRequest(request, handlerConfig.model || data);
         }

         var model = handlerConfig.model || data;
         var view = (typeof handlerConfig.view == 'function') ? new handlerConfig.view(template.trim()) : null;
         var controller = handlerConfig.controller;

         // wire up the m, v and c with standard getter/setter methods
         if(handlerConfig.getModel(controller) !== model) {
            handlerConfig.setModel(controller, model);
         }
         handlerConfig.setView(controller, view);
         handlerConfig.setModel(view, model);

         var element = view ? typeof view.getElement == 'function' && jQuery(view.getElement()) : jQuery(template.trim());
         if(element) {
            if(routeHandlerConfig.replace) {
               jQuery(routeHandlerConfig.replace).replaceWith(element);
            }
            else {
               element.appendTo(routeHandlerConfig.container || document.body);
            }
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

      'templateUrl dataUrl url container replace'.split(' ').forEach(function(item) {
         if(typeof routeHandlerConfig[item] === 'string') {
            routeHandlerConfig[item] = merge(routeHandlerConfig[item], routeParams);
         }
      });

      if(handlerConfig.templateUrl) {
         dependencies.add(require(['text!' + routeHandlerConfig.templateUrl],
             function (template) {
                dependencies.template = template;
                dependencies.done(null);
             }));
      }

      if(!handlerConfig.noData || handlerConfig.dataUrl) {
         dependencies.add(require(['text!' + (routeHandlerConfig.dataUrl || routeHandlerConfig.url)], function(data) {
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
