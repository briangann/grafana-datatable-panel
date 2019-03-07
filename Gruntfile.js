module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-package-modules');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-multi-dest');
  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks("grunt-ts");
  grunt.loadNpmTasks('grunt-css-selectors');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),
    clean: ["dist"],

    cssmin: {
       dist: {
          options: {
          },
          files: {
             'dist/libs/bootstrap/dist/css/prefixed-bootstrap.min.css': ['dist/libs/bootstrap/dist/css/prefixed-bootstrap.css'],
             'dist/libs/foundation/css/prefixed-foundation.min.css': ['dist/libs/foundation/css/prefixed-foundation.css'],
             'dist/css/prefixed-bootstrap-slate.min.css': ['dist/css/prefixed-bootstrap-slate.css'],
        }
      }
    },
    css_selectors: {
      options: {
        // Task-specific options go here.
        mutations: [
          {prefix: '.datatables-wrapper'}
        ]
      },
      your_target: {
        // Target-specific file lists and/or options go here.
        files: {
        'dist/libs/bootstrap/dist/css/prefixed-bootstrap.css': ['bower_components/bootstrap/dist/css/bootstrap.css'],
        'dist/libs/foundation/css/prefixed-foundation.css': ['bower_components/foundation/css/foundation.css'],
        'dist/css/prefixed-bootstrap-slate.css': ['src/css/bootstrap-slate.css'],
        },
      },
    },
    ts: {
      default : {
        options: {
          noEmit: false
        },
        src: ["src/**/*.ts", "!node_modules/**/*.ts"],
        outDir: "dist",
      }
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        ignores: ['src/bower_components/**', 'src/**/external/**']
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
      runtime_libs: {
        cwd: 'node_modules',
        expand: true,
        src: [
          'bootstrap/**',
          'datatables.net/**',
          'datatables.net-bs/**',
          'datatables.net-dt/**',
          'datatables.net-jqui/**',
          'datatables.net-zf/**',
          'datatables.net-buttons/**',
          'datatables.net-buttons-bs/**',
          'datatables.net-buttons-dt/**',
          'datatables.net-buttons-jqui/**',
          'datatables.net-buttons-zf/**',
          'datatables.net-responsive/**',
          'datatables.net-responsive-bs/**',
          'datatables.net-responsive-dt/**',
          'datatables.net-responsive-jqui/**',
          'datatables.net-responsive-zf/**',
          'datatables.net-select/**',
          'datatables.net-select-bs/**',
          'datatables.net-select-dt/**',
          'datatables.net-select-jqui/**',
          'datatables.net-select-zf/**',
          'fastclick/**',
          'font-awesome/**',
          'foundation/**',
          'jquery/**',
          'jquery-placeholder/**',
          'jquery.cookie/**',
          'jszip/**',
          'modernizr/**',
          'pdfmake/**'
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
        files: ['src/**/*', 'README.md', '!src/node_modules/**'],
        tasks: ['default'],
        options: {spawn: false}
      },
    },

    babel: {
      options: {
        ignore: ['**/external/*'],
        sourceMap: true,
        presets: ['@babel/preset-env']
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
          'copy:runtime_libs',
          'css_selectors',
          'cssmin',
          'babel']);
  grunt.registerTask('release', ['jshint', 'clean', 'multidest', 'copy:bower_libs', 'packageModules', 'babel']);
};
