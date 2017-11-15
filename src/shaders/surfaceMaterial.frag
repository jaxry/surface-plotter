export default `
#define PHYSICAL

uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;

#ifndef STANDARD
	uniform float clearCoat;
	uniform float clearCoatRoughness;
#endif

varying vec3 vViewPosition;

#ifndef FLAT_SHADED

	varying vec3 vNormal;

#endif

#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
// #include <uv_pars_fragment>
// #include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <cube_uv_reflection_fragment>
#include <lights_pars>
#include <lights_physical_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
// #include <normalmap_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

uniform float uvScale;

varying vec3 vObjectPos;
varying vec3 vObjectNormal;

vec4 triplanarBlending( vec2 xPlane, vec2 yPlane, vec2 zPlane, vec3 weights, sampler2D texture ) {

	vec4 xTexel = texture2D( texture, xPlane );
	vec4 yTexel = texture2D( texture, yPlane );
	vec4 zTexel = texture2D( texture, zPlane );

	return xTexel * weights.x + yTexel * weights.y + zTexel * weights.z;

}

#if defined(USE_PARALLAXMAP) || defined(USE_NORMALMAP)

	// http://www.thetenthplanet.de/archives/1180
	mat3 cotangentFrame( vec3 N, vec3 dpdyperp, vec3 dpdxperp, vec2 duvdx, vec2 duvdy ) {

		// solve the linear system
		vec3 T = dpdyperp * duvdx.x + dpdxperp * duvdy.x;
		vec3 B = dpdyperp * duvdx.y + dpdxperp * duvdy.y;

		// construct a scale invariant frame
		float l = max( dot(T, T), dot(B, B) );
		if (l == 0.) {

			return mat3(1, 0, 0, 0, 1, 0, 0, 0, 1);

		}
		else {

			float invmax = inversesqrt( l );
			return mat3( T * invmax, B * invmax, N);

		}

	}

#endif

#ifdef USE_NORMALMAP

	uniform sampler2D normalMap;
	uniform vec2 normalScale;

	vec3 perturbNormal2Arb( mat3 TBN, vec2 uv ) {

		vec3 mapN = texture2D( normalMap, uv ).xyz * 2.0 - 1.0;
		mapN.xy = normalScale * mapN.xy;
		return normalize( TBN * mapN );

	}

#endif

#ifdef USE_PARALLAXMAP

	uniform sampler2D parallaxMap;
	uniform float parallaxScale;

	vec2 perturbUv( vec3 V, int numSamples, float scale, vec2 uv ) {

		float stepSize = 1. / float(numSamples);
		vec2 offsetDir = -scale * parallaxScale * V.xy * stepSize / V.z;

		float currRayHeight = 1.;
		float lastSampledHeight = 1.;
		float currSampledHeight = 1.;

		for ( int i = 0; i < 512; i++ ) {

			if ( i >= numSamples ) {
				break;
			}

			currSampledHeight = texture2D( parallaxMap, uv ).r;

			if ( currSampledHeight > currRayHeight ) {

				float delta1 = currSampledHeight - currRayHeight;
				float delta2 = currRayHeight + stepSize - lastSampledHeight;
				float ratio = delta1 / ( delta1 + delta2 );
				vec2 lastUv = uv - offsetDir;
				uv = ratio * lastUv + ( 1. - ratio ) * uv;

				break;

			}

			currRayHeight -= stepSize;
			uv += offsetDir;
			lastSampledHeight = currSampledHeight;

		}

		return uv;

	}

#endif

void main() {

	#include <clipping_planes_fragment>

	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;

	#include <logdepthbuf_fragment>

	float flipNormal = float( gl_FrontFacing ) * 2.0 - 1.0;
	vec3 normal = flipNormal * normalize( vNormal );

	vec3 blendWeights = abs( vObjectNormal );
	blendWeights = pow( blendWeights, vec3( 2 ) );
	blendWeights /= blendWeights.x + blendWeights.y + blendWeights.z;

	vec3 orientation = flipNormal * sign( vObjectNormal );

	vec2 xPlane = uvScale * vec2( -orientation.x * vObjectPos.z, vObjectPos.y );
	vec2 yPlane = uvScale * vec2( vObjectPos.x, -orientation.y * vObjectPos.z );
	vec2 zPlane = uvScale * vec2( orientation.z * vObjectPos.x, vObjectPos.y );

	#if defined(USE_PARALLAXMAP) || defined(USE_NORMALMAP)

		vec3 dpdx = dFdx( -vViewPosition );
		vec3 dpdy = dFdy( -vViewPosition );

		vec2 xduvdx = dFdx( xPlane );
		vec2 xduvdy = dFdy( xPlane );

		vec2 yduvdx = dFdx( yPlane );
		vec2 yduvdy = dFdy( yPlane );

		vec2 zduvdx = dFdx( zPlane );
		vec2 zduvdy = dFdy( zPlane );

		vec3 dpdyperp = cross( dpdy, normal );
		vec3 dpdxperp = cross( normal, dpdx );

		mat3 xTBN = cotangentFrame( normal, dpdyperp, dpdxperp, xduvdx, xduvdy );
		mat3 yTBN = cotangentFrame( normal, dpdyperp, dpdxperp, yduvdx, yduvdy );
		mat3 zTBN = cotangentFrame( normal, dpdyperp, dpdxperp, zduvdx, zduvdy );

	#endif

	#ifdef USE_PARALLAXMAP

		vec3 viewDir = normalize( vViewPosition );
		vec3 parallaxWeights = blendWeights / max( blendWeights.x, max( blendWeights.y, blendWeights.z ) );
		ivec3 numSamples = ivec3(mix( 50., 10., clamp( dot( viewDir, normal ), 0., 1. ) ) * parallaxWeights);

		xPlane = perturbUv( transpose( xTBN ) * viewDir, numSamples.x, parallaxWeights.x, xPlane );
		yPlane = perturbUv( transpose( yTBN ) * viewDir, numSamples.y, parallaxWeights.y, yPlane );
		zPlane = perturbUv( transpose( zTBN ) * viewDir, numSamples.z, parallaxWeights.z, zPlane );

	#endif

	#if defined USE_AOMAP
		vec4 texelPbr = triplanarBlending( xPlane, yPlane, zPlane, blendWeights, aoMap );
	#elif defined USE_ROUGHNESSMAP
		vec4 texelPbr = triplanarBlending( xPlane, yPlane, zPlane, blendWeights, roughnessMap );
	#elif defined USE_METALNESSMAP
		vec4 texelPbr = triplanarBlending( xPlane, yPlane, zPlane, blendWeights, metalnessMap );
	#endif

	// #include <map_fragment>
	#ifdef USE_MAP

		vec4 texelColor = triplanarBlending( xPlane, yPlane, zPlane, blendWeights, map );

		texelColor = mapTexelToLinear( texelColor );
		diffuseColor *= texelColor;

	#endif
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	// #include <roughnessmap_fragment>
	float roughnessFactor = roughness;

	#ifdef USE_ROUGHNESSMAP

		// reads channel G, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
		roughnessFactor *= texelPbr.g;

	#endif
	// #include <metalnessmap_fragment>
	float metalnessFactor = metalness;

	#ifdef USE_METALNESSMAP

		// reads channel B, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
		metalnessFactor *= texelPbr.b;

	#endif
	// #include <normal_fragment>
	#ifdef USE_NORMALMAP

		vec3 xNormal = perturbNormal2Arb( xTBN, xPlane );
		vec3 yNormal = perturbNormal2Arb( yTBN, yPlane );
		vec3 zNormal = perturbNormal2Arb( zTBN, zPlane );

		normal = normalize( xNormal * blendWeights.x + yNormal * blendWeights.y + zNormal * blendWeights.z );

	#endif
	#include <emissivemap_fragment>

	// accumulation
	#include <lights_physical_fragment>
	#include <lights_template>

	// modulation
	// #include <aomap_fragment>
	#ifdef USE_AOMAP

		// reads channel R, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
		float ambientOcclusion = ( texelPbr.r - 1.0 ) * aoMapIntensity + 1.0;

		reflectedLight.indirectDiffuse *= ambientOcclusion;

		#if defined( USE_ENVMAP ) && defined( PHYSICAL )

			float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );

			reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.specularRoughness );

		#endif

	#endif

	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;

	gl_FragColor = vec4( outgoingLight, diffuseColor.a );

	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

}
`