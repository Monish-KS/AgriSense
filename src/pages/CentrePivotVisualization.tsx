declare global {
  interface Window {
    simulator: IrrigationSimulator; // Expose simulator for debugging
  }
}
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'; // Ensure correct path if needed
import type { OrbitControls as OrbitControlsType } from 'three/examples/jsm/controls/OrbitControls.js'; // Import type for controls
import type { GUI as GUIType } from 'three/examples/jsm/libs/lil-gui.module.min.js'; // Import type for GUI

// --- Constants ---
const Colors = {
    SKY: 0x87ceeb,
    GROUND: 0x98bf64,
    POLE_CENTRAL: 0x777777,
    POLE_ROBOT: 0x999999,
    ARM_SEGMENT: 0xC0C0C0,
    NOZZLE: 0x5555ff,
    ROBOT_BASE: 0xaaaaaa,
    ROBOT_WHEEL: 0x333333,
    OBSTACLE_ROCK: 0x888888,
    OBSTACLE_CRATE: 0x8B4513,
    DIRT_TRAIL: 0x8B4513,
    PATH_LINE: 0xffff00,
    LED_ON: 0x00ff00,
    LED_OFF: 0xff0000,
    SOLAR_PANEL: 0x111133,
    ANTENNA: 0xdddddd,
    WEATHER_POLE: 0xcccccc,
    WEATHER_CUPS: 0xffffff,
    CONTROL_PANEL: 0x444444,
    CAM_RGB: 0x222222,
    CAM_THERMAL: 0x552222,
    CROP: 0x228B22,
};

const GeometryDefaults = {
    POLE_RADIUS_CENTRAL: 0.4,
    POLE_RADIUS_ROBOT: 0.3,
    ARM_SEGMENT_RADIUS: 0.3,
    ARM_NOZZLE_RADIUS: 0.2,
    ROBOT_BASE_SIZE: new THREE.Vector3(5, 1.5, 4),
    ROBOT_WHEEL_RADIUS: 1,
    ROBOT_WHEEL_WIDTH: 0.8,
};

// Define interfaces for complex types
interface SimulationParams {
    fieldSize: number;
    maxArmLength: number;
    showMist: boolean;
    robotSpeed: number;
    mistDensity: number;
    numArmSegments: number;
    numSprinklers: number;
    robotMovementMode: 'perimeter' | 'central';
    poleHeight: number;
}

interface RobotState {
    position: THREE.Vector3;
    perimeterAngle: number;
}

interface WaterParticleSystem {
    group: THREE.Group;
    points: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
    geometry: THREE.BufferGeometry;
    material: THREE.PointsMaterial;
    velocities: THREE.Vector3[];
    nozzleRef: THREE.Mesh; // Reference to the nozzle mesh
    particleIndex: number;
    maxParticles: number;
    lifetimes: Float32Array;
    maxLifetime: number;
}

// --- Reusable Materials (Cloned when used) ---
const Materials = {
    STANDARD_METAL_HIGH_ROUGH: new THREE.MeshStandardMaterial({ metalness: 0.8, roughness: 0.6 }),
    STANDARD_METAL_MED_ROUGH: new THREE.MeshStandardMaterial({ metalness: 0.7, roughness: 0.5 }),
    STANDARD_METAL_LOW_ROUGH: new THREE.MeshStandardMaterial({ metalness: 0.9, roughness: 0.3 }),
    STANDARD_ROUGH: new THREE.MeshStandardMaterial({ roughness: 0.8 }),
    STANDARD_VERY_ROUGH: new THREE.MeshStandardMaterial({ roughness: 0.9 }),
};


// --- Irrigation Simulator Class (Now in TypeScript) ---
class IrrigationSimulator {
    // Core Three.js objects
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControlsType;
    clock: THREE.Clock;
    gui: GUIType | null = null; // GUI can be null if not initialized

    // Simulation objects
    robot: THREE.Group | null = null;
    centralPole: THREE.Mesh | null = null;
    robotPole: THREE.Mesh | null = null; // Reference to the pole mesh ON the robot
    pivotArm: THREE.Group | null = null;
    waterParticles: WaterParticleSystem[] = [];
    obstacles: THREE.Mesh[] = [];

    // Environment objects
    field: THREE.Mesh | null = null;
    // skybox: THREE.CubeTexture | null = null; // Removed skybox texture reference
    pathLine: THREE.Line | null = null;
    dirtTrail: THREE.Line | null = null;

    // Lights
    directionalLight: THREE.DirectionalLight;
    ambientLight: THREE.AmbientLight;
    hemisphereLight: THREE.HemisphereLight;

    // State and Parameters
    params: SimulationParams;
    robotBaseHeight: number;
    robotState: RobotState;

    // Connection points
    centralPolePosition: THREE.Vector3;
    centralArmConnectionPoint: THREE.Vector3;
    robotPoleBaseOffset: THREE.Vector3;
    robotArmConnectionWorld: THREE.Vector3;

    // Helper Vectors (avoid recreation)
    tempVector3: THREE.Vector3 = new THREE.Vector3();
    armVector: THREE.Vector3 = new THREE.Vector3();
    xAxis: THREE.Vector3 = new THREE.Vector3(1, 0, 0);
    robotLookAtTarget: THREE.Vector3 = new THREE.Vector3();
    avoidanceVector: THREE.Vector3 = new THREE.Vector3();
    nextPosition: THREE.Vector3 = new THREE.Vector3();
    worldPos: THREE.Vector3 = new THREE.Vector3(); // For mist particle system position

    // Animation loop control
    requestRef: React.MutableRefObject<number | null> = { current: null }; // Ref to store animation frame ID

    // Texture loader
    textureLoader: THREE.TextureLoader;


