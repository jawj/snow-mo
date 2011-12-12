$ ->
  unless window.WebGLRenderingContext and document.createElement('canvas').getContext('experimental-webgl')
    # no point testing for plain 'webgl' context, because Three.js doesn't
    $('#noWebGL').show()
    return
  
  iOS = navigator.appVersion.match(/iPhone|iPad/)
  
  params = 
    flakes:    125
    speed:     1
    linewidth: 1
    stats:     0
    credits:   1
  (params[kvp.split('=')[0]] = parseInt(kvp.split('=')[1])) for kvp in location.search.substring(1).split('&')
  
  $('#creditInner').html('responds to: <b>swipe</b> — <b>pinch</b> — <b>tap</b> (on snowflake) — <b>double tap</b>') if iOS
  $('#creditOuter').show() if params.credits
  if params.stats
    stats = new Stats()
    stats.domElement.id = 'stats'
    document.body.appendChild(stats.domElement)
  
  # shortcuts
  Transform::t = Transform::transformPoint
  twoPi = Math.PI * 2
  halfPi = Math.PI / 2
  oneThirdPi = Math.PI /3
  v = (x, y, z) -> new THREE.Vertex(new THREE.Vector3(x, y, z))

  randInRange = (range...) ->
    # accepts either 2 numeric args -- min, max -- or one array arg -- [min, max]
    range = range[0] unless typeof(range[0]) == 'number'
    range[0] + Math.random() * (range[1] - range[0])
    
  verticesFromSVGPaths = (svg, t = new Transform()) ->
    # hackily extracts simple line paths, limited to M (move), L (line) and Z (close) commands, from an SVG
    ds = []; re = /d\s*=\s*("|')([^"']+)("|')/g; ds.push(matches[2]) while (matches = re.exec(svg))?
    vertices = []
    for d in ds
      re = /([M|L])\s+(-?[0-9.]+)\s+(-?[0-9.]+)|Z\s+/g
      x0 = y0 = x1 = y1 = null
      while (matches = re.exec(d))?
        [dummy, cmd, x, y] = matches
        if cmd == 'M'
          x0 = x1 = x; y0 = y1 = y
        else 
          if cmd == 'L' then x2 = x; y2 = y
          else x2 = x0; y2 = y0  # Z
          c1 = t.t(x1, y1); c2 = t.t(x2, y2)
          vertices.push(v(c1[0], c1[1], 0), v(c2[0], c2[1], 0))
          x1 = x2; y1 = y2
    vertices
  
  class FlakeFrag
    constructor: (maxLevel, level = 0) ->
      @x = if level == 0 then 0 else Math.random()
      @y = if level == 0 then 0 else Math.random()
      return if level >= maxLevel
      maxKids = if level == 0 then 1 else 3
      @kids = for i in [0..randInRange(1, maxKids)]
        new FlakeFrag(maxLevel, level + 1)
         
    vertices: (scale, explodeness = 0) ->
      vertices = []
      t = new Transform()
      t.scale(scale, scale)
      for j in [1, -1]
        t.scale(1, j)
        for i in [0..5]
          t.rotate(oneThirdPi)
          @_vertices(vertices, t, explodeness)
      vertices
      
    _vertices: (vertices, t, explodeness) ->
      return unless @kids
      t.translate(@x + explodeness, @y + explodeness)
      for kid in @kids
        c1 = t.t(0, 0); c2 = t.t(kid.x, kid.y)
        vertices.push(v(c1[0], c1[1], 0), v(c2[0], c2[1], 0))
        kid._vertices(vertices, t, explodeness)
      t.translate(-@x - explodeness, -@y - explodeness)
  
  class Flake
    lineMaterial: new THREE.LineBasicMaterial(color: 0xffffff, linewidth: params.linewidth)
    
    xRange: [-150, 150]; yRange: [150, -150]; zRange: [-150, 150]
    explodeSpeed: 0.003
    
    t = new Transform(); t.translate(-16, 22); t.scale(0.5, -0.5)  # roughly centre, vertically flip and resize logo
    logo: verticesFromSVGPaths(window.logoSvg, t)
    
    constructor: -> @reset()
    reset: (showOrigin = no) ->
      scene.remove(@line) if @line  # always need a new object, not just __dirtyVertices = yes, because length may have changed (https://github.com/mrdoob/three.js/wiki/Updates)
      @scale = randInRange(3, 6)
      maxLevel = if Math.random() < 0.4 then 3 else 2
      if Math.random() < 0.5 / params.flakes
        @rootFrag = null
        @size = 40
      else 
        @rootFrag = new FlakeFrag(maxLevel)
        @size = 0.67 * @scale * (maxLevel + 1) * 2  # 0.67 is a best guess -- reflecting that flakes won't generally fill their bounds
      @explodingness = @explodedness = 0
      geom = new THREE.Geometry()
      geom.vertices = if @rootFrag then @rootFrag.vertices(@scale) else @logo
      geom.vertices.push(v(-5, 0, 0), v(5, 0, 0), v(0, -5, 0), v(0, 5, 0)) if showOrigin  # for debugging
      @line = new THREE.Line(geom, @lineMaterial, THREE.LinePieces)
      @line.position = new THREE.Vector3(randInRange(@xRange), @yRange[0], randInRange(@zRange))
      @line.rotation = new THREE.Vector3(randInRange(0, twoPi), randInRange(0, twoPi), randInRange(0, twoPi))
      @velocity = new THREE.Vector3(randInRange(-0.002, 0.002),  randInRange(-0.010, -0.011),  randInRange(-0.002, 0.002))
      @rotality = new THREE.Vector3(randInRange(-0.0003, 0.0003), randInRange(-0.0003, 0.0003), randInRange(-0.0003, 0.0003))      
      scene.add(@line)
    
    tick: (dt, wind) ->
      pos = @line.position; vel = @velocity
      pos.x += vel.x * dt + wind[0]; pos.y += vel.y * dt; pos.z += vel.z * dt + wind[1]
      rot = @line.rotation; rly = @rotality
      rot.x += rly.x * dt; rot.y += rly.y * dt; rot.z += rly.z * dt
      # could use Vector3 add/clone/multiplyScalar methods -- but the above is probably faster
      if @rootFrag and @explodingness != 0
        @explodedness += @explodingness * @explodeSpeed * dt
        @line.geometry.vertices = @rootFrag.vertices(@scale, @explodedness)
        @line.geometry.__dirtyVertices = yes
      @reset() if pos.y < @yRange[1]
        
    click: (ev) ->
      if @rootFrag
        @explodingness = if ev.shiftKey then -1 else 1
      else
        window.open('http://casa.ucl.ac.uk', 'casa') unless iOS

  renderer = new THREE.WebGLRenderer(antialias: true)
  camera = new THREE.PerspectiveCamera(33, 1, 1, 10000)  # aspect (2nd param) shortly to be overridden...
  
  setSize = ->
    renderer.setSize(window.innerWidth, window.innerHeight)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
  setSize()
  
  document.body.appendChild(renderer.domElement)
  renderer.setClearColorHex(0x000022, 1.0)
  renderer.clear()
  
  scene = new THREE.Scene()
  scene.add(camera)
  scene.fog = new THREE.FogExp2(0x000022, 0.00265)
  
  projector = new THREE.Projector()
  
  flakes = flakes = for i in [0...params.flakes]
    flake = new Flake()
    flake.line.position.y = randInRange(flake.yRange)  # random positioning at start
    flake
  
  paused = down = moved = no
  sx = sy = windSpeed = lastTapTime = 0
  last = new Date().getTime()
  camZRange = [300, 100]
  camZ = camZRange[0]
  origCamZRelative = null  # for scope
  camT = new Transform()
  windT = new Transform()
  windT.rotate(-halfPi)
  speed = params.speed
  maxSpeedMultiplier = 3
  
  updateCamPos = -> [camera.position.x, camera.position.z] = camT.t(0, camZ)
  
  animate = (t) ->
    dt = (t - last) * speed
    dt = 30 if dt > 1000  # e.g. if someone switched away and then back to this tab
    wind = windT.t(0, windSpeed)
    if not paused
      flake.tick(dt, wind) for flake in flakes
    renderer.clear()
    camera.lookAt(scene.position)
    renderer.render(scene, camera)
    last = t
    window.requestAnimationFrame(animate, renderer.domElement)
    stats.update() if params.stats
  
  updateCamPos()
  animate(new Date().getTime())
  
  $(window).on 'resize', setSize
  
  toggleSpeed = -> speed = if speed == params.speed then params.speed * maxSpeedMultiplier else params.speed
  togglePause = -> paused = not paused
  explodeAll = (ev) -> (flake.click(ev) if flake.rootFrag) for flake in flakes
  
  $(document).on 'keyup', (ev) ->
    return unless ev.keyCode in [32, 80, 27]
    ev.preventDefault()
    switch ev.keyCode
      when 32 then toggleSpeed()   # space
      when 80 then togglePause()   # p
      when 27 then explodeAll(ev)  # esc
  
  flakeXpode = (ev) ->
    return if moved > 3  # number of mousemove events, threshold for deciding user meant to drag not click
    eventX = ev.clientX || ev.originalEvent.touches[0].clientX
    eventY = ev.clientY || ev.originalEvent.touches[0].clientY
    vector = new THREE.Vector3((eventX / window.innerWidth) * 2 - 1, - (eventY / window.innerHeight) * 2 + 1, 0.5)
    projector.unprojectVector(vector, camera)
    ray = new THREE.Ray(camera.position, vector.subSelf(camera.position).normalize())
    meshMaterial = null  # new THREE.MeshBasicMaterial(0x888888)  # material needed only for debugging, since never normally rendered
    meshes = for flake in flakes
      mesh = new THREE.Mesh(new THREE.PlaneGeometry(flake.size, flake.size), meshMaterial)
      mesh.doubleSided = yes
      mesh.position = flake.line.position
      mesh.rotation = flake.line.rotation
      mesh.flake = flake  # for later reference
      scene.add(mesh)
      mesh
    scene.updateMatrixWorld()
    intersects = ray.intersectObjects(meshes)
    if intersects.length
      flake = intersects[0].object.flake
      flake.click(ev)
    scene.remove(mesh) for mesh in meshes
  $(renderer.domElement).on 'click touchend', flakeXpode
  
  doubleTapDetect = (ev) ->
    now = new Date().getTime()
    tapGap = now - lastTapTime
    toggleSpeed() if tapGap < 200 and ev.originalEvent.touches.length < 2
    lastTapTime = now
  $(renderer.domElement).on 'touchstart', doubleTapDetect

  windChange = (ev) -> windSpeed = (ev.clientX / window.innerWidth - 0.5) * 0.125
  $(renderer.domElement).on 'mousemove', windChange

  startCamPan = (ev) ->
    if ev.originalEvent.touches?.length > 1
      stopCamPan()
      return
    down = yes
    moved = 0
    sx = (ev.clientX || ev.originalEvent.touches[0].clientX); sy = (ev.clientY || ev.originalEvent.touches[0].clientY)
  $(renderer.domElement).on 'mousedown touchstart', startCamPan
  
  stopCamPan = -> down = no
  $(renderer.domElement).on 'mouseup touchend touchcancel', stopCamPan
  
  doCamPan = (ev) ->
    if down
      moved += 1
      dx = (ev.clientX || ev.originalEvent.touches[0].clientX) - sx; dy = (ev.clientY || ev.originalEvent.touches[0].clientY) - sy
      rotation = dx * -0.003
      camT.rotate(rotation)
      windT.rotate(rotation)
      updateCamPos()
      sx += dx; sy += dy
  $(renderer.domElement).on 'mousemove touchmove', doCamPan
  
  doCamZoom = (ev, d, dX, dY) ->
    if dY? then camZ -= dY * 5
    else
      newCamZRelative = origCamZRelative + 100 * (ev.originalEvent.scale - 1)
      camZ = 200 + camZRange[1] - newCamZRelative
    camZ = Math.max(camZ, camZRange[1])
    camZ = Math.min(camZ, camZRange[0])
    updateCamPos()
  $(renderer.domElement).on 'mousewheel gesturechange', doCamZoom
  
  startCamZoom = (ev) ->
    origCamZRelative = 200 - (camZ - camZRange[1])  # range: 0 (unzoom) - 200 (full zoom)
    moved = 100  # prevent click recognition (slightly hacky)
  $(renderer.domElement).on 'gesturestart', startCamZoom

