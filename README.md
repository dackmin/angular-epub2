# Angular ePub2

Epub2 service for Angular


## Installation

  - Npm : `npm i angular-epub2`
  - Bower : `bower i angular-epub2`


## Usage

  - Add `script` tag :

  ```html
    <script src="angular-epub2/dist/angular-epub2.min.js"></script>
  ```

  - Include module :

  ```coffeescript
    angular
        .module "myApp", [
            ...
            "epub2"
        ]
  ```

  - Include service in controller :

  ```coffeescript
    angular
        .module "myApp"
        .controller "TestCtrl", ($scope, $epub2)
  ```

  - Create a book object with these exact properties (yup, to be enhanced in future versions) :

  ```coffeescript
    book =
        title: "My Wonderful Book"
        author: "Eric Cantona"
        ean: "2345345456346"
        locale: "fr_FR"
        publisher: "Stade Francais"
        description: "This is a description"
        date: new Date()
        cover: [{ <File> }]
        chapters: [
            { name: "Chapter 1", slug: "chapter-1", content: "This is the first chapter" }
            { name: "Chapter 2", slug: "chapter-2", content: "Well, this is the second chapter" }
        ]
  ```

  - Then publish/download it :

  ```coffeescript
    $epub2.publish book, "test.epub"
  ```

## Re-Build

This project is written in CoffeeScript and is compiled & minified using Grunt tasks.

In order to make a pull request, you will need to build your code by doing two easy steps :
  - Install dependencies : `npm i`
  - (Optional) Build project to check temporary compiled files : `grunt build`
  - Release project : `grunt release`


## License

This project is under a GNU GPL v2 license.
See attached `LICENSE` file for more informations.