    constructor(mountElement: HTMLDivElement, initialParams?: Partial<SimulationParams>) {
        // --- Simulation Parameters ---
        this.params = {
            fieldSize: 100,
            maxArmLength: 110,
            showMist: true,
            robotSpeed: 5,
            mistDensity: 12,
            numArmSegments: 10,
            numSprinklers: 10,
            robotMovementMode: 'perimeter',
            poleHeight: 8.0,
            ...initialParams, // Allow overriding defaults
        };

        // --- Robot State ---
        this.robotBaseHeight = 0.75;
        this.robotState = {
            position: new THREE.Vector3(this.params.fieldSize, this.robotBaseHeight, 0),
            perimeterAngle: 0,
        };

        // --- Connection Points (Relative & World) ---
        this.centralPolePosition = new THREE.Vector3(0, 0, 0);
        this.centralArmConnectionPoint = new THREE.Vector3(0, this.params.poleHeight, 0);
        this.robotPoleBaseOffset = new THREE.Vector3(0, 0.5, -2.0);
        this.robotArmConnectionWorld = new THREE.Vector3();

        // --- Initialization ---
        this.textureLoader = new THREE.TextureLoader();
        this.scene = new THREE.Scene();
        // Set background color directly since skybox is removed
        this.scene.background = new THREE.Color(Colors.SKY);
        this.clock = new THREE.Clock();

        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1500);
        // Adjusted initial camera position slightly for a potentially better overview
        this.camera.position.set(this.params.fieldSize * 0.6, this.params.fieldSize * 1.1, this.params.fieldSize * 0.9);
        this.camera.lookAt(0, this.params.poleHeight / 2, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // Ensure correct color space for textures and lighting
        // this.renderer.outputEncoding = THREE.sRGBEncoding; // Deprecated
        this.renderer.outputColorSpace = THREE.SRGBColorSpace; // Use new property
        mountElement.appendChild(this.renderer.domElement); // Append to mount point

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement) as OrbitControlsType;
        this.controls.target.set(0, this.params.poleHeight / 2, 0);
        this.controls.maxDistance = this.params.fieldSize * 3;
        this.controls.minDistance = 10;
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.update();

        // Lighting
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(this.ambientLight);
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
        this.directionalLight.position.set(60, 120, 80);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        const shadowCamSize = this.params.fieldSize * 1.6;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 500;
        this.directionalLight.shadow.camera.left = -shadowCamSize;
        this.directionalLight.shadow.camera.right = shadowCamSize;
        this.directionalLight.shadow.camera.top = shadowCamSize;
        this.directionalLight.shadow.camera.bottom = -shadowCamSize;
        this.directionalLight.shadow.bias = -0.001;
        this.scene.add(this.directionalLight);
        this.hemisphereLight = new THREE.HemisphereLight(Colors.SKY, Colors.GROUND, 0.2);
        this.scene.add(this.hemisphereLight);

        // --- Create Scene Elements ---
        // this._createSkybox(); // Method removed or empty
        this._createField();
        this._createCentralPole();
        this._createRobot();
        this._createPivotArm();
        this._createObstacles();
        this._createPathVisualization();

        // --- Optional GUI ---
        this._setupGUI();

        // --- Event Listeners ---
        window.addEventListener('resize', this._onWindowResize, false); // Use arrow function or bind

        // Initial arm update is crucial
        this.updateArmPositionOrientationLength();

