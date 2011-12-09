#!/usr/bin/env ruby
html = open('source.html') { |f| f.read }
html.gsub!(%r{<script src="[^/"]+"></script>}) { |tag| "<script>\n#{open(tag.match(/(?<=").+(?=")/)[0]) { |f| f.read }}\n</script>" }
open('index.html', 'w') { |f| f.write(html) }
