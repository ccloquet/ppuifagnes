$(window).load(onDeviceReady)

var xlabels    = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31'];
var ylabels    = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j','k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v'];

var xlabels_s  = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16'];
var ylabels_s  = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j','k'];

var xlabels_t  = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14'];
var ylabels_t  = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j','k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's'];
 
var maps = 
{
	baraque:	{id:'baraque', 	 filename:'Carte zone Baraque Michel PPUI Haute Fagne.jpg', 	name:'Baraque Michel', 	x0y0 : [264000, 141500], xlabels:xlabels,   ylabels:ylabels,   dx:500, dy:500}, // main, show it anyway, has priority to determine grid square
	est:		{id:'est', 	 filename:'Carte zone Est PPUI Haute Fagne.jpg', 		name:'Est', 		x0y0 : [273000, 136000], xlabels:xlabels,   ylabels:ylabels,   dx:500, dy:500},
	malchamps:	{id:'malchamps', filename:'Carte zone Malchamps PPUI Haute Fagne.jpg', 		name:'Malchamps', 	x0y0 : [255000, 132000], xlabels:xlabels_s, ylabels:ylabels_s, dx:500, dy:500},
	nord:		{id:'nord', 	 filename:'Carte zone Nord PPUI Haute Fagne.jpg', 		name:'Nord', 		x0y0 : [269500, 150000], xlabels:xlabels,   ylabels:ylabels,   dx:500, dy:500},
	enduro:		{id:'enduro', 	 filename:'Carte zone Enduro', 					name:'Enduro', 		x0y0 : [244800, 133000], xlabels:xlabels_t, ylabels:ylabels_t, dx:400, dy:400}
}


// x0y0  in EPSG31370
// dx, dy in meters
var baseMaps = {}, overlayMaps = {}, layercontrol = null

var mycrs_L72 = null
var mycrs_L08 = null
var mysec     = 0;
var WP        = null;
var LF        = []
var CM	      = null
var mymap     = null
var map_state = 0
var mycolor   = 'white'
var epsg_31370_str = '+lat_0=90 +lat_1=51.16666723333333 +lat_2=49.8333339 '
		         +'+lon_0=4.367486666666666 '
       			 +'+x_0=150000.013 +y_0=5400088.438 '
	       		 +'+ellps=intl '
	       		 +'+proj=lcc '
			 +'+towgs84=-106.869,52.2978,-103.724,0.3366,-0.457,1.8422,-1.2747 '
	       		 +'+units=m '
	       		 +'+no_defs'

var epsg_3812_str  = "+lat_1=49.83333333333334 +lat_2=51.16666666666666 +lat_0=50.797815 +lon_0=4.359215833333333 +x_0=649328 +y_0=665262 +ellps=GRS80 +proj=lcc +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"; // !

function onDeviceReady() 
{
	init()
}

function init()
{
	$( document ).ready(function() 
	{
		$("body").height($(window).height())

		$.ui.dialog.prototype._makeDraggable = function() 
		{	 
			this.uiDialog.draggable(
			{
				containment: false,
			});
		};

		$( "#maindiv" ).dialog(
		{
			dialogClass:'dialogClass', 
			width:900,
		 
			position: {my: "right top",  at: "right top", of: window },
			title:'PPUI FAGNES - latitude, longitude → carré'
		}).dialogExtend(
		{
			"minimizable" : true,
			"closable" : false,
			"minimizeLocation" : "right",
      		});

		$('#credits').on('click', function(){
			$('#display_credits').dialog(
			{
				dialogClass:'dialogClass', 
				width:600,
				title:'Credits'
			})
		})
	});

	mycrs_L72 = new L.Proj.CRS('EPSG:31370', epsg_31370_str, { resolutions: [8192, 4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1] })
	mycrs_L08 = new L.Proj.CRS('EPSG:3812',  epsg_3812_str , { resolutions: [8192, 4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1] })
	
	init_map()

	clear_grids()
	for (key in maps) 
	{
		if (maps.hasOwnProperty(key) ) 
		{
			var mapdet = maps[key]
			show_grid( {x:mapdet.x0y0[0],y:mapdet.x0y0[1]}, mapdet.xlabels, mapdet.ylabels, mapdet.dx, mapdet.dy, mapdet.name, key, mycolor, true )
		}
	}
	mymap.invalidateSize()

	mymap.on('baselayerchange', function (e) 
	{
		console.log(e.name)
		switch(e.name)
		{
			case 'IGN':
				mycolor='black';
				break;
			default:
				mycolor='white';
				break;
			
		}
		display_gird_on_zone_change()
	});

	$('#go_convert').click(compute_ll)

	$('#WGS84_LAT').attr('placeholder', 'ex: 50,392 ou 50°30\'40,32"')
	$('#WGS84_LON').attr('placeholder', 'ex: 4,392 ou 4°30\'40,32"')
}
 