        // Start Animation Loop
        this._animate();
    }

    // --- Scene Element Creation Methods ---

    _createField(): void {
        const soilTexture = this.textureLoader.load('/textures/soil_diffuse.jpg');
        const soilNormalMap = this.textureLoader.load('/textures/soil_normal.jpg');
        const soilBumpMap = this.textureLoader.load('/textures/soil_bump.jpg');
        const wetTexture = this.textureLoader.load('/textures/wet_patch.png');

        // --- Texture Settings ---
        soilTexture.wrapS = soilTexture.wrapT = THREE.RepeatWrapping;
        soilTexture.repeat.set(this.params.fieldSize / 10, this.params.fieldSize / 10);
        soilTexture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        // soilTexture.colorSpace = THREE.SRGBColorSpace; // Ensure correct color space if needed

        soilNormalMap.wrapS = soilNormalMap.wrapT = THREE.RepeatWrapping;
        soilNormalMap.repeat.set(this.params.fieldSize / 10, this.params.fieldSize / 10);
        soilNormalMap.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        // Normal maps should typically be in Linear space, THREE often handles this automatically

        soilBumpMap.wrapS = soilBumpMap.wrapT = THREE.RepeatWrapping;
        soilBumpMap.repeat.set(this.params.fieldSize / 10, this.params.fieldSize / 10);
        soilBumpMap.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

        const fieldGeometry = new THREE.PlaneGeometry(this.params.fieldSize * 2.5, this.params.fieldSize * 2.5);

        // --- CORRECT MATERIAL ---
        const fieldMaterial = new THREE.MeshStandardMaterial({
            map: soilTexture,
            normalMap: soilNormalMap,
            bumpMap: soilBumpMap,
            bumpScale: 0.05,
            roughness: 0.85,
            metalness: 0.05,
            color: Colors.GROUND,
            // normalScale: new THREE.Vector2(0.5, 0.5) // Optional: Adjust normal map intensity
        });
        // --- END CORRECT MATERIAL ---

        this.field = new THREE.Mesh(fieldGeometry, fieldMaterial);
        this.field.rotation.x = -Math.PI / 2;
        this.field.receiveShadow = true; // Ensure it receives shadows
        this.scene.add(this.field);

        // Crops
        const cropMaterial = Materials.STANDARD_VERY_ROUGH.clone();
        cropMaterial.color.set(Colors.CROP);
        const cropGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 6);
        const numRows = 15;
        const cropsPerArc = 50;
        const maxCropRadius = this.params.fieldSize * 1.2;
        for (let i = 1; i < numRows; i++) {
            const radius = (this.params.fieldSize / numRows) * i;
            if (radius > maxCropRadius) continue;
            for (let j = 0; j < cropsPerArc; j++) {
                const angle = (Math.PI * 2 / cropsPerArc) * j + (Math.random() - 0.5) * 0.1;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                if (Math.abs(radius - this.params.fieldSize) < 5 || this.isPositionNearObstacle(x, z, 5)) {
                    continue;
                }
                const crop = new THREE.Mesh(cropGeometry, cropMaterial.clone()); // Clone material per crop for safety
                crop.position.set(x, 0.75, z);
                crop.castShadow = true;
                this.scene.add(crop);
            }
        }
        cropGeometry.dispose(); // Dispose template geometry

        this._createDirtTrail(); // No changes needed

        // Wet Patches
        const wetPatchMaterial = new THREE.MeshStandardMaterial({
            map: wetTexture,
            transparent: true,
            opacity: 0.6,
            roughness: 0.1,
            metalness: 0.0,
            depthWrite: false,
        });
        const wetPatchGeometry = new THREE.CircleGeometry(15, 32);
        const wetPatch1 = new THREE.Mesh(wetPatchGeometry, wetPatchMaterial);
        wetPatch1.rotation.x = -Math.PI / 2;
        wetPatch1.position.set(this.params.fieldSize * 0.5, 0.02, 0);
        wetPatch1.renderOrder = 1; // Ensure it renders correctly over the ground
        this.scene.add(wetPatch1);
        // Remember to dispose wetPatchGeometry and wetPatchMaterial if dynamically removed
    }

    isPositionNearObstacle(x: number, z: number, radiusThreshold: number): boolean {
        this.tempVector3.set(x, 0, z);
        for (const obstacle of this.obstacles) {
            const distSq = this.tempVector3.distanceToSquared(obstacle.position);
            const thresholdSq = Math.pow((obstacle.userData.radius || 1) + radiusThreshold, 2);
            if (distSq < thresholdSq) {
                return true;
            }
        }
        return false;
    }

    _createDirtTrail(): void {
        if (this.dirtTrail) {
            this.scene.remove(this.dirtTrail);
            this.dirtTrail.geometry.dispose();
            (this.dirtTrail.material as THREE.Material).dispose(); // Type assertion
        }
        const trailMaterial = new THREE.LineBasicMaterial({ color: Colors.DIRT_TRAIL }); // linewidth ignored
        const trailPoints: THREE.Vector3[] = [];
        const trailSegments = 100;
        const trailRadius = this.params.fieldSize;
        for (let i = 0; i <= trailSegments; i++) {
            const angle = (Math.PI * 2 / trailSegments) * i;
            trailPoints.push(new THREE.Vector3(Math.cos(angle) * trailRadius, 0.05, Math.sin(angle) * trailRadius));
        }
        const trailGeometry = new THREE.BufferGeometry().setFromPoints(trailPoints);
        this.dirtTrail = new THREE.Line(trailGeometry, trailMaterial);
        this.dirtTrail.visible = this.params.robotMovementMode === 'perimeter';
        this.scene.add(this.dirtTrail);
    }

    _createCentralPole(): void {
        const poleGeo = new THREE.CylinderGeometry(
            GeometryDefaults.POLE_RADIUS_CENTRAL,
            GeometryDefaults.POLE_RADIUS_CENTRAL,
            this.params.poleHeight, 16);
        const poleMat = Materials.STANDARD_METAL_MED_ROUGH.clone();
        poleMat.color.set(Colors.POLE_CENTRAL);

        this.centralPole = new THREE.Mesh(poleGeo, poleMat);
        this.centralPole.position.set(
            this.centralPolePosition.x,
            this.params.poleHeight / 2,
            this.centralPolePosition.z);
        this.centralPole.castShadow = true;
        this.centralPole.receiveShadow = true;
        this.scene.add(this.centralPole);
    }

    _createRobot(): void {
        this.robot = new THREE.Group();
        this.robot.position.copy(this.robotState.position);
        this.robot.userData = {}; // Initialize userData

        this._createRobotBase();
        this._createRobotWheels();
        this._createRobotWeatherStation();
        this._createRobotCameras();
        this._createRobotAntenna();
        this._createRobotLEDs();
        this._createRobotControlPanel();
        this._createRobotPole();

        this.scene.add(this.robot);
    }

    _createRobotBase(): void {
        if (!this.robot) return;
        const baseMat = Materials.STANDARD_METAL_HIGH_ROUGH.clone();
        baseMat.color.set(Colors.ROBOT_BASE);
        const baseGeo = new THREE.BoxGeometry(
            GeometryDefaults.ROBOT_BASE_SIZE.x,
            GeometryDefaults.ROBOT_BASE_SIZE.y,
            GeometryDefaults.ROBOT_BASE_SIZE.z
        );
        const baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.castShadow = true;
        baseMesh.receiveShadow = true;
        baseMesh.position.y = 0;
        this.robot.add(baseMesh);
        this.robot.userData.baseMesh = baseMesh;
    }

    _createRobotWheels(): void {
        if (!this.robot) return;
        const wheelMat = Materials.STANDARD_ROUGH.clone();
        wheelMat.color.set(Colors.ROBOT_WHEEL);
        const wheelGeo = new THREE.CylinderGeometry(
            GeometryDefaults.ROBOT_WHEEL_RADIUS,
            GeometryDefaults.ROBOT_WHEEL_RADIUS,
            GeometryDefaults.ROBOT_WHEEL_WIDTH,
            16);
        const wheelYOffset = -GeometryDefaults.ROBOT_BASE_SIZE.y / 2;
        const wheelXOffset = GeometryDefaults.ROBOT_BASE_SIZE.x / 2;
        const wheelZOffset = GeometryDefaults.ROBOT_BASE_SIZE.z / 2 + GeometryDefaults.ROBOT_WHEEL_WIDTH / 2;
        const wheelPositions = [
            new THREE.Vector3(wheelXOffset, wheelYOffset, wheelZOffset),
            new THREE.Vector3(-wheelXOffset, wheelYOffset, wheelZOffset),
            new THREE.Vector3(wheelXOffset, wheelYOffset, -wheelZOffset),
            new THREE.Vector3(-wheelXOffset, wheelYOffset, -wheelZOffset)
        ];
        this.robot.userData.wheels = [];
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat.clone()); // Clone material per wheel
            wheel.rotation.z = Math.PI / 2;
            wheel.position.copy(pos);
            wheel.castShadow = true;
            this.robot?.add(wheel); // Use optional chaining
            this.robot?.userData.wheels.push(wheel);
        });
        wheelGeo.dispose(); // Dispose geometry once after loop
    }

     _createRobotWeatherStation(): void {
        if (!this.robot) return;
        const stationGroup = new THREE.Group();
        stationGroup.userData = {}; // Init userData
        const baseY = GeometryDefaults.ROBOT_BASE_SIZE.y / 2;
        stationGroup.position.set(1.5, baseY + 0.1, 0);

        const solarPanelGeo = new THREE.BoxGeometry(1.5, 0.1, 1);
        const solarPanelMat = Materials.STANDARD_METAL_MED_ROUGH.clone();
        solarPanelMat.color.set(Colors.SOLAR_PANEL);
        const solarPanel = new THREE.Mesh(solarPanelGeo, solarPanelMat);
        solarPanel.castShadow = true;
        stationGroup.add(solarPanel);

        const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8);
        const poleMat = Materials.STANDARD_METAL_MED_ROUGH.clone();
        poleMat.color.set(Colors.WEATHER_POLE);
        const poleAnem = new THREE.Mesh(poleGeo, poleMat);
        poleAnem.position.y = 0.4;
        poleAnem.castShadow = true;
        stationGroup.add(poleAnem);

        const cupsGroup = new THREE.Group();
        cupsGroup.position.y = 0.8;
        const cupGeo = new THREE.SphereGeometry(0.2, 8, 6);
        const cupMat = new THREE.MeshBasicMaterial({ color: Colors.WEATHER_CUPS }); // Basic material fine here
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const cup = new THREE.Mesh(cupGeo, cupMat); // Reuse is fine for basic mat
            cup.position.set(Math.cos(angle) * 0.5, 0, Math.sin(angle) * 0.5);
            cupsGroup.add(cup);
        }
        poleAnem.add(cupsGroup);
        stationGroup.userData.anemometerCups = cupsGroup;

        this.robot.add(stationGroup);
        this.robot.userData.weatherStation = stationGroup;

        solarPanelGeo.dispose();
        poleGeo.dispose();
        cupGeo.dispose();
    }

    _createRobotCameras(): void {
        if (!this.robot) return;
        const camY = GeometryDefaults.ROBOT_BASE_SIZE.y / 2 - 0.2;
        const camZ = GeometryDefaults.ROBOT_BASE_SIZE.z / 2 + 0.05;
        const cameraGeo = new THREE.BoxGeometry(0.4, 0.3, 0.5);
        const rgbMat = new THREE.MeshStandardMaterial({ color: Colors.CAM_RGB, roughness: 0.1, metalness: 0.2 });
        const thermalMat = new THREE.MeshStandardMaterial({ color: Colors.CAM_THERMAL, roughness: 0.1, metalness: 0.2 });

        const rgbCam = new THREE.Mesh(cameraGeo, rgbMat);
        const thermalCam = new THREE.Mesh(cameraGeo.clone(), thermalMat); // Clone geo for safety

        rgbCam.position.set(-1.5, camY, camZ);
        thermalCam.position.set(1.5, camY, camZ);
        this.robot.add(rgbCam);
        this.robot.add(thermalCam);
        cameraGeo.dispose(); // Dispose template
    }

    _createRobotAntenna(): void {
        if (!this.robot) return;
        const antennaY = GeometryDefaults.ROBOT_BASE_SIZE.y / 2 + 0.6;
        const antennaGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8);
        const antennaMat = Materials.STANDARD_METAL_MED_ROUGH.clone();
        antennaMat.color.set(Colors.ANTENNA);
        const antenna1 = new THREE.Mesh(antennaGeo, antennaMat);
        antenna1.position.set(-2, antennaY, -1.5);
        antenna1.castShadow = true;
        this.robot.add(antenna1);
        antennaGeo.dispose();
    }

    _createRobotLEDs(): void {
        if (!this.robot) return;
        const ledY = GeometryDefaults.ROBOT_BASE_SIZE.y / 2 + 0.1;
        const ledGeo = new THREE.SphereGeometry(0.1, 8, 8);
        const ledMatOn = new THREE.MeshStandardMaterial({ color: Colors.LED_ON, emissive: Colors.LED_ON, emissiveIntensity: 1 });
        const ledMatOff = new THREE.MeshStandardMaterial({ color: Colors.LED_OFF, emissive: Colors.LED_OFF, emissiveIntensity: 0 });

        const led1 = new THREE.Mesh(ledGeo, ledMatOn); // Reuse geo
        const led2 = new THREE.Mesh(ledGeo, ledMatOff.clone()); // Clone blinking material

        led1.position.set(0, ledY, GeometryDefaults.ROBOT_BASE_SIZE.z / 2 + 0.05);
        led2.position.set(GeometryDefaults.ROBOT_BASE_SIZE.x / 2 + 0.05, ledY, 0);
        this.robot.add(led1);
        this.robot.add(led2);
        this.robot.userData.blinkingLED = led2;
        ledGeo.dispose(); // Dispose template
    }

    _createRobotControlPanel(): void {
        if (!this.robot) return;
        const panelY = 0;
        const panelX = GeometryDefaults.ROBOT_BASE_SIZE.x / 2 + 0.1;
        const panelGeo = new THREE.BoxGeometry(0.2, 0.8, 0.6);
        const panelMat = Materials.STANDARD_METAL_HIGH_ROUGH.clone();
        panelMat.color.set(Colors.CONTROL_PANEL);
        const panel = new THREE.Mesh(panelGeo, panelMat);
        panel.position.set(panelX, panelY, 0);
        panel.castShadow = true;
        this.robot.add(panel);
        panelGeo.dispose();
    }

    _createRobotPole(): void {
        if (!this.robot) return;
        const robotPoleGeo = new THREE.CylinderGeometry(
            GeometryDefaults.POLE_RADIUS_ROBOT,
            GeometryDefaults.POLE_RADIUS_ROBOT,
            this.params.poleHeight, 12);
        const robotPoleMat = Materials.STANDARD_METAL_MED_ROUGH.clone();
        robotPoleMat.color.set(Colors.POLE_ROBOT);
        this.robotPole = new THREE.Mesh(robotPoleGeo, robotPoleMat);
        this.robotPole.position.copy(this.robotPoleBaseOffset);
        this.robotPole.position.y += this.params.poleHeight / 2;
        this.robotPole.castShadow = true;
        this.robotPole.receiveShadow = true;
        this.robot.add(this.robotPole);
    }


     _createPivotArm(): void {
        this.pivotArm = new THREE.Group();
        this.pivotArm.userData = {}; // Init userData
        this.pivotArm.position.copy(this.centralArmConnectionPoint);

        const segmentMat = Materials.STANDARD_METAL_LOW_ROUGH.clone(); // Clone base material once
        segmentMat.color.set(Colors.ARM_SEGMENT);
        const nozzleMat = new THREE.MeshStandardMaterial({ color: Colors.NOZZLE, metalness: 0.6, roughness: 0.4 }); // No need to clone if reused

        this.pivotArm.userData.segments = [];
        this.pivotArm.userData.nozzles = [];
        this.waterParticles = []; // Clear existing particles

        const nominalSegmentLength = 1.0;
        const segmentGeo = new THREE.CylinderGeometry(
            GeometryDefaults.ARM_SEGMENT_RADIUS,
            GeometryDefaults.ARM_SEGMENT_RADIUS,
            nominalSegmentLength,
            12);
        segmentGeo.rotateZ(Math.PI / 2);
        segmentGeo.translate(nominalSegmentLength / 2, 0, 0);

        const nozzleGeo = new THREE.SphereGeometry(GeometryDefaults.ARM_NOZZLE_RADIUS, 8, 8);

        for (let i = 0; i < this.params.numArmSegments; i++) {
            // Reuse geometry, use the cloned segmentMat
            const segment = new THREE.Mesh(segmentGeo, segmentMat);
            segment.castShadow = true;
            this.pivotArm.add(segment);
            this.pivotArm.userData.segments.push(segment);

            if (i < this.params.numSprinklers) {
                // Reuse geometry, reuse nozzleMat
                const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
                nozzle.castShadow = true;
                this.pivotArm.add(nozzle);
                this.pivotArm.userData.nozzles.push(nozzle);
                this._createWaterMist(nozzle);
            }
        }

        this.scene.add(this.pivotArm);

        segmentGeo.dispose(); // Dispose template geo
        nozzleGeo.dispose(); // Dispose template geo
    }

     _createWaterMist(nozzle: THREE.Mesh): void {
        const particleCount = 100;
        const positions = new Float32Array(particleCount * 3);
        const alphas = new Float32Array(particleCount);
        const velocities: THREE.Vector3[] = [];
        const lifetimes = new Float32Array(particleCount).fill(Infinity);

        for (let i = 0; i < particleCount; i++) {
            velocities.push(new THREE.Vector3());
        }

        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

        const particleTexture = this.textureLoader.load('/textures/particle.png');
        // particleTexture.colorSpace = THREE.SRGBColorSpace; // Textures used in PointsMaterial usually don't need this

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.2,
            map: particleTexture,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            opacity: 0.7,
            sizeAttenuation: true,
        });

        const points = new THREE.Points(particleGeometry, particleMaterial);
        points.visible = this.params.showMist;

        const particleGroup = new THREE.Group();
        particleGroup.add(points);
        this.scene.add(particleGroup);

        this.waterParticles.push({
            group: particleGroup,
            points: points,
            geometry: particleGeometry,
            material: particleMaterial,
            velocities: velocities,
            nozzleRef: nozzle,
            particleIndex: 0,
            maxParticles: particleCount,
            lifetimes: lifetimes,
            maxLifetime: 1.5,
        });
    }

    // _createSkybox(): void { // Method removed or empty
    // }

    _createObstacles(): void {
        this.obstacles.forEach(obstacle => { // Clean up previous obstacles
             this.scene.remove(obstacle);
             obstacle.geometry.dispose();
             this.disposeMaterial(obstacle.material); // Use helper
        });
        this.obstacles = [];

        // Use unique geometries where possible
        const rockGeo = new THREE.IcosahedronGeometry(3, 1);
        const crateGeo = new THREE.BoxGeometry(4, 4, 4);
        const smallRockGeo = new THREE.IcosahedronGeometry(1.5, 1);
        const knotGeo = new THREE.TorusKnotGeometry( 1.5, 0.4, 100, 16 );

        // Clone materials for obstacles
        const rockMat = Materials.STANDARD_VERY_ROUGH.clone();
        rockMat.color.set(Colors.OBSTACLE_ROCK);
        const crateMat = Materials.STANDARD_ROUGH.clone();
        crateMat.color.set(Colors.OBSTACLE_CRATE);

        const getObstacleRadius = (geo: THREE.BufferGeometry): number => {
            if (!geo.boundingSphere) geo.computeBoundingSphere();
            return geo.boundingSphere?.radius ?? 1;
        };

        const obstacleData = [
            { geo: crateGeo, mat: crateMat, pos: new THREE.Vector3(this.params.fieldSize * 0.95, 2, this.params.fieldSize * 0.1) },
            { geo: rockGeo, mat: rockMat, pos: new THREE.Vector3(this.params.fieldSize * 0.8, 1.5, -this.params.fieldSize * 0.9) },
            { geo: smallRockGeo, mat: rockMat, pos: new THREE.Vector3(this.params.fieldSize * 1.0, 0.75, this.params.fieldSize * 0.3) },
            { geo: crateGeo, mat: crateMat, pos: new THREE.Vector3(-this.params.fieldSize * 0.4, 2, this.params.fieldSize * 0.95) },
            { geo: rockGeo, mat: rockMat, pos: new THREE.Vector3(0, 1.5, -this.params.fieldSize * 1.0) },
            { geo: smallRockGeo, mat: rockMat, pos: new THREE.Vector3(-this.params.fieldSize * 0.9, 0.75, this.params.fieldSize * 0.5) },
            { geo: crateGeo, mat: crateMat, pos: new THREE.Vector3(this.params.fieldSize * 0.3, 2, this.params.fieldSize * 0.98) },
            { geo: knotGeo, mat: rockMat, pos: new THREE.Vector3(-this.params.fieldSize * 0.7, 1.8, -this.params.fieldSize * 0.6) },
        ];

        obstacleData.forEach(data => {
            // Clone material for each mesh if it's shared (like rockMat, crateMat)
            const isRock = data.mat === rockMat;
            const isCrate = data.mat === crateMat;
            const meshMat = isRock ? rockMat.clone() : isCrate ? crateMat.clone() : data.mat; // Clone if needed

            const mesh = new THREE.Mesh(data.geo, meshMat);
            mesh.position.copy(data.pos);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData.radius = getObstacleRadius(data.geo);
            this.scene.add(mesh);
            this.obstacles.push(mesh);
        });

        // Dispose template geometries AND original cloned materials
        rockGeo.dispose();
        crateGeo.dispose();
        smallRockGeo.dispose();
        knotGeo.dispose(); // Dispose unique knot geometry
        rockMat.dispose(); // Dispose the original cloned material
        crateMat.dispose(); // Dispose the original cloned material
    }


     _createPathVisualization(): void {
        if (this.pathLine) {
            this.scene.remove(this.pathLine);
            this.pathLine.geometry.dispose();
            this.disposeMaterial(this.pathLine.material); // Use helper
        }
        const pathMaterial = new THREE.LineDashedMaterial({
            color: Colors.PATH_LINE,
            scale: 1,
            dashSize: 1.5,
            gapSize: 1.0
        });
        const pathPoints: THREE.Vector3[] = [];
        const segments = 100;
        const radius = this.params.fieldSize;
        for (let i = 0; i <= segments; i++) {
            const angle = (Math.PI * 2 / segments) * i;
            pathPoints.push(new THREE.Vector3(Math.cos(angle) * radius, 0.1, Math.sin(angle) * radius));
        }
        const pathGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
        this.pathLine = new THREE.Line(pathGeometry, pathMaterial);
        this.pathLine.computeLineDistances();
        this.pathLine.visible = this.params.robotMovementMode === 'perimeter';
        this.scene.add(this.pathLine);
    }

    // --- Update Methods ---

    updateRobot(deltaTime: number): void {
        if (!this.robot) return;

        if (this.params.robotMovementMode !== 'perimeter') {
            this.tempVector3.set(0, this.robotBaseHeight, 0);
            this.robot.position.lerp(this.tempVector3, 0.05);
            this.robot.lookAt(this.params.fieldSize, this.robotBaseHeight, 0);
            if (this.robot.userData.wheels) {
                this.robot.userData.wheels.forEach((wheel: THREE.Mesh) => {
                    wheel.rotation.x *= 0.95;
                });
            }
            return;
        }

        const perimeterRadius = this.params.fieldSize;
        if (perimeterRadius <= 0) return;

        const angularSpeed = this.params.robotSpeed / perimeterRadius;
        this.robotState.perimeterAngle = (this.robotState.perimeterAngle + angularSpeed * deltaTime) % (2 * Math.PI);

        const nextX = Math.cos(this.robotState.perimeterAngle) * perimeterRadius;
        const nextZ = Math.sin(this.robotState.perimeterAngle) * perimeterRadius;
        this.nextPosition.set(nextX, this.robotBaseHeight, nextZ);

        this.avoidanceVector.set(0, 0, 0);
        let avoiding = false;
        const avoidanceLookAhead = this.params.robotSpeed * 0.5;
        const worldDirection = this.robot.getWorldDirection(this.tempVector3.clone());
        const robotCheckPos = this.robot.position.clone().add(worldDirection.multiplyScalar(avoidanceLookAhead));
        const avoidanceRadius = 8;

        this.obstacles.forEach(obstacle => {
            const dist = robotCheckPos.distanceTo(obstacle.position);
            const effectiveAvoidanceRadius = avoidanceRadius + (obstacle.userData.radius || 1);

            if (dist < effectiveAvoidanceRadius) {
                avoiding = true;
                const awayVector = robotCheckPos.clone().sub(obstacle.position).normalize();
                awayVector.y = 0;
                const avoidanceStrength = (effectiveAvoidanceRadius - dist) / effectiveAvoidanceRadius;
                this.avoidanceVector.add(awayVector.multiplyScalar(avoidanceStrength * this.params.robotSpeed * 0.5));
            }
        });

        const targetPos = this.nextPosition.clone().add(this.avoidanceVector);
        targetPos.y = this.robotBaseHeight;

        this.robot.position.lerp(targetPos, 0.1);

        const lookAheadFactor = avoiding ? 0.05 : 0.3;
        const lookAheadAngle = (this.robotState.perimeterAngle + angularSpeed * lookAheadFactor * Math.sign(this.params.robotSpeed)) % (2 * Math.PI);
        this.robotLookAtTarget.set(
            Math.cos(lookAheadAngle) * perimeterRadius,
            this.robotBaseHeight,
            Math.sin(lookAheadAngle) * perimeterRadius
        );
        if (avoiding) {
            this.robotLookAtTarget.add(this.avoidanceVector.clone().multiplyScalar(0.3));
        }
        this.robot.lookAt(this.robotLookAtTarget);

        if (this.robot.userData.wheels) {
            const wheelCircumference = 2 * Math.PI * GeometryDefaults.ROBOT_WHEEL_RADIUS;
            const distanceMoved = this.robot.position.distanceTo(targetPos) * 0.1; // Approx
            const wheelRotation = wheelCircumference > 0 ? (distanceMoved / wheelCircumference) * (2 * Math.PI) : 0;

            this.robot.userData.wheels.forEach((wheel: THREE.Mesh) => {
                wheel.rotation.x += wheelRotation * Math.sign(this.params.robotSpeed);
            });
        }
    }

    updateArmPositionOrientationLength(): void {
        if (!this.robot || !this.pivotArm || !this.centralPole || !this.robotPole || !this.pivotArm.userData.segments) return;

        this.tempVector3.copy(this.robotPole.position);
        this.tempVector3.y += this.params.poleHeight / 2;
        this.robot.localToWorld(this.robotArmConnectionWorld.copy(this.tempVector3));

        this.armVector.subVectors(this.robotArmConnectionWorld, this.centralArmConnectionPoint);

        const requiredArmLength = this.armVector.length();

        this.pivotArm.position.copy(this.centralArmConnectionPoint);

        if (this.armVector.lengthSq() > 0.0001) {
            this.armVector.normalize();
            this.pivotArm.quaternion.setFromUnitVectors(this.xAxis, this.armVector);
        }

        const numSegmentsTotal = this.pivotArm.userData.segments.length;
        if (numSegmentsTotal === 0) return;

        const segmentLength = requiredArmLength / numSegmentsTotal;
        let currentOffset = 0;

        this.pivotArm.userData.segments.forEach((segment: THREE.Mesh, i: number) => {
            segment.visible = true;
            segment.scale.x = segmentLength; // Scale nominal length of 1
            segment.position.x = currentOffset;

            const nozzle = this.pivotArm?.userData.nozzles[i];
            if (nozzle) {
                // Nozzle position is relative to pivotArm origin, placed at end of current segment
                nozzle.position.set(currentOffset + segmentLength, -GeometryDefaults.ARM_SEGMENT_RADIUS - 0.1, 0);
                nozzle.visible = true;
            }
            currentOffset += segmentLength;
        });

        // Hide extra nozzles if segment count decreased below sprinkler count
        for (let i = this.params.numSprinklers; i < this.pivotArm.userData.nozzles.length; i++) {
             if (this.pivotArm.userData.nozzles[i]) this.pivotArm.userData.nozzles[i].visible = false;
         }
         // Hide nozzles beyond the actual number of segments
         for (let i = numSegmentsTotal; i < this.params.numSprinklers; i++) {
             if (this.pivotArm.userData.nozzles[i]) this.pivotArm.userData.nozzles[i].visible = false;
         }

        this.waterParticles.forEach((system) => {
            system.group.visible = this.params.showMist && system.nozzleRef.visible && system.nozzleRef.parent === this.pivotArm;
        });
    }


    updateWaterMist(deltaTime: number): void {
        if (!this.params.showMist) {
            this.waterParticles.forEach(system => { system.group.visible = false; });
            return;
        }

        this.waterParticles.forEach(system => {
            if (!system.nozzleRef || !system.nozzleRef.visible || system.nozzleRef.parent !== this.pivotArm) {
                system.group.visible = false;
                return;
            }

            system.group.visible = true;

            system.nozzleRef.getWorldPosition(this.worldPos);
            system.group.position.copy(this.worldPos);

            const positions = system.geometry.attributes.position.array as Float32Array;
            const alphas = system.geometry.attributes.alpha.array as Float32Array;
            const lifetimes = system.lifetimes;
            const maxLifetime = system.maxLifetime;
            const gravity = 9.8 * 0.2;

            const particlesToEmit = Math.min(this.params.mistDensity, system.maxParticles);
            for (let i = 0; i < particlesToEmit; i++) {
                const index = system.particleIndex;
                positions[index * 3] = 0; positions[index * 3 + 1] = 0; positions[index * 3 + 2] = 0;
                alphas[index] = 1.0;
                lifetimes[index] = 0;

                system.velocities[index].set(
                    (Math.random() - 0.5) * 0.8,
                    -Math.random() * 1.5 - 0.8,
                    (Math.random() - 0.5) * 0.8
                );
                system.particleIndex = (system.particleIndex + 1) % system.maxParticles;
            }

            for (let i = 0; i < system.maxParticles; i++) {
                if (lifetimes[i] >= maxLifetime) continue;
                lifetimes[i] += deltaTime;
                system.velocities[i].y -= gravity * deltaTime;
                positions[i * 3] += system.velocities[i].x * deltaTime;
                positions[i * 3 + 1] += system.velocities[i].y * deltaTime;
                positions[i * 3 + 2] += system.velocities[i].z * deltaTime;
                const lifeRatio = lifetimes[i] / maxLifetime;
                alphas[i] = Math.max(0, 1.0 - lifeRatio * lifeRatio);
                if (this.worldPos.y + positions[i * 3 + 1] < 0.05) {
                    lifetimes[i] = maxLifetime;
                    alphas[i] = 0;
                }
            }

            system.geometry.attributes.position.needsUpdate = true;
            system.geometry.attributes.alpha.needsUpdate = true;
        });
    }

    // --- Animation Loop ---
    _animate = (): void => {
        this.requestRef.current = requestAnimationFrame(this._animate);

        const deltaTime = this.clock.getDelta();

        this.controls.update();

        this.updateRobot(deltaTime);
        this.updateArmPositionOrientationLength();
        this.updateWaterMist(deltaTime);

        if (this.robot?.userData?.weatherStation?.userData?.anemometerCups) {
            this.robot.userData.weatherStation.userData.anemometerCups.rotation.y += 3 * deltaTime;
        }
        if (this.robot?.userData?.blinkingLED) {
            const blinkSpeed = 1.5;
            const intensity = (Math.sin(this.clock.elapsedTime * blinkSpeed * Math.PI * 2) > 0) ? 1 : 0;
             if (this.robot.userData.blinkingLED.material instanceof THREE.MeshStandardMaterial) {
                 this.robot.userData.blinkingLED.material.emissiveIntensity = intensity;
             }
        }

        this.renderer.render(this.scene, this.camera);
    }

    // --- Event Handlers ---
    _onWindowResize = (): void => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // --- GUI Setup ---
    _setupGUI(): void {
        this.gui = new GUI();
        this.gui.title("Irrigation Controls");

        const generalFolder = this.gui.addFolder('General');
        generalFolder.add(this.params, 'fieldSize', 50, 200, 5).name('Field Radius (m)').onChange((value: number) => {
            this._createPathVisualization();
            this._createDirtTrail();
            if (this.params.robotMovementMode === 'perimeter') {
                this.robotState.position.set(value, this.robotBaseHeight, 0);
                this.robotState.perimeterAngle = 0;
                if (this.robot) this.robot.position.copy(this.robotState.position);
            }
            const shadowCamSize = value * 1.6;
            this.directionalLight.shadow.camera.left = -shadowCamSize;
            this.directionalLight.shadow.camera.right = shadowCamSize;
            this.directionalLight.shadow.camera.top = shadowCamSize;
            this.directionalLight.shadow.camera.bottom = -shadowCamSize;
            this.directionalLight.shadow.camera.updateProjectionMatrix();
            this.updateArmPositionOrientationLength();
        });
        generalFolder.add(this.params, 'poleHeight', 2, 20, 0.5).name('Pole Height (m)').onChange((value: number) => {
            this.centralArmConnectionPoint.y = value;
            if (this.centralPole) {
                this.centralPole.geometry.dispose();
                this.centralPole.geometry = new THREE.CylinderGeometry(GeometryDefaults.POLE_RADIUS_CENTRAL, GeometryDefaults.POLE_RADIUS_CENTRAL, value, 16);
                this.centralPole.position.y = value / 2;
            }
            if (this.robotPole) {
                this.robotPole.geometry.dispose();
                this.robotPole.geometry = new THREE.CylinderGeometry(GeometryDefaults.POLE_RADIUS_ROBOT, GeometryDefaults.POLE_RADIUS_ROBOT, value, 12);
                this.robotPole.position.copy(this.robotPoleBaseOffset);
                this.robotPole.position.y += value / 2;
            }
            this.updateArmPositionOrientationLength();
            this.camera.lookAt(0, value / 2, 0);
            this.controls.target.set(0, value / 2, 0);
        });
        generalFolder.open();

        const robotFolder = this.gui.addFolder('Robot');
        robotFolder.add(this.params, 'robotMovementMode', ['perimeter', 'central']).name('Mode').onChange((mode: 'perimeter' | 'central') => {
            if (mode === 'perimeter') {
                this.robotState.position.set(this.params.fieldSize, this.robotBaseHeight, 0);
                this.robotState.perimeterAngle = 0;
                if (this.robot) this.robot.position.copy(this.robotState.position);
                if (this.pathLine) this.pathLine.visible = true;
                if (this.dirtTrail) this.dirtTrail.visible = true;
            } else {
                if (this.pathLine) this.pathLine.visible = false;
                if (this.dirtTrail) this.dirtTrail.visible = false;
            }
            this.updateArmPositionOrientationLength();
        });
        robotFolder.add(this.params, 'robotSpeed', 1, 20, 0.5).name('Speed (m/s)');
        robotFolder.open();

        const armFolder = this.gui.addFolder('Arm & Irrigation');
        // Define sprinklers controller first to reference it later
        const sprinklersController = armFolder.add(this.params, 'numSprinklers', 1, this.params.numArmSegments, 1).name('# Sprinklers').listen();
        armFolder.add(this.params, 'numArmSegments', 2, 20, 1).name('# Arm Segments').onChange((value: number) => {
             this.params.numSprinklers = Math.min(this.params.numSprinklers, value);
             sprinklersController.max(value).updateDisplay(); // Update max limit and display
             this._recreateArmAndMist();
        });
        sprinklersController.onChange(() => { // Add onChange AFTER defining both controllers
             this._recreateArmAndMist();
        });

        armFolder.add(this.params, 'showMist').name('Show Mist').onChange((value: boolean) => {
            this.waterParticles.forEach(system => {
                system.group.visible = value && system.nozzleRef.visible && system.nozzleRef.parent === this.pivotArm;
            });
        });
        armFolder.add(this.params, 'mistDensity', 1, 50, 1).name('Mist Density/Rate');
        armFolder.open();
    }

    // --- Helper to recreate arm and mist ---
    _recreateArmAndMist(): void {
        console.log("Recreating arm structure...");
        if (this.pivotArm) {
            this.scene.remove(this.pivotArm); // Remove group first
            // Dispose resources *after* removing from scene
             this.pivotArm.traverse(child => {
                 if (child instanceof THREE.Mesh) {
                    child.geometry?.dispose();
                    this.disposeMaterial(child.material); // Use helper
                 }
             });
            this.pivotArm = null;
        }
        this.waterParticles.forEach(system => {
             this.scene.remove(system.group); // Remove group first
             system.geometry.dispose();
             this.disposeMaterial(system.material); // Use helper
        });
        this.waterParticles = [];

        this._createPivotArm(); // Create new arm and associated mist systems
        this.updateArmPositionOrientationLength(); // Update immediately
    }

     // --- Cleanup Method ---
     cleanup(): void {
        console.log("Cleaning up Irrigation Simulator...");

        if (this.requestRef.current) {
            cancelAnimationFrame(this.requestRef.current);
            this.requestRef.current = null;
        }
        window.removeEventListener('resize', this._onWindowResize, false);
        this.gui?.destroy();
        this.controls?.dispose();

        // Dispose scene resources carefully
        // Remove children first to potentially break cycles
        while(this.scene.children.length > 0){
            const object = this.scene.children[0];
            this.scene.remove(object); // Remove from scene

            // Dispose geometry and material
            if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) {
                object.geometry?.dispose();
                this.disposeMaterial(object.material);
            }
             // If it's a group, traverse might be needed if not handled by main loop
            if (object instanceof THREE.Group) {
                object.traverse(child => {
                     if (child instanceof THREE.Mesh || child instanceof THREE.Line || child instanceof THREE.Points) {
                        child.geometry?.dispose();
                        this.disposeMaterial(child.material);
                    }
                })
            }
        }

        // Dispose global cached materials if they were created outside the class scope initially
        // Object.values(Materials).forEach(mat => mat.dispose()); // Uncomment if Materials are truly global

        this.scene.background = null;
        this.renderer.dispose();
        this.renderer.forceContextLoss(); // Help release GPU resources

        console.log("Cleanup complete.");
    }

    // Helper to dispose materials and their textures
    disposeMaterial(material: THREE.Material | THREE.Material[]): void {
        if (!material) return;
        if (Array.isArray(material)) {
            material.forEach(mat => this.disposeSingleMaterial(mat));
        } else {
            this.disposeSingleMaterial(material);
        }
    }

    disposeSingleMaterial(material: THREE.Material): void {
        if (!material) return;
        material.dispose();
        // Dispose textures attached to the material
        for (const key in material) {
            const value = material[key as keyof THREE.Material];
            if (value instanceof THREE.Texture) {
                value.dispose();
            }
        }
    }
}


