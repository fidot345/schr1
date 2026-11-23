import { CatmullRomCurve3, Euler, Quaternion, Vector3 } from "three";

/*
 * The wardrobe of "Vom Brett zum Schrank", BRIEF.md section 4: its 16
 * parts with their sizes, where each one lies in the stack and stands in
 * the finished wardrobe, the step it arrives in and its way there.
 *
 * One unit is a metre. The wardrobe stands on the floor (y = 0), its base
 * centred on (0, 0, 0), its front to +z, towards the camera.
 */

export type Vec3 = readonly [number, number, number];

/** The six steps of the scene, from "Zuschnitt" to "Fertig". */
export type SceneStep = 1 | 2 | 3 | 4 | 5 | 6;

/** The storyboard: the stretch of the pinned scroll (0 to 1) each step takes. */
export const STEP_RANGES: readonly {
  step: SceneStep;
  from: number;
  to: number;
}[] = [
  { step: 1, from: 0, to: 0.15 },
  { step: 2, from: 0.15, to: 0.4 },
  { step: 3, from: 0.4, to: 0.55 },
  { step: 4, from: 0.55, to: 0.75 },
  { step: 5, from: 0.75, to: 0.9 },
  { step: 6, from: 0.9, to: 1 },
];

/**
 * The camera, BRIEF.md "Камера": a 35° field of view, a little above at the
 * start, three quarters at eye level from step 5 on, always looking at
 * `target`.
 */
export const CAMERA = {
  fov: 35,
  start: [2.6, 2.4, 3.2],
  end: [1.9, 1.3, 2.6],
  target: [0, 0.9, 0],
} as const satisfies { fov: number; start: Vec3; end: Vec3; target: Vec3 };

/** The step that is under way at this progress of the scroll. */
export function stepAt(progress: number): SceneStep {
  const range = STEP_RANGES.find(({ to }) => progress < to);
  return range?.step ?? 6;
}

export type PartShape = "board" | "rod";
export type PartMaterial = "oak" | "birch" | "metal";

export type WardrobePart = {
  id: string;
  shape: PartShape;
  /** Width × height × depth as it stands in the wardrobe; the rod lies along x. */
  size: Vec3;
  material: PartMaterial;
  /** The step it arrives in. Parts of one step start in the order of PARTS. */
  step: SceneStep;
  /** Its centre in the finished wardrobe. */
  assembled: Vec3;
  /**
   * Its centre in the stack and how it lies there: Euler angles in the order
   * YXZ, so the turn of the whole stack (y) comes last. `layer` counts from
   * the floor; in step 1 every layer rises a little more than the one below.
   * Rail and handles lie on the floor next to the stack (layer null) and
   * stay there in step 1.
   */
  stack: { position: Vec3; rotation: Vec3; layer: number | null };
  /** Points it passes on its way, after it has risen from the stack. */
  via: Vec3[];
  /** Where the last stretch of the flight starts, seen from its place. */
  approach: Vec3;
  /** A door: the vertical line it turns on and how far it stands open on arrival. */
  hinge?: { x: number; z: number; open: number };
};

