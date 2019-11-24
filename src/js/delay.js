import '../scss/style.scss';
import * as THREE from 'three';
import * as controls from 'three-orbit-controls';
const OrbitControls = controls.default(THREE);

//import add from './modules/add';

(function () {
  const lensRad = 75;
  const self = this;
  const canvasSize = { w: 80, h: 60 };
  const basePosition = [0,0,0];
  const gridSize = 10;
  const CAMERA_DISTANCE = 600;
  const SIZE = 1000;
  const shiftCoefficient = 7;
  const circleSize = 100;
  let canvas;
  let canvasCtx;
  let scene, camera, renderer;
  let material, floor;
  let directionalLight, ambientLight;
  let boxes;
  let timer = 0;
  let animSeed = {
    circ: 0,
    circMax: 360
  };
  let imageMatrix;
  let initialized = false;

  // original video
  const video = document.getElementById("video");
  let media = navigator.mediaDevices.getUserMedia({
    video: true,//ビデオを
    video: { facingMode: "environment" },//背面カメラ
    //video: { facingMode: "user" },//インカメラ
    audio: false
  });
  media.then((stream) => { video.srcObject = stream; });

  // canvasPreview
  canvas        = document.createElement('canvas');
  canvas.id     = 'canvas';
  canvas.width  = canvasSize.w;
  canvas.height = canvasSize.h;
  document.getElementById('canvasPreview').appendChild(canvas);

  function initialize() {
    setInterval(()=> {
      capture();
      if (!initialized && imageMatrix.length) {
        initThreeObjects();
      };
      for (let y = 0; y < boxes.length; ++y) {
        for (let x = 0; x < boxes[y].length; ++x) {
          boxes[y][x].layers.r.material.color.setRGB(
            imageMatrix[y][x].r/255,
            imageMatrix[y][x].g/255,
            imageMatrix[y][x].b/255
          );
        }
      }
    }, 30);
  }

  function capture (callback) {
    let ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvasSize.w, canvasSize.h);
    let imageData = ctx.getImageData(0, 0, canvasSize.w, canvasSize.h);
    let width = imageData.width;
    let height = imageData.height;
    let pixels = imageData.data;  // ピクセル配列：RGBA4要素で1ピクセル

    imageMatrix = [];
    for (let y = 0; y < canvasSize.h; ++y) {
      imageMatrix[y] = [];
      for (let x = 0; x < canvasSize.w; ++x) {
        let base = (y * canvasSize.w + x) * 4;
        imageMatrix[y][x] = {
          r: imageData.data[base + 0],
          g: imageData.data[base + 1],
          b: imageData.data[base + 2],
          a: imageData.data[base + 3]
        };
      }
    }
  }

  function initThreeObjects () {
    initialized = true;

    // 1. Scene
    scene = new THREE.Scene();

    // 2. Camera
    const ratio = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(lensRad, ratio, 1, 2400);// (視野角, アスペクト比, near, far)
    camera.position.z = CAMERA_DISTANCE;

    // 6. Lights
    ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    // 7. Renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );
    renderer.shadowMap.enabled = true;

    // 8. Append objects to DOM
    document.getElementById('wrapper').appendChild( renderer.domElement );

    // 9. Boxes
    boxes = [];//return;
    for (let y = 0; y < imageMatrix.length; ++y) {
      boxes[y] = [];
      for (let x = 0; x < imageMatrix[y].length; ++x) {
        boxes[y][x] = [];
        boxes[y][x].layers = { r: {}, g: {}, b: {}};
        boxes[y][x].layers.r.geometry = new THREE.BoxGeometry( gridSize, gridSize, gridSize);
        boxes[y][x].layers.r.material = new THREE.MeshBasicMaterial( {
          color: new THREE.Color(imageMatrix[y][x].r/255, imageMatrix[y][x].g/255, imageMatrix[y][x].b/255)
          , blending: THREE.AdditiveBlending
        });
        boxes[y][x].layers.r.mesh = new THREE.Mesh( boxes[y][x].layers.r.geometry, boxes[y][x].layers.r.material );
        boxes[y][x].layers.r.mesh.position.set(0,0,0);
        scene.add( boxes[y][x].layers.r.mesh );
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
    switch (getParam('mode')) {
      case 'frenzy':
        timer += 6;
      break;
      default:
        timer += 1;
      break;
    }
    animSeed.circ += 0.02;
    if(animSeed.circ > animSeed.circMax) animSeed.circ = 0;
    const radian = timer/2 * Math.PI / 180;

    // objects

    let targetValue;
    for (let y = 0; y < boxes.length; ++y) {
      for (let x = 0; x < boxes[y].length; ++x) {
        let i = canvasSize.w * y + x;//
        let k = (imageMatrix[y][x].r + imageMatrix[y][x].g + imageMatrix[y][x].b)/(255*3);
        switch (getParam('mode')) {
          case 'flat':
            targetValue = {
              x: basePosition[0] + gridSize * (boxes[y].length/-2 + x),
              y: basePosition[1] - gridSize * (boxes.length/-2 + y),
              z: 0,
              size: 1,
              cameraY: CAMERA_DISTANCE/5 * Math.sin(radian)
            }
          break;
          case 'deep':
            targetValue = {
              x: basePosition[0] + gridSize * (boxes[y].length/-2 + x),
              y: basePosition[1] - gridSize * (boxes.length/-2 + y),
              z: basePosition[2] - gridSize * k * 30,
              size: 1,
              cameraY: CAMERA_DISTANCE/5 * Math.sin(radian)
            }
          break;
          case 'frenzy':
            targetValue = {
              x: basePosition[0] + gridSize * (boxes[y].length/-2 + x),
              y: basePosition[1] - gridSize * (boxes.length/-2 + y),
              z: basePosition[2] - gridSize * (k * k) * 100,
              size: (k * k) + 1,
              cameraY: CAMERA_DISTANCE/5 * Math.sin(radian)
            }
          break;
          case 'cathedral':
            targetValue = {
              x: CAMERA_DISTANCE * 1.2 * (Math.cos(i * circleSize)),
              y: CAMERA_DISTANCE/800 * (i/canvasSize.w * canvasSize.h - 0.5) - 1000,
              z: CAMERA_DISTANCE * 1.2 * (Math.sin(i * circleSize)),
              size: 4 + Math.sin(radian)*5,
              cameraY: CAMERA_DISTANCE * Math.sin(radian)
            }
          break;
          default:
          break;
        }
        boxes[y][x].layers.r.mesh.position.set(
          boxes[y][x].layers.r.mesh.position.x + (targetValue.x - boxes[y][x].layers.r.mesh.position.x)/shiftCoefficient,
          boxes[y][x].layers.r.mesh.position.y + (targetValue.y - boxes[y][x].layers.r.mesh.position.y)/shiftCoefficient,
          boxes[y][x].layers.r.mesh.position.z + (targetValue.z - boxes[y][x].layers.r.mesh.position.z)/shiftCoefficient
        );
        boxes[y][x].layers.r.mesh.scale.set(
          targetValue.size,
          targetValue.size,
          targetValue.size
        );
      }
    }

    // camera

    camera.lookAt(new THREE.Vector3(0, 0, 0));
    camera.position.x = CAMERA_DISTANCE * Math.cos(radian);
    camera.position.y = camera.position.y + (targetValue.cameraY - camera.position.y)/shiftCoefficient;
    camera.position.z = CAMERA_DISTANCE * Math.sin(radian);
    //
    renderer.render( scene, camera );
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
