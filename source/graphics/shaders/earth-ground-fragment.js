export default `

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

`;