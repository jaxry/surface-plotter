# Surface Plotter
Plot parametric and implicit surfaces in WebGL.

Visit the app at https://jaxry.github.io/surface-plotter/

---
## About
Surface Plotter renders surfaces in real-time in the browser. The surface is shaded with physically based materials using Three.js. To texture the material, Surface Plotter uses a custom GLSL shader which implements tri-planar mapping to generate UV coordinates, and parallax occlusion mapping to give the material depth. The end result produces mathematical surfaces with near photo-realistic results.

One feature of Surface Plotter is the ability for surfaces to seamlessly morph between equations. Implicit surfaces, in particular, morph between each other using what is called the *metamorphosis* of implicit surfaces. This method is defined as follows: For two implicit equations `F(x, y, z) = 0`, `G(x, y, z) = 0`, an intermediate surface can be created by using the parameter `t` lying between 0 and 1. The intermediate surface is defined by `H(x, y, z) = t * F(x, y, z) + (1 - t) * G(x, y, z) = 0`. To animate the morph, the parameter `t` is simply animated from 0 to 1.

Surface Plotter isn't terribly useful, but the app exists for the user to play with. Defining your own equations, tweaking them, and instantly visualizing the results can be a fun thing to do.

## Install
### Build
At the root of this repository's directory, run in your terminal,
1. `npm install`
2. `npm run build`

### Local Server
Run `npm run dev` to start a server which you can connect to at http://127.0.0.1:8080.

## Contributing
Any contributions are welcome. In particular, if you would like to add your own surface presets, please submit a pull request with your preset added to [src/implicitEquationPresets.js](https://github.com/jaxry/surface-plotter/blob/master/src/implicitEquationPresets.js) or [src/parametricEquationPresets.js](https://github.com/jaxry/surface-plotter/blob/master/src/parametricEquationPresets.js).
