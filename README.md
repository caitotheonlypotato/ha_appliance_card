# Appliance Card for Home Assistant

A custom Lovelace card that turns a picture of an appliance into a live dashboard. Sensor readings, status text, buttons, switches, conditional pictures, Jinja templates, live bars, data tables and history charts all sit on top of the image, with a visual editor for every setting.

Pick an appliance type (dishwasher, washing machine, air purifier, EV charger and 28 more) and the card suggests a starting icon, sensors and switches for it.

<img width="514" height="667" alt="image" src="https://github.com/user-attachments/assets/52fbf24a-c083-4d90-b02e-19b3c5a18546" />
<img width="1037" height="843" alt="image" src="https://github.com/user-attachments/assets/f66064a1-e22b-418a-b3b1-555012094a3c" />
<img width="503" height="757" alt="image" src="https://github.com/user-attachments/assets/2f293b1b-2245-4282-b870-7ab96bab1bb2" />
<img width="100%" alt="demo_600" src="https://github.com/user-attachments/assets/c019667f-36be-4f6f-9acf-1f2f3476978a" />




---

## Features

- **Picture background:** a solid colour, a gradient, or an image, with a height you set in pixels. Optional fill behind the image for any empty space
- **Conditional pictures:** layer extra images on top of the background, shown only while their conditions pass (for example, steam when a cycle is running). Rotate, skew, flip, scale, filter and blend each layer
- **Sensors and attributes:** live values with customisable text, units, decimals, icons and tap actions. Show or hide them with conditions, and highlight them with colour rules and warning limits
- **Buttons:** tappable controls on the picture that run a Home Assistant action, such as toggling a switch, starting a script, pressing a button or opening a cover. Optional confirmation, press animations and state-based text
- **Switches:** a collapsible control panel of toggles, with labels, icons, colours and visibility conditions
- **Bars:** the live value of an entity on a horizontal or vertical scale, with optional fill from zero, tick labels and a title
- **Data tables:** rows of entities showing each state and how long ago it last changed
- **Jinja templates:** free text built from Home Assistant templates, updated live as the states change. Preview results as you type
- **History charts:** recorded history as a numeric line, a filled area, or a state timeline, over 30 minutes to 12 months, with a time axis, min/max readouts and per-state colours
- **Positioning:** every overlay is placed with anchor points and offsets as a percentage of the picture, so layouts scale with the card. Drag overlays into place in the editor preview
- **Appearance controls:** fonts, sizes, bold, colours, backgrounds, opacity, corner radius, padding, borders and glows, on every element
- **Card frame:** a border with thickness, line style, colour, corner radius, and an optional glow
- **Visual editor:** collapsible sections with summaries, colour pickers with Clear and Transparent buttons, and full YAML support

---

## Requirements

- Home Assistant with access to `/config/www/`
- A modern browser (Chrome, Edge, Firefox, Safari, or the Home Assistant companion apps)
- Any entities you want to show. The card works with any sensor, binary sensor, switch or attribute
- Optional: a picture of the appliance, uploaded to `/config/www/`

---

## Installation (manual)

1. **Download the card.** Save `ha-appliance-card.js` from this repository.

2. **Copy the file** to your Home Assistant `www` folder. The location depends on your setup:

   ```
   /config/www/ha-appliance-card.js
   ```

   or, if you use a community subfolder:

   ```
   /config/www/community/ha-appliance-card/ha-appliance-card.js
   ```

   If the `www` folder doesn't exist, create it. Files there are served at `/local/`, so the first option is at `/local/ha-appliance-card.js` and the second at `/local/community/ha-appliance-card/ha-appliance-card.js`. Use whichever path matches where the file actually is.

3. **Add the resource.**
   - Go to **Settings → Dashboards**.
   - Open the three-dot menu (top right) and choose **Resources**.
   - Select **Add resource** and enter:
     - **URL:** `/local/ha-appliance-card.js` (or `/local/community/ha-appliance-card/ha-appliance-card.js` if you used the community folder)
     - **Resource type:** `JavaScript module`
   - Select **Create**.

