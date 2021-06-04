uniform float uAlpha;

varying vec3 vPosition;

void main()
{
    gl_FragColor=vec4(0.,0.,0.,uAlpha);
}