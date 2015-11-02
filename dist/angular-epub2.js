(function() {
  "use strict";

  /**
    * Simple (complexe) Angular ePub2 generator.
    * It allows you to create simple epubs from an array of data.
    * @author Ugo Stephant <ugo@oddly.fr>
    * @license GNU GPL V2 / See attached license file for more informations
    *
    * How to use it :
    *
    * 1) Include module into app
    * angular
    *      .module "myApp", [
    *          ...
    *          "epub2"
    *      ]
    *
    * 2) Inject it into your controller :
    * angular
    *      .module "myapp"
    *      .controller "TestCtrl", ($scope, $epub2) ->
    *
    * 3) Then construct your book
    * book =
    *      title: "My Wonderful Book"
    *      author: "Eric Cantona"
    *      ean: "2345345456346"
    *      locale: "fr_FR"
    *      publisher: "Stade Francais"
    *      description: "This is a description"
    *      date: new Date()
    *      cover: [{ File }]
    *      chapters: [
    *          { name: "Chapter 1", slug: "chapter-1", content: "This is the first chapter" }
    *          { name: "Chapter 2", slug: "chapter-2", content: "Well, this is the second chapter" }
    *      ]
    *
    * 4) Then generate & download it !
    * $epub2.publish book, "test.epub"
    *
   */
  angular.module("epub2", []).service("$epub2", function($q) {

    /**
      * Zip file handler
      * @attribute handler
     */
    this.handler = null;

    /**
      * Add container file
      * References where content file is (yep, useful as fuck)
      * @method add_container_file
     */
    this.add_container_file = function() {
      var file;
      file = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<container version=\"1.0\" xmlns=\"urn:oasis:names:tc:opendocument:xmlns:container\">\n    <rootfiles>\n        <rootfile full-path=\"OEBPS/content.opf\" media-type=\"application/oebps-package+xml\"/>\n   </rootfiles>\n</container>";
      return this.handler.file("META-INF/container.xml", file);
    };

    /**
      * Adds a mimetype file (still useful as fuck)
      * @method add_mimetype_file
     */
    this.add_mimetype_file = function() {
      var file;
      file = "application/epub+zip";
      return this.handler.file("mimetype", file);
    };

    /**
      * Adds a map file (table of content)
      * @method add_map_file
      * @param {Object} book - Book infos
     */
    this.add_map_file = function(book) {
      var chapter, file, key;
      file = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<ncx xmlns=\"http://www.daisy.org/z3986/2005/ncx/\" version=\"2005-1\">\n    <head>\n        <meta content=\"" + book.ean + "\" name=\"dtb:uid\"/>\n        <meta content=\"1\" name=\"dtb:depth\"/>\n        <meta content=\"0\" name=\"dtb:totalPageCount\"/>\n        <meta content=\"0\" name=\"dtb:maxPageNumber\"/>\n    </head>\n    <docTitle>\n        <text>" + book.title + "</text>\n    </docTitle>\n    <docAuthor>\n        <text>" + book.author + "</text>\n    </docAuthor>\n    <navMap>\n        " + (((function() {
        var i, len, ref, results;
        ref = book.chapters;
        results = [];
        for (key = i = 0, len = ref.length; i < len; key = ++i) {
          chapter = ref[key];
          results.push(this.chapter_to_navpoint(key, chapter));
        }
        return results;
      }).call(this)).join("\n")) + "\n    </navMap>\n</ncx>";
      return this.handler.file("OEBPS/toc.ncx", file);
    };

    /**
      * Converts a chapter file to a navpoint for future reference in table
      * of content (see method @add_map_file)
      * @method chapter_to_navpoint
      * @param {int} id - Chapter index in book object
      * @param {Object} chapter - Chapter infos
      * @return {String}
     */
    this.chapter_to_navpoint = function(id, chapter) {
      return "<navPoint id=\"navpoint-" + id + "\" playOrder=\"" + id + "\">\n    <navLabel>\n        <text>" + chapter.name + "</text>\n    </navLabel>\n    <content src=\"text/" + chapter.slug + ".xhtml#" + chapter.slug + "\"/>\n</navPoint>";
    };

    /**
      * Create content.opf file
      * @method add_content_file
      * @param {Object} book - Book infos
     */
    this.add_content_file = function(book) {
      var chapter, file;
      file = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<package xmlns=\"http://www.idpf.org/2007/opf\" version=\"3.0\" xml:lang=\"" + book.locale + "\" unique-identifier=\"ean\" prefix=\"cc: http://creativecommons.org/ns#\">\n    <metadata xmlns:dc=\"http://purl.org/dc/elements/1.1/\" xmlns:opf=\"http://www.idpf.org/2007/opf\">\n        <meta name=\"fixed-layout\" content=\"false\" />\n        <meta name=\"cover\" content=\"cover.png\" />\n        <dc:identifier id=\"ean\">" + book.ean + "</dc:identifier>\n        <dc:language>" + book.locale + "</dc:language>\n        <dc:title id=\"title\">" + book.title + "</dc:title>\n        <dc:creator>" + book.author + "</dc:creator>\n        <dc:publisher>" + book.publisher + "</dc:publisher>\n        <dc:description>" + book.description + "</dc:description>\n        <dc:date>" + book.date + "</dc:date>\n        <meta property=\"dcterms:modified\">" + book.date + "</meta>\n        <meta property=\"rendition:layout\">pre-paginated</meta>\n        <meta property=\"rendition:spread\">none</meta>\n        <meta property=\"rendition:orientation\">portrait</meta>\n    </metadata>\n    <manifest>\n        " + (((function() {
        var i, len, ref, results;
        ref = book.chapters;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          chapter = ref[i];
          results.push(this.chapter_to_manifest_item(chapter));
        }
        return results;
      }).call(this)).join("\n")) + "\n        <item href=\"toc.ncx\" id=\"ncx\" media-type=\"application/x-dtbncx+xml\" />\n        <item href=\"text/toc.xhtml\" id=\"toc\" media-type=\"application/xhtml+xml\" properties=\"nav\" />\n        <item href=\"images/cover.png\" id=\"cover.png\" media-type=\"image/png\" />\n    </manifest>\n    <spine toc=\"ncx\" page-progression-direction=\"ltr\">\n        " + (((function() {
        var i, len, ref, results;
        ref = book.chapters;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          chapter = ref[i];
          results.push(this.chapter_to_spine_item(chapter));
        }
        return results;
      }).call(this)).join("\n")) + "\n    </spine>\n</package>";
      return this.handler.file("OEBPS/content.opf", file);
    };

    /**
      * Parse chapter infos to epub manifest item
      * @method chapter_to_manifest_item
      * @param {Object} chapter - Chapter infos
      * @return {String}
     */
    this.chapter_to_manifest_item = function(chapter) {
      return "<item href=\"text/" + chapter.slug + ".xhtml\" id=\"" + chapter.slug + "\" media-type=\"application/xhtml+xml\" />";
    };

    /**
      * Parse chapter infos to epub spine item
      * @method chapter_to_spine_item
      * @param {Object} chapter
      * @return {String}
     */
    this.chapter_to_spine_item = function(chapter) {
      return "<itemref idref=\"" + chapter.slug + "\" />";
    };

    /**
      * Parse chapter infos to summary item
      * @method chapter_to_summary_item
     */
    this.chapter_to_summary_item = function(chapter) {
      return "<ol>" + chapter.name + "</ol>";
    };

    /**
      * Parse chapter infos to HTML5/xml epub file
      * @method chapter_to_file
      * @param {Object} book - Book infos
      * @param {Object} chapter - Chapter infos
      * @return {String}
     */
    this.chapter_to_file = function(book, chapter) {
      var file;
      file = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<!DOCTYPE html>\n<html xmlns=\"http://www.w3.org/1999/xhtml\" xml:lang=\"fr-FR\">\n    <head>\n        <meta content=\"width=device-width, height=device-height\" name=\"viewport\" />\n        <title>" + chapter.name + " - " + book.title + "</title>\n    </head>\n    <body id=\"" + chapter.slug + "\">\n        " + chapter.content + "\n    </body>\n</html>";
      return $('<textarea />').html(file).text();
    };

    /**
      * Add all chapters to epub final file
      * @method add_chapters
      * @param {Object} book - Book infos
     */
    this.add_chapters = function(book) {
      var chapter, i, len, ref, results;
      ref = book.chapters;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        chapter = ref[i];
        results.push(this.handler.file("OEBPS/text/" + chapter.slug + ".xhtml", this.chapter_to_file(book, chapter)));
      }
      return results;
    };

    /**
      * Add summary to epub file
      * @method add_summary
      * @param {Object} book - Book infos
     */
    this.add_summary = function(book) {
      var chapter, file;
      file = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<!DOCTYPE html>\n<html xmlns=\"http://www.w3.org/1999/xhtml\" xmlns:epub=\"http://www.idpf.org/2007/ops\" xml:lang=\"fr-FR\">\n    <head>\n        <meta content=\"width=device-width, height=device-height\" name=\"viewport\" />\n        <title>Index</title>\n    </head>\n    <body>\n        <header>\n            <h1>Index</h1>\n        </header>\n        <nav epub:type=\"toc\" id=\"toc\">\n            " + (((function() {
        var i, len, ref, results;
        ref = book.chapters;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          chapter = ref[i];
          results.push(this.chapter_to_summary_item(chapter));
        }
        return results;
      }).call(this)).join("\n")) + "\n        </nav>\n    </body>\n</html>";
      return this.handler.file("OEBPS/text/toc.xhtml", file);
    };

    /**
      * Read file as base64 string with javascript File API
      * @method read_file
      * @param {String} file - File url
      * @return {Object} - $q promise
     */
    this.read_file = function(file) {
      var q, reader;
      q = $q.defer();
      reader = new FileReader();
      reader.onload = function(e) {
        var data;
        data = e.target.result;
        return q.resolve(data);
      };
      reader.readAsDataURL(file);
      return q.promise;
    };

    /**
      * Get image data as base64 string
      * @method read_image
      * @param {String} src - Image url
      * @return {Object} - $q promise
     */
    this.read_image = function(src) {
      var image, q;
      q = $q.defer();
      image = new Image();
      image.onload = function() {
        var c, ctx;
        c = document.createElement("canvas");
        c.width = image.width;
        c.height = image.height;
        ctx = c.getContext("2d");
        ctx.drawImage(image, 0, 0);
        return q.resolve(c.toDataURL("image/png"));
      };
      image.src = src;
      return q.promise;
    };

    /**
      * Final Epub3 generation
      * @method publish
      * @param {Object} book - Book infos
     */
    this.publish = function(book, output) {
      this.handler = new JSZip();
      this.add_mimetype_file();
      this.add_container_file();
      this.add_map_file(book);
      this.add_summary(book);
      this.add_content_file(book);
      return this.read_file(book.cover[0]).then((function(_this) {
        return function(data_uri) {
          return _this.read_image(data_uri).then(function(data) {
            var content;
            _this.handler.file("OEBPS/images/cover.png", data.replace("data:image/png;base64,", ""), {
              base64: true
            });
            _this.add_chapters(book);
            content = _this.handler.generate({
              type: "blob"
            });
            saveAs(content, output);
            return _this.handler = null;
          });
        };
      })(this));
    };
    return this;
  });

}).call(this);