function compute_ll()
{
	var latlngs = {}

	if ( ($('#LAM72_X').val() != 0) &  ($('#LAM72_Y').val() != 0) )
	{
		latlngs.epsg31370 = {x:$('#LAM72_X').val(), y:$('#LAM72_Y').val()}
		latlngs.wgs84     = mycrs_L72.projection.unproject(latlngs.epsg31370)
		latlngs.epsg3812  = mycrs_L08.projection.project(latlngs.wgs84)
		latlngs.utm 	  = mgrs.forward([latlngs.wgs84.lng, latlngs.wgs84.lat])
	}
 	else if ( ($('#WGS84_LAT').val() != 0) &  ($('#WGS84_LON').val() != 0) )
	{
		var la = $('#WGS84_LAT').val()
		var lo = $('#WGS84_LON').val()

		la = la.replace(/,/g, '.')
		lo = lo.replace(/,/g, '.')

		if ( (la.indexOf('°') > 0) & (la.indexOf('\'') > 0)& (la.indexOf('"') > 0)  &  (lo.indexOf('°') > 0) & (lo.indexOf('\'') > 0)& (lo.indexOf('"') > 0) )
		{
			la = dms2dd(la)
			lo = dms2dd(lo)
		}
		else if( (la.indexOf('°') > 0) & (la.indexOf('\'') > 0)   &  (lo.indexOf('°') > 0) & (lo.indexOf('\'') > 0) )
		{
			la = dmd2dd(la)
			lo = dmd2dd(lo)
		}
	 
		latlngs.wgs84     = L.latLng(la, lo)
		latlngs.epsg31370 = mycrs_L72.projection.project(latlngs.wgs84)
		latlngs.epsg3812  = mycrs_L08.projection.project(latlngs.wgs84)
		latlngs.utm 	  = mgrs.forward([latlngs.wgs84.lng, latlngs.wgs84.lat])
	}

	// 1. detect in which map
	// 2. display map grid

	var found = 0
	var mapdets = []

	for (key in maps) 
	{
		if (maps.hasOwnProperty(key) ) 
		{
			var mapdet = maps[key]
			if (is_in_map(mapdet, latlngs.epsg31370 ))
			{
				found = 1
				mapdets.push(mapdet)
			}
		}
	}

	display(latlngs, mapdets, found, true)
	$('#WGS84_LAT').val('')
	$('#WGS84_LON').val('')
	$('#LAM72_X').val('')
	$('#LAM72_Y').val('')
} 

function compute_ll_light(wgs84, epsg31370)
{
	// 1. detect in which map
	// 2. display map grid

	var found   = 0
	var mapdets = []
	var txt     = ''

	for (key in maps) 
	{
		if (maps.hasOwnProperty(key) ) 
		{
			var mapdet = maps[key]
			if (is_in_map(mapdet, epsg31370 ))
			{
				found = 1
				mapdets.push(mapdet)
			}
		}
	}
	
	if (found == 1)
	{
		var display_name = [], display_square = []

		for (var j=0; j<mapdets.length; ++j)
		{
			if ( ($('#zoneselect').val() != 'all') & ($('#zoneselect').val() != mapdets[j].id) )
			{
				continue
			}

			var x0y0    = mapdets[j].x0y0 	
	
			var xlabels = mapdets[j].xlabels
			var ylabels = mapdets[j].ylabels

			var dx      = mapdets[j].dx
			var dy      = mapdets[j].dy
			var name    = mapdets[j].name

			var g       = getSquarePoint(mycrs_L72, [wgs84.lng , wgs84.lat], x0y0, dx, dy, xlabels, ylabels)
			if (g != null) 	txt += '<b>' + g.mysquare + ' (' + name+ ')</b><br>' 
 		}
	}

	return txt
} 

