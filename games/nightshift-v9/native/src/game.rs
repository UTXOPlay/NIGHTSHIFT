//! Version 9 authoritative integer racing/career simulation. No wall clock or client rewards.
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
pub const ID: &str = "myelin-nightshift-v9";
pub const PORT: u16 = 8799;
pub const MAX_ACTIONS: u64 = 100000;
const DIST: [i32; 12] = [
    135000, 140000, 135000, 140000, 150000, 155000, 140000, 155000, 165000, 170000, 145000, 175000,
];
const STYLE: [i32; 12] = [0, 0, 3500, 0, 0, 0, 5000, 0, 0, 0, 6500, 0];
const DISABLES: [i32; 12] = [0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 4];
const SPEED: [i32; 6] = [1660, 1600, 1570, 1810, 1720, 1690];
const TURN: [i32; 6] = [70, 86, 62, 72, 78, 68];
const PRICE: [i32; 6] = [0, 1800, 2600, 4200, 3200, 3800];
const UPGRADE: [i32; 3] = [650, 550, 600];
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Kind {
    DriftRun,
}
impl Kind {
    pub fn parse(s: &str) -> Result<Self, String> {
        if s == "drift-run" {
            Ok(Self::DriftRun)
        } else {
            Err("Unknown game".into())
        }
    }
    pub fn id(self) -> &'static str {
        "drift-run"
    }
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Body {
    pub id: i32,
    pub contact_cd: i32,
    pub x: i32,
    pub y: i32,
    pub vx: i32,
    pub vy: i32,
    pub tag: i32,
    pub life: i32,
    pub age: i32,
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Rival {
    pub side_v: i32,
    pub contact_cd: i32,
    pub id: i32,
    pub x: i32,
    pub distance: i32,
    pub speed: i32,
    pub hp: i32,
    pub stun: i32,
    pub cooldown: i32,
    pub windup: i32,
    pub attack_x: i32,
    pub defend: i32,
    pub target: i32,
    pub finish: i32,
    pub boost: i32,
    pub brain: i32,
    pub recover: i32,
    pub ammo: i32,
    pub guard: i32,
    pub guard_cd: i32,
    pub attack_target: i32,
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Career {
    pub credits: i32,
    pub earned: i32,
    pub spent: i32,
    pub rep: i32,
    pub owned: i32,
    pub upgrades: [[i32; 3]; 6],
    pub medals: [i32; 12],
    pub races: i32,
    pub wins: i32,
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CombatEvent {
    pub id: i32,
    pub tick: i32,
    pub kind: String,
    pub actor: i32,
    pub target: i32,
    pub weapon: i32,
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Game {
    pub physics_version: i32,
    pub body_seq: i32,
    pub side_v: i32,
    pub yaw: i32,
    pub yaw_v: i32,
    pub rail_cd: i32,
    pub impact_nx: i32,
    pub impact_nz: i32,
    pub impact_force: i32,
    pub impact_x: i32,
    pub impact_z: i32,
    pub contact_seq: i32,

    pub kind: Kind,
    pub tick: i32,
    pub score: i32,
    pub lives: i32,
    pub level: i32,
    pub over: bool,
    pub x: i32,
    pub y: i32,
    pub vx: i32,
    pub vy: i32,
    pub dir: i32,
    pub next_dir: i32,
    pub cooldown: i32,
    pub combo: i32,
    pub rng: i32,
    pub energy: i32,
    pub ability_ticks: i32,
    pub ability_lock: i32,
    pub specials: i32,
    pub echo_lane: i32,
    pub echo_ticks: i32,
    pub loop_area: i32,
    pub bodies: Vec<Body>,
    pub trail: Vec<[i32; 2]>,
    pub cells: Vec<i32>,
    pub vehicle: i32,
    pub drift_x: i32,
    pub shield: i32,
    pub magnet_ticks: i32,
    pub nitro: i32,
    pub double_ticks: i32,
    pub damage_ticks: i32,
    pub distance: i32,
    pub pickups: i32,
    pub mode: i32,
    pub speed: i32,
    pub steer_v: i32,
    pub drifting: i32,
    pub charge: i32,
    pub chain_ticks: i32,
    pub style: i32,
    pub draft_ticks: i32,
    pub checkpoint: i32,
    pub time_left: i32,
    pub pursuit: i32,
    pub warning_ticks: i32,
    pub gap_lane: i32,
    pub won: i32,
    pub near_misses: i32,
    pub pulse: i32,
    pub pulse_ticks: i32,
    pub pulse_lock: i32,
    pub takedowns: i32,
    pub encounter: i32,
    pub finish_reason: i32,
    pub gadget: i32,
    pub weapon_cd: i32,
    pub lock_id: i32,
    pub lock_ticks: i32,
    pub counter: i32,
    pub counter_ticks: i32,
    pub counter_cd: i32,
    pub counter_lock: i32,
    pub attack_hits: i32,
    pub dodges: i32,
    pub stun: i32,
    pub position: i32,
    pub sector_best: i32,
    pub clean_ticks: i32,
    pub reward: i32,
    pub race_id: i32,
    pub difficulty: i32,
    pub hull: i32,
    pub recover: i32,
    pub impact_grace: i32,
    pub energy_grace: i32,
    pub pace: i32,
    pub disabled_mask: i32,
    pub contract_mask: i32,
    pub contract_done: i32,
    pub event_seq: i32,
    pub events: Vec<CombatEvent>,
    pub career: Career,
    pub rivals: Vec<Rival>,
}
#[derive(Deserialize)]
struct Course {
    curves: Vec<i32>,
}
fn curve(d: i32, mode: i32) -> i32 {
    static COURSES: std::sync::OnceLock<Vec<Course>> = std::sync::OnceLock::new();
    let tracks = COURSES.get_or_init(|| {
        serde_json::from_slice(include_bytes!(
            "../../../arcade/web/nightshift9-courses.json"
        ))
        .expect("bound courses")
    });
    let q = (i64::from(d.max(0)) * 96 * 1024 / i64::from(DIST[mode as usize]))
        .clamp(0, 96 * 1024 - 1) as usize;
    let n = q / 1024;
    let f = (q % 1024) as i32;
    let curve = &tracks[mode as usize].curves;
    (curve[n] * (1024 - f) + curve[(n + 1).min(95)] * f) / 1024
}

impl Game {
    pub fn new(kind: Kind) -> Self {
        Self {
kind,
physics_version:9,body_seq:0,side_v:0,yaw:0,yaw_v:0,rail_cd:0,impact_nx:0,impact_nz:0,impact_force:0,impact_x:0,impact_z:0,contact_seq:0,
tick:0,
score:0,
lives:1,
level:1,
over:false,
x:1,
y:750,
vx:7,
vy:-10,
dir:1,
next_dir:1,
cooldown:0,
combo:0,
rng:73129,
energy:0,
ability_ticks:0,
ability_lock:0,
specials:0,
echo_lane:1,
echo_ticks:0,
loop_area:0,
bodies:serde_json::from_value(json!([])).unwrap(),
trail:serde_json::from_value(json!([])).unwrap(),
cells:serde_json::from_value(json!([])).unwrap(),
vehicle:0,
drift_x:1000,
shield:1,
magnet_ticks:0,
nitro:0,
double_ticks:0,
damage_ticks:0,
distance:0,
pickups:0,
mode:0,
speed:1000,
steer_v:0,
drifting:0,
charge:300,
chain_ticks:0,
style:0,
draft_ticks:0,
checkpoint:0,
time_left:12600,
pursuit:0,
warning_ticks:0,
gap_lane:1,
won:0,
near_misses:0,
pulse:3,
pulse_ticks:0,
pulse_lock:0,
takedowns:0,
encounter:0,
finish_reason:0,
gadget:0,
weapon_cd:0,
lock_id:-1,
lock_ticks:0,
counter:2,
counter_ticks:0,
counter_cd:0,
counter_lock:0,
attack_hits:0,
dodges:0,
stun:0,
position:6,
sector_best:0,
clean_ticks:0,
reward:0,
race_id:0,
difficulty:0,
hull:2,recover:0,impact_grace:0,energy_grace:0,pace:1660,disabled_mask:0,contract_mask:0,contract_done:0,event_seq:0,events:vec![],career:serde_json::from_value(json!({"credits":1200,"earned":0,"spent":0,"rep":0,"owned":1,"upgrades":[[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]],"medals":[0,0,0,0,0,0,0,0,0,0,0,0],"races":0,"wins":0})).unwrap(),
rivals:serde_json::from_value(json!([{"id":0,"x":0,"distance":240,"speed":1000,"hp":2,"stun":0,"cooldown":450,"windup":0,"attack_x":0,"defend":0,"target":0,"finish":0,"boost":0,"brain":0,"recover":0,"ammo":2,"guard":1,"guard_cd":0,"attack_target":-2,"side_v":0,"contact_cd":0},{"id":1,"x":1000,"distance":400,"speed":1000,"hp":2,"stun":0,"cooldown":600,"windup":0,"attack_x":0,"defend":0,"target":1000,"finish":0,"boost":0,"brain":0,"recover":0,"ammo":2,"guard":1,"guard_cd":0,"attack_target":-2,"side_v":0,"contact_cd":0},{"id":2,"x":2000,"distance":560,"speed":1000,"hp":2,"stun":0,"cooldown":750,"windup":0,"attack_x":0,"defend":0,"target":2000,"finish":0,"boost":0,"brain":0,"recover":0,"ammo":2,"guard":1,"guard_cd":0,"attack_target":-2,"side_v":0,"contact_cd":0},{"id":3,"x":0,"distance":720,"speed":1000,"hp":2,"stun":0,"cooldown":900,"windup":0,"attack_x":0,"defend":0,"target":0,"finish":0,"boost":0,"brain":0,"recover":0,"ammo":2,"guard":1,"guard_cd":0,"attack_target":-2,"side_v":0,"contact_cd":0},{"id":4,"x":1000,"distance":880,"speed":1000,"hp":2,"stun":0,"cooldown":1050,"windup":0,"attack_x":0,"defend":0,"target":1000,"finish":0,"boost":0,"brain":0,"recover":0,"ammo":2,"guard":1,"guard_cd":0,"attack_target":-2,"side_v":0,"contact_cd":0}])).unwrap(),
}
    }
    pub fn view(&self) -> Value {
        serde_json::to_value(self).expect("game state")
    }
    pub fn validate(&self) -> Result<(), String> {
        if self.tick < 0
            || self.tick > 12600
            || self.mode < 0
            || self.mode >= 12
            || self.vehicle < 0
            || self.vehicle >= 6
            || self.gadget < 0
            || self.gadget >= 3
            || self.difficulty < 0
            || self.difficulty > 2
            || self.rivals.len() != 5
            || self.bodies.len() > 128
            || self.career.credits < 0
            || self.career.credits != 1200 + self.career.earned - self.career.spent
            || self
                .career
                .upgrades
                .iter()
                .flatten()
                .any(|x| *x < 0 || *x > 3)
            || self.rng <= 0
            || self.rng == 2147483647
        {
            return Err("Invalid racing state".into());
        }
        Ok(())
    }
    pub fn apply(&mut self, a: &Value) -> Result<(), String> {
        let o = a.as_object().ok_or("Expected action")?;
        let typ = a["type"].as_str().ok_or("Missing action type")?;
        let exact =
            |keys: &[&str]| o.len() == keys.len() && keys.iter().all(|k| o.contains_key(*k));
        let number = |k: &str, max: i32| {
            a[k].as_i64()
                .filter(|n| *n >= 0 && *n < i64::from(max))
                .map(|n| n as i32)
                .ok_or("Invalid choice")
        };
        match typ {
            "ticks" => {
                if !exact(&["type", "inputs"]) {
                    return Err("Invalid input action".into());
                }
                let tape = a["inputs"].as_array().ok_or("Missing tape")?;
                if tape.is_empty()
                    || tape.len() > 120
                    || tape.iter().any(|i| i.as_u64().is_none_or(|n| n > 127))
                {
                    return Err("Invalid input tape".into());
                }
                for i in tape {
                    self.step(i.as_u64().unwrap() as u8);
                }
            }
            "race" => {
                if !exact(&["type", "mode", "vehicle", "gadget", "difficulty"]) {
                    return Err("Invalid setup".into());
                }
                let mode = number("mode", 12)?;
                let vehicle = number("vehicle", 6)?;
                let gadget = number("gadget", 3)?;
                let difficulty = number("difficulty", 3)?;
                if self.career.owned & (1 << vehicle) == 0 {
                    return Err("Car not owned".into());
                }
                let career = self.career.clone();
                let id = self.race_id + 1;
                *self = Self::new(self.kind);
                self.career = career;
                self.race_id = id;
                self.mode = mode;
                self.vehicle = vehicle;
                self.gadget = gadget;
                self.difficulty = difficulty;
                self.rng = 73129 + id * 97 % 100000;
                self.shield = if difficulty == 0 || vehicle == 2 || vehicle == 5 {
                    2
                } else {
                    1
                };
                self.pursuit = if mode % 4 == 1 { 160 } else { 0 };
                for rank in 0..DISABLES[mode as usize] {
                    self.contract_mask |= 1 << ((rank + mode + self.race_id) % 5);
                }
            }
            "buy" => {
                if !exact(&["type", "choice"]) || self.tick > 0 && !self.over {
                    return Err("Purchase unavailable".into());
                }
                let c = number("choice", 6)?;
                let price = PRICE[c as usize];
                if self.career.owned & (1 << c) != 0 || self.career.credits < price {
                    return Err("Car owned or insufficient credits".into());
                }
                self.career.credits -= price;
                self.career.spent += price;
                self.career.owned |= 1 << c;
            }
            "upgrade" => {
                if !exact(&["type", "vehicle", "choice"]) || self.tick > 0 && !self.over {
                    return Err("Upgrade unavailable".into());
                }
                let c = number("choice", 3)? as usize;
                let v = number("vehicle", 6)? as usize;
                if self.career.owned & (1 << v) == 0 {
                    return Err("Car not owned".into());
                }
                let level = self.career.upgrades[v][c];
                let price = UPGRADE[c] * (level + 1);
                if level >= 3 || self.career.credits < price {
                    return Err("Upgrade capped or insufficient credits".into());
                }
                self.career.credits -= price;
                self.career.spent += price;
                self.career.upgrades[v][c] += 1;
            }
            _ => return Err("Unknown action".into()),
        }
        self.validate()
    }
    fn rand(&mut self) -> i32 {
        self.rng = (i64::from(self.rng) * 16807 % 2147483647) as i32;
        self.rng
    }
    fn award(&mut self, n: i32) {
        self.score += n * if self.double_ticks > 0 { 2 } else { 1 };
    }
    fn body(&mut self, x: i32, y: i32, vx: i32, vy: i32, tag: i32) {
        self.body_seq += 1;
        self.bodies.push(Body {
            id: self.body_seq,
            contact_cd: 0,
            x,
            y,
            vx,
            vy,
            tag,
            life: if tag == 11 { 360 } else { 0 },
            age: 0,
        });
    }
    fn crash(&mut self) {
        if self.over || self.impact_grace > 0 {
            return;
        }
        self.impact_grace = 36;
        self.damage_ticks = 15;
        self.clean_ticks = 0;
        if self.shield > 0 {
            self.shield -= 1;
            self.emit("collision", -1, -1, -1);
            if self.shield == 0 {
                self.emit("shield-break", -1, -1, -1);
            }

            self.combo = 0;
            self.chain_ticks = 0;
            self.pursuit = (self.pursuit + 100).min(1000);
        } else {
            self.lives = 0;
            self.over = true;
            self.finish_reason = 2;
            self.emit("wreck", -1, -1, -1);
        }
    }
    fn emit(&mut self, kind: &str, actor: i32, target: i32, weapon: i32) {
        self.event_seq += 1;
        self.events.push(CombatEvent {
            id: self.event_seq,
            tick: self.tick,
            kind: kind.into(),
            actor,
            target,
            weapon,
        });
        if self.events.len() > 32 {
            self.events.remove(0);
        }
    }
    fn contract_active(&self, id: i32) -> bool {
        for rank in 0..DISABLES[self.mode as usize] {
            if (rank + self.mode + self.race_id) % 5 == id {
                return self.distance * 5 >= DIST[self.mode as usize] * rank;
            }
        }
        false
    }
    fn cancel_attack(&mut self, id: usize) {
        if self.rivals[id].windup > 0 {
            self.rivals[id].windup = 0;
            self.rivals[id].cooldown = self.rivals[id].cooldown.max(90);
            let target = self.rivals[id].attack_target;
            self.emit("cancel", id as i32, target, -1);
        }
    }
    fn hit_rival(&mut self, id: usize, actor: i32, weapon: i32, power: i32) -> bool {
        let mut r = self.rivals[id].clone();
        if r.finish > 0 || r.hp <= 0 || r.recover > 0 {
            return false;
        }
        if r.defend > 0 {
            r.defend = 0;
            self.rivals[id] = r;
            self.emit("block", actor, id as i32, weapon);
            return false;
        }
        r.hp = (r.hp - power).max(0);
        r.stun = r.stun.max(if r.hp > 0 { 18 } else { 75 });
        let disabled = r.hp == 0;
        self.rivals[id] = r;
        self.cancel_attack(id);
        self.emit(
            if disabled { "disable" } else { "hit" },
            actor,
            id as i32,
            weapon,
        );
        if actor == -1 {
            self.attack_hits += 1;
            self.pursuit = (self.pursuit - 40).max(0);
            self.award(80);
            if disabled {
                let bit = 1 << id;
                if self.disabled_mask & bit == 0 {
                    self.disabled_mask |= bit;
                    self.takedowns += 1;
                    self.award(250);
                }
                if self.contract_mask & bit != 0
                    && self.contract_active(id as i32)
                    && self.contract_done & bit == 0
                {
                    self.contract_done |= bit;
                    self.emit("contract", actor, id as i32, weapon);
                }
            }
        }
        true
    }
    fn hit_player(&mut self, actor: i32) {
        if self.recover > 0 || self.energy_grace > 0 || self.hull == 0 {
            return;
        }
        self.energy_grace = 30;
        self.hull -= 1;
        self.stun = self.stun.max(if self.hull > 0 { 18 } else { 75 });
        self.charge = (self.charge - 80).max(0);
        if self.hull == 0 {
            self.ability_ticks = 0;
        }
        self.emit(if self.hull > 0 { "hit" } else { "disable" }, actor, -1, 0);
    }
    fn rival_combat(&mut self, n: usize) {
        let mut r = self.rivals[n].clone();
        if r.finish > 0 {
            return;
        }
        for v in [
            &mut r.stun,
            &mut r.cooldown,
            &mut r.defend,
            &mut r.boost,
            &mut r.recover,
            &mut r.guard_cd,
        ] {
            *v = (*v - 1).max(0);
        }
        if r.hp == 0 && r.stun == 0 {
            r.hp = 2;
            r.recover = 45;
            self.emit("recover", n as i32, n as i32, -1);
        }
        if (self.tick + n as i32 * 37) % 600 == 0 {
            r.ammo = (r.ammo + 1).min(3);
        }
        if (self.tick + n as i32 * 43) % 900 == 0 {
            r.guard = (r.guard + 1).min(1);
        }
        if r.stun > 0 || r.hp == 0 {
            self.rivals[n] = r;
            self.cancel_attack(n);
            return;
        }
        if r.windup > 0 {
            r.windup -= 1;
            if r.windup == 0 {
                let human = r.attack_target == -1;
                let (x, d, valid) = if human {
                    (self.drift_x, self.distance, !self.over && self.hull > 0)
                } else if let Some(t) = self.rivals.get(r.attack_target as usize) {
                    (t.x, t.distance, t.finish == 0 && t.hp > 0)
                } else {
                    (0, 0, false)
                };
                self.emit("shot", n as i32, r.attack_target, 0);
                if valid && (d - r.distance).abs() < 900 {
                    if (x - r.attack_x).abs() > 430 {
                        if human {
                            self.dodges += 1;
                            self.charge = (self.charge + 60).min(900);
                            self.emit("dodge", n as i32, -1, 0);
                        }
                    } else if human && self.counter_ticks > 0 {
                        self.dodges += 1;
                        self.charge = (self.charge + 100).min(900);
                        r.stun = r.stun.max(30);
                        self.emit("counter", -1, n as i32, 0);
                    } else if human {
                        self.hit_player(n as i32);
                    } else {
                        self.hit_rival(r.attack_target as usize, n as i32, 0, 1);
                    }
                }
                r.cooldown = 240 + n as i32 * 30 - self.difficulty * 20;
            }
        }
        if r.stun == 0
            && r.recover == 0
            && r.cooldown == 0
            && r.windup == 0
            && r.ammo > 0
            && self.tick > 180
        {
            let mut target = -2;
            let mut best = 10000;
            let mut actors = vec![(-1, self.drift_x, self.distance, self.hull, 0, self.recover)];
            actors.extend(
                self.rivals
                    .iter()
                    .map(|t| (t.id, t.x, t.distance, t.hp, t.finish, t.recover)),
            );
            for (id, x, d, hp, finish, recover) in actors {
                let gap = d - r.distance;
                if id == n as i32
                    || finish > 0
                    || hp == 0
                    || recover > 0
                    || gap.abs() > 700
                    || gap.abs() < 40
                    || (x - r.x).abs() > 650
                {
                    continue;
                }
                if id == -1
                    && self
                        .rivals
                        .iter()
                        .filter(|a| a.windup > 0 && a.attack_target == -1)
                        .count()
                        >= if self.difficulty == 2 { 2 } else { 1 }
                {
                    continue;
                }
                let cost =
                    gap.abs() + if gap < 0 { 150 } else { 0 } + if id == -1 { 60 } else { 0 };
                if cost < best {
                    best = cost;
                    target = id;
                }
            }
            if target != -2 {
                r.attack_target = target;
                r.attack_x = if target == -1 {
                    self.drift_x
                } else {
                    self.rivals[target as usize].x
                };
                r.windup = 42;
                r.ammo -= 1;
                self.emit("aim", n as i32, target, 0);
            }
        }
        if self.lock_id == n as i32
            && self.lock_ticks == 12
            && r.guard > 0
            && r.guard_cd == 0
            && r.stun == 0
            && r.recover == 0
        {
            r.guard -= 1;
            r.guard_cd = 240;
            r.defend = 18;
            self.emit("guard", n as i32, n as i32, -1);
        }
        self.rivals[n] = r;
    }
    pub fn step(&mut self, i: u8) {
        if self.over {
            return;
        }
        let contact_before = ContactBefore {
            x: self.drift_x,
            distance: self.distance,
            rivals: self.rivals.iter().map(|r| (r.x, r.distance)).collect(),
            bodies: self
                .bodies
                .iter()
                .map(|b| (b.id, b.x, self.distance + 830 - b.y))
                .collect(),
        };
        self.rail_cd = (self.rail_cd - 1).max(0);
        self.side_v = self.side_v * (if self.drifting > 0 { 96 } else { 88 }) / 100;
        self.yaw_v = self.yaw_v * 72 / 100;
        self.yaw = ((self.yaw + self.yaw_v) * 90 / 100).clamp(-500, 500);
        self.tick += 1;
        self.events.clear();
        let mode = self.mode as usize;
        let typ = self.mode % 4;
        let car = self.vehicle as usize;
        let up = self.career.upgrades[car];
        let finish = DIST[mode];
        for n in [
            &mut self.ability_ticks,
            &mut self.echo_ticks,
            &mut self.magnet_ticks,
            &mut self.double_ticks,
            &mut self.damage_ticks,
            &mut self.chain_ticks,
            &mut self.pulse_ticks,
            &mut self.weapon_cd,
            &mut self.counter_ticks,
            &mut self.counter_cd,
            &mut self.stun,
            &mut self.recover,
            &mut self.impact_grace,
            &mut self.energy_grace,
        ] {
            *n = (*n - 1).max(0);
        }
        if self.hull == 0 && self.stun == 0 {
            self.hull = 2;
            self.recover = 45;
            self.emit("recover", -1, -1, -1);
        }
        self.time_left -= 1;
        if self.chain_ticks == 0 {
            self.combo = 0;
        }
        if i & 64 != 0
            && self.counter_lock == 0
            && self.counter_cd == 0
            && self.counter > 0
            && self.hull > 0
        {
            self.counter -= 1;
            self.counter_ticks = 45;
            self.counter_cd = 210;
            self.emit("guard", -1, -1, -1);
        }
        self.counter_lock = i32::from(i & 64 != 0);
        let mut target = -1;
        let mut best = 901;
        for r in &self.rivals {
            let gap = r.distance - self.distance;
            if r.finish == 0
                && r.stun == 0
                && r.hp > 0
                && r.recover == 0
                && gap > 30
                && gap < best
                && (r.x - self.drift_x).abs() < 480
            {
                target = r.id;
                best = gap;
            }
        }
        self.lock_ticks = if target >= 0 {
            if target == self.lock_id {
                (self.lock_ticks + 1).min(18)
            } else {
                1
            }
        } else {
            0
        };
        self.lock_id = target;
        let costs = [2, 2, 1];
        let cooldowns = [120, 210, 180];
        if i & 32 != 0
            && self.pulse_lock == 0
            && self.weapon_cd == 0
            && self.pulse >= costs[self.gadget as usize]
            && self.hull > 0
            && (self.gadget != 0 || self.lock_ticks >= 18)
        {
            self.pulse -= costs[self.gadget as usize];
            self.pulse_ticks = 24;
            self.weapon_cd = cooldowns[self.gadget as usize] - up[2] * 10;
            self.emit(
                "shot",
                -1,
                if self.gadget == 0 { self.lock_id } else { -2 },
                self.gadget,
            );
            if self.gadget == 0 {
                self.hit_rival(self.lock_id as usize, -1, 0, 2);
            } else if self.gadget == 1 {
                let mut targets: Vec<(i32, usize)> = self
                    .rivals
                    .iter()
                    .enumerate()
                    .filter(|(_, r)| {
                        r.finish == 0
                            && r.hp > 0
                            && r.recover == 0
                            && (r.distance - self.distance).abs() < 180
                            && (r.x - self.drift_x).abs() <= 1000
                    })
                    .map(|(n, r)| ((r.distance - self.distance).abs(), n))
                    .collect();
                targets.sort();
                for (_, id) in targets.into_iter().take(2) {
                    self.hit_rival(id, -1, 1, 1);
                }
            } else {
                self.body(self.drift_x, 900, 0, 0, 11);
            }
        }
        self.pulse_lock = i32::from(i & 32 != 0);
        if self.tick % (360 - up[2] * 20) == 0 {
            self.pulse = (self.pulse + 1).min(4);
        }
        if i & 8 != 0 {
            self.ability_ticks = 0;
        }
        if i & 16 != 0
            && i & 8 == 0
            && self.ability_lock == 0
            && self.ability_ticks == 0
            && self.hull > 0
            && (self.charge >= 300 || self.nitro > 0)
        {
            let tier = if self.nitro > 0 {
                self.nitro -= 1;
                3
            } else {
                let t = self.charge / 300;
                self.charge -= t * 300;
                t
            };
            self.ability_ticks = 24 + tier * 18 + up[2] * 6 + if car == 3 { 10 } else { 0 };
            self.specials += 1;
        }
        self.ability_lock = i32::from(i & 16 != 0);
        let dir = if i & 1 != 0 && i & 2 == 0 {
            -1
        } else if i & 2 != 0 && i & 1 == 0 {
            1
        } else {
            0
        };
        let brake = i & 8 != 0;
        let bend = curve(self.distance, self.mode);
        self.drifting =
            i32::from(brake && (dir != 0 || self.steer_v.abs() > 20) && self.speed >= 900);
        let max_turn = TURN[car] + up[1] * 3 + if self.drifting > 0 { 12 } else { 0 };
        self.steer_v = if dir != 0 {
            (self.steer_v + dir * if self.drifting > 0 { 15 } else { 11 })
                .clamp(-max_turn, max_turn)
        } else {
            self.steer_v * 65 / 100
        };
        let slip = -bend * (self.speed - 1050).max(0)
            / (240 + up[1] * 45 + if self.drifting > 0 { 100 } else { 0 });
        self.drift_x += self.steer_v * self.speed.clamp(-1000, 1000) / 1000
            + slip
            + self.side_v / 4
            + self.yaw * self.speed / 4000;
        let old = self.x;
        self.x = (floor_div(i64::from(self.drift_x + 500), 1000) as i32).clamp(0, 2);
        if old != self.x {
            self.echo_lane = old;
            self.echo_ticks = 20;
        }
        let target = (if i & 4 != 0 {
            -350
        } else if self.stun > 0 {
            1100
        } else if brake {
            if self.drifting > 0 {
                1280
            } else {
                0
            }
        } else {
            SPEED[car] + up[0] * 70 - bend.abs() * 20
        }) + if self.ability_ticks > 0 && self.stun == 0 {
            800
        } else {
            0
        };
        let acc = if self.ability_ticks > 0 {
            55
        } else if brake {
            32
        } else if car == 4 {
            30
        } else {
            20
        };
        self.speed = (self.speed + (target - self.speed).clamp(-acc, acc)).clamp(-350, 2500);
        self.resolve_rail();
        let initial_distance = self.distance;
        self.distance = (self.distance + self.speed / 100).max(0);
        let advance = self.distance - initial_distance;
        self.level = 1 + self.distance / (finish / 4);
        self.encounter = self.distance / 9000 % 4;
        if self.drifting > 0 && self.steer_v.abs() > 28 {
            self.chain_ticks = 150;
            self.charge = (self.charge + if car == 1 { 8 } else { 6 }).min(900);
            if self.tick % 3 == 0 {
                let n = 4 * (1 + self.combo / 3) * if self.encounter == 2 { 2 } else { 1 };
                self.style += n;
                self.award(n);
            }
            if self.tick % 24 == 0 {
                self.combo = (self.combo + 1).min(12);
            }
        }
        let drafting = self.rivals.iter().any(|r| {
            r.distance - self.distance > 60
                && r.distance - self.distance < 700
                && (r.x - self.drift_x).abs() < 360
        }) || self
            .bodies
            .iter()
            .any(|b| b.tag == 1 && b.y > 250 && b.y < 725 && (b.x - self.drift_x).abs() < 300);
        self.draft_ticks = if drafting {
            (self.draft_ticks + 1).min(90)
        } else {
            (self.draft_ticks - 3).max(0)
        };
        if self.draft_ticks >= 12 {
            self.charge = (self.charge + 3).min(900);
        }
        self.pace = (self.pace * 59 + self.speed.clamp(1450, 2300) + 30) / 60;
        self.clean_ticks += 1;
        if self.tick % 30 == 0 {
            self.charge = (self.charge + 12).min(900);
        }
        for n in 0..self.rivals.len() {
            self.rival_combat(n);
        }
        for n in 0..self.rivals.len() {
            let mut r = self.rivals[n].clone();
            if r.finish > 0 {
                continue;
            }
            let gap = r.distance - self.distance;
            if self.tick % 15 == n as i32 * 3 && r.stun == 0 {
                let mut best_cost = i32::MAX;
                for lane in 0..3 {
                    let x = lane * 1000;
                    let mut cost =
                        (r.x - x).abs() * 3 + (curve(r.distance, self.mode) * 120 + 1000 - x).abs();
                    for b in &self.bodies {
                        if b.tag == 1 || b.tag == 8 {
                            let d = self.distance + 830 - b.y - r.distance;
                            if d > 0 && d < 600 {
                                cost += (650 - (b.x - x).abs()).max(0) * 120;
                            }
                        }
                    }
                    for other in &self.rivals {
                        if other.id != n as i32
                            && other.distance - r.distance > 0
                            && other.distance - r.distance < 500
                        {
                            cost += (550 - (other.x - x).abs()).max(0) * 60;
                        }
                    }
                    if gap.abs() < 700 && (gap < 0 || self.difficulty < 2) {
                        cost += (600 - (self.drift_x - x).abs()).max(0) * 60;
                    }
                    if self.difficulty == 2 && n == 1 && gap > 150 && gap < 650 {
                        cost -= (400 - (self.drift_x - x).abs()).max(0) * 20;
                    }
                    if cost < best_cost {
                        best_cost = cost;
                        r.target = x;
                    }
                }
                r.brain = if gap < 0 {
                    1
                } else if n == 1 {
                    2
                } else {
                    0
                };
            }
            let turn = if r.stun > 0 { 5 } else { 18 + n as i32 * 2 };
            r.side_v = r.side_v * 88 / 100;
            r.contact_cd = (r.contact_cd - 1).max(0);
            r.x = (r.x + (r.target - r.x).clamp(-turn, turn) + r.side_v / 4).clamp(-650, 2650);
            if r.stun == 0 && self.tick % (540 + n as i32 * 37) == n as i32 * 23 {
                r.boost = 60;
            }
            let mut desired = if r.stun > 0 {
                1100
            } else {
                self.pace - 35
                    + n as i32 * 18
                    + self.difficulty * 45
                    + (-gap / 12).clamp(-90, 90)
                    + if r.boost > 0 { 220 } else { 0 }
                    - curve(r.distance, self.mode).abs() * 18
            };
            if gap < 0 && gap > -600 && (r.x - self.drift_x).abs() < 450 {
                desired = desired.min((self.speed - 50).max(650));
            }
            for b in &self.bodies {
                if b.tag == 1 || b.tag == 8 {
                    let d = self.distance + 830 - b.y - r.distance;
                    if d > 0 && d < 200 && (b.x - r.x).abs() < 360 {
                        desired = desired.min(900);
                    }
                }
            }
            r.speed += (desired - r.speed).clamp(-32, 18);
            r.distance = (r.distance + r.speed / 100).max(0);
            if r.distance >= finish {
                r.distance = finish;
                r.finish = self.tick;
            }
            self.rivals[n] = r;
        }
        if typ == 1 && self.tick % 3 == 0 {
            self.pursuit = (self.pursuit
                + if self.ability_ticks > 0 {
                    -5
                } else if self.speed < 1100 {
                    3
                } else if self.speed >= (SPEED[car] + up[0] * 70 - bend.abs() * 20 - 120).max(1150)
                {
                    -2
                } else {
                    1
                })
            .clamp(0, 1000);
        }
        let phase = self.tick % 600;
        if typ == 1 && phase == 200 {
            self.gap_lane = self.rand() % 3;
            self.warning_ticks = 60;
        } else if self.warning_ticks > 0 {
            self.warning_ticks -= 1;
            if self.warning_ticks == 0 {
                for l in 0..3 {
                    if l != self.gap_lane {
                        self.body(l * 1000, 0, 0, 0, 8);
                    }
                }
            }
        }
        if self.speed > 300 && self.tick % 135 == 1 {
            let lane = self.rand() % 3;
            self.body(
                lane * 1000,
                -100,
                if self.encounter == 1 {
                    if lane == 2 {
                        -5
                    } else {
                        5
                    }
                } else {
                    0
                },
                6,
                1,
            );
            for j in 0..3 {
                self.body(((lane + 1) % 3) * 1000, -200 - j * 80, 0, 0, 2);
            }
        }
        if self.speed > 300 && self.tick % 135 == 55 {
            let lane = self.rand() % 3;
            self.body(lane * 1000, 0, 0, 0, 3 + self.tick / 135 % 5);
        }
        if self.speed > 300 && self.tick % 240 == 100 {
            let lane = self.rand() % 3;
            self.body(lane * 1000, 0, 0, 0, 10);
        }
        for index in 0..self.bodies.len() {
            let mut b = self.bodies[index].clone();
            if b.tag == 0 {
                continue;
            }
            b.contact_cd = (b.contact_cd - 1).max(0);
            let old_y = b.y;
            b.x += b.vx;
            if b.tag != 11 && (b.x < 0 || b.x > 2000) {
                b.x = b.x.clamp(0, 2000);
                b.vx = -b.vx;
            }
            b.y += advance - b.vy;
            let lateral = (b.x - self.drift_x).abs();
            let aligned = lateral < 320;
            if b.tag == 11 {
                b.age += 1;
                b.life -= 1;
                if b.age >= 9 {
                    for n in 0..self.rivals.len() {
                        let r = &self.rivals[n];
                        if r.finish == 0
                            && r.hp > 0
                            && r.recover == 0
                            && (self.distance + 830 - b.y - r.distance).abs() < 90
                            && (r.x - b.x).abs() < 480
                        {
                            self.hit_rival(n, -1, 2, 2);
                            b.tag = 0;
                            break;
                        }
                    }
                }
                self.bodies[index] = b;
                continue;
            }
            if b.tag == 1 && old_y < 830 && b.y >= 830 && (320..=900).contains(&lateral) {
                self.charge = (self.charge + 100).min(900);
                self.combo = (self.combo + 1).min(12);
                self.chain_ticks = 150;
                self.near_misses += 1;
                let n = 35 * (1 + self.combo / 3);
                self.style += n;
                self.award(n);
                self.pursuit = (self.pursuit - 45).max(0);
            }
            if (b.y - 830).abs() < 42 {
                if (b.tag == 1 || b.tag == 8) && aligned {
                } else if b.tag == 2 && (aligned || self.magnet_ticks > 0) {
                    self.award(25);
                    self.charge = (self.charge + 55).min(900);
                    self.pickups += 1;
                    b.tag = 0;
                } else if (3..=7).contains(&b.tag) && aligned {
                    match b.tag {
                        3 => self.shield = (self.shield + 1).min(2),
                        4 => self.magnet_ticks = 180,
                        5 => self.nitro = (self.nitro + 1).min(2),
                        6 => {
                            self.pulse = (self.pulse + 1).min(4);
                            self.counter = (self.counter + 1).min(3);
                        }
                        7 => self.double_ticks = 180,
                        _ => {}
                    }
                    self.award(40);
                    self.pickups += 1;
                    b.tag = 0;
                } else if b.tag == 10 && lateral < 550 {
                    self.charge = (self.charge + 250).min(900);
                    self.ability_ticks = self.ability_ticks.max(30);
                    self.specials += 1;
                    self.pickups += 1;
                    b.tag = 0;
                    self.award(75);
                }
            }
            self.bodies[index] = b;
        }
        self.bodies.retain(|b| {
            b.tag != 0
                && if b.tag == 11 {
                    b.life > 0
                } else {
                    b.y > -2000 && b.y < 1100
                }
        });
        self.resolve_contacts(&contact_before);
        let cp = (self.distance / (finish / 4)).min(3);
        if !self.over && cp > self.checkpoint {
            self.checkpoint = cp;
            self.shield = (self.shield + 1).min(2);
            self.pulse = (self.pulse + 1).min(4);
            self.counter = (self.counter + 1).min(3);
            self.charge = (self.charge + 300).min(900);
            self.award(100);
        }
        self.position = 1 + self
            .rivals
            .iter()
            .filter(|r| r.finish > 0 || r.distance > self.distance)
            .count() as i32;
        self.energy = self.charge / 300;
        if self.tick % 15 == 0 {
            self.award(1);
        }
        if !self.over && (self.time_left == 0 || self.pursuit >= 1000) {
            self.over = true;
            self.finish_reason = if self.time_left > 0 { 4 } else { 3 };
        }
        if !self.over && self.distance >= finish {
            self.won = i32::from(
                (typ != 0 || self.position <= 3)
                    && (typ != 2 || self.style >= STYLE[mode])
                    && (typ != 3
                        || (self.contract_done & self.contract_mask) == self.contract_mask),
            );
            self.over = true;
            self.finish_reason = if self.won > 0 {
                1
            } else if typ == 0 {
                7
            } else if typ == 2 {
                5
            } else {
                6
            };
            if self.won > 0 {
                self.award(500 + self.time_left / 3);
            }
        }
        if self.over && self.reward == 0 {
            let finished = self.distance >= finish;
            let reward = if finished {
                400 + (7 - self.position) * 140
                    + self.won * 300
                    + (self.style / 40).min(300)
                    + self.takedowns * 60
            } else {
                (self.distance / 300).min(180)
            };
            self.reward = (reward * (100 + self.difficulty * 25) / 100).max(1);
            self.career.credits += self.reward;
            self.career.earned += self.reward;
            self.career.races += 1;
            self.career.rep += if self.won > 0 {
                100
            } else if finished {
                40
            } else {
                5
            };
            if self.won > 0 {
                self.career.wins += 1;
                self.career.medals[mode] = self.career.medals[mode].max(if self.position == 1 {
                    3
                } else if self.position <= 3 {
                    2
                } else {
                    1
                });
            }
        }
    }
}

#[cfg(test)]
mod combat_regressions {
    use super::*;
    fn fixture() -> Game {
        let mut g = Game::new(Kind::DriftRun);
        g.tick = 400;
        g.distance = 10000;
        g.speed = 1660;
        for r in &mut g.rivals {
            r.finish = 1;
        }
        g
    }
    #[test]
    fn disabled_attack_is_cancelled_and_cannot_be_shortened_by_counter() {
        let mut g = fixture();
        let r = &mut g.rivals[0];
        r.finish = 0;
        r.hp = 0;
        r.stun = 75;
        r.windup = 1;
        r.attack_target = -1;
        r.attack_x = 1000;
        r.distance = 10200;
        g.step(64);
        assert_eq!(g.hull, 2);
        assert_eq!(g.rivals[0].stun, 74);
        assert_eq!(g.rivals[0].windup, 0);
        assert_eq!(g.dodges, 0);
        assert!(g.events.iter().any(|e| e.kind == "cancel"));
    }
    #[test]
    fn contacts_resolve_as_one_crash_episode() {
        let mut g = fixture();
        for _ in 0..3 {
            g.body(1000, 790, 0, 6, 1);
        }
        g.step(0);
        assert_eq!(g.shield, 0);
        assert!(!g.over);
        assert_eq!(g.events.iter().filter(|e| e.kind == "collision").count(), 1);
        for _ in 0..36 {
            g.bodies.clear();
            g.step(0);
        }
        g.body(g.drift_x, 790, 0, 0, 1);
        g.step(0);
        assert!(g.over);
        assert_eq!(g.finish_reason, 2);
    }
    #[test]
    fn repeated_target_cannot_duplicate_contract_or_disable_reward() {
        let mut g = fixture();
        g.mode = 11;
        g.race_id = 1;
        g.contract_mask = 29;
        g.distance = 140000;
        for _ in 0..2 {
            let r = &mut g.rivals[2];
            r.hp = 2;
            r.finish = 0;
            r.stun = 0;
            r.recover = 0;
            r.defend = 0;
            g.hit_rival(2, -1, 2, 2);
        }
        assert_eq!(g.takedowns, 1);
        assert_eq!(g.contract_done, 4);
        assert_ne!(g.contract_done, g.contract_mask);
    }
}
#[derive(Clone, Copy)]
struct Contact {
    nx: i32,
    nz: i32,
    depth: i32,
}
fn floor_div(a: i64, b: i64) -> i64 {
    let q = a / b;
    let r = a % b;
    if r != 0 && (r < 0) != (b < 0) {
        q - 1
    } else {
        q
    }
}
fn ceil_div(a: i64, b: i64) -> i64 {
    -floor_div(-a, b)
}
fn sweep_contact(x0: i32, z0: i32, x1: i32, z1: i32, hx: i32, hz: i32) -> Option<Contact> {
    let dx = x1 - x0;
    let dz = z1 - z0;
    let mut enter = 0i64;
    let mut exit = 65536i64;
    let mut axis = 0;
    let mut normal = 0;
    for (start, delta, half, a) in [(x0, dx, hx, 1), (z0, dz, hz, 2)] {
        if delta == 0 {
            if start.abs() > half {
                return None;
            }
            continue;
        }
        let near = if delta > 0 { -half } else { half };
        let far = -near;
        let at = ceil_div(i64::from(near - start) * 65536, i64::from(delta));
        let bt = floor_div(i64::from(far - start) * 65536, i64::from(delta));
        if at > enter {
            enter = at;
            axis = a;
            normal = delta.signum();
        }
        exit = exit.min(bt);
        if enter > exit {
            return None;
        }
    }
    if exit < 0 || enter > 65536 {
        return None;
    }
    if axis == 0 {
        axis = if hx - x0.abs() < hz - z0.abs() { 1 } else { 2 };
        let (start, delta) = if axis == 1 { (x0, dx) } else { (z0, dz) };
        normal = if start != 0 {
            -start.signum()
        } else if delta != 0 {
            delta.signum()
        } else {
            -1
        };
    }
    Some(Contact {
        nx: if axis == 1 { normal } else { 0 },
        nz: if axis == 2 { normal } else { 0 },
        depth: ((if axis == 1 { x1 } else { z1 }) * normal + (if axis == 1 { hx } else { hz }) + 3)
            .max(0),
    })
}
struct Impulse {
    closing: i32,
    share: i32,
    normal: i32,
    tx: i32,
    tz: i32,
}
fn contact_impulse(
    nx: i32,
    nz: i32,
    vx: i32,
    vz: i32,
    mass: i32,
    other_mass: i32,
    static_body: bool,
) -> Impulse {
    let closing = (-nx * vx - nz * vz).max(0);
    let share = if static_body {
        1000
    } else {
        other_mass * 1000 / (mass + other_mass)
    };
    let normal = closing * 112 * share / 100000;
    let tangent = if nx != 0 { vz } else { vx };
    let friction = (tangent * share / 1000)
        .abs()
        .min(normal * (if static_body { 28 } else { 18 }) / 100);
    Impulse {
        closing,
        share,
        normal,
        tx: if nz != 0 {
            -tangent.signum() * friction
        } else {
            0
        },
        tz: if nx != 0 {
            -tangent.signum() * friction
        } else {
            0
        },
    }
}
const MASS: [i32; 6] = [1450, 1180, 1840, 1320, 1610, 1740];
struct ContactBefore {
    x: i32,
    distance: i32,
    rivals: Vec<(i32, i32)>,
    bodies: Vec<(i32, i32, i32)>,
}
impl Game {
    fn resolve_rail(&mut self) {
        if (-650..=2650).contains(&self.drift_x) {
            return;
        }
        let nx = if self.drift_x < -650 { 1 } else { -1 };
        let vx = self.steer_v * self.speed.clamp(-1000, 1000) / 1000 * 4
            + self.side_v
            + self.yaw * self.speed / 1000;
        let p = contact_impulse(nx, 0, vx, self.speed, MASS[self.vehicle as usize], 0, true);
        self.drift_x = self.drift_x.clamp(-650, 2650);
        self.side_v = (self.side_v + nx * p.normal).clamp(-1200, 1200);
        self.speed = (self.speed + p.tz).clamp(-350, 2500);
        if p.closing > 0 && self.rail_cd == 0 {
            self.rail_cd = 20;
            self.impact_nx = nx;
            self.impact_nz = 0;
            self.impact_force = p.closing;
            self.impact_x = -nx * 1050;
            self.impact_z = 0;
            self.contact_seq += 1;
            if p.closing >= 700 {
                self.crash();
            } else {
                self.emit("scrape", -1, -1, -1);
            }
        }
    }
    fn resolve_contacts(&mut self, before: &ContactBefore) {
        let mut entries: Vec<(bool, usize)> = self
            .rivals
            .iter()
            .enumerate()
            .filter(|(_, r)| r.finish == 0)
            .map(|(n, _)| (true, n))
            .collect();
        entries.extend(
            self.bodies
                .iter()
                .enumerate()
                .filter(|(_, b)| b.tag == 1 || b.tag == 8)
                .map(|(n, _)| (false, n)),
        );
        let mass = MASS[self.vehicle as usize];
        for (rival, n) in entries {
            let (bx, bd, ox, od, static_body, other_mass, other_vx, other_vz, cd) = if rival {
                let r = &self.rivals[n];
                let old = before.rivals[n];
                (
                    r.x,
                    r.distance,
                    old.0,
                    old.1,
                    false,
                    MASS[(n + 1) % 6],
                    (r.x - old.0) * 4,
                    r.speed,
                    r.contact_cd,
                )
            } else {
                let b = &self.bodies[n];
                let d = self.distance + 830 - b.y;
                let old = before
                    .bodies
                    .iter()
                    .find(|old| old.0 == b.id)
                    .map(|old| (old.1, old.2))
                    .unwrap_or((b.x, d));
                (
                    b.x,
                    d,
                    old.0,
                    old.1,
                    b.tag == 8,
                    1700,
                    b.vx * 4,
                    if b.tag == 8 { 0 } else { b.vy * 100 },
                    b.contact_cd,
                )
            };
            let (hx, hz) = if static_body {
                (2860, 2520)
            } else {
                (2080, 4280)
            };
            let Some(hit) = sweep_contact(
                (ox - before.x) * 4,
                (od - before.distance) * 100,
                (bx - self.drift_x) * 4,
                (bd - self.distance) * 100,
                hx,
                hz,
            ) else {
                continue;
            };
            let vx = self.steer_v * self.speed.clamp(-1000, 1000) / 1000 * 4
                + self.side_v
                + self.yaw * self.speed / 1000;
            let p = contact_impulse(
                hit.nx,
                hit.nz,
                vx - other_vx,
                self.speed - other_vz,
                mass,
                other_mass,
                static_body,
            );
            let shift = hit.depth * p.share / 1000;
            let other_shift = hit.depth - shift;
            self.drift_x = (self.drift_x + hit.nx * shift / 4).clamp(-650, 2650);
            let dz = hit.nz * shift / 100;
            if dz != 0 {
                self.distance = (self.distance + dz).max(0);
                for b in &mut self.bodies {
                    b.y += dz;
                }
            }
            if !static_body {
                if rival {
                    let r = &mut self.rivals[n];
                    r.x -= hit.nx * other_shift / 4;
                    r.distance -= hit.nz * other_shift / 100;
                } else {
                    let b = &mut self.bodies[n];
                    b.x -= hit.nx * other_shift / 4;
                    b.y += hit.nz * other_shift / 100;
                }
            }
            if p.normal == 0 {
                continue;
            }
            let ix = hit.nx * p.normal + p.tx;
            let iz = hit.nz * p.normal + p.tz;
            self.side_v = (self.side_v + ix).clamp(-1200, 1200);
            self.speed = (self.speed + iz).clamp(-350, 2500);
            let arm_x = ((bx - self.drift_x) * 4).clamp(-1100, 1100);
            let arm_z = ((bd - self.distance) * 100).clamp(-2100, 2100);
            self.yaw_v =
                (self.yaw_v + (hit.nz * arm_x - hit.nx * arm_z) * p.normal / 40000).clamp(-90, 90);
            if !static_body {
                let ratio = mass * 1000 / other_mass;
                if rival {
                    let r = &mut self.rivals[n];
                    r.side_v = (r.side_v - ix * ratio / 1000).clamp(-1000, 1000);
                    r.speed = (r.speed - iz * ratio / 1000).clamp(-350, 2500);
                } else {
                    let b = &mut self.bodies[n];
                    b.vx = (b.vx - ix * ratio / 4000).clamp(-80, 80);
                    b.vy = (b.vy - iz * ratio / 100000).clamp(-3, 25);
                }
            }
            if cd > 0 {
                continue;
            }
            if rival {
                self.rivals[n].contact_cd = 24;
            } else {
                self.bodies[n].contact_cd = 24;
            }
            self.impact_nx = hit.nx;
            self.impact_nz = hit.nz;
            self.impact_force = p.closing;
            self.impact_x = arm_x;
            self.impact_z = arm_z;
            self.contact_seq += 1;
            let hard = hit.nz < 0 && p.closing >= if static_body { 450 } else { 650 }
                || hit.nx != 0 && p.closing >= 700;
            if hard {
                if rival && self.ability_ticks > 0 && self.shield > 0 {
                    self.hit_rival(n, -1, 3, 1);
                }
                self.crash();
            } else if p.closing > 25 {
                self.emit("scrape", if rival { n as i32 } else { -1 }, -1, -1);
            }
        }
        self.drift_x = self.drift_x.clamp(-650, 2650);
    }
}
