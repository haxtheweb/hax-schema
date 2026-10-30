<a11y-collapse heading-button="heading-button"><h2 slot="heading">Core metadata settings</h2><div slot="content"><p>Initial metadata settings associated with controls built into the interface:</p><ul><li><strong>type</strong> — is this a block level element OR a grid level element implying it can have things placed inside of it</li><li><strong>canScale</strong> — hide the width scaler which is common</li><li><strong>canEditSource</strong> — should users see the inline <code>view source</code> button</li><li><strong>hideDefaultSettings</strong> — hides the designSystem and textual alignment options commonly present</li><li><strong>designSystem</strong> — can define if accent, primary, card, text (font), and special design treatment form inputs should be shown</li></ul><code-sample type="json" copy-clipboard-button="copy-clipboard-button"><template>"api": "1",
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
}</template></code-sample></div></a11y-collapse><a11y-collapse heading-button="heading-button"><h2 slot="heading">Gizmo</h2><div slot="content"><p>Gizmo provides the listing in the HAX editor — metadata and filtering that allows the button to render for users to click or drag onto the interface. This data also shows up in Merlin when typing to find related blocks.</p><code-sample type="json" copy-clipboard-button="copy-clipboard-button"><template>"gizmo": {
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
}</template></code-sample></div></a11y-collapse>