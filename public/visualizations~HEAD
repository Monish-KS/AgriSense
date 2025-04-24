import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// --- Constants ---
const Colors = {
    SKY: 0x87ceeb,
    GROUND: 0x98bf64, // A greener tone
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
    // Add more if needed...
};

const Materials = {
    STANDARD_METAL_HIGH_ROUGH: new THREE.MeshStandardMaterial({ metalness: 0.8, roughness: 0.6 }),
    STANDARD_METAL_MED_ROUGH: new THREE.MeshStandardMaterial({ metalness: 0.7, roughness: 0.5 }),
    STANDARD_METAL_LOW_ROUGH: new THREE.MeshStandardMaterial({ metalness: 0.9, roughness: 0.3 }),
    STANDARD_ROUGH: new THREE.MeshStandardMaterial({ roughness: 0.8 }),
    STANDARD_VERY_ROUGH: new THREE.MeshStandardMaterial({ roughness: 0.9 }),
    // Cache common materials
};

class IrrigationSimulator {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = null;
        this.gui = null;

        this.robot = null;
        this.centralPole = null;
        this.robotPole = null; // Reference to the pole mesh ON the robot
        this.pivotArm = null;
        this.waterParticles = [];
        this.obstacles = [];

        this.field = null;
        this.skybox = null;
        this.pathLine = null;
        this.dirtTrail = null;

        this.directionalLight = null;
        this.ambientLight = null;

        // --- Simulation Parameters ---
        this.params = {
            fieldSize: 100,
            maxArmLength: 110, // Still relevant as a conceptual limit, though calculated dynamically
            showMist: true,
            robotSpeed: 5,
            mistDensity: 12, // Particles emitted per frame per nozzle
            numArmSegments: 10,
            numSprinklers: 10, // Should be <= numArmSegments
            robotMovementMode: 'perimeter', // 'perimeter' or 'central'
            poleHeight: 8.0,
        };

        // --- Robot State ---
        this.robotBaseHeight = 0.75; // Y position of the robot base center
        this.robotState = {
            position: new THREE.Vector3(this.params.fieldSize, this.robotBaseHeight, 0),
            perimeterAngle: 0,
        };

        // --- Connection Points (Relative & World) ---
        this.centralPolePosition = new THREE.Vector3(0, 0, 0); // Base of central pole
        this.centralArmConnectionPoint = new THREE.Vector3(0, this.params.poleHeight, 0); // Top of central pole (world space)
        this.robotPoleBaseOffset = new THREE.Vector3(0, 0.5, -2.0); // Local offset on robot base for pole's bottom center
        this.robotArmConnectionWorld = new THREE.Vector3(); // Top of robot pole (calculated world space)

        // --- Helper Vectors (avoid recreation) ---
        this.tempVector3 = new THREE.Vector3();
        this.armVector = new THREE.Vector3();
        this.xAxis = new THREE.Vector3(1, 0, 0);
        this.robotLookAtTarget = new THREE.Vector3();
        this.avoidanceVector = new THREE.Vector3();
        this.nextPosition = new THREE.Vector3();
        this.worldPos = new THREE.Vector3(); // For mist particle system position


