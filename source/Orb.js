// JavaScript source code

/*

Orb
    Layers
        Geography
    3D
    Animations


3d rendering layer
ui layer
animation layer


*/

var Orb = {
    Version: 0,
   
    τ: 6.28318530718,
    π: 3.14159265359,
    quarter_τ: 1.57079632679
};

Orb.Constants = {
    Planets: {

    }
};

Orb.Core = class {
    constructor() {

    }
}

Orb.Layer = class {

}

Orb.Renderer = class {
    constructor() {
        var that = this;
        
        this.clock = new Orb.Clock();
        this.clock.start();

        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 3000);
        this.camera.position.z = 400;

        this.scene = new THREE.Scene();

        var e = new Orb.Graphics.Earth(this.camera, this.clock);
        this.scene.add(e);

        var g = new Orb.Graphics.Grid(THREE.Constants.atmosphere.outerRadius, 200);
        this.scene.add(g);

        $.get('data/wind.json', function (data) {
            var w = new Orb.Graphics.Wind(data);
            that.scene.add(w);
        }).fail(function () {
            debugger;
        });

        this.controls = new THREE.TrackballControls(this.camera);
        this.controls.rotateSpeed = 2.0;
        this.controls.zoomSpeed = 1.2;
        this.controls.panSpeed = 0.8;
        this.controls.noZoom = false;
        this.controls.noPan = true;
        this.controls.staticMoving = true;
        this.controls.dynamicDampingFactor = 0.3;
        this.controls.keys = [65, 83, 68];
        //this.controls.addEventListener('change', this.render.bind(this));

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        //

        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        this.controls.update();
        this.renderer.render(this.scene, this.camera);

        $('#datetime').text(this.clock.elapsedDate.toDateString());
    }
}

// Animation

Orb.Transition = class {
    constructor() {
        this.time = 0;
        this.duration = 0;
        this.ease = Orb.Interpolate.Ease.linear;
    }

    tick(Δt) {

    }
}

Orb.Interpolate = {};

// Orb.Interpolate.Ease =

  
// Math

Orb.GeographicPoint = class {
    constructor(latitude, longitude)
    {
        this.latitude = latitude || 0;
        this.longitude = longitude || 0;
    }
}

Orb.Point2 = class extends THREE.Vector2 {

}

Orb.Point3 = class extends THREE.Vector3 {
    constructor(x, y, z) {
        super(x, y, z);
    }

    setAstronomical(astronomical, distance) {
        var δ = astronomical.declination;
        var α = astronomical.right_ascension;

        var Φ = Math.PI / 2 - δ;
        var d = distance || 1;

        //console.log(Φ * Orb.Math.rad_to_deg);

        this.x = d * Math.cos(δ) * Math.cos(α);
        this.z = d * Math.cos(δ) * Math.sin(α);
        this.y = d * Math.sin(δ);
        
        return this;
    }

    setGeographic(latitude, longitude, radius) {
        var δ = latitude;
        var α = longitude;
        var d = radius || 1;

        this.x = d * Math.cos(δ) * Math.cos(α);
        this.z = d * Math.cos(δ) * Math.sin(α);
        this.y = d * Math.sin(δ);

        return this;
    }
}

import _Math from './math/Math';

Orb.Math = _Math;

import Clock from './lib/Clock';

Orb.Clock = Clock;

// Graphics

Orb.Graphics = {

}


Orb.Graphics.Grid = class extends THREE.Line {
    constructor(radius, segments) {
        var geometry = new THREE.Geometry();

        for (var ilat = -90 + 15; ilat < 90; ilat += 15) {
            for (var ilong = 0; ilong <= 360; ilong += 360 / segments) {
                geometry.vertices.push(new Orb.Point3().setGeographic(ilat * Orb.Math.deg_to_rad, ilong * Orb.Math.deg_to_rad).multiplyScalar(radius));
            }
        }

        for (var ilong = 0; ilong < 360; ilong += 15) {
            for (var ilat = -90; ilat <= 90; ilat += 180 / segments) {
                geometry.vertices.push(new Orb.Point3().setGeographic(ilat * Orb.Math.deg_to_rad, ilong * Orb.Math.deg_to_rad).multiplyScalar(radius));
            }
        }

        var material = new THREE.LineBasicMaterial({
            color: 0x41879E,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });

        super(geometry, material);

        this.type = 'Grid';

        this.parameters = {
            radius: radius,
            segments: segments
        };
    }
}