/* The wardrobe, BRIEF.md "Шкаф: размеры и детали". */
const BOARD = 0.019;
const WIDTH = 1.2;
const HEIGHT = 2;
const DEPTH = 0.6;
const BACK = 0.008;
/** Base, top, divider and shelves sit between the sides. */
const INNER_WIDTH = WIDTH - 2 * BOARD;
const INNER_HEIGHT = HEIGHT - 2 * BOARD;
/** Divider and shelves are flush with the back, 40 mm behind the front edge. */
const INNER_DEPTH = 0.56;
const INNER_Z = -DEPTH / 2 + INNER_DEPTH / 2;
/** Each of the two compartments: the width of its shelves. */
const COMPARTMENT = (INNER_WIDTH - BOARD) / 2;
const COMPARTMENT_X = (BOARD + COMPARTMENT) / 2;
/** Four shelves split the left compartment into five equal spaces. */
const LEFT_SHELVES = 4;
const LEFT_SPACE = (INNER_HEIGHT - LEFT_SHELVES * BOARD) / (LEFT_SHELVES + 1);
/** On the right: the hanging rail and the shelf above it. */
const ROD_RADIUS = 0.0125;
const ROD_LENGTH = 0.57;
const ROD_HEIGHT = 1.7;
const RIGHT_SHELF_HEIGHT = 1.8;
/** Two doors lie over the front, with 2 mm around and between them. */
const DOOR_WIDTH = 0.597;
const DOOR_HEIGHT = 1.996;
const DOOR_GAP = 0.002;
const DOOR_Z = DEPTH / 2 + BOARD / 2;
const HINGE_X = DOOR_GAP / 2 + DOOR_WIDTH;
/** How far a door stands open when it arrives: a little past square. */
const DOOR_OPEN = (100 * Math.PI) / 180;
/** Bar handles on the door fronts, next to the gap between the doors. */
const HANDLE: Vec3 = [0.012, 0.3, 0.02];
const HANDLE_X = 0.04;
const HANDLE_HEIGHT = 1.05;
const HANDLE_Z = DEPTH / 2 + BOARD + HANDLE[2] / 2;

/*
 * The stack lies behind the wardrobe, on its left, turned a little towards
 * the camera: the starting view of the brief sees the floor there and
 * hardly any in front of the wardrobe. Two rows along the stack (local x),
 * one in front (local z +0.3) and one behind it. Each row starts at the left
 * end of the stack. The doors lie on the floor, the back panel on them and
 * the boards on top, and every part lies on parts that leave after it.
 */
const STACK_CENTRE = { x: -0.8, z: -1.05 };
const STACK_TURN = 0.4;
const STACK_END = -1;
const FRONT_ROW = 0.3;
const BACK_ROW = -0.3;
/** Where the boards start: on the back panel, which lies on the doors. */
const ON_BACK = BOARD + BACK;
/** Space between parts lying next to each other in one row. */
const STACK_GAP = 0.01;

/** A point of the stack, from its own axes to the scene. */
function inStack(x: number, y: number, z: number): Vec3 {
  const cos = Math.cos(STACK_TURN);
  const sin = Math.sin(STACK_TURN);
  return [
    STACK_CENTRE.x + x * cos + z * sin,
    y,
    STACK_CENTRE.z - x * sin + z * cos,
  ];
}

/** The centre of a part `length` long, `at` from the left end of the stack. */
const alongStack = (length: number, at = 0): number =>
  STACK_END + at + length / 2;

/* How the parts lie in the stack, turn of the stack included. */
/** Lying parts (base, top, shelves, rail) as they are, turned with the stack. */
const FLAT: Vec3 = [0, STACK_TURN, 0];
/** Standing parts (sides, divider, handles) laid down, long side along the stack. */
const ON_FACE: Vec3 = [0, STACK_TURN, Math.PI / 2];
/** Doors and back panel on their face, long side along the stack. */
const PANEL_ON_FACE: Vec3 = [-Math.PI / 2, STACK_TURN, Math.PI / 2];

/** Above its place: the part comes down into it. */
const FROM_ABOVE: Vec3 = [0, 0.3, 0];
/** Behind its place: the part slides in through the open back. */
const FROM_BEHIND: Vec3 = [0, 0, -0.8];
/** Behind and above: the top comes over the back edge onto the sides. */
const OVER_THE_BACK: Vec3 = [0, 0.3, -0.8];

const leftShelfY = (index: number): number =>
  BOARD + (index + 1) * LEFT_SPACE + index * BOARD + BOARD / 2;

/** Shelves side by side in a row of the stack, the n-th one from the left. */
const shelfInRow = (n: number): number =>
  alongStack(COMPARTMENT, n * (COMPARTMENT + STACK_GAP));

