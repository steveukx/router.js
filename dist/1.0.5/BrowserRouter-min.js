/*! url-router 2013-06-22 */
define("NamedGroupRegex",[],function(){function a(a){var b=this._groups=[];this._regex=new RegExp(a.replace(/:([a-zA-Z0-9]+)/g,function(a,c){return b.push(c),"([^/]+)"}))}return a.prototype.test=function(a){return this._regex.test(a)},a.prototype.exec=function(a){var b=this._regex.exec(a);if(b){b=b.slice(0);for(var c=0,d=this._groups.length;d>c;c++)b[this._groups[c]]=b[c+1]}return b},a}),define("Route",["promise"],function(a){function b(a,b){this._regex=a,"function"==typeof b?this._handler=b:this._configuration=b}return b.prototype._handler=null,b.prototype._configuration=null,b.prototype._handler=function(){throw new Error("Route._handler: Unable to handle route without being supplied a function.")},b.prototype.handleUrl=function(b,c){var d,e=new a;try{d=this._handler.length<3?this._handler(c,b):this._handler(c,b,function(a,b){a?e.reject(a):e.resolve(b)})}catch(f){return e.reject(f)}return d&&"function"==typeof d.then?d:e.resolve(d)},b.prototype.test=function(a){return this._regex.test(a)},b.prototype.getRouteParameters=function(a){return this._regex.exec(a)},b}),define("Router",["./NamedGroupRegex","./Route","subscribable"],function(a,b,c){function d(){this._routes=[],this._initialiseEvents()}return d.prototype=Object.create(c.prototype),d.prototype["config.strip.trailing.slash"]=!1,d.prototype["config.model.getter"]="getModel",d.prototype["config.model.setter"]="setModel",d.prototype["config.view.setter"]="setView",d.prototype.config=function(a,b){return void 0===b?this["config."+a]:(this["config."+a]=b,this)},d.prototype._initialiseEvents=function(){},d.prototype._handleNavigation=function(a){var b=this._cleanUrl(a),c=this._getRoutesForUrl(b);c.length||this.fire("router.bad.path",b),this._processRoutes(c,a)},d.prototype._cleanUrl=function(a){return this.config("strip.trailing.slash")&&(a=a.replace(/\/$/,"")),a},d.prototype._processRoutes=function(a,b){var c=[].slice.call(arguments,2),d=this.fire.bind(this),e=function(f){if(f)d("route.error",f);else if(a.length){var g=a.shift(),h=g.getRouteParameters(b);d("route.before",g,h),g.handleUrl.apply(g,[b,h].concat(c)).then(function(a){e(null,d("route.passed",g,a))},e)}else d("router.path.finished",b)};d("router.path.starting",b),e()},d.prototype._getRoutesForUrl=function(a){return this._routes.filter(function(b){return b.test(a)})},d.prototype.route=function(c,d){if("string"==typeof c)this.config("strip.trailing.slash")&&(c=c.replace(/\/$/,"")),c=this._buildRoute(new a(c),d);else if(c instanceof RegExp)c=this._buildRoute(c,d);else if(!(c instanceof b))throw new TypeError("Must create a route with a string, regular expression or a Route instance");return this._routes.push(c),this},d.prototype._buildRoute=function(a,c){return new b(a,c)},d}),define("BrowserRoute",["./Route","promise"],function(a,b){function c(){a.apply(this,arguments)}var d=function(a,b){return String(a).replace(/\{([^\}]+)\}/g,function(a,c){return b&&b[c]})};return c.prototype=Object.create(c.superclass=a.prototype),c.prototype._handler=function(a,c){var e=new b,f=this._configuration,g=function(b,c){f.template=b,c=c||a,"function"==typeof f.model?(c=new f.model(c),c.setData&&(f.model=c)):f.model&&"function"==typeof f.model.setData&&f.model.setData(c),"function"==typeof f.controller&&(f.controller=new f.controller(f.model));var d=f.model||c,e=jQuery(b.trim()),g=f.controller;"function"==typeof f.view&&(e=new f.view(e)),f.getModel(g)!==d&&f.setModel(g,d),f.setView(g,e),f.setModel(e,d),e.appendTo(f.container||document.body)},h={done:function(a){this._data=this._data||a,--this._pending<=0&&g(this.template||"<div />",this._data)},start:function(){this._pending||this.done(null)},add:function(){this._pending++},template:f.template,_data:null,_pending:0};return f.templateUrl&&h.add(require(["text!"+d(f.templateUrl,a)],function(a){h.template=a,h.done(null)})),(!f.noData||f.dataUrl)&&h.add(require(["text!"+d(f.dataUrl||c,a)],function(a){if("{[".indexOf(String(a).trim().charAt(0))>=0)try{a=JSON.parse(a)}catch(b){}h.done(a)})),"string"==typeof f.controller&&h.add(require([f.controller],function(a){f.controller=a,h.done(null)})),"string"==typeof f.view&&h.add(require([f.view],function(a){f.view=a,h.done(null)})),h.start(),e},c}),define("BrowserRouter",["./Router","./BrowserRoute","subscribable"],function(a,b,c){function d(){a.call(this)}return d.prototype=Object.create(d.superclass=a.prototype),c.prepareInstance(d),d.prototype["config.model.getter"]="getModel",d.prototype["config.model.setter"]="setModel",d.prototype["config.view.setter"]="setView",d.prototype._initialiseEvents=function(){jQuery(window).on("popstate",this._handleHistoryNavigation.bind(this)),jQuery(document).on("click","a[href]",this._handleClickNavigation.bind(this)),this.on("route.before",d._cacheCurrentRoute,d),this.on("route.before",d.fire,d)},d._cacheCurrentRoute=function(a,b){d.currentRoute=a,d.currentRouteParameters=b},d.prototype._handleHistoryNavigation=function(){this._handleNavigation(location.pathname)},d.prototype._handleClickNavigation=function(a){a.preventDefault(),history.pushState({},"",a.currentTarget.getAttribute("href")),this._handleNavigation(location.pathname)},d.prototype._buildRoute=function(a,c){if("function"!=typeof c){var d=this;c.getModel=function(a){return a&&a[d.config("model.getter")]&&a[d.config("model.getter")]()},c.setModel=function(a,b){return a&&a[d.config("model.setter")]&&a[d.config("model.setter")](b)},c.setView=function(a,b){return a&&a[d.config("view.setter")]&&a[d.config("view.setter")](b)}}return new b(a,c)},d});