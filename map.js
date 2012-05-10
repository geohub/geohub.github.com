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
        this.element.text('Click a user on the map to show more information ' +
            'about him or her.');
    } else {
        this.element.empty();
        var friends = selection.getFriends();
        for(var i in friends) {
            var friend = friends[i];

            var div = $(document.createElement('div'));

            var avatar = $(document.createElement('img'))
                    .attr('class', 'avatar')
                    .attr('src', friend.avatar)
                    .attr('alt', friend.login);

            var p = $(document.createElement('p')).append(friend.name +
                ' (<a href="' + friend.url + '">@' + friend.login + '</a>)' +
                ' is a colaborator for ');

            for(var j in friend.repos) {
                var repo = friend.repos[j];
                p.append('<a href="' + repo.url + '">' +
                    repo.getFullName() + '</a>');
                if(j + 1 < friend.repos.length) p.append(', ');
            }

            div.append(avatar);
            div.append(p);
            this.element.append(div);
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

    this.RATE_LIMIT_DELAY = 2000;
    this.rateLimited = false;

    /* For debugging purposes */
    this.DEBUG_MAX_MARKERS = 10;
    this.debugMarkers = 0;
}

Map.prototype.addFriendMarker = function(friend, cont) {
    var map = this;

    /* Don't DDOS google maps while debugging */
    if(this.DEBUG_MAX_MARKERS && this.debugMarkers >= this.DEBUG_MAX_MARKERS) {
        return;
    } else {
        this.debugMarkers++;
    }

    /* When we're being rate limited, try again later. */
    if(this.rateLimited) {
        console.log('Rate limited: waiting');
        setTimeout(function() {
            map.addFriendMarker(friend, cont);
        }, map.RATE_LIMIT_DELAY);
        return;
    }

    this.geocoder.geocode({'address': friend.loc}, function(results, status) {
        if(status == google.maps.GeocoderStatus.OK) {
            var latlng = results[0].geometry.location;

            /* Find marker group, creat new one if doesn't already exist... */
            var markerGroup = null;
            for(var i in map.markerGroups) {
                var mg = map.markerGroups[i];
                if(mg.latlng.equals(latlng)) {
                    markerGroup = mg;
                }
            }
            if(markerGroup == null) {
                markerGroup = new MarkerGroup(latlng);
                map.markerGroups.push(markerGroup);
                var view = new MarkerGroupView(markerGroup,
                        map.map, map.selection);
            }

            var marker = new Marker(markerGroup, friend);
            markerGroup.addMarker(marker);
            cont(marker);
        } else if(status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
            /* Set rate limited to true and try again later */
            console.log('Over api limit, rateLimited = true');
            map.rateLimited = true;
            setTimeout(function() {
                map.rateLimited = false;
                map.addFriendMarker(friend, cont);
            }, map.RATE_LIMIT_DELAY);
        }
    });
};
