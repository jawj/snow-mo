#!/usr/bin/env ruby
# bring all local scripts inline, minifying where necessary

html = open('source.html') { |f| f.read }
html.gsub!(%r{<script src="[^/"]+"></script>}) do |tag|
  js = tag.match(/(?<=").+(?=")/)[0]
  src = if js.match(/\.min\./)
    open(js) { |f| f.read }
  else
    `java -jar ~/bin/closure-compiler.jar --compilation_level SIMPLE_OPTIMIZATIONS --js '#{js}'`
  end
  "<script> // #{js}\n#{src.strip}\n</script>" 
end
open('index.html', 'w') { |f| f.write(html) }
