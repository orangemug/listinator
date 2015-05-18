module.exports = {
  appFixes: function() {
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
  }
};