function is_in_map(mapdet, latlng_31370)
{
	var x0 = mapdet.x0y0[0]
	var y0 = mapdet.x0y0[1]

	var lx = mapdet.xlabels.length * mapdet.dx
	var ly = mapdet.ylabels.length * mapdet.dy

	//console.log(x0, y0, lx, ly, mapdet.xlabels.length,  mapdet.dx, mapdet.ylabels.length,  mapdet.dy)

	if ( (x0 <= latlng_31370.x) & (latlng_31370.x <= x0+lx) & ( (y0-ly) <= latlng_31370.y) & (latlng_31370.y <= y0) )
	{
		return true
	}

	return false
}

function display(latlngs, mapdets, found, center)
{
	if (found == 1)
	{
		var display_name = [], display_square = []

		for (var j=0; j<mapdets.length; ++j)
		{
			console.log($('#zoneselect').val(),  mapdets[j].id)
			if ( ($('#zoneselect').val() != 'all') & ($('#zoneselect').val() != mapdets[j].id) )
			{
				continue
			}

			var x0y0    = mapdets[j].x0y0 	
	
			var xlabels = mapdets[j].xlabels
			var ylabels = mapdets[j].ylabels

			var dx      = mapdets[j].dx
			var dy      = mapdets[j].dy
			var name    = mapdets[j].name

			display_name.push(name)

			var g       = getSquarePoint(mycrs_L72, [latlngs.wgs84.lng , latlngs.wgs84.lat], x0y0, dx, dy, xlabels, ylabels)
			if (g != null) 	display_square.push(g.mysquare)
			else		display_square.push('')
 		}
		$('#RESULT_GRID_PLANCHE').html(display_name.join('<br>'))
		$('#RESULT_GRID_SQUARE').html(display_square.join('<br>'))
	}
	else
	{
		$('#RESULT_GRID_PLANCHE').text('')
		$('#RESULT_GRID_SQUARE').text('')
	}

	$('#RESULT_WGS84_DD_LAT').text( (Math.round( latlngs.wgs84.lat * 100000) / 100000).toString().replace('.',','))
	$('#RESULT_WGS84_DD_LON').text( (Math.round( latlngs.wgs84.lng * 100000) / 100000).toString().replace('.',','))

	$('#RESULT_WGS84_DMS_LAT').text( dd2dms(latlngs.wgs84.lat).toString().replace('.',','))
	$('#RESULT_WGS84_DMS_LON').text( dd2dms(latlngs.wgs84.lng).toString().replace('.',','))

	$('#RESULT_WGS84_DMD_LAT').text( dd2dmd(latlngs.wgs84.lat).toString().replace('.',','))
	$('#RESULT_WGS84_DMD_LON').text( dd2dmd(latlngs.wgs84.lng).toString().replace('.',','))

	$('#RESULT_LAM72_X').text( (Math.round(latlngs.epsg31370.x*10)/10).toString().replace('.',',')) 
	$('#RESULT_LAM72_Y').text( (Math.round(latlngs.epsg31370.y*10)/10).toString().replace('.',',')) 

        $('#RESULT_LAM08_X').text( (Math.round(latlngs.epsg3812.x*10)/10).toString().replace('.',',')) 
	$('#RESULT_LAM08_Y').text( (Math.round(latlngs.epsg3812.y*10)/10).toString().replace('.',',')) 

	$('#RESULT_UTM').text(latlngs.utm.substr(0,2) + ' ' +  latlngs.utm.substr(2,1)  + ' ' +  latlngs.utm.substr(3,2) + ' ' + latlngs.utm.substr(5,5) + ' ' + latlngs.utm.substr(10,5)   )

	set_position(latlngs.wgs84, center)
}

function dms2dd(dms)
{
	var d0 = dms.split('°')
	var D = d0[0].trim()
	var d1 = d0[1].split("'")
	var M = d1[0].trim()
	var d2 = d1[1].split('"')
	var S = d2[0].trim()

	console.log(D,M,S)
	var dd = parseFloat(D) + parseFloat(M)/60 + parseFloat(S)/3600
	console.log(dd)
	return dd
}

function dmd2dd(dmd)
{
	var d0  = dmd.split('°')
	var D   = d0[0].trim()
	var d1  = d0[1].split("'")
	var M   = d1[0].trim()

	console.log(D,M)
	var dd = parseFloat(D) + parseFloat(M)/60 
	console.log(dd)
	return dd
}