4. **Clear the browser cache** or do a hard refresh (Ctrl+F5, or Cmd+Shift+R on macOS) so the new file loads.

5. **Add the card.** Edit a dashboard, select **Add card**, search for **Appliance Card**, or use the YAML editor with the example below.

### Updating

Replace the file in the same folder you installed it to, then clear your browser cache. You don't need to change the resource entry unless you've moved the file or changed its name.

If the card still shows the old version, add a version number to the resource URL, for example `/local/ha-appliance-card.js?v=2`, so the browser fetches the new file.

---

## Quick start

```yaml
type: custom:ha-appliance-card
name: Dishwasher
appliance_type: dishwasher
icon: mdi:dishwasher
background:
  type: color
  color: "#1f2937"
sensors:
  - entity: sensor.dishwasher_remaining
    label: "{v}{u} left"
    icon: mdi:timer-sand
    pos: { anchor_x: left, anchor_y: top, x: 8, y: 8 }
switches:
  title: Controls
  items:
    - entity: switch.dishwasher_power
      label: Power
```

---

## Full example

```yaml
type: custom:ha-appliance-card
name: Washing Machine
appliance_type: washing_machine
icon: mdi:washing-machine
header:
  show: true
  align: left
  size: 16
background:
  type: image
  image: /local/washer.jpg
  fit: cover
  height: 320
  border:
    width: 2
    style: solid
    color: "#38bdf8"
    radius: 16
    shadow_blur: 12
sensors:
  - entity: sensor.washer_remaining
    label: "{v}{u} left"
    icon: mdi:timer-sand
    pos: { anchor_x: left, anchor_y: top, x: 6, y: 6 }
    visible:
      match: all
      conditions:
        - op: gt
          value: "0"
  - entity: sensor.washer_status
    label: "{v}"
    pos: { anchor_x: right, anchor_y: bottom, x: 6, y: 6 }
attributes:
  - entity: sensor.washer_power
    attribute: current_power
    label: "{v}{u}"
pictures:
  - image: /local/steam.gif
    fit: contain
    opacity: 0.8
    visible:
      match: all
      conditions:
        - op: is_true
          entity: binary_sensor.washer_running
templates:
  - template: "{{ states('sensor.washer_status') | title }} · {{ states('sensor.washer_remaining') }} min"
    pos: { anchor_x: left, anchor_y: bottom, x: 6, y: 6 }
    width: 60
    justify: center
history:
  - entity: sensor.washer_power
    range: 6h
    kind: line
    line_style: both
    width: 40
    height: 20
    pos: { anchor_x: right, anchor_y: top, x: 6, y: 6 }
switches:
  title: Controls
  columns: 2
  default_open: true
  items:
    - entity: switch.washer_power
      label: Power
    - entity: switch.washer_eco
      label: Eco
```

---

## Configuration reference

Options are written as YAML keys. Every option also appears in the visual editor.

### Card

