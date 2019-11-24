import '../scss/style.scss';
import * as THREE from 'three';
import * as controls from 'three-orbit-controls';
const OrbitControls = controls.default(THREE);

//import add from './modules/add';

(function () {

  const letter = getParam('letter');
  const filePath = document.getElementById('photo').getAttribute('src');//'color.png';
  const basePosition = [0,0,0];
  const gridSize = 10;
  let animSeed = {
    circ: 0,
    circMax: 360
  };

  let scene, camera, renderer;
  let material, floor;
  let directionalLight, ambientLight;
  let boxes;

  function initialize() {
    getImageData(initThreeObjects);
  }

  function getImageData (callback) {
    let imageMatrix = [];
    let cvs = document.getElementById('canvas1');
    let ctx = cvs.getContext('2d');
    let img = new Image();
    img.src = filePath;
    img.onload = function() {
      ctx.drawImage(img, 0, 0, 80, 60);
      let imageData = ctx.getImageData(0, 0, cvs.width, cvs.height);
      let width = imageData.width;
      let height = imageData.height;
      let pixels = imageData.data;  // ピクセル配列：RGBA4要素で1ピクセル
      for (let y = 0; y < height; ++y) {
        imageMatrix[y] = [];
        for (let x = 0; x < width; ++x) {
          let base = (y * width + x) * 4;
          imageMatrix[y][x] = {
            r: imageData.data[base + 0],
            g: imageData.data[base + 1],
            b: imageData.data[base + 2],
            a: imageData.data[base + 3]
          };
        }
      }
      callback(imageMatrix)
    }
  }

  /* NOTE: [ hierarchy image ]
    renderer.domElement
      - Scene
        - Camera
        - Light
        - Mesh (Geometry, Material)
  */

  function initThreeObjects (imageMatrix) {

    // 1. Scene
    scene = new THREE.Scene();

    // 2. Camera
    const ratio = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera( 90, ratio, 1, 2400);// (視野角, アスペクト比, near, far)
    camera.position.z = 500;

    // 3. Floor
    // floor = new THREE.GridHelper(10000, 80);
    // floor.material.color = new THREE.Color(0x999999);
    // floor.position.set(0, -300, 0);
    // scene.add(floor);

    // 4. Materials
    material = new THREE.MeshBasicMaterial( {color: 0x999999, wireframe: true} );

    // 6. Lights
    ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set( -1000, 1000, 0);
    scene.add(directionalLight);

    // 7. Renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );
    renderer.shadowMap.enabled = true;

    // 8. Append objects to DOM
    document.getElementById('wrapper').appendChild( renderer.domElement );

    // 9. Color
    boxes = [];
    for (let y = 0; y < imageMatrix.length; ++y) {
      boxes[y] = [];
      for (let x = 0; x < imageMatrix[y].length; ++x) {
        boxes[y][x] = [];
        boxes[y][x].layers = { r: {}, g: {}, b: {}};
        // R
        boxes[y][x].layers.r.geometry = new THREE.BoxGeometry( gridSize, gridSize, gridSize);
        boxes[y][x].layers.r.material = new THREE.MeshBasicMaterial( {
          color: new THREE.Color(imageMatrix[y][x].r/255, 0, 0),
          blending: THREE.AdditiveBlending
        });
        boxes[y][x].layers.r.mesh = new THREE.Mesh( boxes[y][x].layers.r.geometry, boxes[y][x].layers.r.material );
        scene.add( boxes[y][x].layers.r.mesh );
        // G
        boxes[y][x].layers.g.geometry = new THREE.BoxGeometry( gridSize, gridSize, gridSize);
        boxes[y][x].layers.g.material = new THREE.MeshBasicMaterial( {
          color: new THREE.Color(0, imageMatrix[y][x].g/255, 0),
          blending: THREE.AdditiveBlending
        });
        boxes[y][x].layers.g.mesh = new THREE.Mesh( boxes[y][x].layers.g.geometry, boxes[y][x].layers.g.material );
        scene.add( boxes[y][x].layers.g.mesh );
        // B
        boxes[y][x].layers.b.geometry = new THREE.BoxGeometry( gridSize, gridSize, gridSize);
        boxes[y][x].layers.b.material = new THREE.MeshBasicMaterial( {
          color: new THREE.Color(0, 0, imageMatrix[y][x].b/255),
          blending: THREE.AdditiveBlending
        });
        boxes[y][x].layers.b.mesh = new THREE.Mesh( boxes[y][x].layers.b.geometry, boxes[y][x].layers.b.material );
        scene.add( boxes[y][x].layers.b.mesh );
      }
    }

    // 9. Controls
    let controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = false;

    // 10. Run the world
    requestAnimationFrame( run );
  }

  function run () {
    renderer.render( scene, camera );
    //
    animSeed.circ += 0.02;
    if(animSeed.circ > animSeed.circMax) animSeed.circ = 0;

    let dotIndexGap;

    for (let y = 0; y < boxes.length; ++y) {
      for (let x = 0; x < boxes[y].length; ++x) {
        if (getParam('mode') == 1) {
          // R
          boxes[y][x].layers.r.mesh.position.set(
            basePosition[0] + gridSize * (boxes[y].length/-2 + x),
            basePosition[1] - gridSize * (boxes.length/-2 + y),
            basePosition[2] + gridSize * Math.sin(animSeed.circ) * 4
          );
          // G
          boxes[y][x].layers.g.mesh.position.set(
            basePosition[0] + gridSize * (boxes[y].length/-2 + x),
            basePosition[1] - gridSize * (boxes.length/-2 + y),
            basePosition[2] - gridSize * Math.cos(animSeed.circ) * 4
          );
        } else if (getParam('mode') == 2) {
          // R
          boxes[y][x].layers.r.mesh.scale.set(
            Math.sin(animSeed.circ) * 1.4,
            Math.sin(animSeed.circ) * 1.4,
            Math.sin(animSeed.circ) * 1.4
          );
          // G
          boxes[y][x].layers.g.mesh.scale.set(
            Math.cos(animSeed.circ) * 1.4,
            Math.cos(animSeed.circ) * 1.4,
            Math.cos(animSeed.circ) * 1.4
          );
        } else if (getParam('mode') == 3) {
          dotIndexGap = (y * boxes.length + x) / boxes.length*boxes[y].length;// ratio
          // G
          boxes[y][x].layers.g.mesh.position.set(
            basePosition[0] + gridSize * (boxes[y].length/-2 + x),
            basePosition[1] - gridSize * (boxes.length/-2 + y),
            basePosition[2] + gridSize * Math.sin(animSeed.circ * dotIndexGap/Math.PI + 180) * 2
          );
          // B
          boxes[y][x].layers.b.mesh.position.set(
            basePosition[0] + gridSize * (boxes[y].length/-2 + x),
            basePosition[1] - gridSize * (boxes.length/-2 + y),
            basePosition[2] + gridSize * Math.sin(animSeed.circ * dotIndexGap/Math.PI ) * 2
          );
        } else {
          // R
          boxes[y][x].layers.r.mesh.scale.set(1,1,1);
          boxes[y][x].layers.r.mesh.position.set(
            basePosition[0] + gridSize * (boxes[y].length/-2 + x),
            basePosition[1] - gridSize * (boxes.length/-2 + y),
            basePosition[2] - gridSize * 2
          );
          // G
          boxes[y][x].layers.g.mesh.scale.set(1,1,1);
          boxes[y][x].layers.g.mesh.position.set(
            basePosition[0] + gridSize * (boxes[y].length/-2 + x),
            basePosition[1] - gridSize * (boxes.length/-2 + y),
            basePosition[2] - gridSize * 1
          );
          // B
          boxes[y][x].layers.b.mesh.scale.set(1,1,1);
          boxes[y][x].layers.b.mesh.position.set(
            basePosition[0] + gridSize * (boxes[y].length/-2 + x),
            basePosition[1] - gridSize * (boxes.length/-2 + y),
            basePosition[2] - gridSize * 0
          );
        }
      }
    }
    requestAnimationFrame( run );
  }

  function setParticleState() {

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

  initialize();
})();
