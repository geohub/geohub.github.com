function Map(id) {
    this.geocoder = new google.maps.Geocoder();
    this.map = new google.maps.Map(document.getElementById(id), {
        zoom: 1,
        center: new google.maps.LatLng(0, 0),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });
}

Map.prototype.addMarker = function(title, location, cont) {
    var map = this.map;

    this.geocoder.geocode({'address': location}, function(results, status) {
        if(status == google.maps.GeocoderStatus.OK) {
            var latlng = results[0].geometry.location;
            var marker = new google.maps.Marker({
                map: map,
                position: latlng,
                title: title
            });

            cont(marker);
        } else {
            console.log('Geocode failed: ' + status);
        }
    });
}
