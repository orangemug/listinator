var util = require("util");
var events = require("events");
var Delegate = require("dom-delegate");


function calcBoundingBox(els) {
  return els.map(function(el) {
    var size = el.getBoundingClientRect();
    var out = {
      top: size.top,
      height: size.height
    }
    return out;
  });
}

function addTransforms(els) {
  els.forEach(function(el) {
    el.style.webkitTransform = "translate3d(0,0,0)";
  });
}

function removeTransforms(els) {
  els.forEach(function(el) {
    el.style.webkitTransform = "translate3d(0,0,0)";
  });
}

function switchThem(bbox, els, aIdx, bIdx) {
  aIdx = Math.min(aIdx, bIdx);
  bIdx = Math.max(aIdx, bIdx);

  var tmpA = bbox[aIdx];
  bbox[aIdx] = bbox[bIdx]
  bbox[bIdx] = tmpA;

  var p = els[aIdx].parentNode;
  p.insertBefore(els[bIdx], els[aIdx+1])
  p.insertBefore(els[aIdx], els[bIdx+1])

  var tmpB = els[aIdx];
  els[aIdx] = els[bIdx]
  els[bIdx] = tmpB;
}

function collisionDetect(els, masterIdx, bbox, y) {
  els.forEach(function(el, idx) {
    // Have we crossed our boundry
    var b = bbox[idx];
    var midPint = b.top + b.height/2;

    if(idx === masterIdx) {
      // Nothing to do...
    } else if(y > midPint && masterIdx < idx) {
      switchThem(bbox, els, masterIdx, idx);
      masterIdx = idx;
    } else if(y < midPint && masterIdx > idx) {
      switchThem(bbox, els, idx, masterIdx);
      masterIdx = idx;
    }
  });

  return masterIdx;
}

function addDragHandler(el, els, bbox) {
  var idx;
  els.forEach(function(_, _idx) {
    if(els[_idx] === el) {
      idx = _idx
    }
  });

  var hdl = function(e) {
    var b = bbox[idx];
    var x = e.clientX - b.left - b.width/2;
    x = 0;

    e.preventDefault();

    if(e.touches) {
      var y = e.touches[0].clientY;
    } else {
      var y = e.clientY;
    }

    y += window.pageYOffset;

    var prevIdx = idx;
    idx = collisionDetect(els, idx, bbox, y);

    if(idx != prevIdx) {
      if(prevIdx < idx) {
        bbox[idx].top += bbox[prevIdx].height;
        bbox[prevIdx].top -= bbox[idx].height;
      } else {
        bbox[idx].top -= bbox[prevIdx].height;
        bbox[prevIdx].top += bbox[idx].height;
      }
      b = bbox[idx];
    }

    var py = y - b.top  - b.height/2;
    el.style.webkitTransform = "translate3d("+x+"px, "+py+"px, 0)";
  };

  handlers.push({
    el: el,
    hdl: hdl
  });

  window.addEventListener("mousemove", hdl, false);
  window.addEventListener("touchmove", hdl, false);
}


function removeDragHandler(el) {
  handlers.forEach(function(obj) {
    if(obj.el === el) {
      window.removeEventListener("mousemove", obj.hdl, false);
      window.removeEventListener("touchmove", obj.hdl, false);
    }
  });
}



/**
 * ===================
 */
var handlers = [];


function Listinator(selector, scope) {
  scope = scope || document.body;
  var self = this;

  var delegate = new Delegate(scope);
  delegate.on('mousedown', selector, function(e, target) {
    self.select(target.parentNode);

    // TODO: Kinda hate this...
    document.body.style.webkitUserSelect = "none";

    window.addEventListener("mouseup", function hdl() {
      self.unselect(target.parentNode);
      document.body.style.webkitUserSelect = "";
      window.removeEventListener("mouseup", hdl, false);
    }, false);
  });

  delegate.on('touchstart', selector, function(e, target) {
    if(e.touches.length > 1) return;

    self.select(target.parentNode);
    document.body.style.webkitUserSelect = "none";

    window.addEventListener("touchend", function hdl() {
      self.unselect(target.parentNode);
      document.body.style.webkitUserSelect = "";
      window.removeEventListener("mouseup", hdl, false);
    }, false);
  });

  delegate.on('click', '.remove', function(e, target) {
    self.remove(target.parentNode);
  });
}

util.inherits(Listinator, events.EventEmitter);

Listinator.prototype.remove = function(el) {
  // TODO: Check if it has a transition
  el.addEventListener("webkitTransitionEnd", function() {
    el.parentNode.removeChild(el);
  }, false);
  el.style.opacity = 0;
}

Listinator.prototype.select = function(el) {
  var els = Array.prototype.slice.call(el.parentNode.children);
  el.style.zIndex = 999999;
  el.style.webkitTransition = "none";
  el.classList.add("active");
  var bbox = calcBoundingBox(els);
  addTransforms(els);

  addDragHandler(el, els, bbox);
}

Listinator.prototype.unselect = function(el) {
  var els = Array.prototype.slice.call(el.parentNode.children);
  el.classList.remove("active");
  el.style.webkitTransition = "";
  el.style.zIndex = 1;
  removeDragHandler(el);
  removeTransforms(els);
}



module.exports = {
  attach: function(selector, scope) {
    return new Listinator(selector, scope);
  }
};
