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
#ifdef USE_NORMALMAP

	uniform sampler2D normalMap;
	uniform vec2 normalScale;

	// Per-Pixel Tangent Space Normal Mapping
	// http://hacksoflife.blogspot.ch/2009/11/per-pixel-tangent-space-normal-mapping.html

	vec3 perturbNormal2Arb( vec3 dxEyePos, vec3 dyEyePos, vec3 surf_norm, vec2 uv ) {

		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );

		vec3 S = normalize( dxEyePos * st1.t - dyEyePos * st0.t );
		vec3 T = normalize( -dxEyePos * st1.s + dyEyePos * st0.s );
		vec3 N = surf_norm;

		vec3 mapN = texture2D( normalMap, uv ).xyz * 2.0 - 1.0;
		mapN.xy = normalScale * mapN.xy;
		mat3 tsn = mat3( S, T, N );
		return normalize( tsn * mapN );

	}

#endif
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

vec4 triplanarBlending( vec2 xPlane, vec2 yPlane, vec2 zPlane, vec3 weights, sampler2D texture ) {

	vec4 xTexel = texture2D( texture, xPlane );
	vec4 yTexel = texture2D( texture, yPlane );
	vec4 zTexel = texture2D( texture, zPlane );

	return xTexel * weights.x + yTexel * weights.y + zTexel * weights.z;

}

uniform float uvScale;
varying vec3 vObjectPos;
varying vec3 vObjectNormal;

void main() {

	#include <clipping_planes_fragment>

	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;

	#include <logdepthbuf_fragment>
	#include <normal_flip>

	vec3 normal = normalize( vNormal ) * flipNormal;

	vec3 blendWeights = abs( vObjectNormal );
	blendWeights = pow( blendWeights, vec3( 25 ) );
	blendWeights /= blendWeights.x + blendWeights.y + blendWeights.z;

	vec3 orientation = flipNormal * sign( vObjectNormal );

	vec2 xPlane = uvScale * vec2( -orientation.x * vObjectPos.z, vObjectPos.y );
	vec2 yPlane = uvScale * vec2( vObjectPos.x, -orientation.y * vObjectPos.z );
	vec2 zPlane = uvScale * vec2( orientation.z * vObjectPos.x, vObjectPos.y );

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
	// #include <normal_flip>
	// #include <normal_fragment>
	#ifdef USE_NORMALMAP

		// Workaround for Adreno 3XX dFd*( vec3 ) bug. See #9988
		vec3 dxEyePos = vec3( dFdx( -vViewPosition.x ), dFdx( -vViewPosition.y ), dFdx( -vViewPosition.z ) );
		vec3 dyEyePos = vec3( dFdy( -vViewPosition.x ), dFdy( -vViewPosition.y ), dFdy( -vViewPosition.z ) );

		vec3 xNormal = perturbNormal2Arb( dxEyePos, dyEyePos, normal, xPlane );
		vec3 yNormal = perturbNormal2Arb( dxEyePos, dyEyePos, normal, yPlane );
		vec3 zNormal = perturbNormal2Arb( dxEyePos, dyEyePos, normal, zPlane );

		normal = xNormal * blendWeights.x + yNormal * blendWeights.y + zNormal * blendWeights.z;

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
