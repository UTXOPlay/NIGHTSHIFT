use crate::game::Game;
#[derive(Clone, Copy)]
pub struct Actor {
    pub id: i32,
    pub x: i32,
    pub distance: i32,
    pub hp: i32,
    pub finish: i32,
    pub recover: i32,
    pub staged: i32,
}
pub fn actor(g: &Game, id: i32) -> Option<Actor> {
    if id == -1 {
        return Some(Actor {
            id,
            x: g.drift_x,
            distance: g.distance,
            hp: g.hull,
            finish: i32::from(g.over),
            recover: g.recover,
            staged: 0,
        });
    }
    g.rivals.iter().find(|r| r.id == id).map(|r| Actor {
        id,
        x: r.x,
        distance: r.distance,
        hp: r.hp,
        finish: r.finish,
        recover: r.recover,
        staged: r.staged,
    })
}
pub fn clear_shot(g: &Game, source: Actor, target: Actor) -> bool {
    let gap = target.distance - source.distance;
    if gap == 0 {
        return false;
    }
    let intersects = |x: i32, d: i32, width: i32| {
        (d - source.distance) * gap.signum() > 20
            && (target.distance - d) * gap.signum() > 20
            && (x - source.x - (target.x - source.x) * (d - source.distance) / gap).abs() < width
    };
    for b in &g.bodies {
        if (b.tag == 1 || b.tag == 8)
            && intersects(
                b.x,
                g.distance + 830 - b.y,
                if b.tag == 8 { 480 } else { 290 },
            )
        {
            return false;
        }
    }
    for r in &g.rivals {
        if r.id != source.id
            && r.id != target.id
            && r.finish == 0
            && intersects(r.x, r.distance, 290)
        {
            return false;
        }
    }
    if source.id != -1 && target.id != -1 && intersects(g.drift_x, g.distance, 290) {
        return false;
    }
    true
}
pub fn forward_shot(g: &Game, source: Actor, target: Actor, range: i32) -> bool {
    target.staged == 0
        && target.finish == 0
        && target.hp > 0
        && target.recover == 0
        && target.distance - source.distance > 30
        && target.distance - source.distance < range
        && (target.x - source.x).abs() < 700
        && clear_shot(g, source, target)
}
