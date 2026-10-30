//! Shared deterministic driver model. Mirrored by nightshift14-drive.mjs.
pub const SPEED: [i32; 6] = [1660, 1600, 1570, 1810, 1720, 1690];
pub const TURN: [i32; 6] = [70, 86, 62, 72, 78, 68];
const POWER: [i32; 6] = [12, 13, 10, 14, 16, 11];
const BRAKES: [i32; 6] = [13, 14, 12, 15, 16, 13];

pub fn powertrain(
    vehicle: usize,
    speed: i32,
    remainder: i32,
    flags: u32,
    throttle: i32,
    brake: i32,
    stun: i32,
    integrity: i32,
    boost: i32,
    up: [i32; 3],
) -> (i32, i32) {
    let top = SPEED[vehicle] + up[0] * 70;
    let absolute = speed.abs();
    let reverse = flags & 4 != 0;
    let handbrake = flags & 8 != 0;
    let direction = if reverse { -1 } else { 1 };
    let mut gas = throttle;
    let mut foot = brake;
    if speed * direction < 0 {
        foot = foot.max(gas);
        gas = 0;
    }
    if stun > 0 || integrity == 0 || foot > 0 || handbrake {
        gas = 0;
    }
    let power = POWER[vehicle] + up[0];
    let limit = if reverse { 350 } else { top };
    let motor = power * gas * (100 - absolute * 60 / limit).max(25) / 100 * direction;
    let drag = if absolute > 0 {
        60 + ((i64::from(power * 40 - 60) * i64::from(absolute) * i64::from(absolute))
            / i64::from(top * top)) as i32
    } else {
        0
    };
    let force = motor
        + if boost > 0 && gas > 0 && !reverse {
            1100
        } else {
            0
        }
        - speed.signum()
            * (drag
                + BRAKES[vehicle] * foot
                + if handbrake { 450 } else { 0 }
                + if stun > 0 { 350 } else { 0 });
    let residual = remainder + force;
    let delta = residual / 100;
    let mut remainder = residual - delta * 100;
    let next = speed + delta;
    let mut result = next.clamp(-350, 2500);
    if speed != 0 && next.signum() != speed.signum() {
        result = 0;
        remainder = 0;
    }
    if result == 0 && (foot > 0 || handbrake || gas == 0) {
        remainder = 0;
    }
    (result, remainder)
}

#[derive(Clone, Default)]
pub struct Lateral {
    pub steer_v: i32,
    pub heading: i32,
    pub lateral_v: i32,
    pub slip_angle: i32,
    pub drifting: i32,
    pub drift_side: i32,
}
pub fn steer(
    vehicle: usize,
    speed: i32,
    demand: i32,
    flags: u32,
    up: [i32; 3],
    bend: i32,
    side_v: i32,
    yaw: i32,
    s: &mut Lateral,
) -> i32 {
    let drift = flags & 8 != 0 && demand.abs() > 4 && speed >= 850;
    if !drift {
        s.drift_side = 0;
    } else if (s.drift_side == 0 || s.drift_side * demand < 0 && demand.abs() > 65)
        && demand.abs() > 4
    {
        s.drift_side = demand.signum();
    }
    let desired = (TURN[vehicle] + up[1] * 3 + if drift { 12 } else { 0 }) * demand / 100;
    let response = if vehicle == 1 {
        38
    } else if vehicle == 2 {
        24
    } else {
        32
    };
    let delta = desired - s.steer_v;
    s.steer_v += delta.signum() * delta.abs().min((delta.abs() * response / 100).max(1));
    s.heading +=
        (s.steer_v * 2 + if drift { s.drift_side * 220 } else { 0 } - s.heading).clamp(-42, 42);
    let lv = s.steer_v * speed / 2000 - s.lateral_v;
    let grip = if drift {
        18 + up[1] * 2
    } else {
        43 + up[1] * 3
    };
    s.lateral_v += lv.signum() * lv.abs().min((lv.abs() * grip / 100).max(1));
    s.slip_angle = if speed > 500 {
        s.heading - s.lateral_v * 4000 / speed
    } else {
        0
    };
    s.drifting = i32::from(speed >= 850 && s.slip_angle.abs() >= 60 && s.heading.abs() >= 80);
    let slip = -bend * (speed - 1050).max(0) / (260 + up[1] * 45 + if drift { 100 } else { 0 });
    s.lateral_v + slip + side_v / 4 + yaw * speed / 4000
}
