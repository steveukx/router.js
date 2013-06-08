module.exports = function(grunt) {

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
                 out: "./dist/<%= pkg.version %>/BrowserRouter.js"
               , name: "BrowserRouter"
               , baseUrl: "src/main/Router/"
               , optimize: "none"
            }
         }
      }
   });

   grunt.loadNpmTasks('grunt-contrib-uglify');
   grunt.loadNpmTasks('grunt-contrib-requirejs');

   // Default task(s).
   grunt.registerTask('default', ['requirejs', 'uglify']);

};
