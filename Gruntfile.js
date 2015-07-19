'use strict';

module.exports = function(grunt) {
    var npmTasks = [
        'grunt-contrib-uglify',
        'grunt-karma',
        'grunt-ng-annotate'
    ];

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        karma: {
            unit: {
                options: {
                    files: [
                        'node_modules/angular/angular.js',
                        'node_modules/angular-mocks/angular-mocks.js',
                        'node_modules/chai/chai.js',
                        'angular-css.js',
                        'test/spec.js'
                    ]
                },

                frameworks: ['mocha'],

                browsers: [
                    'Chrome',
                    'PhantomJS',
                    'Firefox'
                ],

                singleRun: true
            }
        },
        ngAnnotate: {
            options: {
                singleQuotes: true
            },
            angularCss: {
                files: {
                    'angular-css.js': [
                        'src/prefix.js',
                        'src/$css-provider.js',
                        'src/$cssLinks-filter.js',
                        'src/angularCSS-module.js',
                        'src/angularHack.js',
                        'src/suffix.js'
                    ]
                }
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= pkg.version %> | Copyright (c) <%= grunt.template.today("yyyy") %> DOOR3, Alex Castillo | MIT License */'
            },

            build: {
                src: '<%= pkg.name %>.js',
                dest: '<%= pkg.name %>.min.js'
            }
        }
    });

    npmTasks.forEach(function (task) {
        grunt.loadNpmTasks(task);
    });

    grunt.registerTask('test', ['karma']);

    grunt.registerTask('default', [
        'ngAnnotate',
        'test',
        'uglify'
    ]);
};