function dd2dms(dd)
{
	var r = 0;
	var d = 0, m = 0, s = 0, X = 1000000000000	// mult factor to avoid inaccuracies in the soustraction operations
	dd = parseFloat(dd)

	d = Math.floor(dd)
	r = (dd*X - d*X)*60/X; 
 
	m = Math.floor(r)
	s = Math.round((r*X - m*X) * 60/X *100)/100

	return d + '° ' + m + "' " + s + '"'
}

function dd2dmd(dd)
{
	var r = 0;
	var d = 0, m = 0, s = 0, X = 1000000000000	// mult factor to avoid inaccuracies in the soustraction operations
	dd = parseFloat(dd)

	d = Math.floor(dd)
	m = Math.round((dd*X - d*X)*60/X*10000)/10000; 
 
	return d + '° ' + m + "' " 
}

function init_map()
{
	mymap = L.map('map2' ,{crs:  mycrs_L72, attributionControl: false, zoomControl:false  } ).setView([50.5399, 6.2544], 8);

	var legend = L.control({position: 'topleft'});

	L.control.scale({position: 'bottomright'}).addTo(mymap);

	legend.onAdd = function (map) 
	{
		var div = L.DomUtil.create('div', 'info legend');
		var ih = '<select id="zoneselect"><option value="all">Toutes les zones</option>'

		for (key in maps) 
		{
			if (maps.hasOwnProperty(key) ) 
			{
				ih += '<option value="'+maps[key]['id']+'">Zone '+maps[key]['name']+'</option>'
			 
			}
		}

		div.innerHTML = ih;
		div.firstChild.onmousedown = div.firstChild.ondblclick = L.DomEvent.stopPropagation;
		return div;
	};

	$('body').delegate('#zoneselect', 'change', function(e)
	{
		display_gird_on_zone_change()
	})

	legend.addTo(mymap);

	L.control.zoom().addTo(mymap)

	L.control.attribution({position: 'bottomleft'}).addTo(mymap);

	mymap.on('mousemove',       function(e) 
	{
                var my_latlng_31370 	= mycrs_L72.projection.project(L.latLng(e.latlng))
		var grid_square 	= compute_ll_light(L.latLng(e.latlng), my_latlng_31370)
                $("#map_lat_lng_show").html( grid_square + 'Lat,Lon (WGS84) : ' + (Math.round(e.latlng.lat*10000)/10000).toString().replace('.',',') + ' ; ' + (Math.round(e.latlng.lng*10000)/10000).toString().replace('.',',')+ '<br> X,Y (Lambert 72) : ' + Math.round(my_latlng_31370.x)+' ; ' + Math.round(my_latlng_31370.y) )
        });

	mymap.on('click',       function(e) 
	{
		
		var my_latlngs = {}

		my_latlngs.wgs84     = e.latlng
                my_latlngs.epsg31370 = mycrs_L72.projection.project(L.latLng(e.latlng))
		my_latlngs.epsg3812  = mycrs_L08.projection.project(L.latLng(e.latlng))
		my_latlngs.utm 	     = mgrs.forward([e.latlng.lng, e.latlng.lat])

		var found 	     = 0
		var mapdet = null, 
		    mapdets = []

		for (key in maps) 
		{
			if (maps.hasOwnProperty(key) ) 
			{
				mapdet = maps[key]
				if (is_in_map(mapdet, my_latlngs.epsg31370 ))
				{
					found = 1
					mapdets.push(mapdet)
				}
			}
		}

		display(my_latlngs, mapdets, found, false)

		$('#WGS84_LAT').val('')
		$('#WGS84_LON').val('')
		$('#LAM72_X').val('')
		$('#LAM72_Y').val('')

                //$("#map_lat_lng_show").html( 'Lat,Lon (WGS84) : ' + (Math.round(e.latlng.lat*10000)/10000).toString().replace('.',',') + ' ; ' + (Math.round(e.latlng.lng*10000)/10000).toString().replace('.',',')+ '<br> X,Y (Lambert 72) : ' + Math.round(my_latlng_31370.x)+' ; ' + Math.round(my_latlng_31370.y)+'</span>')

        });

	baseMaps['IGN'] = L.tileLayer.wms("https://wms.ngi.be/cartoweb/service",
		{
			layers: 	'cartoweb_topo',
			format: 	'image/jpeg', 
			transparent: 	 true,
			opacity:	.9,
			attribution:     "Cartoweb (c) IGN-NGI <div id='map_lat_lng_show' style='font-size:larger'></div>",
			continuousWorld: true,
		}) //.addTo(mymap)


	baseMaps['Région Wallonne - aérienne'] = L.tileLayer.wms("https://geoservices.wallonie.be/arcgis/services/IMAGERIE/ORTHO_LAST/MapServer/WMSServer",
		{
			layers: 	'0',
			format: 	'image/jpeg', 
			transparent: 	true,
			opacity:	.9,
			attribution: "Dernière image disponible<br>(c) Région Wallonne -- DGO4 <div id='map_lat_lng_show' style='font-size:larger'></div>",
			continuousWorld: true,
		}) .addTo(mymap)

	overlayMaps['roads'] = L.tileLayer.wms("http://geoservices.wallonie.be/arcgis/services/TOPOGRAPHIE/PICC_VDIFF/MapServer/WmsServer",
		{
			layers: 	'9,10,11,29', // voiries + toponmymie
			format: 	'image/png32', 
			transparent: 	true,
			continuousWorld: true,
		}) .addTo(mymap)

	L.Control.FileLayerLoad.LABEL = '<i class="fa fa-folder-open"></i>'
	var control =L.Control.fileLayerLoad({
	        // Allows you to use a customized version of L.geoJson.
        	// For example if you are using the Proj4Leaflet leaflet plugin,
	        // you can pass L.Proj.geoJson and load the files into the
        	// L.Proj.GeoJson instead of the L.geoJson.
	        layer: L.geoJson,
        	// See http://leafletjs.com/reference.html#geojson-options
	 
	        layerOptions: {style: {color:'blue'}},
        	// Add to map after loading (default: true) ?
	        addToMap: true,
        	// File size limit in kb (default: 1024) ?
	        fileSizeLimit: 4096,
         
	    }).addTo(mymap);

	layercontrol = L.control.layers(baseMaps, overlayMaps, {position:'topleft'}).addTo(mymap);	// base, overlay


    control.loader.on('data:loaded', function (event) {
        // event.layer gives you access to the layers you just uploaded!
	//console.log(event)
        // Add to map layer switcher
       layercontrol.addOverlay(event.layer, event.filename);
    });



/*    control.loader.on('data:error', function (error) {
        // Do something usefull with the error!
        console.error(error);
    });*/
}
function clear_grids()
{
	if (LF != []) for (var i=0; i< LF.length; ++i) mymap.removeLayer(LF[i])
}
function show_grid(latlng_31370, xlabels, ylabels, dx, dy, name, mapid, mycolor, showall)
{
	// lowlevel grid
	var G = []
	
	for(var i=0; i<xlabels.length; ++i) 
	{
		for(var j=0 ; j<ylabels.length; ++j)
		{

			var xy_center = {x: (latlng_31370.x + (i+.5) * dx), y: (latlng_31370.y - (j+.5) * dx)}

			var LL    = mycrs_L72.projection.unproject(xy_center)	// center of the square
			var LL_TL = mycrs_L72.projection.unproject({x: (latlng_31370.x + (i+ 0) * dx), y: (latlng_31370.y - (j+ 0) * dx)})	// top left
			var LL_TR = mycrs_L72.projection.unproject({x: (latlng_31370.x + (i+ 1) * dx), y: (latlng_31370.y - (j+ 0) * dx)})	// top right
			var LL_BL = mycrs_L72.projection.unproject({x: (latlng_31370.x + (i+ 0) * dx), y: (latlng_31370.y - (j+ 1) * dx)})	// bottom left
			var LL_BR = mycrs_L72.projection.unproject({x: (latlng_31370.x + (i+ 1) * dx), y: (latlng_31370.y - (j+ 1) * dx)})	// bottom right	

			if (showall) if (mapid != 'baraque' ) if (is_in_map(maps['baraque'], xy_center)) continue;	// avoid grid collisions (first map has priority)

			var lat_lngs = [LL_TL, LL_TR, LL_BR, LL_BL, LL_TL]

			if ( ( (i%3==0) & (j%3==0) ) ) 
			{
				var myIcon = L.divIcon({className:'emptyicon color'+mycolor, html: ylabels[j].toUpperCase()+xlabels[i]});
				G.push(L.marker(LL, {icon: myIcon}))
			}
			if ( (i == 0) | (j == 0 ) )
			{
				var myIcon = L.divIcon({className:'boldicon color'+mycolor, html: ylabels[j].toUpperCase()+xlabels[i]});
				G.push(L.marker(LL, {icon: myIcon}))
			}

			// one idea to draw squares ... but they are not square given the coordinate transsformation
			// var circle = new L.Circle(LL, dx/2);
			// G.push(new L.Rectangle(circle.getBounds(), {color: 'white',fillOpacity:0,weight: 1}));

			// center of the squares
			//G.push(new L.CircleMarker(LL, {color: 'white',fillOpacity:.5,weight: 1}));

			G.push(new L.Polyline(lat_lngs, {color: mycolor,fillOpacity:0,weight: 1}));
		}
	}
	
	// High level grid delienation

	var LL_TL  = mycrs_L72.projection.unproject({x: (latlng_31370.x + (0) * dx), 		y: (latlng_31370.y - (0) * dy)})	// top left
	var LL_TR  = mycrs_L72.projection.unproject({x: (latlng_31370.x + (xlabels.length) * dx), 	y: (latlng_31370.y - (0) * dy)})	// top right
	var LL_BL  = mycrs_L72.projection.unproject({x: (latlng_31370.x + (0) * dx), 		y: (latlng_31370.y - (ylabels.length) * dy)})	// bottom left
	var LL_BR  = mycrs_L72.projection.unproject({x: (latlng_31370.x + (xlabels.length) * dx), 	y: (latlng_31370.y - (ylabels.length) * dy)})	// bottom right	

	var lat_lngs = [LL_TL, LL_TR, LL_BR, LL_BL, LL_TL]
	G.push(new L.Polyline(lat_lngs, {color: 'yellow',fillOpacity:0,weight: 3}));

	var LL_sup = mycrs_L72.projection.unproject({x: (latlng_31370.x + (0) * dx), 		y: (latlng_31370.y - (-1) * dy)})	// for title

	var myIcon = L.divIcon({className:'emptyicon yellowicon', html:  ('Zone ' +name).replace(/ /g, '&nbsp;')});
	G.push(L.marker(LL_sup, {icon: myIcon}))

	LF.push(L.featureGroup(G).addTo(mymap))
}

