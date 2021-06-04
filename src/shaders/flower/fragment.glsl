varying vec3 vPosition;
varying float vDistance;
varying vec3 vColor;

void main()
{
    float strength = step(distance(gl_PointCoord, vec2(.5)), .5);

    // vec3 finalColor = mix(vColor, vec3(0.), strength);

    gl_FragColor=vec4(vColor * strength, strength);
}