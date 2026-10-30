//! Continuous line planning with bounded commitment and the shared driver model.
use crate::driver::{self, Lateral, SPEED, TURN};
use crate::game::{curve, Game, Rival};

pub fn traffic_spawn_point(g: &Game, period: i32) -> Option<i32> {
    if g.bodies.iter().filter(|b| b.tag == 1).count() >= 32 {
        return None;
    }
    let mut cars = vec![(g.distance, g.speed)];
    cars.extend(
        g.rivals
            .iter()
            .filter(|r| r.finish == 0 && r.staged == 0)
            .map(|r| (r.distance, r.speed)),
    );
    cars.sort_by_key(|a| a.0);
    let mut groups: Vec<(i32, i32, i32)> = vec![];
    for car in cars {
        if groups.last().is_some_and(|last| car.0 - last.2 < 2400) {
            let last = groups.last_mut().unwrap();
            last.0 = car.0;
            last.1 = car.1;
        } else {
            groups.push((car.0, car.1, car.0));
        }
    }
    let anchor = groups[(g.tick / period) as usize % groups.len()];
    if anchor.1 <= 300 {
        return None;
    }
    let distance = anchor.0 + 2400.max(anchor.1 * 2);
    if g.roadblock_distance > 0 && (distance - g.roadblock_distance).abs() < 2500 {
        None
    } else {
        Some(distance)
    }
}