function set_position(LL, center)
{
	if (CM != null) mymap.removeLayer(CM)
	CM = L.circleMarker( LL , {color:'red', fillColor:'red', opacity:1})
	CM.addTo(mymap)

	if (center) mymap.panTo(LL);
}

function getSquarePoint(thecrs, mycoordinates, x0y0, dx, dy, caption_x, caption_y)
{
	var latlng = [mycoordinates[1], mycoordinates[0]]
	// x0, y0, dx, dy are in EPSG 31370
	// latlng are in EPSG 4326

	//var latlng11 = crs.projection.unproject(L.point(153311.9,152090.4));
	//var latlng_31370 = mycrs_L72.projection.project(L.latLng([50.83,4.43]))
	var 	latlng_31370 = thecrs.projection.project(L.latLng(latlng)),
		eta_y = -(latlng_31370.y - x0y0[1]) / dy, eta_x = (latlng_31370.x - x0y0[0]) / dx,
	  	iy = Math.floor ( eta_y ), hy = eta_y - iy,
		ix = Math.floor ( eta_x ), hx = eta_x - ix,
		mysquare

	if ( (ix >=0) & (ix < caption_x.length) & (iy >=0) & (iy < caption_y.length)) 	mysquare = caption_y[iy].toUpperCase() + ' ' + caption_x[ix] 
	else										mysquare = "---"
		
	var ret =  
	{	
		mysquare: 	mysquare,
		mylambert72:	'x = ' + Math.round(latlng_31370.x) + ', y = ' + Math.round(latlng_31370.y)
	}

	return ret;

}
 
function display_gird_on_zone_change()
{
	clear_grids()

	var myzone = $('#zoneselect').val()

	if (myzone == 'all')	// all the zones
	{
		for (key in maps) 
		{
			if (maps.hasOwnProperty(key) ) 
			{
				var mapdet = maps[key]
				show_grid( {x:mapdet.x0y0[0],y:mapdet.x0y0[1]}, mapdet.xlabels, mapdet.ylabels, mapdet.dx, mapdet.dy, mapdet.name, key, mycolor, true )
			}
		}
	}
	else			// only one specific zone
	{
		var mapdet = maps[myzone]
		show_grid( {x:mapdet.x0y0[0],y:mapdet.x0y0[1]}, mapdet.xlabels, mapdet.ylabels, mapdet.dx, mapdet.dy, mapdet.name, key, mycolor, false )
	}
}
