var MapInteraction = {
  resetUserSignups: function(map, userPlaces, allUserGeoJSON) {
    userPlaces.clearLayers();
    userPlaces.addLayer(L.geoJson({
      type: "FeatureCollection",
      features: allUserGeoJSON
    }, {
      pointToLayer: L.mapbox.marker.style,
      style: function(feature) { return feature.properties; }
    }));
  }
}