const leftShelf = (
  index: number,
  stackX: number,
  row: number,
): WardrobePart => ({
  id: `shelf-left-${index + 1}`,
  shape: "board",
  size: [COMPARTMENT, BOARD, INNER_DEPTH],
  material: "oak",
  step: 3,
  assembled: [-COMPARTMENT_X, leftShelfY(index), INNER_Z],
  stack: {
    position: inStack(stackX, ON_BACK + BOARD / 2, row),
    rotation: FLAT,
    layer: 2,
  },
  via: [],
  approach: FROM_BEHIND,
});

/**
 * The 16 parts in the order they leave the stack. The stack lies behind the
 * wardrobe, so the inner parts come in through the open back: in step 3 the
 * shelves and the rail come first and the back panel closes the back last
 * (the brief names the back panel first). Doors and handles go round the
 * sides to the front.
 */
export const PARTS: readonly WardrobePart[] = [
  {
    id: "side-left",
    shape: "board",
    size: [BOARD, HEIGHT, DEPTH],
    material: "oak",
    step: 2,
    assembled: [-(WIDTH - BOARD) / 2, HEIGHT / 2, 0],
    stack: {
      position: inStack(alongStack(HEIGHT), ON_BACK + 3.5 * BOARD, FRONT_ROW),
      rotation: ON_FACE,
      layer: 5,
    },
    via: [],
    approach: FROM_ABOVE,
  },
  {
    id: "side-right",
    shape: "board",
    size: [BOARD, HEIGHT, DEPTH],
    material: "oak",
    step: 2,
    assembled: [(WIDTH - BOARD) / 2, HEIGHT / 2, 0],
    stack: {
      position: inStack(alongStack(HEIGHT), ON_BACK + 2.5 * BOARD, BACK_ROW),
      rotation: ON_FACE,
      layer: 4,
    },
    via: [],
    approach: FROM_ABOVE,
  },
  {
    id: "base",
    shape: "board",
    size: [INNER_WIDTH, BOARD, DEPTH],
    material: "oak",
    step: 2,
    assembled: [0, BOARD / 2, 0],
    stack: {
      position: inStack(
        alongStack(INNER_WIDTH),
        ON_BACK + 2.5 * BOARD,
        FRONT_ROW,
      ),
      rotation: FLAT,
      layer: 4,
    },
    via: [],
    approach: FROM_BEHIND,
  },
  {
    id: "top",
    shape: "board",
    size: [INNER_WIDTH, BOARD, DEPTH],
    material: "oak",
    step: 2,
    assembled: [0, HEIGHT - BOARD / 2, 0],
    stack: {
      position: inStack(
        alongStack(INNER_WIDTH),
        ON_BACK + 1.5 * BOARD,
        FRONT_ROW,
      ),
      rotation: FLAT,
      layer: 3,
    },
    via: [],
    approach: OVER_THE_BACK,
  },
  {
    id: "divider",
    shape: "board",
    size: [BOARD, INNER_HEIGHT, INNER_DEPTH],
    material: "oak",
    step: 2,
    assembled: [0, HEIGHT / 2, INNER_Z],
    stack: {
      position: inStack(
        alongStack(INNER_HEIGHT),
        ON_BACK + 1.5 * BOARD,
        BACK_ROW,
      ),
      rotation: ON_FACE,
      layer: 3,
    },
    via: [],
    approach: FROM_BEHIND,
  },
  leftShelf(0, shelfInRow(0), FRONT_ROW),
  leftShelf(1, shelfInRow(1), FRONT_ROW),
  leftShelf(2, shelfInRow(0), BACK_ROW),
  leftShelf(3, shelfInRow(1), BACK_ROW),
  {
    id: "shelf-right",
    shape: "board",
    size: [COMPARTMENT, BOARD, INNER_DEPTH],
    material: "oak",
    step: 3,
    assembled: [COMPARTMENT_X, RIGHT_SHELF_HEIGHT, INNER_Z],
    stack: {
      position: inStack(shelfInRow(2), ON_BACK + BOARD / 2, BACK_ROW),
      rotation: FLAT,
      layer: 2,
    },
    via: [],
    approach: FROM_BEHIND,
  },
  {
    id: "rail",
    shape: "rod",
    size: [ROD_LENGTH, 2 * ROD_RADIUS, 2 * ROD_RADIUS],
    material: "metal",
    step: 3,
    assembled: [COMPARTMENT_X, ROD_HEIGHT, INNER_Z],
    stack: {
      position: inStack(alongStack(ROD_LENGTH, 0.9), ROD_RADIUS, -0.72),
      rotation: FLAT,
      layer: null,
    },
    via: [],
    approach: FROM_BEHIND,
  },
  {
    id: "back-panel",
    shape: "board",
    size: [WIDTH, HEIGHT, BACK],
    material: "birch",
    step: 3,
    assembled: [0, HEIGHT / 2, -(DEPTH + BACK) / 2],
    stack: {
      position: inStack(alongStack(HEIGHT), BOARD + BACK / 2, 0),
      rotation: PANEL_ON_FACE,
      layer: 1,
    },
    via: [],
    approach: [0, 0.25, -0.6],
  },
  {
    id: "door-left",
    shape: "board",
    size: [DOOR_WIDTH, DOOR_HEIGHT, BOARD],
    material: "oak",
    step: 4,
    assembled: [-(DOOR_GAP + DOOR_WIDTH) / 2, HEIGHT / 2, DOOR_Z],
    stack: {
      position: inStack(alongStack(DOOR_HEIGHT), BOARD / 2, FRONT_ROW),
      rotation: PANEL_ON_FACE,
      layer: 0,
    },
    // Round the left side of the wardrobe to the front.
    via: [
      [-1.25, 1.05, -0.4],
      [-1.15, 1.05, 0.95],
    ],
    approach: [0, 0, 0.5],
    hinge: { x: -HINGE_X, z: DEPTH / 2, open: -DOOR_OPEN },
  },
  {
    id: "door-right",
    shape: "board",
    size: [DOOR_WIDTH, DOOR_HEIGHT, BOARD],
    material: "oak",
    step: 4,
    assembled: [(DOOR_GAP + DOOR_WIDTH) / 2, HEIGHT / 2, DOOR_Z],
    stack: {
      position: inStack(alongStack(DOOR_HEIGHT), BOARD / 2, BACK_ROW),
      rotation: PANEL_ON_FACE,
      layer: 0,
    },
    // Behind the wardrobe and round its right side to the front.
    via: [
      [0, 1.05, -1.05],
      [1.25, 1.05, -0.4],
      [1.15, 1.05, 0.95],
    ],
    approach: [0, 0, 0.5],
    hinge: { x: HINGE_X, z: DEPTH / 2, open: DOOR_OPEN },
  },
  {
    id: "handle-left",
    shape: "board",
    size: HANDLE,
    material: "metal",
    step: 5,
    assembled: [-HANDLE_X, HANDLE_HEIGHT, HANDLE_Z],
    stack: {
      position: inStack(alongStack(HANDLE[1], 1.55), HANDLE[0] / 2, -0.68),
      rotation: ON_FACE,
      layer: null,
    },
    via: [
      [-1.05, 1.2, -0.6],
      [-0.9, 1.1, 0.8],
    ],
    approach: [0, 0, 0.3],
  },
  {
    id: "handle-right",
    shape: "board",
    size: HANDLE,
    material: "metal",
    step: 5,
    assembled: [HANDLE_X, HANDLE_HEIGHT, HANDLE_Z],
    stack: {
      position: inStack(alongStack(HANDLE[1], 1.55), HANDLE[0] / 2, -0.78),
      rotation: ON_FACE,
      layer: null,
    },
    via: [
      [-1.05, 1.2, -0.6],
      [-0.9, 1.1, 0.8],
    ],
    approach: [0, 0, 0.3],
  },
];

