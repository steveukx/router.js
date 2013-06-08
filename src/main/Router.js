var requirejs = require('requirejs');

requirejs.config({ nodeRequire: require });

requirejs(['Router/Router', 'Router/Route'],
    function (Router) {
       module.exports.Router = Router;
       module.exports.Route = Route;
    });
