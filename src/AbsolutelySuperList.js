/**
 * @preserve
 *
 * AbsolutelySuperList version 0.1.1.
 * http://github.com/AvocadoCorp/absolutely-super-list
 *
 * (c) 2012 Avocado Software, Inc.
 * AbsolutelySuperList is freely distributable under the MIT license.
 */
 (function() {


  var SUPER_ITEM_SELECTOR = '.absolutely-super-item';
  var SUPER_DRAGGABLE_SELECTOR = '.absolutely-super-draggable';
  var SUPER_DRAG_BOUNDARY_SELECTOR = '.absolutely-super-drag-boundary';

  var SUPER_DRAGGING_CLASS = 'absolutely-super-dragging';
  var SUPER_DRAGGING_ITEM_CLASS = 'absolutely-super-dragging-item';

  var ITEM_TRANSITION = 'top 0.2s ease, height 0.2s ease';
  var ITEM_MEASURING_TRANSITION = 'top 0.2s ease';
  var ITEM_DRAGGING_TRANSITION = 'height 0.2s ease';


  var setTransitionForElement_ = function() {};
  if ($.browser.webkit) {
    setTransitionForElement_ = function(element, transition) {
      element.style.WebkitTransition = transition;
    };
  } else if ($.browser.mozilla) {
    setTransitionForElement_ = function(element, transition) {
      element.style.MozTransition = transition;
    };
  } else if ($.browser.msie && parseInt($.browser.version, 10) >= 10) {
    setTransitionForElement_ = function(element, transition) {
      element.style.msTransition = transition;
    };
  }


  var bind = function(fn, context) {
    return function() {
      return fn.apply(context, arguments);
    }
  };


  /**
   * Potentially replaces an item with an absolutely-super-item if it is not
   * already one.
   *
   * @return {Element} An absolutely-super-item.
   */
  var maybeInitializeItem_ = function($item) {
    if ($item.is(SUPER_ITEM_SELECTOR)) {
      return $item;
    }

    var $container = $('<div class="absolutely-super-item"/>');
    $container.insertBefore($item);
    $item.appendTo($container);

    var container = $container[0];
    container.style.position = 'absolute';
    container.style.left = '0px';
    container.style.right = '0px';

    container.style.overflow = 'hidden';
    return $container;
  };


  /**
   * Calculates the natural height of the item by potentially removing the set
   * height and transitions.
   *
   * @return {number} The height of the item.
   */
  var clipItemToCurrentHeight_ = function($item) {
    var item = $item[0];

    // Temporarily disable any transitions and read the height if we've already
    // changed it before.
    var oldHeight = item.style.height;
    if (oldHeight) {
      setTransitionForElement_(item, ITEM_MEASURING_TRANSITION);
      item.style.height = '';
    }

    // Actually measure the item...
    var height = $item.height();

    if (oldHeight) {
      // Restore the old height here, without a transition, then animate it to
      // the new height below.
      item.style.height = oldHeight;
      // Now perform the changes, but do so in a callback to prevent animations
      // from firing for the height going to zero above.
      setTimeout(function() {
        setTransitionForElement_(item, ITEM_TRANSITION);
        item.style.height = height + 'px';
      }, 0);
    } else {
      // We haven't set the height before, so just set it without a transition.
      item.style.height = height + 'px';
      setTimeout(function() {
        setTransitionForElement_(item, ITEM_TRANSITION);
      }, 0);
    }

    return height;
  };


  function AbsolutelySuperList($list) {
    if ($list.length > 1 || !($list.is('ol') || $list.is('ul'))) {
      throw 'Selector should only contain one <ul> or <ol>.';
    }

    this.$list = $list;

    var list = $list[0];
    // TODO(taylor): Should this be a class or something?
    list.style.position = 'relative';
    if ($.browser.webkit && !(/chrome/i).test(window.navigator.userAgent)) {
      // This is a fix for a flickery effect in Safari only, which happens
      // when any element is transitioning (opacity, height, top, etc.)
      // http://stackoverflow.com/questions/2946748/iphone-webkit-css-animations-cause-flicker
      list.style.WebkitPerspective = '1000';
      list.style.WebkitBackfaceVisibility = 'hidden';
    }

    this.$list.delegate(SUPER_ITEM_SELECTOR,
        AbsolutelySuperList.SUPER_LIST_RESIZED_EVENT,
        bind(this.onChildListResized_, this));
    this.$list.delegate(SUPER_DRAGGABLE_SELECTOR, 'mousedown',
        bind(this.onDraggableMousedown_, this));

    this.reload();
  }


  AbsolutelySuperList.ITEM_DRAGGED_EVENT = 'absolutely-super-dragged';


  AbsolutelySuperList.SUPER_LIST_RESIZED_EVENT = 'super-list-resized';


  AbsolutelySuperList.prototype.getItemPositions_ = function() {
    var current = 0;
    var boundaries = [];
    var $children = this.$list.children();
    $children.each(function(index, child) {
      var $child = $(child);
      
      if ($child.find(SUPER_DRAG_BOUNDARY_SELECTOR).length) {
        boundaries.push(NaN);
      } else {
        boundaries.push(current);
      }

      current += $child.data('height');
    });
    return boundaries;
  };


  AbsolutelySuperList.prototype.onDraggableMousedown_ = function(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    var $item = $(evt.currentTarget).closest(SUPER_ITEM_SELECTOR);

    // Since the item is a container, add the class to the child list item.
    this.$list.addClass(SUPER_DRAGGING_CLASS);
    $item.children().addClass(SUPER_DRAGGING_ITEM_CLASS);

    var item = $item[0];
    item.style.zIndex = '100000';
    item.style.overflow = 'visible';

    setTransitionForElement_(item, ITEM_DRAGGING_TRANSITION);
    $item.data('dragging', true);

    var itemIndex = $item.index();
    var itemTop = $item.position().top;
    var boundaries = this.getItemPositions_();

    this.dragInfo_ = {
      item: $item,
      boundDrag: bind(this.onDrag_, this),
      boundMouseup: bind(this.onDraggableMouseup_, this),
      currentTop: itemTop,
      offsetY: evt.pageY - itemTop,
      startIndex: itemIndex,
      currentIndex: itemIndex,
      boundaries: boundaries
    };

    $(document.body)
        .bind('mousemove', this.dragInfo_.boundDrag)
        .bind('mouseup', this.dragInfo_.boundMouseup);
  };


  AbsolutelySuperList.prototype.onDrag_ = function(evt) {
    var currentY = evt.pageY - this.dragInfo_.offsetY;

    var $item = this.dragInfo_.item;
    var item = $item[0];
    item.style.top = currentY + 'px';

    var boundaries = this.dragInfo_.boundaries;
    var currentIndex = this.dragInfo_.currentIndex;
    var currentTop = this.dragInfo_.currentTop;

    var move = 0;
    for (var i = currentIndex + 1, length = boundaries.length;
         !isNaN(boundaries[i]) && i < length && currentY > boundaries[i];
         i++) {
      move++;
    }
    for (var i = currentIndex - 1, end = 0;
         !isNaN(boundaries[i]) && i >= end && currentY < boundaries[i];
         i--) {
      move--;
    }

    if (move != 0) {
      var to = currentIndex + move;

      this.moveItem(currentIndex, to);

      this.dragInfo_.currentIndex = to;
      this.dragInfo_.currentTop = boundaries[to];

      // These need to be re-calculated in the event that row heights
      // are not consistent.
      this.dragInfo_.boundaries = this.getItemPositions_();
    }
  };


  AbsolutelySuperList.prototype.onDraggableMouseup_ = function(evt) {
    $(document.body)
        .unbind('mousemove', this.dragInfo_.boundDrag)
        .unbind('mouseup', this.dragInfo_.boundMouseup);

    var $item = this.dragInfo_.item;
    var startIndex = this.dragInfo_.startIndex;
    var currentIndex = this.dragInfo_.currentIndex;
    delete this.dragInfo_;

    this.$list.removeClass(SUPER_DRAGGING_CLASS);
    $item.children().removeClass(SUPER_DRAGGING_ITEM_CLASS);
    $item.data('dragging', null);

    var item = $item[0];
    setTransitionForElement_(item, ITEM_TRANSITION);
    item.style.overflow = 'hidden';
    // Let this float back into place, then remove the zIndex.
    setTimeout(function() {
      item.style.zIndex = '';
    }, 250);

    this.repositionElements_();

    if (startIndex != currentIndex) {
      this.$list.trigger(AbsolutelySuperList.ITEM_DRAGGED_EVENT,
          [startIndex, currentIndex]);
    }
  };


  AbsolutelySuperList.prototype.onChildListResized_ = function(evt, diff) {
    var $item = $(evt.currentTarget);
    var height = $item.data('height') - diff;
    $item.data('height', height);
    $item[0].style.height = height + 'px';

    this.repositionElements_();
  };


  AbsolutelySuperList.prototype.reload = function() {
    var $children = this.$list.children();
    for (var i = 0, length = $children.length; i < length; i++) {
      var $child = $children.eq(i);
      $child = maybeInitializeItem_($child);

      var childHeight = clipItemToCurrentHeight_($child);
      $child.data('height', childHeight);
    }

    this.repositionElements_();
  };


  AbsolutelySuperList.prototype.repositionElements_ = function() {
    var totalHeight = 0;

    var $children = this.$list.children();
    for (var i = 0; i < $children.length; i++) {
      var $child = $children.eq(i);
      if (!$child.data('dragging')) {
        $child[0].style.top = totalHeight + 'px';
      }

      totalHeight += $child.data('height');
    }

    var list = this.$list[0];
    list.style.height = totalHeight + 'px';

    // Announce height changes to parent lists, if there are any.
    var oldHeight = parseInt(this.$list.data('height'), 10);
    if (!isNaN(oldHeight) && oldHeight != totalHeight) {
      var $parent = this.$list.parent();
      $parent.trigger(AbsolutelySuperList.SUPER_LIST_RESIZED_EVENT,
          oldHeight - totalHeight);
    }
    this.$list.data('height', totalHeight);
  };


  AbsolutelySuperList.prototype.length = function() {
    return this.$list.children().length;
  };
  AbsolutelySuperList.prototype.isEmpty = function() {
    return this.length() == 0;
  };


  AbsolutelySuperList.prototype.html = function(html) {
    this.$list.html(html);
    this.reload();
  };


  AbsolutelySuperList.prototype.insertAtIndex = function(html, index) {
    var $container = maybeInitializeItem_($(html));
    var $destination = this.$list.children().eq(index);
    if (!$destination.length) {
      $container.appendTo(this.$list);
    } else {
      $container.insertBefore($destination);
    }
    this.reload();
  };


  AbsolutelySuperList.prototype.indexBySelector = function(selector) {
    return this.find(selector).closest(SUPER_ITEM_SELECTOR).index();
  };


  AbsolutelySuperList.prototype.removeAtIndex = function(index) {
    this.$list.children().eq(index).remove();
    this.repositionElements_();
  };


  AbsolutelySuperList.prototype.removeBySelector = function(selector) {
    this.removeAtIndex(this.indexBySelector(selector));
  };


  AbsolutelySuperList.prototype.moveItem = function(fromIndex, toIndex) {
    var $children = this.$list.children();
    var length = $children.length;
    if (fromIndex == toIndex || fromIndex >= length || toIndex >= length) {
      return;
    }

    var $item = $children.eq(fromIndex);
    var $destination = $children.eq(toIndex);

    $item.detach();
    if (fromIndex > toIndex) {
      $item.insertBefore($destination);
    } else {
      $item.insertAfter($destination);
    }

    // Do this after so the element is registered at its current coordinates
    // and Firefox performs the animation when it switches. (Because the DOM
    // node is removed and re-inserted, it would otherwise be considered
    // to always have been where it was after this function ends.)
    setTimeout(bind(function() {
      this.repositionElements_();
    }, this), 50);
  };


  /**
   * Sort the list using the given callback.
   *
   * @param {=function(jQuery, jQuery)} opt_sortFn The sort function, which
   *     compares two jQuery-wrapped nodes and returns a number for sorting
   *     per typical JavaScript array sorting functions.
   */
  AbsolutelySuperList.prototype.sort = function(opt_sortFn) {
    var $children = this.$list.children();
    var length = $children.length;

    var $itemArray = [];
    for (var i = 0; i < length; i++) {
      //  Make an array of the actual <li> items within the wrapper items.
      $itemArray.push($children.eq(i).children());
    }

    // Default to sorting by the actual text of the item.
    var sortFn = opt_sortFn || function($itemA, $itemB) {
      return $itemA.text().localeCompare($itemB.text());
    };
    $itemArray.sort(sortFn);

    for (var i = 0; i < length; i++) {
      // The items inside are the children of the item wrapper.
      var $item = $itemArray[i].parent();
      $item.detach();
      $item.appendTo(this.$list);
    }

    // Do this after so the element is registered at its current coordinates.
    // @see {moveItem} for more information.
    setTimeout(bind(function() {
      this.repositionElements_();
    }, this), 50);
  };


  AbsolutelySuperList.prototype.refreshAtIndex = function(index) {
    var $child = this.$list.children().eq(index);
    var height = clipItemToCurrentHeight_($child);
    if ($child.data('height') != height) {
      $child.data('height', height);
      this.repositionElements_();
    }
  };


  AbsolutelySuperList.prototype.refreshBySelector = function(selector) {
    this.refreshAtIndex(this.indexBySelector(selector));
  };


  AbsolutelySuperList.prototype.topOfItemAtIndex = function(targetIndex) {
    var totalHeight = 0;

    var $children = this.$list.children();
    targetIndex = Math.min(targetIndex, $children.length - 1);

    for (var i = 0; i < targetIndex; i++) {
      var $child = $children.eq(i);
      totalHeight += $child.data('height');
    }

    return totalHeight;
  };


  AbsolutelySuperList.prototype.topOfItem = function(selector) {
    return this.topOfItemAtIndex(this.indexBySelector(selector));
  };


  var deferredMethods_ = [
    'empty', 'addClass', 'removeClass', 'toggleClass', 'find',
    'bind', 'unbind', 'delegate'
  ];
  for (var i = 0; i < deferredMethods_.length; i++) {
    var method = deferredMethods_[i];
    AbsolutelySuperList.prototype[method] = (function(boundMethod) {
      return function() {
        return this.$list[boundMethod].apply(this.$list, arguments);
      };
    })(method);
  }


  // Make this work with Require.JS, if present.
  if (window.require && window.define) {
    define([], function() {
      return AbsolutelySuperList;
    });
  } else {
    window.AbsolutelySuperList = AbsolutelySuperList;
  }
})();