/** The parts of one step, in the order they start. */
export const partsOfStep = (step: SceneStep): WardrobePart[] =>
  PARTS.filter((part) => part.step === step);

/* Motion: how a part goes from the stack into the wardrobe. */

/** Where a part stands in its flight, each number from 0 to 1. */
export type PartMotion = {
  /** Step 1: it rises off the stack. */
  lift: number;
  /** Its flight from the stack to its place. */
  fly: number;
  /** A door: it closes on its hinge. */
  swing: number;
};

/** Step 1: each layer of the stack rises this much more than the one below. */
const LIFT_GAP = 0.03;
/** How high a part goes up before it flies. */
const RISE = 0.4;

const UP = new Vector3(0, 1, 0);

type Track = {
  path: CatmullRomCurve3;
  from: Quaternion;
  to: Quaternion;
};

const tracks = new WeakMap<WardrobePart, Track>();

const vector = ([x, y, z]: Vec3): Vector3 => new Vector3(x, y, z);

/** Where a door's centre is when it stands open by `angle` on its hinge. */
function onHinge(part: WardrobePart, angle: number, out: Vector3): Vector3 {
  const hinge = part.hinge;
  out.set(...part.assembled);
  if (!hinge) return out;
  out.x -= hinge.x;
  out.z -= hinge.z;
  out.applyAxisAngle(UP, angle);
  out.x += hinge.x;
  out.z += hinge.z;
  return out;
}

