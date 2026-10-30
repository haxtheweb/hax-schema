Save options
------------

Save options ensure built-in clean up happens when the element is converted to an HTML string. `wipeSlot` removes any light DOM content the element might have. `unsetAttributes` is an array of strings which will be removed prior to saving content to an HTML string.

Demo
----

The `demoSchema` property is an array of HAXElementSchema objects — a simple virtual DOM representation which defines the tag, the properties (or attribute) values, and the light DOM `content`.

The above, when presented for demonstration purposes (the default when a block is added to the page in the HAX editor), renders as: