(function() {
  var __slice = Array.prototype.slice;
  $(function() {
    var Flake, FlakeFrag, animate, camT, camZ, camZRange, camera, doCamPan, doCamZoom, doubleTapDetect, down, dvp, explodeAll, flake, flakeXpode, flakes, globe, globeGeom, halfPi, i, iOS, kvp, last, lastTapTime, lineMaterial, maxSpeedMultiplier, moved, oneThirdPi, origCamZoom, params, paused, piOver180, projector, randInRange, renderer, scene, setSize, speed, startCamPan, startCamZoom, stats, stopCamPan, sx, sy, togglePause, toggleSpeed, twoPi, updateCamPos, v, verticesFromSVGPaths, windChange, windSpeed, windT, _i, _len, _ref, _ref2;
    if (!(window.WebGLRenderingContext && document.createElement('canvas').getContext('experimental-webgl'))) {
      $('#noWebGL').show();
      return;
    }
    iOS = navigator.appVersion.match(/iPhone|iPad/);
    if (iOS) {
      setTimeout((function() {
        return window.location.reload();
      }), 60 * 60 * 1000);
    }
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
    lineMaterial = new THREE.LineBasicMaterial({
      color: (params.inv === 1 ? 0x666666 : 0xffffff),
      linewidth: params.linewidth
    });
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
    piOver180 = Math.PI / 180;
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
    window.verticesFromGeoJSON = function(geoJSON, r) {
      var coords, cosLat, cosLon, item, lat, lon, newV, oldV, sinLat, sinLon, vertices, x, y, z, _j, _k, _len2, _len3, _ref2;
      if (r == null) {
        r = 40;
      }
      vertices = [];
      for (_j = 0, _len2 = geoJSON.length; _j < _len2; _j++) {
        item = geoJSON[_j];
        oldV = null;
        _ref2 = item.coordinates[0];
        for (_k = 0, _len3 = _ref2.length; _k < _len3; _k++) {
          coords = _ref2[_k];
          lon = coords[0] * piOver180;
          lat = coords[1] * piOver180;
          sinLat = Math.sin(lat);
          cosLat = Math.cos(lat);
          sinLon = Math.sin(lon);
          cosLon = Math.cos(lon);
          x = r * cosLat * sinLon;
          y = r * sinLat * sinLon;
          z = r * cosLon;
          newV = v(x, y, z);
          if (oldV) {
            vertices.push(oldV, newV);
          }
          oldV = newV;
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
        this.line = new THREE.Line(geom, lineMaterial, THREE.LinePieces);
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
    globeGeom = new THREE.Geometry();
    globeGeom.vertices = verticesFromGeoJSON(window.globeGeoJSON);
    globe = new THREE.Line(globeGeom, lineMaterial, THREE.LinePieces);
    scene.add(globe);
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
    camZRange = [300, 50];
    camZ = camZRange[0];
    origCamZoom = null;
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
      if (tapGap < 250 && ev.originalEvent.touches.length < 2) {
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
      if (ev.originalEvent.touches && ev.originalEvent.touches.length !== 1) {
        stopCamPan();
        return;
      }
      down = true;
      moved = 0;
      sx = ev.clientX || ev.originalEvent.touches[0].clientX;
      return sy = ev.clientY || ev.originalEvent.touches[0].clientY;
    };
    $(renderer.domElement).on('mousedown touchstart touchend touchcancel', startCamPan);
    stopCamPan = function() {
      return down = false;
    };
    $(renderer.domElement).on('mouseup', stopCamPan);
    doCamPan = function(ev) {
      var dx, dy, rotation;
      if (down) {
        moved += 1;
        dx = (ev.clientX || ev.originalEvent.touches[0].clientX) - sx;
        dy = (ev.clientY || ev.originalEvent.touches[0].clientY) - sy;
        rotation = dx * -0.0005 * Math.log(camZ);
        camT.rotate(rotation);
        windT.rotate(rotation);
        updateCamPos();
        sx += dx;
        return sy += dy;
      }
    };
    $(renderer.domElement).on('mousemove touchmove', doCamPan);
    doCamZoom = function(ev, d, dX, dY) {
      var newCamZoom;
      if (dY != null) {
        camZ -= dY * 5;
      } else {
        newCamZoom = origCamZoom + Math.log(ev.originalEvent.scale);
        camZ = (1 - newCamZoom) * (camZRange[0] - camZRange[1]) + camZRange[1];
      }
      camZ = Math.max(camZ, camZRange[1]);
      camZ = Math.min(camZ, camZRange[0]);
      return updateCamPos();
    };
    $(renderer.domElement).on('mousewheel gesturechange', doCamZoom);
    startCamZoom = function(ev) {
      origCamZoom = 1 - (camZ - camZRange[1]) / (camZRange[0] - camZRange[1]);
      return moved = 100;
    };
    return $(renderer.domElement).on('gesturestart', startCamZoom);
  });
  window.logoSvg = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" clip-rule="evenodd" stroke-miterlimit="10" viewBox="-0.50 -0.50 64.78 87.72"><desc>SVG generated by Lineform</desc><defs/><path d="M 49.61 69.05 L 49.61 70.70 L 59.95 70.70 L 62.13 72.88 L 62.13 74.38 L 52.27 74.38 L 51.94 74.38 L 51.71 74.62 L 49.03 77.30 L 48.79 77.53 L 48.79 77.89 L 48.79 83.22 L 48.79 83.57 L 49.03 83.81 L 51.71 86.49 L 51.94 86.72 L 52.27 86.72 L 60.30 86.72 L 60.63 86.72 L 60.86 86.49 L 63.54 83.81 L 63.78 83.57 L 63.78 83.22 L 63.78 72.53 L 63.78 72.20 L 63.54 71.94 L 60.86 69.29 L 60.63 69.05 L 60.30 69.05 L 49.61 69.05 Z M 52.62 76.03 L 62.13 76.03 L 62.13 82.86 L 59.95 85.07 L 52.62 85.07 L 50.44 82.86 L 50.44 78.24 L 52.62 76.03 Z M 52.62 76.03 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 11.34 9.92 L 14.17 9.92 L 17.01 12.76 L 17.01 15.59 L 14.17 18.43 L 11.34 18.43 L 8.50 15.59 L 8.50 12.76 Z M 11.34 9.92 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 10.39 19.84 L 13.70 19.84 L 17.01 23.15 L 17.01 26.46 L 13.70 29.76 L 10.39 29.76 L 7.09 26.46 L 7.09 23.15 Z M 10.39 19.84 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 39.69 26.93 L 43.94 26.93 L 48.19 31.18 L 48.19 35.43 L 43.94 39.69 L 39.69 39.69 L 35.43 35.43 L 35.43 31.18 Z M 39.69 26.93 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 50.55 49.61 L 52.91 49.61 L 55.28 51.97 L 55.28 54.33 L 52.91 56.69 L 50.55 56.69 L 48.19 54.33 L 48.19 51.97 Z M 50.55 49.61 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 54.80 5.67 L 57.17 5.67 L 59.53 8.03 L 59.53 10.39 L 57.17 12.76 L 54.80 12.76 L 52.44 10.39 L 52.44 8.03 Z M 54.80 5.67 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 40.16 5.67 L 43.46 5.67 L 46.77 8.98 L 46.77 12.28 L 43.46 15.59 L 40.16 15.59 L 36.85 12.28 L 36.85 8.98 Z M 40.16 5.67 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 50.55 17.01 L 54.33 17.01 L 58.11 20.79 L 58.11 24.57 L 54.33 28.35 L 50.55 28.35 L 46.77 24.57 L 46.77 20.79 Z M 50.55 17.01 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 34.72 31.18 L 31.18 27.40 L 31.18 23.62 L 34.96 19.84 L 38.74 19.84 L 42.52 23.62 L 42.52 26.93 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 57.17 32.60 L 59.06 32.60 L 60.94 34.49 L 60.94 36.38 L 59.06 38.27 L 57.17 38.27 L 55.28 36.38 L 55.28 34.49 Z M 57.17 32.60 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 43.46 45.35 L 44.41 45.35 L 45.35 46.30 L 45.35 47.24 L 44.41 48.19 L 43.46 48.19 L 42.52 47.24 L 42.52 46.30 Z M 43.46 45.35 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 15.59 39.69 L 18.43 39.69 L 21.26 42.52 L 21.26 45.35 L 18.43 48.19 L 15.59 48.19 L 12.76 45.35 L 12.76 42.52 Z M 15.59 39.69 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 28.35 63.78 L 30.71 60.94 L 34.49 60.94 L 36.85 63.78 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 0.00 50.31 L 2.13 52.44 L 2.13 56.69 L 0.00 58.82 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 0.00 59.53 L 4.25 63.78 L 59.53 63.78 L 63.78 59.53 L 63.78 4.25 L 59.53 0.00 L 4.25 0.00 L 0.00 4.25 Z M 0.00 59.53 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 30.24 2.83 L 32.13 2.83 L 34.02 4.72 L 34.02 6.61 L 32.13 8.50 L 30.24 8.50 L 28.35 6.61 L 28.35 4.72 Z M 30.24 2.83 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 17.01 12.76 L 28.35 6.38 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 17.01 15.59 L 31.18 24.09 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 46.77 9.92 L 52.44 9.92 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 38.27 19.84 L 40.39 15.59 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 41.10 21.97 L 41.81 15.59 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 42.52 24.09 L 46.77 22.68 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 53.86 28.35 L 57.40 32.60 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 9.92 29.06 L 0.00 50.31 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 13.46 29.76 L 16.30 39.69 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 31.89 60.94 L 14.88 28.35 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 21.26 43.94 L 42.52 46.77 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 39.69 39.69 L 34.02 60.94 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 44.65 38.98 L 51.02 49.61 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 48.19 54.57 L 36.14 63.07 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 2.13 54.57 L 29.06 63.07 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 19.13 47.48 L 30.47 60.94 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 3.86 69.05 L 3.59 69.29 L 0.94 71.94 L 0.71 72.20 L 0.71 72.53 L 0.71 83.22 L 0.71 83.57 L 0.94 83.81 L 3.59 86.49 L 3.86 86.72 L 4.18 86.72 L 12.22 86.72 L 12.22 85.07 L 4.54 85.07 L 2.36 82.86 L 2.36 72.88 L 4.54 70.70 L 12.22 70.70 L 12.22 69.05 L 4.18 69.05 L 3.86 69.05 Z M 3.86 69.05 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 14.89 69.05 L 14.89 70.70 L 25.23 70.70 L 27.43 72.88 L 27.43 74.38 L 17.57 74.38 L 17.22 74.38 L 16.98 74.62 L 14.30 77.30 L 14.06 77.53 L 14.06 77.89 L 14.06 83.22 L 14.06 83.57 L 14.30 83.81 L 16.98 86.49 L 17.22 86.72 L 17.57 86.72 L 25.58 86.72 L 25.93 86.72 L 26.17 86.49 L 28.85 83.81 L 29.08 83.57 L 29.08 83.22 L 29.08 72.53 L 29.08 72.20 L 28.85 71.94 L 26.17 69.29 L 25.93 69.05 L 25.58 69.05 L 14.89 69.05 Z M 17.92 76.03 L 27.43 76.03 L 27.43 82.86 L 25.23 85.07 L 17.92 85.07 L 15.71 82.86 L 15.71 78.24 L 17.92 76.03 Z M 17.92 76.03 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 34.61 69.05 L 34.34 69.29 L 31.69 71.94 L 31.43 72.20 L 31.43 72.53 L 31.43 75.21 L 31.43 75.56 L 31.69 75.80 L 34.34 78.48 L 34.61 78.71 L 34.93 78.71 L 42.59 78.71 L 44.80 80.89 L 44.80 82.86 L 42.59 85.07 L 32.25 85.07 L 32.25 86.72 L 42.94 86.72 L 43.30 86.72 L 43.53 86.49 L 46.21 83.81 L 46.45 83.57 L 46.45 83.22 L 46.45 80.57 L 46.45 80.21 L 46.21 79.98 L 43.53 77.30 L 43.30 77.06 L 42.94 77.06 L 35.29 77.06 L 33.11 74.88 L 33.11 72.85 L 35.29 70.70 L 45.62 70.70 L 45.62 69.05 L 34.93 69.05 L 34.61 69.05 Z M 34.61 69.05 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 34.72 31.18 L 35.43 31.18 " stroke="#000000" stroke-width="0.25" fill="none"/></svg>';
  window.globeGeoJSON = [
    {
      "type": "MultiLineString",
      "coordinates": [[[-163.712, -78.595], [-163.105, -78.223], [-161.245, -78.380], [-160.246, -78.693], [-159.482, -79.046], [-159.208, -79.497], [-161.127, -79.634], [-162.439, -79.281], [-163.027, -78.928], [-163.066, -78.869], [-163.712, -78.595]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-6.197, 53.867], [-6.032, 53.153], [-6.788, 52.260], [-8.561, 51.669], [-9.977, 51.820], [-9.166, 52.864], [-9.688, 53.881], [-8.327, 54.664], [-7.572, 55.131], [-6.733, 55.172], [-5.661, 54.554], [-6.197, 53.867]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[141.000, -2.600], [142.735, -3.289], [144.583, -3.861], [145.273, -4.373], [145.829, -4.876], [145.981, -5.465], [147.648, -6.083], [147.891, -6.614], [146.970, -6.721], [147.191, -7.388], [148.084, -8.044], [148.734, -9.104], [149.306, -9.071], [149.266, -9.514], [150.038, -9.684], [149.738, -9.872], [150.801, -10.293], [150.690, -10.582], [150.028, -10.652], [149.782, -10.393], [148.923, -10.280], [147.913, -10.130], [147.135, -9.492], [146.567, -8.942], [146.048, -8.067], [144.744, -7.630], [143.897, -7.915], [143.286, -8.245], [143.413, -8.983], [142.628, -9.326], [142.068, -9.159], [141.033, -9.117], [140.143, -8.297], [139.127, -8.096], [138.881, -8.380], [137.614, -8.411], [138.039, -7.597], [138.668, -7.320], [138.407, -6.232], [137.927, -5.393], [135.989, -4.546], [135.164, -4.462], [133.662, -3.538], [133.367, -4.024], [132.983, -4.112], [132.756, -3.746], [132.753, -3.311], [131.989, -2.820], [133.066, -2.460], [133.780, -2.479], [133.696, -2.214], [132.232, -2.212], [131.836, -1.617], [130.942, -1.432], [130.519, -0.937], [131.867, -0.695], [132.380, -0.369], [133.985, -0.780], [134.143, -1.151], [134.422, -2.769], [135.457, -3.367], [136.293, -2.307], [137.440, -1.703], [138.329, -1.702], [139.184, -2.051], [139.926, -2.408], [141.000, -2.600]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[114.204, 4.525], [114.599, 4.900], [115.450, 5.447], [116.220, 6.143], [116.725, 6.924], [117.129, 6.928], [117.643, 6.422], [117.689, 5.987], [118.347, 5.708], [119.181, 5.407], [119.110, 5.016], [118.439, 4.966], [118.618, 4.478], [117.882, 4.137], [117.313, 3.234], [118.048, 2.287], [117.875, 1.827], [118.996, 0.902], [117.811, 0.784], [117.478, 0.102], [117.521, -0.803], [116.560, -1.487], [116.533, -2.483], [116.148, -4.012], [116.000, -3.657], [114.864, -4.106], [114.468, -3.495], [113.755, -3.439], [113.256, -3.118], [112.068, -3.478], [111.703, -2.994], [111.048, -3.049], [110.223, -2.934], [110.070, -1.592], [109.571, -1.314], [109.091, -0.459], [108.952, 0.415], [109.069, 1.341], [109.663, 2.006], [110.396, 1.663], [111.168, 1.850], [111.370, 2.697], [111.796, 2.885], [112.995, 3.102], [113.712, 3.893], [114.204, 4.525]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-93.612, 74.979], [-94.156, 74.592], [-95.608, 74.666], [-96.820, 74.927], [-96.288, 75.377], [-94.850, 75.647], [-93.977, 75.296], [-93.612, 74.979]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-93.840, 77.519], [-94.295, 77.491], [-96.169, 77.555], [-96.436, 77.834], [-94.422, 77.820], [-93.720, 77.634], [-93.840, 77.519]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-96.754, 78.765], [-95.559, 78.418], [-95.830, 78.056], [-97.309, 77.850], [-98.124, 78.082], [-98.552, 78.458], [-98.631, 78.871], [-97.337, 78.831], [-96.754, 78.765]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-88.150, 74.392], [-89.764, 74.515], [-92.422, 74.837], [-92.768, 75.386], [-92.889, 75.882], [-93.893, 76.319], [-95.962, 76.441], [-97.121, 76.751], [-96.745, 77.161], [-94.684, 77.097], [-93.573, 76.776], [-91.605, 76.778], [-90.741, 76.449], [-90.969, 76.074], [-89.822, 75.847], [-89.187, 75.610], [-87.838, 75.566], [-86.379, 75.482], [-84.789, 75.699], [-82.753, 75.784], [-81.128, 75.713], [-80.057, 75.336], [-79.833, 74.923], [-80.457, 74.657], [-81.948, 74.442], [-83.228, 74.564], [-86.097, 74.410], [-88.150, 74.392]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-111.264, 78.152], [-109.854, 77.996], [-110.186, 77.697], [-112.051, 77.409], [-113.534, 77.732], [-112.724, 78.051], [-111.264, 78.152]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-110.963, 78.804], [-109.663, 78.601], [-110.881, 78.406], [-112.542, 78.407], [-112.525, 78.550], [-111.500, 78.849], [-110.963, 78.804]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-66.282, 18.514], [-65.771, 18.426], [-65.591, 18.228], [-65.847, 17.975], [-66.599, 17.981], [-67.184, 17.946], [-67.242, 18.374], [-67.100, 18.520], [-66.282, 18.514]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-77.569, 18.490], [-76.896, 18.400], [-76.365, 18.160], [-76.199, 17.886], [-76.902, 17.868], [-77.206, 17.701], [-77.766, 17.861], [-78.337, 18.225], [-78.217, 18.454], [-77.797, 18.524], [-77.569, 18.490]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-82.268, 23.188], [-81.404, 23.117], [-80.618, 23.106], [-79.679, 22.765], [-79.281, 22.399], [-78.347, 22.512], [-77.993, 22.277], [-77.146, 21.657], [-76.523, 21.206], [-76.194, 21.220], [-75.598, 21.016], [-75.671, 20.735], [-74.933, 20.693], [-74.178, 20.284], [-74.296, 20.050], [-74.961, 19.923], [-75.634, 19.873], [-76.323, 19.952], [-77.755, 19.855], [-77.085, 20.413], [-77.492, 20.673], [-78.137, 20.739], [-78.482, 21.028], [-78.719, 21.598], [-79.284, 21.559], [-80.217, 21.827], [-80.517, 22.037], [-81.820, 22.192], [-82.169, 22.387], [-81.795, 22.636], [-82.775, 22.688], [-83.494, 22.168], [-83.908, 22.154], [-84.052, 21.910], [-84.547, 21.801], [-84.974, 21.896], [-84.447, 22.204], [-84.230, 22.565], [-83.778, 22.788], [-83.267, 22.983], [-82.510, 23.078], [-82.268, 23.188]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-55.600, 51.317], [-56.134, 50.687], [-56.795, 49.812], [-56.143, 50.150], [-55.471, 49.935], [-55.822, 49.587], [-54.935, 49.313], [-54.473, 49.556], [-53.476, 49.249], [-53.786, 48.516], [-53.086, 48.687], [-52.958, 48.157], [-52.648, 47.535], [-53.069, 46.655], [-53.521, 46.618], [-54.178, 46.807], [-53.961, 47.625], [-54.240, 47.752], [-55.400, 46.884], [-55.997, 46.919], [-55.291, 47.389], [-56.250, 47.632], [-57.325, 47.572], [-59.266, 47.603], [-59.419, 47.899], [-58.796, 48.251], [-59.231, 48.523], [-58.391, 49.125], [-57.358, 50.718], [-56.738, 51.287], [-55.870, 51.632], [-55.406, 51.588], [-55.600, 51.317]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-83.882, 65.109], [-82.787, 64.766], [-81.642, 64.455], [-81.553, 63.979], [-80.817, 64.057], [-80.103, 63.725], [-80.991, 63.411], [-82.547, 63.651], [-83.108, 64.101], [-84.100, 63.569], [-85.523, 63.052], [-85.866, 63.637], [-87.221, 63.541], [-86.352, 64.035], [-86.224, 64.822], [-85.883, 65.738], [-85.161, 65.657], [-84.975, 65.217], [-84.464, 65.371], [-83.882, 65.109]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-78.770, 72.352], [-77.824, 72.749], [-75.605, 72.243], [-74.228, 71.767], [-74.099, 71.330], [-72.242, 71.556], [-71.200, 70.920], [-68.786, 70.525], [-67.914, 70.121], [-66.969, 69.186], [-68.805, 68.720], [-66.449, 68.067], [-64.862, 67.847], [-63.424, 66.928], [-61.851, 66.862], [-62.163, 66.160], [-63.918, 64.998], [-65.148, 65.426], [-66.721, 66.388], [-68.015, 66.262], [-68.141, 65.689], [-67.089, 65.108], [-65.732, 64.648], [-65.320, 64.382], [-64.669, 63.392], [-65.013, 62.674], [-66.275, 62.945], [-68.783, 63.745], [-67.369, 62.883], [-66.328, 62.280], [-66.165, 61.930], [-68.877, 62.330], [-71.023, 62.910], [-72.235, 63.397], [-71.886, 63.679], [-73.378, 64.193], [-74.834, 64.679], [-74.818, 64.389], [-77.709, 64.229], [-78.555, 64.572], [-77.897, 65.309], [-76.018, 65.326], [-73.959, 65.454], [-74.293, 65.811], [-73.944, 66.310], [-72.651, 67.284], [-72.926, 67.726], [-73.311, 68.069], [-74.843, 68.554], [-76.869, 68.894], [-76.228, 69.147], [-77.287, 69.769], [-78.168, 69.826], [-78.957, 70.166], [-79.492, 69.871], [-81.305, 69.743], [-84.944, 69.966], [-87.060, 70.260], [-88.681, 70.410], [-89.513, 70.762], [-88.467, 71.218], [-89.888, 71.222], [-90.205, 72.235], [-89.436, 73.129], [-88.408, 73.537], [-85.826, 73.803], [-86.562, 73.157], [-85.774, 72.534], [-84.850, 73.340], [-82.315, 73.750], [-80.600, 72.716], [-80.748, 72.061], [-78.770, 72.352]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-94.503, 74.134], [-92.420, 74.100], [-90.509, 73.856], [-92.003, 72.966], [-93.196, 72.771], [-94.269, 72.024], [-95.409, 72.061], [-96.033, 72.940], [-96.018, 73.437], [-95.495, 73.862], [-94.503, 74.134]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-100.438, 72.705], [-101.540, 73.359], [-100.356, 73.843], [-99.163, 73.633], [-97.379, 73.760], [-97.120, 73.469], [-98.053, 72.990], [-96.540, 72.560], [-96.720, 71.659], [-98.359, 71.272], [-99.322, 71.356], [-100.014, 71.738], [-102.480, 72.482], [-102.480, 72.830], [-100.438, 72.705]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-107.819, 75.845], [-106.928, 76.012], [-105.880, 75.969], [-105.704, 75.479], [-106.313, 75.005], [-109.699, 74.850], [-112.223, 74.416], [-113.743, 74.394], [-113.871, 74.720], [-111.794, 75.162], [-116.312, 75.043], [-117.710, 75.222], [-116.346, 76.199], [-115.404, 76.478], [-112.590, 76.141], [-110.814, 75.549], [-109.067, 75.473], [-110.497, 76.429], [-109.581, 76.794], [-108.548, 76.678], [-108.211, 76.201], [-107.819, 75.845]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-122.854, 76.116], [-121.157, 76.864], [-119.103, 77.512], [-117.570, 77.498], [-116.198, 77.645], [-116.335, 76.876], [-117.106, 76.530], [-118.040, 76.481], [-119.899, 76.053], [-121.499, 75.900], [-122.854, 76.116]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-121.537, 74.448], [-120.109, 74.241], [-117.555, 74.185], [-116.584, 73.896], [-115.510, 73.475], [-116.767, 73.222], [-119.220, 72.520], [-120.459, 71.820], [-120.459, 71.383], [-123.092, 70.901], [-123.620, 71.340], [-125.928, 71.868], [-125.5, 72.292], [-124.807, 73.022], [-123.940, 73.680], [-124.917, 74.292], [-121.537, 74.448]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-166.467, 60.384], [-165.674, 60.293], [-165.579, 59.909], [-166.192, 59.754], [-166.848, 59.941], [-167.455, 60.213], [-166.467, 60.384]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-153.228, 57.969], [-152.564, 57.901], [-152.141, 57.591], [-153.006, 57.115], [-154.005, 56.734], [-154.516, 56.992], [-154.670, 57.461], [-153.762, 57.816], [-153.228, 57.969]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-132.710, 54.040], [-131.749, 54.120], [-132.049, 52.984], [-131.179, 52.180], [-131.577, 52.182], [-132.180, 52.639], [-132.549, 53.100], [-133.054, 53.411], [-133.239, 53.851], [-133.180, 54.169], [-132.710, 54.040]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-125.415, 49.950], [-124.920, 49.475], [-123.922, 49.062], [-123.510, 48.510], [-124.012, 48.370], [-125.655, 48.825], [-125.954, 49.179], [-126.850, 49.530], [-127.029, 49.814], [-128.059, 49.994], [-128.444, 50.539], [-128.358, 50.770], [-127.308, 50.552], [-126.695, 50.400], [-125.755, 50.295], [-125.415, 49.950]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-171.731, 63.782], [-171.114, 63.592], [-170.491, 63.694], [-169.682, 63.431], [-168.689, 63.297], [-168.771, 63.188], [-169.529, 62.976], [-170.290, 63.194], [-170.671, 63.375], [-171.553, 63.317], [-171.791, 63.405], [-171.731, 63.782]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-105.492, 79.301], [-103.529, 79.165], [-100.825, 78.800], [-100.060, 78.324], [-99.670, 77.907], [-101.303, 78.018], [-102.949, 78.343], [-105.176, 78.380], [-104.210, 78.677], [-105.419, 78.918], [-105.492, 79.301]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[32.946, 35.386], [33.667, 35.373], [34.576, 35.671], [33.900, 35.245], [34.004, 34.978], [32.979, 34.571], [32.490, 34.701], [32.256, 35.103], [32.802, 35.145], [32.946, 35.386]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[26.290, 35.299], [26.164, 35.004], [24.724, 34.919], [24.735, 35.084], [23.514, 35.279], [23.699, 35.705], [24.246, 35.368], [25.025, 35.424], [25.769, 35.354], [25.745, 35.179], [26.290, 35.299]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[49.543, -12.469], [49.808, -12.895], [50.056, -13.555], [50.217, -14.758], [50.476, -15.226], [50.377, -15.706], [50.200, -16.000], [49.860, -15.414], [49.672, -15.710], [49.863, -16.451], [49.774, -16.875], [49.498, -17.106], [49.435, -17.953], [49.041, -19.118], [48.548, -20.496], [47.930, -22.391], [47.547, -23.781], [47.095, -24.941], [46.282, -25.178], [45.409, -25.601], [44.833, -25.346], [44.039, -24.988], [43.763, -24.460], [43.697, -23.574], [43.345, -22.776], [43.254, -22.057], [43.433, -21.336], [43.893, -21.163], [43.896, -20.830], [44.374, -20.072], [44.464, -19.435], [44.232, -18.961], [44.042, -18.331], [43.963, -17.409], [44.312, -16.850], [44.446, -16.216], [44.944, -16.179], [45.502, -15.974], [45.872, -15.793], [46.312, -15.780], [46.882, -15.210], [47.705, -14.594], [48.005, -14.091], [47.868, -13.663], [48.293, -13.784], [48.845, -13.089], [48.863, -12.487], [49.194, -12.040], [49.543, -12.469]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[167.216, -15.891], [167.844, -16.466], [167.515, -16.597], [167.180, -16.159], [167.216, -15.891]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[166.793, -15.668], [166.649, -15.392], [166.629, -14.626], [167.107, -14.933], [167.270, -15.740], [167.001, -15.614], [166.793, -15.668]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[134.210, -6.895], [134.112, -6.142], [134.290, -5.783], [134.499, -5.445], [134.727, -5.737], [134.724, -6.214], [134.210, -6.895]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-48.660, -78.047], [-48.151, -78.047], [-46.662, -77.831], [-45.154, -78.047], [-43.920, -78.478], [-43.489, -79.085], [-43.372, -79.516], [-43.333, -80.026], [-44.880, -80.339], [-46.506, -80.594], [-48.386, -80.829], [-50.482, -81.025], [-52.851, -80.966], [-54.164, -80.633], [-53.987, -80.222], [-51.853, -79.947], [-50.991, -79.614], [-50.364, -79.183], [-49.914, -78.811], [-49.306, -78.458], [-48.660, -78.047]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-66.290, -80.255], [-64.037, -80.294], [-61.883, -80.392], [-61.138, -79.981], [-60.610, -79.628], [-59.572, -80.040], [-59.865, -80.549], [-60.159, -81.000], [-62.255, -80.863], [-64.488, -80.921], [-65.741, -80.588], [-65.741, -80.549], [-66.290, -80.255]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-73.915, -71.269], [-73.230, -71.151], [-72.074, -71.190], [-71.780, -70.681], [-71.722, -70.309], [-71.741, -69.505], [-71.173, -69.035], [-70.253, -68.878], [-69.724, -69.251], [-69.489, -69.623], [-69.058, -70.074], [-68.725, -70.505], [-68.451, -70.955], [-68.333, -71.406], [-68.510, -71.798], [-68.784, -72.170], [-69.959, -72.307], [-71.075, -72.503], [-72.388, -72.484], [-71.898, -72.092], [-73.073, -72.229], [-74.190, -72.366], [-74.953, -72.072], [-75.012, -71.661], [-73.915, -71.269]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-102.330, -71.894], [-101.703, -71.717], [-100.430, -71.854], [-98.981, -71.933], [-97.884, -72.070], [-96.787, -71.952], [-96.200, -72.521], [-96.983, -72.442], [-98.198, -72.482], [-99.432, -72.442], [-100.783, -72.501], [-101.801, -72.305], [-102.330, -71.894]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-122.621, -73.657], [-122.406, -73.324], [-121.211, -73.500], [-119.918, -73.657], [-118.724, -73.481], [-119.292, -73.834], [-120.232, -74.088], [-121.622, -74.010], [-122.621, -73.657]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-127.283, -73.461], [-126.558, -73.246], [-125.559, -73.481], [-124.031, -73.873], [-124.619, -73.834], [-125.912, -73.736], [-127.283, -73.461]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[165.779, -21.080], [166.599, -21.700], [167.120, -22.159], [166.740, -22.399], [166.189, -22.129], [165.474, -21.679], [164.829, -21.149], [164.167, -20.444], [164.029, -20.105], [164.459, -20.120], [165.020, -20.459], [165.460, -20.800], [165.779, -21.080]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[152.640, -3.659], [153.019, -3.980], [153.140, -4.499], [152.827, -4.766], [152.638, -4.176], [152.406, -3.789], [151.953, -3.462], [151.384, -3.035], [150.662, -2.741], [150.939, -2.500], [151.479, -2.779], [151.820, -2.999], [152.239, -3.240], [152.640, -3.659]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[151.301, -5.840], [150.754, -6.083], [150.241, -6.317], [149.709, -6.316], [148.890, -6.026], [148.318, -5.747], [148.401, -5.437], [149.298, -5.583], [149.845, -5.505], [149.996, -5.026], [150.139, -5.001], [150.236, -5.532], [150.807, -5.455], [151.089, -5.113], [151.647, -4.757], [151.537, -4.167], [152.136, -4.148], [152.338, -4.312], [152.318, -4.867], [151.982, -5.478], [151.459, -5.560], [151.301, -5.840]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[162.119, -10.482], [162.398, -10.826], [161.700, -10.820], [161.319, -10.204], [161.917, -10.446], [162.119, -10.482]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[161.679, -9.599], [161.529, -9.784], [160.788, -8.917], [160.579, -8.320], [160.920, -8.320], [161.280, -9.120], [161.679, -9.599]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[160.852, -9.872], [160.462, -9.895], [159.849, -9.794], [159.640, -9.639], [159.702, -9.242], [160.362, -9.400], [160.688, -9.610], [160.852, -9.872]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[159.640, -8.020], [159.875, -8.337], [159.917, -8.538], [159.133, -8.114], [158.586, -7.754], [158.211, -7.421], [158.359, -7.320], [158.820, -7.560], [159.640, -8.020]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[157.140, -7.021], [157.538, -7.347], [157.339, -7.404], [156.902, -7.176], [156.491, -6.765], [156.542, -6.599], [157.140, -7.021]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[154.759, -5.339], [155.062, -5.566], [155.547, -6.200], [156.019, -6.540], [155.880, -6.819], [155.599, -6.919], [155.166, -6.535], [154.729, -5.900], [154.514, -5.139], [154.652, -5.042], [154.759, -5.339]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[176.885, -40.065], [176.508, -40.604], [176.012, -41.289], [175.239, -41.688], [175.067, -41.425], [174.650, -41.281], [175.227, -40.459], [174.900, -39.908], [173.824, -39.508], [173.852, -39.146], [174.574, -38.797], [174.743, -38.027], [174.696, -37.381], [174.292, -36.711], [174.319, -36.534], [173.840, -36.121], [173.054, -35.237], [172.636, -34.529], [173.007, -34.450], [173.551, -35.006], [174.329, -35.265], [174.612, -36.156], [175.336, -37.209], [175.357, -36.526], [175.808, -36.798], [175.958, -37.555], [176.763, -37.881], [177.438, -37.961], [178.010, -37.579], [178.517, -37.695], [178.274, -38.582], [177.970, -39.166], [177.206, -39.145], [176.939, -39.449], [177.032, -39.879], [176.885, -40.065]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[169.667, -43.555], [170.524, -43.031], [171.125, -42.512], [171.569, -41.767], [171.948, -41.514], [172.097, -40.956], [172.798, -40.493], [173.020, -40.919], [173.247, -41.331], [173.958, -40.926], [174.247, -41.349], [174.248, -41.770], [173.876, -42.233], [173.222, -42.970], [172.711, -43.372], [173.080, -43.853], [172.308, -43.865], [171.452, -44.242], [171.185, -44.897], [170.616, -45.908], [169.831, -46.355], [169.332, -46.641], [168.411, -46.619], [167.763, -46.290], [166.676, -46.219], [166.509, -45.852], [167.046, -45.110], [168.303, -44.123], [168.949, -43.935], [169.667, -43.555]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[147.689, -40.808], [148.289, -40.875], [148.359, -42.062], [148.017, -42.407], [147.914, -43.211], [147.564, -42.937], [146.870, -43.634], [146.663, -43.580], [146.048, -43.549], [145.431, -42.693], [145.295, -42.033], [144.718, -41.162], [144.743, -40.703], [145.397, -40.792], [146.364, -41.137], [146.908, -41.000], [147.689, -40.808]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[126.148, -32.215], [125.088, -32.728], [124.221, -32.959], [124.028, -33.483], [123.659, -33.890], [122.811, -33.914], [122.183, -34.003], [121.299, -33.821], [120.580, -33.930], [119.893, -33.976], [119.298, -34.509], [119.007, -34.464], [118.505, -34.746], [118.024, -35.064], [117.295, -35.025], [116.625, -35.025], [115.564, -34.386], [115.026, -34.196], [115.048, -33.623], [115.545, -33.487], [115.714, -33.259], [115.679, -32.900], [115.801, -32.205], [115.689, -31.612], [115.160, -30.601], [114.997, -30.030], [115.040, -29.461], [114.641, -28.810], [114.616, -28.516], [114.173, -28.118], [114.048, -27.334], [113.477, -26.543], [113.338, -26.116], [113.778, -26.549], [113.440, -25.621], [113.936, -25.911], [114.232, -26.298], [114.216, -25.786], [113.721, -24.998], [113.625, -24.683], [113.393, -24.384], [113.502, -23.806], [113.706, -23.560], [113.843, -23.059], [113.736, -22.475], [114.149, -21.755], [114.225, -22.517], [114.647, -21.829], [115.460, -21.495], [115.947, -21.068], [116.711, -20.701], [117.166, -20.623], [117.441, -20.746], [118.229, -20.374], [118.836, -20.263], [118.987, -20.044], [119.252, -19.952], [119.805, -19.976], [120.856, -19.683], [121.399, -19.239], [121.655, -18.705], [122.241, -18.197], [122.286, -17.798], [122.312, -17.254], [123.012, -16.405], [123.433, -17.268], [123.859, -17.069], [123.503, -16.596], [123.817, -16.111], [124.258, -16.327], [124.379, -15.567], [124.926, -15.075], [125.167, -14.680], [125.670, -14.510], [125.685, -14.230], [126.125, -14.347], [126.142, -14.095], [126.582, -13.952], [127.065, -13.817], [127.804, -14.276], [128.359, -14.869], [128.985, -14.875], [129.621, -14.969], [129.409, -14.420], [129.888, -13.618], [130.339, -13.357], [130.183, -13.107], [130.617, -12.536], [131.223, -12.183], [131.735, -12.302], [132.575, -12.114], [132.557, -11.603], [131.824, -11.273], [132.357, -11.128], [133.019, -11.376], [133.550, -11.786], [134.393, -12.042], [134.678, -11.941], [135.298, -12.248], [135.882, -11.962], [136.258, -12.049], [136.492, -11.857], [136.951, -12.351], [136.685, -12.887], [136.305, -13.291], [135.961, -13.324], [136.077, -13.724], [135.783, -14.223], [135.428, -14.715], [135.500, -14.997], [136.295, -15.550], [137.065, -15.870], [137.580, -16.215], [138.303, -16.807], [138.585, -16.806], [139.108, -17.062], [139.260, -17.371], [140.215, -17.710], [140.875, -17.369], [141.071, -16.832], [141.274, -16.388], [141.398, -15.840], [141.702, -15.044], [141.563, -14.561], [141.635, -14.270], [141.519, -13.698], [141.650, -12.944], [141.842, -12.741], [141.686, -12.407], [141.928, -11.877], [142.118, -11.328], [142.143, -11.042], [142.515, -10.668], [142.797, -11.157], [142.866, -11.784], [143.115, -11.905], [143.158, -12.325], [143.522, -12.834], [143.597, -13.400], [143.561, -13.763], [143.922, -14.548], [144.563, -14.171], [144.894, -14.594], [145.374, -14.984], [145.271, -15.428], [145.485, -16.285], [145.636, -16.784], [145.888, -16.906], [146.160, -17.761], [146.063, -18.280], [146.387, -18.958], [147.471, -19.480], [148.177, -19.955], [148.848, -20.391], [148.717, -20.633], [149.289, -21.260], [149.678, -22.342], [150.077, -22.122], [150.482, -22.556], [150.727, -22.402], [150.899, -23.462], [151.609, -24.076], [152.073, -24.457], [152.855, -25.267], [153.136, -26.071], [153.161, -26.641], [153.092, -27.260], [153.569, -28.110], [153.512, -28.995], [153.339, -29.458], [153.069, -30.350], [153.089, -30.923], [152.891, -31.640], [152.450, -32.550], [151.709, -33.041], [151.343, -33.816], [151.010, -34.310], [150.714, -35.173], [150.328, -35.671], [150.075, -36.420], [149.946, -37.109], [149.997, -37.425], [149.423, -37.772], [148.304, -37.809], [147.381, -38.219], [146.922, -38.606], [146.317, -39.035], [145.489, -38.593], [144.876, -38.417], [145.032, -37.896], [144.485, -38.085], [143.609, -38.809], [142.745, -38.538], [142.178, -38.380], [141.606, -38.308], [140.638, -38.019], [139.992, -37.402], [139.806, -36.643], [139.574, -36.138], [139.082, -35.732], [138.120, -35.612], [138.449, -35.127], [138.207, -34.384], [137.719, -35.076], [136.829, -35.260], [137.352, -34.707], [137.503, -34.130], [137.890, -33.640], [137.810, -32.900], [136.996, -33.752], [136.372, -34.094], [135.989, -34.890], [135.208, -34.478], [135.239, -33.947], [134.613, -33.222], [134.085, -32.848], [134.273, -32.617], [132.990, -32.011], [132.288, -31.982], [131.326, -31.495], [129.535, -31.590], [128.240, -31.948], [127.102, -32.282], [126.148, -32.215]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[81.787, 7.523], [81.637, 6.481], [81.218, 6.197], [80.348, 5.968], [79.872, 6.763], [79.695, 8.200], [80.147, 9.824], [80.838, 9.268], [81.304, 8.564], [81.787, 7.523]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[129.370, -2.802], [130.471, -3.093], [130.834, -3.858], [129.990, -3.446], [129.155, -3.362], [128.590, -3.428], [127.898, -3.393], [128.135, -2.843], [129.370, -2.802]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[126.874, -3.790], [126.183, -3.607], [125.989, -3.177], [127.000, -3.129], [127.249, -3.459], [126.874, -3.790]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[127.932, 2.174], [128.004, 1.628], [128.594, 1.540], [128.688, 1.132], [128.635, 0.258], [128.120, 0.356], [127.968, -0.252], [128.379, -0.780], [128.100, -0.899], [127.696, -0.266], [127.399, 1.011], [127.600, 1.810], [127.932, 2.174]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[122.927, 0.875], [124.077, 0.917], [125.065, 1.643], [125.240, 1.419], [124.437, 0.427], [123.685, 0.235], [122.723, 0.431], [121.056, 0.381], [120.183, 0.237], [120.040, -0.519], [120.935, -1.408], [121.475, -0.955], [123.340, -0.615], [123.258, -1.076], [122.822, -0.930], [122.388, -1.516], [121.508, -1.904], [122.454, -3.186], [122.271, -3.529], [123.170, -4.683], [123.162, -5.340], [122.628, -5.634], [122.236, -5.282], [122.719, -4.464], [121.738, -4.851], [121.489, -4.574], [121.619, -4.188], [120.898, -3.602], [120.972, -2.627], [120.305, -2.931], [120.390, -4.097], [120.430, -5.528], [119.796, -5.673], [119.366, -5.379], [119.653, -4.459], [119.498, -3.494], [119.078, -3.487], [118.767, -2.801], [119.180, -2.147], [119.323, -1.353], [119.825, 0.154], [120.035, 0.566], [120.885, 1.309], [121.666, 1.013], [122.927, 0.875]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[120.295, -10.258], [118.967, -9.557], [119.900, -9.361], [120.425, -9.665], [120.775, -9.969], [120.715, -10.239], [120.295, -10.258]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[121.341, -8.536], [122.007, -8.460], [122.903, -8.094], [122.756, -8.649], [121.254, -8.933], [119.924, -8.810], [119.920, -8.444], [120.715, -8.236], [121.341, -8.536]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[118.260, -8.362], [118.878, -8.280], [119.126, -8.705], [117.970, -8.906], [117.277, -9.040], [116.740, -9.032], [117.083, -8.457], [117.632, -8.449], [117.900, -8.095], [118.260, -8.362]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[108.486, -6.421], [108.623, -6.777], [110.539, -6.877], [110.759, -6.465], [112.614, -6.946], [112.978, -7.594], [114.478, -7.776], [115.705, -8.370], [114.564, -8.751], [113.464, -8.348], [112.559, -8.376], [111.522, -8.302], [110.586, -8.122], [109.427, -7.740], [108.693, -7.641], [108.277, -7.766], [106.454, -7.354], [106.280, -6.924], [105.365, -6.851], [106.051, -5.895], [107.265, -5.954], [108.072, -6.345], [108.486, -6.421]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[104.369, -1.084], [104.539, -1.782], [104.887, -2.340], [105.622, -2.428], [106.108, -3.061], [105.857, -4.305], [105.817, -5.852], [104.710, -5.873], [103.868, -5.037], [102.584, -4.220], [102.156, -3.614], [101.399, -2.799], [100.902, -2.050], [100.141, -0.650], [99.263, 0.183], [98.970, 1.042], [98.601, 1.823], [97.699, 2.453], [97.176, 3.308], [96.424, 3.868], [95.380, 4.970], [95.293, 5.479], [95.936, 5.439], [97.484, 5.246], [98.369, 4.268], [99.142, 3.590], [99.693, 3.174], [100.641, 2.099], [101.658, 2.083], [102.498, 1.398], [103.076, 0.561], [103.838, 0.104], [103.437, -0.711], [104.010, -1.059], [104.369, -1.084]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[120.833, 12.704], [120.323, 13.466], [121.180, 13.429], [121.527, 13.069], [121.262, 12.205], [120.833, 12.704]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[122.586, 9.981], [122.837, 10.261], [122.947, 10.881], [123.498, 10.940], [123.337, 10.267], [124.077, 11.232], [123.982, 10.278], [123.623, 9.950], [123.309, 9.318], [122.995, 9.022], [122.380, 9.713], [122.586, 9.981]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[126.376, 8.414], [126.478, 7.750], [126.537, 7.189], [126.196, 6.274], [125.831, 7.293], [125.363, 6.786], [125.683, 6.049], [125.396, 5.581], [124.219, 6.161], [123.938, 6.885], [124.243, 7.360], [123.610, 7.833], [123.296, 7.418], [122.825, 7.457], [122.085, 6.899], [121.919, 7.192], [122.312, 8.034], [122.942, 8.316], [123.487, 8.693], [123.841, 8.240], [124.601, 8.514], [124.764, 8.960], [125.471, 8.986], [125.412, 9.760], [126.222, 9.286], [126.306, 8.782], [126.376, 8.414]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[109.475, 18.197], [108.655, 18.507], [108.626, 19.367], [109.119, 19.821], [110.211, 20.101], [110.786, 20.077], [111.010, 19.695], [110.570, 19.255], [110.339, 18.678], [109.475, 18.197]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[121.777, 24.394], [121.175, 22.790], [120.747, 21.970], [120.220, 22.814], [120.106, 23.556], [120.694, 24.538], [121.495, 25.295], [121.951, 24.997], [121.777, 24.394]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[141.884, 39.180], [140.959, 38.174], [140.976, 37.142], [140.599, 36.343], [140.774, 35.842], [140.253, 35.138], [138.975, 34.667], [137.217, 34.606], [135.792, 33.464], [135.120, 33.849], [135.079, 34.596], [133.340, 34.375], [132.156, 33.904], [130.986, 33.885], [132.000, 33.149], [131.332, 31.450], [130.686, 31.029], [130.202, 31.418], [130.447, 32.319], [129.814, 32.610], [129.408, 33.296], [130.353, 33.604], [130.878, 34.232], [131.884, 34.749], [132.617, 35.433], [134.608, 35.731], [135.677, 35.527], [136.723, 37.304], [137.390, 36.827], [138.857, 37.827], [139.426, 38.215], [140.054, 39.438], [139.883, 40.563], [140.305, 41.195], [141.368, 41.378], [141.914, 39.991], [141.884, 39.180]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[144.613, 43.960], [145.320, 44.384], [145.543, 43.262], [144.059, 42.988], [143.183, 41.995], [141.611, 42.678], [141.067, 41.584], [139.955, 41.569], [139.817, 42.563], [140.312, 43.333], [141.380, 43.388], [141.671, 44.772], [141.967, 45.551], [143.142, 44.510], [143.910, 44.174], [144.613, 43.960]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[8.709, 40.899], [9.210, 41.209], [9.809, 40.500], [9.669, 39.177], [9.214, 39.240], [8.806, 38.906], [8.428, 39.171], [8.388, 40.378], [8.159, 40.950], [8.709, 40.899]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[8.746, 42.628], [9.390, 43.009], [9.560, 42.152], [9.229, 41.380], [8.775, 41.583], [8.544, 42.256], [8.746, 42.628]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[12.370, 56.111], [12.690, 55.609], [12.089, 54.800], [11.043, 55.364], [10.903, 55.779], [12.370, 56.111]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-4.211, 58.550], [-3.005, 58.635], [-4.073, 57.553], [-3.055, 57.690], [-1.959, 57.684], [-2.219, 56.870], [-3.119, 55.973], [-2.085, 55.909], [-1.114, 54.624], [-0.430, 54.464], [0.184, 53.325], [0.469, 52.929], [1.681, 52.739], [1.559, 52.099], [1.050, 51.806], [1.449, 51.289], [0.550, 50.765], [-0.787, 50.774], [-2.489, 50.500], [-2.956, 50.696], [-3.617, 50.228], [-4.542, 50.341], [-5.245, 49.959], [-5.776, 50.159], [-4.309, 51.210], [-3.414, 51.426], [-4.984, 51.593], [-5.267, 51.991], [-4.222, 52.301], [-4.770, 52.840], [-4.579, 53.495], [-3.092, 53.404], [-2.945, 53.984], [-3.630, 54.615], [-4.844, 54.790], [-5.082, 55.061], [-4.719, 55.508], [-5.047, 55.783], [-5.586, 55.311], [-5.644, 56.275], [-6.149, 56.785], [-5.786, 57.818], [-5.009, 58.630], [-4.211, 58.550]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-14.508, 66.455], [-14.739, 65.808], [-13.609, 65.126], [-14.909, 64.364], [-17.794, 63.678], [-18.656, 63.496], [-19.972, 63.643], [-22.762, 63.960], [-21.778, 64.402], [-23.955, 64.891], [-22.184, 65.084], [-22.227, 65.378], [-24.326, 65.611], [-23.650, 66.262], [-22.134, 66.410], [-20.576, 65.732], [-19.056, 66.276], [-17.798, 65.993], [-16.167, 66.526], [-14.508, 66.455]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[142.914, 53.704], [143.260, 52.740], [143.235, 51.756], [143.648, 50.747], [144.654, 48.976], [143.173, 49.306], [142.558, 47.861], [143.533, 46.836], [143.505, 46.137], [142.747, 46.740], [142.092, 45.966], [141.906, 46.805], [142.018, 47.780], [141.904, 48.859], [142.135, 49.615], [142.179, 50.952], [141.594, 51.935], [141.682, 53.301], [142.606, 53.762], [142.209, 54.225], [142.654, 54.365], [142.914, 53.704]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[118.504, 9.316], [117.174, 8.367], [117.664, 9.066], [118.386, 9.684], [118.987, 10.376], [119.511, 11.369], [119.689, 10.554], [119.029, 10.003], [118.504, 9.316]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[122.336, 18.224], [122.174, 17.810], [122.515, 17.093], [122.252, 16.262], [121.662, 15.931], [121.505, 15.124], [121.728, 14.328], [122.258, 14.218], [122.701, 14.336], [123.950, 13.782], [123.855, 13.237], [124.181, 12.997], [124.077, 12.536], [123.298, 13.027], [122.928, 13.552], [122.671, 13.185], [122.034, 13.784], [121.126, 13.636], [120.628, 13.857], [120.679, 14.271], [120.991, 14.525], [120.693, 14.756], [120.564, 14.396], [120.070, 14.970], [119.920, 15.406], [119.883, 16.363], [120.286, 16.034], [120.390, 17.599], [120.715, 18.505], [121.321, 18.504], [121.937, 18.218], [122.246, 18.478], [122.336, 18.224]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[122.038, 11.415], [121.883, 11.891], [122.483, 11.582], [123.120, 11.583], [123.100, 11.165], [122.637, 10.741], [122.002, 10.441], [121.967, 10.905], [122.038, 11.415]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[125.502, 12.162], [125.783, 11.046], [125.011, 11.311], [125.032, 10.975], [125.277, 10.358], [124.801, 10.134], [124.760, 10.837], [124.459, 10.889], [124.302, 11.495], [124.891, 11.415], [124.877, 11.794], [124.266, 12.557], [125.227, 12.535], [125.502, 12.162]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-177.550, 68.199], [-179.999, 68.963]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-179.999, -16.067], [-179.793, -16.020], [-179.917, -16.501], [-179.999, -16.555]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[125.947, -8.432], [126.644, -8.398], [126.957, -8.273], [127.335, -8.397], [126.967, -8.668], [125.925, -9.106], [125.088, -9.393], [124.435, -10.140], [123.579, -10.359], [123.459, -10.239], [123.550, -9.900], [123.980, -9.290], [124.968, -8.892], [125.086, -8.656], [125.947, -8.432]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-180, -84.713], [-179.942, -84.721], [-179.058, -84.139], [-177.256, -84.452], [-176.084, -84.099], [-175.829, -84.117], [-174.382, -84.534], [-173.116, -84.117], [-172.889, -84.061], [-169.951, -83.884], [-168.999, -84.117], [-168.530, -84.237], [-167.022, -84.570], [-164.182, -84.825], [-161.929, -85.138], [-158.071, -85.373], [-155.192, -85.099], [-150.942, -85.295], [-148.533, -85.609], [-145.888, -85.315], [-143.107, -85.040], [-142.892, -84.570], [-146.829, -84.531], [-150.060, -84.296], [-150.902, -83.904], [-153.586, -83.688], [-153.409, -83.238], [-153.037, -82.826], [-152.665, -82.454], [-152.861, -82.042], [-154.526, -81.768], [-155.290, -81.415], [-156.837, -81.102], [-154.408, -81.160], [-152.097, -81.004], [-150.648, -81.337], [-148.865, -81.043], [-147.220, -80.671], [-146.417, -80.337], [-146.770, -79.926], [-148.062, -79.652], [-149.531, -79.358], [-151.588, -79.299], [-153.390, -79.162], [-155.329, -79.064], [-155.975, -78.691], [-157.268, -78.378], [-158.051, -78.025], [-158.365, -76.889], [-157.875, -76.987], [-156.974, -77.300], [-155.329, -77.202], [-153.742, -77.065], [-152.920, -77.496], [-151.333, -77.398], [-150.001, -77.183], [-148.748, -76.908], [-147.612, -76.575], [-146.104, -76.477], [-146.143, -76.105], [-146.496, -75.733], [-146.202, -75.380], [-144.909, -75.204], [-144.322, -75.537], [-142.794, -75.341], [-141.638, -75.086], [-140.209, -75.066], [-138.857, -74.968], [-137.506, -74.733], [-136.428, -74.518], [-135.214, -74.302], [-134.431, -74.361], [-133.745, -74.439], [-132.257, -74.302], [-130.925, -74.479], [-129.554, -74.459], [-128.242, -74.322], [-126.890, -74.420], [-125.402, -74.518], [-124.011, -74.479], [-122.562, -74.498], [-121.073, -74.518], [-119.702, -74.479], [-118.684, -74.185], [-117.469, -74.028], [-116.216, -74.243], [-115.021, -74.067], [-113.944, -73.714], [-113.297, -74.028], [-112.945, -74.381], [-112.299, -74.714], [-111.261, -74.420], [-110.066, -74.792], [-108.714, -74.910], [-107.559, -75.184], [-106.149, -75.125], [-104.876, -74.949], [-103.367, -74.988], [-102.016, -75.125], [-100.645, -75.302], [-100.116, -74.870], [-100.763, -74.537], [-101.252, -74.185], [-102.545, -74.106], [-103.113, -73.734], [-103.328, -73.362], [-103.681, -72.617], [-102.917, -72.754], [-101.605, -72.813], [-100.312, -72.754], [-99.137, -72.911], [-98.118, -73.205], [-97.688, -73.558], [-96.336, -73.616], [-95.043, -73.479], [-93.672, -73.283], [-92.439, -73.166], [-91.420, -73.401], [-90.088, -73.322], [-89.226, -72.558], [-88.423, -73.009], [-87.268, -73.185], [-86.014, -73.087], [-85.192, -73.479], [-83.879, -73.518], [-82.665, -73.636], [-81.470, -73.851], [-80.687, -73.479], [-80.295, -73.126], [-79.296, -73.518], [-77.925, -73.420], [-76.907, -73.636], [-76.221, -73.969], [-74.890, -73.871], [-73.852, -73.656], [-72.833, -73.401], [-71.619, -73.264], [-70.209, -73.146], [-68.935, -73.009], [-67.956, -72.793], [-67.369, -72.480], [-67.134, -72.049], [-67.251, -71.637], [-67.564, -71.245], [-67.917, -70.853], [-68.230, -70.462], [-68.485, -70.109], [-68.544, -69.717], [-68.446, -69.325], [-67.976, -68.953], [-67.584, -68.541], [-67.427, -68.149], [-67.623, -67.718], [-67.741, -67.326], [-67.251, -66.876], [-66.703, -66.582], [-66.056, -66.209], [-65.371, -65.896], [-64.568, -65.602], [-64.176, -65.171], [-63.628, -64.897], [-63.001, -64.642], [-62.041, -64.583], [-61.414, -64.270], [-60.709, -64.074], [-59.887, -63.956], [-59.162, -63.701], [-58.594, -63.388], [-57.811, -63.270], [-57.223, -63.525], [-57.595, -63.858], [-58.614, -64.152], [-59.045, -64.368], [-59.789, -64.211], [-60.611, -64.309], [-61.297, -64.544], [-62.022, -64.799], [-62.511, -65.093], [-62.648, -65.484], [-62.590, -65.857], [-62.120, -66.190], [-62.805, -66.425], [-63.745, -66.503], [-64.294, -66.837], [-64.881, -67.150], [-65.508, -67.581], [-65.665, -67.953], [-65.312, -68.365], [-64.783, -68.678], [-63.961, -68.913], [-63.197, -69.227], [-62.785, -69.619], [-62.570, -69.991], [-62.276, -70.383], [-61.806, -70.716], [-61.512, -71.089], [-61.375, -72.010], [-61.081, -72.382], [-61.003, -72.774], [-60.690, -73.166], [-60.827, -73.695], [-61.375, -74.106], [-61.963, -74.439], [-63.295, -74.576], [-63.745, -74.929], [-64.352, -75.262], [-65.860, -75.635], [-67.192, -75.791], [-68.446, -76.007], [-69.797, -76.222], [-70.600, -76.634], [-72.206, -76.673], [-73.969, -76.634], [-75.555, -76.712], [-77.240, -76.712], [-76.926, -77.104], [-75.399, -77.281], [-74.282, -77.555], [-73.656, -77.908], [-74.772, -78.221], [-76.496, -78.123], [-77.925, -78.378], [-77.984, -78.789], [-78.023, -79.181], [-76.848, -79.514], [-76.633, -79.887], [-75.360, -80.259], [-73.244, -80.416], [-71.442, -80.690], [-70.013, -81.004], [-68.191, -81.317], [-65.704, -81.474], [-63.256, -81.748], [-61.552, -82.042], [-59.691, -82.375], [-58.712, -82.846], [-58.222, -83.218], [-57.008, -82.865], [-55.362, -82.571], [-53.619, -82.258], [-51.543, -82.003], [-49.761, -81.729], [-47.273, -81.709], [-44.825, -81.846], [-42.808, -82.081], [-42.162, -81.650], [-40.771, -81.356], [-38.244, -81.337], [-36.266, -81.121], [-34.386, -80.906], [-32.310, -80.769], [-30.097, -80.592], [-28.549, -80.337], [-29.254, -79.985], [-29.685, -79.632], [-29.685, -79.260], [-31.624, -79.299], [-33.681, -79.456], [-35.639, -79.456], [-35.914, -79.083], [-35.777, -78.339], [-35.326, -78.123], [-33.896, -77.888], [-32.212, -77.653], [-30.998, -77.359], [-29.783, -77.065], [-28.882, -76.673], [-27.511, -76.497], [-26.160, -76.360], [-25.474, -76.281], [-23.927, -76.242], [-22.458, -76.105], [-21.224, -75.909], [-20.010, -75.674], [-18.913, -75.439], [-17.522, -75.125], [-16.641, -74.792], [-15.701, -74.498], [-15.407, -74.106], [-16.465, -73.871], [-16.112, -73.460], [-15.446, -73.146], [-14.408, -72.950], [-13.311, -72.715], [-12.293, -72.401], [-11.510, -72.010], [-11.020, -71.539], [-10.295, -71.265], [-9.101, -71.324], [-8.611, -71.657], [-7.416, -71.696], [-7.377, -71.324], [-6.868, -70.932], [-5.790, -71.030], [-5.536, -71.402], [-4.341, -71.461], [-3.048, -71.285], [-1.795, -71.167], [-0.659, -71.226], [-0.228, -71.637], [0.868, -71.304], [1.886, -71.128], [3.022, -70.991], [4.139, -70.853], [5.157, -70.618], [6.273, -70.462], [7.135, -70.246], [7.742, -69.893], [8.487, -70.148], [9.525, -70.011], [10.249, -70.481], [10.817, -70.834], [11.953, -70.638], [12.404, -70.246], [13.422, -69.972], [14.734, -70.030], [15.126, -70.403], [15.949, -70.030], [17.026, -69.913], [18.201, -69.874], [19.259, -69.893], [20.375, -70.011], [21.452, -70.070], [21.923, -70.403], [22.569, -70.697], [23.666, -70.520], [24.841, -70.481], [25.977, -70.481], [27.093, -70.462], [28.092, -70.324], [29.150, -70.207], [30.031, -69.932], [30.971, -69.756], [31.990, -69.658], [32.754, -69.384], [33.302, -68.835], [33.870, -68.502], [34.908, -68.659], [35.300, -69.012], [36.162, -69.247], [37.200, -69.168], [37.905, -69.521], [38.649, -69.776], [39.667, -69.541], [40.020, -69.109], [40.921, -68.933], [41.959, -68.600], [42.938, -68.463], [44.113, -68.267], [44.897, -68.051], [45.719, -67.816], [46.503, -67.601], [47.443, -67.718], [48.344, -67.366], [48.990, -67.091], [49.930, -67.111], [50.753, -66.876], [50.949, -66.523], [51.791, -66.249], [52.614, -66.053], [53.613, -65.896], [54.533, -65.818], [55.414, -65.876], [56.355, -65.974], [57.158, -66.249], [57.255, -66.680], [58.137, -67.013], [58.744, -67.287], [59.939, -67.405], [60.605, -67.679], [61.427, -67.953], [62.387, -68.012], [63.190, -67.816], [64.052, -67.405], [64.992, -67.620], [65.971, -67.738], [66.911, -67.855], [67.891, -67.934], [68.890, -67.934], [69.712, -68.972], [69.673, -69.227], [69.555, -69.678], [68.596, -69.932], [67.812, -70.305], [67.949, -70.697], [69.066, -70.677], [68.929, -71.069], [68.419, -71.441], [67.949, -71.853], [68.713, -72.166], [69.869, -72.264], [71.024, -72.088], [71.573, -71.696], [71.906, -71.324], [72.454, -71.010], [73.081, -70.716], [73.336, -70.364], [73.864, -69.874], [74.491, -69.776], [75.627, -69.737], [76.626, -69.619], [77.644, -69.462], [78.134, -69.070], [78.428, -68.698], [79.113, -68.326], [80.093, -68.071], [80.935, -67.875], [81.483, -67.542], [82.051, -67.366], [82.776, -67.209], [83.775, -67.307], [84.676, -67.209], [85.655, -67.091], [86.752, -67.150], [87.477, -66.876], [87.986, -66.209], [88.358, -66.484], [88.828, -66.954], [89.670, -67.150], [90.630, -67.228], [91.590, -67.111], [92.608, -67.189], [93.548, -67.209], [94.175, -67.111], [95.017, -67.170], [95.781, -67.385], [96.682, -67.248], [97.759, -67.248], [98.680, -67.111], [99.718, -67.248], [100.384, -66.915], [100.893, -66.582], [101.578, -66.307], [102.832, -65.563], [103.478, -65.700], [104.242, -65.974], [104.908, -66.327], [106.181, -66.934], [107.160, -66.954], [108.081, -66.954], [109.158, -66.837], [110.235, -66.699], [111.058, -66.425], [111.743, -66.131], [112.860, -66.092], [113.604, -65.876], [114.388, -66.072], [114.897, -66.386], [115.602, -66.699], [116.699, -66.660], [117.384, -66.915], [118.579, -67.170], [119.832, -67.268], [120.870, -67.189], [121.654, -66.876], [122.320, -66.562], [123.221, -66.484], [124.122, -66.621], [125.160, -66.719], [126.100, -66.562], [127.001, -66.562], [127.882, -66.660], [128.803, -66.758], [129.704, -66.582], [130.781, -66.425], [131.799, -66.386], [132.935, -66.386], [133.856, -66.288], [134.757, -66.209], [135.031, -65.720], [135.070, -65.308], [135.697, -65.582], [135.873, -66.033], [136.206, -66.445], [136.618, -66.778], [137.460, -66.954], [138.596, -66.895], [139.908, -66.876], [140.809, -66.817], [142.121, -66.817], [143.061, -66.797], [144.374, -66.837], [145.490, -66.915], [146.195, -67.228], [145.999, -67.601], [146.646, -67.895], [147.723, -68.130], [148.839, -68.385], [150.132, -68.561], [151.483, -68.718], [152.502, -68.874], [153.638, -68.894], [154.284, -68.561], [155.165, -68.835], [155.929, -69.149], [156.811, -69.384], [158.025, -69.482], [159.181, -69.599], [159.670, -69.991], [160.806, -70.226], [161.570, -70.579], [162.686, -70.736], [163.842, -70.716], [164.919, -70.775], [166.114, -70.755], [167.309, -70.834], [168.425, -70.971], [169.463, -71.206], [170.501, -71.402], [171.206, -71.696], [171.089, -72.088], [170.560, -72.441], [170.109, -72.891], [169.757, -73.244], [169.287, -73.656], [167.975, -73.812], [167.387, -74.165], [166.094, -74.381], [165.644, -74.772], [164.958, -75.145], [164.234, -75.458], [163.822, -75.870], [163.568, -76.242], [163.470, -76.693], [163.489, -77.065], [164.057, -77.457], [164.273, -77.829], [164.743, -78.182], [166.604, -78.319], [166.995, -78.750], [165.193, -78.907], [163.666, -79.123], [161.766, -79.162], [160.924, -79.730], [160.747, -80.200], [160.316, -80.573], [159.788, -80.945], [161.120, -81.278], [161.629, -81.690], [162.490, -82.062], [163.705, -82.395], [165.095, -82.708], [166.604, -83.022], [168.895, -83.335], [169.404, -83.825], [172.283, -84.041], [172.477, -84.117], [173.224, -84.413], [175.985, -84.158], [178.277, -84.472], [180, -84.713]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-77.353, 8.670], [-76.836, 8.638], [-76.086, 9.336], [-75.674, 9.443], [-75.664, 9.774], [-75.480, 10.618], [-74.906, 11.083], [-74.276, 11.102], [-74.197, 11.310], [-73.414, 11.227], [-72.627, 11.731], [-72.238, 11.955], [-71.754, 12.437], [-71.399, 12.376], [-71.137, 12.112], [-71.331, 11.776], [-71.360, 11.539], [-71.947, 11.423], [-71.620, 10.969], [-71.633, 10.446], [-72.074, 9.865], [-71.695, 9.072], [-71.264, 9.137], [-71.039, 9.859], [-71.350, 10.211], [-71.400, 10.968], [-70.155, 11.375], [-70.293, 11.846], [-69.943, 12.162], [-69.584, 11.459], [-68.882, 11.443], [-68.233, 10.885], [-68.194, 10.554], [-67.296, 10.545], [-66.227, 10.648], [-65.655, 10.200], [-64.890, 10.077], [-64.329, 10.389], [-64.318, 10.641], [-63.079, 10.701], [-61.880, 10.715], [-62.730, 10.420], [-62.388, 9.948], [-61.588, 9.873], [-60.830, 9.381], [-60.671, 8.580], [-60.150, 8.602], [-59.758, 8.367], [-59.101, 7.999], [-58.482, 7.347], [-58.454, 6.832], [-58.078, 6.809], [-57.542, 6.321], [-57.147, 5.973], [-55.949, 5.772], [-55.841, 5.953], [-55.033, 6.025], [-53.958, 5.756], [-53.618, 5.646], [-52.882, 5.409], [-51.823, 4.565], [-51.657, 4.156], [-51.299, 4.120], [-51.069, 3.650], [-50.508, 1.901], [-49.974, 1.736], [-49.947, 1.046], [-50.699, 0.222], [-50.388, -0.078], [-48.620, -0.235], [-48.584, -1.237], [-47.824, -0.581], [-46.566, -0.941], [-44.905, -1.551], [-44.417, -2.137], [-44.581, -2.691], [-43.418, -2.383], [-41.472, -2.912], [-39.978, -2.873], [-38.500, -3.700], [-37.223, -4.820], [-36.452, -5.109], [-35.597, -5.149], [-35.235, -5.464], [-34.896, -6.738], [-34.729, -7.343], [-35.128, -8.996], [-35.636, -9.649], [-37.046, -11.040], [-37.683, -12.171], [-38.423, -13.038], [-38.673, -13.057], [-38.953, -13.793], [-38.882, -15.667], [-39.161, -17.208], [-39.267, -17.867], [-39.583, -18.262], [-39.760, -19.599], [-40.774, -20.904], [-40.944, -21.937], [-41.754, -22.370], [-41.988, -22.970], [-43.074, -22.967], [-44.647, -23.351], [-45.352, -23.796], [-46.472, -24.088], [-47.648, -24.885], [-48.495, -25.877], [-48.641, -26.623], [-48.474, -27.175], [-48.661, -28.186], [-48.888, -28.674], [-49.587, -29.224], [-50.696, -30.984], [-51.576, -31.777], [-52.256, -32.245], [-52.712, -33.196], [-53.373, -33.768], [-53.806, -34.396], [-54.935, -34.952], [-55.674, -34.752], [-56.215, -34.859], [-57.139, -34.430], [-57.817, -34.462], [-58.427, -33.909], [-58.495, -34.431], [-57.225, -35.288], [-57.362, -35.977], [-56.737, -36.413], [-56.788, -36.901], [-57.749, -38.183], [-59.231, -38.720], [-61.237, -38.928], [-62.335, -38.827], [-62.125, -39.424], [-62.330, -40.172], [-62.145, -40.676], [-62.745, -41.028], [-63.770, -41.166], [-64.732, -40.802], [-65.118, -41.064], [-64.978, -42.058], [-64.303, -42.359], [-63.755, -42.043], [-63.458, -42.563], [-64.378, -42.873], [-65.181, -43.495], [-65.328, -44.501], [-65.565, -45.036], [-66.509, -45.039], [-67.293, -45.551], [-67.580, -46.301], [-66.597, -47.033], [-65.641, -47.236], [-65.985, -48.133], [-67.166, -48.697], [-67.816, -49.869], [-68.728, -50.264], [-69.138, -50.732], [-68.815, -51.771], [-68.149, -52.349], [-68.571, -52.299], [-69.461, -52.291], [-69.942, -52.537], [-70.845, -52.899], [-71.006, -53.833], [-71.429, -53.856], [-72.557, -53.531], [-73.702, -52.835], [-74.946, -52.262]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-77.881, 7.223], [-77.476, 6.691], [-77.318, 5.845], [-77.533, 5.582], [-77.307, 4.667], [-77.496, 4.087], [-77.127, 3.849], [-77.510, 3.325], [-77.931, 2.696], [-78.427, 2.629], [-78.662, 2.267], [-78.617, 1.766], [-78.990, 1.691], [-78.855, 1.380], [-79.542, 0.982], [-80.090, 0.768], [-80.020, 0.360], [-80.399, -0.283], [-80.583, -0.906], [-80.933, -1.057], [-80.764, -1.965], [-80.967, -2.246], [-80.368, -2.685], [-79.986, -2.220], [-79.770, -2.657], [-80.302, -3.404], [-81.099, -4.036], [-81.410, -4.736], [-80.926, -5.690], [-81.249, -6.136], [-80.537, -6.541], [-79.760, -7.194], [-79.445, -7.930], [-79.036, -8.386], [-78.092, -10.377], [-77.106, -12.222], [-76.259, -13.535], [-76.423, -13.823], [-76.009, -14.649], [-75.237, -15.265], [-73.444, -16.359], [-71.462, -17.363], [-71.375, -17.773], [-70.372, -18.347], [-70.164, -19.756], [-70.091, -21.393], [-70.403, -23.628], [-70.724, -25.705], [-70.905, -27.640], [-71.489, -28.861], [-71.370, -30.095], [-71.668, -30.920], [-71.438, -32.418], [-71.861, -33.909], [-72.553, -35.508], [-73.166, -37.123], [-73.588, -37.156], [-73.505, -38.282], [-73.217, -39.258], [-73.677, -39.942], [-74.017, -41.794], [-74.331, -43.224], [-73.701, -43.365], [-73.388, -42.117], [-72.717, -42.383], [-73.240, -44.454], [-74.351, -44.103], [-74.692, -45.763], [-75.644, -46.647], [-74.126, -46.939], [-75.182, -47.711], [-75.608, -48.673], [-75.479, -50.378], [-74.976, -51.043], [-75.260, -51.629], [-74.946, -52.262]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-74.662, -52.837], [-73.838, -53.047], [-72.434, -53.715], [-71.107, -54.074], [-70.591, -53.615], [-70.267, -52.931], [-69.345, -52.518], [-68.634, -52.636], [-68.250, -53.100], [-67.749, -53.849], [-66.449, -54.450], [-65.050, -54.700], [-65.500, -55.199], [-66.449, -55.250], [-66.959, -54.896], [-67.291, -55.301], [-68.148, -55.611], [-68.639, -55.580], [-69.232, -55.499], [-69.958, -55.198], [-71.005, -55.053], [-72.263, -54.495], [-73.285, -53.957], [-74.662, -52.837]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[44.846, 80.589], [46.799, 80.771], [48.318, 80.784], [48.522, 80.514], [49.097, 80.753], [50.039, 80.918], [51.522, 80.699], [51.136, 80.547], [49.793, 80.415], [48.894, 80.339], [48.754, 80.175], [47.586, 80.010], [46.502, 80.247], [47.072, 80.559], [44.846, 80.589]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[53.508, 73.749], [55.902, 74.627], [55.631, 75.081], [57.868, 75.609], [61.170, 76.251], [64.498, 76.439], [66.210, 76.809], [68.157, 76.939], [68.852, 76.544], [68.180, 76.233], [64.637, 75.737], [61.583, 75.260], [58.477, 74.309], [56.986, 73.333], [55.419, 72.371], [55.622, 71.540], [57.535, 70.720], [56.944, 70.632], [53.677, 70.762], [53.412, 71.206], [51.601, 71.474], [51.455, 72.014], [52.478, 72.229], [52.444, 72.774], [54.427, 73.627], [53.508, 73.749]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[27.407, 80.056], [25.924, 79.517], [23.024, 79.400], [20.075, 79.566], [19.897, 79.842], [18.462, 79.859], [17.368, 80.318], [20.455, 80.598], [21.907, 80.357], [22.919, 80.657], [25.447, 80.407], [27.407, 80.056]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[24.724, 77.853], [22.490, 77.444], [20.726, 77.677], [21.416, 77.935], [20.811, 78.254], [22.884, 78.454], [23.281, 78.079], [24.724, 77.853]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[15.142, 79.674], [15.522, 80.016], [16.990, 80.050], [18.251, 79.701], [21.543, 78.956], [19.027, 78.562], [18.471, 77.826], [17.594, 77.637], [17.118, 76.809], [15.913, 76.770], [13.762, 77.380], [14.669, 77.735], [13.170, 78.024], [11.222, 78.869], [10.444, 79.652], [13.170, 80.010], [13.718, 79.660], [15.142, 79.674]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-77.881, 7.223], [-78.214, 7.512], [-78.429, 8.052], [-78.182, 8.319], [-78.435, 8.387], [-78.622, 8.718], [-79.120, 8.996], [-79.557, 8.932], [-79.760, 8.584], [-80.164, 8.333], [-80.382, 8.298], [-80.480, 8.090], [-80.003, 7.547], [-80.276, 7.419], [-80.421, 7.271], [-80.886, 7.220], [-81.059, 7.817], [-81.189, 7.647], [-81.519, 7.706], [-81.721, 8.108], [-82.131, 8.175], [-82.390, 8.292], [-82.605, 8.291], [-82.820, 8.290], [-82.850, 8.073], [-82.965, 8.225], [-83.508, 8.446], [-83.711, 8.656], [-83.596, 8.830], [-83.632, 9.051], [-83.909, 9.290], [-84.303, 9.487], [-84.647, 9.615], [-84.713, 9.908], [-84.975, 10.086], [-84.911, 9.795], [-85.110, 9.557], [-85.339, 9.834], [-85.660, 9.933], [-85.797, 10.134], [-85.791, 10.439], [-85.659, 10.754], [-85.800, 10.824], [-85.941, 10.895], [-85.712, 11.088], [-86.058, 11.403], [-86.525, 11.806], [-86.745, 12.143], [-87.167, 12.458], [-87.668, 12.909], [-87.557, 13.064], [-87.392, 12.914], [-87.316, 12.984], [-87.489, 13.297], [-87.641, 13.341], [-87.793, 13.384], [-87.904, 13.149], [-88.483, 13.163], [-88.843, 13.259], [-89.256, 13.458], [-89.812, 13.520], [-90.095, 13.735], [-90.608, 13.909], [-91.232, 13.927], [-91.689, 14.126], [-92.227, 14.538], [-93.359, 15.615], [-93.875, 15.940], [-94.691, 16.200], [-95.250, 16.128], [-96.053, 15.752], [-96.557, 15.653], [-97.263, 15.917], [-98.013, 16.107], [-98.947, 16.566], [-99.697, 16.706], [-100.829, 17.171], [-101.666, 17.649], [-101.918, 17.916], [-102.478, 17.975], [-103.500, 18.292], [-103.917, 18.748], [-104.992, 19.316], [-105.493, 19.946], [-105.731, 20.434], [-105.397, 20.531], [-105.500, 20.816], [-105.270, 21.076], [-105.265, 21.422], [-105.603, 21.871], [-105.693, 22.269], [-106.028, 22.773], [-106.909, 23.767], [-107.915, 24.548], [-108.401, 25.172], [-109.260, 25.580], [-109.444, 25.824], [-109.291, 26.442], [-109.801, 26.676], [-110.391, 27.162], [-110.641, 27.859], [-111.178, 27.941], [-111.759, 28.467], [-112.228, 28.954], [-112.271, 29.266], [-112.809, 30.021], [-113.163, 30.786], [-113.148, 31.170], [-113.871, 31.567], [-114.205, 31.524], [-114.776, 31.799], [-114.936, 31.393], [-114.771, 30.913], [-114.673, 30.162], [-114.330, 29.750], [-113.588, 29.061], [-113.424, 28.826], [-113.271, 28.754], [-113.140, 28.411], [-112.962, 28.425], [-112.761, 27.780], [-112.457, 27.525], [-112.244, 27.171], [-111.616, 26.662], [-111.284, 25.732], [-110.987, 25.294], [-110.710, 24.826], [-110.655, 24.298], [-110.172, 24.265], [-109.771, 23.811], [-109.409, 23.364], [-109.433, 23.185], [-109.854, 22.818], [-110.031, 22.823], [-110.295, 23.430], [-110.949, 24.000], [-111.670, 24.484], [-112.182, 24.738], [-112.148, 25.470], [-112.300, 26.012], [-112.777, 26.321], [-113.464, 26.768], [-113.596, 26.639], [-113.848, 26.900], [-114.465, 27.142], [-115.055, 27.722], [-114.982, 27.798], [-114.570, 27.741], [-114.199, 28.115], [-114.162, 28.566], [-114.931, 29.279], [-115.518, 29.556], [-115.887, 30.180], [-116.258, 30.836], [-116.721, 31.635], [-117.127, 32.535], [-117.295, 33.046], [-117.944, 33.621], [-118.410, 33.740], [-118.519, 34.027], [-119.081, 34.078], [-119.438, 34.348], [-120.367, 34.447], [-120.622, 34.608], [-120.744, 35.156], [-121.714, 36.161], [-122.547, 37.551], [-122.511, 37.783], [-122.953, 38.113], [-123.727, 38.951], [-123.865, 39.766], [-124.398, 40.313], [-124.178, 41.142], [-124.213, 41.999], [-124.532, 42.765], [-124.142, 43.708], [-124.020, 44.615], [-123.898, 45.523], [-124.079, 46.864], [-124.395, 47.720], [-124.687, 48.184], [-124.566, 48.379], [-123.120, 48.040], [-122.587, 47.095], [-122.339, 47.360], [-122.500, 48.180], [-122.840, 49], [-122.974, 49.002], [-124.910, 49.984], [-125.624, 50.416], [-127.435, 50.830], [-127.992, 51.715], [-127.850, 52.329], [-129.129, 52.755], [-129.305, 53.561], [-130.514, 54.287], [-130.536, 54.802], [-131.085, 55.178], [-131.967, 55.497], [-132.250, 56.369], [-133.539, 57.178], [-134.078, 58.123], [-135.038, 58.187], [-136.628, 58.212], [-137.800, 58.499], [-139.867, 59.537], [-140.825, 59.727], [-142.574, 60.084], [-143.958, 59.999], [-145.925, 60.458], [-147.114, 60.884], [-148.224, 60.672], [-148.018, 59.978], [-148.570, 59.914], [-149.727, 59.705], [-150.608, 59.368], [-151.716, 59.155], [-151.859, 59.744], [-151.409, 60.725], [-150.346, 61.033], [-150.621, 61.284], [-151.895, 60.727], [-152.578, 60.061], [-154.019, 59.350], [-153.287, 58.864], [-154.232, 58.146], [-155.307, 57.727], [-156.308, 57.422], [-156.556, 56.979], [-158.117, 56.463], [-158.433, 55.994], [-159.603, 55.566], [-160.289, 55.643], [-161.223, 55.364], [-162.237, 55.024], [-163.069, 54.689], [-164.785, 54.404], [-164.942, 54.572], [-163.848, 55.039], [-162.870, 55.348], [-161.804, 55.894], [-160.563, 56.008], [-160.070, 56.418], [-158.684, 57.016], [-158.461, 57.216], [-157.722, 57.570], [-157.550, 58.328], [-157.041, 58.918], [-158.194, 58.615], [-158.517, 58.787], [-159.058, 58.424], [-159.711, 58.931], [-159.981, 58.572], [-160.355, 59.071], [-161.355, 58.670], [-161.968, 58.671], [-162.054, 59.266], [-161.874, 59.633], [-162.518, 59.989], [-163.818, 59.798], [-164.662, 60.267], [-165.346, 60.507], [-165.350, 61.073], [-166.121, 61.500], [-165.734, 62.074], [-164.919, 62.633], [-164.562, 63.146], [-163.753, 63.219], [-163.067, 63.059], [-162.260, 63.541], [-161.534, 63.455], [-160.772, 63.766], [-160.958, 64.222], [-161.518, 64.402], [-160.777, 64.788], [-161.391, 64.777], [-162.453, 64.559], [-162.757, 64.338], [-163.546, 64.559], [-164.960, 64.446], [-166.425, 64.686], [-166.845, 65.088], [-168.110, 65.669], [-166.705, 66.088], [-164.474, 66.576], [-163.652, 66.576], [-163.788, 66.077], [-161.677, 66.116], [-162.489, 66.735], [-163.719, 67.116], [-164.430, 67.616], [-165.390, 68.042], [-166.764, 68.358], [-166.204, 68.883], [-164.430, 68.915], [-163.168, 69.371], [-162.930, 69.858], [-161.908, 70.333], [-160.934, 70.447], [-159.039, 70.891], [-158.119, 70.824], [-156.580, 71.357], [-155.067, 71.147], [-154.344, 70.696], [-153.900, 70.889], [-152.210, 70.829], [-152.270, 70.600], [-150.739, 70.430], [-149.720, 70.530], [-147.613, 70.214], [-145.689, 70.120], [-144.920, 69.989], [-143.589, 70.152], [-142.072, 69.851], [-140.985, 69.711], [-139.120, 69.471], [-137.546, 68.990], [-136.503, 68.898], [-135.625, 69.315], [-134.414, 69.627], [-132.929, 69.505], [-131.431, 69.944], [-129.794, 70.193], [-129.107, 69.779], [-128.361, 70.012], [-128.138, 70.483], [-127.447, 70.377], [-125.756, 69.480], [-124.424, 70.158], [-124.289, 69.399], [-123.061, 69.563], [-122.683, 69.855], [-121.472, 69.797], [-119.942, 69.377], [-117.602, 69.011], [-116.226, 68.841], [-115.246, 68.905], [-113.897, 68.398], [-115.304, 67.902], [-113.497, 67.688], [-110.798, 67.806], [-109.946, 67.981], [-108.880, 67.381], [-107.792, 67.887], [-108.812, 68.311], [-108.167, 68.653], [-106.950, 68.699], [-106.150, 68.799], [-105.342, 68.561], [-104.337, 68.018], [-103.221, 68.097], [-101.454, 67.646], [-99.901, 67.805], [-98.443, 67.781], [-98.558, 68.403], [-97.669, 68.578], [-96.119, 68.239], [-96.125, 67.293], [-95.489, 68.090], [-94.684, 68.063], [-94.232, 69.069], [-95.304, 69.685], [-96.471, 70.089], [-96.391, 71.194], [-95.208, 71.920], [-93.889, 71.760], [-92.878, 71.318], [-91.519, 70.191], [-92.406, 69.699], [-90.547, 69.497], [-90.551, 68.474], [-89.215, 69.258], [-88.019, 68.615], [-88.317, 67.873], [-87.350, 67.198], [-86.306, 67.921], [-85.576, 68.784], [-85.521, 69.882], [-84.100, 69.805], [-82.622, 69.658], [-81.280, 69.162], [-81.220, 68.665], [-81.964, 68.132], [-81.259, 67.597], [-81.386, 67.110], [-83.344, 66.411], [-84.735, 66.257], [-85.769, 66.558], [-86.067, 66.056], [-87.031, 65.212], [-87.323, 64.775], [-88.482, 64.098], [-89.914, 64.032], [-90.703, 63.610], [-90.770, 62.960], [-91.933, 62.835], [-93.156, 62.024], [-94.241, 60.898], [-94.629, 60.110], [-94.684, 58.948], [-93.215, 58.782], [-92.764, 57.845], [-92.297, 57.087], [-90.897, 57.284], [-89.039, 56.851], [-88.039, 56.471], [-87.324, 55.999], [-86.071, 55.723], [-85.011, 55.302], [-83.360, 55.244], [-82.272, 55.148], [-82.436, 54.282], [-82.125, 53.277], [-81.400, 52.157], [-79.912, 51.208], [-79.143, 51.533], [-78.601, 52.562], [-79.124, 54.141], [-79.829, 54.667], [-78.228, 55.136], [-77.095, 55.837], [-76.541, 56.534], [-76.623, 57.202], [-77.302, 58.052], [-78.516, 58.804], [-77.336, 59.852], [-77.772, 60.757], [-78.106, 62.319], [-77.410, 62.550], [-75.696, 62.278], [-74.668, 62.181], [-73.839, 62.443], [-72.908, 62.105], [-71.677, 61.525], [-71.373, 61.137], [-69.590, 61.061], [-69.620, 60.221], [-69.287, 58.957], [-68.374, 58.801], [-67.649, 58.212], [-66.201, 58.767], [-65.245, 59.870], [-64.583, 60.335], [-63.804, 59.442], [-62.502, 58.167], [-61.396, 56.967], [-61.798, 56.339], [-60.468, 55.775], [-59.569, 55.204], [-57.975, 54.945], [-57.333, 54.626], [-56.936, 53.780], [-56.158, 53.647], [-55.756, 53.270], [-55.683, 52.146], [-56.409, 51.770], [-57.126, 51.419], [-58.774, 51.064], [-60.033, 50.242], [-61.723, 50.080], [-63.862, 50.290], [-65.363, 50.298], [-66.399, 50.228], [-67.236, 49.511], [-68.511, 49.068], [-69.953, 47.744], [-71.104, 46.821], [-70.255, 46.986], [-68.649, 48.299], [-66.552, 49.133], [-65.056, 49.232], [-64.170, 48.742], [-65.115, 48.070], [-64.798, 46.992], [-64.472, 46.238], [-63.173, 45.739], [-61.520, 45.883], [-60.518, 47.007], [-60.448, 46.282], [-59.802, 45.920], [-61.039, 45.265], [-63.254, 44.670], [-64.246, 44.265], [-65.364, 43.545], [-66.123, 43.618], [-66.161, 44.465], [-64.425, 45.292], [-66.026, 45.259], [-67.137, 45.137], [-66.964, 44.809], [-68.032, 44.325], [-69.060, 43.980], [-70.116, 43.684], [-70.645, 43.090], [-70.814, 42.865], [-70.824, 42.334], [-70.494, 41.804], [-70.080, 41.780], [-70.184, 42.144], [-69.884, 41.922], [-69.965, 41.637], [-70.639, 41.474], [-71.120, 41.494], [-71.853, 41.319], [-72.294, 41.269], [-72.876, 41.220], [-73.710, 40.931], [-72.241, 41.119], [-71.945, 40.930], [-73.345, 40.630], [-73.981, 40.628], [-73.952, 40.750], [-74.256, 40.473], [-73.962, 40.427], [-74.178, 39.709], [-74.906, 38.939], [-74.980, 39.196], [-75.200, 39.248], [-75.528, 39.498], [-75.319, 38.959], [-75.071, 38.782], [-75.056, 38.404], [-75.377, 38.015], [-75.940, 37.216], [-76.031, 37.256], [-75.722, 37.937], [-76.232, 38.319], [-76.350, 39.149], [-76.542, 38.717], [-76.329, 38.083], [-76.989, 38.239], [-76.30162, 37.917], [-76.258, 36.9664], [-75.971, 36.897], [-75.868, 36.551], [-75.727, 35.550], [-76.363, 34.808], [-77.397, 34.512], [-78.054, 33.925], [-78.554, 33.861], [-79.060, 33.493], [-79.203, 33.158], [-80.301, 32.509], [-80.864, 32.033], [-81.336, 31.44049], [-81.490, 30.729], [-81.31371, 30.035], [-80.979, 29.180], [-80.535, 28.47213], [-80.529, 28.039], [-80.056, 26.879], [-80.088, 26.205], [-80.131, 25.816], [-80.381, 25.206], [-80.680, 25.079], [-81.172, 25.201], [-81.329, 25.639], [-81.709, 25.869], [-82.240, 26.729], [-82.705, 27.495], [-82.855, 27.886], [-82.650, 28.549], [-82.930, 29.100], [-83.709, 29.93656], [-84.099, 30.09], [-85.108, 29.636], [-85.287, 29.686], [-85.773, 30.152], [-86.399, 30.400], [-87.530, 30.274], [-88.417, 30.384], [-89.180, 30.315], [-89.593, 30.159], [-89.413, 29.894], [-89.430, 29.48864], [-89.217, 29.291], [-89.408, 29.159], [-89.77928, 29.30714], [-90.154, 29.117], [-90.880, 29.148], [-91.626, 29.677], [-92.49906, 29.552], [-93.226, 29.783], [-93.848, 29.713], [-94.690, 29.480], [-95.600, 28.738], [-96.594, 28.307], [-97.140, 27.830], [-97.369, 27.380], [-97.379, 26.689], [-97.329, 26.210], [-97.140, 25.869], [-97.528, 24.992], [-97.702, 24.272], [-97.776, 22.932], [-97.872, 22.444], [-97.699, 21.898], [-97.388, 21.411], [-97.189, 20.635], [-96.525, 19.890], [-96.292, 19.320], [-95.900, 18.828], [-94.839, 18.562], [-94.425, 18.144], [-93.548, 18.423], [-92.786, 18.524], [-92.037, 18.704], [-91.407, 18.876], [-90.771, 19.284], [-90.533, 19.867], [-90.451, 20.707], [-90.278, 20.999], [-89.601, 21.261], [-88.543, 21.493], [-87.658, 21.458], [-87.051, 21.543], [-86.811, 21.331], [-86.845, 20.849], [-87.383, 20.255], [-87.621, 19.646], [-87.436, 19.472], [-87.586, 19.040], [-87.837, 18.259], [-88.090, 18.516], [-88.300, 18.499], [-88.296, 18.353], [-88.106, 18.348], [-88.123, 18.076], [-88.285, 17.644], [-88.197, 17.489], [-88.302, 17.131], [-88.239, 17.036], [-88.355, 16.530], [-88.551, 16.265], [-88.732, 16.233], [-88.930, 15.887], [-88.604, 15.706], [-88.518, 15.855], [-88.189, 15.719], [-88.121, 15.688], [-87.901, 15.864], [-87.615, 15.878], [-87.522, 15.797], [-87.367, 15.846], [-86.903, 15.756], [-86.440, 15.782], [-86.119, 15.893], [-86.001, 16.005], [-85.683, 15.953], [-85.444, 15.885], [-85.182, 15.909], [-84.983, 15.995], [-84.526, 15.857], [-84.368, 15.835], [-84.063, 15.648], [-83.773, 15.424], [-83.410, 15.270], [-83.147, 14.995], [-83.233, 14.899], [-83.284, 14.676], [-83.182, 14.310], [-83.412, 13.970], [-83.519, 13.567], [-83.552, 13.127], [-83.498, 12.869], [-83.473, 12.419], [-83.626, 12.320], [-83.719, 11.893], [-83.650, 11.629], [-83.855, 11.373], [-83.808, 11.103], [-83.655, 10.938], [-83.590, 10.785], [-83.402, 10.395], [-83.015, 9.992], [-82.546, 9.566]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-82.546, 9.566], [-82.187, 9.207], [-82.207, 8.995], [-81.808, 8.950], [-81.714, 9.031], [-81.439, 8.786], [-80.947, 8.858], [-80.521, 9.111], [-79.914, 9.312], [-79.573, 9.611], [-79.021, 9.552], [-79.058, 9.454], [-78.500, 9.420], [-78.055, 9.247], [-77.729, 8.946], [-77.353, 8.670]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-71.712, 19.714], [-71.587, 19.884], [-71.380, 19.904], [-70.806, 19.880], [-70.214, 19.622], [-69.950, 19.647], [-69.769, 19.293], [-69.222, 19.313], [-69.254, 19.015], [-68.809, 18.979], [-68.317, 18.612], [-68.689, 18.205], [-69.164, 18.422], [-69.623, 18.380], [-69.952, 18.428], [-70.133, 18.245], [-70.517, 18.184], [-70.669, 18.426], [-70.999, 18.283], [-71.400, 17.598], [-71.657, 17.757], [-71.708, 18.044], [-72.372, 18.214], [-72.844, 18.145], [-73.454, 18.217], [-73.922, 18.030], [-74.458, 18.342], [-74.369, 18.664], [-73.449, 18.526], [-72.694, 18.445], [-72.334, 18.668], [-72.791, 19.101], [-72.784, 19.483], [-73.415, 19.639], [-73.189, 19.915], [-72.579, 19.871], [-71.712, 19.714]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[14.761, 38.143], [15.520, 38.231], [15.160, 37.444], [15.309, 37.134], [15.099, 36.619], [14.335, 36.996], [13.826, 37.104], [12.431, 37.612], [12.570, 38.126], [13.741, 38.034], [14.761, 38.143]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[37.539, 44.657], [38.679, 44.279], [39.955, 43.434]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[132.371, 33.463], [132.924, 34.060], [133.492, 33.944], [133.904, 34.364], [134.638, 34.149], [134.766, 33.806], [134.203, 33.201], [133.792, 33.521], [133.280, 33.289], [133.014, 32.704], [132.363, 32.989], [132.371, 33.463]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-16.256, 19.096], [-16.377, 19.593], [-16.277, 20.092], [-16.536, 20.567], [-17.063, 20.999], [-17.020, 21.422], [-16.973, 21.885], [-16.589, 22.158], [-16.261, 22.679], [-16.326, 23.017], [-15.982, 23.723], [-15.426, 24.359], [-15.089, 24.520], [-14.824, 25.103], [-14.800, 25.636], [-14.439, 26.254], [-13.773, 26.618], [-13.139, 27.640], [-12.618, 28.038], [-11.688, 28.148], [-10.900, 28.832], [-10.399, 29.098], [-9.564, 29.933], [-9.814, 31.177], [-9.434, 32.038], [-9.300, 32.564], [-8.657, 33.240], [-7.654, 33.697], [-6.912, 34.110], [-6.244, 35.145], [-5.929, 35.759], [-5.193, 35.755], [-4.591, 35.330], [-3.640, 35.399], [-2.604, 35.179], [-2.169, 35.168], [-1.208, 35.714], [-0.127, 35.888], [0.503, 36.301], [1.466, 36.605], [3.161, 36.783], [4.815, 36.865], [5.320, 36.716], [6.261, 37.110], [7.330, 37.118], [7.737, 36.885], [8.420, 36.946], [9.509, 37.349], [10.210, 37.230], [10.180, 36.724], [11.028, 37.092], [11.100, 36.899], [10.600, 36.410], [10.593, 35.947], [10.939, 35.698], [10.807, 34.833], [10.149, 34.330], [10.339, 33.785], [10.856, 33.768], [11.108, 33.293], [11.488, 33.136], [12.663, 32.792], [13.083, 32.878], [13.918, 32.711], [15.245, 32.265], [15.713, 31.376], [16.611, 31.182], [18.021, 30.763], [19.086, 30.266], [19.574, 30.525], [20.053, 30.985], [19.820, 31.751], [20.133, 32.238], [20.854, 32.706], [21.543, 32.843], [22.895, 32.638], [23.236, 32.191], [23.609, 32.187], [23.927, 32.016], [24.921, 31.899], [25.164, 31.569], [26.495, 31.585], [27.457, 31.321], [28.450, 31.025], [28.913, 30.870], [29.683, 31.186], [30.095, 31.473], [30.976, 31.555], [31.687, 31.429], [31.960, 30.933], [32.192, 31.260], [32.993, 31.024], [33.773, 30.967], [34.265, 31.219], [34.556, 31.548], [34.488, 31.605], [34.752, 32.072], [34.955, 32.827], [35.098, 33.080], [35.126, 33.090], [35.482, 33.905], [35.979, 34.610], [35.998, 34.644], [35.905, 35.410], [36.149, 35.821], [35.782, 36.274], [36.160, 36.650], [35.550, 36.565], [34.714, 36.795], [34.026, 36.219], [32.509, 36.107], [31.699, 36.644], [30.621, 36.677], [30.391, 36.262], [29.699, 36.144], [28.732, 36.676], [27.641, 36.658], [27.048, 37.653], [26.318, 38.208], [26.804, 38.985], [26.170, 39.463], [27.280, 40.420], [28.819, 40.460], [29.240, 41.219], [31.145, 41.087], [32.347, 41.736], [33.513, 42.018], [35.167, 42.040], [36.913, 41.335], [38.347, 40.948], [39.512, 41.102], [40.373, 41.013], [41.554, 41.535], [41.703, 41.962], [41.453, 42.645], [40.875, 43.013], [40.321, 43.128], [39.955, 43.434], [38.679, 44.279], [37.539, 44.657], [36.675, 45.244], [37.403, 45.404], [38.232, 46.240], [37.673, 46.636], [39.147, 47.044], [39.121, 47.263], [38.223, 47.102], [37.425, 47.022], [36.759, 46.698], [35.823, 46.645], [34.962, 46.273], [35.020, 45.651], [35.510, 45.409], [36.529, 45.469], [36.334, 45.113], [35.239, 44.939], [33.882, 44.361], [33.326, 44.564], [33.546, 45.034], [32.454, 45.327], [32.630, 45.519], [33.588, 45.851], [33.298, 46.080], [31.744, 46.333], [31.675, 46.706], [30.748, 46.583], [30.377, 46.032], [29.603, 45.293], [29.626, 45.035], [29.141, 44.820], [28.837, 44.913], [28.558, 43.707], [28.039, 43.293], [27.673, 42.577], [27.996, 42.007], [28.115, 41.622], [28.988, 41.299], [28.806, 41.054], [27.619, 40.999], [27.192, 40.690], [26.358, 40.151], [26.043, 40.617], [26.056, 40.824], [25.447, 40.852], [24.925, 40.947], [23.714, 40.687], [24.407, 40.124], [23.899, 39.962], [23.342, 39.960], [22.813, 40.476], [22.626, 40.256], [22.849, 39.659], [23.350, 39.190], [22.973, 38.970], [23.530, 38.510], [24.025, 38.219], [24.040, 37.655], [23.115, 37.920], [23.409, 37.409], [22.774, 37.305], [23.154, 36.422], [22.490, 36.410], [21.670, 36.844], [21.295, 37.644], [21.120, 38.310], [20.730, 38.769], [20.217, 39.340], [20.150, 39.624], [19.980, 39.694], [19.960, 39.915], [19.406, 40.250], [19.319, 40.727], [19.403, 41.409], [19.540, 41.719], [19.371, 41.877], [19.162, 41.955], [18.882, 42.281], [18.450, 42.479], [17.509, 42.849], [16.930, 43.209], [16.015, 43.507], [15.174, 44.243], [15.376, 44.317], [14.920, 44.738], [14.901, 45.076], [14.258, 45.233], [13.952, 44.802], [13.656, 45.136], [13.679, 45.484], [13.715, 45.500], [13.937, 45.591], [13.141, 45.736], [12.328, 45.381], [12.383, 44.885], [12.261, 44.600], [12.589, 44.091], [13.526, 43.587], [14.029, 42.761], [15.142, 41.955], [15.926, 41.961], [16.169, 41.740], [15.889, 41.541], [16.785, 41.179], [17.519, 40.877], [18.376, 40.355], [18.480, 40.168], [18.293, 39.810], [17.738, 40.277], [16.869, 40.442], [16.448, 39.795], [17.171, 39.424], [17.052, 38.902], [16.635, 38.843], [16.100, 37.985], [15.684, 37.908], [15.687, 38.214], [15.891, 38.750], [16.109, 38.964], [15.718, 39.544], [15.413, 40.048], [14.998, 40.172], [14.703, 40.604], [14.060, 40.786], [13.627, 41.188], [12.888, 41.253], [12.106, 41.704], [11.191, 42.355], [10.511, 42.931], [10.200, 43.920], [9.702, 44.036], [8.888, 44.366], [8.428, 44.231], [7.850, 43.767], [7.435, 43.693], [6.529, 43.128], [4.556, 43.399], [3.100, 43.075], [2.985, 42.473], [3.039, 41.892], [2.091, 41.226], [0.810, 41.014], [0.721, 40.678], [0.106, 40.123], [-0.278, 39.309], [0.111, 38.738], [-0.467, 38.292], [-0.683, 37.642], [-1.438, 37.443], [-2.146, 36.674], [-3.415, 36.658], [-4.368, 36.677], [-4.995, 36.324], [-5.377, 35.946], [-5.866, 36.029], [-6.236, 36.367], [-6.520, 36.942], [-7.453, 37.097], [-7.855, 36.838], [-8.382, 36.978], [-8.898, 36.868], [-8.746, 37.651], [-8.839, 38.266], [-9.287, 38.358], [-9.526, 38.737], [-9.446, 39.392], [-9.048, 39.755], [-8.977, 40.159], [-8.768, 40.760], [-8.790, 41.184], [-8.990, 41.543], [-9.034, 41.880], [-8.984, 42.592], [-9.392, 43.026], [-7.978, 43.748], [-6.754, 43.567], [-5.411, 43.574], [-4.347, 43.403], [-3.517, 43.455], [-1.901, 43.422], [-1.384, 44.022], [-1.193, 46.014], [-2.225, 47.064], [-2.963, 47.570], [-4.491, 47.954], [-4.592, 48.684], [-3.295, 48.901], [-1.616, 48.644], [-1.933, 49.776], [-0.989, 49.347], [1.338, 50.127], [1.639, 50.946], [2.513, 51.148], [3.314, 51.345], [3.830, 51.620], [4.705, 53.091], [6.074, 53.510], [6.905, 53.482], [7.100, 53.693], [7.936, 53.748], [8.121, 53.527], [8.800, 54.020], [8.572, 54.395], [8.526, 54.962], [8.120, 55.517], [8.089, 56.540], [8.256, 56.809], [8.543, 57.110], [9.424, 57.172], [9.775, 57.447], [10.580, 57.730], [10.546, 57.215], [10.250, 56.890], [10.369, 56.609], [10.912, 56.458], [10.667, 56.081], [10.369, 56.190], [9.649, 55.469], [9.921, 54.983], [9.939, 54.596], [10.950, 54.363], [10.939, 54.008], [11.956, 54.196], [12.518, 54.470], [13.647, 54.075], [14.119, 53.757], [14.802, 54.050], [16.363, 54.513], [17.622, 54.851], [18.620, 54.682], [18.696, 54.438], [19.660, 54.426], [19.888, 54.866], [21.268, 55.190], [21.055, 56.031], [21.090, 56.783], [21.581, 57.411], [22.524, 57.753], [23.318, 57.006], [24.120, 57.025], [24.312, 57.793], [24.428, 58.383], [24.061, 58.257], [23.426, 58.612], [23.339, 59.187], [24.604, 59.465], [25.864, 59.611], [26.949, 59.445], [27.981, 59.475], [29.117, 60.028], [28.069, 60.503], [26.255, 60.423], [24.496, 60.057], [22.869, 59.846], [22.290, 60.391], [21.322, 60.720], [21.544, 61.705], [21.059, 62.607], [21.536, 63.189], [22.442, 63.817], [24.730, 64.902], [25.398, 65.111], [25.294, 65.534], [23.903, 66.006], [22.183, 65.723], [21.213, 65.026], [21.369, 64.413], [19.778, 63.609], [17.847, 62.749], [17.119, 61.341], [17.831, 60.636], [18.787, 60.081], [17.869, 58.953], [16.829, 58.719], [16.447, 57.041], [15.879, 56.104], [14.666, 56.200], [14.100, 55.407], [12.942, 55.361], [12.625, 56.307], [11.787, 57.441], [11.027, 58.856], [10.356, 59.469], [8.382, 58.313], [7.048, 58.078], [5.665, 58.588], [5.308, 59.663], [4.992, 61.970], [5.912, 62.614], [8.553, 63.454], [10.527, 64.486], [12.358, 65.879], [14.761, 67.810], [16.435, 68.563], [19.184, 69.817], [21.378, 70.255], [23.023, 70.202], [24.546, 71.030], [26.370, 70.986], [28.165, 71.185], [31.293, 70.453], [30.005, 70.186], [31.101, 69.558], [32.132, 69.905], [33.775, 69.301], [36.513, 69.063], [40.292, 67.932], [41.059, 67.457], [41.125, 66.791], [40.015, 66.266], [38.382, 65.999], [33.918, 66.759], [33.184, 66.632], [34.814, 65.900], [34.878, 65.436], [34.943, 64.414], [36.231, 64.109], [37.012, 63.849], [37.141, 64.334], [36.539, 64.76446], [37.17604, 65.143], [39.593, 64.520], [40.435, 64.76446], [39.762, 65.49682], [42.093, 66.476], [43.016, 66.418], [43.949, 66.06908], [44.532, 66.756], [43.698, 67.352], [44.174, 67.961], [43.452, 68.570], [46.250, 68.249], [46.821, 67.689], [45.555, 67.566], [45.562, 67.010], [46.349, 66.667], [47.894, 66.884], [48.138, 67.522], [53.717, 68.857], [54.471, 68.808], [53.485, 68.201], [54.753, 68.086], [55.442, 68.438], [57.317, 68.466], [58.802, 68.88082], [59.941, 68.278], [61.077, 68.940], [60.030, 69.520], [60.550, 69.850], [63.504, 69.547], [64.888, 69.234], [68.512, 68.092], [69.180, 68.615], [68.164, 69.144], [68.135, 69.356], [66.930, 69.454], [67.25976, 69.928], [66.724, 70.708], [66.694, 71.028], [68.540, 71.9345], [69.196, 72.843], [69.940, 73.040], [72.587, 72.776], [72.796, 72.220], [71.848, 71.40898], [72.470, 71.090], [72.791, 70.391], [72.564, 69.020], [73.667, 68.407], [73.238, 67.740], [71.280, 66.320], [72.423, 66.172], [72.820, 66.532], [73.920, 66.789], [74.186, 67.284], [75.052, 67.760], [74.469, 68.328], [74.935, 68.989], [73.842, 69.071], [73.601, 69.627], [74.399, 70.631], [73.101, 71.44717], [74.890, 72.121], [74.659, 72.832], [75.158, 72.854], [75.683, 72.300], [75.288, 71.335], [76.359, 71.152], [75.903, 71.874], [77.576, 72.267], [79.652, 72.320], [81.500, 71.749], [80.610, 72.582], [80.511, 73.648], [82.249, 73.850], [84.655, 73.805], [86.822, 73.936], [86.009, 74.459], [87.166, 75.116], [88.315, 75.143], [90.259, 75.639], [92.900, 75.773], [93.234, 76.047], [95.860, 76.140], [96.678, 75.915], [98.922, 76.446], [100.759, 76.430], [101.035, 76.861], [101.990, 77.287], [104.351, 77.697], [106.066, 77.373], [104.705, 77.127], [106.970, 76.974], [107.239, 76.479], [108.153, 76.723], [111.077, 76.710], [113.331, 76.222], [114.134, 75.847], [113.885, 75.327], [112.779, 75.031], [110.151, 74.476], [109.399, 74.180], [110.640, 74.040], [112.119, 73.787], [113.019, 73.976], [113.529, 73.335], [113.968, 73.594], [115.567, 73.752], [118.776, 73.587], [119.019, 73.120], [123.200, 72.971], [123.257, 73.735], [125.380, 73.560], [126.976, 73.565], [128.591, 73.038], [129.051, 72.398], [128.460, 71.980], [129.715, 71.193], [131.288, 70.786], [132.253, 71.836], [133.857, 71.386], [135.561, 71.655], [137.497, 71.347], [138.234, 71.628], [139.869, 71.487], [139.147, 72.41619], [140.468, 72.849], [149.500, 72.199], [150.351, 71.606], [152.968, 70.842], [157.006, 71.031], [158.997, 70.866], [159.830, 70.453], [159.708, 69.721], [160.940, 69.437], [162.279, 69.642], [164.052, 69.668], [165.940, 69.471], [167.862, 69.568], [169.577, 68.693], [170.816, 69.013], [170.008, 69.652], [170.453, 70.097], [173.643, 69.817], [175.724, 69.877], [178.599, 69.400], [180.000, 68.963]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[180.000, 64.979], [178.7072, 64.534], [177.411, 64.60821], [178.313, 64.07593], [178.908, 63.251], [179.370, 62.982], [179.486, 62.568], [179.228, 62.304], [177.364, 62.521], [174.569, 61.769], [173.680, 61.652], [172.150, 60.949], [170.698, 60.336], [170.330, 59.881], [168.900, 60.573], [166.294, 59.788], [165.840, 60.159], [164.876, 59.7316], [163.539, 59.868], [163.217, 59.211], [162.017, 58.243], [162.052, 57.839], [163.191, 57.615], [163.057, 56.159], [162.126, 56.115], [161.701, 55.285], [162.117, 54.855], [160.368, 54.344], [160.021, 53.202], [158.530, 52.958], [158.231, 51.942], [156.789, 51.011], [156.419, 51.700], [155.991, 53.158], [155.433, 55.381], [155.914, 56.767], [156.758, 57.364], [156.810, 57.832], [158.364, 58.055], [160.150, 59.314], [161.872, 60.343], [163.669, 61.140], [164.473, 62.550], [163.258, 62.466], [162.657, 61.642], [160.121, 60.544], [159.302, 61.773], [156.720, 61.434], [154.218, 59.758], [155.043, 59.144], [152.811, 58.883], [151.265, 58.780], [151.338, 59.503], [149.783, 59.655], [148.544, 59.164], [145.487, 59.336], [142.197, 59.03998], [138.958, 57.088], [135.126, 54.729], [136.701, 54.603], [137.193, 53.977], [138.164, 53.755], [138.804, 54.254], [139.901, 54.189], [141.345, 53.089], [141.379, 52.238], [140.59742, 51.239], [140.513, 50.045], [140.061, 48.446], [138.554, 46.999], [138.219, 46.307], [136.862, 45.143], [135.515, 43.988], [134.869, 43.398], [133.536, 42.811], [132.906, 42.798], [132.278, 43.284], [130.935, 42.552], [130.780, 42.220], [130.400, 42.280], [129.965, 41.941], [129.667, 41.601], [129.705, 40.882], [129.188, 40.661], [129.010, 40.485], [128.633, 40.189], [127.967, 40.025], [127.533, 39.756], [127.502, 39.323], [127.385, 39.213], [127.783, 39.050], [128.349, 38.612], [129.212, 37.432], [129.460, 36.784], [129.468, 35.632], [129.091, 35.082], [128.185, 34.890], [127.386, 34.475], [126.485, 34.390], [126.373, 34.934], [126.559, 35.684], [126.117, 36.725], [126.860, 36.893], [126.174, 37.749], [125.689, 37.940], [125.568, 37.752], [125.275, 37.669], [125.240, 37.857], [124.981, 37.948], [124.712, 38.108], [124.985, 38.548], [125.221, 38.665], [125.132, 38.848], [125.386, 39.387], [125.321, 39.551], [124.737, 39.660], [124.265, 39.928], [122.867, 39.637], [122.131, 39.170], [121.054, 38.897], [121.585, 39.360], [121.376, 39.750], [122.168, 40.422], [121.640, 40.946], [120.768, 40.593], [119.639, 39.898], [119.023, 39.252], [118.042, 39.204], [117.532, 38.737], [118.059, 38.061], [118.878, 37.897], [118.911, 37.448], [119.702, 37.156], [120.823, 37.870], [121.711, 37.481], [122.357, 37.454], [122.519, 36.930], [121.104, 36.651], [120.637, 36.111], [119.664, 35.609], [119.151, 34.909], [120.227, 34.360], [120.620, 33.376], [121.229, 32.460], [121.908, 31.692], [121.891, 30.949], [121.264, 30.676], [121.503, 30.142], [122.092, 29.832], [121.938, 29.018], [121.684, 28.225], [121.125, 28.135], [120.395, 27.053], [119.585, 25.740], [118.656, 24.547], [117.281, 23.624], [115.890, 22.782], [114.763, 22.668], [114.152, 22.223], [113.806, 22.548], [113.241, 22.051], [111.843, 21.550], [110.785, 21.397], [110.509, 20.565], [110.444, 20.341], [109.889, 20.282], [109.627, 21.008], [109.864, 21.395], [108.522, 21.715], [108.050, 21.552], [106.715, 20.696], [105.881, 19.752], [105.662, 19.058], [106.426, 18.004], [107.361, 16.697], [108.269, 16.079], [108.877, 15.276], [109.335, 13.426], [109.200, 11.666], [108.366, 11.008], [107.220, 10.364], [106.405, 9.530], [105.158, 8.599], [104.795, 9.241], [105.076, 9.918], [104.334, 10.486], [103.497, 10.632], [103.090, 11.153], [102.584, 12.186], [101.687, 12.645], [100.831, 12.627], [100.978, 13.412], [100.097, 13.406], [100.018, 12.307], [99.478, 10.846], [99.153, 9.963], [99.222, 9.239], [99.873, 9.207], [100.279, 8.295], [100.459, 7.429], [101.017, 6.856], [101.623, 6.740], [102.141, 6.221], [102.371, 6.128], [102.961, 5.524], [103.381, 4.855], [103.438, 4.181], [103.332, 3.726], [103.429, 3.382], [103.502, 2.791], [103.854, 2.515], [104.247, 1.631], [104.228, 1.293], [103.519, 1.226], [102.573, 1.967], [101.390, 2.760], [101.273, 3.270], [100.695, 3.939], [100.557, 4.767], [100.196, 5.312], [100.306, 6.040], [100.085, 6.464], [99.690, 6.848], [99.519, 7.343], [98.988, 7.907], [98.503, 8.382], [98.339, 7.794], [98.150, 8.350], [98.259, 8.973], [98.553, 9.932], [98.457, 10.675], [98.764, 11.441], [98.428, 12.032], [98.509, 13.122], [98.103, 13.640], [97.777, 14.837], [97.597, 16.100], [97.164, 16.928], [96.505, 16.427], [95.369, 15.714], [94.808, 15.803], [94.188, 16.037], [94.533, 17.277], [94.324, 18.213], [93.540, 19.366], [93.663, 19.726], [93.078, 19.855], [92.368, 20.670], [92.082, 21.192], [92.025, 21.701], [91.834, 22.182], [91.417, 22.765], [90.496, 22.805], [90.586, 22.392], [90.272, 21.836], [89.847, 22.039], [89.702, 21.857], [89.418, 21.966], [89.031, 22.055], [88.888, 21.690], [88.208, 21.703], [86.975, 21.495], [87.033, 20.743], [86.499, 20.151], [85.060, 19.478], [83.941, 18.302], [83.189, 17.671], [82.192, 17.016], [82.191, 16.556], [81.692, 16.310], [80.791, 15.951], [80.324, 15.899], [80.025, 15.136], [80.233, 13.835], [80.286, 13.006], [79.862, 12.056], [79.857, 10.357], [79.340, 10.308], [78.885, 9.546], [79.189, 9.216], [78.277, 8.933], [77.941, 8.252], [77.539, 7.965], [76.592, 8.899], [76.130, 10.299], [75.746, 11.308], [75.396, 11.781], [74.864, 12.741], [74.616, 13.992], [74.443, 14.617], [73.534, 15.990], [73.119, 17.928], [72.820, 19.208], [72.824, 20.419], [72.630, 21.356], [71.175, 20.757], [70.470, 20.877], [69.164, 22.089], [69.644, 22.450], [69.349, 22.843], [68.176, 23.691], [67.443, 23.944], [67.145, 24.663], [66.372, 25.425], [64.530, 25.237], [62.905, 25.218], [61.497, 25.078], [59.616, 25.380], [58.525, 25.609], [57.397, 25.739], [56.970, 26.966], [56.492, 27.143], [55.723, 26.964], [54.715, 26.480], [53.493, 26.812], [52.483, 27.580], [51.520, 27.865], [50.852, 28.814], [50.115, 30.147], [49.576, 29.985], [48.941, 30.317], [48.567, 29.926], [47.974, 29.975], [48.183, 29.534], [48.093, 29.306], [48.416, 28.552], [48.807, 27.689], [49.299, 27.461], [49.470, 27.109], [50.152, 26.689], [50.212, 26.277], [50.113, 25.943], [50.239, 25.608], [50.527, 25.327], [50.660, 24.999], [50.810, 24.754], [50.743, 25.482], [51.013, 26.006], [51.286, 26.114], [51.589, 25.801], [51.606, 25.215], [51.389, 24.627], [51.579, 24.245], [51.757, 24.294], [51.794, 24.019], [52.577, 24.177], [53.404, 24.151], [54.008, 24.121], [54.693, 24.797], [55.439, 25.439], [56.070, 26.055], [56.362, 26.395], [56.485, 26.309], [56.391, 25.895], [56.261, 25.714], [56.396, 24.924], [56.845, 24.241], [57.403, 23.878], [58.136, 23.747], [58.729, 23.565], [59.180, 22.992], [59.450, 22.660], [59.808, 22.533], [59.806, 22.310], [59.442, 21.714], [59.282, 21.433], [58.861, 21.114], [58.487, 20.428], [58.034, 20.481], [57.826, 20.243], [57.665, 19.736], [57.788, 19.067], [57.694, 18.944], [57.234, 18.947], [56.609, 18.574], [56.512, 18.087], [56.283, 17.876], [55.661, 17.884], [55.269, 17.632], [55.274, 17.228], [54.791, 16.950], [54.239, 17.044], [53.570, 16.707], [53.108, 16.651], [52.385, 16.382], [52.191, 15.938], [52.168, 15.597], [51.172, 15.175], [49.574, 14.708], [48.679, 14.003], [48.238, 13.948], [47.938, 14.007], [47.354, 13.592], [46.717, 13.399], [45.877, 13.347], [45.625, 13.290], [45.406, 13.026], [45.144, 12.953], [44.989, 12.699], [44.494, 12.721], [44.175, 12.585], [43.482, 12.636], [43.222, 13.220], [43.251, 13.767], [43.087, 14.062], [42.892, 14.802], [42.604, 15.213], [42.805, 15.261], [42.702, 15.718], [42.823, 15.911], [42.779, 16.347], [42.649, 16.774], [42.347, 17.075], [42.270, 17.474], [41.754, 17.833], [41.221, 18.671], [40.939, 19.486], [40.247, 20.174], [39.801, 20.338], [39.139, 21.291], [39.023, 21.986], [39.066, 22.579], [38.492, 23.688], [38.023, 24.078], [37.483, 24.285], [37.154, 24.858], [37.209, 25.084], [36.931, 25.602], [36.639, 25.826], [36.249, 26.570], [35.640, 27.376], [35.130, 28.063], [34.632, 28.058], [34.787, 28.607], [34.832, 28.957], [34.956, 29.356], [34.922, 29.501], [34.641, 29.099], [34.426, 28.343], [34.154, 27.823], [33.921, 27.648], [33.588, 27.971], [33.136, 28.417], [32.423, 29.851], [32.320, 29.760], [32.734, 28.705], [33.348, 27.699], [34.104, 26.142], [34.473, 25.598], [34.795, 25.033], [35.692, 23.926], [35.493, 23.752], [35.525, 23.102], [36.690, 22.204], [36.866, 22], [37.188, 21.018], [36.969, 20.837], [37.114, 19.807], [37.481, 18.614], [37.862, 18.367], [38.410, 17.998], [38.990, 16.840], [39.266, 15.922], [39.814, 15.435], [41.179, 14.491], [41.734, 13.921], [42.276, 13.343], [42.589, 13.000], [43.081, 12.699], [43.317, 12.390], [43.286, 11.974], [42.715, 11.735], [43.145, 11.462], [43.470, 11.277], [43.666, 10.864], [44.117, 10.445], [44.614, 10.442], [45.556, 10.698], [46.645, 10.816], [47.525, 11.127], [48.021, 11.193], [48.378, 11.375], [48.948, 11.410], [49.267, 11.430], [49.728, 11.578], [50.258, 11.679], [50.732, 12.021], [51.111, 12.024], [51.133, 11.748], [51.041, 11.166], [51.045, 10.640], [50.834, 10.279], [50.552, 9.198], [50.070, 8.081], [49.452, 6.804], [48.594, 5.339], [47.740, 4.219], [46.564, 2.855], [45.563, 2.045], [44.068, 1.052], [43.135, 0.292], [42.041, -0.919], [41.810, -1.446], [41.585, -1.683], [40.884, -2.082], [40.637, -2.49979], [40.263, -2.57309], [40.121, -3.277], [39.800, -3.681], [39.604, -4.346], [39.202, -4.67677], [38.740, -5.908], [38.799, -6.475], [39.440, -6.839], [39.469, -7.099], [39.194, -7.703], [39.252, -8.007], [39.186, -8.485], [39.535, -9.112], [39.949, -10.098], [40.316, -10.317], [40.478, -10.765], [40.437, -11.761], [40.560, -12.639], [40.599, -14.201], [40.775, -14.691], [40.477, -15.406], [40.089, -16.100], [39.452, -16.720], [38.538, -17.101], [37.411, -17.586], [36.281, -18.659], [35.896, -18.842], [35.198, -19.552], [34.786, -19.784], [34.701, -20.497], [35.176, -21.254], [35.373, -21.840], [35.385, -22.140], [35.562, -22.090], [35.533, -23.070], [35.371, -23.535], [35.607, -23.706], [35.458, -24.122], [35.040, -24.478], [34.215, -24.816], [33.013, -25.357], [32.574, -25.727], [32.660, -26.148], [32.915, -26.215], [32.830, -26.742], [32.580, -27.470], [32.462, -28.301], [32.203, -28.752], [31.521, -29.257], [31.325, -29.401], [30.901, -29.909], [30.622, -30.423], [30.055, -31.140], [28.925, -32.172], [28.219, -32.771], [27.464, -33.226], [26.419, -33.614], [25.909, -33.667], [25.780, -33.944], [25.172, -33.796], [24.677, -33.987], [23.594, -33.794], [22.988, -33.916], [22.574, -33.864], [21.542, -34.258], [20.689, -34.417], [20.071, -34.795], [19.616, -34.819], [19.193, -34.462], [18.855, -34.444], [18.424, -33.997], [18.377, -34.136], [18.244, -33.867], [18.250, -33.281], [17.925, -32.611], [18.247, -32.429], [18.221, -31.661], [17.566, -30.725], [17.064, -29.878], [17.062, -29.875], [16.344, -28.576], [15.601, -27.821], [15.210, -27.090], [14.989, -26.117], [14.743, -25.392], [14.408, -23.853], [14.385, -22.656], [14.257, -22.111], [13.868, -21.699], [13.352, -20.872], [12.826, -19.673], [12.608, -19.045], [11.794, -18.069], [11.734, -17.301], [11.640, -16.673], [11.778, -15.793], [12.123, -14.878], [12.175, -14.449], [12.500, -13.547], [12.738, -13.137], [13.312, -12.483], [13.633, -12.038], [13.738, -11.297], [13.686, -10.731], [13.387, -10.373], [13.120, -9.766], [12.875, -9.166], [12.929, -8.959], [13.236, -8.562], [12.933, -7.596], [12.728, -6.927], [12.227, -6.294], [12.322, -6.100], [12.182, -5.789], [11.914, -5.037], [11.093, -3.978], [10.066, -2.969], [9.405, -2.144], [8.797, -1.111], [8.830, -0.779], [9.048, -0.459], [9.291, 0.268], [9.492, 1.010], [9.305, 1.160], [9.649, 2.283], [9.795, 3.073], [9.404, 3.734], [8.948, 3.904], [8.744, 4.352], [8.488, 4.495], [8.500, 4.771], [7.462, 4.412], [7.082, 4.464], [6.698, 4.240], [5.898, 4.262], [5.362, 4.887], [5.033, 5.611], [4.325, 6.270], [3.574, 6.258], [2.691, 6.258], [1.865, 6.142], [1.060, 5.928], [-0.507, 5.343], [-1.063, 5.000], [-1.964, 4.710], [-2.856, 4.994], [-3.311, 4.984], [-4.008, 5.179], [-4.649, 5.168], [-5.834, 4.993], [-6.528, 4.705], [-7.518, 4.338], [-7.712, 4.364], [-7.974, 4.355], [-9.004, 4.832], [-9.913, 5.593], [-10.765, 6.140], [-11.438, 6.785], [-11.708, 6.860], [-12.428, 7.262], [-12.949, 7.798], [-13.124, 8.163], [-13.246, 8.903], [-13.685, 9.494], [-14.074, 9.886], [-14.330, 10.015], [-14.579, 10.214], [-14.693, 10.656], [-14.839, 10.876], [-15.130, 11.040], [-15.664, 11.458], [-16.085, 11.524], [-16.314, 11.806], [-16.308, 11.958], [-16.613, 12.170], [-16.677, 12.384], [-16.841, 13.151], [-16.713, 13.594], [-17.126, 14.373], [-17.625, 14.729], [-17.185, 14.919], [-16.700, 15.621], [-16.463, 16.135], [-16.549, 16.673], [-16.270, 17.166], [-16.146, 18.108], [-16.256, 19.096]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-180, 68.963], [-177.550, 68.199], [-174.928, 67.205], [-175.014, 66.584], [-174.339, 66.335], [-174.571, 67.062], [-171.857, 66.913], [-169.899, 65.977], [-170.891, 65.541], [-172.530, 65.437], [-172.555, 64.460], [-172.955, 64.252], [-173.891, 64.282], [-174.653, 64.631], [-175.983, 64.922], [-176.207, 65.356], [-177.222, 65.520], [-178.359, 65.390], [-178.903, 65.740], [-178.686, 66.112], [-179.883, 65.874], [-179.432, 65.404], [-180, 64.979]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-180, 71.515], [-179.871, 71.557], [-179.024, 71.555], [-177.577, 71.269], [-177.663, 71.132], [-178.693, 70.893], [-180, 70.832]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[180.000, 70.832], [178.903, 70.781], [178.725, 71.098], [180.000, 71.515]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[180, -16.555], [179.364, -16.801], [178.725, -17.012], [178.596, -16.639], [179.096, -16.433], [179.413, -16.379], [180, -16.067]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-61.199, -51.849], [-60.000, -51.249], [-59.149, -51.5], [-58.550, -51.100], [-57.750, -51.549], [-58.050, -51.899], [-59.400, -52.199], [-59.850, -51.849], [-60.699, -52.300], [-61.199, -51.849]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[68.934, -48.625], [69.580, -48.940], [70.525, -49.064], [70.560, -49.254], [70.280, -49.710], [68.745, -49.775], [68.720, -49.242], [68.867, -48.830], [68.934, -48.625]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[178.125, -17.504], [178.373, -17.339], [178.718, -17.628], [178.552, -18.150], [177.932, -18.287], [177.381, -18.164], [177.285, -17.724], [177.670, -17.381], [178.125, -17.504]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-61.680, 10.760], [-61.104, 10.890], [-60.894, 10.854], [-60.934, 10.110], [-61.769, 10.000], [-61.950, 10.089], [-61.659, 10.364], [-61.680, 10.760]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-155.402, 20.079], [-155.224, 19.993], [-155.062, 19.859], [-154.807, 19.508], [-154.831, 19.453], [-155.222, 19.239], [-155.542, 19.083], [-155.688, 18.91619], [-155.936, 19.059], [-155.908, 19.338], [-156.073, 19.702], [-156.023, 19.814], [-155.850, 19.977], [-155.919, 20.173], [-155.861, 20.267], [-155.785, 20.248], [-155.402, 20.079]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-155.995, 20.764], [-156.079, 20.643], [-156.414, 20.572], [-156.586, 20.783], [-156.701, 20.864], [-156.710, 20.926], [-156.612, 21.01249], [-156.257, 20.917], [-155.995, 20.764]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-156.758, 21.176], [-156.789, 21.068], [-157.325, 21.097], [-157.25027, 21.219], [-156.758, 21.176]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-158.025, 21.716], [-157.941, 21.652], [-157.652, 21.322], [-157.707, 21.264], [-157.778, 21.277], [-158.126, 21.312], [-158.253, 21.539], [-158.292, 21.579], [-158.025, 21.716]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-159.365, 22.214], [-159.345, 21.982], [-159.463, 21.882], [-159.800, 22.065], [-159.748, 22.138], [-159.596, 22.236], [-159.365, 22.214]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-78.190, 25.210], [-77.889, 25.170], [-77.540, 24.340], [-77.534, 23.759], [-77.779, 23.710], [-78.034, 24.286], [-78.408, 24.575], [-78.190, 25.210]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-78.980, 26.789], [-78.509, 26.869], [-77.849, 26.840], [-77.819, 26.580], [-78.910, 26.420], [-78.980, 26.789]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-77.789, 27.040], [-77.000, 26.590], [-77.172, 25.879], [-77.356, 26.007], [-77.340, 26.529], [-77.788, 26.925], [-77.789, 27.040]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-64.014, 47.036], [-63.664, 46.550], [-62.939, 46.415], [-62.012, 46.443], [-62.503, 46.033], [-62.874, 45.968], [-64.142, 46.392], [-64.392, 46.727], [-64.014, 47.036]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[46.682, 44.609], [47.675, 45.641], [48.645, 45.806], [49.101, 46.399], [50.034, 46.608], [51.191, 47.048], [52.042, 46.804], [53.042, 46.853], [53.220, 46.234], [53.040, 45.259], [52.167, 45.408], [51.316, 45.245], [51.278, 44.514], [50.305, 44.609], [50.339, 44.284], [50.891, 44.031], [51.342, 43.132], [52.501, 42.792], [52.692, 42.443], [52.446, 42.027], [52.502, 41.783], [52.814, 41.135], [52.916, 41.868], [53.721, 42.123], [54.008, 41.551], [54.736, 40.951], [53.858, 40.631], [52.915, 40.876], [52.693, 40.033], [53.357, 39.975], [53.101, 39.290], [53.880, 38.952], [53.735, 37.906], [53.921, 37.198], [53.825, 36.965], [52.264, 36.700], [50.842, 36.872], [50.147, 37.374], [49.199, 37.582], [48.883, 38.320], [48.856, 38.815], [49.223, 39.049], [49.395, 39.399], [49.569, 40.176], [50.392, 40.256], [50.084, 40.526], [49.618, 40.572], [49.110, 41.282], [48.584, 41.808], [47.492, 42.986], [47.590, 43.660], [46.682, 44.609]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-64.519, 49.873], [-64.173, 49.957], [-62.858, 49.706], [-61.835, 49.288], [-61.806, 49.105], [-62.293, 49.087], [-63.589, 49.400], [-64.519, 49.873]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-80.315, 62.085], [-79.929, 62.385], [-79.520, 62.363], [-79.265, 62.158], [-79.657, 61.633], [-80.099, 61.718], [-80.36215, 62.016], [-80.315, 62.085]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-83.993, 62.452], [-83.250, 62.914], [-81.876, 62.904], [-81.898, 62.710], [-83.068, 62.159], [-83.774, 62.182], [-83.993, 62.452]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-75.215, 67.444], [-75.865, 67.148], [-76.986, 67.098], [-77.236, 67.588], [-76.811, 68.148], [-75.895, 68.287], [-75.114, 68.010], [-75.103, 67.582], [-75.215, 67.444]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-96.557, 69.680], [-95.647, 69.107], [-96.269, 68.757], [-97.617, 69.060], [-98.431, 68.950], [-99.797, 69.400], [-98.917, 69.710], [-98.218, 70.143], [-97.157, 69.860], [-96.557, 69.680]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-106.522, 73.076], [-105.402, 72.672], [-104.774, 71.698], [-104.464, 70.992], [-102.785, 70.497], [-100.980, 70.024], [-101.089, 69.584], [-102.731, 69.504], [-102.093, 69.119], [-102.430, 68.752], [-104.240, 68.909], [-105.960, 69.180], [-107.122, 69.119], [-108.999, 68.780], [-111.534, 68.630], [-113.313, 68.535], [-113.854, 69.007], [-115.220, 69.280], [-116.107, 69.168], [-117.339, 69.960], [-116.674, 70.066], [-115.131, 70.237], [-113.721, 70.192], [-112.416, 70.366], [-114.349, 70.600], [-116.486, 70.520], [-117.904, 70.540], [-118.432, 70.909], [-116.113, 71.309], [-117.655, 71.295], [-119.401, 71.558], [-118.562, 72.307], [-117.866, 72.705], [-115.189, 73.314], [-114.167, 73.121], [-114.666, 72.652], [-112.441, 72.955], [-111.050, 72.450], [-109.920, 72.961], [-109.006, 72.633], [-108.188, 71.650], [-107.685, 72.065], [-108.396, 73.089], [-107.516, 73.235], [-106.522, 73.076]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-79.775, 72.802], [-80.876, 73.333], [-80.833, 73.693], [-80.353, 73.759], [-78.064, 73.651], [-76.339, 73.102], [-76.251, 72.826], [-77.314, 72.855], [-78.391, 72.876], [-79.486, 72.742], [-79.775, 72.802]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[139.863, 73.369], [140.811, 73.765], [142.062, 73.857], [143.482, 73.475], [143.603, 73.212], [142.087, 73.205], [140.038, 73.316], [139.863, 73.369]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[148.222, 75.345], [150.731, 75.084], [149.575, 74.688], [147.977, 74.778], [146.119, 75.172], [146.358, 75.496], [148.222, 75.345]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[138.831, 76.136], [141.471, 76.092], [145.086, 75.562], [144.300, 74.820], [140.613, 74.847], [138.955, 74.611], [136.97439, 75.261], [137.511, 75.949], [138.831, 76.136]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-98.577, 76.588], [-98.500, 76.719], [-97.735, 76.256], [-97.704, 75.743], [-98.159, 74.999], [-99.808, 74.897], [-100.883, 75.057], [-100.862, 75.640], [-102.502, 75.563], [-102.565, 76.336], [-101.489, 76.305], [-99.983, 76.646], [-98.577, 76.588]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[102.837, 79.281], [105.372, 78.713], [105.075, 78.306], [99.438, 77.921], [101.264, 79.233], [102.086, 79.346], [102.837, 79.281]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[93.777, 81.024], [95.940, 81.250], [97.883, 80.746], [100.186, 79.780], [99.939, 78.880], [97.757, 78.756], [94.972, 79.044], [93.312, 79.426], [92.545, 80.143], [91.181, 80.341], [93.777, 81.024]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-96.016, 80.602], [-95.323, 80.907], [-94.298, 80.977], [-94.735, 81.206], [-92.409, 81.257], [-91.132, 80.723], [-87.809, 80.320], [-87.020, 79.660], [-85.814, 79.336], [-87.187, 79.039], [-89.035, 78.287], [-90.804, 78.215], [-92.876, 78.343], [-93.951, 78.751], [-93.935, 79.113], [-93.145, 79.380], [-94.973, 79.372], [-96.076, 79.705], [-96.709, 80.157], [-96.016, 80.602]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-91.587, 81.894], [-90.099, 82.085], [-88.932, 82.117], [-86.970, 82.279], [-85.500, 82.652], [-84.260, 82.600], [-83.180, 82.319], [-82.420, 82.860], [-81.099, 83.020], [-79.306, 83.130], [-76.249, 83.172], [-75.718, 83.064], [-72.831, 83.233], [-70.665, 83.169], [-68.500, 83.106], [-65.827, 83.028], [-63.679, 82.900], [-61.849, 82.628], [-61.893, 82.361], [-64.334, 81.927], [-66.753, 81.725], [-67.657, 81.501], [-65.480, 81.506], [-67.839, 80.900], [-69.469, 80.616], [-71.180, 79.799], [-73.242, 79.634], [-73.879, 79.430], [-76.907, 79.323], [-75.529, 79.197], [-76.220, 79.019], [-75.393, 78.525], [-76.343, 78.182], [-77.888, 77.899], [-78.362, 77.508], [-79.759, 77.209], [-79.619, 76.983], [-77.910, 77.022], [-77.889, 76.777], [-80.561, 76.178], [-83.174, 76.454], [-86.111, 76.299], [-87.600, 76.419], [-89.490, 76.472], [-89.616, 76.952], [-87.767, 77.178], [-88.259, 77.899], [-87.649, 77.970], [-84.976, 77.538], [-86.340, 78.180], [-87.961, 78.371], [-87.151, 78.758], [-85.378, 78.996], [-85.094, 79.345], [-86.507, 79.736], [-86.931, 80.251], [-84.198, 80.208], [-83.408, 80.099], [-81.848, 80.464], [-84.099, 80.580], [-87.598, 80.516], [-89.366, 80.855], [-90.199, 81.260], [-91.367, 81.553], [-91.587, 81.894]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-46.763, 82.627], [-43.406, 83.225], [-39.897, 83.180], [-38.622, 83.549], [-35.087, 83.645], [-27.100, 83.519], [-20.845, 82.726], [-22.691, 82.341], [-26.517, 82.297], [-31.899, 82.199], [-31.396, 82.021], [-27.856, 82.131], [-24.844, 81.786], [-22.903, 82.093], [-22.071, 81.734], [-23.169, 81.152], [-20.623, 81.524], [-15.768, 81.912], [-12.770, 81.718], [-12.208, 81.291], [-16.285, 80.580], [-16.849, 80.350], [-20.046, 80.177], [-17.730, 80.129], [-18.899, 79.400], [-19.704, 78.751], [-19.67353, 77.638], [-18.472, 76.985], [-20.035, 76.944], [-21.67944, 76.627], [-19.834, 76.098], [-19.598, 75.248], [-20.668, 75.155], [-19.372, 74.295], [-21.594, 74.223], [-20.434, 73.817], [-20.762, 73.464], [-22.172, 73.309], [-23.565, 73.306], [-22.313, 72.629], [-22.299, 72.184], [-24.278, 72.597], [-24.792, 72.330], [-23.442, 72.080], [-22.132, 71.468], [-21.753, 70.663], [-23.536, 70.471], [-24.307, 70.856], [-25.543, 71.430], [-25.201, 70.752], [-26.362, 70.226], [-23.727, 70.184], [-22.349, 70.129], [-25.029, 69.258], [-27.747, 68.470], [-30.67371, 68.125], [-31.776, 68.120], [-32.811, 67.735], [-34.201, 66.679], [-36.352, 65.978], [-37.043, 65.937], [-38.375, 65.692], [-39.812, 65.458], [-40.668, 64.839], [-40.682, 64.139], [-41.188, 63.482], [-42.819, 62.682], [-42.416, 61.900], [-42.866, 61.074], [-43.378, 60.097], [-44.787, 60.036], [-46.263, 60.853], [-48.262, 60.858], [-49.233, 61.406], [-49.900, 62.383], [-51.633, 63.626], [-52.140, 64.278], [-52.276, 65.176], [-53.661, 66.099], [-53.301, 66.836], [-53.969, 67.188], [-52.980, 68.357], [-51.475, 68.729], [-51.080, 69.147], [-50.871, 69.929], [-52.013, 69.574], [-52.557, 69.426], [-53.456, 69.283], [-54.683, 69.610], [-54.750, 70.289], [-54.358, 70.821], [-53.431, 70.835], [-51.390, 70.569], [-53.109, 71.204], [-54.004, 71.547], [-54.999, 71.406], [-55.834, 71.654], [-54.718, 72.586], [-55.326, 72.958], [-56.120, 73.649], [-57.323, 74.710], [-58.596, 75.098], [-58.585, 75.517], [-61.268, 76.102], [-63.391, 76.175], [-66.064, 76.134], [-68.504, 76.061], [-69.664, 76.379], [-71.402, 77.008], [-68.776, 77.323], [-66.763, 77.375], [-71.042, 77.635], [-73.296, 78.044], [-73.159, 78.432], [-69.373, 78.913], [-65.710, 79.394], [-65.323, 79.758], [-68.022, 80.117], [-67.151, 80.515], [-63.689, 81.213], [-62.234, 81.321], [-62.651, 81.770], [-60.282, 82.033], [-57.207, 82.190], [-54.134, 82.199], [-53.043, 81.888], [-50.390, 82.438], [-48.003, 82.064], [-46.599, 81.985], [-44.523, 81.660], [-46.900, 82.199], [-46.763, 82.627]]]
    }, {
      "type": "MultiLineString",
      "coordinates": [[[-106.599, 73.600], [-105.260, 73.640], [-104.5, 73.420], [-105.380, 72.760], [-106.939, 73.460], [-106.599, 73.600]]]
    }
  ];
}).call(this);
