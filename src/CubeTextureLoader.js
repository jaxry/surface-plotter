import * as THREE from 'three';

/**
 * @author mrdoob / http://mrdoob.com/
 */

// A modification of Three.js's CubeTextureLoader
// Images are pushed to the texture.images array immediately instead of when images finish loading
// This makes it possible to cancel downloading an image by setting the src property to the empty string

function CubeTextureLoader( manager ) {

  this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

}

Object.assign( CubeTextureLoader.prototype, {

  crossOrigin: 'Anonymous',

  load: function ( urls, onLoad, onProgress, onError ) {

    var texture = new THREE.CubeTexture();

    var loader = new THREE.ImageLoader( this.manager );
    loader.setCrossOrigin( this.crossOrigin );
    loader.setPath( this.path );

    var loaded = 0;

    function onImageLoad() {

      loaded ++;

      if ( loaded === 6 ) {

        texture.needsUpdate = true;

        if ( onLoad ) onLoad( texture );

      }

    }

    for ( var i = 0; i < urls.length; ++ i ) {

      texture.images[ i ] = loader.load( urls[ i ], onImageLoad, undefined, onError );

    }

    return texture;

  },

  setCrossOrigin: function ( value ) {

    this.crossOrigin = value;
    return this;

  },

  setPath: function ( value ) {

    this.path = value;
    return this;

  }

} );

export default CubeTextureLoader;
