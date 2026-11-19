// =====================================================================
// HA Appliance Card
// Card element:    ha-appliance-card
// Editor element:  ha-appliance-card-editor
// Picker entry:    window.customCards type "ha-appliance-card"
//
// Example YAML:
//   type: custom:ha-appliance-card
//   name: Dishwasher
//   appliance_type: dishwasher
//   icon: mdi:dishwasher
//   background:
//     type: color
//     color: "#1f2937"
//   sensors:
//     - entity: sensor.dishwasher_remaining
//       label: "{v}{u} left"
//       icon: mdi:timer-sand
//       pos: { anchor_x: left, anchor_y: top, x: 8, y: 8 }   # offsets are % of the picture
//       visible:
//         match: all
//         conditions:
//           - op: gt
//             value: "0"
// =====================================================================

const HAAC_TYPE = "ha-appliance-card";
const HAAC_EDITOR = "ha-appliance-card-editor";
// Home Assistant requires the custom: prefix in the card's type in YAML
const HAAC_CUSTOM_TYPE = `custom:${HAAC_TYPE}`;

// Maximum items per list. Keys match the last part of a config path.
const HAAC_LIMITS = {
  sensors: 8,
  attributes: 8,
  items: 8,
  conditions: 3,
  rules: 4,
  gradient_stops: 4,
  pictures: 4,
  templates: 8,
  buttons: 8,
  history: 2,
  bars: 4,
  rows: 20,
  tables: 4,
  states: 6
};

// Unit families offered for display conversion. convert[from:to] is the multiplier.
const HAAC_UNIT_FAMILIES = {
  power: { units: ["W", "kW"], convert: { "W:kW": 0.001, "kW:W": 1000 } },
  energy: { units: ["Wh", "kWh"], convert: { "Wh:kWh": 0.001, "kWh:Wh": 1000 } }
};

// Switch button pulse length in milliseconds
const HAAC_PULSE_MS = 450;

// Header title alignment, mapped to flexbox justify-content
const HAAC_JUSTIFY = { left: "flex-start", center: "center", right: "flex-end", spread: "space-between" };

// Tap action choices. Items also offer "Section default".
const HAAC_TAP_OPTIONS = [["more-info", "More-info"], ["toggle", "Toggle (switchable only)"], ["none", "None"]];

const HAAC_SWITCHABLE = ["switch", "input_boolean", "light", "fan", "automation", "script", "group", "cover"];
const HAAC_ON_WORDS = ["on", "true", "yes", "open", "home", "active", "running", "1"];
const HAAC_OFF_WORDS = ["off", "false", "no", "closed", "not_home", "inactive", "idle", "0"];

const HAAC_ARM_MS = 3000; // how long a button waits for its confirming second tap
const HAAC_FX_MS = 1500; // safety limit for a press animation, in case animationend never fires
const HAAC_BUTTON_CONFIRM = [["auto", "Automatic (stop and off actions)"], ["yes", "Always"], ["no", "Never"]];
const HAAC_LONG_PRESS_MS = 500; // in the editor preview, a hold this long runs the tap action instead of opening the editor item
const HAAC_DRAG_PX = 8; // movement beyond this cancels a press
const HAAC_HINT_OVERLAY = "Click to edit \u00b7 Hold for more-info \u00b7 Drag to move"; // mouse hover hint in the editor preview
const HAAC_HINT_SWITCH = "Click to edit \u00b7 Hold for more-info";
const HAAC_HINT_BUTTON = "Click to edit \u00b7 Drag to move"; // buttons never run their action in the preview
// Elements that respond to preview gestures: overlays and switches (tap), and buttons (press)
const HAAC_GESTURE_SEL = '[data-action="tap"], [data-action="press"]';
const HAAC_BUTTON_ANIMS = [["pulse", "Pulse"], ["blink", "Blink"], ["flip", "Flip"], ["spin", "Rotate"], ["shake", "Shake"], ["bounce", "Bounce"], ["ripple", "Ripple"], ["glow", "Glow"]];
// Actions a button can run. domains lists the entity domains it applies to (null = any).
// danger actions ask for confirmation by default.
const HAAC_BUTTON_ACTIONS = {
  toggle: { name: "Toggle", service: ["homeassistant", "toggle"], domains: HAAC_SWITCHABLE },
  turn_on: { name: "Turn on", service: ["homeassistant", "turn_on"], domains: HAAC_SWITCHABLE },
  turn_off: { name: "Turn off", service: ["homeassistant", "turn_off"], domains: HAAC_SWITCHABLE, danger: true },
  run_script: { name: "Run script", service: ["script", "turn_on"], domains: ["script"] },
  stop_script: { name: "Stop script", service: ["script", "turn_off"], domains: ["script"], danger: true },
  trigger_automation: { name: "Trigger automation", service: ["automation", "trigger"], domains: ["automation"] },
  press_button: { name: "Press button", service: ["button", "press"], domains: ["button", "input_button"], per_domain: true },
  activate_scene: { name: "Activate scene", service: ["scene", "turn_on"], domains: ["scene"] },
  open_cover: { name: "Open cover", service: ["cover", "open_cover"], domains: ["cover"] },
  close_cover: { name: "Close cover", service: ["cover", "close_cover"], domains: ["cover"] },
  stop_cover: { name: "Stop cover", service: ["cover", "stop_cover"], domains: ["cover"], danger: true },
  lock: { name: "Lock", service: ["lock", "lock"], domains: ["lock"] },
  unlock: { name: "Unlock", service: ["lock", "unlock"], domains: ["lock"], danger: true },
  start_vacuum: { name: "Start vacuum", service: ["vacuum", "start"], domains: ["vacuum"] },
  return_vacuum: { name: "Return to dock", service: ["vacuum", "return_to_base"], domains: ["vacuum"] },
  stop_vacuum: { name: "Stop vacuum", service: ["vacuum", "stop"], domains: ["vacuum"], danger: true },
  more_info: { name: "Open more-info", domains: null, more: true }
};

function haacButtonAction(key) {
  return HAAC_BUTTON_ACTIONS[key] || HAAC_BUTTON_ACTIONS.toggle;
}


const HAAC_OPERATORS = [
  ["always", "Always"],
  ["eq", "Equals"],
  ["ne", "Does not equal"],
  ["lt", "Less than"],
  ["le", "Less than or equal"],
  ["gt", "Greater than"],
  ["ge", "Greater than or equal"],
  ["between", "Between (inclusive)"],
  ["contains", "Contains"],
  ["not_contains", "Does not contain"],
  ["starts_with", "Starts with"],
  ["matches", "Matches regex"],
  ["is_true", "Is on, true, open or home"],
  ["is_false", "Is off, false, closed or not home"],
  ["is_empty", "Is empty"],
  ["is_unavailable", "Is unavailable or unknown"]
];

// Presets fill blank icons, labels and conditions. They never set entities.
const HAAC_PRESETS = {
  dishwasher: {
    name: "Dishwasher",
    icon: "mdi:dishwasher",
    sensors: [
      { icon: "mdi:timer-sand", label: "{v}{u} left" },
      { icon: "mdi:water-outline", label: "{v}{u}" },
      { icon: "mdi:water-check", label: "Rinse aid {v}{u}", op: "lt", value: "20" }
    ],
    switches: [{ icon: "mdi:power", label: "Power" }, { icon: "mdi:leaf", label: "Eco" }]
  },
  washing_machine: {
    name: "Washing machine",
    icon: "mdi:washing-machine",
    sensors: [
      { icon: "mdi:timer-sand", label: "{v}{u} left" },
      { icon: "mdi:door-open", label: "Door open", op: "is_true" },
      { icon: "mdi:lightning-bolt", label: "{v}{u}" }
    ],
    switches: [{ icon: "mdi:power", label: "Power" }, { icon: "mdi:pause", label: "Pause" }]
  },
  dryer: {
    name: "Dryer",
    icon: "mdi:tumble-dryer",
    sensors: [
      { icon: "mdi:timer-sand", label: "{v}{u} left" },
      { icon: "mdi:thermometer", label: "{v}{u}" },
      { icon: "mdi:filter-variant", label: "Clean lint filter", op: "is_true" }
    ],
    switches: [{ icon: "mdi:power", label: "Power" }]
  },
  rice_cooker: {
    name: "Rice cooker",
    icon: "mdi:rice",
    sensors: [
      { icon: "mdi:thermometer", label: "{v}{u}" },
      { icon: "mdi:timer-outline", label: "{v}{u} left" }
    ],
    switches: [{ icon: "mdi:power", label: "Power" }, { icon: "mdi:fire", label: "Keep warm" }]
  },
  coffee_machine: {
    name: "Coffee machine",
    icon: "mdi:coffee-maker",
    sensors: [
      { icon: "mdi:water-outline", label: "Water {v}{u}" },
      { icon: "mdi:coffee", label: "{v} cups" },
      { icon: "mdi:broom", label: "Descale due", op: "is_true" }
    ],
    switches: [{ icon: "mdi:power", label: "Power" }]
  },
  kettle: {
    name: "Kettle",
    icon: "mdi:kettle",
    sensors: [{ icon: "mdi:thermometer", label: "{v}{u}" }],
    switches: [{ icon: "mdi:power", label: "Power" }]
  },
  oven: {
    name: "Oven",
    icon: "mdi:stove",
    sensors: [
      { icon: "mdi:thermometer", label: "{v}{u}" },
      { icon: "mdi:timer-outline", label: "{v}{u} left" }
    ],
    switches: [{ icon: "mdi:power", label: "Power" }, { icon: "mdi:fan", label: "Fan" }]
  },
  fridge: {
    name: "Fridge",
    icon: "mdi:fridge-outline",
    sensors: [{ icon: "mdi:thermometer", label: "Too warm {v}{u}", op: "gt", value: "6" }],
    switches: []
  },
  microwave: {
    name: "Microwave",
    icon: "mdi:microwave",
    sensors: [{ icon: "mdi:timer-outline", label: "{v}{u} left" }],
    switches: [{ icon: "mdi:power", label: "Power" }, { icon: "mdi:lock", label: "Child lock" }]
  },
  toaster: {
    name: "Toaster",
    icon: "mdi:toaster",
    sensors: [{ icon: "mdi:timer-outline", label: "{v}{u} left" }],
    switches: [{ icon: "mdi:power", label: "Power" }, { icon: "mdi:bread-slice-outline", label: "Warm" }]
  },
  blender: {
    name: "Blender",
    icon: "mdi:blender",
    sensors: [{ icon: "mdi:timer-outline", label: "{v}{u} left" }],
    switches: [{ icon: "mdi:power", label: "Power" }, { icon: "mdi:pulse", label: "Pulse" }]
  },
  air_fryer: {
    name: "Air fryer",
    icon: "mdi:pot-mix-outline",
    sensors: [
      { icon: "mdi:thermometer", label: "{v}{u}" },
      { icon: "mdi:timer-outline", label: "{v}{u} left" }
    ],
    switches: [{ icon: "mdi:power", label: "Power" }]
  },
  range_hood: {
    name: "Range hood",
    icon: "mdi:air-filter",
    sensors: [{ icon: "mdi:filter-variant", label: "Clean filter", op: "is_true" }],
    switches: [{ icon: "mdi:power", label: "Power" }, { icon: "mdi:lightbulb-outline", label: "Light" }]
  },
  freezer: {
    name: "Freezer",
    icon: "mdi:snowflake",
    sensors: [
      { icon: "mdi:thermometer", label: "Too warm {v}{u}", op: "gt", value: "-15" },
      { icon: "mdi:door-open", label: "Door open", op: "is_true" }
    ],
    switches: []
  },
  wine_cooler: {
    name: "Wine cooler",
    icon: "mdi:bottle-wine",
    sensors: [{ icon: "mdi:thermometer", label: "{v}{u}" }],
    switches: [{ icon: "mdi:lightbulb-outline", label: "Light" }]
  },
  iron: {
    name: "Iron",
    icon: "mdi:iron",
    sensors: [{ icon: "mdi:thermometer", label: "{v}{u}" }],
    switches: [{ icon: "mdi:power", label: "Power" }]
  },
  robot_vacuum: {
    name: "Robot vacuum",
    icon: "mdi:robot-vacuum",
    sensors: [
      { icon: "mdi:battery", label: "{v}{u}" },
      { icon: "mdi:delete-variant", label: "Bin full", op: "is_true" },
      { icon: "mdi:information-outline", label: "{v}" }
    ],
    switches: [{ icon: "mdi:play", label: "Start" }, { icon: "mdi:home-import-outline", label: "Dock" }]
  },
  steam_mop: {
    name: "Steam mop",
    icon: "mdi:broom",
    sensors: [{ icon: "mdi:water-outline", label: "Water {v}{u}" }],
    switches: [{ icon: "mdi:power", label: "Power" }]
  },
  garment_steamer: {
    name: "Garment steamer",
    icon: "mdi:hanger",
    sensors: [{ icon: "mdi:thermometer", label: "{v}{u}" }],
    switches: [{ icon: "mdi:power", label: "Power" }]
  },
  air_purifier: {
    name: "Air purifier",
    icon: "mdi:air-purifier",
    sensors: [
      { icon: "mdi:air-filter", label: "Air {v}" },
      { icon: "mdi:filter-variant", label: "Filter {v}{u}", op: "lt", value: "20" }
    ],
    switches: [{ icon: "mdi:power", label: "Power" }, { icon: "mdi:fan", label: "Boost" }]
  },
  humidifier: {
    name: "Humidifier",
    icon: "mdi:air-humidifier",
    sensors: [
      { icon: "mdi:water-percent", label: "{v}{u}" },
      { icon: "mdi:water-alert-outline", label: "Refill water", op: "is_true" }
    ],
    switches: [{ icon: "mdi:power", label: "Power" }]
  },
  dehumidifier: {
    name: "Dehumidifier",
    icon: "mdi:water-minus",
    sensors: [
      { icon: "mdi:water-percent", label: "{v}{u}" },
      { icon: "mdi:water-alert-outline", label: "Tank full", op: "is_true" }
    ],
    switches: [{ icon: "mdi:power", label: "Power" }]
  },
  air_conditioner: {
    name: "Air conditioner",
    icon: "mdi:air-conditioner",
    sensors: [
      { icon: "mdi:thermometer", label: "{v}{u}" },
      { icon: "mdi:filter-variant", label: "Clean filter", op: "is_true" }
    ],
    switches: [{ icon: "mdi:power", label: "Power" }, { icon: "mdi:power-sleep", label: "Sleep" }]
  },
  fan: {
    name: "Fan",
    icon: "mdi:fan",
    sensors: [],
    switches: [{ icon: "mdi:power", label: "Power" }, { icon: "mdi:rotate-3d-variant", label: "Oscillate" }]
  },
  heater: {
    name: "Heater",
    icon: "mdi:radiator",
    sensors: [{ icon: "mdi:thermometer", label: "{v}{u}" }],
    switches: [{ icon: "mdi:power", label: "Power" }]
  },
  water_heater: {
    name: "Water heater",
    icon: "mdi:water-boiler",
    sensors: [
      { icon: "mdi:thermometer", label: "{v}{u}" },
      { icon: "mdi:fire", label: "Heating", op: "is_true" }
    ],
    switches: [{ icon: "mdi:power", label: "Power" }, { icon: "mdi:rocket-launch-outline", label: "Boost" }]
  },
  pool_pump: {
    name: "Pool pump",
    icon: "mdi:pool",
    sensors: [
      { icon: "mdi:clock-outline", label: "{v}{u}" },
      { icon: "mdi:gauge", label: "{v}{u}" }
    ],
    switches: [{ icon: "mdi:power", label: "Power" }]
  },
  water_softener: {
    name: "Water softener",
    icon: "mdi:water-sync",
    sensors: [
      { icon: "mdi:shaker-outline", label: "Salt {v}{u}" },
      { icon: "mdi:sync", label: "Regenerating", op: "is_true" }
    ],
    switches: []
  },
  lawn_mower: {
    name: "Lawn mower",
    icon: "mdi:robot-mower",
    sensors: [
      { icon: "mdi:battery", label: "{v}{u}" },
      { icon: "mdi:information-outline", label: "{v}" }
    ],
    switches: [{ icon: "mdi:play", label: "Start" }, { icon: "mdi:home-import-outline", label: "Dock" }]
  },
  bbq: {
    name: "BBQ",
    icon: "mdi:grill",
    sensors: [
      { icon: "mdi:thermometer", label: "{v}{u}" },
      { icon: "mdi:timer-outline", label: "{v}{u} left" }
    ],
    switches: [{ icon: "mdi:power", label: "Power" }]
  },
  ev_charger: {
    name: "EV charger",
    icon: "mdi:ev-station",
    sensors: [
      { icon: "mdi:information-outline", label: "{v}" },
      { icon: "mdi:lightning-bolt", label: "{v}{u}" },
      { icon: "mdi:battery-charging", label: "{v}{u}" }
    ],
    switches: [{ icon: "mdi:flash", label: "Charge" }]
  },
  other: {
    name: "Appliance",
    icon: "mdi:home-outline",
    sensors: [],
    switches: []
  }
};

// =====================================================================
// Pure helpers (no DOM, no hass)
// =====================================================================

function haacEsc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Colour inputs only accept #rrggbb
function haacHex6(value) {
  const m = /^#?([0-9a-f]{6})/i.exec(String(value ?? ""));
  return m ? `#${m[1].toLowerCase()}` : "#000000";
}

// Applies an alpha to a #rrggbb colour. Other CSS colour strings pass through unchanged.
function haacPaint(color, alpha = 1) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(color ?? "").trim());
  if (!m) return String(color || "transparent");
  const n = parseInt(m[1], 16);
  const a = Math.min(1, Math.max(0, Number.isFinite(Number(alpha)) ? Number(alpha) : 1));
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

// Opacity for a colour: blank or missing means fully opaque
function haacAlpha(v) {
  if (v === undefined || v === null || v === "") return 1;
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 1;
}

// Optional numeric limit: blank means no limit
function haacLimit(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// Detects power and energy entities from device_class or unit. Returns "power", "energy" or null.
function haacUnitKind(st) {
  if (!st) return null;
  const a = st.attributes || {};
  if (a.device_class === "power" || ["W", "kW"].includes(a.unit_of_measurement)) return "power";
  if (a.device_class === "energy" || ["Wh", "kWh"].includes(a.unit_of_measurement)) return "energy";
  return null;
}

function haacGet(obj, path) {
  return path.split(".").reduce((o, k) => (o === null || o === undefined ? undefined : o[k]), obj);
}

// Immutable set by dotted path. Numeric segments index into arrays.
function haacSetPath(obj, path, value) {
  const [head, ...rest] = path.split(".");
  const copy = Array.isArray(obj) ? [...obj] : { ...(obj || {}) };
  if (rest.length === 0) {
    copy[head] = value;
    return copy;
  }
  const child = obj ? obj[head] : undefined;
  const nextIsIndex = /^\d+$/.test(rest[0]);
  copy[head] = haacSetPath(child ?? (nextIsIndex ? [] : {}), rest.join("."), value);
  return copy;
}

// Deep merge for plain objects. Arrays are replaced, not merged.
function haacMerge(base, over) {
  if (over === undefined) return base;
  if (
    over === null || typeof over !== "object" || Array.isArray(over) ||
    base === null || typeof base !== "object" || Array.isArray(base)
  ) {
    return over;
  }
  const out = { ...base };
  Object.keys(over).forEach((k) => {
    out[k] = haacMerge(base[k], over[k]);
  });
  return out;
}

// Removes keys that match the defaults, so the saved config stays short. Arrays are kept as they are.
function haacPrune(value, base) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return value;
  const out = {};
  Object.keys(value).forEach((k) => {
    const v = value[k];
    const b = base ? base[k] : undefined;
    if (JSON.stringify(v) === JSON.stringify(b)) return;
    out[k] = haacPrune(v, b);
  });
  return out;
}

// =====================================================================
// Defaults
// =====================================================================

function haacDefaultBackground() {
  return {
    type: "color",
    color: "#1f2937",
    image: "",
    fit: "cover",
    scale: 1,
    pos_x: 50,
    pos_y: 50,
    repeat: "no-repeat",
    opacity: 1,
    border: {
      width: 0,
      style: "solid",
      color: "#ffffff",
      opacity: 1,
      radius: "",
      shadow_blur: 0,
      shadow_color: "#000000"
    },
    gradient_type: "linear",
    gradient_angle: 135,
    gradient_stops: [
      { color: "#1f2937", pos: 0 },
      { color: "#111827", pos: 100 }
    ],
    tint: "#000000",
    tint_opacity: 0,
    height: 200
  };
}

function haacDefaultCondition() {
  return { source: "state", entity: "", attribute: "", op: "eq", value: "" };
}

function haacDefaultVisibility() {
  return { match: "all", conditions: [] };
}

function haacDefaultRule() {
  return { match: "all", conditions: [haacDefaultCondition()], text: "", color: "", bg: "", flash: false };
}

// kind: "sensor" or "attribute". n sets the default vertical position so new items don't stack.
function haacDefaultSlot(kind = "sensor", n = 0) {
  const attr = kind === "attribute";
  return {
    enabled: true,
    entity: "",
    source: attr ? "attribute" : "state",
    attribute: "",
    label: "{v}{u}",
    decimals: "",
    unit_convert: "",
    icon: "",
    show_icon: true,
    justify: "left",
    width: "",
    tap: "",
    pos: { anchor_x: attr ? "right" : "left", anchor_y: "top", x: 2, y: 2 + n * 10 },
    style: {
      size: 14,
      bold: true,
      color: "#ffffff",
      bg: "#000000",
      bg_opacity: 0.5,
      bg_none: false,
      opacity: 1,
      radius: 6,
      padding: 4,
      border_width: 0,
      border_color: "#ffffff"
    },
    visible: haacDefaultVisibility(),
    warn: { below: "", above: "", color: "#ffffff", bg: "#dc2626", flash: false },
    rules: []
  };
}

function haacDefaultSwitch() {
  return {
    entity: "",
    label: "",
    icon: "",
    show_icon: true,
    tap: "",
    show_state: true,
    on_color: "#ffffff",
    off_color: "#9ca3af",
    on_bg: "#2563eb",
    off_bg: "#374151",
    justify: "left",
    style: { size: 14, bold: false, radius: 12, padding: 8, border_width: 0, border_color: "#ffffff", opacity: 1 },
    visible: haacDefaultVisibility(),
    rules: []
  };
}

// A button drawn on the picture. Its look options match sensors and attributes.
function haacDefaultButton(n = 0) {
  return {
    enabled: true,
    entity: "",
    action: "toggle",
    label: "",
    icon: "",
    show_icon: true,
    justify: "center",
    width: "",
    confirm: "auto",
    animate: false,
    anim_style: "pulse",
    on_label: "",
    arm_label: "Confirm?",
    arm_bg: "#dc2626",
    arm_color: "#ffffff",
    pos: { anchor_x: "right", anchor_y: "top", x: 2, y: 10 + n * 14 },
    style: { size: 14, bold: true, color: "#ffffff", bg: "#2563eb", bg_opacity: 0.9, bg_none: false, opacity: 1, radius: 10, padding: 6, border_width: 0, border_color: "#ffffff" },
    visible: haacDefaultVisibility(),
    rules: []
  };
}

function haacButtonFull(raw) {
  return haacMerge(haacDefaultButton(), raw || {});
}

// A conditional picture. Its options match the main background, and it is shown only while its conditions pass.
function haacDefaultPicture() {
  return {
    entity: "",
    visible: haacDefaultVisibility(),
    image: "",
    fit: "contain",
    scale: 1,
    pos_x: 50,
    pos_y: 50,
    repeat: "no-repeat",
    opacity: 1,
    tint: "#000000",
    tint_opacity: 0,
    // Geometry: rotate and skew in degrees, scale factors as multipliers (1 = unchanged)
    rotate: 0,
    skew_x: 0,
    skew_y: 0,
    scale_x: 1,
    scale_y: 1,
    flip_h: false,
    flip_v: false,
    // Colour and look: filter amounts (100 = unchanged for brightness, contrast and saturate)
    blur: 0,
    brightness: 100,
    contrast: 100,
    saturate: 100,
    hue_rotate: 0,
    invert: 0,
    grayscale: 0,
    blend: "normal"
  };
}

function haacPictureFull(raw) {
  return haacMerge(haacDefaultPicture(), raw || {});
}

// Blend modes offered for a picture. Only these reach the page's CSS.
const HAAC_BLEND_MODES = [
  ["normal", "Normal"], ["multiply", "Multiply"], ["screen", "Screen"], ["overlay", "Overlay"],
  ["darken", "Darken"], ["lighten", "Lighten"], ["color-dodge", "Colour dodge"], ["color-burn", "Colour burn"],
  ["hard-light", "Hard light"], ["soft-light", "Soft light"], ["difference", "Difference"],
  ["exclusion", "Exclusion"], ["luminosity", "Luminosity"]
];

