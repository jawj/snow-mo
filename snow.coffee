$ ->
  unless window.WebGLRenderingContext and document.createElement('canvas').getContext('experimental-webgl')
    # no point testing for plain 'webgl' context, because Three.js doesn't
    $('#noWebGL').show()
    return
  
  iOS = navigator.appVersion.match(/iPhone|iPad/)
  setTimeout((-> window.location.reload()), 60 * 60 * 1000) if iOS  # work around memory leak?
  
  params = 
    flakes:    200
    speed:     1
    linewidth: 1
    stats:     0
    credits:   1
    inv:       0
    globe:     0
  
  wls = window.location.search
  if wls.length > 0
    (params[kvp.split('=')[0]] = parseInt(kvp.split('=')[1])) for kvp in wls.substring(1).split('&')
  else
    window.location.replace(window.location.href + '?' + ("#{k}=#{v}" for k, v of params).join('&'))
  
  snowColour = if params.inv then 0x666666 else 0xffffff
  globeColour = 0x999999
  bgColour = if params.inv then 0xffffff else 0x000011
  
  snowMaterial  = new THREE.LineBasicMaterial(color: snowColour,  linewidth: params.linewidth)
  globeMaterial = new THREE.LineBasicMaterial(color: globeColour, linewidth: params.linewidth)
  
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
  oneThirdPi = Math.PI / 3
  piOver180 = Math.PI / 180
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
      origV = oldV = null
      while (matches = re.exec(d))?
        [dummy, cmd, x, y] = matches
        c = t.t(x, y)
        newV = v(c[0], c[1], 0)
        if cmd == 'M' then origV = oldV = newV
        else 
          if cmd != 'L' then newV = origV  # Z
          vertices.push(oldV, newV)
          oldV = newV
    vertices
  
  window.verticesFromGeoJSON = (geoJSON, r = 70) ->  # takes a single MULTILINESTRING
    vertices = []
    for line in geoJSON.coordinates
      oldV = null
      for coords in line
        lon = coords[0] * piOver180; lat = coords[1] * piOver180
        sinLat = Math.sin(lat); cosLat = Math.cos(lat); sinLon = Math.sin(lon); cosLon = Math.cos(lon)
        x = r * cosLat * sinLon; y = r * sinLat; z = r * cosLat * cosLon
        newV = v(x, y, z)
        vertices.push(oldV, newV) if oldV
        oldV = newV
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
      c = t.t(0, 0)
      commonV = v(c[0], c[1], 0)
      for kid in @kids
        c = t.t(kid.x, kid.y)
        vertices.push(commonV, v(c[0], c[1], 0))
        kid._vertices(vertices, t, explodeness)
      t.translate(-@x - explodeness, -@y - explodeness)
  
  class Flake
    
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
      @line = new THREE.Line(geom, snowMaterial, THREE.LinePieces)
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

  dvp = window.devicePixelRatio ? 1
  renderer = new THREE.WebGLRenderer(antialias: true)
  camera = new THREE.PerspectiveCamera(33, 1, 1, 10000)  # aspect (2nd param) shortly to be overridden...
  setSize = ->
    renderer.setSize(window.innerWidth * dvp, window.innerHeight * dvp)
    renderer.domElement.style.width = window.innerWidth + 'px'
    renderer.domElement.style.height = window.innerHeight + 'px'
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
  setSize()
  
  document.body.appendChild(renderer.domElement)
  renderer.setClearColorHex(bgColour, 1.0)
  renderer.clear()
  
  scene = new THREE.Scene()
  scene.add(camera)
  scene.fog = new THREE.FogExp2(bgColour, 0.00275)
  
  axialTilt = 23.44 * piOver180
  if params.globe
    globeGeom = new THREE.Geometry()
    # window.globeGeoJSON.coordinates.push([[0,90],[0,-90]])  # show axis
    globeGeom.vertices = verticesFromGeoJSON(window.globeGeoJSON)
    globe = new THREE.Line(globeGeom, globeMaterial, THREE.LinePieces)
    scene.add(globe)
  
  projector = new THREE.Projector()
  
  flakes = flakes = for i in [0...params.flakes]
    flake = new Flake()
    flake.line.position.y = randInRange(flake.yRange)  # random positioning at start
    flake
  
  paused = down = moved = no
  sx = sy = windSpeed = lastTapTime = 0
  last = new Date().getTime()
  camZRange = [300, 50]
  camZ = camZRange[0]
  origCamZoom = null  # for scope
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
      if params.globe
        globe.rotation.y += 0.001
        globe.rotation.x = axialTilt
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
    toggleSpeed() if tapGap < 250 and ev.originalEvent.touches.length < 2
    lastTapTime = now
  $(renderer.domElement).on 'touchstart', doubleTapDetect

  windChange = (ev) -> windSpeed = (ev.clientX / window.innerWidth - 0.5) * 0.125
  $(renderer.domElement).on 'mousemove', windChange

  startCamPan = (ev) ->
    if ev.originalEvent.touches and ev.originalEvent.touches.length != 1  # ? operator not helpful here!
      stopCamPan()
      return
    down = yes
    moved = 0
    sx = (ev.clientX || ev.originalEvent.touches[0].clientX); sy = (ev.clientY || ev.originalEvent.touches[0].clientY)
  $(renderer.domElement).on 'mousedown touchstart touchend touchcancel', startCamPan
  
  stopCamPan = -> 
    down = no
    # momentum?
  $(renderer.domElement).on 'mouseup', stopCamPan
  
  doCamPan = (ev) ->
    if down
      moved += 1
      dx = (ev.clientX || ev.originalEvent.touches[0].clientX) - sx; dy = (ev.clientY || ev.originalEvent.touches[0].clientY) - sy
      rotation = dx * -0.0005 * Math.log(camZ)
      camT.rotate(rotation)
      windT.rotate(rotation)
      updateCamPos()
      sx += dx; sy += dy
  $(renderer.domElement).on 'mousemove touchmove', doCamPan
  
  doCamZoom = (ev, d, dX, dY) ->
    if dY? then camZ -= dY * 5
    else
      newCamZoom = origCamZoom + Math.log(ev.originalEvent.scale)
      camZ = (1 - newCamZoom) * (camZRange[0] - camZRange[1]) + camZRange[1]
    camZ = Math.max(camZ, camZRange[1])
    camZ = Math.min(camZ, camZRange[0])
    updateCamPos()
  $(renderer.domElement).on 'mousewheel gesturechange', doCamZoom
  
  startCamZoom = (ev) ->
    origCamZoom = 1 - (camZ - camZRange[1]) / (camZRange[0] - camZRange[1])  # range: 0 (unzoom) - 1 (full zoom)
    moved = 100  # prevent click recognition (slightly hacky)
  $(renderer.domElement).on 'gesturestart', startCamZoom
