import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { Neuron } from "./neuron";
import { Synapse } from "./synapse";

export const NEURON_RADIUS = 0.11;

var neurons = [];
var synapses = [];

const updateLength = 0.015;
const clock = new THREE.Clock(true);
const canvas = document.querySelector("canvas.webgl");
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
window.addEventListener( 'pointerdown', onPointerDown );
window.addEventListener("touchstart", onPointerDown );

var time = updateLength;

document.documentElement.style.overflow = 'hidden';
document.body.scroll = "no";


const params = {
	threshold: 0,
	strength: 1.0,
	radius: 0.1,
	exposure: 1
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);
camera.position.z = 40;
camera.position.y = 25;

const renderer = new THREE.WebGLRenderer( { antialias: true, canvas: canvas } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
const renderScene = new RenderPass( scene, camera );

const bloomPass = new UnrealBloomPass( new THREE.Vector2(window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
bloomPass.threshold = params.threshold;
bloomPass.strength = params.strength;
bloomPass.radius = params.radius;

const bloomComposer = new EffectComposer( renderer );
bloomComposer.setSize(2 * window.innerWidth, 2 * window.innerHeight);
bloomComposer.renderToScreen = false;
bloomComposer.addPass( renderScene );
bloomComposer.addPass( bloomPass );

const mixPass = new ShaderPass(
	new THREE.ShaderMaterial( {
		uniforms: {
			baseTexture: { value: null },
			bloomTexture: { value: bloomComposer.renderTarget2.texture }
		},
		vertexShader: document.getElementById( 'vertexshader' ).textContent,
		fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
		defines: {}
	} ), 'baseTexture'
);
mixPass.needsSwap = true;

const outputPass = new OutputPass();

const finalComposer = new EffectComposer( renderer );
finalComposer.addPass( renderScene );
finalComposer.addPass( mixPass );
finalComposer.addPass( outputPass );

document.body.appendChild( renderer.domElement );

const controls = new OrbitControls( camera, renderer.domElement );
controls.enablePan = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.0;

controls.update();

const loader = new OBJLoader();
loader.load(
	'models/BrainFinal.obj',
	function ( object ) {
		let points = object.children[0].geometry.attributes.position;	
        for(let i = 0;i < points.count; i++){
            let p = new THREE.Vector3().fromBufferAttribute(points, i); // set p from `position`
            
            let dupe = false;
            for (let j = 0; j < neurons.length; j++) {
                if (neurons[j].distance(p) < 0.01) {
                    dupe = true;
                    break;
                }
            }
            
            if (!dupe) {
                neurons.push(new Neuron(p));
            }
        }

        const edges = new THREE.EdgesGeometry( object.children[0].geometry ); 
        for(let i = 0; i < edges.attributes.position.count; i += 2){
            let p1 = new THREE.Vector3().fromBufferAttribute(edges.attributes.position, i);
            let p2 = new THREE.Vector3().fromBufferAttribute(edges.attributes.position, i + 1);

			let n1 = null;
			let n2 = null;
			for (let neuron of neurons) {
				if (neuron.distance(p1) < 0.00001) {
					n1 = neuron;
				}

				if (neuron.distance(p2) < 0.00001) {
					n2 = neuron;
				}
			}

            if (n1 != null && n2 != null) {
				let s = new Synapse(n1, n2);
				synapses.push(s);
			}
        }
		

        for (let neuron of neurons) {
            scene.add(neuron.getMesh());
        }

		for (let synapse of synapses) {
			scene.add(synapse.getMesh());
		}

		neurons[1].activate(neurons[1].synapses[1], 4);	
		neurons[0].activate(neurons[0].synapses[1], 4);			
	}
);


function updateAgents() {
	for (let neuron of neurons) {
		neuron.update();
	}

	for (let synapse of synapses) {
		synapse.update();
	}

	for (let neuron of neurons) {
		neuron.changeState();
	}

	for (let synapse of synapses) {
		synapse.changeState();
	}
}

function renderTwoPass() {
	for (let neuron of neurons) {
		neuron.setMaterial(true);
	}

	for (let synapse of synapses) {
		synapse.setMaterial(true);
	}

	bloomComposer.render();

	for (let neuron of neurons) {
		neuron.setMaterial(false);
	}

	for (let synapse of synapses) {
		synapse.setMaterial(false);
	}

	finalComposer.render();
}

function animate() {

	requestAnimationFrame( animate );

	time -= clock.getDelta();

	if (time < 0.0) {
		time = updateLength;
		updateAgents();
	}

	controls.update();
	renderTwoPass();
}

animate();


window.onresize = function () {

	const width = window.innerWidth;
	const height = window.innerHeight;

	camera.aspect = width / height;
	camera.updateProjectionMatrix();

	renderer.setSize( width, height );

	bloomComposer.setSize( width, height );
	finalComposer.setSize( width, height );
};


function onPointerDown( event ) {

	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

	raycaster.setFromCamera( mouse, camera );
	const intersects = raycaster.intersectObjects( scene.children, false );
	
	if ( intersects.length > 0 ) {
		if (intersects[0].object.userData.neuron != null) {
			intersects[0].object.userData.neuron.activationCooldown = 0;
			intersects[0].object.userData.neuron.activate(10);
		} else if (intersects[0].object.userData.synapse != null) {
			intersects[0].object.userData.synapse.synapseCooldown = 0;
			intersects[0].object.userData.synapse.activate(null);
		}
	}
}