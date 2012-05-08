Marker.prototype = new Model();
Marker.prototype.constructor = Marker;

function Marker(group, friend) {
    Model.call(this);
    this.group = group;
    this.friend = friend;
}


MarkerGroup.prototype = new Model();
MarkerGroup.prototype.constructor = MarkerGroup;

function MarkerGroup(latlng) {
    Model.call(this);
    this.latlng = latlng;
    this.markers = [];
}

MarkerGroup.prototype.getFriends = function() {
    var friends = [];
    for(var i in this.markers) friends.push(this.markers[i].friend);
    return friends;
}

MarkerGroup.prototype.addMarker = function(marker) {
    this.markers.push(marker);
    this.triggerChange();
};


function MarkerGroupView(markerGroup, map, selection) {
    this.model = markerGroup;
    this.marker = new google.maps.Marker({
        map: map,
        position: markerGroup.latlng,
        title: 'undefined'
    });

    google.maps.event.addListener(this.marker, 'click', function() {
        selection.setSelection(markerGroup);
    });

    markerGroup.addChangeListener(this);
    this.onChange(markerGroup);
}

MarkerGroupView.prototype.onChange = function() {
    var titles = [];
    for(var i in this.model.markers) {
        titles.push(this.model.markers[i].friend.login);
    }

    this.marker.setTitle(titles.join(', '));
};


Selection.prototype = new Model();
Selection.prototype.constructor = Selection;

function Selection() {
    Model.call(this);
    this.selection = null;
}

Selection.prototype.setSelection = function(selection) {
    if(selection != this.selection) {
        this.selection = selection;
        this.triggerChange();
    }
};


function SelectionView(selection) {
    this.model = selection;
    this.element = $(document.createElement('div'));

    this.model.addChangeListener(this);
    this.onChange();
}

SelectionView.prototype.onChange = function() {
    var selection = this.model.selection;
    if(selection == null) {
        this.element.text('No users selected');
    } else {
        this.element.empty();
        var friends = selection.getFriends();
        for(var i in friends) {
            var friend = friends[i];
            var p = $(document.createElement('p')).text(friend.name);
            this.element.append(p);
        }
    }
}


function Map(id, selection) {
    this.selection = selection;
    this.markerGroups = [];
    this.geocoder = new google.maps.Geocoder();
    this.map = new google.maps.Map(document.getElementById(id), {
        zoom: 1,
        center: new google.maps.LatLng(0, 0),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });
}

Map.prototype.addFriendMarker = function(friend, cont) {
    var selection = this.selection;
    var markerGroups = this.markerGroups;
    var map = this.map;

    this.geocoder.geocode({'address': friend.loc}, function(results, status) {
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
                var view = new MarkerGroupView(markerGroup, map, selection);
            }

            var marker = new Marker(markerGroup, friend);
            markerGroup.addMarker(marker);
        } else {
            console.log('Geocode failed: ' + status);
        }
    });
};