window.logoSvg = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" clip-rule="evenodd" stroke-miterlimit="10" viewBox="-0.50 -0.50 64.78 87.72"><desc>SVG generated by Lineform</desc><defs/><path d="M 49.61 69.05 L 49.61 70.70 L 59.95 70.70 L 62.13 72.88 L 62.13 74.38 L 52.27 74.38 L 51.94 74.38 L 51.71 74.62 L 49.03 77.30 L 48.79 77.53 L 48.79 77.89 L 48.79 83.22 L 48.79 83.57 L 49.03 83.81 L 51.71 86.49 L 51.94 86.72 L 52.27 86.72 L 60.30 86.72 L 60.63 86.72 L 60.86 86.49 L 63.54 83.81 L 63.78 83.57 L 63.78 83.22 L 63.78 72.53 L 63.78 72.20 L 63.54 71.94 L 60.86 69.29 L 60.63 69.05 L 60.30 69.05 L 49.61 69.05 Z M 52.62 76.03 L 62.13 76.03 L 62.13 82.86 L 59.95 85.07 L 52.62 85.07 L 50.44 82.86 L 50.44 78.24 L 52.62 76.03 Z M 52.62 76.03 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 11.34 9.92 L 14.17 9.92 L 17.01 12.76 L 17.01 15.59 L 14.17 18.43 L 11.34 18.43 L 8.50 15.59 L 8.50 12.76 Z M 11.34 9.92 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 10.39 19.84 L 13.70 19.84 L 17.01 23.15 L 17.01 26.46 L 13.70 29.76 L 10.39 29.76 L 7.09 26.46 L 7.09 23.15 Z M 10.39 19.84 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 39.69 26.93 L 43.94 26.93 L 48.19 31.18 L 48.19 35.43 L 43.94 39.69 L 39.69 39.69 L 35.43 35.43 L 35.43 31.18 Z M 39.69 26.93 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 50.55 49.61 L 52.91 49.61 L 55.28 51.97 L 55.28 54.33 L 52.91 56.69 L 50.55 56.69 L 48.19 54.33 L 48.19 51.97 Z M 50.55 49.61 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 54.80 5.67 L 57.17 5.67 L 59.53 8.03 L 59.53 10.39 L 57.17 12.76 L 54.80 12.76 L 52.44 10.39 L 52.44 8.03 Z M 54.80 5.67 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 40.16 5.67 L 43.46 5.67 L 46.77 8.98 L 46.77 12.28 L 43.46 15.59 L 40.16 15.59 L 36.85 12.28 L 36.85 8.98 Z M 40.16 5.67 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 50.55 17.01 L 54.33 17.01 L 58.11 20.79 L 58.11 24.57 L 54.33 28.35 L 50.55 28.35 L 46.77 24.57 L 46.77 20.79 Z M 50.55 17.01 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 34.72 31.18 L 31.18 27.40 L 31.18 23.62 L 34.96 19.84 L 38.74 19.84 L 42.52 23.62 L 42.52 26.93 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 57.17 32.60 L 59.06 32.60 L 60.94 34.49 L 60.94 36.38 L 59.06 38.27 L 57.17 38.27 L 55.28 36.38 L 55.28 34.49 Z M 57.17 32.60 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 43.46 45.35 L 44.41 45.35 L 45.35 46.30 L 45.35 47.24 L 44.41 48.19 L 43.46 48.19 L 42.52 47.24 L 42.52 46.30 Z M 43.46 45.35 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 15.59 39.69 L 18.43 39.69 L 21.26 42.52 L 21.26 45.35 L 18.43 48.19 L 15.59 48.19 L 12.76 45.35 L 12.76 42.52 Z M 15.59 39.69 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 28.35 63.78 L 30.71 60.94 L 34.49 60.94 L 36.85 63.78 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 0.00 50.31 L 2.13 52.44 L 2.13 56.69 L 0.00 58.82 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 0.00 59.53 L 4.25 63.78 L 59.53 63.78 L 63.78 59.53 L 63.78 4.25 L 59.53 0.00 L 4.25 0.00 L 0.00 4.25 Z M 0.00 59.53 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 30.24 2.83 L 32.13 2.83 L 34.02 4.72 L 34.02 6.61 L 32.13 8.50 L 30.24 8.50 L 28.35 6.61 L 28.35 4.72 Z M 30.24 2.83 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 17.01 12.76 L 28.35 6.38 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 17.01 15.59 L 31.18 24.09 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 46.77 9.92 L 52.44 9.92 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 38.27 19.84 L 40.39 15.59 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 41.10 21.97 L 41.81 15.59 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 42.52 24.09 L 46.77 22.68 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 53.86 28.35 L 57.40 32.60 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 9.92 29.06 L 0.00 50.31 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 13.46 29.76 L 16.30 39.69 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 31.89 60.94 L 14.88 28.35 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 21.26 43.94 L 42.52 46.77 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 39.69 39.69 L 34.02 60.94 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 44.65 38.98 L 51.02 49.61 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 48.19 54.57 L 36.14 63.07 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 2.13 54.57 L 29.06 63.07 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 19.13 47.48 L 30.47 60.94 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 3.86 69.05 L 3.59 69.29 L 0.94 71.94 L 0.71 72.20 L 0.71 72.53 L 0.71 83.22 L 0.71 83.57 L 0.94 83.81 L 3.59 86.49 L 3.86 86.72 L 4.18 86.72 L 12.22 86.72 L 12.22 85.07 L 4.54 85.07 L 2.36 82.86 L 2.36 72.88 L 4.54 70.70 L 12.22 70.70 L 12.22 69.05 L 4.18 69.05 L 3.86 69.05 Z M 3.86 69.05 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 14.89 69.05 L 14.89 70.70 L 25.23 70.70 L 27.43 72.88 L 27.43 74.38 L 17.57 74.38 L 17.22 74.38 L 16.98 74.62 L 14.30 77.30 L 14.06 77.53 L 14.06 77.89 L 14.06 83.22 L 14.06 83.57 L 14.30 83.81 L 16.98 86.49 L 17.22 86.72 L 17.57 86.72 L 25.58 86.72 L 25.93 86.72 L 26.17 86.49 L 28.85 83.81 L 29.08 83.57 L 29.08 83.22 L 29.08 72.53 L 29.08 72.20 L 28.85 71.94 L 26.17 69.29 L 25.93 69.05 L 25.58 69.05 L 14.89 69.05 Z M 17.92 76.03 L 27.43 76.03 L 27.43 82.86 L 25.23 85.07 L 17.92 85.07 L 15.71 82.86 L 15.71 78.24 L 17.92 76.03 Z M 17.92 76.03 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 34.61 69.05 L 34.34 69.29 L 31.69 71.94 L 31.43 72.20 L 31.43 72.53 L 31.43 75.21 L 31.43 75.56 L 31.69 75.80 L 34.34 78.48 L 34.61 78.71 L 34.93 78.71 L 42.59 78.71 L 44.80 80.89 L 44.80 82.86 L 42.59 85.07 L 32.25 85.07 L 32.25 86.72 L 42.94 86.72 L 43.30 86.72 L 43.53 86.49 L 46.21 83.81 L 46.45 83.57 L 46.45 83.22 L 46.45 80.57 L 46.45 80.21 L 46.21 79.98 L 43.53 77.30 L 43.30 77.06 L 42.94 77.06 L 35.29 77.06 L 33.11 74.88 L 33.11 72.85 L 35.29 70.70 L 45.62 70.70 L 45.62 69.05 L 34.93 69.05 L 34.61 69.05 Z M 34.61 69.05 " stroke="#000000" stroke-width="0.25" fill="none"/><path d="M 34.72 31.18 L 35.43 31.18 " stroke="#000000" stroke-width="0.25" fill="none"/></svg>'