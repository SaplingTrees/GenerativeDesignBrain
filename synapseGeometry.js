import * as THREE from "three";


/*
	Source of this code:
		- https://discourse.threejs.org/t/curved2geometry-a-twofold-curved-geometry/25580
		- https://github.com/hofk/threejsResources/blob/master/Curved2Geometry/Curved2Geometry.html
		- By Hofk
*/

export function Curved2Geometry(design) { // optional: centerMorph, morphCount
	
	const g = new THREE.BufferGeometry( );
	
	const connected = design[ 0 ][ 1 ][2] === 'x' ? false : true;
	const symmetric = design[ 0 ][ 1 ][2] === 's' ? true : false;
	
	let dsgn = [];
	
	if ( symmetric ) {
		
		const len = design[ 0 ].length;
		
		for ( let i = 0; i < design.length; i ++ ) {
			
			dsgn.push( [] );
			
			for ( let j = 0; j < len; j ++ ) {
				
				dsgn[ i ].push( design[ i ][ j ] );	
				
			}
			
			if ( i === 0 ) {
				
				dsgn[ 0 ][ 3 ] = 0;
				
				
				for ( let j = len - 2; j >= 4; j -- ) {
					
					dsgn[ 0 ].push( 180 + 180 - design[ 0 ][ j ] );
					
				}
				
				dsgn[ 0 ][ len - 1 ] = 180;
				
			} else {
				
				for ( let j = len - 2; j >= 4; j -- ) {
					
					dsgn[ i ].push( design[ i ][ j ] );
					
				}
				
			}
			
		}
		
	} else {
		
		dsgn = design;
		
	}
	
	const rdefCount = dsgn[ 0 ].length - 3; // radial definition count
	
	g.radial = dsgn[ 0 ][ 2 ];		// radial max 
	g.vertical = dsgn[ 0 ][ 0 ];	// vertical max
	
	const wTop = dsgn[ 0 ][ 1 ][0] !== 'x' ? true : false;
	const flatTop = dsgn[ 0 ][ 1 ][0] === 'f' ? true : false;
	
	const wBtm = dsgn[ 0 ][ 1 ][1] !==  'x' ? true : false;
	const flatBtm = dsgn[ 0 ][ 1 ][1] === 'f' ? true : false;
	
	const angle = dsgn[ 0 ][ dsgn[ 0 ].length - 1 ];   
	const dAngle = angle / g.radial;	
		
	let angles = [ ]; // all radial angles in ° (g.radial + 1 many)
	let phi = []; // closest angle to the design in radiant (rdefCount many)
	
	for ( let j = 0; j <= g.radial; j ++ ) {
		
		angles[ j ] = dAngle * j; 
		
	}
	
	for ( let i = 0; i < rdefCount; i ++ ) { // angle adaptation
		
		for ( let j = 0; j <= g.radial; j ++ ) {
		
			if ( Math.abs( dsgn[ 0 ][ i + 3 ] - angles[ j ] ) < dAngle / 2 ) {
				
				phi.push( angles[ j ] * Math.PI / 180 ); // with degree to radiant
				
			}
			
		}
		
	}
	
    	
	g.morph = function( pts ) {
		
		// tangent( direction),  normal, binormal, shape in space
		
		let v3a = new THREE.Vector3( ); 
		let v3b = new THREE.Vector3( );
		
		let tangent = new THREE.Vector3( );	
		let normal = new THREE.Vector3( 0, 0, -1 ); // first normal to after ... 
		let binormal = new THREE.Vector3( );
		
		let idx = 0;
		
		for( let i = 0; i <= g.vertical; i ++ ) {
			
			if ( i === 0 ) tangent.subVectors( pts[ 1 ], pts[ 0 ] );
			if ( i > 0 && i < g.vertical ) tangent.subVectors( pts[ i + 1 ], pts[ i - 1 ] );
			if ( i === g.vertical ) tangent.subVectors( pts[ i ], pts[ i - 1 ] );
			
			binormal.crossVectors( normal, tangent );
			normal.crossVectors( tangent, binormal );
			
			binormal.normalize( );
			normal.normalize( );
				
			for( let j = 0; j <= g.radial; j ++ ) {
				
				v3a.addVectors( binormal.clone( ).multiplyScalar( g.pts2D[ i ][ j ].x ), normal.clone( ).multiplyScalar( g.pts2D[ i ][ j ].z ) );
				v3b.addVectors( pts[ i ], v3a );
				
				g.attributes.position.setXYZ( idx ++, v3b.x, v3b.y, v3b.z );
				
			}
			
		}
		
		idx --; // idx = ( g.radial + 1 ) * ( g.vertical + 1 ) - 1; // last index torso
		
		if( wTop ) {
			
			let x, y, z;
			
			g.attributes.position.setXYZ( ++ idx, pts[ 0 ].x, pts[ 0 ].y, pts[ 0 ].z ); // center top
			
			for( let j = 0; j <= g.radial ; j ++ ) {
				
				x = g.attributes.position.getX( j );
				y = g.attributes.position.getY( j );
				z = g.attributes.position.getZ( j );
				
				g.attributes.position.setXYZ( ++ idx, x, y, z );
				
			}
			
		}
		
		if( wBtm ) {
			
			let x, y, z, idxBtm;
			
			g.attributes.position.setXYZ( ++ idx, pts[ g.vertical ].x, pts[ g.vertical ].y, pts[ g.vertical ].z ); // center bottom
			
			for( let j = 0; j <= g.radial ; j ++ ) {
				
				idxBtm = ( g.radial + 1 ) * ( g.vertical + 1 ) - 1 - g.radial + j; // last index torso - g.radial + j
				
				x = g.attributes.position.getX( idxBtm );
				y = g.attributes.position.getY( idxBtm);
				z = g.attributes.position.getZ( idxBtm );
				
				g.attributes.position.setXYZ( ++ idx, x, y, z );
				
			}
			
		}
		
		g.attributes.position.needsUpdate = true;
		g.computeVertexNormals( );
		
	}
    
	
	g.dsgnCenters = [];
	
	for ( let i = 1; i < dsgn.length; i ++ ) {
		
		g.dsgnCenters.push( new THREE.Vector3( dsgn[ i ][ 0 ], dsgn[ i ][ 1 ], dsgn[ i ][ 2 ] ) );
		
	}
	
	g.cPoints = new THREE.CatmullRomCurve3( g.dsgnCenters, false ).getSpacedPoints( g.vertical );
	
	let dist2; // distanceToSquared	
	let idxCp = [ ]; // indices of nearest center points (design, calculated)
	
	for ( let i = 0; i < g.dsgnCenters.length; i ++ ) {
		
		dist2 = Infinity;
		
		for ( let j = 0; j < g.cPoints.length; j ++ ) {
			
			const d = g.dsgnCenters[ i ].distanceToSquared( g.cPoints[ j ] );
			
			if ( d < dist2 ) {
				
				dist2 = d;
				idxCp[ i ] = j;
				
			}
			
		}	
		
	}
	
	let v3 = new THREE.Vector3( );
	let cLen;
	let arg2 = [];
	arg2[ 0 ] = 0;
	
	for( let i = 0; i < idxCp.length - 1; i ++ ) {
		
		cLen = 0;
		
		for( let j = idxCp[ i ]; j < idxCp[ i + 1 ]; j ++ ) {
			
			v3.subVectors( g.cPoints[ j + 1 ], g.cPoints[ j ] );
			cLen += v3.length( );
			
		}
		
		arg2[ i + 1 ] = arg2[ i ] + cLen;
		
	}
	
	let pr3 = []; // points radial, vector 3, z = 0
	
	for ( let j = 0; j < rdefCount; j ++ ) {
		
		let V3a = [ ];
		
		for ( let i = 0; i < g.dsgnCenters.length; i ++ ) {
			
			V3a.push( new THREE.Vector3( arg2[ i ], dsgn[ i + 1 ][ j + 3 ], 0 ) );
			
		}
		
		pr3.push( new THREE.CatmullRomCurve3( V3a ).getPoints( g.vertical ) );
		
	}
	
	g.pts2D = []; // all points orthogonal cut, vector 3 in plane,  y is 0
	let V3 = [];
	
	for ( let i = 0; i <= g.vertical; i ++ ) {
		
		V3 = [];
		
		for ( let j = 0 ; j < rdefCount; j ++  ) {
			
			//V3.push( new THREE.Vector3( -Math.cos( phi[ j ] ) * pr2[ j ][ i ].y,  0,  Math.sin(  phi[ j ] ) * pr2[ j ][ i ].y ) );
			V3.push( new THREE.Vector3( -Math.cos( phi[ j ] ) * pr3[ j ][ i ].y,  0,  Math.sin(  phi[ j ] ) * pr3[ j ][ i ].y ) );
			
		}
		
		g.pts2D.push( new THREE.CatmullRomCurve3( V3, connected ).getSpacedPoints( g.radial ) );
		
	}
	
	BasicGeometry( g.radial, g.vertical, wTop, wBtm ); // create a rudimentary geometry
	
	let idx = ( g.radial + 1 ) * ( g.vertical + 1 ) - 1; // // last index torso
	
	if( wTop ) {
		
		let zMax = -Infinity;
		let xMax = -Infinity;
		
		for ( let j = 0; j <= g.radial; j ++ ) {
			
			zMax = Math.abs( g.pts2D[ 0 ][ j ].z ) > zMax ? Math.abs( g.pts2D[ 0 ][ j ].z ) : zMax;
			xMax = Math.abs( g.pts2D[ 0 ][ j ].x ) > xMax ? Math.abs( g.pts2D[ 0 ][ j ].x ) : xMax;
			
		}
		
		idx ++; // center uv in BasicGeometry
		
		for( let j = 0; j <= g.radial ; j ++ ) {
			
			g.attributes.uv.setXY( ++ idx, 0.5 - g.pts2D[ 0 ][ j ].z / zMax / 2, 0.5 - g.pts2D[ 0 ][ j ].x / xMax / 2 );
			
		}
		
	}
	
	if( wBtm ) {
		
		let zMax = -Infinity;
		let xMax = -Infinity;
		
		for ( let j = 0; j <= g.radial; j ++ ) {
			
			zMax = Math.abs( g.pts2D[ g.vertical ][ j ].z ) > zMax ? Math.abs( g.pts2D[ g.vertical ][ j ].z ) : zMax;
			xMax = Math.abs( g.pts2D[ g.vertical ][ j ].x ) > xMax ? Math.abs( g.pts2D[ g.vertical ][ j ].x ) : xMax;
			
		}
		
		idx ++; // center uv in BasicGeometry
		
		for( let j = 0; j <= g.radial ; j ++ ) {
			
			g.attributes.uv.setXY( ++ idx, 0.5 + g.pts2D[ g.vertical ][ j ].z / zMax / 2, 0.5 - g.pts2D[ g.vertical ][ j ].x / xMax / 2 );
			
		}
		
	}	
	
	g.morph( g.cPoints ); // initial morph of BasicGeometry
	
	g.computeVertexNormals( );
	
	if ( connected ) { // calculate new normals at mantle seam
		
		for( let i = 0; i <= g.vertical; i ++ ) {
			
			smoothEdge( ( g.radial + 1 ) * i, ( g.radial + 1 ) * i + g.radial );
			
		}
		
	}
	
	if ( wTop && !flatTop ) { // calculate new normals at top seam
		
		for( let j = 0; j <= g.radial; j ++ ) {
			
			smoothEdge( ( g.radial + 1 ) * ( g.vertical + 1 ) + 1 + j, j );
			
		}
		
	}
	
	if ( wBtm && !flatBtm ) { // calculate new normals at bottom seam
		
		for( let j = 0; j <= g.radial ; j ++ ) {
			
			const offs = wTop ? + g.radial + 2 : 0;
			
			smoothEdge( ( g.radial + 1 ) * g.vertical + j, ( g.radial + 1 ) * ( g.vertical + 1 ) + offs + 1 + j );
			
		}
		
	}
	
	g.attributes.normal.needsUpdate = true;
	
	return g;

	// ............................................................................
	
	function BasicGeometry( radialSegments, heightSegments, withTop, withBottom ) {
		
		let indices = [];
		let uvs = [];
		
		let index = 0;
		let indexArray = [];
		let groupStart = 0; 
		
		let groupCount = 0;
		
		for ( let y = 0; y <= heightSegments; y ++ ) {
			
			let indexRow = [];
			
			let v = y / heightSegments;
			
			if ( symmetric ) { // texture mirror image
				
				for ( let x = 0; x <= radialSegments / 2; x ++ ) {
					
					uvs.push( x / ( radialSegments / 2 ), 1 - v );
					indexRow.push( index ++ );
					
				}
				
				for ( let x = radialSegments / 2 + 1 ; x <= radialSegments; x ++ ) {
					
					uvs.push( ( radialSegments - x ) / ( radialSegments / 2 ), 1 - v );
					indexRow.push( index ++ );
					
				}
			
			} else { // only one texture 
			
				for ( let x = 0; x <= radialSegments; x ++ ) {
					
					uvs.push( x / radialSegments, 1 - v );
					indexRow.push( index ++ );
					
				}
			}
			
			indexArray.push( indexRow );
			
		}
		
		let a, b, c, d;
		
		for ( let i = 0; i < radialSegments; i ++ ) {
			
			for ( let j = 0; j < heightSegments; j ++ ) {
				
				a = indexArray[ j ][ i ];
				b = indexArray[ j + 1 ] [ i ];
				c = indexArray[ j + 1 ][ i + 1 ];
				d = indexArray[ j ] [ i + 1 ];
				
				indices.push( a, b, d );
				indices.push( b, c, d );
				
				groupCount += 6;
				
			}
			
		}
		
		g.addGroup( groupStart, groupCount, 0 );
		
		groupStart += groupCount;
		
		let verticesCount = ( radialSegments + 1 ) * ( heightSegments + 1 )
		
		if ( wTop ) generateCap( true );
		if ( wBtm ) generateCap( false );
		
		g.setIndex( new THREE.BufferAttribute( new Uint32Array( indices ), 1 ) );
		g.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( verticesCount * 3 ), 3 ) );
		g.setAttribute( 'uv', new THREE.BufferAttribute( new Float32Array( uvs ), 2 ) );
		
		function generateCap( top ) {
			
			let groupCount = 0;
			
			uvs.push( 0.5, 0.5 );
			
			const centerIndex = index; 
			
			for ( let x = 0; x <= radialSegments; x ++ ) {
				
				uvs.push( 0, 0 );
				index ++;
				
			}
			
			index ++;
			
			for ( let x = 1; x <= radialSegments; x ++ ) {
				
				const c = centerIndex;
				const i = centerIndex + x;
				
				if ( top ) {
					
					indices.push( i, i + 1, c );	// face top
					
				} else {
					
					indices.push( i + 1, i, c ); 	// face bottom
					
				}
				
				groupCount += 3;
				
			}
			
			g.addGroup( groupStart, groupCount, top ? 1 : 2 );
			
			groupStart += groupCount;
			
			verticesCount += radialSegments + 2; // with center 
			
		}
		
	}
	
	function smoothEdge( idxa, idxb ) {
		
		let v3a = new THREE.Vector3( );
		let v3b = new THREE.Vector3( );
		
		v3a.set( g.attributes.normal.getX( idxa ), g.attributes.normal.getY( idxa ), g.attributes.normal.getZ( idxa ) );
		v3b.set( g.attributes.normal.getX( idxb ), g.attributes.normal.getY( idxb ), g.attributes.normal.getZ( idxb ) );
		
		v3.addVectors( v3a, v3b ).normalize( );
		
		g.attributes.normal.setXYZ( idxa, v3.x, v3.y, v3.z );
		g.attributes.normal.setXYZ( idxb, v3.x, v3.y, v3.z );
		
	}

}