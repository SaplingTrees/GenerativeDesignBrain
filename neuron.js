import * as THREE from "three";
import { NEURON_RADIUS } from "./main";

const ACTIVATION_COOLDOWN = 4.0;
const POTENTIAL_THRESHOLD = 1.0;

const blackMaterial = new THREE.MeshBasicMaterial( { color: 'black' } );
const inactivematerial = new THREE.MeshBasicMaterial({color: 0x1B44DA});

const activematerial = new THREE.MeshBasicMaterial({color: 0xECA400});
const darkerMaterial = new THREE.MeshBasicMaterial({color: 0xB88100});
const darkestMaterial = new THREE.MeshBasicMaterial({color: 0x7A5600});
const darkesestMaterial = new THREE.MeshBasicMaterial({color: 0x291D00});

export class Neuron {
    constructor(position) {
        this.threshold = POTENTIAL_THRESHOLD;
        this.position = position;
		this.synapses = [];
        this.activated = false;
		this.active = false;
        this.mesh = null;
        this.activationCooldown = 0;

        this.activationPotential = 0;
        this.potential = 0;
        this.inactive = 0;
	}

    activate(strength = 1.0) {
        if (this.activationCooldown > 0) return; 
        this.activated = true;
        this.potential += strength;
    }

	update() {       
        if (this.active) {
            for (let i = 0; i < this.synapses.length; i++) {
                this.synapses[i].activate(this);
            }
        }
	}
    
    changeState() {     
        if (Math.random() > 0.99995) {
            this.potential += 5.0;
            this.activated = true;
        }
        
        this.activationCooldown--;
        if (this.potential >= this.threshold && this.activated) {
            this.threshold += Math.random() * 8.0;
            this.active = true;
            this.activationPotential = this.potential;
            this.potential = 0.0;
            this.inactive = 0;
            this.activationCooldown = ACTIVATION_COOLDOWN;
            return;
        } else if (this.active) {
            this.active = false;
            this.activationPotential = 0.0;
        } else {
            this.inactive++;

            if (this.inactive > 3) {
                this.threshold -= Math.random() / 16.0;
            }
        }

        this.activated = false;
    }

    setMaterial(bloomPass) {     
        if (bloomPass && this.inactive >= 8) {
            this.mesh.material = blackMaterial;
            return;
        } 
        
        if (this.active) {
            this.mesh.material = activematerial;
        } else {
            if (this.inactive < 3) {
                this.mesh.material = darkerMaterial;
            } else if (this.inactive < 5) {
                this.mesh.material = darkestMaterial;
            } else if (this.inactive < 8) {
                this.mesh.material = darkesestMaterial;
            } else {
                this.mesh.material = inactivematerial;
            }
        }    
    }


	addSynapse(synapse) {
		this.synapses.push(synapse);
	}

    equals(neuron) {
        return this.distance(neuron.position) < 0.0001;
    }

    distance(p) {
        return Math.sqrt((p.x - this.position.x) * (p.x - this.position.x) + (p.y - this.position.y) * (p.y - this.position.y) + (p.z - this.position.z) * (p.z - this.position.z));
    }

    getMesh() {
        let sphereGeometry = new THREE.SphereGeometry(NEURON_RADIUS, 8, 8);
        let mesh = new THREE.Mesh(sphereGeometry, inactivematerial);
        mesh.position.x = this.position.x * 20;
        mesh.position.y = this.position.y * 20;
        mesh.position.z = this.position.z * 20;
        this.mesh = mesh;
        this.mesh.userData = { neuron: this, synapse: null };
        return mesh;
    }
}