module.exports = (grunt) ->

    grunt.initConfig
        pkg: grunt.file.readJSON('package.json')
        coffee:
            build:
                options:
                    join: true
                files:
                    'build/<%= pkg.name %>.js' : ['src/**/*.coffee']
            release:
                options:
                    join: true
                files:
                    'dist/<%= pkg.name %>.js' : ['src/**/*.coffee']

        uglify:
            options:
                mangle: false
                banner: '/*! <%= pkg.name %> v<%= pkg.version %> <%= grunt.template.today("dd/mm/yyyy") %> */\n'
            dist:
                src: 'dist/<%= pkg.name %>.js'
                dest: 'dist/<%= pkg.name %>.min.js'


    grunt.loadNpmTasks 'grunt-contrib-coffee'
    grunt.loadNpmTasks 'grunt-contrib-uglify'


    grunt.registerTask 'build', [
        'coffee:build'
    ]

    grunt.registerTask 'release', [
        'coffee:release'
        'uglify'
    ]