Orb.Graphics.Earth = class extends THREE.Object3D {
    constructor(camera, clock) {
        super();

        var that = this;
        this.clock = clock;
        this.sun = new Orb.Point3(0, 0, 1);

        this.loader = new THREE.TextureLoader();

        this.camera = camera;
        this.uniforms = THREE.UniformsUtils.clone(THREE.UniformsLib.earth);
        window.uniforms = this.uniforms;
        this.loader.load('data/earth.color.jpg', function (t) {
            t.anisotropy = 16;
            that.uniforms.tDiffuse.value = t
        },
	    // Function called when download progresses
	    function (xhr) {
	        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
	    },
	    // Function called when download errors
	    function (xhr) {
	        console.log('An error happened');
	    });
        
        
        // create terrain geometry
        {
            var geometry = new THREE.SphereGeometry(THREE.Constants.atmosphere.innerRadius, 100, 100);
            geometry = new THREE.BufferGeometry().fromGeometry(geometry);

            var material = new THREE.ShaderMaterial({

                uniforms: this.uniforms,
                vertexShader: Orb.Graphics.Shaders['earth-ground-vertex'],
                fragmentShader: Orb.Graphics.Shaders['earth-ground-fragment'],

                depthWrite: true,

            });

            var mesh = new THREE.Mesh(geometry, material);
            mesh.name = 'terrain';

            this.add(mesh);

        };

        // create sky geometry
        
        {
            var geometry = new THREE.SphereGeometry(THREE.Constants.atmosphere.outerRadius, 100, 100);
            geometry = new THREE.BufferGeometry().fromGeometry(geometry);

            var material = new THREE.ShaderMaterial({

                uniforms: this.uniforms,
                vertexShader: Orb.Graphics.Shaders['earth-sky-vertex'],
                fragmentShader: Orb.Graphics.Shaders['earth-sky-fragment'],

                side: THREE.BackSide,
                transparent: true,
                blending: THREE.AdditiveBlending

            });

            var mesh = new THREE.Mesh(geometry, material);
            mesh.name = 'sky';

            this.add(mesh);
        };
        
    }
    updateMatrixWorld() {

        THREE.Object3D.prototype.updateMatrixWorld.apply( this, arguments );

        var cameraHeight = this.camera.position.length();

        var date = this.clock.date;
        this.sun.setAstronomical( Orb.Math.solar_position(Orb.Math.day_of_year(date), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()));

        //Orb.Point3.prototype.setAstronomical.call(this.camera.position, Orb.Math.solar_position(Orb.Math.day_of_year(date), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()), cameraHeight);
        //this.camera.lookAt(new Orb.Point3());

        this.uniforms.v3LightPosition.value.copy(this.sun);
        this.uniforms.fCameraHeight.value = cameraHeight;
        this.uniforms.fCameraHeight2.value = cameraHeight * cameraHeight;

    }
}

// Shaders

import GShaders from './graphics/shaders/Shaders.js';

Orb.Graphics.Shaders = GShaders;

