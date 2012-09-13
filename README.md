AbsolutelySuperList
=====================

Demo and overview
-----------------

AbsolutelySuperList takes a mostly normal <code>&lt;ul&gt;</code> or
<code>&lt;ol&gt;</code> and allows you to insert, remove, rearrange and
resize rows in the list with perfect CSS transitions.

Visit <a href="//absolutelysuperlist.appspot.com/">http://absolutelysuperlist.appspot.com/</a>
for a demo and more information.

AbsolutelySuperList was developed for <a href="https://avocado.io/">Avocado</a>&rsquo;s
killer shared to-do list for couples.

Initialization
--------------

1. Create a <code>&lt;ul&gt;</code> or <code>&lt;ol&gt;</code> in the HTMLs and style it
mostly normally. Note that padding within the list will be ignored once items
are positioned absolutely inside.

2. Wrap the list with the AbsolutelySuperList constructor, like so:

        var superList = new AbsolutelySuperList($('#list'));

3. Store a reference to the object to access the public API methods described below.

NOTE: You should not manually add, remove or reorder items in the list -- this should be done
through the public API. <code>AbsolutelySuperList</code> may wrap list items in
<code>&lt;div&gt;</code>s, etc., in an undefined fashion that should not be relied upon.
Similarly, things like <code>#list > .item</code> will not work as there may be
additional layers of elements added in between.

Usage: Drag and Drop
--------------------

        // If you have any items with the class "absolutely-super-draggable"
        // inside your list, they will act as a drag handle. When a drag completes,
        // you'll get this event:
        superList.bind(AbsolutelySuperList.ITEM_DRAGGED_EVENT,
            function(evt, fromIndex, toIndex) {
              // You can do something with this information, like updating
              // the underlying data, etc.
            });

Usage: Changing row size
------------------------

        // Expand items.
        superList.delegate('.item', 'click', function(evt) {
          var $item = $(evt.currentTarget);
          // This makes the element taller by showing some hidden content.
          $item.toggleClass('expanded');
          // This re-measures the item, then adjusts the positions of
          // elements after it in the list.
          superList.refreshBySelector($item);
        });


Public API
----------

### <code>length()</code>

Returns the number of items in the list.

### <code>html(html)</code>

Sets the content to the given HTML and rebuilds the list.

### <code>insertAtIndex(html, index)</code>

Inserts the given HTML (or jQuery item) at the given index.

### <code>indexBySelector(jQuery)</code>

Returns the index for the item containing the given jQuery selector, which
can be any item contained within the item.

### <code>removeAtIndex(index)</code>

Removes the given item with animation.

### <code>removeBySelector(jQuery)</code>

Removes the given item with animation.

### <code>moveItem(fromIndex, toIndex)</code>

Moves the given item to its new position with animation.

### <code>sort(opt_sortFn)</code>

Sorts the list according to the given sort function. The sort function gets $itemA, $itemB
and should return a number according to normal JavaScript sort function rules.

Defaults to sorting by the $item.text().

### <code>refreshAtIndex(index)</code>

Refreshes the height of the item at the given index and repositions elements with animation.

### <code>refreshBySelector(jQuery)</code>

Refreshes the height of the given item and repositions elements with animation.

### Misc.

The following functions are applied directly to the list:

1. <code>empty</code>
2. <code>addClass</code>
3. <code>removeClass</code>
4. <code>toggleClass</code>
5. <code>find</code>
6. <code>bind</code>
7. <code>unbind</code>
8. <code>delegate</code>

Requirements
------------

A modern flavor of jQuery. Probably something like 1.4.x. Built and tested with 1.7.1.

License
-------

AbsolutelySuperList is freely distributable under the MIT license.

See LICENSE.txt for full license.
