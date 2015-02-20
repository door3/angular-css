'use strict';

module.exports = function(grunt) {
    var npmTasks = [
        'grunt-contrib-concat',
        'grunt-contrib-uglify',
        'grunt-karma'
    ];

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            dist: {
                src: [
                    'src/prefix.js',
                    'src/$css-provider.js',
                    'src/$cssLinks-filter.js',
                    'src/angularCSS-module.js',
                    'src/angularHack.js',
                    'src/suffix.js'
                ],
                dest: 'angular-css.js'
            }
        },
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
        'concat',
        'test',
        'uglify'
    ]);
};
