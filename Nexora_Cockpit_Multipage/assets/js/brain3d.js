/* Visualizador 3D do cérebro Nexora — carrega o OBJ original (assets/models/brain-obj)
   com three.js, sem fetch/blob/WebAssembly, para funcionar em qualquer hospedagem e via file://. */
(()=>{
  const host=document.querySelector('.core-model');
  if(!host)return;
  const status=host.querySelector('.core-model-status');
  const setStatus=text=>{if(status)status.textContent=text};

  function fallback(reason){
    console.warn('[brain3d]',reason);
    host.innerHTML='<img class="core-image" src="assets/images/nexora-core.png" alt="Núcleo computacional Nexora">';
    host.classList.add('is-fallback');
  }

  if(!window.THREE||!THREE.OBJLoader||!THREE.OrbitControls){fallback('three.js não carregou');return}
  const parts=window.NEXORA_OBJ;
  if(!Array.isArray(parts)||parts.length!==3){fallback('partes do OBJ ausentes');return}

  let renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'})}
  catch(error){fallback('WebGL indisponível: '+error.message);return}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.outputEncoding=THREE.sRGBEncoding;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.1;
  renderer.setClearColor(0x000000,0);
  host.appendChild(renderer.domElement);

  const scene=new THREE.Scene();
  const pmrem=new THREE.PMREMGenerator(renderer);
  scene.environment=pmrem.fromScene(new THREE.RoomEnvironment(),0.04).texture;

  const camera=new THREE.PerspectiveCamera(30,1,0.01,100);
  scene.add(new THREE.HemisphereLight(0xdfe9ff,0x1a0e06,0.5));
  const key=new THREE.DirectionalLight(0xffffff,1.4);key.position.set(2,3,4);scene.add(key);
  const rim=new THREE.DirectionalLight(0xf1904e,1.1);rim.position.set(-3,1.5,-3);scene.add(rim);

  const controls=new THREE.OrbitControls(camera,renderer.domElement);
  controls.enableZoom=false;controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=0.08;
  controls.autoRotate=!matchMedia('(prefers-reduced-motion: reduce)').matches;controls.autoRotateSpeed=1.2;
  controls.minPolarAngle=Math.PI*0.2;controls.maxPolarAngle=Math.PI*0.75;
  renderer.domElement.style.touchAction='pan-y';

  // Texturas do MTL (basecolor, normal, roughness, metallic)
  const textures=new THREE.TextureLoader();
  const embedded=location.protocol==='file:'&&window.NEXORA_BRAIN_TEX;
  const tex=(name,srgb)=>{const t=textures.load(embedded?embedded[name]:'assets/models/brain-obj/'+name+'.jpg',()=>renderer.render(scene,camera));if(srgb)t.encoding=THREE.sRGBEncoding;return t};
  const material=new THREE.MeshStandardMaterial({
    map:tex('basecolor',true),normalMap:tex('normal'),roughnessMap:tex('roughness'),metalnessMap:tex('metallic'),
    roughness:1,metalness:1,envMapIntensity:1.1
  });

  function resize(){
    const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);resize();

  setStatus('Montando modelo 3D…');
  // Libera um quadro para o indicador aparecer antes do parse pesado
  setTimeout(()=>{
    let object;
    try{object=new THREE.OBJLoader().parse(parts.join(''))}
    catch(error){fallback('falha ao ler o OBJ: '+error.message);return}
    window.NEXORA_OBJ=null;

    object.traverse(child=>{
      if(!child.isMesh)return;
      // O OBJ não traz normais: une vértices e calcula normais suaves
      let geometry=child.geometry;geometry.deleteAttribute('normal');
      geometry=THREE.BufferGeometryUtils.mergeVertices(geometry,1e-5);
      geometry.computeVertexNormals();
      child.geometry=geometry;child.material=material;
    });

    // Centraliza e enquadra
    const box=new THREE.Box3().setFromObject(object);
    const size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
    object.position.sub(center);
    const radius=size.length()/2;
    scene.add(object);
    const distance=radius/Math.sin(THREE.MathUtils.degToRad(camera.fov/2))*0.78;
    camera.position.set(Math.sin(0.45)*distance,radius*0.35,Math.cos(0.45)*distance);
    controls.target.set(0,0,0);controls.update();

    host.classList.add('loaded');setStatus('');
    renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera)});
  },30);
})();