// --- React Component ---
const IrrigationSimulatorComponent: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);
    const simulatorRef = useRef<IrrigationSimulator | null>(null);

    useEffect(() => {
        // Prevent StrictMode double-invocation issues
        if (!mountRef.current || simulatorRef.current) {
             // console.log("Initialization skipped (Mount ref missing or already initialized)");
            return;
        }

        console.log("Initializing Irrigation Simulator...");
        const simulator = new IrrigationSimulator(mountRef.current);
        simulatorRef.current = simulator;
        // Optional: Expose for debugging
        // (window as any).simulator = simulator;

        // Cleanup function
        return () => {
             console.log("Component unmounting, initiating cleanup...");
             const sim = simulatorRef.current;
             const mountPoint = mountRef.current; // Capture current value

             if (sim) {
                 sim.cleanup(); // Call the class's cleanup method
                 // Attempt to remove canvas only if it exists and is attached
                 if (mountPoint && sim.renderer.domElement && mountPoint.contains(sim.renderer.domElement)) {
                     try {
                         mountPoint.removeChild(sim.renderer.domElement);
                         // console.log("Renderer DOM element removed.");
                     } catch (error) {
                         console.error("Error removing renderer DOM element during cleanup:", error);
                     }
                 }
                 simulatorRef.current = null; // Clear the ref
             }
             // console.log("Cleanup ref cleared.");
        };
    }, []); // Empty dependency array ensures this runs only once on mount and cleanup on unmount

    // Style the mount point to be visible and take up space
    return <div ref={mountRef} style={{ width: '100%', height: '100vh', display: 'block', position: 'relative' }} />;
};

export default IrrigationSimulatorComponent;