| Option | Type | Default | Description |
|---|---|---|---|
| `name` | string | blank | Title shown in the header |
| `icon` | icon | `mdi:home-outline` | Icon shown in the header |
| `appliance_type` | string | `other` | Sets the starting icon, sensors and switches. See [Appliance types](#appliance-types). **Apply suggestions** on the Appliance page fills them in |
| `header` | object | see below | Header title bar |

Header options: `show`, `align` (`left`, `center`, `right`, `spread`), `size`, `bold`, `italic`, `color`, `color_opacity`, `bg`, `bg_opacity`, `bg_none`.

### Background

| Option | Type | Default | Description |
|---|---|---|---|
| `background.type` | string | `color` | `color`, `image` or `gradient` |
| `background.color` | colour | `#1f2937` | Solid colour (colour type). Also the fill colour for gradients |
| `background.opacity` | number | `1` | Background opacity, 0 to 1 |
| `background.image` | path | blank | Image path, for example `/local/washer.jpg` (image type) |
| `background.fit` | string | `cover` | `cover`, `contain`, `stretch` or `custom` |
| `background.scale` | number | `1` | Scale when `fit` is `custom` |
| `background.pos_x`, `background.pos_y` | number | `50` | Image position, in percent |
| `background.repeat` | string | `no-repeat` | `no-repeat` or `repeat`. Used with `custom` fit |
| `background.fill`, `background.fill_opacity` | colour, number | background colour, background opacity | Colour shown behind an image where it doesn't cover the card, for example with `contain` |
| `background.gradient_type` | string | `linear` | `linear` or `radial` |
| `background.gradient_angle` | number | `135` | Angle for linear gradients, in degrees |
| `background.gradient_stops` | list | two stops | Up to 4 colour stops, each with `color` and `pos` (percent) |
| `background.tint`, `background.tint_opacity` | colour, number | `#000000`, `0` | Optional tint over the picture |
| `background.height` | number | `200` | Picture height in pixels (minimum 60) |
| `background.border` | object | off | Card border and glow (see below) |

Card border options under `background.border`: `width` (pixels, `0` for none), `style` (`solid`, `dashed`, `dotted`, `double`, `groove`, `ridge`, `inset`, `outset`), `color`, `opacity`, `radius` (pixels, blank for the theme default), `shadow_blur` (`0` for none) and `shadow_color`.

### Sensors and attributes

`sensors` and `attributes` are lists of up to 8 items each. Each item is an overlay placed on the picture.

| Option | Type | Default | Description |
|---|---|---|---|
| `enabled` | boolean | `true` | Show or hide the item |
| `entity` | string | blank | Entity to show. Tapping the item opens it |
| `source` | string | `state` | `state` or `attribute`. Attributes default to `attribute` |
| `attribute` | string | blank | Attribute name, when `source` is `attribute` |
| `label` | string | `{v}{u}` | Text. `{v}` is the value, `{u}` the unit, `{name}` the friendly name. Use `\|` for a new line |
| `decimals` | number | auto | Decimal places for numbers. Auto keeps whole numbers whole and shows up to two places otherwise |
| `unit_convert` | string | blank | Converts the displayed unit. Works for power (`W`, `kW`) and energy (`Wh`, `kWh`) entities, on the entity's state only (not attributes) |
| `icon`, `show_icon` | icon, boolean | blank, `true` | Icon shown with the text |
| `tap` | string | section default | `more-info`, `toggle` (switchable entities only) or `none` |
| `justify` | string | `left` | `left`, `center` or `right`. Applies when `width` is set |
| `width` | number | blank | Width as a percentage of the card. Blank fits the text |
| `pos` | object | see [Positioning](#positioning) | Where the item sits on the picture |
| `style` | object | see below | Text and box appearance |
| `visible` | object | always | Show-when conditions (see [Conditions](#conditions)) |
| `warn` | object | none | Colours the item when the value is below `below` or above `above`. Style rules take priority over warning limits |
| `rules` | list | none | Up to 4 rules that change the text, colours or flash. Each has `conditions`, and optionally `text`, `color`, `bg` and `flash` |

Style options under `style`: `size`, `bold`, `color`, `bg`, `bg_opacity`, `bg_none`, `opacity`, `radius`, `padding`, `border_width`, `border_color`.

Section-wide tap defaults: `sensors_tap` and `attributes_tap`.

### Colour opacity

Every colour option can have an opacity set beside it, written as a key with `_opacity` added to the colour's name. For example, `color` is paired with `color_opacity`, and `bg` with `bg_opacity`. Opacity runs from 0 to 1, and blank means fully opaque. In the editor, colour fields show an **Opacity** box beside the picker.

### Buttons

`buttons` is a list of up to 8 buttons drawn on the picture. Each runs one Home Assistant action when tapped.

| Option | Type | Default | Description |
|---|---|---|---|
| `enabled` | boolean | `true` | Show or hide the button |
| `action` | string | `toggle` | What the button does. See [Button actions](#button-actions) |
| `entity` | string | blank | Entity the action works on. The entity picker is filtered to suit the action |
| `label` | string | entity name | Text. `\|` starts a new line. Blank uses the entity's name |
| `icon`, `show_icon` | icon, boolean | blank, `true` | Icon shown with the text |
| `confirm` | string | `auto` | `auto` asks before the actions marked as dangerous below, `yes` asks before every action, `no` never asks |
| `arm_label` | string | `Confirm?` | Text shown while the button waits for its confirming tap. `\|` starts a new line |
| `arm_bg`, `arm_color` | colour | `#dc2626`, `#ffffff` | Background and text colour while the button waits for confirmation |
| `on_label` | string | blank | Text shown while the entity is on, for example `Stop` in place of `Start`. Blank keeps the normal label |
| `animate` | boolean | `false` | Plays an animation when the button is pressed |
| `anim_style` | string | `pulse` | `pulse`, `blink`, `flip`, `spin` (Rotate), `shake`, `bounce`, `ripple` or `glow`. Shortened to a brief flash when the device asks for reduced motion |
| `justify` | string | `center` | `left`, `center` or `right`. Applies when `width` is set |
| `width` | number | blank | Width as a percentage of the card. Blank fits the text |
| `pos` | object | anchored top right | Where the button sits on the picture (see [Positioning](#positioning)) |
| `style` | object | blue, rounded | Text and box appearance, with the same options as sensors |
| `visible` | object | always | Show-when conditions |
| `rules` | list | none | Up to 4 rules that change the colours or flash |

A button with no entity and no label is hidden. A button with a label but no entity shows the label and does nothing when tapped.

#### Button actions

| `action` | Works on | Asks to confirm by default |
|---|---|---|
| `toggle` | `switch`, `input_boolean`, `light`, `fan`, `automation`, `script`, `group`, `cover` | No |
| `turn_on` | Same switchable domains as toggle | No |
| `turn_off` | Same switchable domains as toggle | Yes |
| `run_script` | `script` | No |
| `stop_script` | `script` | Yes |
| `trigger_automation` | `automation` | No |
| `press_button` | `button`, `input_button` | No |
| `activate_scene` | `scene` | No |
| `open_cover` | `cover` | No |
| `close_cover` | `cover` | No |
| `stop_cover` | `cover` | Yes |
| `lock` | `lock` | No |
| `unlock` | `lock` | Yes |
| `start_vacuum` | `vacuum` | No |
| `return_vacuum` | `vacuum` | No |
| `stop_vacuum` | `vacuum` | Yes |
| `more_info` | Any entity | No. Opens the entity's more-info dialog |

If the entity's domain doesn't match the action, the button won't run. Pick an entity from the list the editor offers for that action.

When a button asks for confirmation, the first tap changes it to the confirm look (`arm_label`, `arm_bg`, `arm_color`). A second tap within 3 seconds runs the action. If you don't tap again, it returns to normal.

Buttons have no warning limits.

### Switches

| Option | Type | Default | Description |
|---|---|---|---|
| `switches.title` | string | `Controls` | Title of the collapsible section |
| `switches.default_open` | boolean | `true` | Whether the section starts open |
| `switches.columns` | number | `2` | `1` or `2` columns |
| `switches.tap` | string | `toggle` | Default tap action |
| `switches.items` | list | empty | Up to 8 switches |

Each switch has `entity`, `label`, `icon`, `show_icon`, `justify`, `tap`, `show_state`, `on_color`, `off_color`, `on_bg`, `off_bg` (each with an optional opacity), `style`, `rules` and `visible`. The `style` group covers `size`, `bold`, `radius`, `padding`, `border_width`, `border_color` and `opacity`. Rules on a switch change its colours or flash it.

The section header shows how many switches are on, for example `2 of 3 on`. Switches sit in their own area, so they have no position, width or warning limits.

Toggling works on switchable domains: `switch`, `input_boolean`, `light`, `fan`, `automation`, `script`, `group` and `cover`.

### Pictures

`pictures` is a list of up to 4 layers, drawn in list order above the background and below sensors. Each has:

- `image`, `fit` (`contain` by default, or `cover`, `stretch` or `custom`), `scale`, `pos_x`, `pos_y`, `repeat`, `opacity`, `tint`, `tint_opacity`
- `entity` and `visible`, for the show-when conditions
- `transform`: `rotate` (degrees), `skew_x` and `skew_y` (degrees), `scale_x` and `scale_y` (factors, `1` is normal), `flip_h` and `flip_v`
- `effects`: `blur` (pixels), `brightness`, `contrast` and `saturate` (percent, `100` is normal), `hue_rotate` (degrees), `invert` and `grayscale` (percent), and `blend`

Blend modes: `normal`, `multiply`, `screen`, `overlay`, `darken`, `lighten`, `color-dodge`, `color-burn`, `hard-light`, `soft-light`, `difference`, `exclusion` and `luminosity`.

Animated GIFs and transparent PNGs work well for effects such as steam.

### Templates

`templates` is a list of up to 8 text overlays built with Home Assistant Jinja.

| Option | Type | Default | Description |
|---|---|---|---|
| `enabled` | boolean | `true` | Show or hide the template |
| `template` | string | blank | Jinja text. Use `{{ ... }}` for values and `{% ... %}` for logic |
| `show_when` | string | blank | Optional Jinja test. Shown when the result is anything other than `false`, `off`, `no`, `0`, `none`, `unavailable` or `unknown` |
| `watch` | string | blank | Comma-separated entities to watch. Entities written in the template are detected automatically; use this for any the card can't see |
| `width` | number | blank | Width as a percentage of the card. Blank fits the text |
| `justify` | string | `left` | `left`, `center` or `right`. Applies when `width` is set |
| `tap` | string | section default | Tap action: `more-info`, `toggle` or `none` |
| `tap_entity` | string | blank | Entity opened when the template is tapped |
| `icon`, `show_icon` | icon, boolean | blank, `true` | Icon shown with the text |

Templates also take `pos`, `style`, `visible` and `rules`, the same as sensors. Templates have no warning limits, and their style rules can change colours and flash but not the text.

### History charts

`history` is a list of up to 2 charts over an entity's recorded history.

| Option | Type | Default | Description |
|---|---|---|---|
| `enabled` | boolean | `true` | Show or hide the chart |
| `entity` | string | blank | Entity to chart |
| `range` | string | `6h` | `30m`, `1h`, `2h`, `3h`, `4h`, `5h`, `6h`, `8h`, `12h`, `1d`, `2d`, `3d`, `5d`, `10d`, `14d`, `20d`, `1mo`, `2mo`, `3mo`, `6mo` or `12mo` |
| `kind` | string | `auto` | `auto`, `line` (numeric) or `timeline` (states). Auto uses a line when at least 80% of the values are numbers |
| `line_style` | string | `line` | For numeric charts: `line`, `area` or `both` |
| `width` | number | `40` | Width as a percentage of the card |
| `height` | number | `20` | Height as a percentage of the picture height |
| `show_axis` | boolean | `true` | Time axis under the chart |
| `ticks` | number | `5` | Tick density, from 1 (fewer) to 10 (more) |
| `icon`, `show_icon` | icon, boolean | blank, `true` | Icon shown with the value label |
| `justify` | string | `right` | Where the value label sits: `left`, `center` or `right` |
| `tap` | string | `more-info` | Tap action: `more-info`, `toggle` or `none` |
| `states` | list | empty | Timeline state colours, up to 6, each with `state` and `color` |
| `unknown_color` | colour | `#6b7280` | Colour for states with no entry, and unavailable |
| `pos` | object | see [Positioning](#positioning) | Where the chart sits on the picture |
| `style` | object | see defaults | Colours, labels and axis appearance |
| `warn` | object | none | Numeric colour limits (`below`, `above`, `color`) |
| `visible` | object | always | Show-when conditions |

Recorder keeps 10 days of history by default. Ranges longer than that show no data until you raise `purge_keep_days` in your recorder settings.

### Bars

`bars` is a list of up to 4 bars. A bar shows the current value of one entity on a scale between a start and an end. It reads the live state, so it needs no history and updates with each state change.

| Option | Type | Default | Description |
|---|---|---|---|
| `enabled` | boolean | `true` | Show or hide the bar |
| `entity` | string | blank | Entity whose state is the value |
| `start`, `end` | number | `0`, `100` | Ends of the scale |
| `start_entity`, `end_entity` | string | blank | Take an end from an entity's state. These override the typed number |
| `from_zero` | boolean | `false` | Fill from zero instead of from the start. Negative values use the negative colour |
| `vertical` | boolean | `false` | Draw the bar vertically. `height` then sets its length |
| `steps` | number | `4` | Divisions, from 2 to 20. On a 0 to 10 scale, 2 steps mark 0, 5 and 10 |
| `show_value` | boolean | `true` | Show the value |
| `value_pos` | string | `above` | `above`, `inside` or `below` the bar |
| `title` | string | blank | Optional title. Blank shows no title |
| `title_mode` | string | `inline` | `inline` puts the title beside the value. `around` puts it above or below |
| `title_order` | string | `before` | For inline titles: `before` or `after` the value |
| `title_sep` | string | `space` | For inline titles: `space`, `colon` or `dash` |
| `show_ends` | boolean | `true` | Labels at the start and end of the scale |
| `label_every` | boolean | `false` | Label every step |
| `tick_decimals` | number | automatic | Decimal places for scale labels, 0 to 3. Automatic uses 2 places when both ends are under 10, and whole numbers otherwise |
| `icon`, `show_icon` | icon, boolean | blank, `true` | Icon shown with the value |
| `tap` | string | `more-info` | Tap action: `more-info`, `toggle` or `none` |
| `width` | number | `40` | Width as a percentage of the card |
| `height` | number | `10` | Height as a percentage of the picture height |
| `pos` | object | see [Positioning](#positioning) | Where the bar sits on the picture |
| `style` | object | see defaults | Fill, track, zero line, label and panel colours and sizes |
| `visible` | object | always | Show-when conditions |

### Data tables

`tables` is a list of up to 4 data tables. Each table sits on the picture and shows one row per entity, with its state (and unit) and how long ago it last changed. Each table holds up to 20 rows.

| Option | Type | Default | Description |
|---|---|---|---|
| `enabled` | boolean | `true` | Show or hide the table |
| `width` | number | `40` | Width as a percentage of the picture width |
| `tap` | string | `more-info` | Tap action for each row: `more-info`, `toggle` or `none` |
| `headers` | list | `Item`, `Value`, `Updated` | Text for the three column headings |
| `widths` | list | `60`, `25`, `15` | Relative column widths. The visible columns share the table's width |
| `updated` | boolean | `true` | Show the Updated column. It shows the time since the state last changed, such as `18m`, `1h 18m` or `2d 3h`, and refreshes when a state changes or every 30 seconds |
| `size`, `size_min` | number | `11`, `8` | Largest and smallest text size in pixels |
| `fit` | boolean | `true` | Shrink text that doesn't fit its cell |
| `wrap`, `wrap_lines` | boolean, number | `false`, `3` | Wrap text that still doesn't fit, over 2 or 3 lines |
| `mono`, `bold` | boolean | `true`, `false` | Monospace font, bold text |
| `zebra`, `zebra_opacity` | boolean, number | `true`, `0.1` | Striped rows, and how strong the stripes are |
| `head`, `text` | colour | `#ffff00`, `#ffffff` | Heading and text colours |
| `bg`, `bg_opacity` | colour, number | `#000000`, `0.73` | Table background |
| `border_show`, `border_color`, `border_width` | boolean, colour, number | `false`, `#ffffff`, `1` | Outer border |
| `cell_show`, `cell_color`, `cell_width`, `cell_opacity` | boolean, colour, number | `true`, `#ffffff`, `0.5`, `0.2` | Lines between cells |
| `rows` | list | empty | Up to 20 rows, each with `entity` and `label` (blank shows the entity's name) |
| `pos` | object | see [Positioning](#positioning) | Where the table sits on the picture |
| `visible` | object | always | Show-when conditions |

### Style rules

Items with a `rules` list (sensors, attributes, switches, templates and buttons) check their rules in order, and the first rule whose conditions pass is used. Sensors and attributes can change their text, colours and flash. Switches, templates and buttons can change colours and flash only. Rules take priority over warning limits.

### Positioning

Overlays are placed with `pos`:

```yaml
pos: { anchor_x: left, anchor_y: top, x: 6, y: 6 }
```

- `anchor_x`: `left`, `center` or `right`
- `anchor_y`: `top`, `center` or `bottom`
- `x` and `y`: offsets from the anchor, as a percentage of the picture's width and height

Anchoring to `right` or `bottom` keeps an item in its corner when the card is resized. Dragging an overlay in the editor preview keeps it inside the picture.

### Conditions

Conditions decide when an item is shown or when a rule applies:

```yaml
visible:
  match: all          # all or any
  conditions:
    - entity: sensor.washer_status
      op: eq
      value: "running"
```

| `op` | Meaning |
|---|---|
| `always` | Always true |
| `eq`, `ne` | Equals, does not equal. Compares as numbers when both sides are numbers |
| `lt`, `le`, `gt`, `ge` | Less than, less than or equal, greater than, greater than or equal |
| `between` | Between two values, inclusive. Set `value` (from) and `value2` (to) |
| `contains`, `not_contains`, `starts_with` | Text checks |
| `matches` | Matches a regular expression, ignoring case |
| `is_true` | On, true, yes, open, home, active, running or 1 |
| `is_false` | Off, false, no, closed, not home, inactive, idle or 0 |
| `is_empty` | Empty value |
| `is_unavailable` | Unavailable or unknown |

Each group allows up to 3 conditions. Conditions can test an entity's state or one of its attributes (`source: attribute`).

### Appliance types

Choose a type on the Appliance page. Each one has a starting icon, suggested sensors and switches, and **Apply suggestions** fills them in. Apply suggestions fills blank icons and labels, adds any missing conditions, and creates empty sensor and switch slots with suggested names. It never sets entities.

Dishwasher, Washing machine, Dryer, Rice cooker, Coffee machine, Kettle, Oven, Fridge, Microwave, Toaster, Blender, Air fryer, Range hood, Freezer, Wine cooler, Iron, Robot vacuum, Steam mop, Garment steamer, Air purifier, Humidifier, Dehumidifier, Air conditioner, Fan, Heater, Water heater, Pool pump, Water softener, Lawn mower, BBQ, EV charger, and Appliance (for anything else).

### Limits

| Item | Maximum |
|---|---|
| Sensors | 8 |
| Attributes | 8 |
| Buttons | 8 |
| Switches | 8 |
| Pictures | 4 |
| Templates | 8 |
| History charts | 2 |
| Bars | 4 |
| Data tables | 4 |
| Rows per data table | 20 |
| Conditions per group | 3 |
| Rules per item | 4 |
| Gradient colour stops | 4 |
| Timeline state colours | 6 |

---

## Using the visual editor

YAML editing works fully, but the card is designed around the visual editor and its live preview. Features such as dragging overlays, tapping items to open them, and the hover hints only work in the editor preview, so use the visual editor for layout and setup, and YAML when you need to copy or script a configuration.

Open the card's editor. The sections are:

- **Appliance:** name, icon, appliance type and **Apply suggestions**, plus the header settings
- **Background:** type, picture, gradient, tint, empty-space fill, and the card border and glow
- **Pictures:** conditional layers, with transform, effects and blend settings
- **Switches:** section settings and the list of switches
- **Buttons:** the list of buttons on the picture
- **Sensors** and **Attributes:** the overlays on the picture
- **Templates:** Jinja text overlays, with a live result and show-when preview as you type
- **History:** history charts, with range, type, size, colours and the time axis
- **Bars:** live value bars, with scale, title, colours and size
- **Data tables:** tables of entities with columns, text fitting, colours and rows

Each section opens onto its own page with a Back button. Each item opens onto its own page with Move up, Move down and Remove. Groups of advanced settings are collapsible.

### Editing in the preview

The card's preview in the editor responds to the same gestures as a dashboard, with a few extras:

- **Short tap** on an overlay moves the editor straight to that item's page, for example a sensor's settings or a button's editor, so you can edit it without navigating through the menus
- **Hold** (about half a second) runs the item's tap action instead. Buttons do nothing on hold
- **Drag** moves an overlay. The new position is saved when you let go. Sensors, attributes, templates, bars, history charts, buttons and data tables can be dragged (for a table, grab any row). Switches and pictures can't be dragged in the preview; change their position in the editor instead
- **Buttons never run their action in the preview.** Tapping one opens its editor page, so you can set it up without triggering a real device
- **Mouse hover** shows a short tooltip with these hints. Once you've used an overlay, its hint is hidden for the rest of the editing session

---

## Troubleshooting

- **Card doesn't appear in the picker:** check that the resource is added as a JavaScript module at the path you copied the file to, then clear your browser cache.
- **Old version still loads:** add a version number to the resource URL, such as `?v=2`, and do a hard refresh.
- **"Custom element doesn't exist: ha-appliance-card":** the file didn't load. Check the resource URL and the file's location, then look for an error on the file's request in the browser developer tools.
- **Switch doesn't toggle:** the entity's domain must be switchable (see [Switches](#switches)). Other domains can still be opened with more-info.
- **Button doesn't run:** the entity's domain must match the button's action (see [Button actions](#button-actions)). A button with only a label does nothing when tapped.
- **Template shows "Template error":** check the Jinja syntax and the entity IDs. The error text is shown in the editor's Result line.
- **Template doesn't update:** the card detects entities written in the template. If the entity is built from a variable, add it to `watch`.
- **History chart shows "No history" or "No data":** check that the entity is recorded, and that the range is within your recorder retention.
- **Bar shows "unavailable":** the bar's entity doesn't exist in Home Assistant. Check the entity ID. A value that isn't a number shows the entity's state text instead.
- **Table shows `--` for a row:** the entity doesn't exist in Home Assistant. Check the entity ID.
- **Justify has no effect:** set a `width` for the item. Justify aligns text within the width.
- **Height has no effect:** check that the card isn't inside a fixed-size layout element. Set the picture height with `background.height`.

---

## Contributing

Issues and pull requests are welcome. Please describe the change you're proposing and include the Home Assistant version and your configuration (with any sensitive entity names removed) when reporting a bug.

---

## Disclaimer

**Please read before installing.**

- **Back up first.** Before installing or updating this card, back up your Home Assistant configuration and dashboards. Editing or replacing files in `/config` can break your setup.
- **Use at your own risk.** This card is provided "as is", without warranty of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, and non-infringement.
- **No liability.** The authors and contributors accept no responsibility for damage, data loss, or any other loss arising from the use of this card, whether caused by bugs, misconfiguration, sensor faults, network or service problems, or anything else.
- **Not for safety-critical use.** Don't rely on the card for alarms, safety monitoring or any other decision where a missed or wrong reading could cause harm. Buttons that lock, unlock, open covers or stop devices act on real hardware, so check the confirmation settings before relying on them.
- **Not affiliated.** This project is not affiliated with, endorsed by, or supported by Home Assistant, Nabu Casa, or any appliance manufacturer. Product names are used for identification only.
- **Third-party integrations.** Sensors, switches and buttons depend on their own integrations and hardware. Check that they work reliably before relying on them in a dashboard.

---

## Licence

Add your chosen licence here (for example MIT) and include a `LICENSE` file in the repository.
