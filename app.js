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

function remove(el) {
  // TODO: Check if it has a transition
  el.addEventListener("webkitTransitionEnd", function() {
    el.parentNode.removeChild(el);
  }, false);
  el.style.opacity = 0;
}

function select(el) {
  var els = Array.prototype.slice.call(el.parentNode.children);
  el.style.zIndex = 999999;
  el.style.webkitTransition = "none";
  el.classList.add("active");
  var bbox = calcBoundingBox(els);
  addTransforms(els);

  addDragHandler(el, els, bbox);
}

function unselect(el) {
  var els = Array.prototype.slice.call(el.parentNode.children);
  el.classList.remove("active");
  el.style.webkitTransition = "";
  el.style.zIndex = 1;
  removeDragHandler(el);
  removeTransforms(els);
}

var handlers = [];

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

var Delegate = window.domDelegate.Delegate;

myDel = new Delegate(document.body);
myDel.on('mousedown', '.handle', function(e, target) {
  select(target.parentNode);
  document.body.style.webkitUserSelect = "none";

  window.addEventListener("mouseup", function hdl() {
    unselect(target.parentNode);
    document.body.style.webkitUserSelect = "";
    window.removeEventListener("mouseup", hdl, false);
  }, false);
});

myDel.on('touchstart', '.handle', function(e, target) {
  if(e.touches.length > 1) return;

  select(target.parentNode);
  document.body.style.webkitUserSelect = "none";

  window.addEventListener("touchend", function hdl() {
    unselect(target.parentNode);
    document.body.style.webkitUserSelect = "";
    window.removeEventListener("mouseup", hdl, false);
  }, false);
});

myDel.on('click', '.remove', function(e, target) {
  remove(target.parentNode);
});






// https://code.google.com/p/chromium/issues/detail?id=456515
// https://docs.google.com/document/d/12Ay4s3NWake8Qd6xQeGiYimGJ_gCe0UMDZKwP9Ni4m8/edit
// http://output.jsbin.com/qofuwa/2/quiet

var maybePreventPullToRefresh = false;
var lastTouchY = 0;
var touchstartHandler = function(e) {
  if (e.touches.length != 1) return;
  lastTouchY = e.touches[0].clientY;
  // Pull-to-refresh will only trigger if the scroll begins when the
  // document's Y offset is zero.
  maybePreventPullToRefresh = window.pageYOffset == 0;
}

var touchmoveHandler = function(e) {
  var touchY = e.touches[0].clientY;
  var touchYDelta = touchY - lastTouchY;
  lastTouchY = touchY;

  if (maybePreventPullToRefresh) {
    // To suppress pull-to-refresh it is sufficient to preventDefault the
    // first overscrolling touchmove.
    maybePreventPullToRefresh = false;
    if (touchYDelta > 0) {
      e.preventDefault();
      return;
    }
  }

  if (window.pageYOffset == 0 && touchYDelta > 0) {
    e.preventDefault();
    return;
  }
}

document.addEventListener('touchstart', touchstartHandler, false);
document.addEventListener('touchmove', touchmoveHandler, false);
