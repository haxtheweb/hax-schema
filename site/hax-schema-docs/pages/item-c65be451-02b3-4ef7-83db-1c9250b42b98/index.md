hax-schema documents the schema HAX uses to interface with a web component implementing it. A component's `haxProperties` describe how it appears in the gizmo browser, what settings the editor shows for it, and how HAX should treat it during editing.

`haxProperties` is typically defined in a standalone JSON file, referenced from the element via a static getter:

See [example.json](https://github.com/haxtheweb/hax-schema/blob/main/example.json) for a complete example derived from the [block-quote element](https://github.com/haxtheweb/webcomponents/blob/master/elements/course-design/lib/block-quote.haxProperties.json).