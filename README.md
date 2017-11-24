# Surface Plotter
Plot parametric and implicit surfaces in WebGL.

Visit the app at http://www.surfaceplotter.com

---
## Install
### Add texture pack
Surface Plotter requires a texture pack of materials and environments in order to render the scene.
1. Download the pack at https://mega.nz/#F!ofIxxAbD!c9z_fNg_yJvKuTu6SAmMcA
2. Extract the pack to the `public/presets` directory

### Build
At the root of this repository's directory, run in your terminal,
1. `npm install`
2. `npm run build`

### Local Server
Run `npm run dev` to start a server which you can connect to at http://127.0.0.1:8080.

## Contributing
Any contributions are welcome. In particular, if you would like to add your own surface presets, you may submit a pull request with your preset added to [src/implicitEquationPresets.js](https://github.com/jaxry/surface-plotter/blob/master/src/implicitEquationPresets.js) or [src/parametricEquationPresets.js](https://github.com/jaxry/surface-plotter/blob/master/src/parametricEquationPresets.js).
