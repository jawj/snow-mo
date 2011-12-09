(function() {
  /*
  
  A couple of additions to Simon Sarris's Transform object, plus a proxy adding canvas-style save() and restore()
  George MacKerron 2011
  
  */
  var tp;
  var __slice = Array.prototype.slice;
  tp = Transform.prototype;
  tp.t = tp.transformPoint;
  tp.getTransform = function() {
    return this.m;
  };
  tp.setTransform = function() {
    var m;
    m = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    this.m = m;
  };
  tp.dup = function() {
    var dup;
    dup = new Transform();
    dup.m = this.m.slice(0);
    return dup;
  };
  window.TStack = (function() {
    var func, _fn, _i, _len, _ref;
    function TStack() {
      this.ts = [new Transform()];
    }
    TStack.prototype.current = function() {
      return this.ts.slice(-1)[0];
    };
    TStack.prototype.save = function() {
      return this.ts.push(this.current().dup());
    };
    TStack.prototype.restore = function() {
      return this.ts.pop();
    };
    _ref = ['reset', 'rotate', 'scale', 'translate', 'invert', 'getTransform', 'setTransform', 'transformPoint', 't'];
    _fn = function(prot, func) {
      return prot[func] = function(a1, a2) {
        return this.current()[func](a1, a2);
      };
    };
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      func = _ref[_i];
      _fn(TStack.prototype, func);
    }
    return TStack;
  })();
}).call(this);