/** The lifted stack place of a part: where its flight starts. */
function liftedFrom(part: WardrobePart, lift: number, out: Vector3): Vector3 {
  out.set(...part.stack.position);
  const layersUp = part.stack.layer === null ? 0 : part.stack.layer + 1;
  out.y += lift * layersUp * LIFT_GAP;
  return out;
}

/**
 * The flight of a part, worked out once: up from the stack, through its
 * points, to the start of the last stretch and into its place. A door
 * arrives open. Centripetal Catmull-Rom keeps the curve free of loops.
 */
function trackOf(part: WardrobePart): Track {
  const known = tracks.get(part);
  if (known) return known;

  const start = liftedFrom(part, 1, new Vector3());
  const open = part.hinge?.open ?? 0;
  const arrival = onHinge(part, open, new Vector3());
  const path = new CatmullRomCurve3(
    [
      start,
      start.clone().add(new Vector3(0, RISE, 0)),
      ...part.via.map(vector),
      arrival.clone().add(vector(part.approach)),
      arrival,
    ],
    false,
    "centripetal",
  );
  const track = {
    path,
    from: new Quaternion().setFromEuler(
      new Euler(...part.stack.rotation, "YXZ"),
    ),
    to: new Quaternion().setFromAxisAngle(UP, open),
  };
  tracks.set(part, track);
  return track;
}

/** 0 before `from`, 1 after `to`, a smooth S-curve between. */
const smoothstep = (from: number, to: number, value: number): number => {
  const t = Math.min(Math.max((value - from) / (to - from), 0), 1);
  return t * t * (3 - 2 * t);
};

/**
 * Puts the centre and the turn of a part for its motion into `position`
 * and `quaternion`. It turns from lying to standing in the middle of its
 * flight, after it has risen and before it settles.
 */
export function placePart(
  part: WardrobePart,
  motion: PartMotion,
  position: Vector3,
  quaternion: Quaternion,
): void {
  const track = trackOf(part);

  if (part.hinge && motion.swing > 0) {
    const angle = part.hinge.open * (1 - motion.swing);
    onHinge(part, angle, position);
    quaternion.setFromAxisAngle(UP, angle);
    return;
  }
  if (motion.fly > 0) {
    track.path.getPointAt(Math.min(motion.fly, 1), position);
  } else {
    liftedFrom(part, motion.lift, position);
  }
  quaternion.slerpQuaternions(
    track.from,
    track.to,
    smoothstep(0.15, 0.85, motion.fly),
  );
}
