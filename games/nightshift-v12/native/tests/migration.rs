use legacy_v9::{game::Kind as OldKind, session::App as OldApp};
use myelin_nightshift_v12::{
    game::Kind,
    session::{verify_export, App},
};
use serde_json::{json, Value};
fn command(app: &mut App, action: Value) -> Value {
    let s = app.view().unwrap();
    app.action(json!({"session_id":s["session"]["id"],"expected_block":s["session"]["block_hash"],"action":action})).unwrap()
}

#[test]
fn v9_career_is_verified_as_an_origin_and_never_reinterpreted() {
    let a = tempfile::tempdir().unwrap();
    let b = tempfile::tempdir().unwrap();
    let mut old = OldApp::open(a.path(), OldKind::DriftRun).unwrap();
    let s = old.view().unwrap();
    let old_state=old.action(json!({"session_id":s["session"]["id"],"expected_block":s["session"]["block_hash"],"action":{"type":"upgrade","vehicle":0,"choice":1}})).unwrap();
    let proof = old.export().unwrap();
    let mut next = App::open(b.path(), Kind::DriftRun).unwrap();
    let migrated = next.migrate_legacy(proof.clone()).unwrap();
    let mut expected = old_state["game"]["career"].clone();
    expected["spec_best"] = json!(0);
    assert_eq!(migrated["game"]["career"], expected);
    assert_ne!(
        migrated["session"]["profile"],
        old_state["session"]["profile"]
    );
    assert_eq!(migrated["game"]["physics_version"], 12);
    assert_eq!(next.migrate_legacy(proof.clone()).unwrap(), migrated);
    let state = command(
        &mut next,
        json!({"type":"race","mode":1,"vehicle":0,"gadget":1,"difficulty":0}),
    );
    assert_eq!(state["game"]["career"]["credits"], 650);
    command(&mut next, json!({"type":"ticks","inputs":vec![myelin_nightshift_v12::game::pack_input(0,0,0,100);120]}));
    let export = next.export().unwrap();
    assert_eq!(verify_export(&export).unwrap()["verified"], true);
    assert!(legacy_v9::session::verify_export(&export).is_err());
    assert!(verify_export(&proof).is_err());
    let mut tampered = export.clone();
    tampered["origin"]["authority"] = json!("00".repeat(33));
    assert!(verify_export(&tampered).is_err());
    assert_eq!(old.view().unwrap(), old_state);
    assert_eq!(old.export().unwrap(), proof);
    let final_state = next.view().unwrap();
    drop(next);
    let recovered = App::open(b.path(), Kind::DriftRun).unwrap();
    assert_eq!(recovered.view().unwrap(), final_state);
    assert_eq!(recovered.export().unwrap()["origin"], proof);
}

#[test]
fn a_v8_origin_carried_by_v9_remains_verified_through_v10() {
    let a = tempfile::tempdir().unwrap();
    let b = tempfile::tempdir().unwrap();
    let c = tempfile::tempdir().unwrap();
    let mut v8 = legacy_v8::session::App::open(a.path(), legacy_v8::game::Kind::DriftRun).unwrap();
    let s = v8.view().unwrap();
    v8.action(json!({"session_id":s["session"]["id"],"expected_block":s["session"]["block_hash"],"action":{"type":"upgrade","vehicle":0,"choice":1}})).unwrap();
    let original = v8.export().unwrap();
    let mut v9 = OldApp::open(b.path(), OldKind::DriftRun).unwrap();
    let carried = v9.migrate_v8(original.clone()).unwrap();
    let mut v10 = App::open(c.path(), Kind::DriftRun).unwrap();
    let migrated = v10.migrate_legacy(v9.export().unwrap()).unwrap();
    let mut expected = carried["game"]["career"].clone();
    expected["spec_best"] = json!(0);
    assert_eq!(migrated["game"]["career"], expected);
    let export = v10.export().unwrap();
    assert_eq!(export["origin"]["origin"], original);
    assert_eq!(verify_export(&export).unwrap()["verified"], true);
}

#[test]
fn v10_origin_and_nested_prior_origins_are_preserved() {
    let a = tempfile::tempdir().unwrap();
    let b = tempfile::tempdir().unwrap();
    let mut old =
        legacy_v10::session::App::open(a.path(), legacy_v10::game::Kind::DriftRun).unwrap();
    let s = old.view().unwrap();
    old.action(json!({"session_id":s["session"]["id"],"expected_block":s["session"]["block_hash"],"action":{"type":"upgrade","vehicle":0,"choice":1}})).unwrap();
    let proof = old.export().unwrap();
    let mut next = App::open(b.path(), Kind::DriftRun).unwrap();
    let new = next.migrate_legacy(proof.clone()).unwrap();
    let mut expected = old.view().unwrap()["game"]["career"].clone();
    expected["spec_best"] = json!(0);
    assert_eq!(new["game"]["career"], expected);
    command(
        &mut next,
        json!({"type":"race","mode":0,"vehicle":0,"gadget":0,"difficulty":0,"spec":1}),
    );
    command(&mut next, json!({"type":"ticks","inputs":vec![myelin_nightshift_v12::game::pack_input(0,0,0,100);3]}));
    let export = next.export().unwrap();
    assert_eq!(export["origin"], proof);
    assert_eq!(verify_export(&export).unwrap()["verified"], true);
    assert!(legacy_v10::session::verify_export(&export).is_err());
}

#[test]
fn v11_live_race_origin_is_verified_and_frozen() {
 let old_dir=tempfile::tempdir().unwrap();let next_dir=tempfile::tempdir().unwrap();
 let mut old=legacy_v11::session::App::open(old_dir.path(),legacy_v11::game::Kind::DriftRun).unwrap();
 let before=old.view().unwrap();
 old.action(json!({"session_id":before["session"]["id"],"expected_block":before["session"]["block_hash"],"action":{"type":"upgrade","vehicle":0,"choice":1}})).unwrap();
 let before=old.view().unwrap();
 old.action(json!({"session_id":before["session"]["id"],"expected_block":before["session"]["block_hash"],"action":{"type":"ticks","inputs":[4207104,4207104]}})).unwrap();
 let proof=old.export().unwrap();let old_state=old.view().unwrap();
 let mut next=App::open(next_dir.path(),Kind::DriftRun).unwrap();let migrated=next.migrate_legacy(proof.clone()).unwrap();
 assert_eq!(migrated["game"]["career"],old_state["game"]["career"]);assert_eq!(migrated["game"]["physics_version"],12);
 assert_eq!(migrated["game"]["speed"],0);assert_eq!(old.view().unwrap(),old_state);
 command(&mut next,json!({"type":"race","mode":0,"vehicle":0,"gadget":0,"difficulty":0}));
 command(&mut next,json!({"type":"ticks","inputs":vec![myelin_nightshift_v12::game::pack_input(0,0,0,100);120]}));
 let export=next.export().unwrap();assert_eq!(export["origin"],proof);assert_eq!(verify_export(&export).unwrap()["verified"],true);
 assert!(legacy_v11::session::verify_export(&export).is_err());assert!(verify_export(&proof).is_err());
 let mut forged=export.clone();forged["origin"]["authority"]=json!("00".repeat(33));assert!(verify_export(&forged).is_err());
 let final_state=next.view().unwrap();drop(next);assert_eq!(App::open(next_dir.path(),Kind::DriftRun).unwrap().view().unwrap(),final_state);
}
