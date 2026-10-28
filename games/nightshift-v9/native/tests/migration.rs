use legacy_v8::{game::Kind as OldKind, session::App as OldApp};
use myelin_nightshift_v9::{
    game::{Body, Game, Kind},
    session::{verify_export, App},
};
use serde_json::{json, Value};
fn request(state: &Value, action: Value) -> Value {
    json!({"session_id":state["session"]["id"],"expected_block":state["session"]["block_hash"],"action":action})
}
#[test]
fn verified_legacy_career_is_a_bound_origin_not_a_reinterpreted_session() {
    let old_dir = tempfile::tempdir().unwrap();
    let new_dir = tempfile::tempdir().unwrap();
    let mut old = OldApp::open(old_dir.path(), OldKind::DriftRun).unwrap();
    let before = old.view().unwrap();
    let old_state = old
        .action(request(
            &before,
            json!({"type":"upgrade","vehicle":0,"choice":1}),
        ))
        .unwrap();
    let proof = old.export().unwrap();
    let mut next = App::open(new_dir.path(), Kind::DriftRun).unwrap();
    let carried = next.migrate_v8(proof.clone()).unwrap();
    assert_eq!(carried["game"]["career"], old_state["game"]["career"]);
    assert_ne!(
        carried["session"]["profile"],
        old_state["session"]["profile"]
    );
    assert_eq!(carried["game"]["physics_version"], 9);
    assert_eq!(next.migrate_v8(proof.clone()).unwrap(), carried);
    let upgraded = next
        .action(request(
            &carried,
            json!({"type":"upgrade","vehicle":0,"choice":0}),
        ))
        .unwrap();
    assert_eq!(upgraded["game"]["career"]["credits"], 0);
    let export = next.export().unwrap();
    assert_eq!(verify_export(&export).unwrap()["verified"], true);
    assert!(legacy_v8::session::verify_export(&export).is_err());
    assert!(verify_export(&proof).is_err());
    let mut tampered = export.clone();
    tampered["origin"]["authority"] = json!("00".repeat(33));
    assert!(verify_export(&tampered).is_err());
    drop(next);
    let recovered = App::open(new_dir.path(), Kind::DriftRun).unwrap();
    assert_eq!(recovered.view().unwrap(), upgraded);
    assert_eq!(recovered.export().unwrap()["origin"], proof);
    assert_eq!(
        legacy_v8::session::verify_export(&old.export().unwrap()).unwrap()["verified"],
        true
    );
}
#[test]
fn braking_stops_boost_and_reverse_backs_out_without_phantom_forward_motion() {
    let mut g = Game::new(Kind::DriftRun);
    for r in &mut g.rivals {
        r.finish = 1;
    }
    g.distance = 5000;
    g.speed = 2200;
    g.ability_ticks = 90;
    for _ in 0..100 {
        g.step(8);
    }
    assert_eq!(g.speed, 0);
    assert_eq!(g.ability_ticks, 0);
    let stopped = g.distance;
    for _ in 0..30 {
        g.step(8);
    }
    assert_eq!(g.distance, stopped);
    for _ in 0..35 {
        g.step(4);
    }
    assert!(g.speed < 0);
    assert!(g.distance < stopped);
}
#[test]
fn grazing_exchanges_momentum_but_a_heavy_unprotected_front_hit_ends_the_event() {
    let body = |x, y, vy| Body {
        id: 1,
        contact_cd: 0,
        x,
        y,
        vx: 0,
        vy,
        tag: 1,
        life: 0,
        age: 0,
    };
    let mut side = Game::new(Kind::DriftRun);
    for r in &mut side.rivals {
        r.finish = 1;
    }
    side.shield = 0;
    side.speed = 1660;
    side.steer_v = 70;
    side.bodies.push(body(1500, 830, 16));
    side.step(2);
    assert!(!side.over);
    assert_eq!(side.shield, 0);
    assert_eq!(side.bodies[0].tag, 1);
    assert!(side.side_v < 0);
    let mut front = Game::new(Kind::DriftRun);
    for r in &mut front.rivals {
        r.finish = 1;
    }
    front.shield = 0;
    front.speed = 2200;
    front.bodies.push(body(1000, 790, 0));
    front.step(0);
    assert!(front.over);
    assert_eq!(front.finish_reason, 2);
    assert_eq!(front.bodies[0].tag, 1);
}
