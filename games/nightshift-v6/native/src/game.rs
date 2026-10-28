//! Version 6 authoritative integer racing/career simulation. No wall clock or client rewards.
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
pub const ID: &str = "myelin-nightshift-v6";
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
    pub x: i32,
    pub y: i32,
    pub vx: i32,
    pub vy: i32,
    pub tag: i32,
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Rival {
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
pub struct Game {
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
    pub career: Career,
    pub rivals: Vec<Rival>,
}
fn curve(d: i32) -> i32 {
    [0, 0, 2, 3, 1, 0, -2, -3, -1, 0, 1, -2, 0, 3, 2, 0][(d / 3000 % 16) as usize]
}
impl Game {
    pub fn new(kind: Kind) -> Self {
        Self {
kind,
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
pulse:2,
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
career:serde_json::from_value(json!({"credits":1200,"earned":0,"spent":0,"rep":0,"owned":1,"upgrades":[[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]],"medals":[0,0,0,0,0,0,0,0,0,0,0,0],"races":0,"wins":0})).unwrap(),
rivals:serde_json::from_value(json!([{"id":0,"x":0,"distance":300,"speed":1000,"hp":2,"stun":0,"cooldown":180,"windup":0,"attack_x":0,"defend":0,"target":0,"finish":0,"boost":0,"brain":0},{"id":1,"x":1000,"distance":540,"speed":1000,"hp":2,"stun":0,"cooldown":270,"windup":0,"attack_x":0,"defend":0,"target":1000,"finish":0,"boost":0,"brain":0},{"id":2,"x":2000,"distance":780,"speed":1000,"hp":2,"stun":0,"cooldown":360,"windup":0,"attack_x":0,"defend":0,"target":2000,"finish":0,"boost":0,"brain":0},{"id":3,"x":0,"distance":1020,"speed":1000,"hp":2,"stun":0,"cooldown":450,"windup":0,"attack_x":0,"defend":0,"target":0,"finish":0,"boost":0,"brain":0},{"id":4,"x":1000,"distance":1260,"speed":1000,"hp":2,"stun":0,"cooldown":540,"windup":0,"attack_x":0,"defend":0,"target":1000,"finish":0,"boost":0,"brain":0}])).unwrap(),
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
                self.shield = if vehicle == 2 || vehicle == 5 { 2 } else { 1 };
                self.pursuit = if mode % 4 == 1 { 160 } else { 0 };
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
        self.bodies.push(Body { x, y, vx, vy, tag });
    }
    fn crash(&mut self) {
        if self.over {
            return;
        }
        self.damage_ticks = 15;
        self.clean_ticks = 0;
        if self.shield > 0 {
            self.shield -= 1;
            self.speed = (self.speed * 65 / 100).max(500);
            self.combo = 0;
            self.chain_ticks = 0;
            self.pursuit = (self.pursuit + 100).min(1000);
        } else {
            self.lives = 0;
            self.over = true;
            self.finish_reason = 2;
        }
    }
    pub fn step(&mut self, i: u8) {
        if self.over {
            return;
        }
        self.tick += 1;
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
        ] {
            *n = (*n - 1).max(0);
        }
        self.time_left -= 1;
        if self.chain_ticks == 0 {
            self.combo = 0;
        }
        if i & 64 != 0 && self.counter_lock == 0 && self.counter_cd == 0 && self.counter > 0 {
            self.counter -= 1;
            self.counter_ticks = 45;
            self.counter_cd = 210;
        }
        self.counter_lock = i32::from(i & 64 != 0);
        let mut target = -1;
        let mut best = 901;
        for r in &self.rivals {
            let gap = r.distance - self.distance;
            if r.finish == 0
                && r.stun == 0
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
                (self.lock_ticks + 1).min(30)
            } else {
                1
            }
        } else {
            0
        };
        self.lock_id = target;
        if i & 32 != 0
            && self.pulse_lock == 0
            && self.weapon_cd == 0
            && self.pulse > 0
            && (self.gadget != 0 || self.lock_ticks >= 18)
        {
            self.pulse -= 1;
            self.pulse_ticks = 24;
            self.weapon_cd = 150 - up[2] * 20;
            let mut points = 0;
            for r in &mut self.rivals {
                let gap = r.distance - self.distance;
                let hit = if self.gadget == 0 {
                    r.id == self.lock_id
                } else if self.gadget == 1 {
                    gap.abs() < 360
                } else {
                    false
                };
                if !hit || r.finish > 0 {
                    continue;
                }
                if r.defend > 0 {
                    r.defend = 0;
                    continue;
                }
                r.hp -= 1;
                r.stun = r.stun.max(18);
                self.attack_hits += 1;
                points += 80;
                if r.hp <= 0 {
                    r.stun = 210;
                    r.hp = 2;
                    self.takedowns += 1;
                    points += 250;
                }
            }
            self.award(points);
            if self.gadget == 2 {
                self.body(self.drift_x, 900, 0, 0, 11);
            }
            self.pursuit = (self.pursuit - 80).max(0);
        }
        self.pulse_lock = i32::from(i & 32 != 0);
        if self.tick % (900 - up[2] * 90) == 0 {
            self.pulse = (self.pulse + 1).min(3);
        }
        if i & 16 != 0
            && self.ability_lock == 0
            && self.ability_ticks == 0
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
        let bend = curve(self.distance);
        self.drifting =
            i32::from(brake && (dir != 0 || self.steer_v.abs() > 20) && self.speed >= 900);
        let max_turn = TURN[car] + up[1] * 3 + if self.drifting > 0 { 12 } else { 0 };
        self.steer_v = if dir != 0 {
            (self.steer_v + dir * if self.drifting > 0 { 15 } else { 11 })
                .clamp(-max_turn, max_turn)
        } else {
            self.steer_v * 65 / 100
        };
        let slip = bend * (self.speed - 1250).max(0)
            / (110 + up[1] * 35 + if self.drifting > 0 { 120 } else { 0 });
        self.drift_x += self.steer_v + slip;
        if self.drift_x < -340 || self.drift_x > 2340 {
            self.drift_x = self.drift_x.clamp(-340, 2340);
            self.steer_v = 0;
            self.speed = (self.speed - 65).max(500);
            self.combo = 0;
            self.chain_ticks = 0;
            self.drifting = 0;
        }
        let old = self.x;
        self.x = ((self.drift_x + 500) / 1000).clamp(0, 2);
        if old != self.x {
            self.echo_lane = old;
            self.echo_ticks = 20;
        }
        let target = (if self.stun > 0 {
            900
        } else if brake {
            if self.drifting > 0 {
                1280
            } else {
                750
            }
        } else {
            SPEED[car] + up[0] * 70
        }) + if self.ability_ticks > 0 { 800 } else { 0 };
        let acc = if self.ability_ticks > 0 {
            55
        } else if brake {
            32
        } else if car == 4 {
            30
        } else {
            20
        };
        self.speed = (self.speed + (target - self.speed).clamp(-acc, acc)).clamp(500, 2500);
        let advance = self.speed / 100;
        self.distance += advance;
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
        self.clean_ticks += 1;
        if self.tick % 30 == 0 {
            self.charge = (self.charge + 12).min(900);
        }
        for n in 0..self.rivals.len() {
            let mut r = self.rivals[n].clone();
            if r.finish > 0 {
                continue;
            }
            for v in [&mut r.stun, &mut r.cooldown, &mut r.defend, &mut r.boost] {
                *v = (*v - 1).max(0);
            }
            let gap = r.distance - self.distance;
            if r.windup > 0 {
                r.windup -= 1;
                if r.windup == 0 {
                    if self.counter_ticks > 0
                        || (self.drift_x - r.attack_x).abs() > 430
                        || gap.abs() > 1000
                    {
                        self.dodges += 1;
                        self.charge = (self.charge + 140).min(900);
                        if self.counter_ticks > 0 {
                            r.stun = 60;
                        }
                    } else {
                        self.stun = 45;
                        self.charge = (self.charge - 140).max(0);
                        self.damage_ticks = 9;
                    }
                    r.cooldown = 270 + n as i32 * 30;
                }
            }
            if r.stun == 0 && r.cooldown == 0 && r.windup == 0 && gap.abs() < 800 && self.tick > 180
            {
                r.windup = 42;
                r.attack_x = self.drift_x;
            }
            if self.lock_id == n as i32
                && self.lock_ticks == 12
                && r.stun == 0
                && (self.tick + n as i32 * 31) % 3 == 0
            {
                r.defend = 30;
            }
            if self.tick % 15 == n as i32 * 3 && r.stun == 0 {
                let mut best_cost = i32::MAX;
                for lane in 0..3 {
                    let x = lane * 1000;
                    let mut cost = (r.x - x).abs() * 3 + (curve(r.distance) * 120 + 1000 - x).abs();
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
                    if gap < 0 && gap > -700 {
                        cost += (600 - (self.drift_x - x).abs()).max(0) * 60;
                    }
                    if n == 1 && gap > 150 && gap < 650 {
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
            r.x += (r.target - r.x).clamp(-turn, turn);
            if r.stun == 0 && self.tick % (420 + n as i32 * 31) == n as i32 * 23 {
                r.boost = 80;
            }
            let mut desired = if r.stun > 0 {
                650
            } else {
                1900 + n as i32 * 50 + self.difficulty * 80 + if r.boost > 0 { 440 } else { 0 }
                    - curve(r.distance).abs() * 25
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
            r.distance += (r.speed / 100).max(5);
            if (r.distance - self.distance).abs() < 38
                && (r.x - self.drift_x).abs() < 330
                && r.stun == 0
            {
                if self.shield > 0 && self.ability_ticks > 0 {
                    r.hp -= 1;
                    r.stun = 90;
                    self.attack_hits += 1;
                    if r.hp <= 0 {
                        r.hp = 2;
                        r.stun = 210;
                        self.takedowns += 1;
                    }
                }
                if (r.speed - self.speed).abs() > 420 || self.ability_ticks > 0 {
                    self.crash();
                } else {
                    self.speed = (self.speed - 80).max(500);
                }
                r.stun = r.stun.max(20);
                r.x = (r.x + if r.x >= self.drift_x { 160 } else { -160 }).clamp(0, 2000);
            }
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
                } else if self.speed >= 1700 {
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
        if self.tick % 135 == 1 {
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
        if self.tick % 135 == 55 {
            let lane = self.rand() % 3;
            self.body(lane * 1000, 0, 0, 0, 3 + self.tick / 135 % 5);
        }
        if self.tick % 240 == 100 {
            let lane = self.rand() % 3;
            self.body(lane * 1000, 0, 0, 0, 10);
        }
        for index in 0..self.bodies.len() {
            let mut b = self.bodies[index].clone();
            if b.tag == 0 {
                continue;
            }
            let old_y = b.y;
            b.x += b.vx;
            if b.x < 0 || b.x > 2000 {
                b.x = b.x.clamp(0, 2000);
                b.vx = -b.vx;
            }
            b.y += (advance - b.vy).max(3);
            let lateral = (b.x - self.drift_x).abs();
            let aligned = lateral < 320;
            if b.tag == 11 {
                for r in &mut self.rivals {
                    if r.finish == 0
                        && (self.distance + 830 - b.y - r.distance).abs() < 70
                        && (r.x - b.x).abs() < 420
                    {
                        if r.defend == 0 {
                            r.hp -= 1;
                            r.stun = 90;
                            self.attack_hits += 1;
                            if r.hp <= 0 {
                                r.hp = 2;
                                r.stun = 210;
                                self.takedowns += 1;
                            }
                        }
                        b.tag = 0;
                        break;
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
                    b.tag = 0;
                    self.crash();
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
                            self.pulse = (self.pulse + 1).min(3);
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
        self.bodies
            .retain(|b| b.tag != 0 && b.y < if b.tag == 11 { 2300 } else { 1100 });
        let cp = (self.distance / (finish / 4)).min(3);
        if !self.over && cp > self.checkpoint {
            self.checkpoint = cp;
            self.shield = (self.shield + 1).min(2);
            self.pulse = (self.pulse + 1).min(3);
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
                    && (typ != 3 || self.takedowns >= DISABLES[mode]),
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
