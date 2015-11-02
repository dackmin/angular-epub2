"use strict"

###*
 # Simple (complexe) Angular ePub2 generator.
 # It allows you to create simple epubs from an array of data.
 # @author Ugo Stephant <ugo@oddly.fr>
 # @license GNU GPL V2 / See attached license file for more informations
 #
 # How to use it :
 #
 # 1) Include module into app
 # angular
 #      .module "myApp", [
 #          ...
 #          "epub2"
 #      ]
 #
 # 2) Inject it into your controller :
 # angular
 #      .module "myapp"
 #      .controller "TestCtrl", ($scope, $epub2) ->
 #
 # 3) Then construct your book
 # book =
 #      title: "My Wonderful Book"
 #      author: "Eric Cantona"
 #      ean: "2345345456346"
 #      locale: "fr_FR"
 #      publisher: "Stade Francais"
 #      description: "This is a description"
 #      date: new Date()
 #      cover: [{ File }]
 #      chapters: [
 #          { name: "Chapter 1", slug: "chapter-1", content: "This is the first chapter" }
 #          { name: "Chapter 2", slug: "chapter-2", content: "Well, this is the second chapter" }
 #      ]
 #
 # 4) Then generate & download it !
 # $epub2.publish book, "test.epub"
 #
###

angular
    .module "epub2", []
    .service "$epub2", ($q) ->


        ###*
         # Zip file handler
         # @attribute handler
        ###
        @handler = null


        ###*
         # Add container file
         # References where content file is (yep, useful as fuck)
         # @method add_container_file
        ###
        @add_container_file = ->
            file = """
                <?xml version="1.0" encoding="UTF-8"?>
                <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
                    <rootfiles>
                        <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
                   </rootfiles>
                </container>
            """
            @handler.file "META-INF/container.xml", file


        ###*
         # Adds a mimetype file (still useful as fuck)
         # @method add_mimetype_file
        ###
        @add_mimetype_file = ->
            file = "application/epub+zip"
            @handler.file "mimetype", file


        ###*
         # Adds a map file (table of content)
         # @method add_map_file
         # @param {Object} book - Book infos
        ###
        @add_map_file = (book) ->
            file = """
                <?xml version="1.0" encoding="utf-8"?>
                <ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
                    <head>
                        <meta content="#{book.ean}" name="dtb:uid"/>
                        <meta content="1" name="dtb:depth"/>
                        <meta content="0" name="dtb:totalPageCount"/>
                        <meta content="0" name="dtb:maxPageNumber"/>
                    </head>
                    <docTitle>
                        <text>#{book.title}</text>
                    </docTitle>
                    <docAuthor>
                        <text>#{book.author}</text>
                    </docAuthor>
                    <navMap>
                        #{(@chapter_to_navpoint(key, chapter) for chapter, key in book.chapters).join "\n"}
                    </navMap>
                </ncx>
            """
            @handler.file "OEBPS/toc.ncx", file


        ###*
         # Converts a chapter file to a navpoint for future reference in table
         # of content (see method @add_map_file)
         # @method chapter_to_navpoint
         # @param {int} id - Chapter index in book object
         # @param {Object} chapter - Chapter infos
         # @return {String}
        ###
        @chapter_to_navpoint = (id, chapter) ->
            """
                <navPoint id="navpoint-#{id}" playOrder="#{id}">
                    <navLabel>
                        <text>#{chapter.name}</text>
                    </navLabel>
                    <content src="text/#{chapter.slug}.xhtml##{chapter.slug}"/>
                </navPoint>
            """


        ###*
         # Create content.opf file
         # @method add_content_file
         # @param {Object} book - Book infos
        ###
        @add_content_file = (book) ->
            file = """
                <?xml version="1.0" encoding="UTF-8"?>
                <package xmlns="http://www.idpf.org/2007/opf" version="3.0" xml:lang="#{book.locale}" unique-identifier="ean" prefix="cc: http://creativecommons.org/ns#">
                    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
                        <meta name="fixed-layout" content="false" />
                        <meta name="cover" content="cover.png" />
                        <dc:identifier id="ean">#{book.ean}</dc:identifier>
                        <dc:language>#{book.locale}</dc:language>
                        <dc:title id="title">#{book.title}</dc:title>
                        <dc:creator>#{book.author}</dc:creator>
                        <dc:publisher>#{book.publisher}</dc:publisher>
                        <dc:description>#{book.description}</dc:description>
                        <dc:date>#{book.date}</dc:date>
                        <meta property="dcterms:modified">#{book.date}</meta>
                        <meta property="rendition:layout">pre-paginated</meta>
                        <meta property="rendition:spread">none</meta>
                        <meta property="rendition:orientation">portrait</meta>
                    </metadata>
                    <manifest>
                        #{(@chapter_to_manifest_item(chapter) for chapter in book.chapters).join "\n"}
                        <item href="toc.ncx" id="ncx" media-type="application/x-dtbncx+xml" />
                        <item href="text/toc.xhtml" id="toc" media-type="application/xhtml+xml" properties="nav" />
                        <item href="images/cover.png" id="cover.png" media-type="image/png" />
                    </manifest>
                    <spine toc="ncx" page-progression-direction="ltr">
                        #{(@chapter_to_spine_item(chapter) for chapter in book.chapters).join "\n"}
                    </spine>
                </package>
            """

            @handler.file "OEBPS/content.opf", file


        ###*
         # Parse chapter infos to epub manifest item
         # @method chapter_to_manifest_item
         # @param {Object} chapter - Chapter infos
         # @return {String}
        ###
        @chapter_to_manifest_item = (chapter) ->
            """<item href="text/#{chapter.slug}.xhtml" id="#{chapter.slug}" media-type="application/xhtml+xml" />"""

        ###*
         # Parse chapter infos to epub spine item
         # @method chapter_to_spine_item
         # @param {Object} chapter
         # @return {String}
        ###
        @chapter_to_spine_item = (chapter) ->
            """<itemref idref="#{chapter.slug}" />"""


        ###*
         # Parse chapter infos to summary item
         # @method chapter_to_summary_item
        ###
        @chapter_to_summary_item = (chapter) ->
            """<ol>#{chapter.name}</ol>"""


        ###*
         # Parse chapter infos to HTML5/xml epub file
         # @method chapter_to_file
         # @param {Object} book - Book infos
         # @param {Object} chapter - Chapter infos
         # @return {String}
        ###
        @chapter_to_file = (book, chapter) ->
            file = """
                <?xml version="1.0" encoding="utf-8"?>
                <!DOCTYPE html>
                <html xmlns="http://www.w3.org/1999/xhtml" xml:lang="fr-FR">
                    <head>
                        <meta content="width=device-width, height=device-height" name="viewport" />
                        <title>#{chapter.name} - #{book.title}</title>
                    </head>
                    <body id="#{chapter.slug}">
                        #{chapter.content}
                    </body>
                </html>
            """

            # Fix wrong parsing of HTML entities by epub readers
            $('<textarea />').html(file).text()


        ###*
         # Add all chapters to epub final file
         # @method add_chapters
         # @param {Object} book - Book infos
        ###
        @add_chapters = (book) ->
            for chapter in book.chapters
                @handler.file "OEBPS/text/#{chapter.slug}.xhtml", @chapter_to_file(book, chapter)


        ###*
         # Add summary to epub file
         # @method add_summary
         # @param {Object} book - Book infos
        ###
        @add_summary = (book) ->
            file = """
                <?xml version="1.0" encoding="utf-8"?>
                <!DOCTYPE html>
                <html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="fr-FR">
                    <head>
                        <meta content="width=device-width, height=device-height" name="viewport" />
                        <title>Index</title>
                    </head>
                    <body>
                        <header>
                            <h1>Index</h1>
                        </header>
                        <nav epub:type="toc" id="toc">
                            #{(@chapter_to_summary_item(chapter) for chapter in book.chapters).join "\n"}
                        </nav>
                    </body>
                </html>
            """
            @handler.file "OEBPS/text/toc.xhtml", file


        ###*
         # Read file as base64 string with javascript File API
         # @method read_file
         # @param {String} file - File url
         # @return {Object} - $q promise
        ###
        @read_file = (file) ->
            q = $q.defer()

            reader = new FileReader()
            reader.onload = (e) ->
                data = e.target.result
                q.resolve data
            reader.readAsDataURL file

            q.promise


        ###*
         # Get image data as base64 string
         # @method read_image
         # @param {String} src - Image url
         # @return {Object} - $q promise
        ###
        @read_image = (src) ->
            q = $q.defer()

            image = new Image()
            image.onload = ->
                c = document.createElement "canvas"
                c.width = image.width
                c.height = image.height
                ctx = c.getContext "2d"
                ctx.drawImage image, 0, 0
                q.resolve c.toDataURL("image/png")
            image.src = src

            q.promise


        ###*
         # Final Epub3 generation
         # @method publish
         # @param {Object} book - Book infos
        ###
        @publish = (book, output) ->
            @handler = new JSZip()

            # First, add container & mimetype file
            @add_mimetype_file()
            @add_container_file()

            # Then add table of content
            @add_map_file book

            # Add nav file
            @add_summary book

            # Add manifest
            @add_content_file book

            # Add cover to images
            @read_file book.cover[0]
                .then (data_uri) =>

                    @read_image data_uri
                        .then (data) =>
                            @handler.file "OEBPS/images/cover.png", data.replace("data:image/png;base64,", ""), { base64: true }

                            # Then create files from chapters
                            @add_chapters book

                            # Get zip content as a blob
                            content = @handler.generate
                                type:"blob"

                            # Throw zip as an epub in user's face
                            saveAs content, output

                            # And clean handler
                            @handler = null

        @