// A number from config, or the fallback when the value is blank or not a number
function haacNum(v, fallback) {
  if (v === "" || v === null || v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// CSS transform for a picture: flips and scale factors, then rotate, then skew. "none" when unused.
function haacPictureTransform(p) {
  const sx = haacNum(p.scale_x, 1) * (p.flip_h ? -1 : 1);
  const sy = haacNum(p.scale_y, 1) * (p.flip_v ? -1 : 1);
  const r = haacNum(p.rotate, 0);
  const kx = haacNum(p.skew_x, 0);
  const ky = haacNum(p.skew_y, 0);
  const parts = [];
  if (sx !== 1 || sy !== 1) parts.push(`scale(${sx}, ${sy})`);
  if (r) parts.push(`rotate(${r}deg)`);
  if (kx || ky) parts.push(`skew(${kx}deg, ${ky}deg)`);
  return parts.length ? parts.join(" ") : "none";
}

// CSS filter for a picture. "none" when no filter is set.
function haacPictureFilter(p) {
  const f = [];
  const blur = haacNum(p.blur, 0);
  const br = haacNum(p.brightness, 100);
  const con = haacNum(p.contrast, 100);
  const sat = haacNum(p.saturate, 100);
  const hue = haacNum(p.hue_rotate, 0);
  const inv = haacNum(p.invert, 0);
  const gray = haacNum(p.grayscale, 0);
  if (blur) f.push(`blur(${Math.max(0, blur)}px)`);
  if (br !== 100) f.push(`brightness(${Math.max(0, br)}%)`);
  if (con !== 100) f.push(`contrast(${Math.max(0, con)}%)`);
  if (sat !== 100) f.push(`saturate(${Math.max(0, sat)}%)`);
  if (hue) f.push(`hue-rotate(${hue}deg)`);
  if (inv) f.push(`invert(${Math.min(100, Math.max(0, inv))}%)`);
  if (gray) f.push(`grayscale(${Math.min(100, Math.max(0, gray))}%)`);
  return f.length ? f.join(" ") : "none";
}

function haacDefaults() {
  return {
    name: "",
    icon: "mdi:home-outline",
    appliance_type: "other",
    background: haacDefaultBackground(),
    sensors: [],
    attributes: [],
    pictures: [],
    templates: [],
    buttons: [],
    history: [],
    bars: [],
    tables: [],
    header: { show: true, bg_none: true, bg: "#000000", bg_opacity: 0.5, color: "#ffffff", size: 16, bold: true, italic: false, align: "left" },
    sensors_tap: "more-info",
    attributes_tap: "more-info",
    switches: { title: "Controls", default_open: true, columns: 2, tap: "toggle", items: [] }
  };
}

// A Jinja template shown as text on the picture. Appearance options match sensors and attributes.
function haacDefaultTemplate(n = 0) {
  const slot = haacDefaultSlot("sensor", n);
  return {
    enabled: true,
    template: "",
    show_when: "",
    watch: "",
    tap_entity: "",
    tap: "",
    icon: "",
    show_icon: true,
    width: "",
    justify: "left",
    pos: slot.pos,
    style: slot.style,
    visible: haacDefaultVisibility(),
    rules: []
  };
}

function haacTemplateFull(raw) {
  return haacMerge(haacDefaultTemplate(), raw || {});
}

// Entities a template depends on: ids written in it that Home Assistant knows, plus any listed by hand
function haacTemplateWatch(t, hass) {
  const text = `${t?.template ?? ""} ${t?.show_when ?? ""}`;
  const found = text.match(/\b[a-z_][a-z0-9_]*\.[a-z0-9_]+\b/g) || [];
  const known = found.filter((id) => hass?.states?.[id]);
  const extra = String(t?.watch ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return [...new Set([...known, ...extra])];
}

// Whether a show-when result counts as true
function haacTruthy(res) {
  if (!res || res.error) return false;
  const t = String(res.text ?? "").trim().toLowerCase();
  return !["", "false", "off", "no", "0", "none", "unavailable", "unknown"].includes(t);
}

// Subscribes to a Jinja template that Home Assistant renders. onUpdate receives { text, error } each time it changes.
function haacRenderTemplate(conn, template, entityIds, onUpdate) {
  let unsub = null;
  let closed = false;
  const msg = { type: "render_template", template, report_errors: true };
  if (entityIds && entityIds.length) msg.entity_ids = entityIds;
  conn.subscribeMessage((ev) => {
    if (closed) return;
    if (ev && ev.error) onUpdate({ text: "", error: String(ev.error) });
    else onUpdate({ text: ev && ev.result !== undefined ? String(ev.result) : "", error: null });
  }, msg).then((u) => {
    if (closed) u();
    else unsub = u;
  }).catch((e) => {
    if (!closed) onUpdate({ text: "", error: String(e?.message || e) });
  });
  return () => {
    closed = true;
    if (unsub) unsub();
  };
}

// Time ranges offered for history charts, stored as a number and unit (m, h, d or mo; a month is 30 days)
const HAAC_HISTORY_RANGES = [["30m", "30 minutes"], ["1h", "1 hour"], ["2h", "2 hours"], ["3h", "3 hours"], ["4h", "4 hours"], ["5h", "5 hours"], ["6h", "6 hours"], ["8h", "8 hours"], ["12h", "12 hours"], ["1d", "1 day"], ["2d", "2 days"], ["3d", "3 days"], ["5d", "5 days"], ["10d", "10 days"], ["14d", "14 days"], ["20d", "20 days"], ["1mo", "1 month"], ["2mo", "2 months"], ["3mo", "3 months"], ["6mo", "6 months"], ["12mo", "12 months"]];

// States that mean "no value" and are never drawn as numbers
const HAAC_UNKNOWN = ["", "unknown", "unavailable"];

function haacRangeMs(key) {
  const m = /^(\d+)(mo|m|h|d)$/.exec(String(key || ""));
  if (!m) return 6 * 3600000;
  const unit = { m: 60000, h: 3600000, d: 86400000, mo: 30 * 86400000 }[m[2]];
  return Number(m[1]) * unit;
}

// A history chart over one entity. Width and height are percentages: width of the card, height of the picture.
function haacDefaultHistory(n = 0) {
  const slot = haacDefaultSlot("sensor", n);
  return {
    enabled: true,
    entity: "",
    range: "6h",
    icon: "",
    show_icon: true,
    tap: "more-info",
    justify: "right",
    visible: haacDefaultVisibility(),
    kind: "auto",
    line_style: "line",
    show_axis: true,
    ticks: 5,
    width: 40,
    height: 20,
    unknown_color: "#6b7280",
    pos: { anchor_x: "left", anchor_y: "top", x: 2, y: 2 + n * 25 },
    style: {
      bold: true,
      line_color: "#38bdf8",
      line_width: 2,
      fill_color: "#38bdf8",
      fill_opacity: 0.25,
      bg: "#000000",
      bg_opacity: 0.4,
      bg_none: false,
      label_color: "#ffffff",
      label_size: 11,
      show_labels: true,
      show_state_names: true,
      axis_color: "#ffffff",
      axis_bg: "#000000",
      axis_bg_opacity: 0.5,
      axis_bg_none: false,
      opacity: 1,
      radius: 6,
      padding: 4,
      border_width: 0,
      border_color: "#ffffff"
    },
    warn: { below: "", above: "", color: "#dc2626", bg: "#dc2626", flash: false },
    states: []
  };
}

function haacHistoryFull(raw) {
  return haacMerge(haacDefaultHistory(), raw || {});
}

// "6s", "52s", "18m", "1h 18m", "2d 3h"
function haacAge(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

// Writes text only when it differs from what is shown
function haacPutText(node, text) {
  if (node && node.textContent !== text) node.textContent = text;
}

// One row of the data table: an entity and an optional label
function haacDefaultTableRow() {
  return { entity: "", label: "" };
}

// A data table on the picture: one row per entity with its state and time since it last changed.
// Ported from the EV information card. Width is a percentage of the picture width.
function haacDefaultTable(n = 0) {
  return {
    enabled: true,
    width: 40,
    pos: { anchor_x: "left", anchor_y: "top", x: 2, y: 2 + n * 12 },
    tap: "more-info",
    visible: haacDefaultVisibility(),
    updated: true,
    headers: ["Item", "Value", "Updated"],
    widths: [60, 25, 15],
    zebra: true,
    zebra_opacity: 0.1,
    mono: true,
    bold: false,
    size: 11,
    size_min: 8,
    fit: true,
    wrap: false,
    wrap_lines: 3,
    head: "#ffff00",
    text: "#ffffff",
    bg: "#000000",
    bg_opacity: 0.73,
    border_show: false,
    border_color: "#ffffff",
    border_width: 1,
    cell_show: true,
    cell_color: "#ffffff",
    cell_width: 0.5,
    cell_opacity: 0.2,
    rows: []
  };
}

function haacTableFull(raw) {
  return haacMerge(haacDefaultTable(), raw || {});
}

// A bar showing one value between a start and an end, drawn horizontally or vertically.
// Start and end are typed numbers, or taken from an entity when one is set.
// Width and height are percentages of the card and picture, as for charts.
function haacDefaultBar(n = 0) {
  return {
    enabled: true,
    entity: "",
    start: 0,
    start_entity: "",
    end: 100,
    end_entity: "",
    from_zero: false,
    vertical: false,
    steps: 4,
    show_value: true,
    value_pos: "above",
    show_ends: true,
    label_every: false,
    tick_decimals: "",
    title: "",
    title_mode: "inline",
    title_order: "before",
    title_sep: "space",
    icon: "",
    show_icon: true,
    tap: "more-info",
    width: 40,
    height: 10,
    visible: haacDefaultVisibility(),
    pos: { anchor_x: "left", anchor_y: "top", x: 2, y: 2 + n * 12 },
    style: {
      pos_color: "#22c55e",
      pos_color_opacity: 1,
      neg_color: "#ef4444",
      neg_color_opacity: 1,
      zero_color: "#ffffff",
      zero_width: 2,
      bar_thickness: 14,
      bg: "#000000",
      bg_opacity: 0.4,
      bg_none: false,
      radius: 6,
      border_width: 0,
      border_color: "#ffffff",
      border_color_opacity: 1,
      label_color: "#ffffff",
      label_color_opacity: 1,
      label_size: 11,
      bold: true,
      tick_size: 11,
      title_size: 11,
      title_bold: true,
      title_color: "#ffffff",
      title_color_opacity: 1,
      panel_bg: "#000000",
      panel_bg_opacity: 0.6,
      panel_bg_none: false,
      opacity: 1,
      padding: 4
    }
  };
}

function haacBarFull(raw) {
  return haacMerge(haacDefaultBar(), raw || {});
}

// Builds the chart for one history overlay. points are { t (ms), v (string) } sorted by time.
// Returns { svg, label } or null when there is nothing to draw.
function haacHistoryRender(h, points, now, unit) {
  const end = now;
  const start = now - haacRangeMs(h.range);
  const span = end - start;

  // The state in force at the start of the window, then every change inside it
  let before = null;
  const inside = [];
  points.forEach((p) => {
    if (p.t < start) before = p;
    else if (p.t <= end) inside.push(p);
  });
  const series = [];
  if (before) series.push({ t: start, v: before.v });
  inside.forEach((p) => series.push({ t: p.t, v: p.v }));
  if (!series.length) return null;

  const known = series.filter((p) => !HAAC_UNKNOWN.includes(p.v.trim().toLowerCase()));
  const numeric = known.filter((p) => Number.isFinite(Number(p.v)));
  let kind = h.kind;
  if (kind === "auto") kind = known.length && numeric.length / known.length >= 0.8 ? "line" : "timeline";

  const X = (t) => ((t - start) / span) * 100;
  const stateColour = (v) => {
    const hit = (h.states || []).find((s) => s && s.state && String(s.state).toLowerCase() === String(v).toLowerCase());
    return hit && hit.color ? haacPaint(hit.color, haacAlpha(hit.color_opacity)) : haacPaint(h.unknown_color, haacAlpha(h.unknown_color_opacity));
  };

  if (kind === "line") {
    if (!numeric.length) return null;
    const pts = numeric.map((p) => ({ t: p.t, v: Number(p.v) }));
    const last = pts[pts.length - 1];
    pts.push({ t: end, v: last.v });
    let lo = Math.min(...pts.map((p) => p.v));
    let hi = Math.max(...pts.map((p) => p.v));
    if (hi === lo) { lo -= 1; hi += 1; }
    const pad = 6;
    const Y = (v) => 100 - pad - ((v - lo) / (hi - lo)) * (100 - 2 * pad);
    const coords = pts.map((p) => `${X(p.t).toFixed(2)} ${Y(p.v).toFixed(2)}`);
    const line = "M" + coords.join(" L");
    const area = `M${X(pts[0].t).toFixed(2)} 100 L${coords.join(" L")} L100 100 Z`;

    const hit = haacWarnHit(h.warn, last.v);
    const lineCol = hit ? haacPaint(h.warn.color, haacAlpha(h.warn.color_opacity)) : haacPaint(h.style.line_color, haacAlpha(h.style.line_color_opacity));
    const fillCol = hit ? haacPaint(h.warn.color, haacAlpha(h.warn.color_opacity)) : h.style.fill_color;
    const parts = [];
    if (h.line_style === "area" || h.line_style === "both") {
      parts.push(`<path d="${area}" fill="${haacEsc(fillCol)}" fill-opacity="${Number(h.style.fill_opacity)}" stroke="none"/>`);
    }
    if (h.line_style === "line" || h.line_style === "both") {
      parts.push(`<path d="${line}" fill="none" stroke="${haacEsc(lineCol)}" stroke-width="${Number(h.style.line_width)}" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>`);
    }
    const fmt = (n) => haacFormatNumber(n, "");
    const u = unit ? ` ${unit}` : "";
    const label = `${fmt(last.v)}${u}  min ${fmt(lo)}  max ${fmt(hi)}`;
    return { kind: "line", svg: `<svg viewBox="0 0 100 100" preserveAspectRatio="none">${parts.join("")}</svg>`, label, names: "" };
  }

  // Timeline: a coloured block for each state, in time order. Each block is named inside where it fits.
  const rects = [];
  const names = [];
  for (let i = 0; i < series.length; i++) {
    const t0 = Math.max(series[i].t, start);
    const t1 = i + 1 < series.length ? series[i + 1].t : end;
    if (t1 <= t0) continue;
    const x0 = X(t0);
    const w = X(t1) - x0;
    rects.push(`<rect x="${x0.toFixed(3)}" y="0" width="${w.toFixed(3)}" height="100" fill="${haacEsc(stateColour(series[i].v))}"/>`);
    if (h.style.show_labels !== false && w >= 1) {
      names.push(`<span class="seg" style="left:${x0.toFixed(3)}%;width:${w.toFixed(3)}%">${haacEsc(series[i].v)}</span>`);
    }
  }
  const current = series[series.length - 1].v;
  return {
    kind: "timeline",
    svg: `<svg viewBox="0 0 100 100" preserveAspectRatio="none">${rects.join("")}</svg>`,
    label: current + (unit ? ` ${unit}` : ""),
    names: names.join("")
  };
}

// Time axis ticks for a history chart. Ticks fall on whole local times (or local midnights for longer steps).
// Returns [{ x (percent of width), html }]. Midnight ticks show the date in bold, as Home Assistant does.
function haacHistoryTicks(h, now) {
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const MIN = 60000, HOUR = 60 * MIN, DAY = 24 * HOUR;
  const start = now - haacRangeMs(h.range);
  const span = now - start;
  const steps = [5 * MIN, 10 * MIN, 15 * MIN, 30 * MIN, HOUR, 2 * HOUR, 3 * HOUR, 6 * HOUR, 12 * HOUR,
    DAY, 2 * DAY, 3 * DAY, 7 * DAY, 14 * DAY, 30 * DAY, 90 * DAY, 180 * DAY];
  const maxTicks = Math.max(1, Number(h.ticks) || 5) + 2;
  const step = steps.find((s) => span / s <= maxTicks) || steps[steps.length - 1];

  // Offset so that ticks land on local time boundaries rather than UTC ones
  const offset = -new Date(start).getTimezoneOffset() * MIN;
  const first = Math.ceil((start + offset) / step) * step - offset;

  const out = [];
  for (let t = first; t <= now; t += step) {
    const x = ((t - start) / span) * 100;
    if (x < 4 || x > 96) continue;
    const d = new Date(t);
    const midnight = d.getHours() === 0 && d.getMinutes() === 0;
    const pad = (n) => String(n).padStart(2, "0");
    const html = midnight || step >= DAY
      ? `<b>${d.getDate()} ${MON[d.getMonth()]}</b>`
      : `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    out.push({ x, html });
  }
  return out;
}

// Border, corner radius and glow for the whole card. Empty when no border or shadow is set.
function haacCardBorderCss(b) {
  const out = [];
  const w = Number(b?.width) || 0;
  if (w > 0) {
    const style = ["solid", "dashed", "dotted", "double", "groove", "ridge", "inset", "outset"].includes(b.style) ? b.style : "solid";
    out.push(`border:${w}px ${style} ${haacPaint(b.color, b.opacity)}`);
  }
  if (b && b.radius !== "" && b.radius !== undefined && b.radius !== null && Number.isFinite(Number(b.radius))) {
    out.push(`border-radius:${Number(b.radius)}px`);
  }
  if (Number(b?.shadow_blur) > 0) {
    out.push(`box-shadow:0 0 ${Number(b.shadow_blur)}px ${haacPaint(b.shadow_color, haacAlpha(b.shadow_color_opacity))}`);
  }
  return out.join(";");
}

// Creates a blank list item for a list named by the last segment of its path
function haacNewItem(kind, n) {
  switch (kind) {
    case "sensors": return haacDefaultSlot("sensor", n);
    case "attributes": return haacDefaultSlot("attribute", n);
    case "items": return haacDefaultSwitch();
    case "conditions": return haacDefaultCondition();
    case "rules": return haacDefaultRule();
    case "gradient_stops": return { color: "#ffffff", pos: 100 };
    case "pictures": return haacDefaultPicture();
    case "templates": return haacDefaultTemplate(n);
    case "buttons": return haacDefaultButton(n);
    case "history": return haacDefaultHistory(n);
    case "bars": return haacDefaultBar(n);
    case "rows": return haacDefaultTableRow();
    case "tables": return haacDefaultTable(n);
    case "states": return { state: "", color: "#22c55e" };
    default: return {};
  }
}

function haacBuild(config) {
  // A single table from an earlier version becomes the first entry of the tables list
  const c = { ...(config || {}) };
  if (c.table && !c.tables) c.tables = [c.table];
  delete c.table;
  return haacMerge(haacDefaults(), c);
}

function haacSlotFull(raw, kind) {
  return haacMerge(haacDefaultSlot(kind), raw || {});
}

function haacSwitchFull(raw) {
  return haacMerge(haacDefaultSwitch(), raw || {});
}

// Builds the saved config: defaults removed, lists pruned per item
function haacEmitConfig(cfg) {
  const base = haacDefaults();
  const out = { ...haacPrune(cfg, base), type: HAAC_CUSTOM_TYPE };
  const list = (arr, b) => (Array.isArray(arr) ? arr : []).map((x) => haacPrune(x, b));

  const sensors = list(cfg.sensors, haacDefaultSlot("sensor"));
  const attributes = list(cfg.attributes, haacDefaultSlot("attribute"));
  delete out.sensors;
  delete out.attributes;
  if (sensors.length) out.sensors = sensors;
  if (attributes.length) out.attributes = attributes;

  const history = list(cfg.history, haacDefaultHistory());
  delete out.history;
  if (history.length) out.history = history;

  const bars = list(cfg.bars, haacDefaultBar());
  delete out.bars;
  if (bars.length) out.bars = bars;

  const tables = (Array.isArray(cfg.tables) ? cfg.tables : []).slice(0, HAAC_LIMITS.tables).map((raw) => {
    const t = haacTableFull(raw);
    return haacPrune({ ...t, rows: list(t.rows.slice(0, HAAC_LIMITS.rows), haacDefaultTableRow()) }, haacDefaultTable());
  });
  delete out.table;
  delete out.tables;
  if (tables.length) out.tables = tables;

  const templates = list(cfg.templates, haacDefaultTemplate());
  delete out.templates;
  if (templates.length) out.templates = templates;

  const buttons = list(cfg.buttons, haacDefaultButton());
  delete out.buttons;
  if (buttons.length) out.buttons = buttons;

  const pictures = list(cfg.pictures, haacDefaultPicture());
  delete out.pictures;
  if (pictures.length) out.pictures = pictures;

  const items = list(cfg.switches?.items, haacDefaultSwitch());
  const sw = haacPrune({ ...(cfg.switches || {}), items: [] }, base.switches);
  delete sw.items;
  if (items.length) sw.items = items;
  if (Object.keys(sw).length) out.switches = sw;
  else delete out.switches;

  return out;
}

// =====================================================================
// Conditions
// =====================================================================

// Evaluates one condition. fallback is the element's own entity, used when the condition names none.
function haacCondPasses(c, hass, fallback) {
  const op = c?.op || "always";
  if (op === "always") return true;

  const entity = c.entity || fallback;
  const st = entity ? hass.states[entity] : undefined;
  let raw;
  if (!st) raw = "unavailable";
  else if (c.source === "attribute") raw = st.attributes?.[c.attribute];
  else raw = st.state;

  const str = raw === undefined || raw === null ? "" : String(raw).trim();
  const low = str.toLowerCase();
  const target = String(c.value ?? "").trim();
  const tl = target.toLowerCase();
  const num = str !== "" && Number.isFinite(Number(str)) ? Number(str) : null;
  const tnum = target !== "" && Number.isFinite(Number(target)) ? Number(target) : null;
  const both = num !== null && tnum !== null;
  const target2 = String(c.value2 ?? "").trim();
  const tnum2 = target2 !== "" && Number.isFinite(Number(target2)) ? Number(target2) : null;

  // Tests included by the two bounds, whichever order they were typed in
  const between = () => {
    if (num === null || tnum === null || tnum2 === null) return false;
    return num >= Math.min(tnum, tnum2) && num <= Math.max(tnum, tnum2);
  };

  switch (op) {
    case "eq": return both ? num === tnum : low === tl;
    case "ne": return both ? num !== tnum : low !== tl;
    case "lt": return both && num < tnum;
    case "le": return both && num <= tnum;
    case "gt": return both && num > tnum;
    case "ge": return both && num >= tnum;
    case "between": return between();
    case "contains": return low.includes(tl);
    case "not_contains": return !low.includes(tl);
    case "starts_with": return low.startsWith(tl);
    case "matches":
      try {
        return new RegExp(target, "i").test(str);
      } catch (e) {
        return false;
      }
    case "is_true": return HAAC_ON_WORDS.includes(low);
    case "is_false": return HAAC_OFF_WORDS.includes(low);
    case "is_empty": return str === "";
    case "is_unavailable": return !st || low === "unavailable" || low === "unknown";
    default: return false;
  }
}

// group is { match, conditions }. An empty group always passes.
function haacPass(group, hass, fallback) {
  const conds = Array.isArray(group?.conditions) ? group.conditions : [];
  if (!conds.length) return true;
  const test = (c) => haacCondPasses(c, hass, fallback);
  return group.match === "any" ? conds.some(test) : conds.every(test);
}

function haacWarnHit(warn, num) {
  if (num === null || !warn) return false;
  const lo = haacLimit(warn.below);
  const hi = haacLimit(warn.above);
  return (lo !== null && num < lo) || (hi !== null && num > hi);
}

function haacSwitchable(entityId) {
  return HAAC_SWITCHABLE.includes(String(entityId ?? "").split(".")[0]);
}

// =====================================================================
// Values and text
// =====================================================================

// Display name for an entity. Prefers hass.formatEntityName (2026.4+) with a
// friendly_name fallback so the card works on 2026.10 and 2026.11.
function haacEntityName(hass, entityId, stateObj) {
  const st = stateObj || hass?.states?.[entityId];
  if (!st) return entityId || "";
  if (typeof hass?.formatEntityName === "function") {
    return hass.formatEntityName(st) || entityId || "";
  }
  return st.attributes?.friendly_name || entityId || "";
}

// decimals "" means auto: whole numbers stay whole, others show up to two places
function haacFormatNumber(num, decimals) {
  if (decimals === "" || decimals === null || decimals === undefined) {
    return String(Number(num.toFixed(2)));
  }
  const dp = Math.min(6, Math.max(0, Math.round(Number(decimals) || 0)));
  return num.toFixed(dp);
}

function haacSlotInfo(slot, hass) {
  if (!slot.entity) return { value: "", num: null, unit: "", name: "" };
  const st = hass.states[slot.entity];
  if (!st) return { value: "unavailable", num: null, unit: "", name: slot.entity };
  const attrs = st.attributes || {};
  const raw = slot.source === "attribute" ? attrs[slot.attribute] : st.state;
  const str = raw === undefined || raw === null ? "--" : String(raw);
  let n = str.trim() !== "" && Number.isFinite(Number(str)) ? Number(str) : null;
  let unit = attrs.unit_of_measurement ?? "";

  // Optional display conversion, such as W to kW. Applies to the entity's own state only.
  if (n !== null && slot.source !== "attribute" && slot.unit_convert && slot.unit_convert !== unit) {
    const family = HAAC_UNIT_FAMILIES[haacUnitKind(st)];
    const factor = family?.convert[`${unit}:${slot.unit_convert}`];
    if (factor) {
      n = n * factor;
      unit = slot.unit_convert;
    }
  }

  return {
    value: n === null ? str : haacFormatNumber(n, slot.decimals),
    num: n,
    unit,
    name: haacEntityName(hass, slot.entity, st)
  };
}

// {v} value, {u} unit, {name} entity display name, | line break. Output is escaped.
function haacFormatText(template, info) {
  const s = String(template ?? "")
    .split("{v}").join(info.value)
    .split("{u}").join(info.unit)
    .split("{name}").join(info.name);
  return haacEsc(s).split("|").join("<br>");
}

// Button text: a | starts a new line. Escaped first, so the text itself stays safe.
function haacButtonText(s) {
  return haacEsc(s).split("|").join("<br>");
}

function haacSlotEntities(slot, out = []) {
  if (slot.entity) out.push(slot.entity);
  (slot.visible?.conditions || []).forEach((c) => c?.entity && out.push(c.entity));
  (slot.rules || []).forEach((r) => (r.conditions || []).forEach((c) => c?.entity && out.push(c.entity)));
  return out;
}

// Fill opacity falls back to the background opacity, so existing cards look the same
function haacFillOpacity(bg) {
  return bg.fill_opacity === undefined || bg.fill_opacity === "" ? bg.opacity : bg.fill_opacity;
}

function haacBackgroundCss(bg) {
  const base = `background-color:${bg.color || "transparent"};opacity:${Number(bg.opacity) || 0};`;

  if (bg.type === "image" && bg.image) {
    const url = String(bg.image).replace(/["\\()]/g, (ch) => encodeURIComponent(ch));
    const size = bg.fit === "stretch"
      ? "100% 100%"
      : bg.fit === "custom"
        ? `${Number(bg.scale) * 100}%`
        : bg.fit || "cover";
    return `background-color:transparent;opacity:${Number(bg.opacity) || 0};background-image:url("${url}");background-size:${size};` +
      `background-position:${Number(bg.pos_x)}% ${Number(bg.pos_y)}%;` +
      `background-repeat:${bg.repeat || "no-repeat"};`;
  }

  if (bg.type === "gradient") {
    const stops = [...(bg.gradient_stops || [])]
      .filter((s) => s && s.color)
      .sort((a, b) => Number(a.pos) - Number(b.pos))
      .map((s) => `${haacPaint(s.color, haacAlpha(s.color_opacity))} ${Number(s.pos)}%`)
      .join(", ");
    if (stops) {
      const img = bg.gradient_type === "radial"
        ? `radial-gradient(circle, ${stops})`
        : `linear-gradient(${Number(bg.gradient_angle)}deg, ${stops})`;
      return `${base}background-image:${img};`;
    }
  }

  return base;
}

// =====================================================================
// Card
// =====================================================================

// Whole-percent offset that keeps an overlay of `size` (% of the picture) inside the picture.
// Right and bottom offsets are measured from the far edge, so they use the same range as left and top.
function haacFitPos(anchor, raw, size) {
  let lo = 0;
  let hi = 100 - size;
  if (anchor === "center") {
    lo = size / 2 - 50;
    hi = 50 - size / 2;
  }
  if (hi < lo) hi = lo;
  return Math.min(Math.max(Math.round(raw), Math.ceil(lo)), Math.floor(hi));
}

// True when the card is shown in Home Assistant's card editor preview rather than on a dashboard
function haacInEditorPreview(el) {
  for (let n = el; n; n = n.parentNode || n.host || null) {
    if (n.tagName === "HUI-CARD-PREVIEW" || n.tagName === "HUI-DIALOG-EDIT-CARD") return true;
  }
  return false;
}

class HaApplianceCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement(HAAC_EDITOR);
  }

  static getStubConfig() {
    return { type: HAAC_CUSTOM_TYPE, name: "Dishwasher", appliance_type: "dishwasher", icon: "mdi:dishwasher" };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._open = null;
    this._built = false;
    this._subs = new Map();
    this._tplResults = new Map();
    this._hist = new Map();
    this._histBusy = new Set();
    this._histTimer = null;
    this._armed = null; // index of a button waiting for its confirming tap
    this._armTimer = null;
    this._fx = new Map(); // index -> animation name while a press animates
    this._fxTimers = new Map();
    this._press = null; // pending press in the editor preview
    this._hinted = new Set(); // overlays whose hover hint was dismissed by use, kept for this edit session
    this.shadowRoot.addEventListener("click", (ev) => this._onClick(ev));
    this.shadowRoot.addEventListener("pointerdown", (ev) => this._onPointerDown(ev));
    this.shadowRoot.addEventListener("pointermove", (ev) => this._onPointerMove(ev));
    this.shadowRoot.addEventListener("pointerup", () => this._onPointerUp());
    this.shadowRoot.addEventListener("pointercancel", () => this._endPress());
    this.shadowRoot.addEventListener("pointerover", (ev) => this._onPointerOver(ev));
    this.shadowRoot.addEventListener("contextmenu", (ev) => { if (this._press) ev.preventDefault(); });
    this.shadowRoot.addEventListener("animationend", (ev) => {
      if (ev.target.classList) ev.target.classList.remove("pulse");
      const btn = ev.target.closest ? ev.target.closest(".btn-ov") : null;
      if (btn && btn.dataset.index !== undefined) this._endFx(Number(btn.dataset.index));
    });
  }

  connectedCallback() {
    this.toggleAttribute("data-editor-preview", haacInEditorPreview(this));
    this._syncTemplates();
    clearInterval(this._histTimer);
    // Slides the chart windows along and refreshes stale history
    this._histTimer = setInterval(() => {
      this._syncHistory();
      this._patch();
    }, 30000);
  }

  disconnectedCallback() {
    this._tblObs?.disconnect();
    clearInterval(this._histTimer);
    this._histTimer = null;
    this._disarm();
    this._fxTimers.forEach((t) => clearTimeout(t));
    this._fxTimers.clear();
    this._fx.clear();
    this._subs.forEach((sub) => sub.unsub());
    this._subs.clear();
    this._tplResults.clear();
  }

  _buttonList() {
    return (this._config.buttons || []).slice(0, HAAC_LIMITS.buttons).map(haacButtonFull);
  }

  // Text, colours and state for one button. Returns null when it is hidden.
  _buttonData(i, b) {
    if (b.enabled === false || (!b.entity && !String(b.label ?? "").trim())) return null;
    const hass = this._hass;
    if (!haacPass(b.visible, hass, b.entity)) return null;

    const st = b.entity ? hass.states[b.entity] : undefined;
    const armed = this._armed === i;
    const running = !!st && HAAC_ON_WORDS.includes(String(st.state).toLowerCase());
    let text = b.label || (b.entity ? haacEntityName(hass, b.entity, st) : "") || "";
    if (running && b.on_label) text = b.on_label;
    if (armed) text = b.arm_label || "Confirm?";

    const icon = b.icon && b.show_icon !== false ? `<ha-icon icon="${haacEsc(b.icon)}"></ha-icon>` : "";
    if (!text.trim() && !icon) return null;

    const s = b.style || {};
    const rule = armed ? null : (b.rules || []).find((r) => Array.isArray(r.conditions) && r.conditions.length && haacPass(r, hass, b.entity));
    let color = armed ? haacPaint(b.arm_color, 1) : haacPaint(s.color, haacAlpha(s.color_opacity));
    let bg = armed ? haacPaint(b.arm_bg, 1) : s.bg_none ? "transparent" : haacPaint(s.bg, haacAlpha(s.bg_opacity));
    if (rule) {
      if (rule.color) color = haacPaint(rule.color, haacAlpha(rule.color_opacity));
      if (rule.bg) bg = haacPaint(rule.bg, haacAlpha(rule.bg_opacity));
    }
    const jt = ["left", "center", "right"].includes(b.justify) ? b.justify : "center";
    const css = [
      ...this._placement(b.pos),
      `justify-content:${HAAC_JUSTIFY[jt]}`,
      Number(b.width) > 0 ? `width:${Number(b.width)}%;white-space:normal` : "",
      `font-size:${Number(s.size)}px`,
      `font-weight:${s.bold ? 500 : 400}`,
      `color:${color}`,
      `background:${bg}`,
      `opacity:${Number(s.opacity)}`,
      `border-radius:${Number(s.radius)}px`,
      `padding:${Number(s.padding)}px ${Number(s.padding) * 1.5}px`,
      Number(s.border_width) > 0 ? `border:${Number(s.border_width)}px solid ${haacPaint(s.border_color, haacAlpha(s.border_color_opacity))}` : "border:none"
    ].filter(Boolean).join(";");

    const plain = text.split("|").join(" ").replace(/\s+/g, " ").trim();
    return { css, armed, flash: !!rule && !!rule.flash, label: plain, inner: `${icon}${text ? `<span class="lbl" style="text-align:${jt}">${haacButtonText(text)}</span>` : ""}` };
  }

  // Updates every button in place. The inner content is only replaced when its text or icon changes,
  // so a running press animation is not restarted by unrelated state updates.
  _patchButtons() {
    const root = this.shadowRoot;
    this._buttonList().forEach((b, i) => {
      const el = root.querySelector(`[data-key="btn:${i}"]`);
      if (!el) return;
      const d = this._buttonData(i, b);
      if (!d) {
        el.style.display = "none";
        return;
      }
      const fx = this._fx.get(i);
      el.className = `btn-ov${d.armed ? " armed" : ""}${fx ? ` fx-${fx}` : ""}${d.flash ? " flash" : ""}`;
      el.style.cssText = d.css;
      el.style.display = "";
      el.setAttribute("aria-label", d.label || "Button");
      if (el.dataset.sig !== d.inner) {
        el.dataset.sig = d.inner;
        el.innerHTML = `<span class="btn-in">${d.inner}</span>`;
      }
    });
  }

  _pressButton(i) {
    const b = this._buttonList()[i];
    if (!b || !b.entity) return;
    const preset = haacButtonAction(b.action);
    const danger = b.confirm === "yes" || (b.confirm !== "no" && !!preset.danger);
    // First tap arms a button that needs confirming. The second tap runs it.
    if (danger && this._armed !== i) {
      this._arm(i);
      return;
    }
    this._disarm();
    if (b.animate) this._startFx(i, b.anim_style);
    this._runButton(b, preset);
    this._patchButtons();
  }

  _runButton(b, preset) {
    if (preset.more) {
      this.dispatchEvent(new CustomEvent("hass-more-info", { bubbles: true, composed: true, detail: { entityId: b.entity } }));
      return;
    }
    // Never call a service on an entity from a different domain than the action supports
    const domain = String(b.entity).split(".")[0];
    if (preset.domains && !preset.domains.includes(domain)) return;
    // Some actions use the entity's own domain, so button.press and input_button.press both work
    const [presetDomain, service] = preset.service;
    const svcDomain = preset.per_domain ? domain : presetDomain;
    this._hass.callService(svcDomain, service, { entity_id: b.entity });
  }

  _arm(i) {
    this._disarm();
    this._armed = i;
    this._armTimer = setTimeout(() => {
      this._armed = null;
      this._armTimer = null;
      this._patchButtons();
    }, HAAC_ARM_MS);
    this._patchButtons();
  }

  _disarm() {
    clearTimeout(this._armTimer);
    this._armTimer = null;
    this._armed = null;
  }

  _startFx(i, style) {
    const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    this._fx.set(i, reduce ? "reduced" : (style || "pulse"));
    clearTimeout(this._fxTimers.get(i));
    this._fxTimers.set(i, setTimeout(() => this._endFx(i), HAAC_FX_MS));
  }

  _endFx(i) {
    if (!this._fx.has(i)) return;
    this._fx.delete(i);
    clearTimeout(this._fxTimers.get(i));
    this._fxTimers.delete(i);
    this._patchButtons();
  }

  // ---- data tables -----------------------------------------------------
  _tables() {
    return (this._config.tables || []).slice(0, HAAC_LIMITS.tables).map((t) => haacTableFull(t));
  }

  _tableRows(t) {
    return (t.rows || []).filter((r) => r && r.entity).slice(0, HAAC_LIMITS.rows);
  }

  // Markup for each table on the picture. Row values are set in _patchTable.
  _tablesMarkup() {
    return this._tables().map((t, i) => {
      const rows = this._tableRows(t).map((r, n) =>
        `<tr class="${t.zebra && n % 2 === 1 ? "zebra" : ""}" data-action="tap" data-entity="${haacEsc(r.entity)}" data-tap="${haacEsc(t.tap || "more-info")}">` +
        `<td class="ti"><span class="cw"></span></td><td class="tv"><span class="cw"></span></td><td class="tu"><span class="cw"></span></td></tr>`
      ).join("");
      const heads = [0, 1, 2].map(() => `<th><span class="cw"></span></th>`).join("");
      return `<div class="tbl-ov" data-key="table:${i}" data-config="tables/${i}" style="display:none"><div class="tbl-wrap">` +
        `<table><colgroup><col><col><col></colgroup><thead><tr>${heads}</tr></thead><tbody>${rows}</tbody></table>` +
        `</div></div>`;
    }).join("");
  }

  // Column widths and the Updated column, as in the EV card
  _applyTableColumns(table, t) {
    table.classList.toggle("no-upd", !t.updated);
    const cols = [...table.querySelectorAll("col")];
    const shown = t.updated ? [0, 1, 2] : [0, 1];
    const widths = shown.map((i) => Math.max(0, Number(t.widths[i]) || 0));
    const sum = widths.reduce((a, b) => a + b, 0);
    table.style.width = `${Math.min(sum, 100)}%`;
    table.style.margin = "0 auto";
    cols.forEach((col, i) => {
      const k = shown.indexOf(i);
      col.style.display = k === -1 ? "none" : "";
      col.style.width = k === -1 || sum <= 0 ? "" : `${(widths[k] / sum) * 100}%`;
    });
  }

  // Styles and live values for every table. Runs with each state update, so the ages stay current.
  _patchTable(hass) {
    if (!hass) return;
    this._tables().forEach((t, i) => {
      const el = this.shadowRoot.querySelector(`[data-key="table:${i}"]`);
      if (!el) return;
      const rows = this._tableRows(t);
      const visible = t.enabled !== false && haacPass(t.visible, hass, rows[0]?.entity || "");

      el.style.cssText = [...this._placement(t.pos), `width:${Number(t.width)}%`].join(";");
      el.style.display = visible ? "" : "none";

      const wrap = el.querySelector(".tbl-wrap");
      wrap.style.background = haacPaint(t.bg, t.bg_opacity);
      wrap.style.border = t.border_show ? `${Number(t.border_width)}px solid ${haacPaint(t.border_color)}` : "none";

      const table = el.querySelector("table");
      this._applyTableColumns(table, t);
      table.style.fontSize = `${Number(t.size)}px`;
      table.style.fontFamily = t.mono ? "monospace" : "";
      table.style.fontWeight = t.bold ? "700" : "400";
      table.style.color = t.text;
      table.style.setProperty("--tbl-zebra", haacPaint("#ffffff", t.zebra_opacity));
      table.style.setProperty("--tbl-cell", t.cell_show
        ? `${Number(t.cell_width)}px solid ${haacPaint(t.cell_color, t.cell_opacity)}`
        : "none");
      el.querySelectorAll("th").forEach((th, n) => {
        th.style.color = t.head;
        haacPutText(th.querySelector(".cw"), t.headers[n] ?? "");
      });

      const trs = [...el.querySelectorAll("tbody tr")];
      rows.forEach((r, n) => {
        const tr = trs[n];
        if (!tr) return;
        const st = hass.states[r.entity];
        const unit = st?.attributes?.unit_of_measurement;
        haacPutText(tr.querySelector(".ti .cw"), r.label || haacEntityName(hass, r.entity, st) || r.entity);
        haacPutText(tr.querySelector(".tv .cw"), st ? `${st.state}${unit ? ` ${unit}` : ""}` : "--");
        haacPutText(tr.querySelector(".tu .cw"), st?.last_changed ? haacAge(Date.now() - Date.parse(st.last_changed)) : "");
      });

      if (visible) this._fitTable(el, t);
    });
  }

  // Shrinks each cell's text to fit its width, and wraps it if allowed. A cell is only re-measured
  // when its text, width or size settings change, so an unchanged state costs nothing.
  _fitTable(el, t) {
    const max = Math.max(6, Number(t.size) || 11);
    const min = Math.min(max, Math.max(6, Number(t.size_min) || 8));
    const fit = !!t.fit;
    const wrapLines = fit && t.wrap ? Math.min(3, Math.max(2, Math.round(Number(t.wrap_lines) || 3))) : 0;
    el.querySelectorAll("th, td").forEach((cell) => {
      const span = cell.querySelector(":scope > .cw");
      if (!span) return;
      const key = `${span.textContent}|${max}|${min}|${fit}|${wrapLines}|${cell.clientWidth}`;
      if (cell._fitKey === key) return;
      cell._fitKey = key;
      this._fitCell(cell, span, max, min, fit, wrapLines);
    });
  }

  _fitAllTables() {
    this._tables().forEach((t, i) => {
      const el = this.shadowRoot.querySelector(`[data-key="table:${i}"]`);
      if (el && el.style.display !== "none") this._fitTable(el, t);
    });
  }

  _fitCell(cell, span, max, min, fit, wrapLines) {
    const text = span.textContent;
    span.classList.remove("wrap");
    cell.style.fontSize = `${max}px`;
    const cs = getComputedStyle(cell);
    const avail = cell.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if (!fit || avail <= 0) return;

    let size = max;
    const need = this._textWidth(text, cs, size);
    if (need <= avail) return;

    size = Math.max(min, Math.floor(max * (avail / need) * 2) / 2);
    while (size > min && this._textWidth(text, cs, size) > avail) {
      size = Math.max(min, size - 0.5);
    }
    cell.style.fontSize = `${size}px`;

    if (wrapLines && this._textWidth(text, cs, size) > avail) {
      span.style.webkitLineClamp = String(wrapLines);
      span.classList.add("wrap");
    }
  }

  // Measures text in a hidden element that uses the cell's font
  _textWidth(text, cs, size) {
    const m = this.shadowRoot.querySelector(".measure");
    if (!m) return 0;
    m.style.fontFamily = cs.fontFamily;
    m.style.fontWeight = cs.fontWeight;
    m.style.letterSpacing = cs.letterSpacing;
    m.style.fontSize = `${size}px`;
    m.textContent = text;
    return m.getBoundingClientRect().width;
  }

  // Re-fits every table when the picture or card changes size
  _observeTable() {
    if (typeof ResizeObserver === "undefined") return;
    if (!this._tblObs) this._tblObs = new ResizeObserver(() => this._fitAllTables());
    this._tblObs.disconnect();
    this.shadowRoot.querySelectorAll(".tbl-wrap").forEach((w) => this._tblObs.observe(w));
  }

  _bars() {
    return (this._config.bars || []).slice(0, HAAC_LIMITS.bars).map((b) => haacBarFull(b));
  }

  // One bar overlay: the live value of its entity between a start and an end.
  // The value is read from hass directly, so it needs no history and redraws with each state update.
  _barData(b) {
    const hass = this._hass;
    if (b.enabled === false || !b.entity || !haacPass(b.visible, hass, b.entity)) return null;
    const sty = b.style;
    const st = hass.states[b.entity];
    const num = (x) => (x === "" || x === null || x === undefined || !Number.isFinite(Number(x)) ? null : Number(x));
    const limit = (ent, typed) => num(ent ? hass.states[ent]?.state : undefined) ?? num(typed) ?? 0;
    const start = limit(b.start_entity, b.start);
    const end = limit(b.end_entity, b.end);
    const span = end - start;
    const value = num(st?.state);
    const unit = st?.attributes?.unit_of_measurement ?? "";
    const vert = !!b.vertical;

    // Positions along the bar as fractions from 0 to 1, clamped to the range
    const frac = (x) => (span === 0 ? 0 : Math.min(1, Math.max(0, (x - start) / span)));
    const zeroAt = span === 0 ? null : (0 - start) / span;
    const zeroIn = zeroAt !== null && zeroAt >= 0 && zeroAt <= 1;
    const origin = b.from_zero ? frac(0) : 0;
    const vf = value === null ? origin : frac(value);
    const fillFrom = Math.min(origin, vf);
    const fillLen = Math.abs(vf - origin);
    const negative = b.from_zero && value !== null && value < 0;
    const fill = negative
      ? haacPaint(sty.neg_color, haacAlpha(sty.neg_color_opacity))
      : haacPaint(sty.pos_color, haacAlpha(sty.pos_color_opacity));

    const pct = (x) => `${(x * 100).toFixed(2)}%`;
    const along = (p, len) => (vert ? `bottom:${pct(p)};height:${pct(len)}` : `left:${pct(p)};width:${pct(len)}`);
    const at = (p) => (vert ? `bottom:${pct(p)};transform:translateY(50%)` : `left:${pct(p)};transform:translateX(-50%)`);
    const fmt = (x) => String(Math.round(x * 100) / 100);
    // Tick labels: whole numbers, unless both limits are under 10 (then up to 2 decimals) or decimals are set
    const tickDec = b.tick_decimals === "" || b.tick_decimals === null || b.tick_decimals === undefined
      ? (Math.abs(start) < 10 && Math.abs(end) < 10 ? 2 : 0)
      : Math.min(3, Math.max(0, Math.round(Number(b.tick_decimals)) || 0));
    const fmtTick = (x) => {
      const r = Number(x.toFixed(tickDec));
      return String(r === 0 ? 0 : r);
    };
    const labelSize = Number(sty.label_size);
    const labelCss = `color:${haacPaint(sty.label_color, haacAlpha(sty.label_color_opacity))};font-size:${labelSize}px;font-weight:${sty.bold ? 500 : 400}`;
    const tickSize = Number(sty.tick_size) || 11;
    const tickCss = `color:${haacPaint(sty.label_color, haacAlpha(sty.label_color_opacity))};font-size:${tickSize}px;font-weight:${sty.bold ? 500 : 400}`;
    const label = (p, text) => `<span class="blab" style="${haacEsc(`${at(p)};${vert ? "left:4px" : "top:0"};${tickCss}`)}">${haacEsc(text)}</span>`;
    // Room for the widest end label to hang past the track, so the panel holds it
    const longest = Math.max(fmtTick(start).length, fmtTick(end).length, 1);
    const edge = Math.ceil((longest * tickSize * 0.6) / 2) + 4;

    // Divisions: marks at every step, labels at every step or at the ends only
    const steps = Math.min(20, Math.max(2, Math.round(Number(b.steps)) || 4));
    const marks = [];
    const labels = [];
    for (let k = 0; k <= steps; k++) {
      const p = k / steps;
      const tv = start + span * p;
      marks.push(`<span class="bmark${vert ? " v" : ""}" style="${haacEsc(at(p))}"></span>`);
      const atZero = b.from_zero && zeroIn && Math.abs(tv) < 1e-9;
      const wanted = b.label_every || (b.show_ends !== false && (k === 0 || k === steps));
      if (wanted && !atZero) labels.push(label(p, fmtTick(tv)));
    }
    if (b.from_zero && zeroIn) labels.push(label(zeroAt, "0"));

    // Zero marker, drawn across the track at zero
    const zeroW = Number(sty.zero_width) || 2;
    const zeroLine = b.from_zero && zeroIn
      ? `<span class="bzero${vert ? " v" : ""}" style="${haacEsc(
          `${vert ? `bottom:${pct(zeroAt)};height:${zeroW}px;transform:translateY(50%)` : `left:${pct(zeroAt)};width:${zeroW}px;transform:translateX(-50%)`};background:${haacPaint(sty.zero_color, 1)}`
        )}"></span>`
      : "";

    // Value text, with the icon in front when shown
    const showValue = b.show_value !== false;
    const icon = b.icon && b.show_icon !== false ? `<ha-icon icon="${haacEsc(b.icon)}"></ha-icon>` : "";
    const shown = value === null ? (st ? String(st.state) : "unavailable") : `${fmt(value)}${unit ? ` ${unit}` : ""}`;
    const valPos = b.value_pos || "above";

    // Title: inline with the value (before or after, with a separator), or above/below the value
    const titleText = String(b.title || "").trim();
    const titleSize = Number(sty.title_size) || 11;
    const titleCss = `color:${haacPaint(sty.title_color, haacAlpha(sty.title_color_opacity))};font-size:${titleSize}px;font-weight:${sty.title_bold ? 600 : 400}`;
    const titleSpan = titleText ? `<span style="${haacEsc(titleCss)}">${haacEsc(titleText)}</span>` : "";
    const valueSpan = showValue ? `<span>${haacEsc(shown)}</span>` : "";
    const sep = { space: " ", colon: ": ", dash: " - " }[b.title_sep] ?? " ";
    const inlineTitle = b.title_mode !== "around" && titleSpan;
    let inlineBody;
    if (inlineTitle && valueSpan) {
      inlineBody = b.title_order === "after"
        ? `${valueSpan}${sep}${titleSpan}`
        : `${titleSpan}${sep}${valueSpan}`;
    } else {
      inlineBody = inlineTitle || valueSpan;
    }
    const valHtml = icon || inlineBody
      ? `<div class="bval${valPos === "inside" ? " in" : ""}" style="${haacEsc(labelCss)}">${icon}${inlineBody}</div>`
      : "";
    // Above or below the value. Hidden when the value sits inside the bar.
    const aroundTitle = titleSpan && b.title_mode === "around" && valPos !== "inside"
      ? `<div class="btitle" style="${haacEsc(titleCss)}">${haacEsc(titleText)}</div>`
      : "";
    const valAbove = valPos === "above" ? `${aroundTitle}${valHtml}` : "";
    const valInside = valPos === "inside" ? valHtml : "";
    const valBelow = valPos === "below" ? `${valHtml}${aroundTitle}` : "";

    const thick = Number(sty.bar_thickness) || 14;
    const border = Number(sty.border_width) > 0
      ? `border:${Number(sty.border_width)}px solid ${haacPaint(sty.border_color, haacAlpha(sty.border_color_opacity))}`
      : "border:none";
    const trackCss = [
      vert ? `width:${thick}px;height:100%` : `height:${thick}px;width:100%`,
      `background:${sty.bg_none ? "transparent" : haacPaint(sty.bg, sty.bg_opacity)}`,
      `border-radius:${Number(sty.radius)}px`,
      border
    ].join(";");
    const fillCss = `${along(fillFrom, fillLen)};border-radius:${Number(sty.radius)}px;background:${fill}`;
    const track = `<div class="btrack${vert ? " v" : ""}" style="${haacEsc(trackCss)}">` +
      `<span class="bfill${vert ? " v" : ""}" style="${haacEsc(fillCss)}"></span>` +
      `${zeroLine}${marks.join("")}${valInside}</div>`;

    const labelsHtml = labels.join("");
    const scale = labelsHtml
      ? (vert ? `<div class="bscale v">${labelsHtml}</div>` : `<div class="bscale" style="height:${tickSize + 6}px">${labelsHtml}</div>`)
      : "";

    const body = vert
      ? `${valAbove}<div class="brow">${track}${scale}</div>${valBelow}`
      : `${valAbove}${track}${scale}${valBelow}`;
    const inner = `<div class="bcol${vert ? " v" : ""}" style="padding:0 ${vert ? 0 : edge}px">${body}</div>`;

    const css = [
      ...this._placement(b.pos),
      `width:${Number(b.width)}%`,
      vert ? `height:${Number(b.height)}%` : `min-height:${Number(b.height)}%`,
      `opacity:${Number(sty.opacity)}`,
      `padding:${Number(sty.padding)}px`,
      `border-radius:${Number(sty.radius)}px`,
      `background:${sty.panel_bg_none ? "transparent" : haacPaint(sty.panel_bg, sty.panel_bg_opacity)}`
    ].join(";");
    return { css, inner };
  }

  _histories() {
    return (this._config.history || []).slice(0, HAAC_LIMITS.history).map((h) => haacHistoryFull(h));
  }

  // Requests history for any chart whose entity or range has changed, or whose data is more than a minute old
  _syncHistory() {
    if (!this._config || !this._hass) return;
    this._histories().forEach((h, i) => {
      if (h.enabled === false || !h.entity || !this._hass.states[h.entity]) return;
      const key = `${h.entity}|${h.range}`;
      const cache = this._hist.get(i);
      const stale = !cache || cache.key !== key || Date.now() - cache.at > 60000;
      if (stale && !this._histBusy.has(i)) this._fetchHistory(i, h, key);
    });
  }

  async _fetchHistory(i, h, key) {
    this._histBusy.add(i);
    try {
      const end = new Date();
      const start = new Date(end.getTime() - haacRangeMs(h.range));
      const res = await this._hass.callWS({
        type: "history/history_during_period",
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        entity_ids: [h.entity],
        minimal_response: true,
        no_attributes: true,
        significant_changes_only: false
      });
      const list = (res && res[h.entity]) || [];
      const points = list.map((e) => ({
        t: e.lu !== undefined ? e.lu * 1000 : Date.parse(e.last_updated || e.last_changed),
        v: String(e.s ?? e.state ?? "")
      })).filter((p) => Number.isFinite(p.t));
      // Changes that arrived while the request was running are kept
      const live = (this._hist.get(i)?.points || []).filter((p) => p.t > end.getTime());
      this._hist.set(i, { key, at: Date.now(), points: [...points, ...live], error: null });
    } catch (e) {
      this._hist.set(i, { key, at: Date.now(), points: [], error: String(e?.message || e) });
    } finally {
      this._histBusy.delete(i);
      this._patch();
    }
  }

  // Adds each new state change of a charted entity, so the chart updates without another request
  _pushHistory(prev) {
    if (!prev || !this._config) return;
    this._histories().forEach((h, i) => {
      if (!h.entity) return;
      const before = prev.states[h.entity]?.state;
      const now = this._hass.states[h.entity]?.state;
      if (now === undefined || now === before) return;
      const cache = this._hist.get(i);
      if (cache) cache.points.push({ t: Date.now(), v: String(now) });
    });
  }

  _historyData(h, i) {
    if (h.enabled === false || !h.entity) return null;
    if (!haacPass(h.visible, this._hass, h.entity)) return null;
    const sty = h.style;
    const cache = this._hist.get(i);
    const unit = this._hass.states[h.entity]?.attributes?.unit_of_measurement ?? "";
    const labelCss = `color:${haacPaint(sty.label_color, haacAlpha(sty.label_color_opacity))};font-size:${Number(sty.label_size)}px;font-weight:${sty.bold ? 500 : 400}`;
    let inner;
    if (!cache) inner = `<div class="hlabel" style="${haacEsc(labelCss)}">Loading…</div>`;
    else if (cache.error) inner = `<div class="hlabel" style="${haacEsc(labelCss)}">No history</div>`;
    else {
      const out = haacHistoryRender(h, cache.points, Date.now(), unit);
      if (!out) inner = `<div class="hlabel" style="${haacEsc(labelCss)}">No data</div>`;
      else {
        const axis = h.show_axis !== false;
        const axisCss = `color:${haacPaint(sty.axis_color, haacAlpha(sty.axis_color_opacity))};font-size:${Math.max(8, Number(sty.label_size) - 1)}px;` +
          (sty.axis_bg_none ? "background:transparent" : `background:${haacPaint(sty.axis_bg, sty.axis_bg_opacity)}`);
        const ticks = axis
          ? haacHistoryTicks(h, Date.now()).map((t) => `<span class="tick" style="left:${t.x.toFixed(2)}%">${t.html}</span>`).join("")
          : "";
        const icon = h.icon && h.show_icon !== false ? `<ha-icon icon="${haacEsc(h.icon)}"></ha-icon>` : "";
        const valueText = out.kind === "line" && sty.show_labels !== false ? haacEsc(out.label) : "";
        const jcss = { left: "left:6px;right:auto", center: "left:50%;right:auto;transform:translateX(-50%)", right: "right:6px;left:auto" }[h.justify] || "right:6px;left:auto";
        const labelHtml = icon || valueText
          ? `<div class="hlabel" style="${haacEsc(`${labelCss};${jcss}`)}">${icon}${valueText}</div>`
          : "";
        const names = out.kind === "timeline" && out.names
          ? `<div class="segs" style="${haacEsc(`font-size:${Number(sty.label_size)}px;color:${haacPaint(sty.label_color, haacAlpha(sty.label_color_opacity))}`)}">${out.names}</div>`
          : "";
        inner = `<div class="hbody" style="${axis ? "bottom:14px" : ""}">${out.svg}${labelHtml}${names}</div>` +
          (axis ? `<div class="haxis" style="${haacEsc(axisCss)}">${ticks}</div>` : "");
      }
    }
    const bg = sty.bg_none ? "transparent" : haacPaint(sty.bg, sty.bg_opacity);
    const css = [
      ...this._placement(h.pos),
      `width:${Number(h.width)}%`,
      `height:${Number(h.height)}%`,
      `background:${bg}`,
      `opacity:${Number(sty.opacity)}`,
      `border-radius:${Number(sty.radius)}px`,
      `padding:${Number(sty.padding)}px`,
      Number(sty.border_width) > 0 ? `border:${Number(sty.border_width)}px solid ${haacPaint(sty.border_color, haacAlpha(sty.border_color_opacity))}` : "border:none"
    ].join(";");
    return { css, inner };
  }

  _templates() {
    return (this._config.templates || []).slice(0, HAAC_LIMITS.templates).map((t) => haacTemplateFull(t));
  }

  // One subscription per template text and per show-when test. Recreated only when its text or entities change.
  _syncTemplates() {
    if (!this._config) return;
    const conn = this._hass?.connection;
    const want = new Map();
    if (conn) {
      this._templates().forEach((t, k) => {
        const watch = haacTemplateWatch(t, this._hass);
        const sig = JSON.stringify([t.template, t.show_when, watch]);
        if (String(t.template ?? "").trim()) want.set(`${k}:text`, { template: t.template, watch, sig });
        if (String(t.show_when ?? "").trim()) want.set(`${k}:show`, { template: t.show_when, watch, sig });
      });
    }
    this._subs.forEach((sub, key) => {
      const w = want.get(key);
      if (!w || w.sig !== sub.sig) {
        sub.unsub();
        this._subs.delete(key);
        this._tplResults.delete(key);
      }
    });
    want.forEach((w, key) => {
      if (this._subs.has(key)) return;
      const unsub = haacRenderTemplate(conn, w.template, w.watch, (r) => {
        this._tplResults.set(key, r);
        this._patch();
      });
      this._subs.set(key, { sig: w.sig, unsub });
    });
  }

  // Text and styling for a template overlay. Returns null while hidden or before its first result.
  _templateData(s) {
    if (s.enabled === false) return null;
    const hass = this._hass;
    if (!haacPass(s.visible, hass, s.entity)) return null;
    if (String(s.show_when ?? "").trim() && !haacTruthy(this._tplResults.get(`${s.tplIndex}:show`))) return null;
    const res = this._tplResults.get(`${s.tplIndex}:text`);
    if (!res) return null;

    let color = haacPaint(s.style.color, haacAlpha(s.style.color_opacity));
    let bg = s.style.bg_none ? "transparent" : haacPaint(s.style.bg, s.style.bg_opacity);
    let flash = false;
    const rule = (s.rules || []).find((r) => Array.isArray(r.conditions) && r.conditions.length && haacPass(r, hass, s.entity));
    if (rule) {
      if (rule.color) color = haacPaint(rule.color, haacAlpha(rule.color_opacity));
      if (rule.bg) bg = haacPaint(rule.bg, haacAlpha(rule.bg_opacity));
      flash = !!rule.flash;
    }

    const body = res.error ? "Template error" : haacEsc(res.text ?? "");
    const text = body.replace(/\n/g, "<br>");
    const icon = s.icon && s.show_icon !== false ? `<ha-icon icon="${haacEsc(s.icon)}"></ha-icon>` : "";
    if (!text.trim() && !icon) return null;

    const st = s.style;
    const css = [
      ...this._placement(s.pos),
      Number(s.width) > 0 ? `width:${Number(s.width)}%` : "",
      `display:block`,
      `white-space:${Number(s.width) > 0 ? "normal" : "nowrap"}`,
      `text-align:${["left", "center", "right"].includes(s.justify) ? s.justify : "left"}`,
      `font-size:${Number(st.size)}px`,
      `font-weight:${st.bold ? 500 : 400}`,
      `color:${color}`,
      `background:${bg}`,
      `opacity:${Number(st.opacity)}`,
      `border-radius:${Number(st.radius)}px`,
      `padding:${Number(st.padding)}px ${Number(st.padding) * 1.5}px`,
      Number(st.border_width) > 0 ? `border:${Number(st.border_width)}px solid ${haacPaint(st.border_color, haacAlpha(st.border_color_opacity))}` : "border:none"
    ].filter(Boolean).join(";");

    return { css, flash, inner: `${icon}${text ? `<span>${text}</span>` : ""}` };
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration for ha-appliance-card");
    this._config = haacBuild(config);
    if (this._open === null) this._open = this._config.switches.default_open !== false;
    this._built = false;
    this._disarm();
    this._render();
  }

  set hass(hass) {
    const prev = this._hass;
    this._hass = hass;
    if (!this._config) return;
    // Home Assistant sends every state change. Redraw only when an entity this card uses has changed.
    if (!prev || this._entityIds().some((id) => prev.states[id] !== hass.states[id])) {
      this._pushHistory(prev);
      this._render();
    }
  }

  getCardSize() {
    const h = Number(this._config?.background?.height) || 200;
    return Math.ceil(h / 50) + 1 + (this._config?.switches?.items?.length ? 1 : 0);
  }

  _slots() {
    const c = this._config;
    const withTap = (s, sectionTap) => ({ ...s, tap: s.tap || sectionTap || "more-info" });
    return [
      ...c.sensors.slice(0, HAAC_LIMITS.sensors).map((r, k) => ({ ...withTap(haacSlotFull(r, "sensor"), c.sensors_tap), cfgPath: `sensors/${k}` })),
      ...c.attributes.slice(0, HAAC_LIMITS.attributes).map((r, k) => ({ ...withTap(haacSlotFull(r, "attribute"), c.attributes_tap), cfgPath: `attributes/${k}` })),
      ...this._templates().map((t, k) => ({ ...t, kind: "template", tplIndex: k, cfgPath: `templates/${k}`, entity: t.tap_entity || "", tap: t.tap || "more-info" }))
    ];
  }

  _switchItems() {
    return (this._config.switches.items || []).slice(0, HAAC_LIMITS.items).map(haacSwitchFull);
  }

  _entityIds() {
    const ids = [];
    this._slots().forEach((s) => haacSlotEntities(s, ids));
    this._switchItems().forEach((it) => {
      if (it.entity) ids.push(it.entity);
      (it.visible?.conditions || []).forEach((c) => c?.entity && ids.push(c.entity));
      (it.rules || []).forEach((r) => (r.conditions || []).forEach((c) => c?.entity && ids.push(c.entity)));
    });
    this._pictures().forEach((p) => {
      if (p.entity) ids.push(p.entity);
      (p.visible?.conditions || []).forEach((c) => c?.entity && ids.push(c.entity));
    });
    this._buttonList().forEach((b) => haacSlotEntities(b, ids));
    this._histories().forEach((h) => {
      if (h.entity) ids.push(h.entity);
      (h.visible?.conditions || []).forEach((c) => c?.entity && ids.push(c.entity));
    });
    this._tables().forEach((t) => {
      this._tableRows(t).forEach((r) => ids.push(r.entity));
      (t.visible?.conditions || []).forEach((c) => c?.entity && ids.push(c.entity));
    });
    this._bars().forEach((b) => {
      [b.entity, b.start_entity, b.end_entity].forEach((id) => id && ids.push(id));
      (b.visible?.conditions || []).forEach((c) => c?.entity && ids.push(c.entity));
    });
    return ids;
  }

  _render() {
    if (!this._config || !this._hass) return;
    if (!this._built) this._build();
    this._patch();
    this._syncTemplates();
    this._syncHistory();
  }

  // Structure comes from the config only. It is rebuilt when the config changes.
  // Everything that depends on state is updated in place by _patch, so the picture
  // layers (and any GIFs in them) are never recreated between state updates.
  _build() {
    const c = this._config;
    const bg = c.background;
    const height = Math.max(60, Number(bg.height) || 200);
    const tint = Number(bg.tint_opacity) > 0
      ? `<div class="tint" style="${haacEsc(`background:${haacPaint(bg.tint, bg.tint_opacity)}`)}"></div>`
      : "";

    // Behind an image, the empty space (for example with Contain) shows the fill colour
    const fillLayer = bg.type === "image" && bg.image
      ? `<div class="bg-fill" style="${haacEsc(`background:${haacPaint(bg.fill ?? bg.color, haacFillOpacity(bg))}`)}"></div>`
      : "";

    const pictures = this._pictures().map((p, i) => {
      const tintLayer = Number(p.tint_opacity) > 0
        ? `<div class="tint" style="${haacEsc(`background:${haacPaint(p.tint, p.tint_opacity)}`)}"></div>`
        : "";
      const blend = p.blend && p.blend !== "normal" && HAAC_BLEND_MODES.some(([m]) => m === p.blend) ? `;mix-blend-mode:${p.blend}` : "";
      const imgCss = `${this._pictureImageCss(p)}transform:${haacPictureTransform(p)};filter:${haacPictureFilter(p)};`;
      return `<div class="pic" data-key="pic:${i}" style="${haacEsc(`opacity:${Number(p.opacity)};display:none${blend}`)}">` +
        `<div class="bgimg" style="${haacEsc(imgCss)}"></div>${tintLayer}</div>`;
    }).join("");

    const tableMarkup = this._tablesMarkup();
    const btns = this._buttonList().map((b, i) =>
      `<button type="button" class="btn-ov" data-key="btn:${i}" data-config="buttons/${i}" data-action="press" data-index="${i}" style="display:none"></button>`
    ).join("");
    const hist = this._histories().map((h, i) =>
      `<div class="hist${h.entity && h.tap !== "none" ? " tappable" : ""}" data-key="hist:${i}" data-config="history/${i}" data-action="tap" ` +
      `data-entity="${haacEsc(h.entity)}" data-tap="${haacEsc(h.tap || "more-info")}"></div>`
    ).join("");
    const bars = this._bars().map((b, i) =>
      `<div class="bar-ov${b.entity && b.tap !== "none" ? " tappable" : ""}" data-key="bar:${i}" data-config="bars/${i}" data-action="tap" ` +
      `data-entity="${haacEsc(b.entity)}" data-tap="${haacEsc(b.tap || "more-info")}"></div>`
    ).join("");
    const slots = this._slots().map((s, i) =>
      `<div class="slot" data-key="slot:${i}" data-config="${haacEsc(s.cfgPath)}" data-action="tap" ` +
      `data-entity="${haacEsc(s.entity)}" data-tap="${haacEsc(s.tap)}"></div>`
    ).join("");

    const sw = c.switches;
    const items = this._switchItems();
    const cols = Number(sw.columns) === 1 ? 1 : 2;
    const switches = items.length
      ? `<div class="sec" data-key="sec">
          <button class="sec-head" data-action="toggle-section">
            <span>${haacEsc(sw.title || "Controls")}</span>
            <span class="count" data-key="count"></span>
          </button>
          <div class="sw-list" data-key="list" style="${haacEsc(`grid-template-columns:repeat(${cols}, minmax(0, 1fr))`)}">
            ${items.map((it, i) =>
              `<button class="sw" data-key="sw:${i}" data-config="switches/${i}" data-action="tap" ` +
              `data-entity="${haacEsc(it.entity)}" data-tap="${haacEsc(it.tap || sw.tap || "toggle")}"></button>`
            ).join("")}
          </div>
        </div>`
      : "";

    this.shadowRoot.innerHTML = `
      <style>${HAAC_CARD_CSS}</style>
      <ha-card style="${haacEsc(haacCardBorderCss(bg.border))}">
        ${this._headerHtml()}
        <div class="picture" style="height:${height}px"><span class="measure"></span>
          ${fillLayer}
          <div class="bg" style="${haacEsc(haacBackgroundCss(bg))}"></div>
          ${tint}
          ${pictures}
          ${slots}
          ${hist}
          ${bars}
          ${tableMarkup}
          ${btns}
        </div>
        ${switches}
      </ha-card>`;
    this._built = true;
    this._observeTable();
  }

  // Updates everything that depends on state, in place
  _patch() {
    if (this._press && this._press.drag) return; // keep the dragged overlay where the pointer put it
    const hass = this._hass;
    const root = this.shadowRoot;

    this._pictures().forEach((p, i) => {
      const el = root.querySelector(`[data-key="pic:${i}"]`);
      if (el) el.style.display = p.image && haacPass(p.visible, hass, p.entity) ? "" : "none";
    });

    this._slots().forEach((s, i) => {
      const el = root.querySelector(`[data-key="slot:${i}"]`);
      if (!el) return;
      const d = this._slotData(s);
      if (!d) {
        el.style.display = "none";
        el.innerHTML = "";
        return;
      }
      el.className = `slot${d.flash ? " flash" : ""}${s.tap !== "none" ? " tappable" : ""}`;
      el.style.cssText = d.css;
      el.innerHTML = d.inner;
    });

    this._histories().forEach((h, i) => {
      const el = root.querySelector(`[data-key="hist:${i}"]`);
      if (!el) return;
      const d = this._historyData(h, i);
      if (!d) {
        el.style.display = "none";
        el.innerHTML = "";
        return;
      }
      el.style.cssText = d.css;
      el.innerHTML = d.inner;
    });

    this._bars().forEach((b, i) => {
      const el = root.querySelector(`[data-key="bar:${i}"]`);
      if (!el) return;
      const d = this._barData(b);
      if (!d) {
        el.style.display = "none";
        el.innerHTML = "";
        return;
      }
      el.style.cssText = d.css;
      el.innerHTML = d.inner;
    });

    this._patchTable(hass);
    this._patchButtons();

    let shown = 0;
    let on = 0;
    this._switchItems().forEach((it, i) => {
      const el = root.querySelector(`[data-key="sw:${i}"]`);
      if (!el) return;
      const visible = !!it.entity && haacPass(it.visible, hass, it.entity);
      el.style.display = visible ? "" : "none";
      if (!visible) return;
      shown++;
      const st = hass.states[it.entity];
      const isOn = this._isOn(it);
      if (isOn) on++;
      const pulse = el.classList.contains("pulse") ? " pulse" : "";
      const s = it.style || {};
      const rule = (it.rules || []).find((r) => Array.isArray(r.conditions) && r.conditions.length && haacPass(r, hass, it.entity));
      let fg = haacPaint(isOn ? it.on_color : it.off_color, haacAlpha(isOn ? it.on_color_opacity : it.off_color_opacity));
      let bgc = haacPaint(isOn ? it.on_bg : it.off_bg, haacAlpha(isOn ? it.on_bg_opacity : it.off_bg_opacity));
      if (rule) {
        if (rule.color) fg = haacPaint(rule.color, haacAlpha(rule.color_opacity));
        if (rule.bg) bgc = haacPaint(rule.bg, haacAlpha(rule.bg_opacity));
      }
      el.className = `sw${pulse}${rule && rule.flash ? " flash" : ""}`;
      const edge = Number(s.border_width) > 0 ? `border:${Number(s.border_width)}px solid ${haacPaint(s.border_color, haacAlpha(s.border_color_opacity))}` : "border:none";
      el.style.cssText = [
        `color:${fg}`,
        `background:${bgc}`,
        `font-size:${Number(s.size)}px`,
        `font-weight:${s.bold ? 500 : 400}`,
        `border-radius:${Number(s.radius)}px`,
        `padding:${Number(s.padding)}px ${Number(s.padding) * 1.5}px`,
        `opacity:${Number(s.opacity)}`,
        edge
      ].join(";");
      const label = it.label || haacEntityName(hass, it.entity, st) || it.entity;
      const stateText = st ? String(st.state) : "unavailable";
      const jt = ["left", "center", "right"].includes(it.justify) ? it.justify : "left";
      const iconHtml = it.show_icon !== false ? `<ha-icon icon="${haacEsc(it.icon || "mdi:toggle-switch-outline")}"></ha-icon>` : "";
      el.innerHTML = iconHtml +
        `<span class="lbl" style="text-align:${jt}">${haacEsc(label)}</span>` +
        (it.show_state !== false ? `<span class="st">${haacEsc(stateText)}</span>` : "");
    });

    const sec = root.querySelector('[data-key="sec"]');
    if (sec) sec.style.display = shown ? "" : "none";
    const count = root.querySelector('[data-key="count"]');
    if (count) {
      count.innerHTML = `${on} of ${shown} on <ha-icon icon="${this._open ? "mdi:chevron-up" : "mdi:chevron-down"}"></ha-icon>`;
    }
    const list = root.querySelector('[data-key="list"]');
    if (list) list.style.display = this._open ? "" : "none";
    const head = root.querySelector(".sec-head");
    if (head) head.setAttribute("aria-expanded", this._open ? "true" : "false");
  }

  _isOn(it) {
    const st = this._hass.states[it.entity];
    return !!st && HAAC_ON_WORDS.includes(String(st.state).toLowerCase());
  }

  _pictures() {
    return (this._config.pictures || []).slice(0, HAAC_LIMITS.pictures).map(haacPictureFull);
  }

  // Background image settings for one conditional picture, matching the main background options
  _pictureImageCss(p) {
    const url = String(p.image).replace(/["\\()]/g, (ch) => encodeURIComponent(ch));
    const size = p.fit === "stretch"
      ? "100% 100%"
      : p.fit === "custom"
        ? `${Number(p.scale) * 100}%`
        : p.fit || "contain";
    return `background-image:url("${url}");background-size:${size};` +
      `background-position:${Number(p.pos_x)}% ${Number(p.pos_y)}%;` +
      `background-repeat:${p.repeat || "no-repeat"};`;
  }

  _headerHtml() {
    const c = this._config;
    const h = c.header || {};
    if (h.show === false || (!c.name && !c.icon)) return "";
    const css = [
      `background:${h.bg_none ? "transparent" : haacPaint(h.bg, h.bg_opacity)}`,
      `color:${haacPaint(h.color, haacAlpha(h.color_opacity))}`,
      `font-size:${Number(h.size)}px`,
      `font-weight:${h.bold ? 600 : 400}`,
      `font-style:${h.italic ? "italic" : "normal"}`,
      `justify-content:${HAAC_JUSTIFY[h.align] || "flex-start"}`
    ].join(";");
    return `<div class="head" style="${haacEsc(css)}">` +
      `${c.icon ? `<ha-icon icon="${haacEsc(c.icon)}"></ha-icon>` : ""}` +
      `<span>${haacEsc(c.name)}</span></div>`;
  }

  // Offsets from the chosen anchor. Centre anchors use 50% and shift back by half the element's size.
  _placement(p) {
    const u = "%";
    const x = Number(p.x) || 0;
    const y = Number(p.y) || 0;
    const out = [];
    let tx = "0";
    let ty = "0";
    if (p.anchor_x === "center") {
      out.push(`left:calc(50% + ${x}${u})`);
      tx = "-50%";
    } else {
      out.push(`${p.anchor_x === "right" ? "right" : "left"}:${x}${u}`);
    }
    if (p.anchor_y === "center") {
      out.push(`top:calc(50% + ${y}${u})`);
      ty = "-50%";
    } else {
      out.push(`${p.anchor_y === "bottom" ? "bottom" : "top"}:${y}${u}`);
    }
    if (tx !== "0" || ty !== "0") out.push(`transform:translate(${tx}, ${ty})`);
    return out;
  }

  // Text, colours and flash state for one overlay. Returns null when the overlay is hidden.
  _slotData(s) {
    if (s.kind === "template") return this._templateData(s);
    if (s.enabled === false) return null;
    if (!s.entity && !String(s.label ?? "").trim()) return null;
    const hass = this._hass;
    if (!haacPass(s.visible, hass, s.entity)) return null;

    const info = haacSlotInfo(s, hass);
    let template = s.label;
    let color = haacPaint(s.style.color, haacAlpha(s.style.color_opacity));
    let bg = s.style.bg_none ? "transparent" : haacPaint(s.style.bg, s.style.bg_opacity);
    let flash = false;

    // Style rules first (first match wins), then warning limits
    const rule = (s.rules || []).find((r) => Array.isArray(r.conditions) && r.conditions.length && haacPass(r, hass, s.entity));
    if (rule) {
      if (rule.text) template = rule.text;
      if (rule.color) color = haacPaint(rule.color, haacAlpha(rule.color_opacity));
      if (rule.bg) bg = haacPaint(rule.bg, haacAlpha(rule.bg_opacity));
      flash = !!rule.flash;
    } else if (haacWarnHit(s.warn, info.num)) {
      color = haacPaint(s.warn.color, haacAlpha(s.warn.color_opacity));
      bg = haacPaint(s.warn.bg, haacAlpha(s.warn.bg_opacity));
      flash = !!s.warn.flash;
    }

    const text = haacFormatText(template, info);
    const icon = s.icon && s.show_icon !== false ? `<ha-icon icon="${haacEsc(s.icon)}"></ha-icon>` : "";
    if (!text.trim() && !icon) return null;

    const st = s.style;
    const css = [
      ...this._placement(s.pos),
      `justify-content:${HAAC_JUSTIFY[s.justify] || "flex-start"}`,
      Number(s.width) > 0 ? `width:${Number(s.width)}%;white-space:normal` : "",
      `font-size:${Number(st.size)}px`,
      `font-weight:${st.bold ? 500 : 400}`,
      `color:${color}`,
      `background:${bg}`,
      `opacity:${Number(st.opacity)}`,
      `border-radius:${Number(st.radius)}px`,
      `padding:${Number(st.padding)}px ${Number(st.padding) * 1.5}px`,
      Number(st.border_width) > 0 ? `border:${Number(st.border_width)}px solid ${haacPaint(st.border_color, haacAlpha(st.border_color_opacity))}` : "border:none"
    ].filter(Boolean).join(";");

    const jt = ["left", "center", "right"].includes(s.justify) ? s.justify : "left";
    return { css, flash, inner: `${icon}${text ? `<span style="text-align:${jt}">${text}</span>` : ""}` };
  }

  _onClick(ev) {
    const el = ev.target.closest ? ev.target.closest("[data-action]") : null;
    const pressed = el && el.dataset.action === "press" ? Number(el.dataset.index) : null;
    // Tapping anywhere other than the armed button cancels the armed state
    if (this._armed !== null && pressed !== this._armed) {
      this._disarm();
      this._patchButtons();
    }
    if (!el) return;
    if (el.dataset.action === "press") {
      // In the editor preview a button is for editing, so its action never runs there
      if (haacInEditorPreview(this)) return;
      this._pressButton(pressed);
    } else if (el.dataset.action === "toggle-section") {
      this._open = !this._open;
      this._render();
    } else if (el.dataset.action === "tap") {
      if (haacInEditorPreview(this)) return; // handled by the press code
      // Pulse the button directly. No redraw, so a state update can't cut the pulse short.
      if (el.classList.contains("sw")) el.classList.add("pulse");
      this._tap(el.dataset.entity, el.dataset.tap);
    }
  }

  // In the editor preview a short tap opens the matching item in the editor and a long press runs its tap action.
  _onPointerDown(ev) {
    if (ev.button > 0 || !haacInEditorPreview(this)) return;
    const el = ev.target.closest ? ev.target.closest(HAAC_GESTURE_SEL) : null;
    if (!el) return;
    this._markHinted(el.closest("[data-config]"));
    this._endPress();
    this.toggleAttribute("data-editor-preview", true);
    const cfg = el.closest("[data-config]");
    this._press = {
      el,
      path: cfg ? cfg.dataset.config : "",
      x: ev.clientX,
      y: ev.clientY,
      pointerId: ev.pointerId,
      moved: false,
      long: false,
      timer: setTimeout(() => this._longPress(), HAAC_LONG_PRESS_MS)
    };
  }

  _longPress() {
    const p = this._press;
    if (!p || p.moved) return;
    p.long = true;
    p.timer = null;
    if (p.el.dataset.action === "press") return; // buttons have no hold action in the preview
    this._tap(p.el.dataset.entity, p.el.dataset.tap);
  }

  _onPointerMove(ev) {
    const p = this._press;
    if (!p) return;
    if (p.drag) {
      this._dragTo(ev);
      return;
    }
    if (p.moved) return;
    if (Math.hypot(ev.clientX - p.x, ev.clientY - p.y) > HAAC_DRAG_PX) {
      p.moved = true;
      clearTimeout(p.timer);
      p.timer = null;
      if (!p.long) this._startDrag(p, ev);
    }
  }

  // Moves an overlay with the pointer. Switches and buttons have no position, so they can't be dragged.
  _startDrag(p, ev) {
    const cfgEl = p.el.closest("[data-config]");
    if (!cfgEl || !p.path) return;
    const start = this._posFor(p.path);
    const picture = this.shadowRoot.querySelector(".picture");
    const box = picture ? picture.getBoundingClientRect() : null;
    if (!start || !box || !box.width || !box.height) return;
    const r = cfgEl.getBoundingClientRect();
    p.drag = {
      el: cfgEl,
      start,
      pos: { ...start },
      ox: ev.clientX,
      oy: ev.clientY,
      box,
      w: (r.width / box.width) * 100,
      h: (r.height / box.height) * 100
    };
    try { p.el.setPointerCapture(p.pointerId); } catch (e) { /* capture is optional */ }
  }

  _dragTo(ev) {
    const d = this._press.drag;
    const dx = ((ev.clientX - d.ox) / d.box.width) * 100;
    const dy = ((ev.clientY - d.oy) / d.box.height) * 100;
    const a = d.start;
    const rawX = a.anchor_x === "right" ? a.x - dx : a.x + dx;
    const rawY = a.anchor_y === "bottom" ? a.y - dy : a.y + dy;
    d.pos = {
      anchor_x: a.anchor_x,
      anchor_y: a.anchor_y,
      x: haacFitPos(a.anchor_x, rawX, d.w),
      y: haacFitPos(a.anchor_y, rawY, d.h)
    };
    this._applyPlacement(d.el, d.pos);
  }

  // Sets the element's inline placement from a position, clearing the old one first
  _applyPlacement(el, pos) {
    ["left", "right", "top", "bottom", "transform"].forEach((k) => { el.style[k] = ""; });
    this._placement(pos).forEach((decl) => {
      const i = decl.indexOf(":");
      el.style[decl.slice(0, i)] = decl.slice(i + 1);
    });
  }

  // Position of one overlay as the card renders it, with the defaults filled in
  _posFor(cfgPath) {
    const [section, index] = cfgPath.split("/");
    const raw = (this._config[section] || [])[Number(index)] || {};
    const fullFor = {
      sensors: (r) => haacSlotFull(r, "sensor"),
      attributes: (r) => haacSlotFull(r, "attribute"),
      templates: (r) => haacTemplateFull(r),
      bars: (r) => haacBarFull(r),
      history: (r) => haacHistoryFull(r),
      tables: (r) => haacTableFull(r),
      buttons: (r) => haacButtonFull(r)
    }[section];
    if (!fullFor) return null;
    const pos = fullFor(raw).pos || {};
    return {
      anchor_x: pos.anchor_x || "left",
      anchor_y: pos.anchor_y || "top",
      x: Number(pos.x) || 0,
      y: Number(pos.y) || 0
    };
  }

  // Mouse hover shows a short native tooltip on overlays in the preview. Touch users get the help text in the editor menu.
  _onPointerOver(ev) {
    if (ev.pointerType !== "mouse" || !haacInEditorPreview(this)) return;
    const tap = ev.target.closest ? ev.target.closest(HAAC_GESTURE_SEL) : null;
    const cfgEl = tap ? tap.closest("[data-config]") : null;
    if (!cfgEl || this._hinted.has(cfgEl.dataset.config)) return;
    const cfg = cfgEl.dataset.config;
    cfgEl.title = cfg.startsWith("switches/") ? HAAC_HINT_SWITCH
      : cfg.startsWith("buttons/") ? HAAC_HINT_BUTTON
      : HAAC_HINT_OVERLAY;
  }

  // Once an overlay has been used, its hover hint is removed for the rest of the edit session
  _markHinted(cfgEl) {
    if (!cfgEl || !cfgEl.dataset.config) return;
    this._hinted.add(cfgEl.dataset.config);
    cfgEl.removeAttribute("title");
  }

  _onPointerUp() {
    const p = this._press;
    if (!p) return;
    if (p.drag) {
      // A finished drag saves once, on release, and never runs the tap action
      this._press = null;
      const { start, pos } = p.drag;
      if (pos.x !== start.x || pos.y !== start.y) {
        window.dispatchEvent(new CustomEvent("haac-move", { detail: { path: p.path.split("/"), pos: { x: pos.x, y: pos.y } } }));
      }
      return;
    }
    this._endPress();
    if (p.long || p.moved || !p.path) return;
    window.dispatchEvent(new CustomEvent("haac-navigate", { detail: { path: p.path.split("/") } }));
  }

  _endPress() {
    const p = this._press;
    if (p) {
      clearTimeout(p.timer);
      if (p.drag) this._applyPlacement(p.drag.el, p.drag.start);
    }
    this._press = null;
  }

  _tap(entity, mode) {
    if (!entity || mode === "none") return;
    if (mode === "toggle" && haacSwitchable(entity)) {
      this._hass.callService("homeassistant", "toggle", { entity_id: entity });
      return;
    }
    this.dispatchEvent(new CustomEvent("hass-more-info", {
      bubbles: true,
      composed: true,
      detail: { entityId: entity }
    }));
  }
}

const HAAC_CARD_CSS = `
:host { display: block; }
ha-card { overflow: hidden; }
:host([data-editor-preview]) [data-action="tap"], :host([data-editor-preview]) [data-action="press"] { -webkit-touch-callout: none; user-select: none; touch-action: none; }
.hist { position: absolute; overflow: hidden; box-sizing: border-box; }
.hist.tappable { cursor: pointer; }
.hist svg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.hlabel { position: absolute; right: 6px; top: 4px; white-space: nowrap; font-weight: 500; pointer-events: none; }
.hlabel ha-icon { --mdc-icon-size: 1.1em; vertical-align: middle; margin-right: 4px; }
.bar-ov { position: absolute; box-sizing: border-box; }
.bar-ov.tappable { cursor: pointer; }
.bcol { display: flex; flex-direction: column; justify-content: center; box-sizing: border-box; width: 100%; height: 100%; }
.brow { display: flex; flex: 1; min-height: 0; }
.btrack { position: relative; box-sizing: border-box; flex: none; }
.bfill { position: absolute; top: 0; bottom: 0; }
.bfill.v { top: auto; left: 0; right: 0; }
.bmark { position: absolute; top: -3px; bottom: -3px; width: 1px; background: rgba(255, 255, 255, 0.6); }
.bmark.v { top: auto; bottom: auto; left: -3px; right: -3px; width: auto; height: 1px; }
.bzero { position: absolute; top: -3px; bottom: -3px; }
.bzero.v { top: auto; bottom: auto; left: -3px; right: -3px; }
.bscale { position: relative; width: 100%; flex: none; }
.bscale.v { width: 48px; height: 100%; }
.blab { position: absolute; white-space: nowrap; line-height: 1; }
.bval { white-space: nowrap; line-height: 1.2; text-align: center; }
.btitle { white-space: nowrap; line-height: 1.2; text-align: center; }
.measure { position: fixed; top: 0; left: 0; visibility: hidden; pointer-events: none; white-space: nowrap; }
.tbl-ov { position: absolute; box-sizing: border-box; }
.tbl-wrap { overflow: hidden; border-radius: 6px; }
.tbl-ov table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.tbl-ov th, .tbl-ov td { padding: 2px 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: center; vertical-align: middle; line-height: 1.1; }
.tbl-ov .cw { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tbl-ov .cw.wrap { white-space: normal; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
.tbl-ov th { font-weight: 600; border-bottom: var(--tbl-cell, none); }
.tbl-ov td:not(:last-child), .tbl-ov th:not(:last-child) { border-right: var(--tbl-cell, none); }
.tbl-ov tbody td { border-bottom: var(--tbl-cell, none); }
.tbl-ov tbody tr { cursor: pointer; }
.tbl-ov tr.zebra td { background: var(--tbl-zebra, rgba(255, 255, 255, 0.1)); }
.tbl-ov table.no-upd th:nth-child(3), .tbl-ov table.no-upd td:nth-child(3) { display: none; }
.bval.in { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); }
.hbody { position: absolute; left: 0; right: 0; top: 0; bottom: 0; }
.haxis { position: absolute; left: 0; right: 0; bottom: 0; height: 14px; line-height: 14px; opacity: 0.9; }
.tick { position: absolute; top: 0; transform: translateX(-50%); white-space: nowrap; }
.tick b { font-weight: 600; }
.segs { position: absolute; inset: 0; pointer-events: none; }
.seg { position: absolute; top: 50%; transform: translateY(-50%); text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 0 2px; box-sizing: border-box; font-weight: 600; text-shadow: 0 0 3px rgba(0, 0, 0, 0.9); }
.head { display: flex; align-items: center; gap: 8px; padding: 12px 16px 8px; font-size: 16px; font-weight: 500; color: var(--primary-text-color); }
.picture { position: relative; width: 100%; overflow: hidden; }
.bg, .tint, .bg-fill { position: absolute; inset: 0; pointer-events: none; }
.pic, .bgimg { position: absolute; inset: 0; pointer-events: none; }
.slot { position: absolute; display: flex; align-items: center; gap: 4px; white-space: nowrap; box-sizing: border-box; line-height: 1.2; max-width: 100%; }
.slot.tappable { cursor: pointer; }
.slot ha-icon { --mdc-icon-size: 1.1em; vertical-align: middle; margin-right: 4px; }
.flash { animation: haacBlink 1s ease-in-out infinite; }
@keyframes haacBlink { 50% { opacity: 0.2; } }
.btn-ov { position: absolute; display: flex; align-items: center; justify-content: center; box-sizing: border-box; min-width: 44px; min-height: 44px; max-width: 100%; border: 0; font: inherit; line-height: 1.2; white-space: normal; text-align: center; cursor: pointer; user-select: none; -webkit-tap-highlight-color: transparent; }
.btn-in { display: flex; align-items: center; gap: 4px; }
.btn-ov .lbl { display: block; text-align: center; }
.btn-ov ha-icon { --mdc-icon-size: 1.1em; }
.btn-ov:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 2px; }
.btn-ov.fx-pulse .btn-in { animation: haacBtnPulse 450ms ease-out 1; }
.btn-ov.fx-blink .btn-in { animation: haacBtnBlink 300ms ease-in-out 3; }
.btn-ov.fx-flip .btn-in { animation: haacBtnFlip 600ms ease-in-out 1; }
.btn-ov.fx-spin .btn-in { animation: haacBtnSpin 600ms linear 1; }
.btn-ov.fx-shake .btn-in { animation: haacBtnShake 400ms ease-in-out 1; }
.btn-ov.fx-bounce .btn-in { animation: haacBtnBounce 500ms ease-out 1; }
.btn-ov.fx-ripple { animation: haacBtnRipple 600ms ease-out 1; }
.btn-ov.fx-glow { animation: haacBtnGlow 700ms ease-in-out 1; }
.btn-ov.fx-reduced .btn-in { animation: haacBtnFlash 450ms ease-out 1; }
@keyframes haacBtnPulse { 0% { transform: scale(1); filter: brightness(1); } 35% { transform: scale(1.08); filter: brightness(1.35); } 100% { transform: scale(1); filter: brightness(1); } }
@keyframes haacBtnBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.15; } }
@keyframes haacBtnFlip { from { transform: perspective(300px) rotateY(0deg); } to { transform: perspective(300px) rotateY(360deg); } }
@keyframes haacBtnSpin { to { transform: rotate(360deg); } }
@keyframes haacBtnShake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-4px); } 40% { transform: translateX(4px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); } }
@keyframes haacBtnBounce { 0%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } 55% { transform: translateY(0); } 75% { transform: translateY(-2px); } }
@keyframes haacBtnRipple { from { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.6); } to { box-shadow: 0 0 0 14px rgba(255, 255, 255, 0); } }
@keyframes haacBtnGlow { 50% { box-shadow: 0 0 14px 4px rgba(255, 255, 255, 0.7); } }
@keyframes haacBtnFlash { 50% { filter: brightness(1.4); } }
.sec { border-top: 1px solid var(--divider-color); }
.sec-head { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: none; border: 0; color: var(--primary-text-color); font: inherit; cursor: pointer; text-align: left; }
.count { display: flex; align-items: center; gap: 4px; font-size: 13px; color: var(--secondary-text-color); }
.sw-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; padding: 0 16px 16px; }
.sw { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border: 0; border-radius: 12px; font: inherit; font-size: 14px; cursor: pointer; text-align: left; }
.sw .lbl { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sw .st { font-size: 12px; opacity: 0.85; }
.sw.pulse { animation: haacPulse ${HAAC_PULSE_MS}ms ease-out 1; }
@keyframes haacPulse {
  0% { transform: scale(1); filter: brightness(1); }
  35% { transform: scale(1.06); filter: brightness(1.35); }
  100% { transform: scale(1); filter: brightness(1); }
}
`;

// =====================================================================
// Editor
// =====================================================================

const HAAC_EDITOR_CSS = `
:host { display: block; color: var(--primary-text-color); font-family: inherit; }
details { border: 1px solid var(--divider-color); border-radius: 8px; margin: 8px 0; padding: 0 12px; }
summary { cursor: pointer; padding: 10px 0; font-weight: 500; }
.body { padding-bottom: 12px; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 8px; margin: 6px 0; }
.f { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--secondary-text-color); min-width: 0; }
.cb { display: flex; align-items: center; gap: 6px; font-size: 13px; align-self: end; }
input, select { font: inherit; font-size: 14px; padding: 6px; border: 1px solid var(--divider-color); border-radius: 6px; background: transparent; color: var(--primary-text-color); box-sizing: border-box; width: 100%; min-width: 0; }
input[type="checkbox"] { width: auto; }
input[type="color"] { height: 34px; padding: 2px; }
button { font: inherit; font-size: 13px; padding: 6px 10px; margin: 4px 4px 4px 0; border-radius: 6px; border: 1px solid var(--divider-color); background: transparent; color: var(--primary-text-color); cursor: pointer; }
button:disabled { opacity: 0.4; cursor: default; }
button.danger { color: var(--error-color, #db4437); }
.row { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.item { border: 1px dashed var(--divider-color); border-radius: 8px; padding: 8px 10px; margin: 8px 0; }
.item summary { font-size: 13px; font-weight: 500; padding: 8px 0; }
.sum-sub { font-weight: 400; color: var(--secondary-text-color); margin-left: 6px; }
.item-body { padding-bottom: 6px; }
.sub { font-size: 12px; font-weight: 500; color: var(--secondary-text-color); margin: 10px 0 2px; }
.cond { border-left: 2px solid var(--divider-color); padding-left: 8px; margin: 6px 0; }
.hint { font-size: 12px; color: var(--secondary-text-color); margin: 4px 0 8px; }
ha-entity-picker { display: block; width: 100%; }
select { background-color: var(--card-background-color, #1c1c1c); }
select option { background-color: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #ffffff); }
.bar { display: flex; align-items: center; gap: 8px; padding: 4px 0 10px; margin-bottom: 8px; border-bottom: 1px solid var(--divider-color); }
.bar button { margin: 0; }
.crumbs { font-weight: 500; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.menu { display: flex; flex-direction: column; gap: 6px; }
.menu-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; margin: 0; padding: 12px; font-size: 15px; text-align: left; border-radius: 8px; }
.menu-row > span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.mcount { font-size: 13px; color: var(--secondary-text-color); white-space: nowrap; }
.colour { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.opw { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--secondary-text-color); }
.opw input { width: 70px; }
.colour input[type="color"] { width: 48px; flex: none; }
button.mini { font-size: 12px; padding: 4px 8px; margin: 0; }
.cstate { font-size: 12px; color: var(--secondary-text-color); }
.f.wide { grid-column: 1 / -1; }
textarea { font: inherit; font-family: monospace; font-size: 13px; padding: 6px; border: 1px solid var(--divider-color); border-radius: 6px; background: transparent; color: var(--primary-text-color); box-sizing: border-box; width: 100%; }
.preview { font-size: 13px; padding: 6px 8px; border-radius: 6px; background: rgba(128, 128, 128, 0.12); margin: 4px 0 8px; overflow-wrap: anywhere; }
.plabel { color: var(--secondary-text-color); margin-right: 6px; }
`;

// Config path where each list section keeps its items
const HAAC_ENTRY_NAMES = { visible: "Condition", rules: "Rule", states: "State colour" };

const HAAC_LIST_BASE = { sensors: "sensors", attributes: "attributes", pictures: "pictures", switches: "switches.items", templates: "templates", buttons: "buttons", history: "history", bars: "bars", tables: "tables" };

class HaApplianceCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._lastEmitted = null;
    this._groups = []; // groups found while building the current page
    this._path = []; // [] = menu, [section] = list page, [section, index] = one item
    this._previewSubs = [];
    this._previewResults = {};
    this._previewSig = "";
    const root = this.shadowRoot;
    root.addEventListener("click", (ev) => this._onClick(ev));
    root.addEventListener("change", (ev) => this._onChange(ev));
    root.addEventListener("input", (ev) => this._onInput(ev));
  }

  connectedCallback() {
    this._onPreviewTap = (ev) => this._navigateFromPreview(ev.detail && ev.detail.path);
    window.addEventListener("haac-navigate", this._onPreviewTap);
    this._onPreviewMove = (ev) => this._moveFromPreview(ev.detail && ev.detail.path, ev.detail && ev.detail.pos);
    window.addEventListener("haac-move", this._onPreviewMove);
  }

  disconnectedCallback() {
    window.removeEventListener("haac-navigate", this._onPreviewTap);
    window.removeEventListener("haac-move", this._onPreviewMove);
    this._unsubPreview();
  }

  // A drag in the preview saves the new offsets to the item's position
  _moveFromPreview(path, pos) {
    if (!this._config || !Array.isArray(path) || path.length < 2 || !pos) return;
    const base = HAAC_LIST_BASE[path[0]];
    if (!base) return;
    const at = `${base}.${path[1]}.pos`;
    let next = haacSetPath(this._config, `${at}.x`, pos.x);
    next = haacSetPath(next, `${at}.y`, pos.y);
    this._emit(next);
    this._render();
  }

  // A short tap on an item in the preview opens that item in the editor
  _navigateFromPreview(path) {
    if (!this._config || !Array.isArray(path) || !path.length) return;
    this._navigate(path);
  }

  _positionHtml(base, p) {
    return `<div class="grid">
        ${this._select("Anchor horizontal", `${base}.pos.anchor_x`, [["left", "Left"], ["right", "Right"], ["center", "Centre"]], p.anchor_x)}
        ${this._text("Horizontal offset (% of picture)", `${base}.pos.x`, p.x, "number")}
        ${this._select("Anchor vertical", `${base}.pos.anchor_y`, [["top", "Top"], ["bottom", "Bottom"], ["center", "Centre"]], p.anchor_y)}
        ${this._text("Vertical offset (% of picture)", `${base}.pos.y`, p.y, "number")}
      </div>`;
  }

  // Text justify and width, shared by every element that shows text on the picture
  _layoutFields(base, o, def = "left") {
    return this._select("Justify", `${base}.justify`, [["left", "Left"], ["center", "Centre"], ["right", "Right"]], o.justify || def) +
      this._text("Width (% of card width, blank = fit text)", `${base}.width`, o.width, "number");
  }

  _styleHtml(base, st) {
    return `<div class="grid">
        ${this._text("Text size (px)", `${base}.style.size`, st.size, "number")}
        ${this._check("Bold", `${base}.style.bold`, !!st.bold)}
        ${this._color("Text colour", `${base}.style.color`, st.color, "#ffffff", `${base}.style.color_opacity`)}
        ${this._color("Background colour", `${base}.style.bg`, st.bg, "#000000")}
        ${this._text("Background opacity (0 to 1)", `${base}.style.bg_opacity`, st.bg_opacity, "number", 'step="0.05" min="0" max="1"')}
        ${this._check("No background", `${base}.style.bg_none`, !!st.bg_none)}
        ${this._text("Element opacity (0 to 1)", `${base}.style.opacity`, st.opacity, "number", 'step="0.05" min="0" max="1"')}
        ${this._text("Corner radius (px)", `${base}.style.radius`, st.radius, "number")}
        ${this._text("Padding (px)", `${base}.style.padding`, st.padding, "number")}
        ${this._text("Border width (px)", `${base}.style.border_width`, st.border_width, "number")}
        ${this._color("Border colour", `${base}.style.border_color`, st.border_color, "#ffffff", `${base}.style.border_color_opacity`)}
      </div>`;
  }

  _warnHtml(base, w) {
    return `<div class="grid">
        ${this._text("Warn below", `${base}.warn.below`, w.below, "number")}
        ${this._text("Warn above", `${base}.warn.above`, w.above, "number")}
        ${this._color("Warning text colour", `${base}.warn.color`, w.color, "#ffffff", `${base}.warn.color_opacity`)}
        ${this._color("Warning background", `${base}.warn.bg`, w.bg, "#dc2626", `${base}.warn.bg_opacity`)}
        ${this._check("Flash while in warning", `${base}.warn.flash`, !!w.flash)}
      </div>`;
  }

  _textarea(label, path, value, hint = "") {
    return `<label class="f wide"><span>${haacEsc(label)}</span>` +
      `<textarea rows="3" data-path="${path}">${haacEsc(value ?? "")}</textarea>` +
      `${hint ? `<span class="hint">${haacEsc(hint)}</span>` : ""}</label>`;
  }

  _templateEditor(base, index) {
    const t = haacTemplateFull(haacGet(this._config, base) || {});
    const moves = `<div class="row">
        <button data-action="move-item" data-base="templates" data-index="${index}" data-dir="-1">Move up</button>
        <button data-action="move-item" data-base="templates" data-index="${index}" data-dir="1">Move down</button>
        <button class="danger" data-action="remove-item" data-base="templates" data-index="${index}">Remove</button>
      </div>`;
    const preview = (key, label, value) => {
      const idle = String(value ?? "").trim() ? "…" : (key === "show" ? "Always shown" : "(empty)");
      return `<div class="preview"><span class="plabel">${label}</span><span data-preview="${key}">${idle}</span></div>`;
    };

    return `<div class="item"><div class="item-body">
      ${moves}
      <div class="hint">Templates have no warning limits.</div>
      <div class="grid">
        ${this._check("Show element", `${base}.enabled`, t.enabled !== false)}
        ${this._icon("Icon", `${base}.icon`, t.icon)}
        ${this._check("Show icon", `${base}.show_icon`, t.show_icon !== false)}
        ${this._text("Width (% of card width, blank = fit text)", `${base}.width`, t.width, "number")}
        ${this._select("Justify", `${base}.justify`, [["left", "Left"], ["center", "Centre"], ["right", "Right"]], t.justify)}
        ${this._select("Tap action", `${base}.tap`, [["", "Section default"], ...HAAC_TAP_OPTIONS], t.tap)}
        ${this._entityField("Tap entity (opened by tap)", `${base}.tap_entity`, t.tap_entity)}
      </div>
      <div class="grid">
        ${this._textarea("Template (Jinja)", `${base}.template`, t.template, "The text shown on the picture. Use {{ ... }} for values and {% ... %} for logic.")}
      </div>
      ${preview("text", "Result", t.template)}
      <div class="grid">
        ${this._textarea("Show when (Jinja, optional)", `${base}.show_when`, t.show_when, "Shown when this gives true, on, yes or any text other than false, off, no, 0 or none.")}
      </div>
      ${preview("show", "Shows", t.show_when)}
      <div class="grid">
        ${this._text("Also watch these entities (comma separated, optional)", `${base}.watch`, t.watch)}
      </div>
      ${this._group(`${base}.position`, "Position", this._positionHtml(base, t.pos))}
      ${this._group(`${base}.style`, "Style", this._styleHtml(base, t.style))}
      ${this._group(`${base}.visible`, "Show when (state conditions)", this._conditionsMenu(`${base}.visible`, t.visible))}
      ${this._group(`${base}.rules`, `Style rules (up to ${HAAC_LIMITS.rules}, first match wins)`, this._rulesMenu(`${base}.rules`, t.rules))}
    </div></div>`;
  }

  // Keeps a live preview of the open template's result and show-when test
  _syncPreview() {
    const conn = this._hass?.connection;
    const [section, index] = this._path;
    let t = section === "templates" && index !== undefined ? haacGet(this._config, `templates.${index}`) : null;
    if (t && this._draft && this._draft.index === Number(index)) t = { ...t, [this._draft.field]: this._draft.value };
    const wanted = t && conn
      ? { template: String(t.template || ""), show: String(t.show_when || ""), watch: haacTemplateWatch(t, this._hass) }
      : null;
    const sig = wanted ? JSON.stringify(wanted) : "";
    if (sig === this._previewSig) return;
    this._previewSig = sig;
    this._unsubPreview();
    if (!wanted) return;
    this._setPlaceholder("text", wanted.template.trim() ? "…" : "(empty)");
    this._setPlaceholder("show", wanted.show.trim() ? "…" : "Always shown");
    if (wanted.template.trim()) {
      this._previewSubs.push(haacRenderTemplate(conn, wanted.template, wanted.watch, (r) => this._setPreview("text", r)));
    }
    if (wanted.show.trim()) {
      this._previewSubs.push(haacRenderTemplate(conn, wanted.show, wanted.watch, (r) => this._setPreview("show", r)));
    }
  }

  // Preview follows every keystroke in the template fields. The draft is not saved until the field loses focus.
  _onInput(ev) {
    const t = ev.target;
    if (!t || t.tagName !== "TEXTAREA" || !t.dataset.path) return;
    const m = /^templates\.(\d+)\.(template|show_when)$/.exec(t.dataset.path);
    if (!m) return;
    this._draft = { index: Number(m[1]), field: m[2], value: t.value };
    this._syncPreview();
  }

  _unsubPreview() {
    this._previewSubs.forEach((u) => u());
    this._previewSubs = [];
    this._previewResults = {};
  }

  _setPlaceholder(key, text) {
    const el = this.shadowRoot.querySelector(`[data-preview="${key}"]`);
    if (el) el.innerHTML = text;
  }

  _setPreview(key, r) {
    this._previewResults[key] = r;
    this._paintPreview();
  }

  _paintPreview() {
    Object.entries(this._previewResults).forEach(([key, r]) => {
      const el = this.shadowRoot.querySelector(`[data-preview="${key}"]`);
      if (el) el.innerHTML = this._previewHtml(key, r);
    });
  }

  _previewHtml(key, r) {
    if (r.error) return `<em>Error: ${haacEsc(r.error)}</em>`;
    const text = haacEsc(r.text ?? "").replace(/\n/g, "<br>");
    if (key === "show") return `<strong>${haacTruthy(r) ? "Shown" : "Hidden"}</strong> (${text || "empty"})`;
    return text === "" ? "<em>(empty)</em>" : text;
  }

  setConfig(config) {
    this._config = haacBuild(config);
    // Our own emitted config comes back from Home Assistant. Skip the redraw so focus is kept.
    if (JSON.stringify(config) === this._lastEmitted) return;
    this._render();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first && this._config) this._render();
    this._applyScheme();
    this.shadowRoot.querySelectorAll("ha-entity-picker").forEach((el) => {
      el.hass = hass;
    });
  }

  // ---- state helpers -------------------------------------------------

  _emit(next) {
    this._config = next;
    const out = haacEmitConfig(next);
    this._lastEmitted = JSON.stringify(out);
    this.dispatchEvent(new CustomEvent("config-changed", {
      bubbles: true,
      composed: true,
      detail: { config: out }
    }));
  }

  _listFor(base) {
    const arr = haacGet(this._config, base);
    return Array.isArray(arr) ? [...arr] : [];
  }

  _commitList(base, list) {
    this._emit(haacSetPath(this._config, base, list));
    this._render();
  }

  // ---- rendering -----------------------------------------------------

  _render() {
    if (!this._config) return;
    this.shadowRoot.innerHTML = `<style>${HAAC_EDITOR_CSS}</style>${this._pageHtml()}`;
    this._hydrate();
    this._applyScheme();
    this._syncPreview();
    this._paintPreview();
  }

  // Native controls (select popups, date inputs) use this to pick dark or light colours
  _applyScheme() {
    this.style.colorScheme = this._hass?.themes?.darkMode ? "dark" : "light";
  }

  _generalHtml() {
    const c = this._config;
    // Alphabetical by name
    const typeOpts = Object.entries(HAAC_PRESETS).map(([k, p]) => [k, p.name])
      .sort((a, b) => a[1].localeCompare(b[1]));
    return `<div class="grid">
        ${this._text("Name", "name", c.name)}
        ${this._icon("Icon", "icon", c.icon)}
        ${this._select("Appliance type", "appliance_type", typeOpts, c.appliance_type)}
      </div>
      ${c.header.show !== false ? `
        <div class="sub">Header</div>
        <div class="grid">
          ${this._check("Show header", "header.show", true)}
          ${this._check("No header background", "header.bg_none", !!c.header.bg_none)}
          ${this._color("Header background", "header.bg", c.header.bg, "#000000")}
          ${this._text("Header background opacity (0 to 1)", "header.bg_opacity", c.header.bg_opacity, "number", 'step="0.05" min="0" max="1"')}
          ${this._color("Header text colour", "header.color", c.header.color, "#ffffff", "header.color_opacity")}
          ${this._text("Font size (px)", "header.size", c.header.size, "number")}
          ${this._check("Bold", "header.bold", !!c.header.bold)}
          ${this._check("Italic", "header.italic", !!c.header.italic)}
          ${this._select("Title alignment", "header.align", [["left", "Left"], ["center", "Centre"], ["right", "Right"], ["spread", "Spread (icon left, name right)"]], c.header.align || "left")}
        </div>` : this._check("Show header", "header.show", false)}
      <div class="row"><button data-action="apply-preset">Apply suggestions for this type</button></div>
      <div class="hint">Suggestions fill blank icons and labels, and create empty sensor and switch slots with suggested names and conditions. They never change entities.</div>`;
  }

  _backgroundHtml() {
    const bg = this._config.background;
    const typeOpts = [["color", "Solid colour"], ["image", "Image"], ["gradient", "Gradient"]];
    let fields = "";

    if (bg.type === "color") {
      fields = `<div class="grid">
          ${this._color("Colour", "background.color", bg.color, "#1f2937")}
          ${this._text("Opacity (0 to 1)", "background.opacity", bg.opacity, "number", 'step="0.05" min="0" max="1"')}
        </div>`;
    } else if (bg.type === "gradient") {
      const stops = (bg.gradient_stops || []).map((s, i) => `<div class="grid">
          ${this._color("Stop colour", `background.gradient_stops.${i}.color`, s.color, "#ffffff", `background.gradient_stops.${i}.color_opacity`)}
          ${this._text("Position %", `background.gradient_stops.${i}.pos`, s.pos, "number")}
          <div class="row"><button class="danger" data-action="remove-item" data-base="background.gradient_stops" data-index="${i}">Remove stop</button></div>
        </div>`).join("");
      const n = (bg.gradient_stops || []).length;
      fields = `<div class="grid">
          ${this._select("Gradient type", "background.gradient_type", [["linear", "Linear"], ["radial", "Radial"]], bg.gradient_type)}
          ${bg.gradient_type !== "radial" ? this._text("Angle (degrees)", "background.gradient_angle", bg.gradient_angle, "number") : ""}
          ${this._text("Opacity (0 to 1)", "background.opacity", bg.opacity, "number", 'step="0.05" min="0" max="1"')}
        </div>
        <div class="sub">Colour stops</div>
        ${stops}
        <button data-action="add-item" data-base="background.gradient_stops" ${n < HAAC_LIMITS.gradient_stops ? "" : "disabled"}>+ Add stop</button>`;
    } else if (bg.type === "image") {
      fields = `<div class="grid">
          ${this._text("Image URL", "background.image", bg.image || "")}
          ${this._select("Fit", "background.fit", [["cover", "Cover"], ["contain", "Contain"], ["stretch", "Stretch"], ["custom", "Custom scale"]], bg.fit)}
          ${bg.fit === "custom" ? this._text("Scale", "background.scale", bg.scale, "number", 'step="0.05" min="0.1"') : ""}
          ${this._text("Horizontal position %", "background.pos_x", bg.pos_x, "number")}
          ${this._text("Vertical position %", "background.pos_y", bg.pos_y, "number")}
          ${bg.fit === "custom" ? this._select("Repeat", "background.repeat", [["no-repeat", "No repeat"], ["repeat", "Repeat"]], bg.repeat) : ""}
          ${this._text("Opacity (0 to 1)", "background.opacity", bg.opacity, "number", 'step="0.05" min="0" max="1"')}
        </div>
        <div class="sub">Tint</div>
        <div class="grid">
          ${this._color("Tint colour", "background.tint", bg.tint, "#000000")}
          ${this._text("Tint opacity (0 to 1)", "background.tint_opacity", bg.tint_opacity, "number", 'step="0.05" min="0" max="1"')}
        </div>
        <div class="sub">Empty space</div>
        <div class="grid">
          ${this._color("Fill colour", "background.fill", bg.fill ?? bg.color, "#000000")}
          ${this._text("Fill opacity (0 to 1)", "background.fill_opacity", haacFillOpacity(bg), "number", 'step="0.05" min="0" max="1"')}
        </div>
        <div class="hint">Shown behind the image where it doesn't cover the card, for example with Contain. Defaults to the background colour and opacity.</div>`;
    }

    return `<div class="grid">
        ${this._select("Type", "background.type", typeOpts, bg.type)}
        ${this._text("Picture height (px)", "background.height", bg.height, "number")}
      </div>
      ${fields}
      ${this._group("background.border", "Card border and shadow", this._borderHtml())}`;
  }

  _borderHtml() {
    const b = { ...haacDefaultBackground().border, ...(this._config.background.border || {}) };
    return `<div class="grid">
        ${this._text("Thickness (px, 0 = no border)", "background.border.width", b.width, "number")}
        ${this._select("Line style", "background.border.style", [["solid", "Solid"], ["dashed", "Dashed"], ["dotted", "Dotted"], ["double", "Double"], ["groove", "Groove"], ["ridge", "Ridge"], ["inset", "Inset"], ["outset", "Outset"]], b.style)}
        ${this._color("Border colour", "background.border.color", b.color, "#ffffff")}
        ${this._text("Border opacity (0 to 1)", "background.border.opacity", b.opacity, "number", 'step="0.05" min="0" max="1"')}
        ${this._text("Corner radius (px, blank = theme default)", "background.border.radius", b.radius, "number")}
        ${this._text("Glow / shadow blur (px, 0 = none)", "background.border.shadow_blur", b.shadow_blur, "number")}
        ${this._color("Glow / shadow colour", "background.border.shadow_color", b.shadow_color, "#000000", "background.border.shadow_color_opacity")}
      </div>`;
  }

  _picturesHtml() {
    const pics = this._config.pictures;
    return `<div class="hint">Pictures are layered in list order above the main background and below the sensors and attributes. Each one shows only while its conditions pass. Animated GIFs and transparent PNGs work well for effects such as steam.</div>
      ${this._rowsHtml("pictures")}
      <button data-action="add-item" data-base="pictures" ${pics.length < HAAC_LIMITS.pictures ? "" : "disabled"}>+ Add picture</button>`;
  }

  // Rotate, skew, scale factors and flips for one picture
  _pictureTransformHtml(b, p) {
    return `<div class="grid">
        ${this._text("Rotate (degrees)", `${b}.rotate`, p.rotate, "number", 'step="1"')}
        ${this._text("Skew X (degrees)", `${b}.skew_x`, p.skew_x, "number", 'step="1"')}
        ${this._text("Skew Y (degrees)", `${b}.skew_y`, p.skew_y, "number", 'step="1"')}
        ${this._text("Horizontal factor (1 = normal)", `${b}.scale_x`, p.scale_x, "number", 'step="0.05" min="0"')}
        ${this._text("Vertical factor (1 = normal)", `${b}.scale_y`, p.scale_y, "number", 'step="0.05" min="0"')}
        ${this._check("Flip horizontally", `${b}.flip_h`, !!p.flip_h)}
        ${this._check("Flip vertically", `${b}.flip_v`, !!p.flip_v)}
      </div>`;
  }

  // Blur, colour filters and blend mode for one picture
  _pictureEffectsHtml(b, p) {
    return `<div class="grid">
        ${this._text("Blur (px)", `${b}.blur`, p.blur, "number", 'step="0.5" min="0"')}
        ${this._text("Brightness %", `${b}.brightness`, p.brightness, "number", 'step="5" min="0"')}
        ${this._text("Contrast %", `${b}.contrast`, p.contrast, "number", 'step="5" min="0"')}
        ${this._text("Saturation %", `${b}.saturate`, p.saturate, "number", 'step="5" min="0"')}
        ${this._text("Hue rotate (degrees)", `${b}.hue_rotate`, p.hue_rotate, "number", 'step="5"')}
        ${this._text("Invert %", `${b}.invert`, p.invert, "number", 'step="5" min="0" max="100"')}
        ${this._text("Greyscale %", `${b}.grayscale`, p.grayscale, "number", 'step="5" min="0" max="100"')}
        ${this._select("Blend mode", `${b}.blend`, HAAC_BLEND_MODES, p.blend || "normal")}
      </div>`;
  }

  _pictureItemHtml(i, raw) {
    const p = haacPictureFull(raw);
    const b = `pictures.${i}`;
    const tint = `<div class="grid">
        ${this._color("Tint colour", `${b}.tint`, p.tint, "#000000")}
        ${this._text("Tint opacity (0 to 1)", `${b}.tint_opacity`, p.tint_opacity, "number", 'step="0.05" min="0" max="1"')}
      </div>`;
    return `<div class="item"><div class="item-body">
      <div class="row">
        <button data-action="move-item" data-base="pictures" data-index="${i}" data-dir="-1">Move up</button>
        <button data-action="move-item" data-base="pictures" data-index="${i}" data-dir="1">Move down</button>
        <button class="danger" data-action="remove-item" data-base="pictures" data-index="${i}">Remove</button>
      </div>
      <div class="grid">
        ${this._entityField("Entity (used by conditions with no entity)", `${b}.entity`, p.entity)}
      </div>
      <div class="grid">
        ${this._text("Image URL (GIF, PNG, SVG, WebP or JPG)", `${b}.image`, p.image || "")}
        ${this._select("Fit", `${b}.fit`, [["contain", "Contain"], ["cover", "Cover"], ["stretch", "Stretch"], ["custom", "Custom scale"]], p.fit)}
        ${p.fit === "custom" ? this._text("Scale (custom fit)", `${b}.scale`, p.scale, "number", 'step="0.05" min="0.1"') : ""}
        ${this._text("Horizontal position %", `${b}.pos_x`, p.pos_x, "number")}
        ${this._text("Vertical position %", `${b}.pos_y`, p.pos_y, "number")}
        ${p.fit === "custom" ? this._select("Repeat", `${b}.repeat`, [["no-repeat", "No repeat"], ["repeat", "Repeat"]], p.repeat) : ""}
        ${this._text("Picture opacity (0 to 1)", `${b}.opacity`, p.opacity, "number", 'step="0.05" min="0" max="1"')}
      </div>
      ${this._group(`${b}.transform`, "Transform", this._pictureTransformHtml(b, p))}
      ${this._group(`${b}.effects`, "Effects", this._pictureEffectsHtml(b, p))}
      ${this._group(`${b}.visible`, "Show when", this._conditionsMenu(`${b}.visible`, p.visible))}
      ${this._group(`${b}.tint`, "Tint", tint)}
    </div></div>`;
  }

  // One table's own page: its settings, rows, columns, colours, position and Show when
  _tableItemHtml(index) {
    const b = `tables.${index}`;
    const t = haacTableFull((this._config.tables || [])[index] || {});
    const moves = `<div class="row">
        <button data-action="move-item" data-base="tables" data-index="${index}" data-dir="-1">Move up</button>
        <button data-action="move-item" data-base="tables" data-index="${index}" data-dir="1">Move down</button>
        <button class="danger" data-action="remove-item" data-base="tables" data-index="${index}">Remove</button>
      </div>`;
    return `<div class="item"><div class="item-body">
      ${moves}
      <div class="grid">
        ${this._check("Show table", `${b}.enabled`, t.enabled !== false)}
        ${this._text("Width (% of picture width)", `${b}.width`, t.width, "number")}
        ${this._select("Row tap action", `${b}.tap`, HAAC_TAP_OPTIONS, t.tap)}
      </div>
      ${this._group(`${b}.rows`, `Rows (${t.rows.length} of ${HAAC_LIMITS.rows})`, this._tableRowsHtml(b, t))}
      ${this._group(`${b}.columns`, "Columns and text", this._tableColumnsHtml(b, t))}
      ${this._group(`${b}.colours`, "Colours and lines", this._tableColoursHtml(b, t))}
      ${this._group(`${b}.position`, "Position", this._positionHtml(b, t.pos))}
      ${this._group(`${b}.visible`, "Show when", this._conditionsMenu(`${b}.visible`, t.visible))}
    </div></div>`;
  }

  _tableRowsHtml(b, t) {
    const rows = t.rows.map((r, i) => `<div class="grid">
          <div class="row">
            <button data-action="move-item" data-base="${b}.rows" data-index="${i}" data-dir="-1">Move up</button>
            <button data-action="move-item" data-base="${b}.rows" data-index="${i}" data-dir="1">Move down</button>
            <button class="danger" data-action="remove-item" data-base="${b}.rows" data-index="${i}">Remove</button>
          </div>
          ${this._entityField("Entity", `${b}.rows.${i}.entity`, r.entity)}
          ${this._text("Label (blank = entity name)", `${b}.rows.${i}.label`, r.label)}
        </div>`).join("");
    return `${rows}<div class="row"><button data-action="add-item" data-base="${b}.rows" ${t.rows.length < HAAC_LIMITS.rows ? "" : "disabled"}>+ Add row</button></div>`;
  }

  _tableColumnsHtml(b, t) {
    const h = [0, 1, 2].map((i) => this._text(`Column ${i + 1} header`, `${b}.headers.${i}`, t.headers[i] ?? "")).join("");
    const w = [0, 1, 2].map((i) => this._text(`Column ${i + 1} width (%)`, `${b}.widths.${i}`, t.widths[i] ?? "", "number")).join("");
    return `<div class="grid">
        ${this._check("Show updated column", `${b}.updated`, t.updated !== false)}
        ${h}
        ${w}
        ${this._check("Monospace font", `${b}.mono`, !!t.mono)}
        ${this._check("Bold", `${b}.bold`, !!t.bold)}
        ${this._text("Maximum text size (px)", `${b}.size`, t.size, "number")}
        ${this._text("Minimum text size (px)", `${b}.size_min`, t.size_min, "number")}
        ${this._check("Shrink cell text that doesn't fit", `${b}.fit`, t.fit !== false)}
        ${this._check("Wrap cell text that still doesn't fit", `${b}.wrap`, !!t.wrap)}
        ${this._text("Maximum wrapped lines (2 or 3)", `${b}.wrap_lines`, t.wrap_lines, "number", 'min="2" max="3"')}
        ${this._check("Zebra stripes", `${b}.zebra`, t.zebra !== false)}
        ${this._text("Zebra stripe strength (0 to 1)", `${b}.zebra_opacity`, t.zebra_opacity, "number", 'step="0.05" min="0" max="1"')}
      </div>
      <div class="hint">Widths are relative: the visible columns share the table's width.</div>`;
  }

  _tableColoursHtml(b, t) {
    return `<div class="grid">
        ${this._color("Header colour", `${b}.head`, t.head, "#ffff00")}
        ${this._color("Text colour", `${b}.text`, t.text, "#ffffff")}
        ${this._color("Background", `${b}.bg`, t.bg, "#000000")}
        ${this._text("Background opacity (0 to 1)", `${b}.bg_opacity`, t.bg_opacity, "number", 'step="0.05" min="0" max="1"')}
        ${this._check("Outer table border", `${b}.border_show`, !!t.border_show)}
        ${this._color("Border colour", `${b}.border_color`, t.border_color, "#ffffff")}
        ${this._text("Border width (px)", `${b}.border_width`, t.border_width, "number")}
        ${this._check("Lines between cells", `${b}.cell_show`, t.cell_show !== false)}
        ${this._color("Cell line colour", `${b}.cell_color`, t.cell_color, "#ffffff")}
        ${this._text("Cell line width (px)", `${b}.cell_width`, t.cell_width, "number")}
        ${this._text("Cell line opacity (0 to 1)", `${b}.cell_opacity`, t.cell_opacity, "number", 'step="0.05" min="0" max="1"')}
      </div>`;
  }

  _switchesHtml() {
    const sw = this._config.switches;
    return `<div class="grid">
        ${this._text("Section title", "switches.title", sw.title || "")}
        ${this._check("Open by default", "switches.default_open", sw.default_open !== false)}
        ${this._select("Columns", "switches.columns", [["1", "1 column"], ["2", "2 columns"]], String(Number(sw.columns) === 1 ? 1 : 2))}
        ${this._select("Default tap action", "switches.tap", HAAC_TAP_OPTIONS, sw.tap || "toggle")}
      </div>
      ${this._rowsHtml("switches")}
      <button data-action="add-item" data-base="switches.items" ${sw.items.length < HAAC_LIMITS.items ? "" : "disabled"}>+ Add switch</button>`;
  }

  _switchItemHtml(i, raw) {
    const it = haacSwitchFull(raw);
    const b = `switches.items.${i}`;
    const colours = `<div class="grid">
        ${this._color("On text colour", `${b}.on_color`, it.on_color, "#ffffff", `${b}.on_color_opacity`)}
        ${this._color("On background", `${b}.on_bg`, it.on_bg, "#2563eb", `${b}.on_bg_opacity`)}
        ${this._color("Off text colour", `${b}.off_color`, it.off_color, "#9ca3af", `${b}.off_color_opacity`)}
        ${this._color("Off background", `${b}.off_bg`, it.off_bg, "#374151", `${b}.off_bg_opacity`)}
      </div>`;
    return `<div class="item"><div class="item-body">
      <div class="row">
        <button data-action="move-item" data-base="switches.items" data-index="${i}" data-dir="-1">Move up</button>
        <button data-action="move-item" data-base="switches.items" data-index="${i}" data-dir="1">Move down</button>
        <button class="danger" data-action="remove-item" data-base="switches.items" data-index="${i}">Remove</button>
      </div>
      <div class="grid">
        ${this._entityField("Entity", `${b}.entity`, it.entity)}
        ${this._text("Label (blank = friendly name)", `${b}.label`, it.label)}
        ${this._icon("Icon", `${b}.icon`, it.icon)}
        ${this._select("Tap action", `${b}.tap`, [["", "Section default"], ...HAAC_TAP_OPTIONS], it.tap)}
        ${this._check("Show state on button", `${b}.show_state`, it.show_state !== false)}
        ${this._check("Show icon", `${b}.show_icon`, it.show_icon !== false)}
        ${this._select("Justify", `${b}.justify`, [["left", "Left"], ["center", "Centre"], ["right", "Right"]], it.justify)}
      </div>
      <div class="hint">Switches sit in their own area, so they have no position, width or warning limits.</div>
      ${this._group(`${b}.colours`, "Colours", colours)}
      ${this._group(`${b}.style`, "Style", this._switchStyleHtml(b, it.style))}
      ${this._group(`${b}.rules`, `Style rules (up to ${HAAC_LIMITS.rules}, first match wins)`, this._rulesMenu(`${b}.rules`, it.rules))}
      ${this._group(`${b}.visible`, "Show when", this._conditionsMenu(`${b}.visible`, it.visible))}
    </div></div>`;
  }

  // Size, weight, corners, padding, border and opacity. Colours are per state, in the Colours group.
  _switchStyleHtml(b, st) {
    return `<div class="grid">
        ${this._text("Text size (px)", `${b}.style.size`, st.size, "number")}
        ${this._check("Bold", `${b}.style.bold`, !!st.bold)}
        ${this._text("Corner radius (px)", `${b}.style.radius`, st.radius, "number")}
        ${this._text("Padding (px)", `${b}.style.padding`, st.padding, "number")}
        ${this._text("Border width (px)", `${b}.style.border_width`, st.border_width, "number")}
        ${this._color("Border colour", `${b}.style.border_color`, st.border_color, "#ffffff", `${b}.style.border_color_opacity`)}
        ${this._text("Element opacity (0 to 1)", `${b}.style.opacity`, st.opacity, "number", 'step="0.05" min="0" max="1"')}
      </div>`;
  }

  _armedHtml(base, b) {
    return `<div class="grid">
        ${this._text("Confirm text (| starts a new line)", `${base}.arm_label`, b.arm_label)}
        ${this._color("Confirm background", `${base}.arm_bg`, b.arm_bg, "#dc2626")}
        ${this._color("Confirm text colour", `${base}.arm_color`, b.arm_color, "#ffffff")}
      </div>`;
  }

  // Full editor for one button on the picture
  _buttonEditor(base, index) {
    const b = haacButtonFull(haacGet(this._config, base) || {});
    const preset = haacButtonAction(b.action);
    const moves = `<div class="row">
        <button data-action="move-item" data-base="buttons" data-index="${index}" data-dir="-1">Move up</button>
        <button data-action="move-item" data-base="buttons" data-index="${index}" data-dir="1">Move down</button>
        <button class="danger" data-action="remove-item" data-base="buttons" data-index="${index}">Remove</button>
      </div>`;
    const dom = b.entity ? String(b.entity).split(".")[0] : "";
    let note;
    if (!preset.domains) note = "This action opens the entity's more-info dialog.";
    else {
      note = `This action works on ${preset.domains.join(", ")} entities.`;
      if (b.entity && !preset.domains.includes(dom)) note += " The chosen entity doesn't match, so the button won't run until you pick a matching one.";
    }

    return `<div class="item"><div class="item-body">
      ${moves}
      <div class="grid">
        ${this._check("Show button", `${base}.enabled`, b.enabled !== false)}
        ${this._select("Action", `${base}.action`, Object.entries(HAAC_BUTTON_ACTIONS).map(([k, v]) => [k, v.name]), b.action)}
        ${this._entityField("Entity", `${base}.entity`, b.entity, preset.domains)}
        ${this._text("Label (blank = entity name, | starts a new line)", `${base}.label`, b.label)}
        ${this._icon("Icon", `${base}.icon`, b.icon)}
        ${this._check("Show icon", `${base}.show_icon`, b.show_icon !== false)}
        ${this._select("Ask to confirm", `${base}.confirm`, HAAC_BUTTON_CONFIRM, b.confirm)}
        ${this._text("Text while running (optional, | starts a new line)", `${base}.on_label`, b.on_label)}
        ${this._check("Animate when pressed", `${base}.animate`, !!b.animate)}
        ${this._select("Animation", `${base}.anim_style`, HAAC_BUTTON_ANIMS, b.anim_style)}
        ${this._layoutFields(base, b, "center")}
      </div>
      <div class="hint">${haacEsc(note)} Buttons have no warning limits.</div>
      ${this._group(`${base}.position`, "Position", this._positionHtml(base, b.pos))}
      ${this._group(`${base}.style`, "Style", this._styleHtml(base, b.style))}
      ${this._group(`${base}.armed`, "Confirm look", this._armedHtml(base, b))}
      ${this._group(`${base}.visible`, "Show when (state conditions)", this._conditionsMenu(`${base}.visible`, b.visible))}
      ${this._group(`${base}.rules`, `Style rules (up to ${HAAC_LIMITS.rules}, first match wins)`, this._rulesMenu(`${base}.rules`, b.rules))}
    </div></div>`;
  }


  _listHtml(list) {
    const items = this._config[list];
    const max = HAAC_LIMITS[list];
    const names = { sensors: "sensor", attributes: "attribute", templates: "template", buttons: "button", history: "chart", bars: "bar", tables: "table" };
    const hint = list === "templates"
      ? `<div class="hint">Templates use Home Assistant Jinja, for example {{ states('sensor.solar_power') }} W. Each one shows as text on the picture.</div>`
      : list === "buttons"
        ? `<div class="hint">Buttons sit on the picture. Each one runs a Home Assistant action when tapped, and the list of entities is filtered to suit that action.</div>`
      : list === "history"
        ? `<div class="hint">Charts show an entity's recorded history over the chosen time range. Recorder keeps 10 days by default, so longer ranges need purge_keep_days raised in Home Assistant's recorder settings.</div>`
        : list === "bars"
          ? `<div class="hint">Bars show the live value of one entity between a start and an end, with an optional fill from zero. They show the current value only, with no history.</div>`
        : list === "tables"
          ? `<div class="hint">Each data table sits on the picture and lists its rows with their state and time since they last changed. Up to ${HAAC_LIMITS.rows} rows per table.</div>`
          : "";
    const tapPath = list === "sensors" ? "sensors_tap" : "attributes_tap";
    const tap = list === "templates" || list === "history" || list === "buttons" || list === "bars" || list === "tables"
      ? ""
      : `<div class="grid">${this._select("Default tap action", tapPath, HAAC_TAP_OPTIONS, this._config[tapPath] || "more-info")}</div>`;
    return `${hint}${tap}${this._rowsHtml(list)}
      <button data-action="add-item" data-base="${list}" ${items.length < max ? "" : "disabled"}>+ Add ${names[list]}</button>`;
  }

  // Full editor for one overlay element (sensor, attribute or title)
  _slotEditor(base, list, index) {
    const raw = haacGet(this._config, base) || {};
    const s = haacSlotFull(raw, list === "attributes" ? "attribute" : "sensor");
    const moves = `<div class="row">
        <button data-action="move-item" data-base="${list}" data-index="${index}" data-dir="-1">Move up</button>
        <button data-action="move-item" data-base="${list}" data-index="${index}" data-dir="1">Move down</button>
        <button class="danger" data-action="remove-item" data-base="${list}" data-index="${index}">Remove</button>
      </div>`;

    return `<div class="item"><div class="item-body">
      ${moves}
      <div class="grid">
        ${this._entityField("Entity", `${base}.entity`, s.entity)}
        ${this._check("Show element", `${base}.enabled`, s.enabled !== false)}
        ${this._select("Value source", `${base}.source`, [["state", "State"], ["attribute", "Attribute"]], s.source)}
        ${this._attrField(`${base}.attribute`, s.entity, s.attribute)}
        ${this._unitField(base, s)}
        ${this._text("Text ({v} value, {u} unit, {name}, | new line)", `${base}.label`, s.label)}
        ${this._icon("Icon", `${base}.icon`, s.icon)}
        ${this._check("Show icon", `${base}.show_icon`, s.show_icon !== false)}
        ${this._text("Decimals (blank = auto)", `${base}.decimals`, s.decimals, "number", 'min="0" max="6"')}
        ${this._layoutFields(base, s)}
        ${this._select("Tap action", `${base}.tap`, [["", "Section default"], ...HAAC_TAP_OPTIONS], s.tap)}
      </div>
      ${this._group(`${base}.position`, "Position", this._positionHtml(base, s.pos))}
      ${this._group(`${base}.style`, "Style", this._styleHtml(base, s.style))}
      ${this._group(`${base}.visible`, "Show when", this._conditionsMenu(`${base}.visible`, s.visible))}
      ${this._group(`${base}.warn`, "Warning limits (numbers only)", this._warnHtml(base, s.warn))}
      ${this._group(`${base}.rules`, `Style rules (up to ${HAAC_LIMITS.rules}, first match wins)`, this._rulesMenu(`${base}.rules`, s.rules))}
    </div></div>`;
  }

  // A group of conditions with its match mode. group path is base, conditions live at base.conditions.
  _conditionsBlock(base, group, fallback, title) {
    const conds = Array.isArray(group?.conditions) ? group.conditions : [];
    const rows = conds.map((c, i) => this._condRow(`${base}.conditions`, i, c, fallback)).join("");
    const match = conds.length > 1
      ? this._select("Match", `${base}.match`, [["all", "All conditions"], ["any", "Any condition"]], group.match || "all")
      : "";
    return `<div class="sub">${haacEsc(title)}</div>
      ${match}
      ${rows}
      <button data-action="add-item" data-base="${base}.conditions" ${conds.length < HAAC_LIMITS.conditions ? "" : "disabled"}>+ Add condition</button>`;
  }

  _condRow(listPath, i, c, fallback) {
    const p = `${listPath}.${i}`;
    const src = c.source || "state";
    const ent = c.entity || fallback;
    return `<div class="cond">
      <div class="grid">
        ${this._select("Source", `${p}.source`, [["state", "State"], ["attribute", "Attribute"]], src)}
        ${this._entityField("Entity (blank = this element)", `${p}.entity`, c.entity || "")}
        ${src === "attribute" ? this._attrField(`${p}.attribute`, ent, c.attribute || "") : ""}
        ${this._select("Operator", `${p}.op`, HAAC_OPERATORS, c.op || "eq")}
        ${c.op === "between"
          ? this._text("From", `${p}.value`, c.value ?? "", "number", 'step="any"') +
            this._text("To", `${p}.value2`, c.value2 ?? "", "number", 'step="any"')
          : this._text("Value", `${p}.value`, c.value ?? "")}
      </div>
      <div class="row"><button class="danger" data-action="remove-item" data-base="${listPath}" data-index="${i}">Remove condition</button></div>
    </div>`;
  }

  // Menu rows for the entries of a group. Each opens its own page.
  _entryRow(group, i, sub) {
    return `<button class="menu-row" data-action="open-entry" data-index="${i}">` +
      `<span>${haacEsc(`${HAAC_ENTRY_NAMES[group]} ${i + 1}`)}${sub ? ` <span class="sum-sub">${haacEsc(sub)}</span>` : ""}</span>` +
      `<span class="mcount">›</span></button>`;
  }

  // Show when group: match mode, one row per condition, and add
  _conditionsMenu(base, group) {
    const conds = Array.isArray(group?.conditions) ? group.conditions : [];
    const match = conds.length > 1
      ? this._select("Match", `${base}.match`, [["all", "All conditions"], ["any", "Any condition"]], group.match || "all")
      : "";
    const rows = conds.map((c, i) => this._entryRow("visible", i, c.entity || "This element")).join("");
    return `${match}${rows ? `<div class="menu">${rows}</div>` : ""}
      <button data-action="add-item" data-base="${base}.conditions" ${conds.length < HAAC_LIMITS.conditions ? "" : "disabled"}>+ Add condition</button>`;
  }

  // Style rules group: one row per rule, and add
  _rulesMenu(base, rules) {
    const list = Array.isArray(rules) ? rules : [];
    const rows = list.map((r, i) => this._entryRow("rules", i, r.text || "")).join("");
    return `${rows ? `<div class="menu">${rows}</div>` : ""}
      <button data-action="add-item" data-base="${base}" ${list.length < HAAC_LIMITS.rules ? "" : "disabled"}>+ Add rule</button>`;
  }

  // Contents of one rule's page. Its own conditions stay inline on that page.
  _ruleHtml(base, i, r, fallback, withText) {
    return `${this._conditionsBlock(`${base}.${i}`, r, fallback, "When (at least one condition)")}
        <div class="grid">
          ${withText ? this._text("Replace text with ({v} keeps value, blank = keep)", `${base}.${i}.text`, r.text || "") : ""}
          ${this._color("Text colour (Default = keep)", `${base}.${i}.color`, r.color || "", "", `${base}.${i}.color_opacity`)}
          ${this._color("Background colour (Default = keep)", `${base}.${i}.bg`, r.bg || "", "", `${base}.${i}.bg_opacity`)}
          ${this._check("Flash", `${base}.${i}.flash`, !!r.flash)}
        </div>
        <div class="row"><button class="danger" data-action="remove-item" data-base="${base}" data-index="${i}">Remove rule</button></div>`;
  }

  // ---- navigation ----------------------------------------------------
  // _path is [] for the menu, [section] for a list page, [section, index] for one item

  _navigate(path) {
    this._draft = null;
    this._path = path;
    this._render();
    this.scrollIntoView({ block: "start" });
  }

  _sectionMeta() {
    const c = this._config;
    return {
      general: { name: "Appliance" },
      background: { name: "Background" },
      pictures: { name: "Pictures", count: `${c.pictures.length} of ${HAAC_LIMITS.pictures}`, item: "Picture" },
      switches: { name: "Switches", count: `${c.switches.items.length} of ${HAAC_LIMITS.items}`, item: "Switch" },
      buttons: { name: "Buttons", count: `${c.buttons.length} of ${HAAC_LIMITS.buttons}`, item: "Button" },
      sensors: { name: "Sensors", count: `${c.sensors.length} of ${HAAC_LIMITS.sensors}`, item: "Sensor" },
      attributes: { name: "Attributes", count: `${c.attributes.length} of ${HAAC_LIMITS.attributes}`, item: "Attribute" },
      templates: { name: "Templates", count: `${c.templates.length} of ${HAAC_LIMITS.templates}`, item: "Template" },
      history: { name: "History", count: `${c.history.length} of ${HAAC_LIMITS.history}`, item: "Chart" },
      bars: { name: "Bars", count: `${c.bars.length} of ${HAAC_LIMITS.bars}`, item: "Bar" },
      tables: { name: "Data tables", count: `${c.tables.length} of ${HAAC_LIMITS.tables}`, item: "Table" }
    };
  }

  _sectionForBase(base) {
    return Object.keys(HAAC_LIST_BASE).find((k) => HAAC_LIST_BASE[k] === base) || null;
  }

  _pageHtml() {
    const r = this._resolvePath();
    if (!r) return this._menuHtml();
    const { section, index, group, entry, meta } = r;
    const parent = index === undefined ? [section] : [section, String(index)];
    const parentCrumbs = index === undefined ? meta.name : `${meta.name} › ${meta.item} ${index + 1}`;
    const back = (crumbs) => `<div class="bar"><button data-action="back">‹ Back</button><span class="crumbs">${haacEsc(crumbs)}</span></div>`;

    // Building the page registers its groups, so the page can list them
    this._groups = [];
    const content = index === undefined
      ? this._sectionPageHtml(section)
      : this._itemPageHtml(section, index);
    const groups = this._groups;

    const open = group !== undefined ? groups.find((g) => g.key === group) : null;
    if (open && entry !== undefined) {
      const crumbs = `${parentCrumbs} › ${open.title} › ${HAAC_ENTRY_NAMES[group]} ${entry + 1}`;
      return back(crumbs) + `<div class="item"><div class="item-body">${this._entryHtml(section, index, group, entry)}</div></div>`;
    }
    if (open) {
      return back(`${parentCrumbs} › ${open.title}`) + `<div class="item"><div class="item-body">${open.body}</div></div>`;
    }

    const rows = groups.map((g) =>
      `<button class="menu-row" data-action="open" data-path="${[...parent, g.key].join("/")}">` +
      `<span>${haacEsc(g.title)}</span><span class="mcount">›</span></button>`
    ).join("");
    const menu = rows ? `<div class="menu">${rows}</div>` : "";
    return back(parentCrumbs) + content + menu;
  }

  // [] = menu, [section] = list page, [section, index] = one item.
  // Then a group key: [section, index, group]. Then an entry: [section, index, group, entry].
  _resolvePath() {
    const [section, a, b, c] = this._path;
    const meta = this._sectionMeta()[section];
    if (!meta) return null;
    if (!HAAC_LIST_BASE[section]) return { section, index: undefined, group: a, entry: undefined, meta };
    const items = haacGet(this._config, HAAC_LIST_BASE[section]);
    // A stale index (for example after a removal) falls back to the list page
    const valid = a !== undefined && Array.isArray(items) && Number(a) < items.length;
    if (!valid) return { section, index: undefined, group: undefined, entry: undefined, meta };
    const listPath = this._entryListBase(section, Number(a), b);
    const list = listPath ? haacGet(this._config, listPath) : null;
    const entryOk = c !== undefined && Array.isArray(list) && Number(c) < list.length;
    return { section, index: Number(a), group: b, entry: entryOk ? Number(c) : undefined, meta };
  }

  // The list behind a group that holds entries, or null
  _entryListBase(section, index, group) {
    const list = HAAC_LIST_BASE[section];
    if (!list || index === undefined) return null;
    const item = `${list}.${index}`;
    if (group === "visible") return `${item}.visible.conditions`;
    if (group === "rules") return `${item}.rules`;
    if (group === "states") return `${item}.states`;
    return null;
  }

  // The list an open entry page belongs to, and the entry's index
  _openEntry() {
    const [section, index, group, entry] = this._path;
    if (entry === undefined || index === undefined) return null;
    const base = this._entryListBase(section, Number(index), group);
    return base ? { base, index: Number(entry) } : null;
  }

  _entryHtml(section, index, group, entry) {
    const listPath = this._entryListBase(section, index, group);
    const item = haacGet(this._config, `${HAAC_LIST_BASE[section]}.${index}`) || {};
    const fallback = item.entity || item.tap_entity || "";
    const e = (haacGet(this._config, listPath) || [])[entry] || {};
    if (group === "visible") return this._condRow(listPath, entry, e, fallback);
    if (group === "rules") return this._ruleHtml(listPath, entry, e, fallback, section === "sensors" || section === "attributes");
    return this._stateRowHtml(listPath, entry, e);
  }

  _menuHtml() {
    const rows = Object.entries(this._sectionMeta()).map(([key, m]) =>
      `<button class="menu-row" data-action="open" data-path="${key}">` +
      `<span>${haacEsc(m.name)}</span>` +
      `<span class="mcount">${m.count ? haacEsc(m.count) : ""} ›</span></button>`
    ).join("");
    return `<div class="menu"><div class="hint">Tap an item in the preview to open it here. Hold for more-info. Drag to move it.</div>${rows}</div>`;
  }

  _sectionPageHtml(section) {
    switch (section) {
      case "general": return this._generalHtml();
      case "background": return this._backgroundHtml();
      case "pictures": return this._picturesHtml();
      case "switches": return this._switchesHtml();
      default: return this._listHtml(section);
    }
  }

  _itemPageHtml(section, index) {
    switch (section) {
      case "pictures": return this._pictureItemHtml(index, this._config.pictures[index]);
      case "switches": return this._switchItemHtml(index, this._config.switches.items[index]);
      case "buttons": return this._buttonEditor(`buttons.${index}`, index);
      case "templates": return this._templateEditor(`templates.${index}`, index);
      case "history": return this._historyEditor(`history.${index}`, index);
      case "bars": return this._barEditor(`bars.${index}`, index);
      case "tables": return this._tableItemHtml(index);
      default: return this._slotEditor(`${HAAC_LIST_BASE[section]}.${index}`, section, index);
    }
  }

  // Rows that open each item's page
  _rowsHtml(section) {
    const meta = this._sectionMeta()[section];
    const items = haacGet(this._config, HAAC_LIST_BASE[section]) || [];
    return items.map((raw, i) =>
      `<button class="menu-row" data-action="open" data-path="${section}/${i}">` +
      `<span>${haacEsc(meta.item)} ${i + 1}${this._rowSub(section, raw)}</span>` +
      `<span class="mcount">›</span></button>`
    ).join("");
  }

  _rowSub(section, raw) {
    let text = "";
    if (section === "sensors") text = haacSlotFull(raw, "sensor").entity;
    else if (section === "attributes") text = haacSlotFull(raw, "attribute").entity;
    else if (section === "switches") { const it = haacSwitchFull(raw); text = it.label || it.entity; }
    else if (section === "buttons") { const bt = haacButtonFull(raw); text = bt.label || bt.entity; }
    else if (section === "pictures") text = haacPictureFull(raw).entity;
    else if (section === "templates") text = String(raw?.template || "").split("\n")[0].slice(0, 40);
    else if (section === "history") text = haacHistoryFull(raw).entity;
    else if (section === "bars") text = haacBarFull(raw).entity;
    else if (section === "tables") text = haacTableFull(raw).rows[0]?.entity || "";
    return text ? ` <span class="sum-sub">${haacEsc(text)}</span>` : "";
  }

  // A group is listed on its page and its content opens on its own page.
  // Returns nothing here; _pageHtml places the group where it belongs.
  _group(key, title, body) {
    this._groups.push({ key: key.split(".").pop(), title, body });
    return "";
  }

  _historyEditor(base, index) {
    const h = haacHistoryFull(haacGet(this._config, base) || {});
    const moves = `<div class="row">
        <button data-action="move-item" data-base="history" data-index="${index}" data-dir="-1">Move up</button>
        <button data-action="move-item" data-base="history" data-index="${index}" data-dir="1">Move down</button>
        <button class="danger" data-action="remove-item" data-base="history" data-index="${index}">Remove</button>
      </div>`;
    return `<div class="item"><div class="item-body">
      ${moves}
      <div class="grid">
        ${this._entityField("Entity", `${base}.entity`, h.entity)}
        ${this._check("Show chart", `${base}.enabled`, h.enabled !== false)}
        ${this._check("Show time axis", `${base}.show_axis`, h.show_axis !== false)}
        ${this._select("Time range", `${base}.range`, HAAC_HISTORY_RANGES, h.range)}
        ${this._select("Chart type", `${base}.kind`, [["auto", "Automatic (number or state)"], ["line", "Numeric"], ["timeline", "State timeline"]], h.kind)}
        ${this._select("Numeric style", `${base}.line_style`, [["line", "Line"], ["area", "Filled area"], ["both", "Line and filled area"]], h.line_style)}
        ${this._text("Width (% of card width)", `${base}.width`, h.width, "number")}
        ${this._text("Height (% of picture height)", `${base}.height`, h.height, "number")}
        ${this._slider("Time axis ticks (1 = fewer, 10 = more)", `${base}.ticks`, h.ticks, 1, 10)}
        ${this._icon("Icon", `${base}.icon`, h.icon)}
        ${this._check("Show icon", `${base}.show_icon`, h.show_icon !== false)}
        ${this._select("Justify (value label)", `${base}.justify`, [["left", "Left"], ["center", "Centre"], ["right", "Right"]], h.justify)}
        ${this._select("Tap action", `${base}.tap`, HAAC_TAP_OPTIONS, h.tap)}
      </div>
      ${this._group(`${base}.position`, "Position", this._positionHtml(base, h.pos))}
      ${this._group(`${base}.style`, "Colours and labels", this._histStyleHtml(base, h.style))}
      ${this._group(`${base}.warn`, "Numeric colour limits", this._warnHtml(base, h.warn))}
      ${this._group(`${base}.states`, "State colours (timeline)", this._histStatesHtml(`${base}.states`, h))}
      ${this._group(`${base}.visible`, "Show when (state conditions)", this._conditionsMenu(`${base}.visible`, h.visible))}
    </div></div>`;
  }

  _barEditor(base, index) {
    const b = haacBarFull(haacGet(this._config, base) || {});
    const moves = `<div class="row">
        <button data-action="move-item" data-base="bars" data-index="${index}" data-dir="-1">Move up</button>
        <button data-action="move-item" data-base="bars" data-index="${index}" data-dir="1">Move down</button>
        <button class="danger" data-action="remove-item" data-base="bars" data-index="${index}">Remove</button>
      </div>`;
    return `<div class="item"><div class="item-body">
      ${moves}
      <div class="grid">
        ${this._entityField("Value entity", `${base}.entity`, b.entity)}
        ${this._check("Show bar", `${base}.enabled`, b.enabled !== false)}
        ${this._check("Vertical bar", `${base}.vertical`, !!b.vertical)}
        ${this._check("Fill from zero", `${base}.from_zero`, !!b.from_zero)}
        ${this._text("Start (number)", `${base}.start`, b.start, "number")}
        ${this._entityField("Start from entity (optional, overrides the number)", `${base}.start_entity`, b.start_entity)}
        ${this._text("End (number)", `${base}.end`, b.end, "number")}
        ${this._entityField("End from entity (optional, overrides the number)", `${base}.end_entity`, b.end_entity)}
        ${this._slider("Steps (2 gives 0-5-10, 10 gives 0-1-2-3 and so on)", `${base}.steps`, b.steps, 2, 20)}
        ${this._check("Show value", `${base}.show_value`, b.show_value !== false)}
        ${this._select("Value position", `${base}.value_pos`, [["above", "Above"], ["inside", "Inside"], ["below", "Below"]], b.value_pos)}
        ${this._text("Title (blank = no title)", `${base}.title`, b.title, "text")}
        ${this._select("Title position", `${base}.title_mode`, [["inline", "Inline with value"], ["around", "Above or below value"]], b.title_mode)}
        ${this._select("Inline order", `${base}.title_order`, [["before", "Title before value"], ["after", "Title after value"]], b.title_order)}
        ${this._select("Inline separator", `${base}.title_sep`, [["space", "Space"], ["colon", "Colon  :"], ["dash", "Dash  -"]], b.title_sep)}
        ${this._check("Show start and end labels", `${base}.show_ends`, b.show_ends !== false)}
        ${this._check("Label every step", `${base}.label_every`, !!b.label_every)}
        ${this._text("Tick label decimals (blank = automatic: whole numbers, or 2 when both limits are under 10)", `${base}.tick_decimals`, b.tick_decimals, "number", 'min="0" max="3"')}
        ${this._text("Width (% of card width)", `${base}.width`, b.width, "number")}
        ${this._text("Height (% of picture height)", `${base}.height`, b.height, "number")}
        ${this._icon("Icon", `${base}.icon`, b.icon)}
        ${this._check("Show icon", `${base}.show_icon`, b.show_icon !== false)}
        ${this._select("Tap action", `${base}.tap`, HAAC_TAP_OPTIONS, b.tap)}
      </div>
      ${this._group(`${base}.position`, "Position", this._positionHtml(base, b.pos))}
      ${this._group(`${base}.style`, "Colours and size", this._barStyleHtml(base, b.style))}
      ${this._group(`${base}.visible`, "Show when (state conditions)", this._conditionsMenu(`${base}.visible`, b.visible))}
    </div></div>`;
  }

  _barStyleHtml(base, st) {
    return `<div class="grid">
        ${this._color("Positive fill colour", `${base}.style.pos_color`, st.pos_color, "#22c55e", `${base}.style.pos_color_opacity`)}
        ${this._color("Negative fill colour (fill from zero only)", `${base}.style.neg_color`, st.neg_color, "#ef4444", `${base}.style.neg_color_opacity`)}
        ${this._color("Zero line colour", `${base}.style.zero_color`, st.zero_color, "#ffffff")}
        ${this._text("Zero line width (px)", `${base}.style.zero_width`, st.zero_width, "number")}
        ${this._text("Bar thickness (px)", `${base}.style.bar_thickness`, st.bar_thickness, "number")}
        ${this._color("Track colour", `${base}.style.bg`, st.bg, "#000000")}
        ${this._text("Track opacity (0 to 1)", `${base}.style.bg_opacity`, st.bg_opacity, "number", 'step="0.05" min="0" max="1"')}
        ${this._check("No track background", `${base}.style.bg_none`, !!st.bg_none)}
        ${this._text("Corner radius (px)", `${base}.style.radius`, st.radius, "number")}
        ${this._text("Border width (px)", `${base}.style.border_width`, st.border_width, "number")}
        ${this._color("Border colour", `${base}.style.border_color`, st.border_color, "#ffffff", `${base}.style.border_color_opacity`)}
        ${this._color("Text colour", `${base}.style.label_color`, st.label_color, "#ffffff", `${base}.style.label_color_opacity`)}
        ${this._text("Value text size (px)", `${base}.style.label_size`, st.label_size, "number")}
        ${this._text("Tick label size (px)", `${base}.style.tick_size`, st.tick_size, "number")}
        ${this._check("Bold", `${base}.style.bold`, !!st.bold)}
        ${this._color("Panel colour (behind bar and labels)", `${base}.style.panel_bg`, st.panel_bg, "#000000", `${base}.style.panel_bg_opacity`)}
        ${this._check("No panel background", `${base}.style.panel_bg_none`, !!st.panel_bg_none)}
        ${this._text("Title size (px)", `${base}.style.title_size`, st.title_size, "number")}
        ${this._check("Title bold", `${base}.style.title_bold`, !!st.title_bold)}
        ${this._color("Title colour", `${base}.style.title_color`, st.title_color, "#ffffff", `${base}.style.title_color_opacity`)}
        ${this._text("Element opacity (0 to 1)", `${base}.style.opacity`, st.opacity, "number", 'step="0.05" min="0" max="1"')}
        ${this._text("Padding (px)", `${base}.style.padding`, st.padding, "number")}
      </div>`;
  }

  _histStyleHtml(base, st) {
    return `<div class="grid">
        ${this._color("Line colour", `${base}.style.line_color`, st.line_color, "#38bdf8", `${base}.style.line_color_opacity`)}
        ${this._text("Line width (px)", `${base}.style.line_width`, st.line_width, "number")}
        ${this._color("Fill colour", `${base}.style.fill_color`, st.fill_color, "#38bdf8")}
        ${this._text("Fill opacity (0 to 1)", `${base}.style.fill_opacity`, st.fill_opacity, "number", 'step="0.05" min="0" max="1"')}
        ${this._color("Background colour", `${base}.style.bg`, st.bg, "#000000")}
        ${this._text("Background opacity (0 to 1)", `${base}.style.bg_opacity`, st.bg_opacity, "number", 'step="0.05" min="0" max="1"')}
        ${this._check("No background", `${base}.style.bg_none`, !!st.bg_none)}
        ${this._check("Show labels (values on numeric charts, names on timelines)", `${base}.style.show_labels`, st.show_labels !== false)}
        ${this._color("Axis label colour", `${base}.style.axis_color`, st.axis_color, "#ffffff", `${base}.style.axis_color_opacity`)}
        ${this._color("Axis background", `${base}.style.axis_bg`, st.axis_bg, "#000000")}
        ${this._text("Axis background opacity (0 to 1)", `${base}.style.axis_bg_opacity`, st.axis_bg_opacity, "number", 'step="0.05" min="0" max="1"')}
        ${this._check("No axis background", `${base}.style.axis_bg_none`, !!st.axis_bg_none)}
        ${this._color("Text colour", `${base}.style.label_color`, st.label_color, "#ffffff", `${base}.style.label_color_opacity`)}
        ${this._text("Text size (px)", `${base}.style.label_size`, st.label_size, "number")}
        ${this._check("Bold", `${base}.style.bold`, !!st.bold)}
        ${this._text("Element opacity (0 to 1)", `${base}.style.opacity`, st.opacity, "number", 'step="0.05" min="0" max="1"')}
        ${this._text("Corner radius (px)", `${base}.style.radius`, st.radius, "number")}
        ${this._text("Padding (px)", `${base}.style.padding`, st.padding, "number")}
        ${this._text("Border width (px)", `${base}.style.border_width`, st.border_width, "number")}
        ${this._color("Border colour", `${base}.style.border_color`, st.border_color, "#ffffff", `${base}.style.border_color_opacity`)}
      </div>`;
  }

  // One colour per state for timeline charts. States with no entry use the unknown colour.
  _histStatesHtml(base, h) {
    const list = Array.isArray(haacGet(this._config, base)) ? haacGet(this._config, base) : [];
    const rows = list.map((r, i) => this._entryRow("states", i, r.state || "")).join("");
    return `${rows ? `<div class="menu">${rows}</div>` : ""}
      <div class="grid">${this._color("Unknown or unavailable colour", `${base.replace(/\.states$/, "")}.unknown_color`, h.unknown_color, "#6b7280", `${base.replace(/\.states$/, "")}.unknown_color_opacity`)}</div>
      <button data-action="add-item" data-base="${base}" ${list.length < HAAC_LIMITS.states ? "" : "disabled"}>+ Add state colour</button>`;
  }

  _stateRowHtml(base, i, r) {
    return `<div class="cond">
        <div class="grid">
          ${this._text("State (for example on, off, open)", `${base}.${i}.state`, r.state || "")}
          ${this._color("Colour", `${base}.${i}.color`, r.color || "", "#22c55e", `${base}.${i}.color_opacity`)}
        </div>
        <div class="row">
          <button data-action="move-item" data-base="${base}" data-index="${i}" data-dir="-1">Move up</button>
          <button data-action="move-item" data-base="${base}" data-index="${i}" data-dir="1">Move down</button>
          <button class="danger" data-action="remove-item" data-base="${base}" data-index="${i}">Remove</button>
        </div>
      </div>`;
  }

  _slider(label, path, value, min, max) {
    const v = Number.isFinite(Number(value)) ? Number(value) : min;
    return `<label class="f"><span>${haacEsc(label)}</span>` +
      `<input type="range" min="${min}" max="${max}" step="1" value="${v}" data-path="${path}"></label>`;
  }

  // ---- field helpers ------------------------------------------------

  _text(label, path, value, type = "text", extra = "") {
    return `<label class="f"><span>${haacEsc(label)}</span>` +
      `<input type="${type}" data-path="${path}" value="${haacEsc(value ?? "")}" ${extra}></label>`;
  }

  _check(label, path, checked) {
    return `<label class="cb"><input type="checkbox" data-path="${path}" ${checked ? "checked" : ""}>` +
      `<span>${haacEsc(label)}</span></label>`;
  }

  _select(label, path, options, value) {
    const v = String(value ?? "");
    const opts = options.map(([val, txt]) =>
      `<option value="${haacEsc(val)}" ${String(val) === v ? "selected" : ""}>${haacEsc(txt)}</option>`
    ).join("");
    return `<label class="f"><span>${haacEsc(label)}</span><select data-path="${path}">${opts}</select></label>`;
  }

  // Colour picker with Clear (back to the setting's default) and Transparent. fallback is the default value.
  _color(label, path, value, fallback = "", opacityPath = "") {
    const v = value === undefined || value === null ? "" : String(value);
    const isDefault = v === "" || v === fallback;
    const status = isDefault ? "Default" : v === "transparent" ? "Transparent" : "";
    const shown = v === "" || v === "transparent" ? fallback : v;
    const op = opacityPath ? haacGet(this._config, opacityPath) : undefined;
    const opHtml = opacityPath
      ? `<label class="opw"><span>Opacity</span><input type="number" min="0" max="1" step="0.05" value="${haacAlpha(op)}" data-path="${opacityPath}"></label>`
      : "";
    return `<div class="f"><span>${haacEsc(label)}</span>` +
      `<div class="colour">` +
      `<input type="color" data-path="${path}" value="${haacHex6(shown)}">` +
      `<button class="mini" data-action="set-colour" data-path="${path}" data-value="${haacEsc(fallback)}">Clear</button>` +
      `<button class="mini" data-action="set-colour" data-path="${path}" data-value="transparent">Transparent</button>` +
      `<span class="cstate">${status}</span>${opHtml}</div></div>`;
  }

  _icon(label, path, value) {
    if (customElements.get("ha-icon-picker")) {
      return `<div class="f"><span>${haacEsc(label)}</span>` +
        `<ha-icon-picker data-path="${path}"></ha-icon-picker></div>`;
    }
    return this._text(`${label} (mdi:…)`, path, value);
  }

  // domains limits the picker to those entity domains. Without it, any entity can be typed in.
  _entityField(label, path, value, domains = null) {
    if (customElements.get("ha-entity-picker")) {
      const attrs = domains ? `data-domains="${haacEsc(domains.join(","))}"` : "allow-custom-entity";
      return `<div class="f"><span>${haacEsc(label)}</span>` +
        `<ha-entity-picker data-path="${path}" ${attrs}></ha-entity-picker></div>`;
    }
    return this._text(label, path, value);
  }

  // Attribute dropdown once the entity is known, free text until then
  // Offers a unit conversion for power and energy entities
  _unitField(base, s) {
    const kind = s.entity ? haacUnitKind(this._hass?.states?.[s.entity]) : null;
    if (!kind || s.source === "attribute") return "";
    const opts = [["", "As reported"], ...HAAC_UNIT_FAMILIES[kind].units.map((u) => [u, u])];
    return this._select(`Show ${kind} as`, `${base}.unit_convert`, opts, s.unit_convert || "");
  }

  _attrField(path, entity, value) {
    const st = entity && this._hass?.states?.[entity];
    if (!st) return this._text("Attribute (pick entity first)", path, value || "");
    const names = Object.keys(st.attributes || {}).sort();
    const opts = [["", "(none)"], ...names.map((n) => [n, n])];
    if (value && !names.includes(value)) opts.push([value, value]);
    return this._select("Attribute", path, opts, value || "");
  }

  _hydrate() {
    this.shadowRoot.querySelectorAll("ha-entity-picker[data-path], ha-icon-picker[data-path]").forEach((el) => {
      const path = el.dataset.path;
      const isIcon = el.tagName === "HA-ICON-PICKER";
      el.hass = this._hass;
      if (el.hasAttribute("data-domains")) el.includeDomains = el.dataset.domains.split(",");
      el.value = haacGet(this._config, path) || "";
      el.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const v = ev.detail?.value ?? "";
        if (v === (haacGet(this._config, path) || "")) return;
        this._emit(haacSetPath(this._config, path, v));
        // Attribute dropdowns depend on the chosen entity
        if (!isIcon && path.endsWith(".entity")) this._render();
      });
    });
  }

  // ---- events ------------------------------------------------------

  _onChange(ev) {
    const t = ev.target;
    if (!t || !(t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA")) return;
    const path = t.dataset.path;
    if (!path) return;

    let value;
    if (t.type === "checkbox") value = t.checked;
    else if (t.type === "number") value = t.value === "" ? "" : Number(t.value);
    else if (t.type === "range") value = Number(t.value);
    else value = t.value;
    if (t.type === "number" && value !== "" && !Number.isFinite(value)) return;

    if (path === "appliance_type") {
      // Follow the type's icon unless the person has chosen their own
      let next = haacSetPath(this._config, path, value);
      const presetIcons = Object.values(HAAC_PRESETS).map((p) => p.icon);
      const cur = this._config.icon;
      if (!cur || cur === haacDefaults().icon || presetIcons.includes(cur)) {
        next = haacSetPath(next, "icon", HAAC_PRESETS[value]?.icon || haacDefaults().icon);
      }
      this._emit(next);
      this._render();
      return;
    }

    this._draft = null;
    this._emit(haacSetPath(this._config, path, value));
    // Changing these alters which fields are shown
    if (path.endsWith(".source") || path.endsWith(".op") || path.endsWith(".action") || path.endsWith(".fit") || path === "background.type" || path === "background.gradient_type" || path.startsWith("templates.")) {
      this._render();
    }
  }

  _onClick(ev) {
    const el = ev.target.closest ? ev.target.closest("[data-action]") : null;
    if (!el) return;
    const a = el.dataset.action;
    if (a === "open") this._navigate(el.dataset.path.split("/"));
    else if (a === "back") this._navigate(this._path.slice(0, -1));
    else if (a === "open-entry") this._navigate([...this._path.slice(0, 3), el.dataset.index]);
    else if (a === "add-item") this._addItem(el.dataset.base);
    else if (a === "remove-item") this._removeItem(el.dataset.base, Number(el.dataset.index));
    else if (a === "move-item") this._moveItem(el.dataset.base, Number(el.dataset.index), Number(el.dataset.dir));
    else if (a === "set-colour") {
      this._emit(haacSetPath(this._config, el.dataset.path, el.dataset.value));
      this._render();
    }
    else if (a === "apply-preset") this._applyPreset();
  }

  _addItem(base) {
    const last = base.split(".").pop();
    const list = this._listFor(base);
    if (list.length >= (HAAC_LIMITS[last] ?? Infinity)) return;
    list.push(haacNewItem(last, list.length));
    // Adding a top-level list item opens its page straight away
    const section = this._sectionForBase(base);
    if (section) this._path = [section, String(list.length - 1)];
    this._commitList(base, list);
  }

  _removeItem(base, index) {
    const list = this._listFor(base);
    list.splice(index, 1);
    // Removing the item being viewed returns to its list page
    const open = this._openEntry();
    if (open && open.base === base) {
      if (open.index === index) this._path = this._path.slice(0, 3);
      else if (open.index > index) this._path = [...this._path.slice(0, 3), String(open.index - 1)];
    }
    const [section, cur] = this._path;
    if (cur !== undefined && HAAC_LIST_BASE[section] === base) {
      if (Number(cur) === index) this._path = [section];
      else if (Number(cur) > index) this._path = [section, String(Number(cur) - 1)];
    }
    this._commitList(base, list);
  }

  _moveItem(base, index, dir) {
    const list = this._listFor(base);
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    [list[index], list[j]] = [list[j], list[index]];
    const open = this._openEntry();
    if (open && open.base === base && open.index === index) this._path = [...this._path.slice(0, 3), String(j)];
    // The moved item stays on screen when it is the one being viewed
    const [section, cur] = this._path;
    if (cur !== undefined && HAAC_LIST_BASE[section] === base && Number(cur) === index) {
      this._path = [section, String(j), ...this._path.slice(2)];
    }
    this._commitList(base, list);
  }

  _applyPreset() {
    const preset = HAAC_PRESETS[this._config.appliance_type];
    if (!preset) return;

    let next = haacSetPath(this._config, "name", this._config.name || preset.name);
    if (!this._config.icon || this._config.icon === haacDefaults().icon) {
      next = haacSetPath(next, "icon", preset.icon);
    }

    const fill = (list, suggestions) => {
      const last = list.split(".").pop();
      const arr = [...(haacGet(next, list) || [])];
      suggestions.slice(0, HAAC_LIMITS[last] ?? suggestions.length).forEach((sug, i) => {
        const cur = arr[i] ? { ...arr[i] } : haacNewItem(last, i);
        if (!cur.icon && sug.icon) cur.icon = sug.icon;
        if (!cur.label || cur.label === "{v}{u}") cur.label = sug.label;
        const hasConds = Array.isArray(cur.visible?.conditions) && cur.visible.conditions.length > 0;
        if (sug.op && !hasConds) {
          cur.visible = { match: "all", conditions: [{ ...haacDefaultCondition(), op: sug.op, value: sug.value ?? "" }] };
        }
        arr[i] = cur;
      });
      next = haacSetPath(next, list, arr);
    };

    fill("sensors", preset.sensors);
    fill("switches.items", preset.switches);

    this._emit(next);
    this._render();
  }
}

// =====================================================================
// Registration
// =====================================================================

if (!customElements.get(HAAC_TYPE)) {
  customElements.define(HAAC_TYPE, HaApplianceCard);
}
if (!customElements.get(HAAC_EDITOR)) {
  customElements.define(HAAC_EDITOR, HaApplianceCardEditor);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === HAAC_TYPE)) {
  window.customCards.push({
    type: HAAC_TYPE,
    name: "Appliance Card",
    description: "Appliance overlay card with a picture background, collapsible switches, conditional sensors and attributes, and a visual editor.",
    preview: true
  });
}
