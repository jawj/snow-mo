###

A couple of additions to Simon Sarris's Transform object, plus a proxy adding canvas-style save() and restore()
George MacKerron 2011

###
tp = Transform.prototype
tp.t = tp.transformPoint  # shortcut
tp.getTransform = -> @m 
tp.setTransform = (@m...) ->  # nothing more to do
tp.dup = ->
  dup = new Transform()
  dup.m = @m[0..]
  dup
class window.TStack
  constructor: -> @ts = [new Transform()]
  current: -> @ts.slice(-1)[0]
  save: -> @ts.push(@current().dup())
  restore: -> @ts.pop()
  for func in ['reset', 'rotate', 'scale', 'translate', 'invert', 'getTransform', 'setTransform', 'transformPoint', 't']
    # forward the call on
    ((prot, func) -> (prot[func] = (a1, a2) -> @current()[func](a1, a2)))(@::, func)
