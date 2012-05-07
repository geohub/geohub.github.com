function Model() {
    this.listeners = [];
}

Model.prototype.addChangeListener = function(listener) {
    this.listeners.push(listener);
}

Model.prototype.triggerChange = function() {
    for(var i in this.listeners) {
        this.listeners[i].onChange(this);
    }
}
