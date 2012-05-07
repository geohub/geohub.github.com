Marker.prototype = new Model();
Marker.prototype.constructor = Marker;

function Marker(group, title, loc) {
    Model.call(this);
    this.group;
    this.title = title;
    this.loc = loc;
}


MarkerGroup.prototype = new Model();
MarkerGroup.prototype.constructor = MarkerGroup;

function MarkerGroup(latlng) {
    Model.call(this);
    this.latlng = latlng;
    this.markers = [];
}

MarkerGroup.prototype.addMarker = function(marker) {
    this.markers.push(marker);
    this.triggerChange();
};


function MarkerGroupView(markerGroup, map) {
    this.model = markerGroup;
    this.marker = new google.maps.Marker({
        map: map,
        position: markerGroup.latlng,
        title: 'undefined'
    });

    markerGroup.addChangeListener(this);
    this.onChange(markerGroup);
}

MarkerGroupView.prototype.onChange = function() {
    var titles = [];
    var markers = this.model.markers;
    for(var i in this.model.markers) {
        titles.push(this.model.markers[i].title);
    }

    this.marker.setTitle(titles.join(', '));
};


function Map(id) {
    this.markerGroups = [];
    this.geocoder = new google.maps.Geocoder();
    this.map = new google.maps.Map(document.getElementById(id), {
        zoom: 1,
        center: new google.maps.LatLng(0, 0),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });
}

Map.prototype.addMarker = function(title, loc, cont) {
    var markerGroups = this.markerGroups;
    var map = this.map;

    this.geocoder.geocode({'address': loc}, function(results, status) {
        if(status == google.maps.GeocoderStatus.OK) {
            var latlng = results[0].geometry.location;

            /* Find marker group, creat new one if doesn't already exist... */
            var markerGroup = null;
            for(var i in markerGroups) {
                var mg = markerGroups[i];
                if(mg.latlng.equals(latlng)) {
                    markerGroup = mg;
                }
            }
            if(markerGroup == null) {
                markerGroup = new MarkerGroup(latlng);
                markerGroups.push(markerGroup);
                var view = new MarkerGroupView(markerGroup, map);
            }

            var marker = new Marker(markerGroup, title, loc);
            markerGroup.addMarker(marker);
        } else {
            console.log('Geocode failed: ' + status);
        }
    });
};
