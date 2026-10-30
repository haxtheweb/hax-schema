# hax-schema

📖 **[Browse the rendered docs](https://haxtheweb.github.io/hax-schema/)**

## Onboarding

New to the HAX ecosystem? **[Start here](https://github.com/haxtheweb/issues/blob/master/CONTRIBUTING.md)** — the single onboarding guide covers prerequisites, cloning the core repos, installing, and running each project locally.

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

- **Organization**
  - **tabs** - visual wrapper which groups sub-fields into defined tabs, hiding non-active tabs
  - **fieldset** - visual wrapper which groups sub-fields within a border
  - **array** - visual wrapper which groups sub-fields as an array of objects (Users can dynamically expand this array with an "add item" button)
  - **collapse** - visual wrapper which groups sub-fields under a collapsible tag
- **Controls**
  - **textfield** -  text input
  - **textarea** - resizeable multi-line text input
  - **alt** - alt data validation
  - **url** - url data validation
  - **select** -  select list
  - **boolean** - checkbox
  - **number** - number selector / validation
  - **slider** - min, max, step for numerical input
  - **radio** - single item select
  - **color** - select a color (hex)
  - **colorpicker** - select a color (list)
  - **iconpicker** - select an icon
  - **code-editor** - Monaco editor with line-endings and color-coding
  - **fileupload** - file upload (not hax specific)
  - **haxupload** - file upload field wired to talk to h-a-x editor appStore
  - **date-time** - select YYYY-MM-DDThh:mmZ string
  - **datepicker** - select YYYY-MM-DD string
  - **monthpicker** - select YYYY-MM string
  - **weekpicker** - select YYYY-Www string
  - **timepicker** - select hh:mmZ timestamp

You can review the source code at [HAXFields.js](https://github.com/haxtheweb/webcomponents/blob/master/elements/hax-body-behaviors/lib/HAXFields.js) for the latest additions to our master branch.

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
  "advanced": [],
  "developer": [],
}
```

**Organization** settings are designed for a more complex use case, purposefully grouping fields together. You will need to assign child items, or sub-fields, under the `properties` tag.
```json
"settings": {
  "configure": [
    {
      "property": "skills",
      "title": "Associated Skills",
      "description": "The skills related to the element",
      "inputMethod": "array",
      "itemLabel": "name",
      "hideReorder": true,
      "expanded": true,
      "hideDuplicate": true,
      "properties": [
        {
          "property": "name",
          "title": "Skill",
          "inputMethod": "textfield",
        }
      ]
    }
  ]
}
```

# Hax hooks
While `haxProperties` (the schema above) describes how an element appears in the gizmo browser and how HAX configures it via settings forms, `haxHooks` lets an element participate in HAX lifecycle / state changes **without importing HAX**. This keeps elements decoupled from the editor: an element opts into deeper integration by declaring a `haxHooks()` method that maps hook names to method names on the element.

```js
// example from @haxtheweb/media-image/media-image.js
haxHooks() {
  return {
    editModeChanged: "haxeditModeChanged",
    activeElementChanged: "haxactiveElementChanged",
    mediaSourceUpdated: "haxmediaSourceUpdated",
  };
}
```

The HAX store discovers these via `testHook` / `runHook` and invokes them at the right lifecycle moment. The callback name is your choice; the convention is `hax` + the hook name. Hooks available:

- **`activeElementChanged`** — input `(activeElement, value)` where value is whether the element is active. @see `@haxtheweb/retro-card/retro-card.js`
- **`editModeChanged`** — input `(value)` where value is the edit-mode state of the body. @see `@haxtheweb/retro-card/retro-card.js`
- **`inlineContextMenu`** — allows dynamically adding buttons to the editor context menu. @see `@haxtheweb/multiple-choice/multiple-choice.js`
- **`gizmoRegistration`** — lets an element rewrite the store when it is registered with HAX (e.g. register a custom app, extend `validGizmoTypes`). @see `@haxtheweb/github-preview/github-preview.js`
- **`preProcessNodeToContent`** — input `(node)` where node is the item about to be converted to content for export. @see `@haxtheweb/editable-table/editable-table.js`
- **`progressiveEnhancement`** — works on the element ONLY in the slotted / innerHTML area; must return content. @see `@haxtheweb/meme-maker/meme-maker.js`
- **`postProcessNodeToContent`** — input `(content)` where content is an HTML blob about to be returned for export. @see `@haxtheweb/video-player/video-player.js`
- **`preProcessInsertContent`** — input `(node)` where node is the item about to be inserted into the content. @see `@haxtheweb/multiple-choice/multiple-choice.js`
- **`siteToSkeleton`** — input `(details)` where details is `{ uuidMap, direction }`; element rewrites its own site-item UUID references so skeleton structure + content stay in sync. @see `@haxtheweb/haxcms-elements/lib/ui-components/magic/site-collection-list.js`
- **`mediaSourceUpdated`** — input `(path, store)` where path is the clean URL / relative path of a file just modified in place (rotate / compress / scale / transform / replace) and store is the HAXStore instance. The element checks whether its own image-bearing property references `path` (the store exposes `_mediaSrcMatches` to help) and, if so, refreshes its live preview without writing a cache-busting query into the persisted source property. @see `@haxtheweb/media-image/media-image.js`
- **`processFileUpload`** — input `(values, response, store)` invoked from the generic tray upload / drag-drop path (`HAXStore.applyFileUploadTransform`) after a file is uploaded but before the element is inserted. `values` is `{source, title}` of the uploaded file (source is the raw uploaded path), `response` is the parsed upload response (`response.data.file.uuid` is present), and `store` is the HAXStore instance. Return `false` to decline (the file is inserted normally with its raw source). Return `{ fileUuid, operation, valueMapping, fallbackType? }` to run a `@site/updateFileByUuid` post-upload transform: the store calls the op, maps the result via the dot-path `valueMapping` (e.g. `"data.deckPath"`), and sets the inserted element source to the mapped path. `fallbackType` (optional) sets the gizmo type used for insertion if the transform fails, so the file degrades to e.g. a plain link instead of a broken specialized element. This is the generic-tray / drag-drop equivalent of the per-field schema `uploadTransform`; it lets an element own its post-upload conversion without the platform hard-coding its file type. @see `@haxtheweb/slide-deck/slide-deck.js`

The authoritative source for the hook list is the comment block at the top of [HAXWiring.js](https://github.com/haxtheweb/webcomponents/blob/master/elements/hax-body-behaviors/lib/HAXWiring.js).

# Save options
Save options ensure that some built in clean up happens when the element is converted to an HTML String. There are [additional hooks for more advanced clean up](https://github.com/haxtheweb/hax-body-behaviors/blob/master/elements/hax-body-behaviors/lib/HAXWiring.js) but `wipeSlot` will remove any lightDom content the element might have. `unsetAttributes` is an `Array` of strings which will be removed prior to saving content to an HTML String.

```json
"saveOptions": {
  "wipeSlot": false,
  "unsetAttributes": []
}
```

# Demo
The `demoSchema` property is an array of HaxElementSchema. HAXElementSchema is a very simple VDOM which defines the tag, the properties (or attribute) values, and the lightdom `content`

```json
"demoSchema": [
  {
    "tag": "block-quote",
    "properties": {
      "citation": "Padmé Amidala: Star wars, Episode II"
    },
    "content": "<p>So this is how liberty dies... with thunderous applause</p>"
  }
]
```

The above when asked to be presented for demonstration purposes (which is also the default when you select a block to add it to the page in the h-a-x editor) will be the following:

```html
<block-quote citation="Padmé Amidala: Star wars, Episode II">
  <p>So this is how liberty dies... with thunderous applause</p>
</block-quote>
```
