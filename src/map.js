////////////////////////////////////////////////////////////////////////////////
Marker.prototype = new Model();
Marker.prototype.constructor = Marker;

function Marker(group, friend) {
    Model.call(this);
    this.group = group;
    this.friend = friend;
}


////////////////////////////////////////////////////////////////////////////////
MarkerGroup.prototype = new Model();
MarkerGroup.prototype.constructor = MarkerGroup;

function MarkerGroup(latlng, repoFilter) {
    Model.call(this);
    this.latlng = latlng;
    this.repoFilter = repoFilter;
    this.markers = [];

    repoFilter.addChangeListener(this);
}

MarkerGroup.prototype.getFriends = function() {
    var friends = [];
    for(var i in this.markers) {
        var friend = this.markers[i].friend;
        if(friend.getRepos(this.repoFilter).length > 0) friends.push(friend);
    }

    return friends;
};

MarkerGroup.prototype.addMarker = function(marker) {
    this.markers.push(marker);
    this.triggerChange();
};

MarkerGroup.prototype.onChange = function() {
    this.triggerChange();
};


////////////////////////////////////////////////////////////////////////////////
function MarkerGroupView(markerGroup, selection, map) {
    this.markerGroup = markerGroup;
    this.selection = selection;

    this.SELECTED = 'images/selected.png';
    this.UNSELECTED = 'images/octocat.png';

    this.marker = new google.maps.Marker({
        map: map,
        position: markerGroup.latlng,
        title: 'undefined',
        icon: this.UNSELECTED
    });

    google.maps.event.addListener(this.marker, 'click', function() {
        selection.setSelection(markerGroup);
    });

    markerGroup.addChangeListener(this);
    selection.addChangeListener(this);
    this.onChange(markerGroup);
}

MarkerGroupView.prototype.onChange = function(source) {
    var friends = this.markerGroup.getFriends();
    var names = [];
    for(var i in friends) names.push(friends[i].login);

    this.marker.setTitle(names.join(', '));
    this.marker.setVisible(friends.length > 0);

    if(this.selection.selection == this.markerGroup) {
        this.marker.setIcon(this.SELECTED);
    } else {
        this.marker.setIcon(this.UNSELECTED);
    }
};


////////////////////////////////////////////////////////////////////////////////
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


////////////////////////////////////////////////////////////////////////////////
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
                ' — connected through ');

            var repos = friend.getRepos(this.model.selection.repoFilter);
            for(var j = 0; j < repos.length; j++) {
                var repo = repos[j];
                p.append('<a href="' + repo.url + '">' +
                    repo.getFullName() + '</a>');
                if(j + 1 < repos.length) p.append(', ');
            }

            div.append(avatar);
            div.append(p);
            div.append($(document.createElement('div')).attr('class', 'clear'));
            this.element.append(div);
        }
    }
}


////////////////////////////////////////////////////////////////////////////////
function Map(id, selection, repoFilter) {
    this.selection = selection;
    this.repoFilter = repoFilter;
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
    /* this.DEBUG_MAX_MARKERS = 10; */
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
                markerGroup = new MarkerGroup(latlng, map.repoFilter);
                map.markerGroups.push(markerGroup);
                var view = new MarkerGroupView(markerGroup,
                        map.selection, map.map);
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
