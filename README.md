# hax-schema
Documentation for hax-schema, the schema that defines for the h-a-x editor how it can interface with a web component implementing it. hax-schema typically is defined in a stand alone json file which is then referenced in the element via a method similar to the following:

```js
  static get haxProperties() {
    return new URL('./lib/block-quote.haxProperties.json', import.meta.url).href;
  }
```

[example.json](example.json) has an example derived from the [block-quote element](https://github.com/haxtheweb/webcomponents/blob/master/elements/course-design/lib/block-quote.haxProperties.json)

# Breaking down pieces of the specification
Initial metadata settings associated with controls built into the interface. Explaining these common pieces

- **type** - is this a block level element OR is it a grid level element implying it can have things placed inside of it
- **canScale** - hide the width scaler which is common
- **canEditSource** - should users see the inline `view source` button
- **hideDefaultSettings** - hides the designSystem and textual alignment options commonly present
- **designSystem** - the design system can define if accent, primary, card, text (font), and special design treatment form inputs should be shown.

```json
{
  "api": "1",
  "type": "element",
  "canScale": false,
  "canEditSource": true,
  "hideDefaultSettings": true,
  "designSystem": {
    "accent": true,
    "primary": false,
    "card": true,
    "text": false,
    "designTreatment": false
  }
}
```

# Gizmo
Gizmo is what provides the listing in h-a-x editor as far as what the block is indexed as. Think of it as metadata and filtering that allows the button to render for users to click / drag onto the interface. This data shows up in merlin when typing to find related blocks.

```json
"gizmo": {
    "title": "Block quote",
    "description": "A well designed quote element with image of author",
    "icon": "editor:format-quote",
    "color": "blue",
    "tags": [
      "Layout",
      "quote",
      "blockquote",
      "content",
      "design",
      "presentation"
    ],
    "meta": {
      "author": "HAXTheWeb core team"
    }
  }
```

# Settings
Settings provide the editing form fields the user sees. This is a simplified version of JSON Schema and supports `property`, `attribute`, or `slot` as far as what it is mapped to. `title` and `description` are shown to the user on the form while `inputMethod` is one of the following which builds the input in question:

- **tabs** - organizing visual wrapper
- **fieldset** - organizing visual wrapper
- **array** - organizing wrapping element which takes an array of objects for what sub-forms are
- **textfield** -  text input
- **alt** - alt data validation
- **url** - url data validation
- **select** -  select list
- **boolean** - checkbox
- **number** - number selector / validation
- **slider** - min, max, step for numerical input
- **radio** - single item select
- **colorpicker** - select a color
- **iconpicker** - select an icon
- **code-editor** - Monaco editor with line-endings and color-coding
- **fileupload** - file upload (not hax specific)
- **haxupload** - file upload field wired to talk to h-a-x editor appStore

Settings has 3 possible properties which have array of fields to generate. `configure`, `advanced` and `developer` correspond to the collapsed area in the editing form.
```json
  "settings": {
    "configure": [
      {
        "property": "citation",
        "title": "Citation",
        "description": "The citation of the element",
        "inputMethod": "textfield"
      },
      {
        "property": "alt",
        "title": "Alt",
        "description": "The alt text for the image",
        "inputMethod": "textfield"
      },
      {
        "property": "image",
        "title": "Image",
        "description": "The image of the element",
        "inputMethod": "haxupload",
        "noVoiceRecord": true,
        "validationType": "url"
      }
    ],
    "advanced": []
  }
```

# Save options
Save options ensure that some built in clean up happens when the element is converted to an HTML String. There are [additional hooks for more advanced clean up](https://github.com/haxtheweb/webcomponents/blob/master/elements/hax-body-behaviors/lib/HAXWiring.js) but `wipeSlot` will remove any lightDom content the element might have. `unsetAttributes` is an `Array` of strings which will be removed prior to saving content to an HTML String.

```json
  "saveOptions": {
      "wipeSlot": false,
      "unsetAttributes": []
  }
```

# Demo
The `demoSchema` property is an array of HaxElementSchema. HAXElementSchema is a very simple VDOM which defines the tag, the properties (or attribute) values, and the lightdom `content`

```json
{
  "demoSchema": [
    {
      "tag": "block-quote",
      "properties": {
        "citation": "Padmé Amidala: Star wars, Episode II"
      },
      "content": "<p>So this is how liberty dies... with thunderous applause</p>"
    }
  ]
}
```

The above when asked to be presented for demonstration purposes (which is also the default when you select a block to add it to the page in the h-a-x editor) will be the following:

```html
<block-quote citation="Padmé Amidala: Star wars, Episode II">
  <p>So this is how liberty dies... with thunderous applause</p>
</block-quote>
```
