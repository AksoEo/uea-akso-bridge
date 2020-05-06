# AKSO Bridge and UEA Plugin
This plugin handles UEA.org's connection to AKSO and specific markdown rendering extensions.

This plugin is an extension for [Grav CMS](http://github.com/getgrav/grav).

## UEA Markdown extensions
### Figures
Figures can be used to add a caption to an image.

```md
[[figuro]]
![katido](katido.jpg)
jen katido
[[/figuro]]
```

Anything that is not an image will be put inside a figcaption.

Using the following syntax, full-width figures can be created:

```md
[[figuro !]]
![katido](katido.jpg)
jen katido
[[/figuro]]
```

Full-width figures should be used sparsely and only with wide-aspect images. They will span the entire width of the screen.

### Image Carousels
Image carousels are a special kind of figure.

```md
[[bildkaruselo]]
![katido](katido1.jpg)
## Katido
katido
![katido](katido2.jpg)
![katido](katido3.jpg)
[[/bildkaruselo]]
```

This will create a full-width figure that will automatically switch between the images if Javascript is available.

Any text below an image will be displayed as a caption for that page.

### Section Markers
```md
!### Katido
```

Putting an exclamation mark before the three octothorpes creates an h3 that is marked as a section marker and will look different.

### Info Boxes
```md
[[informskatolo]]
Katido
[[/informskatolo]]
```

This will create an info box. While they *can* be nested, it is not recommended because it may be too narrow to read comfortably on phones.

### Expandables
Expandables can be created as follows:

```md
[[etendeblo]]
klaki tie ĉi por legi pri katidoj

---

katido
[[/etendeblo]]
```

Any text before the first horizontal rule will be displayed as a summary when collapsed.

### Lists
Lists can be created as follows:

```md
[[listo 3]]
```

The number following `listo` is the list ID.

### Additional Extensions
Probably not commonly used; mostly for the home page.

- `[[aktuale]]`: shows a news carousel or sidebar depending on layout
- `[[revuoj 1 2 3]]`: shows the given magazines (space-separated ids)
- `[[kongresoj 1 2 3]]`: shows the given congresses (space-separated ids)
