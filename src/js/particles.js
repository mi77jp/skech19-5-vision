import '../scss/style.scss';
import * as THREE from 'three';
import * as controls from 'three-orbit-controls';
const OrbitControls = controls.default(THREE);

(function () {

  const SIZE = 2000;// 配置する範囲
  const LENGTH = 1000;// 配置する個数
  const shiftCoefficient = 5;
  const circleSize = LENGTH/10;

  let loader, scene, camera, renderer, controls, geometry, material, mesh;
  let timer, randomVertices;

  function init (texture) {

    // 1. Scene
    scene = new THREE.Scene();

    // 2. Camera
    camera = new THREE.PerspectiveCamera(90, window.innerWidth/window.innerHeight);// (視野角, アスペクト比, near, far)

    // 7. Renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );
    renderer.shadowMap.enabled = true;

    // 8. Append objects to DOM
    document.getElementById('wrapper').appendChild( renderer.domElement );

    // 9. Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = false;

    // 10. Particles
    geometry = new THREE.Geometry();
    material = new THREE.PointsMaterial({
      map: texture,
      size: 8,
      color: 0xFFFFFF,
    });
    mesh = new THREE.Points(geometry, material);

    randomVertices = [];
    timer = 0;
    for (let i = 0; i < LENGTH; i++) {
      randomVertices[i] = new THREE.Vector3(
        SIZE * (Math.random() - 0.5),
        SIZE * (Math.random() - 0.5),
        SIZE * (Math.random() - 0.5)
      );
      geometry.vertices[i] = randomVertices[i];
    }
    scene.add(mesh);

    // 11. Run
    requestAnimationFrame( run );
  }

  function run () {
    geometry.verticesNeedUpdate = true;
    timer += 1;
    //
    for (let i = 0; i < LENGTH; i++) {
      let targetVector;
      let particleVector;
      switch (getParam('mode')) {

        case 'spiral':
        targetVector = new THREE.Vector3(
          SIZE/4 * (Math.cos(i * circleSize)),
          SIZE/4 * (Math.sin(i * circleSize)),
          SIZE * (i/LENGTH - 0.5),
        );
        break;

        default:
          targetVector = randomVertices[i];
        break;
      }
      particleVector = new THREE.Vector3(
        geometry.vertices[i].x + (targetVector.x - geometry.vertices[i].x)/shiftCoefficient,
        geometry.vertices[i].y + (targetVector.y - geometry.vertices[i].y)/shiftCoefficient,
        geometry.vertices[i].z + (targetVector.z - geometry.vertices[i].z)/shiftCoefficient
      );
      geometry.vertices[i] = particleVector;
    }
    //
    const radian = timer/2 * Math.PI / 180;
    const farFromCenter = SIZE*0.6;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    camera.position.x = farFromCenter * Math.cos(radian);
    camera.position.z = farFromCenter * Math.sin(radian);
    //
    renderer.render(scene, camera);
    requestAnimationFrame( run );
  }

  function getParam(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  // run
  loader = new THREE.TextureLoader();
  loader.load(document.getElementById('particle').getAttribute('src'), texture => {
    init(texture);
  });
})();
