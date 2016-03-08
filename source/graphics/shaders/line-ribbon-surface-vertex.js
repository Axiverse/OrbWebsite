export default `

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

`;