import * as THREE from "three";
import { Curved2Geometry } from "./synapseGeometry";
import { NEURON_RADIUS } from "./main";
import { FBM } from "three-noise";

const SYNAPSE_COOLDOWN = 32;

const blackMaterial = new THREE.MeshBasicMaterial( { color: 'black' } );
const inactivematerial = new THREE.MeshBasicMaterial({color: 0x101B7E});
const activematerial = new THREE.MeshBasicMaterial({color: 0xDA3F07});
const darkerMaterial = new THREE.MeshBasicMaterial({color: 0x9F2D04});
const darkestMaterial = new THREE.MeshBasicMaterial({color: 0x631C03});
const darkesestMaterial = new THREE.MeshBasicMaterial({color: 0x280B01});

const fbm = new FBM({
    seed: Math.random(),
    scale: 0.06,
    octaves: 8,
    persistance: 0.9,
    lacunarity: 2,
    redistribution: 1,
    height: 0,
});

export class Synapse {
    constructor(a, b) {
        this.a = a;
        this.b = b;
        this.mesh = null;
        this.active = false;
        this.activated = false;
        this.activatedFrom = null;
        this.synapseCooldown = 0;

        this.a.addSynapse(this);
        this.b.addSynapse(this);
    }

    isActivatable() {
        return this.synapseCooldown <= 0;
    }

    activate(sourceNeuron) {
        if (this.synapseCooldown > 0) return;
        this.activated = true;
        this.activatedFrom = sourceNeuron;
        this.synapseCooldown = SYNAPSE_COOLDOWN;
    }

    update() {
        if (this.active) {
            if (this.activatedFrom == this.a) {
                this.b.activate();
            } else {
                this.a.activate();
            }
        }
    }


    
    setMaterial(bloomPass) {
        if (bloomPass && SYNAPSE_COOLDOWN - this.synapseCooldown >= 8) {
            this.mesh.material = blackMaterial;
            return;
        } 
        
        if (this.active) {
            this.mesh.material = activematerial;
        } else {
            if (SYNAPSE_COOLDOWN - this.synapseCooldown < 3) {
                this.mesh.material = darkerMaterial;
            } else if (SYNAPSE_COOLDOWN - this.synapseCooldown < 5) {
                this.mesh.material = darkestMaterial;
            } else if (SYNAPSE_COOLDOWN - this.synapseCooldown < 8) {
                this.mesh.material = darkesestMaterial;
            } else {
                this.mesh.material = inactivematerial;
            }
        }    
    }

    changeState() {
        this.synapseCooldown--;
        if (this.activated) {
            this.active = true;
            this.activated = false;
            return;
        }

        if (this.active) {
            this.active = false;
        }
    }


    getMesh() {
        const segments = 6.0;

        let start = new THREE.Vector3(this.a.position.x * 20, this.a.position.y * 20, this.a.position.z * 20);
        let end = new THREE.Vector3(this.b.position.x * 20, this.b.position.y * 20, this.b.position.z * 20);
        let vector = new THREE.Vector3().subVectors(end, start);

        let cross1 = new THREE.Vector3().crossVectors(vector, new THREE.Vector3(0, 0, 1));
        cross1.normalize();
        let cross2 = new THREE.Vector3().crossVectors(vector, cross1);
        cross2.normalize();

        let design = [[ 18, 'ffc', 8, 0, 60, 120, 180, 240, 300 ]];
        for (let i = 0; i <= segments; i++) {
            let t = i / segments;
            let point = new THREE.Vector3(start.x + vector.x * t, start.y + vector.y * t, start.z + vector.z * t);
            let offset = new THREE.Vector3();
            if (i != 0 && i != segments) {
                let noise1 = fbm.get3(point);
                let noise2 = fbm.get3(new THREE.Vector3().addVectors(point, new THREE.Vector3(25, -25, 0))); 

                offset.addScaledVector(cross1, noise1);
                offset.addScaledVector(cross2, noise2);
            }

            let width = (NEURON_RADIUS + 0.01) - 0.0185 * ((segments / 2) - Math.abs(i - segments / 2)) - 0.04;
            point = point.add(offset);
            design.push([point.x, point.y, point.z, width, width, width, width, width, width]);
        }

        let geo = Curved2Geometry(design);  
		let mesh = new THREE.Mesh( geo, inactivematerial );
        this.mesh = mesh;
        this.mesh.userData = { neuron: null, synapse: this };
		return mesh;
    }
}