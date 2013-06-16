module.exports = function (grunt) {

   'use strict';

   grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),

      uglify: {
         options: {
            banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
         },
         build: {
            src: 'dist/<%= pkg.version %>/BrowserRouter.js',
            dest: 'dist/<%= pkg.version %>/BrowserRouter-min.js'
         }
      },

      requirejs: {
         compile: {
            options: {
               out: './dist/<%= pkg.version %>/BrowserRouter.js',
               name: 'BrowserRouter',
               baseUrl: 'src/main/Router/',
               optimize: 'none',
               paths: {
                  'promise': 'https://raw.github.com/steveukx/Promise/master/src/promise.js',
                  'subscribable': 'https://raw.github.com/steveukx/Subscribable/master/dist/0.0.8/subscribable-min.js'
               }
            }
         }
      }
   });

   grunt.loadNpmTasks('grunt-contrib-uglify');
   grunt.loadNpmTasks('grunt-contrib-requirejs');

   // Default task(s).
   grunt.registerTask('default', ['requirejs', 'uglify']);

};
