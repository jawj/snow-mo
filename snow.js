(function() {
  var __slice = Array.prototype.slice;
  $(function() {
    var Flake, FlakeFrag, animate, camT, camZ, camZRange, camera, doCamPan, doCamZoom, doubleTapDetect, down, dvp, explodeAll, flake, flakeXpode, flakes, halfPi, i, iOS, kvp, last, lastTapTime, maxSpeedMultiplier, moved, oneThirdPi, origCamZRelative, params, paused, projector, randInRange, renderer, scene, setSize, speed, startCamPan, startCamZoom, stats, stopCamPan, sx, sy, togglePause, toggleSpeed, twoPi, updateCamPos, v, verticesFromSVGPaths, windChange, windSpeed, windT, _i, _len, _ref, _ref2;
    if (!(window.WebGLRenderingContext && document.createElement('canvas').getContext('experimental-webgl'))) {
      $('#noWebGL').show();
      return;
    }
    iOS = navigator.appVersion.match(/iPhone|iPad/);
    params = {
      flakes: 125,
      speed: 1,
      linewidth: 1,
      stats: 0,
      credits: 1,
      inv: 0
    };
    _ref = location.search.substring(1).split('&');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      kvp = _ref[_i];
      params[kvp.split('=')[0]] = parseInt(kvp.split('=')[1]);
    }
    if (iOS) {
      $('#creditInner').html('responds to: <b>swipe</b> — <b>pinch</b> — <b>tap</b> (on snowflake) — <b>double tap</b>');
    }
    if (params.credits) {
      $('#creditOuter').show();
    }
    if (params.stats) {
      stats = new Stats();
      stats.domElement.id = 'stats';
      document.body.appendChild(stats.domElement);
    }
    Transform.prototype.t = Transform.prototype.transformPoint;
    twoPi = Math.PI * 2;
    halfPi = Math.PI / 2;
    oneThirdPi = Math.PI / 3;
    v = function(x, y, z) {
      return new THREE.Vertex(new THREE.Vector3(x, y, z));
    };
    randInRange = function() {
      var range;
      range = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (typeof range[0] !== 'number') {
        range = range[0];
      }
      return range[0] + Math.random() * (range[1] - range[0]);
    };
    verticesFromSVGPaths = function(svg, t) {
      var c1, c2, cmd, d, ds, dummy, matches, re, vertices, x, x0, x1, x2, y, y0, y1, y2, _j, _len2;
      if (t == null) {
        t = new Transform();
      }
      ds = [];
      re = /d\s*=\s*("|')([^"']+)("|')/g;
      while ((matches = re.exec(svg)) != null) {
        ds.push(matches[2]);
      }
      vertices = [];
      for (_j = 0, _len2 = ds.length; _j < _len2; _j++) {
        d = ds[_j];
        re = /([M|L])\s+(-?[0-9.]+)\s+(-?[0-9.]+)|Z\s+/g;
        x0 = y0 = x1 = y1 = null;
        while ((matches = re.exec(d)) != null) {
          dummy = matches[0], cmd = matches[1], x = matches[2], y = matches[3];
          if (cmd === 'M') {
            x0 = x1 = x;
            y0 = y1 = y;
          } else {
            if (cmd === 'L') {
              x2 = x;
              y2 = y;
            } else {
              x2 = x0;
              y2 = y0;
            }
            c1 = t.t(x1, y1);
            c2 = t.t(x2, y2);
            vertices.push(v(c1[0], c1[1], 0), v(c2[0], c2[1], 0));
            x1 = x2;
            y1 = y2;
          }
        }
      }
      return vertices;
    };
    FlakeFrag = (function() {
      function FlakeFrag(maxLevel, level) {
        var i, maxKids;
        if (level == null) {
          level = 0;
        }
        this.x = level === 0 ? 0 : Math.random();
        this.y = level === 0 ? 0 : Math.random();
        if (level >= maxLevel) {
          return;
        }
        maxKids = level === 0 ? 1 : 3;
        this.kids = (function() {
          var _ref2, _results;
          _results = [];
          for (i = 0, _ref2 = randInRange(1, maxKids); 0 <= _ref2 ? i <= _ref2 : i >= _ref2; 0 <= _ref2 ? i++ : i--) {
            _results.push(new FlakeFrag(maxLevel, level + 1));
          }
          return _results;
        })();
      }
      FlakeFrag.prototype.vertices = function(scale, explodeness) {
        var i, j, t, vertices, _j, _len2, _ref2;
        if (explodeness == null) {
          explodeness = 0;
        }
        vertices = [];
        t = new Transform();
        t.scale(scale, scale);
        _ref2 = [1, -1];
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          j = _ref2[_j];
          t.scale(1, j);
          for (i = 0; i <= 5; i++) {
            t.rotate(oneThirdPi);
            this._vertices(vertices, t, explodeness);
          }
        }
        return vertices;
      };
      FlakeFrag.prototype._vertices = function(vertices, t, explodeness) {
        var c1, c2, kid, _j, _len2, _ref2;
        if (!this.kids) {
          return;
        }
        t.translate(this.x + explodeness, this.y + explodeness);
        _ref2 = this.kids;
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          kid = _ref2[_j];
          c1 = t.t(0, 0);
          c2 = t.t(kid.x, kid.y);
          vertices.push(v(c1[0], c1[1], 0), v(c2[0], c2[1], 0));
          kid._vertices(vertices, t, explodeness);
        }
        return t.translate(-this.x - explodeness, -this.y - explodeness);
      };
      return FlakeFrag;
    })();
    Flake = (function() {
      var t;
      Flake.prototype.lineMaterial = new THREE.LineBasicMaterial({
        color: (params.inv === 1 ? 0x666666 : 0xffffff),
        linewidth: params.linewidth
      });
      Flake.prototype.xRange = [-150, 150];
      Flake.prototype.yRange = [150, -150];
      Flake.prototype.zRange = [-150, 150];
      Flake.prototype.explodeSpeed = 0.003;
      t = new Transform();
      t.translate(-16, 22);
      t.scale(0.5, -0.5);
      Flake.prototype.logo = verticesFromSVGPaths(window.logoSvg, t);
      function Flake() {
        this.reset();
      }
      Flake.prototype.reset = function(showOrigin) {
        var geom, maxLevel;
        if (showOrigin == null) {
          showOrigin = false;
        }
        if (this.line) {
          scene.remove(this.line);
        }
        this.scale = randInRange(3, 6);
        maxLevel = Math.random() < 0.4 ? 3 : 2;
        if (Math.random() < 0.5 / params.flakes) {
          this.rootFrag = null;
          this.size = 40;
        } else {
          this.rootFrag = new FlakeFrag(maxLevel);
          this.size = 0.67 * this.scale * (maxLevel + 1) * 2;
        }
        this.explodingness = this.explodedness = 0;
        geom = new THREE.Geometry();
        geom.vertices = this.rootFrag ? this.rootFrag.vertices(this.scale) : this.logo;
        if (showOrigin) {
          geom.vertices.push(v(-5, 0, 0), v(5, 0, 0), v(0, -5, 0), v(0, 5, 0));
        }
        this.line = new THREE.Line(geom, this.lineMaterial, THREE.LinePieces);
        this.line.position = new THREE.Vector3(randInRange(this.xRange), this.yRange[0], randInRange(this.zRange));
        this.line.rotation = new THREE.Vector3(randInRange(0, twoPi), randInRange(0, twoPi), randInRange(0, twoPi));
        this.velocity = new THREE.Vector3(randInRange(-0.002, 0.002), randInRange(-0.010, -0.011), randInRange(-0.002, 0.002));
        this.rotality = new THREE.Vector3(randInRange(-0.0003, 0.0003), randInRange(-0.0003, 0.0003), randInRange(-0.0003, 0.0003));
        return scene.add(this.line);
      };
      Flake.prototype.tick = function(dt, wind) {
        var pos, rly, rot, vel;
        pos = this.line.position;
        vel = this.velocity;
        pos.x += vel.x * dt + wind[0];
        pos.y += vel.y * dt;
        pos.z += vel.z * dt + wind[1];
        rot = this.line.rotation;
        rly = this.rotality;
        rot.x += rly.x * dt;
        rot.y += rly.y * dt;
        rot.z += rly.z * dt;
        if (this.rootFrag && this.explodingness !== 0) {
          this.explodedness += this.explodingness * this.explodeSpeed * dt;
          this.line.geometry.vertices = this.rootFrag.vertices(this.scale, this.explodedness);
          this.line.geometry.__dirtyVertices = true;
        }
        if (pos.y < this.yRange[1]) {
          return this.reset();
        }
      };
      Flake.prototype.click = function(ev) {
        if (this.rootFrag) {
          return this.explodingness = ev.shiftKey ? -1 : 1;
        } else {
          if (!iOS) {
            return window.open('http://casa.ucl.ac.uk', 'casa');
          }
        }
      };
      return Flake;
    })();
    dvp = (_ref2 = window.devicePixelRatio) != null ? _ref2 : 1;
    renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    camera = new THREE.PerspectiveCamera(33, 1, 1, 10000);
    setSize = function() {
      renderer.setSize(window.innerWidth * dvp, window.innerHeight * dvp);
      renderer.domElement.style.width = window.innerWidth + 'px';
      renderer.domElement.style.height = window.innerHeight + 'px';
      camera.aspect = window.innerWidth / window.innerHeight;
      return camera.updateProjectionMatrix();
    };
    setSize();
    document.body.appendChild(renderer.domElement);
    renderer.setClearColorHex((params.inv === 1 ? 0xffffff : 0x000022), 1.0);
    renderer.clear();
    scene = new THREE.Scene();
    scene.add(camera);
    scene.fog = new THREE.FogExp2((params.inv === 1 ? 0xffffff : 0x000022), 0.0025);
    projector = new THREE.Projector();
    flakes = flakes = (function() {
      var _ref3, _results;
      _results = [];
      for (i = 0, _ref3 = params.flakes; 0 <= _ref3 ? i < _ref3 : i > _ref3; 0 <= _ref3 ? i++ : i--) {
        flake = new Flake();
        flake.line.position.y = randInRange(flake.yRange);
        _results.push(flake);
      }
      return _results;
    })();
    paused = down = moved = false;
    sx = sy = windSpeed = lastTapTime = 0;
    last = new Date().getTime();
    camZRange = [300, 100];
    camZ = camZRange[0];
    origCamZRelative = null;
    camT = new Transform();
    windT = new Transform();
    windT.rotate(-halfPi);
    speed = params.speed;
    maxSpeedMultiplier = 3;
    updateCamPos = function() {
      var _ref3;
      return _ref3 = camT.t(0, camZ), camera.position.x = _ref3[0], camera.position.z = _ref3[1], _ref3;
    };
    animate = function(t) {
      var dt, flake, wind, _j, _len2;
      dt = (t - last) * speed;
      if (dt > 1000) {
        dt = 30;
      }
      wind = windT.t(0, windSpeed);
      if (!paused) {
        for (_j = 0, _len2 = flakes.length; _j < _len2; _j++) {
          flake = flakes[_j];
          flake.tick(dt, wind);
        }
      }
      renderer.clear();
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
      last = t;
      window.requestAnimationFrame(animate, renderer.domElement);
      if (params.stats) {
        return stats.update();
      }
    };
    updateCamPos();
    animate(new Date().getTime());
    $(window).on('resize', setSize);
    toggleSpeed = function() {
      return speed = speed === params.speed ? params.speed * maxSpeedMultiplier : params.speed;
    };
    togglePause = function() {
      return paused = !paused;
    };
    explodeAll = function(ev) {
      var flake, _j, _len2, _results;
      _results = [];
      for (_j = 0, _len2 = flakes.length; _j < _len2; _j++) {
        flake = flakes[_j];
        _results.push((flake.rootFrag ? flake.click(ev) : void 0));
      }
      return _results;
    };
    $(document).on('keyup', function(ev) {
      var _ref3;
      if ((_ref3 = ev.keyCode) !== 32 && _ref3 !== 80 && _ref3 !== 27) {
        return;
      }
      ev.preventDefault();
      switch (ev.keyCode) {
        case 32:
          return toggleSpeed();
        case 80:
          return togglePause();
        case 27:
          return explodeAll(ev);
      }
    });
    flakeXpode = function(ev) {
      var eventX, eventY, flake, intersects, mesh, meshMaterial, meshes, ray, vector, _j, _len2, _results;
      if (moved > 3) {
        return;
      }
      eventX = ev.clientX || ev.originalEvent.touches[0].clientX;
      eventY = ev.clientY || ev.originalEvent.touches[0].clientY;
      vector = new THREE.Vector3((eventX / window.innerWidth) * 2 - 1, -(eventY / window.innerHeight) * 2 + 1, 0.5);
      projector.unprojectVector(vector, camera);
      ray = new THREE.Ray(camera.position, vector.subSelf(camera.position).normalize());
      meshMaterial = null;
      meshes = (function() {
        var _j, _len2, _results;
        _results = [];
        for (_j = 0, _len2 = flakes.length; _j < _len2; _j++) {
          flake = flakes[_j];
          mesh = new THREE.Mesh(new THREE.PlaneGeometry(flake.size, flake.size), meshMaterial);
          mesh.doubleSided = true;
          mesh.position = flake.line.position;
          mesh.rotation = flake.line.rotation;
          mesh.flake = flake;
          scene.add(mesh);
          _results.push(mesh);
        }
        return _results;
      })();
      scene.updateMatrixWorld();
      intersects = ray.intersectObjects(meshes);
      if (intersects.length) {
        flake = intersects[0].object.flake;
        flake.click(ev);
      }
      _results = [];
      for (_j = 0, _len2 = meshes.length; _j < _len2; _j++) {
        mesh = meshes[_j];
        _results.push(scene.remove(mesh));
      }
      return _results;
    };
    $(renderer.domElement).on('click touchend', flakeXpode);
    doubleTapDetect = function(ev) {
      var now, tapGap;
      now = new Date().getTime();
      tapGap = now - lastTapTime;
      if (tapGap < 200 && ev.originalEvent.touches.length < 2) {
        toggleSpeed();
      }
      return lastTapTime = now;
    };
    $(renderer.domElement).on('touchstart', doubleTapDetect);
    windChange = function(ev) {
      return windSpeed = (ev.clientX / window.innerWidth - 0.5) * 0.125;
    };
    $(renderer.domElement).on('mousemove', windChange);
    startCamPan = function(ev) {
      var _ref3;
      if (((_ref3 = ev.originalEvent.touches) != null ? _ref3.length : void 0) > 1) {
        stopCamPan();
        return;
      }
      down = true;
      moved = 0;
      sx = ev.clientX || ev.originalEvent.touches[0].clientX;
      return sy = ev.clientY || ev.originalEvent.touches[0].clientY;
    };
    $(renderer.domElement).on('mousedown touchstart', startCamPan);
    stopCamPan = function() {
      return down = false;
    };
    $(renderer.domElement).on('mouseup touchend touchcancel', stopCamPan);
    doCamPan = function(ev) {
      var dx, dy, rotation;
      if (down) {
        moved += 1;
        dx = (ev.clientX || ev.originalEvent.touches[0].clientX) - sx;
        dy = (ev.clientY || ev.originalEvent.touches[0].clientY) - sy;
        rotation = dx * -0.003;
        camT.rotate(rotation);
        windT.rotate(rotation);
        updateCamPos();
        sx += dx;
        return sy += dy;
      }
    };
    $(renderer.domElement).on('mousemove touchmove', doCamPan);
    doCamZoom = function(ev, d, dX, dY) {
      var newCamZRelative;
      if (dY != null) {
        camZ -= dY * 5;
      } else {
        newCamZRelative = origCamZRelative + 100 * (ev.originalEvent.scale - 1);
        camZ = 200 + camZRange[1] - newCamZRelative;
      }
      camZ = Math.max(camZ, camZRange[1]);
      camZ = Math.min(camZ, camZRange[0]);
      return updateCamPos();
    };
    $(renderer.domElement).on('mousewheel gesturechange', doCamZoom);
    startCamZoom = function(ev) {
      origCamZRelative = 200 - (camZ - camZRange[1]);
      return moved = 100;
    };
    return $(renderer.domElement).on('gesturestart', startCamZoom);
  });
  window.logoSvg = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" clip-rule="evenodd" stroke-miterlimit="10" viewBox="-0.50 -0.50 64.78 87.72"><desc>SVG generated by Lineform</desc><defs/><path d="M 49.61 69.05 L 49.61 70.70 L 59.95 70.70 L 62.13 72.88 L 62.13 74.38 L 52.27 74.38 L 51.94 74.38 L 51.71 74.62 L 49.03 77.30 L 48.79 77.53 L 48.79 77.89 L 48.79 83.22 L 48.79 83.57 L 49.03 83.81 L 51.71 86.49 L 51.94 86.72 L 52.27 86.72 L 60.30 86.72 L 60.63 86.72 L 60.86 86.49 L 63.54 83.81 L 63.78 83.57 L 63.78 83.22 L 63.78 72.53 L 63.78 72.20 L 63.54 71.94 L 60.86 69.29 L 60.63 69.05 L 60.30 69.05 L 49.61 69.05 Z M 52.62 76.03 L 62.13 76.03 L 62.13 82.86 L 59.95 85.07 L 52.62 85.07 L 50.44 82.86 L 50.44 78.24 L 52.62 76.03 Z M 52.62 76.03 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 11.34 9.92 L 14.17 9.92 L 17.01 12.76 L 17.01 15.59 L 14.17 18.43 L 11.34 18.43 L 8.50 15.59 L 8.50 12.76 Z M 11.34 9.92 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 10.39 19.84 L 13.70 19.84 L 17.01 23.15 L 17.01 26.46 L 13.70 29.76 L 10.39 29.76 L 7.09 26.46 L 7.09 23.15 Z M 10.39 19.84 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 39.69 26.93 L 43.94 26.93 L 48.19 31.18 L 48.19 35.43 L 43.94 39.69 L 39.69 39.69 L 35.43 35.43 L 35.43 31.18 Z M 39.69 26.93 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 50.55 49.61 L 52.91 49.61 L 55.28 51.97 L 55.28 54.33 L 52.91 56.69 L 50.55 56.69 L 48.19 54.33 L 48.19 51.97 Z M 50.55 49.61 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 54.80 5.67 L 57.17 5.67 L 59.53 8.03 L 59.53 10.39 L 57.17 12.76 L 54.80 12.76 L 52.44 10.39 L 52.44 8.03 Z M 54.80 5.67 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 40.16 5.67 L 43.46 5.67 L 46.77 8.98 L 46.77 12.28 L 43.46 15.59 L 40.16 15.59 L 36.85 12.28 L 36.85 8.98 Z M 40.16 5.67 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 50.55 17.01 L 54.33 17.01 L 58.11 20.79 L 58.11 24.57 L 54.33 28.35 L 50.55 28.35 L 46.77 24.57 L 46.77 20.79 Z M 50.55 17.01 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 34.72 31.18 L 31.18 27.40 L 31.18 23.62 L 34.96 19.84 L 38.74 19.84 L 42.52 23.62 L 42.52 26.93 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 57.17 32.60 L 59.06 32.60 L 60.94 34.49 L 60.94 36.38 L 59.06 38.27 L 57.17 38.27 L 55.28 36.38 L 55.28 34.49 Z M 57.17 32.60 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 43.46 45.35 L 44.41 45.35 L 45.35 46.30 L 45.35 47.24 L 44.41 48.19 L 43.46 48.19 L 42.52 47.24 L 42.52 46.30 Z M 43.46 45.35 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 15.59 39.69 L 18.43 39.69 L 21.26 42.52 L 21.26 45.35 L 18.43 48.19 L 15.59 48.19 L 12.76 45.35 L 12.76 42.52 Z M 15.59 39.69 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 28.35 63.78 L 30.71 60.94 L 34.49 60.94 L 36.85 63.78 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 0.00 50.31 L 2.13 52.44 L 2.13 56.69 L 0.00 58.82 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 0.00 59.53 L 4.25 63.78 L 59.53 63.78 L 63.78 59.53 L 63.78 4.25 L 59.53 0.00 L 4.25 0.00 L 0.00 4.25 Z M 0.00 59.53 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 30.24 2.83 L 32.13 2.83 L 34.02 4.72 L 34.02 6.61 L 32.13 8.50 L 30.24 8.50 L 28.35 6.61 L 28.35 4.72 Z M 30.24 2.83 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 17.01 12.76 L 28.35 6.38 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 17.01 15.59 L 31.18 24.09 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 46.77 9.92 L 52.44 9.92 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 38.27 19.84 L 40.39 15.59 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 41.10 21.97 L 41.81 15.59 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 42.52 24.09 L 46.77 22.68 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 53.86 28.35 L 57.40 32.60 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 9.92 29.06 L 0.00 50.31 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 13.46 29.76 L 16.30 39.69 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 31.89 60.94 L 14.88 28.35 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 21.26 43.94 L 42.52 46.77 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 39.69 39.69 L 34.02 60.94 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 44.65 38.98 L 51.02 49.61 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 48.19 54.57 L 36.14 63.07 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 2.13 54.57 L 29.06 63.07 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 19.13 47.48 L 30.47 60.94 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 3.86 69.05 L 3.59 69.29 L 0.94 71.94 L 0.71 72.20 L 0.71 72.53 L 0.71 83.22 L 0.71 83.57 L 0.94 83.81 L 3.59 86.49 L 3.86 86.72 L 4.18 86.72 L 12.22 86.72 L 12.22 85.07 L 4.54 85.07 L 2.36 82.86 L 2.36 72.88 L 4.54 70.70 L 12.22 70.70 L 12.22 69.05 L 4.18 69.05 L 3.86 69.05 Z M 3.86 69.05 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 14.89 69.05 L 14.89 70.70 L 25.23 70.70 L 27.43 72.88 L 27.43 74.38 L 17.57 74.38 L 17.22 74.38 L 16.98 74.62 L 14.30 77.30 L 14.06 77.53 L 14.06 77.89 L 14.06 83.22 L 14.06 83.57 L 14.30 83.81 L 16.98 86.49 L 17.22 86.72 L 17.57 86.72 L 25.58 86.72 L 25.93 86.72 L 26.17 86.49 L 28.85 83.81 L 29.08 83.57 L 29.08 83.22 L 29.08 72.53 L 29.08 72.20 L 28.85 71.94 L 26.17 69.29 L 25.93 69.05 L 25.58 69.05 L 14.89 69.05 Z M 17.92 76.03 L 27.43 76.03 L 27.43 82.86 L 25.23 85.07 L 17.92 85.07 L 15.71 82.86 L 15.71 78.24 L 17.92 76.03 Z M 17.92 76.03 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 34.61 69.05 L 34.34 69.29 L 31.69 71.94 L 31.43 72.20 L 31.43 72.53 L 31.43 75.21 L 31.43 75.56 L 31.69 75.80 L 34.34 78.48 L 34.61 78.71 L 34.93 78.71 L 42.59 78.71 L 44.80 80.89 L 44.80 82.86 L 42.59 85.07 L 32.25 85.07 L 32.25 86.72 L 42.94 86.72 L 43.30 86.72 L 43.53 86.49 L 46.21 83.81 L 46.45 83.57 L 46.45 83.22 L 46.45 80.57 L 46.45 80.21 L 46.21 79.98 L 43.53 77.30 L 43.30 77.06 L 42.94 77.06 L 35.29 77.06 L 33.11 74.88 L 33.11 72.85 L 35.29 70.70 L 45.62 70.70 L 45.62 69.05 L 34.93 69.05 L 34.61 69.05 Z M 34.61 69.05 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 34.72 31.18 L 35.43 31.18 " stroke="#000000" stroke-width="0.25" fill="none"/></svg>';
}).call(this);
