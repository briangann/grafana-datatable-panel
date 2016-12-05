module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  grunt.loadNpmTasks('grunt-execute');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-package-modules');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-multi-dest');
  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-force-task');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks("grunt-ts");

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),
    clean: ["dist"],

    ts: {
      default : {
        options: {
          noEmit: false,
        },
        src: ["src/**/*.ts", "!node_modules/**/*.ts"],
        outDir: "dist",
      }
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        ignores: ['src/bower_components/**', 'src/**/external/**'],
      },
      src: ['Gruntfile.js', 'src/**/*.js'],
    },
    copy: {
      main: {
        cwd: 'src',
        expand: true,
        src: ['**/*', '!**/*.js', '!**/*.ts', '!**/*.scss'],
        dest: 'dist'
      },
      images: {
        cwd: 'src',
        src: ['src/img/**', 'src/images/**'],
        dest: 'dist'
      },
      externals: {
        cwd: 'src',
        expand: true,
        src: ['**/external/**'],
        dest: 'dist'
      },
      bower_libs: {
        cwd: 'bower_components',
        expand: true,
        src: [
          'angular/**',
          'angular-aria/**',
          'angular-animate/**',
          'angular-material/**',
          'angular-messages/**',
          'bootstrap/**',
          'font-awesome/**',
          'jquery/**',
          'datatables.net/**',
          'datatables.net-dt/**',
        ],
        dest: 'dist/libs/'
      },
      pluginDef: {
        expand: true,
        src: ['README.md'],
        dest: 'dist',
      }
    },

    multidest: {
        copy_some_files: {
            tasks: [
                "copy:main",
                "copy:externals",
                "copy:pluginDef"
            ],
            dest: ["dist"]
        },
    },

    packageModules: {
        dist: {
          src: 'package.json',
          dest: 'dist/src'
        },
    },

    concat: {
      dist: {
        src: ['src/node_modules/**/*.js'],
        dest: 'dist/src/<%= pkg.namelower %>-<%= pkg.version %>.js'
      }
    },

    watch: {
      rebuild_all: {
        files: ['src/**/*', 'README.md', '!src/node_modules/**', '!src/bower_components/**'],
        tasks: ['default'],
        options: {spawn: false}
      },
    },

    babel: {
      options: {
        ignore: ['**/bower_components/*','**/external/*'],
        sourceMap: true,
        presets:  ["es2015"],
        plugins: ['transform-es2015-modules-systemjs', "transform-es2015-for-of"],
      },
      dist: {
        files: [{
          cwd: 'src',
          expand: true,
          src: ['**/*.js'],
          dest: 'dist',
          ext:'.js'
        }]
      },
    },

  });


  grunt.registerTask('default', [
          'jshint',
          'multidest',
          'copy:bower_libs',
          'babel']);
  grunt.registerTask('release', ['jshint', 'clean', 'multidest', 'copy:bower_libs', 'packageModules', 'babel']);
};