        this.init();
    }

    // --- Initialization ---
    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(Colors.SKY);
        this.clock = new THREE.Clock();

        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1500);
        this.camera.position.set(this.params.fieldSize * 0.8, this.params.fieldSize * 0.9, this.params.fieldSize * 0.8);
        this.camera.lookAt(0, this.params.poleHeight / 2, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
        document.body.appendChild(this.renderer.domElement);

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, this.params.poleHeight / 2, 0);
        this.controls.maxDistance = this.params.fieldSize * 3;
        this.controls.minDistance = 10;
        this.controls.enableDamping = true; // Smoother interaction
        this.controls.dampingFactor = 0.05;
        this.controls.update();

        // Lighting
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Slightly brighter ambient
        this.scene.add(this.ambientLight);
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.8); // Slightly stronger directional
        this.directionalLight.position.set(60, 120, 80); // Adjusted angle
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        const shadowCamSize = this.params.fieldSize * 1.6; // Slightly larger shadow area
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 500;
        this.directionalLight.shadow.camera.left = -shadowCamSize;
        this.directionalLight.shadow.camera.right = shadowCamSize;
        this.directionalLight.shadow.camera.top = shadowCamSize;
        this.directionalLight.shadow.camera.bottom = -shadowCamSize;
        this.directionalLight.shadow.bias = -0.001; // Mitigate shadow acne
        this.scene.add(this.directionalLight);
        // Optional: Add a HemisphereLight for softer ambient feel
        const hemisphereLight = new THREE.HemisphereLight(Colors.SKY, Colors.GROUND, 0.2);
        this.scene.add(hemisphereLight);


        // --- Create Scene Elements ---
        this._createSkybox();
        this._createField();
        this._createCentralPole();
        this._createRobot(); // Includes the robot's pole
        this._createPivotArm();
        this._createObstacles();
        this._createPathVisualization();

        // --- Optional GUI ---
        this._setupGUI();

        // --- Event Listeners ---
        window.addEventListener('resize', this._onWindowResize.bind(this), false); // Bind 'this'

        // Initial arm update is crucial
        this.updateArmPositionOrientationLength();

        // Start Animation Loop
        this._animate();
    }

    // --- Scene Element Creation Methods (Private Convention) ---

    _createField() {
        const textureLoader = new THREE.TextureLoader();
        const soilTexture = textureLoader.load('textures/soil_diffuse.jpg');
        const soilNormalMap = textureLoader.load('textures/soil_normal.jpg');
        const soilBumpMap = textureLoader.load('textures/soil_bump.jpg'); // Optional bump map
        const wetTexture = textureLoader.load('textures/wet_patch.png');

        soilTexture.wrapS = soilTexture.wrapT = THREE.RepeatWrapping;
        soilTexture.repeat.set(this.params.fieldSize / 10, this.params.fieldSize / 10);
        soilNormalMap.wrapS = soilNormalMap.wrapT = THREE.RepeatWrapping;
        soilNormalMap.repeat.set(this.params.fieldSize / 10, this.params.fieldSize / 10);
        soilBumpMap.wrapS = soilBumpMap.wrapT = THREE.RepeatWrapping;
        soilBumpMap.repeat.set(this.params.fieldSize / 10, this.params.fieldSize / 10);


        const fieldGeometry = new THREE.PlaneGeometry(this.params.fieldSize * 2.5, this.params.fieldSize * 2.5);
        const fieldMaterial = new THREE.MeshStandardMaterial({
            map: soilTexture,
            normalMap: soilNormalMap,
            bumpMap: soilBumpMap, // Add bump map
            bumpScale: 0.05,       // Subtle bump
            roughness: 0.85,      // Less reflective soil
            metalness: 0.05,
            color: Colors.GROUND // Base color tint
        });
        this.field = new THREE.Mesh(fieldGeometry, fieldMaterial);
        this.field.rotation.x = -Math.PI / 2;
        this.field.receiveShadow = true;
        this.scene.add(this.field);

        // Crops
        const cropMaterial = Materials.STANDARD_VERY_ROUGH.clone();
        cropMaterial.color.set(Colors.CROP);
        const cropGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 6); // Simple crops
        const numRows = 15;
        const cropsPerArc = 50;
        const maxCropRadius = this.params.fieldSize * 1.2; // Don't go too far out
        for (let i = 1; i < numRows; i++) {
            const radius = (this.params.fieldSize / numRows) * i;
            if (radius > maxCropRadius) continue;
            for (let j = 0; j < cropsPerArc; j++) {
                const angle = (Math.PI * 2 / cropsPerArc) * j + (Math.random() - 0.5) * 0.1; // Slight randomness
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                // Basic check to avoid placing crops directly on the path/obstacles (approximate)
                if (Math.abs(radius - this.params.fieldSize) < 5 || this.isPositionNearObstacle(x, z, 5)) {
                     continue;
                }

                const crop = new THREE.Mesh(cropGeometry, cropMaterial); // Reuse geometry, clone material if needed for variations later
                crop.position.set(x, 0.75, z);
                crop.castShadow = true;
                this.scene.add(crop);
            }
        }
        cropGeometry.dispose(); // Dispose once after loop

        // Dirt Trail
        this._createDirtTrail();

        // Wet Patches (Example)
        const wetPatchMaterial = new THREE.MeshStandardMaterial({
            map: wetTexture,
            transparent: true,
            opacity: 0.6,
            roughness: 0.1,
            metalness: 0.0,
            depthWrite: false, // Render after opaque objects
        });
        const wetPatchGeometry = new THREE.CircleGeometry(15, 32);
        const wetPatch1 = new THREE.Mesh(wetPatchGeometry, wetPatchMaterial);
        wetPatch1.rotation.x = -Math.PI / 2;
        wetPatch1.position.set(this.params.fieldSize * 0.5, 0.02, 0);
        wetPatch1.renderOrder = 1; // Ensure it renders correctly over the ground
        this.scene.add(wetPatch1);
        // Note: Consider disposing geometry/material if patches are dynamically added/removed
    }

     // --- Helper to check proximity to obstacles ---
    isPositionNearObstacle(x, z, radiusThreshold) {
        this.tempVector3.set(x, 0, z); // Reuse vector
        for (const obstacle of this.obstacles) {
            const distSq = this.tempVector3.distanceToSquared(obstacle.position);
            const thresholdSq = Math.pow((obstacle.userData.radius || 1) + radiusThreshold, 2);
            if (distSq < thresholdSq) {
                return true;
            }
        }
        return false;
    }

    _createDirtTrail() {
        if (this.dirtTrail) {
            this.scene.remove(this.dirtTrail);
            this.dirtTrail.geometry.dispose();
            this.dirtTrail.material.dispose();
        }
        const trailMaterial = new THREE.LineBasicMaterial({ color: Colors.DIRT_TRAIL, linewidth: 3 }); // Linewidth might not work on all platforms
        const trailPoints = [];
        const trailSegments = 100;
        const trailRadius = this.params.fieldSize;
        for (let i = 0; i <= trailSegments; i++) {
            const angle = (Math.PI * 2 / trailSegments) * i;
            trailPoints.push(new THREE.Vector3(Math.cos(angle) * trailRadius, 0.05, Math.sin(angle) * trailRadius)); // Slightly above ground
        }
        const trailGeometry = new THREE.BufferGeometry().setFromPoints(trailPoints);
        this.dirtTrail = new THREE.Line(trailGeometry, trailMaterial);
        this.dirtTrail.visible = this.params.robotMovementMode === 'perimeter';
        this.scene.add(this.dirtTrail);
    }


    _createCentralPole() {
        const poleGeo = new THREE.CylinderGeometry(
            GeometryDefaults.POLE_RADIUS_CENTRAL,
            GeometryDefaults.POLE_RADIUS_CENTRAL,
            this.params.poleHeight, 16);
        const poleMat = Materials.STANDARD_METAL_MED_ROUGH.clone();
        poleMat.color.set(Colors.POLE_CENTRAL);

        this.centralPole = new THREE.Mesh(poleGeo, poleMat);
        // Position base at ground level (mesh center is at half height)
        this.centralPole.position.set(
            this.centralPolePosition.x,
            this.params.poleHeight / 2,
            this.centralPolePosition.z);
        this.centralPole.castShadow = true;
        this.centralPole.receiveShadow = true;
        this.scene.add(this.centralPole);
        // The connection point is defined by centralArmConnectionPoint (top of the pole)
    }

    _createRobot() {
        this.robot = new THREE.Group();
        this.robot.position.copy(this.robotState.position);

        // --- Base ---
        this._createRobotBase();
        this._createRobotWheels();
        this._createRobotWeatherStation();
        this._createRobotCameras();
        this._createRobotAntenna();
        this._createRobotLEDs();
        this._createRobotControlPanel();

        // --- Robot's Vertical Pole ---
        this._createRobotPole(); // Add pole TO the robot group

        this.scene.add(this.robot);
    }

    _createRobotBase() {
        const baseMat = Materials.STANDARD_METAL_HIGH_ROUGH.clone();
        baseMat.color.set(Colors.ROBOT_BASE);
        const baseGeo = new THREE.BoxGeometry(
            GeometryDefaults.ROBOT_BASE_SIZE.x,
            GeometryDefaults.ROBOT_BASE_SIZE.y,
            GeometryDefaults.ROBOT_BASE_SIZE.z
        );
        const baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.castShadow = true;
        baseMesh.receiveShadow = true; // Base can receive shadows from pole/arm
        baseMesh.position.y = 0; // Center of base is robot group's origin Y
        this.robot.add(baseMesh);
        this.robot.userData.baseMesh = baseMesh; // Store reference if needed
    }

    _createRobotWheels() {
        const wheelMat = Materials.STANDARD_ROUGH.clone();
        wheelMat.color.set(Colors.ROBOT_WHEEL);
        const wheelGeo = new THREE.CylinderGeometry(
            GeometryDefaults.ROBOT_WHEEL_RADIUS,
            GeometryDefaults.ROBOT_WHEEL_RADIUS,
            GeometryDefaults.ROBOT_WHEEL_WIDTH,
            16);
        // Position wheels relative to the base center
        const wheelYOffset = -GeometryDefaults.ROBOT_BASE_SIZE.y / 2; // Place bottom of wheels roughly at base bottom
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
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.z = Math.PI / 2; // Align cylinder axis correctly
            wheel.position.copy(pos);
            wheel.castShadow = true;
            this.robot.add(wheel);
            this.robot.userData.wheels.push(wheel);
        });
        // Note: Consider disposing wheelGeo after loop if not reused
    }

    _createRobotWeatherStation() {
        const stationGroup = new THREE.Group();
        const baseY = GeometryDefaults.ROBOT_BASE_SIZE.y / 2; // Top of the base mesh
        stationGroup.position.set(1.5, baseY + 0.1, 0); // Place slightly above base

        // Solar Panel
        const solarPanelGeo = new THREE.BoxGeometry(1.5, 0.1, 1);
        const solarPanelMat = Materials.STANDARD_METAL_MED_ROUGH.clone();
        solarPanelMat.color.set(Colors.SOLAR_PANEL);
        const solarPanel = new THREE.Mesh(solarPanelGeo, solarPanelMat);
        solarPanel.castShadow = true;
        stationGroup.add(solarPanel);

        // Anemometer Pole
        const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8);
        const poleMat = Materials.STANDARD_METAL_MED_ROUGH.clone();
        poleMat.color.set(Colors.WEATHER_POLE);
        const poleAnem = new THREE.Mesh(poleGeo, poleMat);
        poleAnem.position.y = 0.4; // Relative to station group base
        poleAnem.castShadow = true;
        stationGroup.add(poleAnem);

        // Anemometer Cups
        const cupsGroup = new THREE.Group();
        cupsGroup.position.y = 0.8; // Top of the anemometer pole
        const cupGeo = new THREE.SphereGeometry(0.2, 8, 6); // Simple cups
        const cupMat = new THREE.MeshBasicMaterial({ color: Colors.WEATHER_CUPS }); // Basic material, no lighting needed
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const cup = new THREE.Mesh(cupGeo, cupMat); // Can reuse geometry and material
            cup.position.set(Math.cos(angle) * 0.5, 0, Math.sin(angle) * 0.5);
            cupsGroup.add(cup);
        }
        poleAnem.add(cupsGroup);
        stationGroup.userData.anemometerCups = cupsGroup; // For animation

        this.robot.add(stationGroup);
        this.robot.userData.weatherStation = stationGroup; // Store reference
         // Dispose unused geometries
        solarPanelGeo.dispose();
        poleGeo.dispose();
        cupGeo.dispose();
    }

     _createRobotCameras() {
        const camY = GeometryDefaults.ROBOT_BASE_SIZE.y / 2 - 0.2; // Slightly below top surface
        const camZ = GeometryDefaults.ROBOT_BASE_SIZE.z / 2 + 0.05; // Slightly proud of front face
        const cameraGeo = new THREE.BoxGeometry(0.4, 0.3, 0.5);
        const rgbMat = new THREE.MeshStandardMaterial({ color: Colors.CAM_RGB, roughness: 0.1, metalness: 0.2 });
        const thermalMat = new THREE.MeshStandardMaterial({ color: Colors.CAM_THERMAL, roughness: 0.1, metalness: 0.2 });

        const rgbCam = new THREE.Mesh(cameraGeo, rgbMat);
        const thermalCam = new THREE.Mesh(cameraGeo.clone(), thermalMat); // Clone geo if needed later

        rgbCam.position.set(-1.5, camY, camZ);
        thermalCam.position.set(1.5, camY, camZ);
        this.robot.add(rgbCam);
        this.robot.add(thermalCam);
        // Dispose geometry if not reused
        cameraGeo.dispose();
    }

    _createRobotAntenna() {
        const antennaY = GeometryDefaults.ROBOT_BASE_SIZE.y / 2 + 0.6; // Positioned relative to base top
        const antennaGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8);
        const antennaMat = Materials.STANDARD_METAL_MED_ROUGH.clone();
        antennaMat.color.set(Colors.ANTENNA);
        const antenna1 = new THREE.Mesh(antennaGeo, antennaMat);
        antenna1.position.set(-2, antennaY, -1.5);
        antenna1.castShadow = true;
        this.robot.add(antenna1);
        // Dispose geometry if not reused
        antennaGeo.dispose();
    }

     _createRobotLEDs() {
        const ledY = GeometryDefaults.ROBOT_BASE_SIZE.y / 2 + 0.1; // Slightly above base top
        const ledGeo = new THREE.SphereGeometry(0.1, 8, 8);
        // Use emissive property for glow
        const ledMatOn = new THREE.MeshStandardMaterial({ color: Colors.LED_ON, emissive: Colors.LED_ON, emissiveIntensity: 1 });
        const ledMatOff = new THREE.MeshStandardMaterial({ color: Colors.LED_OFF, emissive: Colors.LED_OFF, emissiveIntensity: 0 }); // Off state

        const led1 = new THREE.Mesh(ledGeo, ledMatOn);
        const led2 = new THREE.Mesh(ledGeo.clone(), ledMatOff.clone()); // Clone geo and material

        led1.position.set(0, ledY, GeometryDefaults.ROBOT_BASE_SIZE.z / 2 + 0.05); // Front
        led2.position.set(GeometryDefaults.ROBOT_BASE_SIZE.x / 2 + 0.05, ledY, 0); // Side
        this.robot.add(led1);
        this.robot.add(led2);
        this.robot.userData.blinkingLED = led2; // Store reference for animation
        // Dispose geometry if not reused
        ledGeo.dispose();
    }

     _createRobotControlPanel() {
        const panelY = 0; // Center Y aligned with robot origin Y
        const panelX = GeometryDefaults.ROBOT_BASE_SIZE.x / 2 + 0.1; // Just outside base width
        const panelGeo = new THREE.BoxGeometry(0.2, 0.8, 0.6);
        const panelMat = Materials.STANDARD_METAL_HIGH_ROUGH.clone();
        panelMat.color.set(Colors.CONTROL_PANEL);
        const panel = new THREE.Mesh(panelGeo, panelMat);
        panel.position.set(panelX, panelY, 0);
        panel.castShadow = true;
        this.robot.add(panel);
        // Dispose geometry if not reused
        panelGeo.dispose();
     }


    _createRobotPole() {
        const robotPoleGeo = new THREE.CylinderGeometry(
            GeometryDefaults.POLE_RADIUS_ROBOT,
            GeometryDefaults.POLE_RADIUS_ROBOT,
            this.params.poleHeight, 12);
        const robotPoleMat = Materials.STANDARD_METAL_MED_ROUGH.clone();
        robotPoleMat.color.set(Colors.POLE_ROBOT);
        this.robotPole = new THREE.Mesh(robotPoleGeo, robotPoleMat);

        // Position the pole's center point relative to the robot's origin
        // The base offset determines where the pole sits on the robot base
        // The Y position places the *center* of the pole mesh.
        this.robotPole.position.copy(this.robotPoleBaseOffset);
        this.robotPole.position.y += this.params.poleHeight / 2; // Adjust Y to place base correctly
        this.robotPole.castShadow = true;
        this.robotPole.receiveShadow = true; // Can receive shadows from arm
        this.robot.add(this.robotPole); // Add pole TO the robot group
    }


    _createPivotArm() {
        this.pivotArm = new THREE.Group();
        // Position will be set dynamically in updateArmPositionOrientationLength
        this.pivotArm.position.copy(this.centralArmConnectionPoint);

        const segmentMat = Materials.STANDARD_METAL_LOW_ROUGH.clone();
        segmentMat.color.set(Colors.ARM_SEGMENT);
        const nozzleMat = new THREE.MeshStandardMaterial({ color: Colors.NOZZLE, metalness: 0.6, roughness: 0.4 });

        this.pivotArm.userData.segments = [];
        this.pivotArm.userData.nozzles = [];
        this.waterParticles = [];

        // Create segments with NOMINAL length (e.g., 1 unit) - we will SCALE them later
        const nominalSegmentLength = 1.0;
        const segmentGeo = new THREE.CylinderGeometry(
            GeometryDefaults.ARM_SEGMENT_RADIUS,
            GeometryDefaults.ARM_SEGMENT_RADIUS,
            nominalSegmentLength,
            12);
        segmentGeo.rotateZ(Math.PI / 2); // Rotate geometry once so X-axis is length
        segmentGeo.translate(nominalSegmentLength / 2, 0, 0); // Offset so origin is at one end

        const nozzleGeo = new THREE.SphereGeometry(GeometryDefaults.ARM_NOZZLE_RADIUS, 8, 8);

        for (let i = 0; i < this.params.numArmSegments; i++) {
            // --- Segment ---
            const segment = new THREE.Mesh(segmentGeo, segmentMat); // Reuse geometry, clone material if needed
            segment.castShadow = true;
            // Position and scale will be set in updateArm...
            this.pivotArm.add(segment);
            this.pivotArm.userData.segments.push(segment);

            // --- Nozzle ---
            if (i < this.params.numSprinklers) {
                const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat); // Reuse geometry, clone material if needed
                nozzle.castShadow = true;
                // Position will be set relative to segment end in updateArm...
                this.pivotArm.add(nozzle);
                this.pivotArm.userData.nozzles.push(nozzle);
                this._createWaterMist(nozzle); // Create particle system associated with this nozzle
            }
        }

        this.scene.add(this.pivotArm);

        // Dispose template geometries after loop
        segmentGeo.dispose();
        nozzleGeo.dispose();
    }

    _createWaterMist(nozzle) {
        const particleCount = 100; // Max particles per system
        const positions = new Float32Array(particleCount * 3);
        const alphas = new Float32Array(particleCount);
        const velocities = []; // Store as Vector3 for easier updates
        const lifetimes = new Float32Array(particleCount).fill(Infinity); // Start inactive

        for (let i = 0; i < particleCount; i++) {
             // Initial velocities set when particle is activated
            velocities.push(new THREE.Vector3());
        }

        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

        const textureLoader = new THREE.TextureLoader();
        const particleTexture = textureLoader.load('textures/particle.png'); // Ensure this texture exists

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.2,
            map: particleTexture,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            opacity: 0.7,
            sizeAttenuation: true, // Particles shrink with distance
        });

        const points = new THREE.Points(particleGeometry, particleMaterial);
        points.visible = this.params.showMist;

        // Group to handle world positioning easily
        const particleGroup = new THREE.Group();
        particleGroup.add(points); // Add the Points object to the group
        this.scene.add(particleGroup); // Add the group to the scene

        this.waterParticles.push({
            group: particleGroup, // Group controls position
            points: points,       // Points object itself
            geometry: particleGeometry,
            material: particleMaterial,
            velocities: velocities,
            nozzleRef: nozzle,    // Reference to the nozzle mesh
            particleIndex: 0,     // Next particle slot to use
            maxParticles: particleCount,
            lifetimes: lifetimes, // Array to track lifetime
            maxLifetime: 1.5,     // Seconds particle lives
        });
    }

    _createSkybox() {
        const loader = new THREE.CubeTextureLoader();
        const texture = loader
            .setPath('textures/skybox/') // Ensure this path is correct
            .load(['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg']);
        this.scene.background = texture; // Use texture for background
        // Optionally set environment map for reflections if materials need it
        // this.scene.environment = texture;
    }

    _createObstacles() {
        this.obstacles = []; // Clear previous obstacles if any
        const rockGeo = new THREE.IcosahedronGeometry(3, 1); // Slightly smoother rocks
        const crateGeo = new THREE.BoxGeometry(4, 4, 4);
        const smallRockGeo = new THREE.IcosahedronGeometry(1.5, 1);

        const rockMat = Materials.STANDARD_VERY_ROUGH.clone();
        rockMat.color.set(Colors.OBSTACLE_ROCK);
        const crateMat = Materials.STANDARD_ROUGH.clone();
        crateMat.color.set(Colors.OBSTACLE_CRATE);

        const getObstacleRadius = (geo) => {
            if (!geo.boundingSphere) geo.computeBoundingSphere();
            return geo.boundingSphere.radius;
        };

        const obstacleData = [
            { geo: crateGeo, mat: crateMat, pos: new THREE.Vector3(this.params.fieldSize * 0.95, 2, this.params.fieldSize * 0.1) },
            { geo: rockGeo, mat: rockMat, pos: new THREE.Vector3(this.params.fieldSize * 0.8, 1.5, -this.params.fieldSize * 0.9) },
            { geo: smallRockGeo, mat: rockMat, pos: new THREE.Vector3(this.params.fieldSize * 1.0, 0.75, this.params.fieldSize * 0.3) },
            { geo: crateGeo, mat: crateMat, pos: new THREE.Vector3(-this.params.fieldSize * 0.4, 2, this.params.fieldSize * 0.95) },
            { geo: rockGeo, mat: rockMat, pos: new THREE.Vector3(0, 1.5, -this.params.fieldSize * 1.0) },
            { geo: smallRockGeo, mat: rockMat, pos: new THREE.Vector3(-this.params.fieldSize * 0.9, 0.75, this.params.fieldSize * 0.5) },
            { geo: crateGeo, mat: crateMat, pos: new THREE.Vector3(this.params.fieldSize * 0.3, 2, this.params.fieldSize * 0.98) },
            // Add more varied obstacles
            { geo: new THREE.TorusKnotGeometry( 1.5, 0.4, 100, 16 ), mat: rockMat, pos: new THREE.Vector3(-this.params.fieldSize * 0.7, 1.8, -this.params.fieldSize * 0.6) },
        ];

        obstacleData.forEach(data => {
            const mesh = new THREE.Mesh(data.geo, data.mat);
            mesh.position.copy(data.pos);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData.radius = getObstacleRadius(data.geo);
            this.scene.add(mesh);
            this.obstacles.push(mesh);
             // Optionally dispose geometries if they are unique and not reused
            // if(data.geo !== rockGeo && data.geo !== crateGeo ...) data.geo.dispose();
        });
         // Dispose template geometries
        rockGeo.dispose();
        crateGeo.dispose();
        smallRockGeo.dispose();
    }


    _createPathVisualization() {
        if (this.pathLine) {
            this.scene.remove(this.pathLine);
            this.pathLine.geometry.dispose();
            this.pathLine.material.dispose();
        }
        const pathMaterial = new THREE.LineDashedMaterial({
            color: Colors.PATH_LINE,
            linewidth: 1, // Note: May not be supported on all systems
            scale: 1,
            dashSize: 1.5, // Larger dashes
            gapSize: 1.0
        });
        const pathPoints = [];
        const segments = 100;
        const radius = this.params.fieldSize;
        for (let i = 0; i <= segments; i++) {
            const angle = (Math.PI * 2 / segments) * i;
            pathPoints.push(new THREE.Vector3(Math.cos(angle) * radius, 0.1, Math.sin(angle) * radius)); // Slightly elevated
        }
        const pathGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
        this.pathLine = new THREE.Line(pathGeometry, pathMaterial);
        this.pathLine.computeLineDistances(); // Required for dashed lines
        this.pathLine.visible = this.params.robotMovementMode === 'perimeter';
        this.scene.add(this.pathLine);
    }


    // --- Update Methods ---

    updateRobot(deltaTime) {
        if (!this.robot) return;

        // Handle Movement Mode
        if (this.params.robotMovementMode !== 'perimeter') {
             // Lerp towards central position if not already there
            this.tempVector3.set(0, this.robotBaseHeight, 0);
            this.robot.position.lerp(this.tempVector3, 0.05); // Slow transition
             // Keep looking towards center (or fixed direction)
            this.robot.lookAt(this.params.fieldSize, this.robotBaseHeight, 0);
            // Stop wheel rotation smoothly
             if (this.robot.userData.wheels) {
                this.robot.userData.wheels.forEach(wheel => {
                    wheel.rotation.x *= 0.95; // Dampen rotation
                });
            }
            return; // Exit perimeter logic
        }

        const perimeterRadius = this.params.fieldSize;
        if (perimeterRadius <= 0) return; // Avoid division by zero

        // Calculate angular speed
        const angularSpeed = this.params.robotSpeed / perimeterRadius;
        this.robotState.perimeterAngle = (this.robotState.perimeterAngle + angularSpeed * deltaTime) % (2 * Math.PI);

        // Calculate next ideal position on the perimeter
        const nextX = Math.cos(this.robotState.perimeterAngle) * perimeterRadius;
        const nextZ = Math.sin(this.robotState.perimeterAngle) * perimeterRadius;
        this.nextPosition.set(nextX, this.robotBaseHeight, nextZ);

        // --- Obstacle Avoidance ---
        this.avoidanceVector.set(0, 0, 0);
        let avoiding = false;
        const avoidanceLookAhead = this.params.robotSpeed * 0.5; // How far ahead to check
        const robotCheckPos = this.robot.position.clone().add(this.robot.getWorldDirection(this.tempVector3).multiplyScalar(avoidanceLookAhead)); // Check point ahead
        const avoidanceRadius = 8; // Increased radius for smoother avoidance

        this.obstacles.forEach(obstacle => {
            const dist = robotCheckPos.distanceTo(obstacle.position);
            const effectiveAvoidanceRadius = avoidanceRadius + (obstacle.userData.radius || 1);

            if (dist < effectiveAvoidanceRadius) {
                avoiding = true;
                // Calculate vector pointing away from obstacle center, normalized
                const awayVector = robotCheckPos.clone().sub(obstacle.position).normalize();
                awayVector.y = 0; // Only avoid horizontally

                // Strength of avoidance based on proximity (stronger when closer)
                const avoidanceStrength = (effectiveAvoidanceRadius - dist) / effectiveAvoidanceRadius; // Normalized 0-1
                this.avoidanceVector.add(awayVector.multiplyScalar(avoidanceStrength * this.params.robotSpeed * 0.5)); // Scale avoidance force
            }
        });

        // Apply avoidance offset to the target position
        const targetPos = this.nextPosition.add(this.avoidanceVector);
        targetPos.y = this.robotBaseHeight; // Keep robot on the ground plane

        // --- Update Robot Position and Orientation ---
        // Smoothly move towards the target position (ideal + avoidance)
        this.robot.position.lerp(targetPos, 0.1); // Adjust lerp factor for responsiveness

        // Look ahead on the path for smoother turning
        const lookAheadFactor = avoiding ? 0.05 : 0.3; // Look less far ahead when actively avoiding
        const lookAheadAngle = (this.robotState.perimeterAngle + angularSpeed * lookAheadFactor * Math.sign(this.params.robotSpeed)) % (2 * Math.PI);
        this.robotLookAtTarget.set(
            Math.cos(lookAheadAngle) * perimeterRadius,
            this.robotBaseHeight,
            Math.sin(lookAheadAngle) * perimeterRadius
        );
         // Add a component of the avoidance vector to the lookat target so it slightly turns away
        if(avoiding) {
            this.robotLookAtTarget.add(this.avoidanceVector.multiplyScalar(0.3));
        }

        this.robot.lookAt(this.robotLookAtTarget);

        // --- Animate Wheels ---
        if (this.robot.userData.wheels) {
            const wheelCircumference = 2 * Math.PI * GeometryDefaults.ROBOT_WHEEL_RADIUS;
            // Calculate distance moved in this frame (approximate)
            const distanceMoved = this.robot.position.distanceTo(targetPos) * 0.1; // Using the lerp factor
            const wheelRotation = (distanceMoved / wheelCircumference) * (2 * Math.PI); // Radians

            this.robot.userData.wheels.forEach(wheel => {
                wheel.rotation.x += wheelRotation * Math.sign(this.params.robotSpeed); // Rotate based on distance
            });
        }
    }

    updateArmPositionOrientationLength() {
        if (!this.robot || !this.pivotArm || !this.pivotArm.userData.segments || !this.centralPole || !this.robotPole) return;

        // 1. Calculate World Position of the TOP of the Robot's Pole
        // Get the pole's local center, move up half its height, convert to world space
        this.tempVector3.copy(this.robotPole.position); // Pole's local center relative to robot origin
        this.tempVector3.y += this.params.poleHeight / 2; // Move to top locally
        this.robot.localToWorld(this.robotArmConnectionWorld.copy(this.tempVector3)); // Convert local top point to world

        // 2. Calculate Vector from Center Pole Top to Robot Pole Top
        this.armVector.subVectors(this.robotArmConnectionWorld, this.centralArmConnectionPoint);

        // 3. Calculate Required Arm Length
        const requiredArmLength = this.armVector.length();

        // 4. Update Arm Group's Position (base of the arm)
        this.pivotArm.position.copy(this.centralArmConnectionPoint);

        // 5. Update Arm Group's Orientation
        if (this.armVector.lengthSq() > 0.0001) { // Check for zero vector
            this.armVector.normalize(); // Normalize for quaternion calculation
            this.pivotArm.quaternion.setFromUnitVectors(this.xAxis, this.armVector);
        }

        // 6. Adjust Segments using SCALING
        const numSegmentsTotal = this.pivotArm.userData.segments.length;
        if (numSegmentsTotal === 0) return;

        const segmentLength = requiredArmLength / numSegmentsTotal;

        let currentOffset = 0; // Start positioning segments from the pivotArm origin

        this.pivotArm.userData.segments.forEach((segment, i) => {
            segment.visible = true; // Assuming all segments are visible

            // Scale the segment along its local X-axis (which we aligned with length)
            segment.scale.x = segmentLength; // The nominal length was 1

            // Position the start of the segment (its origin was translated)
            segment.position.x = currentOffset;

            // Update nozzle position (relative to the segment's *scaled* end)
            const nozzle = this.pivotArm.userData.nozzles[i];
            if (nozzle) {
                // Position nozzle below the end of the scaled segment
                // Segment origin is at the start, length is segmentLength (scale.x * nominal 1)
                nozzle.position.set(currentOffset + segmentLength, -GeometryDefaults.ARM_SEGMENT_RADIUS - 0.1, 0); // Position relative to pivotArm group
                nozzle.visible = true;
            }

            currentOffset += segmentLength; // Move offset for the next segment
        });

         // Hide unused nozzles if numSprinklers < numArmSegments
         for (let i = numSegmentsTotal; i < this.pivotArm.userData.nozzles.length; i++) {
             if(this.pivotArm.userData.nozzles[i]) this.pivotArm.userData.nozzles[i].visible = false;
         }

        // Ensure particle systems associated with invisible nozzles are also hidden
        this.waterParticles.forEach((system) => {
            system.group.visible = this.params.showMist && system.nozzleRef.visible && system.nozzleRef.parent === this.pivotArm;
        });
    }


    updateWaterMist(deltaTime) {
        if (!this.params.showMist) {
            // Ensure all systems are hidden if mist is globally off
            this.waterParticles.forEach(system => { system.group.visible = false; });
            return;
        }

        this.waterParticles.forEach(system => {
            // Check if the nozzle exists, is visible, and attached to the arm
            if (!system.nozzleRef || !system.nozzleRef.visible || system.nozzleRef.parent !== this.pivotArm) {
                system.group.visible = false;
                return;
            }

            system.group.visible = true; // Ensure visible if conditions met

            // Update the particle group's position to match the nozzle's world position
            system.nozzleRef.getWorldPosition(this.worldPos); // Reuse worldPos vector
            system.group.position.copy(this.worldPos);

            const positions = system.geometry.attributes.position.array;
            const alphas = system.geometry.attributes.alpha.array;
            const lifetimes = system.lifetimes;
            const maxLifetime = system.maxLifetime;
            const gravity = 9.8 * 0.2; // Tuned gravity effect

            // Emit new particles
            const particlesToEmit = Math.min(this.params.mistDensity, system.maxParticles); // Emit based on density param
            for (let i = 0; i < particlesToEmit; i++) {
                const index = system.particleIndex;

                // Activate particle
                positions[index * 3] = 0; // Start at group origin
                positions[index * 3 + 1] = 0;
                positions[index * 3 + 2] = 0;
                alphas[index] = 1.0; // Full alpha
                lifetimes[index] = 0; // Reset lifetime

                // Set initial velocity (downward spray)
                system.velocities[index].set(
                    (Math.random() - 0.5) * 0.8,  // Wider horizontal spread
                    -Math.random() * 1.5 - 0.8,  // Stronger initial downward velocity
                    (Math.random() - 0.5) * 0.8
                );

                 // Apply slight world rotation influence from arm? (Optional complexity)
                 // const armQuaternion = this.pivotArm.getWorldQuaternion(new THREE.Quaternion());
                 // system.velocities[index].applyQuaternion(armQuaternion);


                system.particleIndex = (system.particleIndex + 1) % system.maxParticles;
            }

            // Update existing particles
            for (let i = 0; i < system.maxParticles; i++) {
                 if (lifetimes[i] >= maxLifetime) continue; // Skip dead particles

                lifetimes[i] += deltaTime;

                // Update velocity (apply gravity)
                system.velocities[i].y -= gravity * deltaTime;

                // Update position based on velocity
                positions[i * 3] += system.velocities[i].x * deltaTime;
                positions[i * 3 + 1] += system.velocities[i].y * deltaTime;
                positions[i * 3 + 2] += system.velocities[i].z * deltaTime;

                // Fade out based on lifetime
                const lifeRatio = lifetimes[i] / maxLifetime;
                alphas[i] = Math.max(0, 1.0 - lifeRatio * lifeRatio); // Fade out quadratically

                // Deactivate particle if it hits the ground (approximate check relative to nozzle height)
                // worldPos is nozzle's height, position[i*3+1] is relative Y
                if (this.worldPos.y + positions[i * 3 + 1] < 0.05) {
                    lifetimes[i] = maxLifetime; // Mark as dead
                    alphas[i] = 0;
                }
            }

            // Tell Three.js to update buffers
            system.geometry.attributes.position.needsUpdate = true;
            system.geometry.attributes.alpha.needsUpdate = true;
        });
    }


    // --- Animation Loop ---
    _animate() {
        requestAnimationFrame(this._animate.bind(this)); // Use arrow function or bind

        const deltaTime = this.clock.getDelta();

        this.controls.update(); // Only required if enableDamping or autoRotate are set

        this.updateRobot(deltaTime);
        this.updateArmPositionOrientationLength(); // Update arm AFTER robot moves
        this.updateWaterMist(deltaTime);

        // Animate Robot Details
        if (this.robot?.userData?.weatherStation?.userData?.anemometerCups) {
            this.robot.userData.weatherStation.userData.anemometerCups.rotation.y += 3 * deltaTime; // Faster spin
        }
        if (this.robot?.userData?.blinkingLED) {
            const blinkSpeed = 1.5; // Hz
            const intensity = (Math.sin(this.clock.elapsedTime * blinkSpeed * Math.PI * 2) > 0) ? 1 : 0; // On/Off blink
            this.robot.userData.blinkingLED.material.emissiveIntensity = intensity;
        }

        this.renderer.render(this.scene, this.camera);
    }

    // --- Event Handlers ---
    _onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // --- GUI Setup ---
    _setupGUI() {
        this.gui = new GUI();
        this.gui.title("Irrigation Controls");

        // --- General Settings ---
        const generalFolder = this.gui.addFolder('General');
        generalFolder.add(this.params, 'fieldSize', 50, 200, 5).name('Field Radius (m)').onChange(value => {
            console.log("Updating field size...");
            // Recreate elements dependent on field size
            this._createPathVisualization();
            this._createDirtTrail();
            // Reset robot position if in perimeter mode
            if (this.params.robotMovementMode === 'perimeter') {
                this.robotState.position.set(value, this.robotBaseHeight, 0);
                this.robotState.perimeterAngle = 0;
                if (this.robot) this.robot.position.copy(this.robotState.position);
            }
             // Adjust shadow camera - might be needed if size changes drastically
            const shadowCamSize = value * 1.6;
            this.directionalLight.shadow.camera.left = -shadowCamSize;
            this.directionalLight.shadow.camera.right = shadowCamSize;
            this.directionalLight.shadow.camera.top = shadowCamSize;
            this.directionalLight.shadow.camera.bottom = -shadowCamSize;
            this.directionalLight.shadow.camera.updateProjectionMatrix(); // IMPORTANT!

            this.updateArmPositionOrientationLength(); // Recalculate arm length
        });
        generalFolder.add(this.params, 'poleHeight', 2, 20, 0.5).name('Pole Height (m)').onChange(value => {
            // Update central connection point Y
            this.centralArmConnectionPoint.y = value;

            // Update central pole mesh height and position
            if (this.centralPole) {
                this.centralPole.geometry.dispose();
                this.centralPole.geometry = new THREE.CylinderGeometry(GeometryDefaults.POLE_RADIUS_CENTRAL, GeometryDefaults.POLE_RADIUS_CENTRAL, value, 16);
                this.centralPole.position.y = value / 2; // Keep base at ground
            }
            // Update robot pole mesh height and position
            if (this.robotPole) {
                this.robotPole.geometry.dispose();
                this.robotPole.geometry = new THREE.CylinderGeometry(GeometryDefaults.POLE_RADIUS_ROBOT, GeometryDefaults.POLE_RADIUS_ROBOT, value, 12);
                // Recalculate Y position based on base offset and new half-height
                this.robotPole.position.copy(this.robotPoleBaseOffset);
                this.robotPole.position.y += value / 2;
            }
            // Force arm update
            this.updateArmPositionOrientationLength();
            // Adjust camera target and controls target for better view
             this.camera.lookAt(0, value / 2, 0);
             this.controls.target.set(0, value / 2, 0);
        });
        generalFolder.open(); // Open by default

        // --- Robot Settings ---
        const robotFolder = this.gui.addFolder('Robot');
        robotFolder.add(this.params, 'robotMovementMode', ['perimeter', 'central']).name('Mode').onChange(mode => {
            if (mode === 'perimeter') {
                // Reset position and angle for perimeter start
                this.robotState.position.set(this.params.fieldSize, this.robotBaseHeight, 0);
                this.robotState.perimeterAngle = 0;
                if (this.robot) this.robot.position.copy(this.robotState.position);
                if (this.pathLine) this.pathLine.visible = true;
                if (this.dirtTrail) this.dirtTrail.visible = true;
            } else {
                 // For 'central', target position is (0, height, 0), lerping handles the move
                if (this.pathLine) this.pathLine.visible = false;
                if (this.dirtTrail) this.dirtTrail.visible = false;
            }
            // Arm needs update regardless of mode change
            this.updateArmPositionOrientationLength();
        });
        robotFolder.add(this.params, 'robotSpeed', 1, 20, 0.5).name('Speed (m/s)');
        robotFolder.open();


        // --- Arm & Irrigation Settings ---
        const armFolder = this.gui.addFolder('Arm & Irrigation');
        armFolder.add(this.params, 'numArmSegments', 2, 20, 1).name('# Arm Segments').onChange(value => {
             this.params.numSprinklers = Math.min(this.params.numSprinklers, value); // Ensure sprinklers <= segments
             this.gui.controllers.find(c => c.property === 'numSprinklers').updateDisplay(); // Update GUI display for sprinklers
             this._recreateArmAndMist(); // Rebuild the arm completely
        });
         armFolder.add(this.params, 'numSprinklers', 1, this.params.numArmSegments, 1).name('# Sprinklers').listen().onChange(value => {
             this._recreateArmAndMist(); // Need to potentially add/remove nozzles and mist systems
         });
        armFolder.add(this.params, 'showMist').name('Show Mist').onChange(value => {
            // Update visibility instantly
            this.waterParticles.forEach(system => {
                system.group.visible = value && system.nozzleRef.visible && system.nozzleRef.parent === this.pivotArm;
            });
        });
        armFolder.add(this.params, 'mistDensity', 1, 50, 1).name('Mist Density/Rate');
        armFolder.open();
    }

    // --- Helper to recreate arm and mist (used by GUI) ---
     _recreateArmAndMist() {
         console.log("Recreating arm structure...");
         // Remove old arm and particles
         if (this.pivotArm) {
             // Dispose geometries/materials within the arm if needed (especially cloned ones)
             this.pivotArm.traverse(child => {
                 if (child.geometry) child.geometry.dispose();
                 if (child.material) {
                     // Check if material is an array
                     if (Array.isArray(child.material)) {
                         child.material.forEach(mat => mat.dispose());
                     } else {
                         child.material.dispose();
                     }
                 }
             });
             this.scene.remove(this.pivotArm);
             this.pivotArm = null;
         }
         this.waterParticles.forEach(system => {
             if (system.geometry) system.geometry.dispose();
             if (system.material) {
                  if(system.material.map) system.material.map.dispose(); // Dispose texture
                  system.material.dispose();
             }
             if(system.group) this.scene.remove(system.group);
         });
         this.waterParticles = []; // Clear the array

         // Create new ones
         this._createPivotArm();
         this.updateArmPositionOrientationLength(); // Update new arm immediately
     }

}

// --- Start the simulation ---
const simulator = new IrrigationSimulator();