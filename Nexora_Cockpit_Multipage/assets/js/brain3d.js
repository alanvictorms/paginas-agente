/* Visualizador 3D do cérebro Nexora — carrega o GLB original (assets/models/brain-hologram/brain_hologram.glb)
   com three.js. O arquivo vem embutido em base64 (2 partes) para funcionar sem fetch/blob/WebAssembly,
   em qualquer hospedagem e também via file://. */
(()=>{
window.NexoraBrain3D=function(host){
  if(!host||host.dataset.mounted)return;host.dataset.mounted='1';
  const status=host.querySelector('.core-model-status');
  const setStatus=text=>{if(status)status.textContent=text};

  function fallback(reason){
    console.warn('[brain3d]',reason);
    host.innerHTML='<img class="core-image" src="assets/images/nexora-core.png" alt="Núcleo computacional Nexora">';
    host.classList.add('is-fallback');
  }

  if(!window.THREE||!THREE.GLTFLoader||!THREE.OrbitControls){fallback('three.js não carregou');return}
  const parts=window.NEXORA_GLB;
  if(!Array.isArray(parts)||parts.length!==2){fallback('partes do GLB ausentes');return}

  let renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'})}
  catch(error){fallback('WebGL indisponível: '+error.message);return}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.outputEncoding=THREE.sRGBEncoding;
  renderer.setClearColor(0x000000,0);
  host.appendChild(renderer.domElement);

  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(30,1,0.01,100);
  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;

  const controls=new THREE.OrbitControls(camera,renderer.domElement);
  controls.enableZoom=false;controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=0.08;
  controls.minPolarAngle=Math.PI*0.2;controls.maxPolarAngle=Math.PI*0.75;
  renderer.domElement.style.touchAction='pan-y';

  function resize(){
    const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);resize();

  setStatus('Montando modelo 3D…');
  setTimeout(()=>{
    let buffer;
    try{
      const binary=atob(parts.join(''));window.NEXORA_GLB=null;
      const bytes=new Uint8Array(binary.length);
      for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
      buffer=bytes.buffer;
    }catch(error){fallback('falha ao decodificar o GLB: '+error.message);return}

    new THREE.GLTFLoader().parse(buffer,'',gltf=>{
      const model=gltf.scene;
      // Holograma: partículas emissivas somadas com brilho aditivo
      model.traverse(child=>{
        if(!child.isMesh)return;
        const material=child.material;
        material.transparent=true;material.depthWrite=false;material.blending=THREE.AdditiveBlending;
      });

      const box=new THREE.Box3().setFromObject(model);
      const size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      scene.add(model);
      const radius=size.length()/2;
      const distance=radius/Math.sin(THREE.MathUtils.degToRad(camera.fov/2))*0.62;
      camera.position.set(Math.sin(0.35)*distance,radius*0.2,Math.cos(0.35)*distance);
      controls.target.set(0,0,0);controls.update();

      // Animação original do arquivo (rotação do holograma)
      const mixer=new THREE.AnimationMixer(model);
      if(!reduceMotion)gltf.animations.forEach(clip=>mixer.clipAction(clip).play());
      const clock=new THREE.Clock();

      host.classList.add('loaded');setStatus('');
      renderer.setAnimationLoop(()=>{mixer.update(clock.getDelta());controls.update();renderer.render(scene,camera)});
    },error=>fallback('falha ao ler o GLB: '+(error?.message||error)));
  },30);
};
const home=document.querySelector('.core-stage .core-model');
if(home)window.NexoraBrain3D(home);
})();