Orb.Graphics.Shadersz = {
    "vertex": `
        void main()
        {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    "fragment": `
        void main()
        {
            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }    
    `,
    "earth-ground-vertex": `
        //
        // Atmospheric scattering vertex shader
        //
        // Author: Sean O'Neil
        //
        // Copyright (c) 2004 Sean O'Neil
        //
        // Ported for use with three.js/WebGL by James Baicoianu

        uniform vec3 v3LightPosition;	// The direction vector to the light source
        uniform vec3 v3InvWavelength;	// 1 / pow(wavelength, 4) for the red, green, and blue channels
        uniform float fCameraHeight;	// The camera's current height
        uniform float fCameraHeight2;	// fCameraHeight^2
        uniform float fOuterRadius;		// The outer (atmosphere) radius
        uniform float fOuterRadius2;	// fOuterRadius^2
        uniform float fInnerRadius;		// The inner (planetary) radius
        uniform float fInnerRadius2;	// fInnerRadius^2
        uniform float fKrESun;			// Kr * ESun
        uniform float fKmESun;			// Km * ESun
        uniform float fKr4PI;			// Kr * 4 * PI
        uniform float fKm4PI;			// Km * 4 * PI
        uniform float fScale;			// 1 / (fOuterRadius - fInnerRadius)
        uniform float fScaleDepth;		// The scale depth (i.e. the altitude at which the atmosphere's average density is found)
        uniform float fScaleOverScaleDepth;	// fScale / fScaleDepth
        uniform sampler2D tDiffuse;

        varying vec3 c0;
        varying vec3 c1;
        varying vec3 vNormal;
        varying vec2 vUv;

        const int nSamples = 3;
        const float fSamples = 3.0;

        float scale(float fCos)
        {
	        float x = 1.0 -fCos;
	        return fScaleDepth * exp(-0.00287 +x*(0.459 +x*(3.83 +x*(-6.80 +x*5.25))));
        }

        void main(void)
        {
	        // Get the ray from the camera to the vertex and its length (which is the far point of the ray passing through the atmosphere)
	        vec3 v3Ray = position -cameraPosition;
	        float fFar = length(v3Ray);
	        v3Ray /= fFar;

	        // Calculate the closest intersection of the ray with the outer atmosphere (which is the near point of the ray passing through the atmosphere)
	        float B = 2.0 * dot(cameraPosition, v3Ray);
	        float C = fCameraHeight2 -fOuterRadius2;
	        float fDet = max(0.0, B*B -4.0 * C);
	        float fNear = 0.5 * (-B -sqrt(fDet));

	        // Calculate the ray's starting position, then calculate its scattering offset
	        vec3 v3Start = cameraPosition +v3Ray * fNear;
	        fFar -= fNear;
	        float fDepth = exp((fInnerRadius -fOuterRadius) / fScaleDepth);
	        float fCameraAngle = dot(-v3Ray, position) / length(position);
	        float fLightAngle = dot(v3LightPosition, position) / length(position);
	        float fCameraScale = scale(fCameraAngle);
	        float fLightScale = scale(fLightAngle);
	        float fCameraOffset = fDepth*fCameraScale;
	        float fTemp = (fLightScale +fCameraScale);

	        // Initialize the scattering loop variables
	        float fSampleLength = fFar / fSamples;
	        float fScaledLength = fSampleLength * fScale;
	        vec3 v3SampleRay = v3Ray * fSampleLength;
	        vec3 v3SamplePoint = v3Start +v3SampleRay * 0.5;

	        // Now loop through the sample rays
	        vec3 v3FrontColor = vec3(0.0, 0.0, 0.0);
	        vec3 v3Attenuate;
	        for(int i=0; i<nSamples; i++)
            {
		        float fHeight = length(v3SamplePoint);
		        float fDepth = exp(fScaleOverScaleDepth * (fInnerRadius -fHeight));
		        float fScatter = fDepth*fTemp -fCameraOffset;
		        v3Attenuate = exp(-fScatter * (v3InvWavelength * fKr4PI +fKm4PI));
		        v3FrontColor += v3Attenuate * (fDepth * fScaledLength);
		        v3SamplePoint += v3SampleRay;
            }

	        // Calculate the attenuation factor for the ground
	        c0 = v3Attenuate;
	        c1 = v3FrontColor * (v3InvWavelength * fKrESun +fKmESun);

	        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	        vUv = uv;
	        vNormal = normal;
        }
        `,
    "earth-ground-fragment": `
        //
        // Atmospheric scattering fragment shader
        //
        // Author: Sean O'Neil
        //
        // Copyright (c) 2004 Sean O'Neil
        //
        // Ported for use with three.js/WebGL by James Baicoianu

        //uniform sampler2D s2Tex1;
        //uniform sampler2D s2Tex2;

        uniform float fNightScale;
        uniform vec3 v3LightPosition;
        uniform sampler2D tDiffuse;

        uniform float fMultiplier;

        varying vec3 c0;
        varying vec3 c1;
        varying vec3 vNormal;
        varying vec2 vUv;

        void main (void )
        {
	        float phong = max(dot(normalize(-vNormal), normalize(v3LightPosition)), 0.0);

	        vec3 diffuseTex = texture2D(tDiffuse, vUv).xyz;
	        gl_FragColor = vec4(c1 +c0 * diffuseTex, 1.0);

        }
        `,
    "earth-sky-vertex":`
        //
        // Atmospheric scattering vertex shader
        //
        // Author: Sean O'Neil
        //
        // Copyright (c) 2004 Sean O'Neil
        //

        uniform vec3 v3LightPosition;	// The direction vector to the light source
        uniform vec3 v3InvWavelength;	// 1 / pow(wavelength, 4) for the red, green, and blue channels
        uniform float fCameraHeight;	// The camera's current height
        uniform float fCameraHeight2;	// fCameraHeight^2
        uniform float fOuterRadius;		// The outer (atmosphere) radius
        uniform float fOuterRadius2;	// fOuterRadius^2
        uniform float fInnerRadius;		// The inner (planetary) radius
        uniform float fInnerRadius2;	// fInnerRadius^2
        uniform float fKrESun;			// Kr * ESun
        uniform float fKmESun;			// Km * ESun
        uniform float fKr4PI;			// Kr * 4 * PI
        uniform float fKm4PI;			// Km * 4 * PI
        uniform float fScale;			// 1 / (fOuterRadius - fInnerRadius)
        uniform float fScaleDepth;		// The scale depth (i.e. the altitude at which the atmosphere's average density is found)
        uniform float fScaleOverScaleDepth;	// fScale / fScaleDepth

        const int nSamples = 3;
        const float fSamples = 3.0;

        varying vec3 v3Direction;
        varying vec3 c0;
        varying vec3 c1;


        float scale(float fCos)
        {
	        float x = 1.0 - fCos;
	        return fScaleDepth * exp(-0.00287 + x*(0.459 + x*(3.83 + x*(-6.80 + x*5.25))));
        }

        void main(void)
        {
	        // Get the ray from the camera to the vertex and its length (which is the far point of the ray passing through the atmosphere)
	        vec3 v3Ray = position - cameraPosition;
	        float fFar = length(v3Ray);
	        v3Ray /= fFar;

	        // Calculate the closest intersection of the ray with the outer atmosphere (which is the near point of the ray passing through the atmosphere)
	        float B = 2.0 * dot(cameraPosition, v3Ray);
	        float C = fCameraHeight2 - fOuterRadius2;
	        float fDet = max(0.0, B*B - 4.0 * C);
	        float fNear = 0.5 * (-B - sqrt(fDet));

	        // Calculate the ray's starting position, then calculate its scattering offset
	        vec3 v3Start = cameraPosition + v3Ray * fNear;
	        fFar -= fNear;
	        float fStartAngle = dot(v3Ray, v3Start) / fOuterRadius;
	        float fStartDepth = exp(-1.0 / fScaleDepth);
	        float fStartOffset = fStartDepth * scale(fStartAngle);
	        //c0 = vec3(1.0, 0, 0) * fStartAngle;

	        // Initialize the scattering loop variables
	        float fSampleLength = fFar / fSamples;
	        float fScaledLength = fSampleLength * fScale;
	        vec3 v3SampleRay = v3Ray * fSampleLength;
	        vec3 v3SamplePoint = v3Start + v3SampleRay * 0.5;

	        //gl_FrontColor = vec4(0.0, 0.0, 0.0, 0.0);

	        // Now loop through the sample rays
	        vec3 v3FrontColor = vec3(0.0, 0.0, 0.0);
	        for(int i=0; i<nSamples; i++)
	        {
		        float fHeight = length(v3SamplePoint);
		        float fDepth = exp(fScaleOverScaleDepth * (fInnerRadius - fHeight));
		        float fLightAngle = dot(v3LightPosition, v3SamplePoint) / fHeight;
		        float fCameraAngle = dot(v3Ray, v3SamplePoint) / fHeight;
		        float fScatter = (fStartOffset + fDepth * (scale(fLightAngle) - scale(fCameraAngle)));
		        vec3 v3Attenuate = exp(-fScatter * (v3InvWavelength * fKr4PI + fKm4PI));

		        v3FrontColor += v3Attenuate * (fDepth * fScaledLength);
		        v3SamplePoint += v3SampleRay;
	        }

	        // Finally, scale the Mie and Rayleigh colors and set up the varying variables for the pixel shader
	        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
	        c0 = v3FrontColor * (v3InvWavelength * fKrESun);
	        c1 = v3FrontColor * fKmESun;
	        v3Direction = cameraPosition - position;
        }
        `,
    "earth-sky-fragment": `
        //
        // Atmospheric scattering fragment shader
        //
        // Author: Sean O'Neil
        //
        // Copyright (c) 2004 Sean O'Neil
        //

        uniform vec3 v3LightPos;
        uniform float g;
        uniform float g2;

        uniform float fMultiplier;

        varying vec3 v3Direction;
        varying vec3 c0;
        varying vec3 c1;

        // Calculates the Mie phase function
        float getMiePhase(float fCos, float fCos2, float g, float g2)
        {
	        return 1.5 * ((1.0 - g2) / (2.0 + g2)) * (1.0 + fCos2) / pow(1.0 + g2 - 2.0 * g * fCos, 1.5);
        }

        // Calculates the Rayleigh phase function
        float getRayleighPhase(float fCos2)
        {
	        return 0.75 + 0.75 * fCos2;
        }

        void main (void)
        {
	        float fCos = dot(v3LightPos, v3Direction) / length(v3Direction);
	        float fCos2 = fCos * fCos;

	        vec3 color =	getRayleighPhase(fCos2) * c0 +
					        getMiePhase(fCos, fCos2, g, g2) * c1;

 	        gl_FragColor = vec4(fMultiplier * fMultiplier * color, 1.0);
	        gl_FragColor.a = gl_FragColor.b;
        }
        `,
    "line-ribbon-surface-vertex": `
        uniform vec2 targetSize;
        uniform float lineWidth;

        void main(void ) {

	        // perpendicular vector the the line from the camera's perspective
	        vec3 cam = cross(position, normal);

	        // project into clip space
	        vec4 nor = projectionMatrix * modelViewMatrix * vec4(cam, 1.0);

	        // normalize into a screen space direction
	        vec2 dir = normalize(nor.xy);

	        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

	        // extrude the lines by the half the pixel with to each direction
	        gl_Position.xy += lineWidth / 2. * uv.x * gl_Position.w / targetSize * dir;

        }
        `,
    "line-ribbon-fragment": `
        void main (void) {

	        gl_FragColor = vec4(0.025, 0.1, 0.4, 1.0);

        }
        `

}

THREE.Constants = {

    atmosphere: {

        Kr: 0.0025,
        Km: 0.0010,
        ESun: 20.0,
        g: -0.950,
        wavelength: [0.650, 0.560, 0.510],
        scaleDepth: 0.25,
        mieScaleDepth: 0.1,

        innerRadius: 100,
        outerRadius: 100 * 1.01

    }

};

THREE.UniformsLib.earth = {

    "v3LightPosition": { type: "v3", value: new THREE.Vector3(1e8, 0, 1e8).normalize() },
    "v3InvWavelength": { type: "v3", value: new THREE.Vector3(1 / Math.pow(THREE.Constants.atmosphere.wavelength[0], 4), 1 / Math.pow(THREE.Constants.atmosphere.wavelength[1], 4), 1 / Math.pow(THREE.Constants.atmosphere.wavelength[2], 4)) },

    "fCameraHeight": { type: "f", value: 0 },
    "fCameraHeight2": { type: "f", value: 0 },

    "fInnerRadius": { type: "f", value: THREE.Constants.atmosphere.innerRadius },
    "fInnerRadius2": { type: "f", value: THREE.Constants.atmosphere.innerRadius * THREE.Constants.atmosphere.innerRadius },
    "fOuterRadius": { type: "f", value: THREE.Constants.atmosphere.outerRadius },
    "fOuterRadius2": { type: "f", value: THREE.Constants.atmosphere.outerRadius * THREE.Constants.atmosphere.outerRadius },

    "fKrESun": { type: "f", value: THREE.Constants.atmosphere.Kr * THREE.Constants.atmosphere.ESun },
    "fKmESun": { type: "f", value: THREE.Constants.atmosphere.Km * THREE.Constants.atmosphere.ESun },
    "fKr4PI": { type: "f", value: THREE.Constants.atmosphere.Kr * 4.0 * Math.PI },
    "fKm4PI": { type: "f", value: THREE.Constants.atmosphere.Km * 4.0 * Math.PI },

    "fScale": { type: "f", value: 1 / (THREE.Constants.atmosphere.outerRadius - THREE.Constants.atmosphere.innerRadius) },
    "fScaleDepth": { type: "f", value: THREE.Constants.atmosphere.scaleDepth },
    "fScaleOverScaleDepth": { type: "f", value: 1 / (THREE.Constants.atmosphere.outerRadius - THREE.Constants.atmosphere.innerRadius) / THREE.Constants.atmosphere.scaleDepth },

    "g": { type: "f", value: THREE.Constants.atmosphere.g },
    "g2": { type: "f", value: THREE.Constants.atmosphere.g * THREE.Constants.atmosphere.g },

    "nSamples": { type: "i", value: 3 },
    "fSamples": { type: "f", value: 3.0 },
    "tDiffuse": { type: "t", value: undefined },
    "tDiffuseNight": { type: "t", value: undefined },
    "tClouds": { type: "t", value: null },
    "fNightScale": { type: "f", value: 1 },
    "fMultiplier": { type: "f", value: 1 },

};

THREE.UniformsLib.screen = {

    "targetSize": { type: "v2", value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    "lineWidth": { type: "f", value: 8 },

}

THREE.UniformsLib.distanceField = {

    "threshold": { type: "f", value: 0.75 },
    "gamma": { type: "f", value: 0.02 },
    "texture": { type: "t", value: undefined },

}

function recalc(uniform) {
    uniform.v3InvWavelength.value = new THREE.Vector3(1 / Math.pow(THREE.Constants.atmosphere.wavelength[0], 4), 1 / Math.pow(THREE.Constants.atmosphere.wavelength[1], 4), 1 / Math.pow(THREE.Constants.atmosphere.wavelength[2], 4));
    uniform.fKrESun.value = THREE.Constants.atmosphere.Kr * THREE.Constants.atmosphere.ESun;
    uniform.fKmESun.value = THREE.Constants.atmosphere.Km * THREE.Constants.atmosphere.ESun;
    uniform.fKr4PI.value = THREE.Constants.atmosphere.Kr * 4.0 * Math.PI;
    uniform.fKm4PI.value = THREE.Constants.atmosphere.Km * 4.0 * Math.PI;
}

THREE.UniformsLib.screen = {

    "targetSize": { type: "v2", value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    "lineWidth": { type: "f", value: 4 },

}

THREE.UniformsLib.distanceField = {

    "threshold": { type: "f", value: 0.75 },
    "gamma": { type: "f", value: 0.02 },
    "texture": { type: "t", value: undefined },

}

THREE.RibbonCollectionGeometry = function (count, segments, duration) {

    THREE.BufferGeometry.call(this);

    var points = count * (segments + 2);

    this.positions = new Float32Array(points * 3 * 2);
    this.normals = new Float32Array(points * 3 * 2);
    this.uvs = new Float32Array(points * 2 * 2);
    this.indices = [];
    this.needsReset = [];

    this.addAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.addAttribute('normal', new THREE.BufferAttribute(this.normals, 3));
    this.addAttribute('uv', new THREE.BufferAttribute(this.uvs, 2));
    this.attributes.position.setDynamic(true);
    this.attributes.normal.setDynamic(true);

    this.previous = [];
    this.temp = new THREE.Vector3();

    for (var i = 0; i < count; ++i) {

        this.indices.push(0);
        this.needsReset.push(true);
        this.previous.push(new THREE.Vector3());

    }

    for (var i = 0; i < points; ++i) {

        this.uvs[i * 4 + 0] = 1;
        this.uvs[i * 4 + 2] = -1;

    }

    this.computeBoundingSphere();

    for (var i = 0; i < this.positions.length; ++i) {

        this.positions[i] = 0;
        this.normals[i] = 0;

    }

    this.count = count;
    this.segments = segments;
    this.duration = duration;

}

THREE.RibbonCollectionGeometry.prototype = Object.create(THREE.BufferGeometry.prototype);
THREE.RibbonCollectionGeometry.prototype.constructor = THREE.RibbonCollectionGeometry;

THREE.RibbonCollectionGeometry.prototype.reset = function (index) {

    var positions = this.positions;
    this.indices[index] = 0;

    var offset = index * (this.segments + 2) * 6;

    for (var j = 0; j < (this.segments + 1) * 2; ++j) {

        positions[j * 3 + 0 + offset] = NaN;
        positions[j * 3 + 1 + offset] = NaN;
        positions[j * 3 + 2 + offset] = NaN;

    }

    positions[(this.segments + 1) * 6 + 0 + offset] = NaN;
    positions[(this.segments + 1) * 6 + 1 + offset] = NaN;
    positions[(this.segments + 1) * 6 + 2 + offset] = NaN;
    positions[(this.segments + 1) * 6 + 3 + offset] = NaN;
    positions[(this.segments + 1) * 6 + 4 + offset] = NaN;
    positions[(this.segments + 1) * 6 + 6 + offset] = NaN;

    this.needsReset[index] = false;

    this.attributes.position.needsUpdate = true;

}

THREE.RibbonCollectionGeometry.prototype.advance = function (index, x, y, z) {

    var positions = this.positions;
    var normals = this.normals;
    var i = this.indices[index];
    var offset = index * (this.segments + 2) * 6;
    var t = this.temp;
    t.set(x, y, z).sub(this.previous[index]);

    if (this.needsReset[index]) {

        for (var j = 0; j < (this.segments + 1) * 2; ++j) {

            positions[j * 3 + 0 + offset] = NaN;
            positions[j * 3 + 1 + offset] = NaN;
            positions[j * 3 + 2 + offset] = NaN;

        }

        positions[(this.segments + 1) * 6 + 0 + offset] = NaN;
        positions[(this.segments + 1) * 6 + 1 + offset] = NaN;
        positions[(this.segments + 1) * 6 + 2 + offset] = NaN;
        positions[(this.segments + 1) * 6 + 3 + offset] = NaN;
        positions[(this.segments + 1) * 6 + 4 + offset] = NaN;
        positions[(this.segments + 1) * 6 + 6 + offset] = NaN;

        this.needsReset[index] = false;

    }

    var v = i * 6 + offset;

    normals[v + 0] = t.x;
    normals[v + 1] = t.y;
    normals[v + 2] = t.z;
    normals[v + 3] = t.x;
    normals[v + 4] = t.y;
    normals[v + 5] = t.z;

    positions[v + 0] = x;
    positions[v + 1] = y;
    positions[v + 2] = z;
    positions[v + 3] = x;
    positions[v + 4] = y;
    positions[v + 5] = z;

    i = i + 1;

    if (i > this.segments) {

        i = 0;

        var v = i * 6 + offset;

        normals[v + 0] = t.x;
        normals[v + 1] = t.y;
        normals[v + 2] = t.z;
        normals[v + 3] = t.x;
        normals[v + 4] = t.y;
        normals[v + 5] = t.z;

        positions[v + 0] = x;
        positions[v + 1] = y;
        positions[v + 2] = z;
        positions[v + 3] = x;
        positions[v + 4] = y;
        positions[v + 5] = z;

        i = 1;
    }

    v = i * 6 + offset;

    positions[v + 0] = NaN;
    positions[v + 1] = NaN;
    positions[v + 2] = NaN;
    positions[v + 3] = NaN;
    positions[v + 4] = NaN;
    positions[v + 5] = NaN;

    this.indices[index] = i;
    this.attributes.position.needsUpdate = true;
    this.attributes.normal.needsUpdate = true;
    this.previous[index].set(x, y, z);
}

THREE.SurfaceRibbon = function( geometry, material ) {

    THREE.Mesh.call( this, geometry, material );
	
    this.setDrawMode(THREE.TriangleStripDrawMode);

    this.uniforms = THREE.UniformsUtils.clone( THREE.UniformsLib.screen );
    this.uniforms.targetSize.value.set( window.innerWidth, window.innerHeight );
    //this.uniforms.lineWidth.value = 2;

    this.geometry = geometry !== undefined ? geometry : new THREE.Geometry();
    this.material = material !== undefined ? material : new THREE.ShaderMaterial( {

        uniforms:       this.uniforms,
        vertexShader:   Orb.Graphics.Shaders['line-ribbon-surface-vertex'],
        fragmentShader: Orb.Graphics.Shaders['line-ribbon-fragment' ],
        //side:           THREE.DoubleSide,
        blending:          THREE.AdditiveBlending,
        //depthTest:      false,
        depthWrite: false,
        transparent: true

    } );

    for ( var i = 0; i < this.geometry.segments; ++i ) {



    }

}

THREE.SurfaceRibbon.prototype = Object.create( THREE.Mesh.prototype );
THREE.SurfaceRibbon.prototype.constructor = THREE.SurfaceRibbon;


Orb.Graphics.Wind = class extends THREE.SurfaceRibbon {
    constructor(data) {

        var particles = 20000;

        var geometry = new THREE.RibbonCollectionGeometry(particles, 20);
        super(geometry);

        this.data = data;
        this.life = [];
        this.maxLife = 2 * 1000;
        this.locations = [];

        this.particles = particles;

        for (var i = 0; i < particles; ++i) {
            var lon = Math.random() * 180 - 90;
            lon = (Math.acos(Math.random() * 2 - 1) * 180 / Math.PI) - 90;
            var lat = Math.random() * 360;
            this.locations.push(new THREE.Vector2(lat, lon));
            this.life.push(Date.now() + Math.floor(Math.random() * this.maxLife));
        }

    }

    updateMatrixWorld() {

        THREE.Object3D.prototype.updateMatrixWorld.apply(this, arguments);

        var that = this;

        function getPoint(x, y, o) {
            if (that.data === undefined) {
                o.set(0, 0);
                return;
            }
            var i = (-y + 90) * 360 + x
            var u = that.data[0].data[i];
            var v = that.data[1].data[i];
            o.set(u, v);
        }
        function getVector(longitude, latitude, vector) {
            var phi = latitude * (Math.PI / 180);
            var theta = -longitude * (Math.PI / 180);
            vector.set(Math.cos(theta) * Math.cos(phi), Math.sin(phi), Math.sin(theta) * Math.cos(phi));
        }

        var p0 = new THREE.Vector2(),
            p1 = new THREE.Vector2(),
            p2 = new THREE.Vector2(),
            v0 = new THREE.Vector3();

        var r = Date.now() * 0.00005;
        var n = Date.now();

        for (var i = 0; i < this.particles; i++) {
            if (this.life[i] < n) {
                var lon = Math.random() * 180 - 90;
                lon = (Math.acos(Math.random() * 2 - 1) * 180 / Math.PI) - 90;
                var lat = Math.random() * 360;
                this.locations[i].set(lat, lon);
                this.life[i] = n + this.maxLife;
                //geometry.reset( i );
                this.geometry.advance(i, NaN, NaN, NaN);
            } else {
                var l = this.locations[i];
                var x0 = Math.floor(l.x);
                var x1 = Math.ceil(l.x);
                var y0 = Math.floor(l.y);
                var y1 = Math.ceil(l.y);
                var u = l.x - x0;
                var v = l.y - y0;
                getPoint(x0, y0, p0);
                getPoint(x1, y0, p2);
                p0.lerp(p2, u);
                getPoint(x0, y1, p1);
                getPoint(x1, y1, p2);
                p1.lerp(p2, u);
                p0.lerp(p2, v).multiplyScalar(0.03);
                p0.x = p0.x / Math.abs(Math.cos(l.y / 180 * Math.PI));
                l.add(p0);
                if (l.y > 90) {
                    l.y = 180 - l.y;
                    l.x += 180;
                }
                if (l.y < -90) {
                    l.y = -180 + l.y;
                    l.x += 180;
                }
                while (l.x < 0) {
                    l.x += 360;
                }
                while (l.x > 360) {
                    l.x -= 360;
                }
                getVector(l.x, l.y, v0);
                v0.multiplyScalar(101);
                this.geometry.advance(i, v0.x, v0.y, v0.z);
            }
        }
    }
}

export { Orb as default };