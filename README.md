# hax-schema

## Onboarding

New to the HAX ecosystem? **[Start here](https://github.com/haxtheweb/issues/blob/master/CONTRIBUTING.md)** — the single onboarding guide covers prerequisites, cloning the core repos, installing, and running each project locally.

Documentation for hax-schema, the schema that defines for the h-a-x editor how it can interface with a web component implementing it. hax-schema typically is defined in a stand alone json file which is then referenced in the element via a method similar to the following:

```js
static get haxProperties() {
  return new URL('./lib/block-quote.haxProperties.json', import.meta.url).href;
}
```

[example.json](example.json) has an example derived from the [block-quote element](https://github.com/haxtheweb/webcomponents/blob/master/elements/course-design/lib/block-quote.haxProperties.json). More complete examples live in [`examples/`](examples).

## Machine-readable schema and validation

| Schema | Validates |
| --- | --- |
| [`schema/haxProperties.schema.json`](schema/haxProperties.schema.json) | An element's `lib/<tag>.haxProperties.json` |
| [`schema/haxProperties.locale.schema.json`](schema/haxProperties.locale.schema.json) | A translation overlay `locales/<tag>.<lang>.haxProperties.json` |

Both are JSON Schema draft 2020-12 and carry the descriptions and defaults from this README, so editors and AI agents can load them directly. `scripts/validate.js` adds checks a schema cannot express (select fields without options, duplicate fields, demo values no field edits, locale overlays that are out of step with their base file).

From npm (no install needed):

```bash
npx -p @haxtheweb/hax-schema haxproperties-validate lib/my-element.haxProperties.json
```

The schemas ship in the package too (`@haxtheweb/hax-schema/schema/haxProperties.schema.json`) for tools that validate in-process, the same way `@haxtheweb/json-outline-schema-spec` ships the site.json schemas. Both are intended to back `hax audit`-style "is this built correctly for HAX" checks.

From a clone:

```bash
npm install
node scripts/validate.js lib/my-element.haxProperties.json
node scripts/validate.js locales/*.haxProperties.json    # base file found via ../lib/<tag>.haxProperties.json
node scripts/validate.js --json lib/my-element.haxProperties.json
npm test                                                 # self-test against examples/
```

The schema was checked against every `*.haxProperties.json` in the webcomponents monorepo (94 element files, 200 locale files); with the fixes in haxtheweb/webcomponents they all pass.

## Rules for tools and agents writing haxProperties

1. **Unknown values fail silently in HAX**, which is why the schema is strict: a misspelled key (`desc`) is ignored, and an unknown `inputMethod` quietly becomes a text field.
   **Custom keys must start with `x-`** (for example `"x-analytics": {...}`), at the top level or inside `gizmo`, a settings field, a demo, `saveOptions` or `documentation`. HAX ignores them; the validator accepts them; everything else is checked strictly.
2. **Each settings field targets one of `property` (camelCase JS property), `attribute` (dash-case HTML attribute) or `slot`** (`""` = default slot). Fields with none are dropped.
3. **`saveOptions` is top level**, never inside `settings`, and `unsetAttributes` uses dash-case names (`element-visible`): HAX dash-cases every property before applying it, so camelCase entries never match.
4. **`select` / `radio` need `options`** (value -> label map) or `itemsList`.
5. **The first `demoSchema` entry is what gets inserted**; any element with a `gizmo` needs at least one, and its `tag` must be the element's tag.
6. **Name the field each locale entry translates** with `property`, `attribute` or `slot`. Named entries are matched to the base field, so reordering the base file is safe. Entries without one fall back to array position and break when fields move.


# Breaking down pieces of the specification
Initial metadata settings associated with controls built into the interface. Explaining these common pieces

- **api** - always `"1"` (the only version).
- **type** - `element` (default) for a normal block, or `grid` for a layout container whose slots accept other blocks.
- **canScale** - show the width scaler (default `true`). Use an object `{ "min": 30, "max": 100, "step": 10 }` for a custom range, `false` to hide it.
- **canPosition** - legacy: can the element be positioned left or center justified. HAX is moving away from it, but it is still valid because existing elements use it.
- **canEditSource** - should users see the inline `view source` button (default `false`)
- **contentEditable** - the element's light DOM is directly editable as text (default `false`)
- **editingElement** - who provides the editing UI. `core` (default) means HAX edits the element directly. An object `{ "tag": "editable-table", "import": "@haxtheweb/editable-table/editable-table.js" }` names a custom element that HAX wraps around the active element while it is edited, and that wrapper syncs state through the `activeElementChanged` haxHook. HAX core uses this for `<table>` and `<iframe>`; a JS definition can also pass a `callback(wrapper)`.
- **editElement** - name of a boolean property the toolbar's **Edit Mode** toggle flips, for elements that have their own editing state (editable-table uses `"editElement": "editMode"`). The toggle is hidden for the `novice` audience.
- **editMode** - properties applied to the element's slots while editing
- **hideDefaultSettings** - hides the designSystem and textual alignment options commonly present (default `false`)
- **designSystem** - the design system can define if accent, primary, card, text (font), and special design treatment form inputs should be shown. `false` hides all of them.
- **documentation** - `{ "howTo": url, "purpose": url }` links to help for the element.

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

- **title**, **description**, **icon** (`iconset:name`), **color** (a simple-colors name such as `blue`, `purple`, `grey`)
- **tags** - search/filter terms; put the category first (`Layout`, `Media`, `Content`, ...)
- **iconLib** - optional module path of a custom iconset to import
- **handles** - content types this element can render when it arrives from upload, search or paste. `type` is the incoming type (`image`, `video`, `link`, `text`, `pdf`, ...); every other key maps an incoming field to one of the element's properties, for example `{ "type": "image", "source": "src", "alt": "alt" }`. `type_exclusive: true` claims the type for this element only.
- **keywords** - extra filter terms shown as keyword chips in the block picker
- **meta** - free-form, with a few keys the editor reads: `author`, `hidden` (never list it), `inlineOnly` (only offer it in inline contexts), `selectionRequired`, `requiresParent`
- **requiresParent** / **requiresChildren** - placement constraints. A gizmo with `requiresParent` is kept out of the general block browser.
- **allowedParents** - parent tags the block is meant for. Documented intent only; HAX does not enforce it yet.
- **shortcut** - keyboard / markdown shortcuts, for example `{ "type": "markdown", "trigger": ">t", "description": "Insert a tab set" }` or `{ "type": "binding", "key": "h", "ctrl": true, "shift": true }`

Elements that should not be insertable on their own (child items of a parent block, for instance) omit `gizmo`.

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
  - **object** - groups sub-fields into one object value
- **Controls**
  - **textfield** -  text input (the default, and the fallback for any unknown value)
  - **textarea** - resizeable multi-line text input
  - **alt** - alt data validation
  - **url** - url data validation
  - **combo** - text input with suggestions
  - **select** -  select list
  - **boolean** - checkbox
  - **number** - number selector / validation
  - **slider** - min, max, step for numerical input
  - **radio** - single item select
  - **color** - select a color (hex)
  - **colorpicker** - select a color (list)
  - **hax-palette-picker** - pick a DDD palette
  - **haxcms-theme-picker** - pick a HAXcms theme
  - **iconpicker** - select an icon; `options` may be an array of icon names to limit the choices
  - **code-editor** - Monaco editor with line-endings and color-coding
  - **code** / **markup** / **html-block** - HTML / code value
  - **md-block** - markdown value
  - **fileupload** - file upload (not hax specific)
  - **haxupload** - file upload field wired to talk to h-a-x editor appStore
  - **screenRecorder** - record the screen into a file
  - **srcset** - responsive image source set
  - **date-time** - select YYYY-MM-DDThh:mmZ string
  - **datepicker** - select YYYY-MM-DD string
  - **monthpicker** - select YYYY-MM string
  - **weekpicker** - select YYYY-Www string
  - **timepicker** - select hh:mmZ timestamp

The full list is `fieldsConversion.inputMethod` in [simple-fields.js](https://github.com/haxtheweb/webcomponents/blob/master/elements/simple-fields/simple-fields.js) plus the additions in [HAXFields.js](https://github.com/haxtheweb/webcomponents/blob/master/elements/hax-body-behaviors/lib/HAXFields.js); [`schema/haxProperties.schema.json`](schema/haxProperties.schema.json) mirrors it.

Common field keys beyond `title` / `description` / `inputMethod`:

| Key | Use |
| --- | --- |
| `property` / `attribute` / `slot` | what the field edits (exactly one; `slot: ""` is the default slot) |
| `required`, `disabled`, `hidden` | booleans |
| `validationType`, `validation` | extra validation (`url`, `text`) and a regex string (default `.*`) |
| `options` / `itemsList` | `select` / `radio` choices: `{ "value": "Label" }` or `[{ "value": "v", "text": "Label" }]`; for `iconpicker`, `options` is an array of icon names (`["icons:star", ...]`) |
| `min`, `max`, `step`, `suffix` | `number` / `slider` |
| `properties`, `itemLabel`, `expanded`, `hideReorder`, `hideDuplicate` | `array` / `object` / grouping fields |
| `slotWrapper`, `allowedSlotWrappers`, `slotAttributes` | tag (default `span`) and attributes used to wrap slot content |
| `accepts`, `uploadRequirements`, `uploadTransform`, `fileActions`, `noCamera`, `noVoiceRecord`, `noScreenRecord` | `haxupload` / `fileupload` behavior |

Settings has 3 possible properties which have array of fields to generate. `configure`, `advanced` and `developer` correspond to the collapsed area in the editing form. Inline (text-level) elements, such as `b` or `em`, that live inside block elements can also define `inline`. Users apply these by highlighting text, and the `inline` fields appear in that selection context.
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
  "developer": []
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
          "inputMethod": "textfield"
        }
      ]
    }
  ]
}
```

# Save options
Save options ensure that some built in clean up happens when the element is converted to an HTML String. There are [additional hooks for more advanced clean up](https://github.com/haxtheweb/webcomponents/blob/master/elements/hax-body-behaviors/lib/HAXWiring.js) but `wipeSlot` will remove any lightDom content the element might have. `unsetAttributes` is an `Array` of attribute names which will be removed prior to saving content to an HTML String. Use the dash-case HTML form (`end-point`, not `endPoint`): HAX converts every property to dash-case before applying this list, so camelCase entries never match. `saveOptions` must be a top-level key, not part of `settings`.

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

# Translations (locale overlays)
Translated labels live next to the element in `locales/<tag>.<lang>.haxProperties.json`. When the editor language is not the default, HAX loads the overlay and merges it into the base haxProperties:

- `gizmo` keys (`title`, `description`, `tags`) replace the base values.
- `settings.configure` and `settings.advanced` entries that name their field with `property`, `attribute` or `slot` are applied to that field, in any order. That identity key is used for matching only and is never copied over. Entries without one are applied **by array index** (entry 2 updates field 2), which is the legacy behavior: keep the order and use `{}` for fields that need no translation. `settings.developer` is not translated.
- `demoSchema[n].properties` values replace the matching base demo values.

```json
{
  "gizmo": { "title": "Cita en bloque" },
  "settings": {
    "configure": [
      { "property": "image", "title": "Imagen" },
      { "property": "citation", "title": "Cita", "description": "La cita del elemento" }
    ]
  }
}
```

See [`examples/locales/feature-card.es.haxProperties.json`](examples/locales/feature-card.es.haxProperties.json) for a complete overlay.

# Beyond haxProperties: haxHooks
Behavior that needs code (custom insert / save processing, edit-mode toggles, upload transforms) is implemented with `haxHooks()` on the element rather than in this JSON. The list of hooks and their signatures is documented at the top of [HAXWiring.js](https://github.com/haxtheweb/webcomponents/blob/master/elements/hax-body-behaviors/lib/HAXWiring.js).

## Releasing

This package is versioned with the rest of the HAX ecosystem and is published by the ubiquity release (`scripts/ubiquity-push.sh` in haxtheweb/webcomponents), which runs `commit-and-tag-version --release-as <ecosystem version>`, pushes the tag and runs `npm publish`. To cut a release of just this package, run `npm run release` (tests, bumps the version and CHANGELOG, tags, pushes to `main`, publishes).
