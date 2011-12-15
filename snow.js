(function() {
  var __slice = Array.prototype.slice;
  $(function() {
    var Flake, FlakeFrag, animate, bgColour, camT, camZ, camZRange, camera, doCamPan, doCamZoom, doubleTapDetect, down, dvp, explodeAll, flake, flakeXpode, flakes, globe, globeColour, globeGeom, globeMaterial, halfPi, i, iOS, k, kvp, last, lastTapTime, maxSpeedMultiplier, moved, oneThirdPi, origCamZoom, params, paused, piOver180, projector, randInRange, renderer, scene, setSize, snowColour, snowMaterial, speed, startCamPan, startCamZoom, stats, stopCamPan, sx, sy, togglePause, toggleSpeed, twoPi, updateCamPos, v, verticesFromSVGPaths, windChange, windSpeed, windT, wls, _i, _len, _ref, _ref2;
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
      inv: 0,
      globe: 0
    };
    wls = window.location.search;
    if (wls.length > 0) {
      _ref = wls.substring(1).split('&');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        kvp = _ref[_i];
        params[kvp.split('=')[0]] = parseInt(kvp.split('=')[1]);
      }
    } else {
      window.location.replace(window.location.href + '?' + ((function() {
        var _results;
        _results = [];
        for (k in params) {
          v = params[k];
          _results.push("" + k + "=" + v);
        }
        return _results;
      })()).join('&'));
    }
    snowColour = params.inv ? 0x666666 : 0xffffff;
    globeColour = 0x999999;
    bgColour = params.inv ? 0xffffee : 0x000022;
    snowMaterial = new THREE.LineBasicMaterial({
      color: snowColour,
      linewidth: params.linewidth
    });
    globeMaterial = new THREE.LineBasicMaterial({
      color: globeColour,
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
      var c, cmd, d, ds, dummy, matches, newV, oldV, origV, re, vertices, x, y, _j, _len2;
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
        origV = oldV = null;
        while ((matches = re.exec(d)) != null) {
          dummy = matches[0], cmd = matches[1], x = matches[2], y = matches[3];
          c = t.t(x, y);
          newV = v(c[0], c[1], 0);
          if (cmd === 'M') {
            origV = oldV = newV;
          } else {
            if (cmd !== 'L') {
              newV = origV;
            }
            vertices.push(oldV, newV);
            oldV = newV;
          }
        }
      }
      return vertices;
    };
    window.verticesFromGeoJSON = function(geoJSON, r) {
      var coords, cosLat, cosLon, lat, line, lon, newV, oldV, sinLat, sinLon, vertices, x, y, z, _j, _k, _len2, _len3, _ref2;
      if (r == null) {
        r = 70;
      }
      vertices = [];
      _ref2 = geoJSON.coordinates;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        line = _ref2[_j];
        oldV = null;
        for (_k = 0, _len3 = line.length; _k < _len3; _k++) {
          coords = line[_k];
          lon = coords[0] * piOver180;
          lat = coords[1] * piOver180;
          sinLat = Math.sin(lat);
          cosLat = Math.cos(lat);
          sinLon = Math.sin(lon);
          cosLon = Math.cos(lon);
          x = r * cosLat * sinLon;
          y = r * sinLat;
          z = r * cosLat * cosLon;
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
        var c, commonV, kid, _j, _len2, _ref2;
        if (!this.kids) {
          return;
        }
        t.translate(this.x + explodeness, this.y + explodeness);
        c = t.t(0, 0);
        commonV = v(c[0], c[1], 0);
        _ref2 = this.kids;
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          kid = _ref2[_j];
          c = t.t(kid.x, kid.y);
          vertices.push(commonV, v(c[0], c[1], 0));
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
        this.line = new THREE.Line(geom, snowMaterial, THREE.LinePieces);
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
    renderer.setClearColorHex(bgColour, 1.0);
    renderer.clear();
    scene = new THREE.Scene();
    scene.add(camera);
    scene.fog = new THREE.FogExp2(bgColour, 0.0025);
    if (params.globe) {
      globeGeom = new THREE.Geometry();
      globeGeom.vertices = verticesFromGeoJSON(window.globeGeoJSON);
      globe = new THREE.Line(globeGeom, globeMaterial, THREE.LinePieces);
      globe.rotation.z = 23.44 * piOver180;
      scene.add(globe);
    }
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
        if (params.globe) {
          globe.rotation.y += 0.001;
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
}).call(this);