#[derive(Clone)]
struct Actor {
    id: i32,
    x: i32,
    distance: i32,
    speed: i32,
    vx: i32,
    wall: bool,
}
fn actors(g: &Game, r: &Rival) -> Vec<Actor> {
    let mut a = vec![Actor {
        id: -1,
        x: g.drift_x,
        distance: g.distance,
        speed: g.speed,
        vx: g.lateral_v + g.side_v / 4,
        wall: false,
    }];
    for other in &g.rivals {
        if other.id != r.id && other.finish == 0 {
            a.push(Actor {
                id: other.id,
                x: other.x,
                distance: other.distance,
                speed: other.speed,
                vx: other.lateral_v + other.side_v / 4,
                wall: false,
            });
        }
    }
    for b in &g.bodies {
        if b.tag == 1 || b.tag == 8 {
            a.push(Actor {
                id: 100 + b.id,
                x: b.x,
                distance: g.distance + 830 - b.y,
                speed: if b.tag == 8 { 0 } else { b.vy * 100 },
                vx: b.vx,
                wall: b.tag == 8,
            });
        }
    }
    a
}
fn integer_root(n: i32) -> i32 {
    let mut lo = 0;
    let mut hi = 10000;
    while lo < hi {
        let mid = (lo + hi + 1) / 2;
        if mid * mid <= n {
            lo = mid;
        } else {
            hi = mid - 1;
        }
    }
    lo
}
struct Plan {
    line: i32,
    speed: i32,
    intent: i32,
    side: i32,
    pass_target: i32,
}
fn plan(g: &Game, r: &Rival) -> Plan {
    let up = r.upgrades;
    let look = (r.speed * 9 / 10).clamp(700, 1800);
    let bend = curve(r.distance, g.mode);
    let near = curve(r.distance + look / 3, g.mode);
    let far = curve(r.distance + look, g.mode);
    let ideal = (1000
        + (near * 85 + (far - near) * 45).clamp(-700, 700)
        + [-120, 80, 40, -40, 100][r.id as usize])
        .clamp(0, 2000);
    let a = actors(g, r);
    let front = a
        .iter()
        .filter(|a| {
            a.distance > r.distance && a.distance - r.distance < 800 && (a.x - r.x).abs() < 650
        })
        .min_by_key(|a| (a.distance, a.id));
    let rear = a
        .iter()
        .filter(|a| {
            r.distance - a.distance > 250 && r.distance - a.distance < 700 && a.speed > r.speed + 40
        })
        .min_by_key(|a| (-a.distance, a.id));
    let overlap = a.iter().any(|a| (a.distance - r.distance).abs() < 250);
    let passing = if r.intent_ticks > 0 && r.pass_side != 0 {
        a.iter()
            .find(|a| a.id == r.pass_target && r.distance - a.distance < 180)
    } else {
        None
    };
    let mut defense = if r.brain == 3 && r.intent_ticks > 0 && !overlap {
        r.target
    } else {
        -1
    };
    if r.id == 1 && g.difficulty > 0 && r.defense_cd == 0 && !overlap {
        if let Some(rear) = rear {
            defense = rear.x.clamp(250, 1750);
        }
    }
    let mut best = i64::MAX;
    let mut line = ideal;
    let mut candidates: Vec<i32> = vec![ideal];
    candidates.extend((0..11).map(|n| n * 200));
    for x in candidates {
        let mut cost =
            i64::from((x - ideal).abs() * 3 + (x - r.x).abs() * 2 + (x - r.target).abs());
        if let Some(passing) = passing {
            if (x - passing.x).signum() != r.pass_side {
                cost += 14000;
            }
        }
        if defense >= 0 {
            cost += i64::from((x - defense).abs() * 8);
        }
        for a in &a {
            let gap = a.distance - r.distance;
            if gap < -350 || gap > look {
                continue;
            }
            let ticks = (gap.max(0) * 100 / (r.speed - a.speed).max(200)).clamp(4, 60);
            let travel = ticks * (r.speed / 70).max(8);
            let reachable = r.x + (x - r.x).clamp(-travel, travel);
            let ax = (a.x + a.vx * ticks.min(18)).clamp(-400, 2400);
            let margin = if a.wall { 785 } else { 650 };
            let penetration = (margin - (reachable - ax).abs()).max(0);
            if gap >= 0 {
                cost += i64::from(penetration)
                    * i64::from(if a.wall { 450 } else { 100 })
                    * i64::from(((look - gap) / 100).max(1));
            } else if a.speed > r.speed || gap > -120 {
                cost += i64::from((margin - (x - ax).abs()).max(0)) * 100;
            }
        }
        if cost < best {
            best = cost;
            line = x;
        }
    }
    let peak = bend.abs().max(near.abs()).max(far.abs());
    let mut speed =
        ((SPEED[r.vehicle as usize] + up[0] * 70) * [94, 98, 100][g.difficulty as usize] / 100
            + [-10, -30, 0, 10, -15][r.id as usize]
            - peak * (18 + (2 - g.difficulty) * 2))
            .max(900);
    if r.release_at > 0 {
        speed = speed.min([1500, 1640, 1780][g.difficulty as usize] + g.mode / 4 * 20);
    }
    let mut danger = false;
    for a in &a {
        let gap = a.distance - r.distance;
        if gap <= 0 || gap > look {
            continue;
        }
        let ticks = (gap * 100 / (r.speed - a.speed).max(200)).clamp(4, 60);
        let travel = ticks * (r.speed / 70).max(8);
        let x = r.x + (line - r.x).clamp(-travel, travel);
        let ax = (a.x + a.vx * ticks.min(18)).clamp(-400, 2400);
        if (x - ax).abs() < (if a.wall { 785 } else { 650 }) {
            let cap = a.speed
                + (integer_root(
                    (gap - 120).max(0) * 160 * [13, 14, 12, 15, 16, 13][r.vehicle as usize],
                ) - [13, 14, 12, 15, 16, 13][r.vehicle as usize]
                    * (8 + (2 - g.difficulty) * 3 + r.id % 3))
                    .max(0);
            speed = speed.min(if a.speed == 0 && cap < 100 { 0 } else { cap });
            danger = true;
        }
    }
    let mut intent = if danger { 4 } else { 0 };
    let mut side = 0;
    if !danger {
        if let Some(front) = front.filter(|f| !f.wall) {
            intent = if (line - front.x).abs() > 550 { 2 } else { 1 };
            if intent == 2 {
                side = (line - front.x).signum();
            }
        } else if passing.is_some() {
            intent = 2;
            side = r.pass_side;
        }
    }
    if defense >= 0 && (line - defense).abs() < 300 && !danger {
        intent = 3;
    }
    Plan {
        line,
        speed,
        intent,
        side,
        pass_target: passing.or(front).map(|a| a.id).unwrap_or(-2),
    }
}
pub fn update(g: &mut Game, finish: i32) {
    for n in 0..g.rivals.len() {
        let mut r = g.rivals[n].clone();
        if r.finish > 0 {
            continue;
        }
        if r.staged > 0 {
            if g.distance < r.release_at {
                r.throttle = 0;
                r.brake = 100;
                r.side_v = r.side_v * 88 / 100;
                r.x = (r.x + r.side_v / 4).clamp(-650, 2650);
                (r.speed, r.drive_remainder) = driver::powertrain(
                    r.vehicle as usize,
                    r.speed,
                    r.drive_remainder,
                    0,
                    0,
                    100,
                    r.stun,
                    r.hp,
                    r.boost,
                    r.upgrades,
                );
                r.distance = (r.distance + r.speed / 100).max(0);
                g.rivals[n] = r;
                continue;
            }
            r.staged = 0;
            r.plan_wait = 0;
            r.brain = 0;
            g.emit("rival-launch", r.id, r.id, -1);
        }
        r.plan_wait = (r.plan_wait - 1).max(0);
        r.intent_ticks = (r.intent_ticks - 1).max(0);
        r.defense_cd = (r.defense_cd - 1).max(0);
        r.boost_wait = (r.boost_wait - 1).max(0);
        r.side_v = r.side_v * 88 / 100;
        r.contact_cd = (r.contact_cd - 1).max(0);
        if r.brain == 3
            && actors(g, &r)
                .iter()
                .any(|a| (a.distance - r.distance).abs() < 250)
        {
            r.plan_wait = 0;
            r.intent_ticks = 0;
        }
        if r.plan_wait == 0 && r.stun == 0 && r.hp > 0 {
            let p = plan(g, &r);
            r.target = p.line;
            r.desired_speed = p.speed;
            if p.intent == 3 && r.brain != 3 {
                r.defense_cd = 240;
                r.intent_ticks = 45;
                r.pass_side = 0;
            } else if p.intent == 2 && r.intent_ticks == 0 {
                r.intent_ticks = 60;
                r.pass_side = p.side;
                r.pass_target = p.pass_target;
            }
            r.brain = p.intent;
            r.plan_wait = 8 + (2 - g.difficulty) * 3 + r.id % 3;
        }
        if g.tick % 30 == 0 {
            r.charge = (r.charge + 12).min(900);
        }
        if actors(g, &r).iter().any(|a| {
            !a.wall
                && a.distance - r.distance > 60
                && a.distance - r.distance < 700
                && (a.x - r.x).abs() < 360
        }) {
            r.charge = (r.charge + 3).min(900);
        }
        let bend = curve(r.distance, g.mode);
        if r.stun == 0
            && r.recover == 0
            && r.hp > 0
            && r.boost == 0
            && r.boost_wait == 0
            && r.charge >= 300
            && r.speed > 1100
            && r.brain == 2
            && bend.abs() <= 4
            && r.desired_speed >= r.speed - 100
        {
            r.charge -= 300;
            r.boost = 42 + r.upgrades[2] * 6 + if r.vehicle == 3 { 10 } else { 0 };
            r.boost_wait = 150;
        }
        let target = r.desired_speed + if r.boost > 0 { 250 } else { 0 };
        let error = target - r.speed;
        let brake = if target == 0 {
            100
        } else if error < -25 {
            ((-error - 20) * 2).clamp(0, 100)
        } else {
            0
        };
        let throttle = if brake > 0 || r.stun > 0 || r.hp == 0 {
            0
        } else {
            ((error + 10) * 4).clamp(0, 100)
        };
        let feed = (i64::from(bend) * i64::from((r.speed - 1050).max(0)) * 200000
            / (i64::from(260 + r.upgrades[1] * 45)
                * i64::from(r.speed.max(1))
                * i64::from(TURN[r.vehicle as usize] + r.upgrades[1] * 3)))
            as i32;
        let steering = ((r.target - r.x - r.lateral_v * 4 - r.side_v / 4 * 3) * 32 / 100 + feed)
            .clamp(-100, 100);
        let mut lateral = Lateral {
            steer_v: r.steer_v,
            heading: r.heading,
            lateral_v: r.lateral_v,
            slip_angle: r.slip_angle,
            drifting: r.drifting,
            drift_side: r.drift_side,
        };
        r.x = (r.x
            + driver::steer(
                r.vehicle as usize,
                r.speed,
                if r.stun > 0 { 0 } else { steering },
                0,
                r.upgrades,
                bend,
                r.side_v,
                r.yaw,
                &mut lateral,
            ))
        .clamp(-650, 2650);
        r.steer_v = lateral.steer_v;
        r.heading = lateral.heading;
        r.lateral_v = lateral.lateral_v;
        r.slip_angle = lateral.slip_angle;
        r.drifting = lateral.drifting;
        r.drift_side = lateral.drift_side;
        r.throttle = throttle;
        r.brake = brake;
        (r.speed, r.drive_remainder) = driver::powertrain(
            r.vehicle as usize,
            r.speed,
            r.drive_remainder,
            0,
            throttle,
            brake,
            r.stun,
            r.hp,
            r.boost,
            r.upgrades,
        );
        r.distance = (r.distance + r.speed / 100).max(0);
        if r.stun > 0 || r.hp == 0 || r.recover > 0 {
            r.brain = 5;
        }
        if r.distance >= finish {
            r.distance = finish;
            r.finish = g.tick;
        }
        g.rivals[n] = r;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::game::{Body, Kind};
    fn isolated(id: usize) -> Game {
        let mut g = Game::new(Kind::DriftRun);
        g.distance = -10000;
        for r in &mut g.rivals {
            r.finish = 1;
        }
        let r = &mut g.rivals[id];
        r.finish = 0;
        r.distance = 0;
        r.x = 1000;
        r.speed = 1500;
        r.cooldown = 10000;
        g
    }
    #[test]
    fn braking_stops_before_an_unavoidable_row() {
        let mut g = isolated(0);
        for (id, x) in [0, 1000, 2000].into_iter().enumerate() {
            g.bodies.push(Body {
                id: id as i32,
                x,
                y: g.distance + 830 - 1000,
                vx: 0,
                vy: 0,
                tag: 8,
                life: 0,
                age: 0,
                contact_cd: 0,
            });
        }
        let mut braking = 0;
        for _ in 0..220 {
            g.tick += 1;
            update(&mut g, 135000);
            assert!(g.rivals[0].distance < 975);
            if g.rivals[0].brake > 0 {
                braking += 1;
            }
        }
        assert!(braking > 30);
        assert!(g.rivals[0].speed < 35);
    }
    #[test]
    fn human_pace_does_not_drive_a_distant_rival() {
        let mut a = isolated(0);
        let mut b = a.clone();
        b.distance = -80000;
        b.speed = 2400;
        for _ in 0..180 {
            a.tick += 1;
            b.tick += 1;
            let before = a.rivals[0].distance;
            update(&mut a, 135000);
            update(&mut b, 135000);
            assert_eq!(a.rivals[0], b.rivals[0]);
            assert_eq!(a.rivals[0].distance - before, a.rivals[0].speed / 100);
        }
    }
    #[test]
    fn defensive_commitment_expires_and_cannot_close_an_overlap() {
        let mut g = isolated(1);
        g.difficulty = 1;
        g.distance = -500;
        g.speed = 1800;
        g.drift_x = 300;
        g.tick = 1;
        update(&mut g, 135000);
        assert_eq!(g.rivals[1].brain, 3);
        let line = g.rivals[1].target;
        for _ in 0..20 {
            g.tick += 1;
            g.distance = g.rivals[1].distance - 500;
            update(&mut g, 135000);
            assert_eq!(g.rivals[1].brain, 3);
            assert_eq!(g.rivals[1].target, line);
        }
        g.distance = g.rivals[1].distance - 100;
        g.tick += 1;
        update(&mut g, 135000);
        assert_ne!(g.rivals[1].brain, 3);
        assert!(g.rivals[1].defense_cd > 200);
    }
    #[test]
    fn old_timer_cannot_create_free_nitrous() {
        let mut g = isolated(0);
        let r = &mut g.rivals[0];
        r.charge = 0;
        r.plan_wait = 100;
        r.desired_speed = 1700;
        g.tick = 540;
        update(&mut g, 135000);
        assert_eq!(g.rivals[0].boost, 0);
        let r = &mut g.rivals[0];
        r.charge = 300;
        r.brain = 2;
        r.speed = 1500;
        g.tick += 1;
        update(&mut g, 135000);
        assert!(g.rivals[0].boost > 0);
        assert_eq!(g.rivals[0].charge, 0);
        assert_eq!(g.rivals[0].boost_wait, 150);
    }
    #[test]
    fn leading_ai_receives_shared_traffic() {
        let mut g = isolated(0);
        g.distance = 0;
        g.speed = 0;
        g.rivals[0].distance = 10000;
        g.tick = 136;
        assert_eq!(traffic_spawn_point(&g, 135), Some(13000));
    }
}
