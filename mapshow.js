this.TravelMode = function(map, view) {

    this.map = map;
    this.view = view;

    // from https://github.com/DmitryBaranovskiy/raphael
    this.bounce = function(t) {
        var s = 7.5625,
        p = 2.75,
        l;
        if (t < (1 / p)) {
        l = s * t * t;
        } else {
        if (t < (2 / p)) {
            t -= (1.5 / p);
            l = s * t * t + 0.75;
        } else {
            if (t < (2.5 / p)) {
            t -= (2.25 / p);
            l = s * t * t + 0.9375;
            } else {
            t -= (2.625 / p);
            l = s * t * t + 0.984375;
            }
        }
        }
        return l;
    }

    // from https://github.com/DmitryBaranovskiy/raphael
    this.elastic = function(t) {
        return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
    }

    this.panTo = function(tripNode) {
        var pan = ol.animation.pan({
            duration: tripNode.duration,
            source: /** @type {ol.Coordinate} */ (this.view.getCenter())
        });
        this.map.beforeRender(pan);
    }

    this.bounceTo = function(travelNode) {
        var pan = ol.animation.pan({
            duration: travelNode.duration,
            easing: this.bounce,
            source: /** @type {ol.Coordinate} */ (this.view.getCenter())
        });
        this.map.beforeRender(pan);
    }

    this.spinTo = function(travelNode) {
        var duration = travelNode.duration;
        var start = +new Date();
        var pan = ol.animation.pan({
            duration: duration,
            source: /** @type {ol.Coordinate} */ (this.view.getCenter()),
            start: start
        });
        var rotate = ol.animation.rotate({
        duration: duration,
        rotation: 2 * Math.PI,
        start: start
        });
        map.beforeRender(pan, rotate);
    }

    this.flyTo = function(travelNode) {
        var duration = travelNode.duration;
        var start = +new Date();
        var pan = ol.animation.pan({
            duration: duration,
            source: /** @type {ol.Coordinate} */ (this.view.getCenter()),
            start: start
        });

        var bounce = ol.animation.bounce({
            duration: duration,
            resolution: 3 * view.getResolution(),
            start: start
        });

        this.map.beforeRender(pan, bounce);
    }
}

function MapShow(mapContainerId, tripNodes) {

    // bring in the map
    this.mapContainerContainer = document.getElementById(mapContainerId);
    this.mapContainer = document.createElement("DIV");
    this.mapContainer.className = "mapshow-container";
    this.mapContainerContainer.appendChild(this.mapContainer);
    this.mapNode = document.createElement("DIV");
    this.mapNode.id = mapContainerId + "-mapshow-map";
    this.mapNode.className = "mapshow-map";
    this.mapContainer.appendChild(this.mapNode);
    this.overlay = document.createElement("IMG");
    this.overlay.className = "mapshow-image-overlay";
    this.mapContainer.appendChild(this.overlay);
    this.travelNodes = tripNodes;

    this.view = new ol.View({
        // the view's initial state
        center: this.travelNodes[this.travelNodes.length - 1].destination, // start at the end for now
        zoom: 6
    });

    this.map = new ol.Map({
        layers: [
    	new ol.layer.Tile({
    	    preload: 4,
    	    source: new ol.source.MapQuest({
    		layer: 'sat'
    	    })
    	})
        ],
        // Improve user experience by loading tiles while animating. Will make
        // animations stutter on mobile or slow devices.
        loadTilesWhileAnimating: true,
        target: this.mapNode.id,
        controls: [],
        view: this.view
    });

    this.travelMode = new TravelMode(this.map, this.view);

    this.travel = function(index) {
        var that = this; //Javascript can be an ugly one at times
        switch (this.travelNodes[index].style) {
    	case 'fly':
    	    this.travelMode.flyTo(this.travelNodes[index]);
    	    break;
    	case 'bounce':
    	    this.travelMode.bounceTo(this.travelNodes[index]);
    	    break;
    	case 'spin':
    	    this.travelMode.spinTo(this.travelNodes[index]);
    	    break
    	case 'pan':
    	default:
    	    this.travelMode.panTo(this.travelNodes[index]);
        }	
        this.view.setCenter(this.travelNodes[index].destination);
        if (index + 1 < this.travelNodes.length) {
    	    setTimeout(function() {
    	        that.overlay.style.opacity = 1;
    	        that.overlay.src = that.travelNodes[index].media;
    	        setTimeout(function() {
                    that.overlay.style.opacity = 0;
    	            that.travel(index + 1);
                }, that.travelNodes[index].wait);
            }, this.travelNodes[index].duration);
        }
    }

    this.startTrip = function() {
        this.travel(0);
    }
}
