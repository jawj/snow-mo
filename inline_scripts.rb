#!/usr/bin/env ruby
require 'hpricot'
html = open('source.html') { |f| f.read }
h = Hpricot(html)
(h/'script').each { |s| s.swap "<script>\n#{open(s.get_attribute('src')) { |f| f.read }}\n</script>" }
open('index.html', 'w') { |f| f.write(h) }
