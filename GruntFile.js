module.exports = function(grunt) {

   grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),

//      uglify: {
//         options: {
//            banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
//         },
//         build: {
//            src: 'src/main/<%= pkg.name %>.js',
//            dest: 'src/dist/<%= pkg.name %>.min.js'
//         }
//      },

      requirejs: {
         compile: {
            options: {
               dir: 'src/main/',
               baseUrl: "./",
               keepBuildDir: true,
//               mainConfigFile: "build/require.config.js",
//               optimize: "uglify",
//               out: "dist/<%= pkg.name %>.js",
               packages: [],
               modules: [
                  {
                     name: './Router/BrowserRouter'
                  }
               ]
            }
         }
      }

   });

   grunt.loadNpmTasks('grunt-contrib-uglify');
   grunt.loadNpmTasks('grunt-contrib-concat');
   grunt.loadNpmTasks('grunt-contrib-requirejs');

   // Default task(s).
   grunt.registerTask('default', ['requirejs']);

};
