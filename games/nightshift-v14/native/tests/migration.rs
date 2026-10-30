use legacy_v9::{game::Kind as OldKind, session::App as OldApp};
use myelin_nightshift_v14::{
    game::Kind,
    session::{verify_export, App},
};
use serde_json::{json, Value};
fn migrated_career(old: &Value, version: i32) -> Value {
    let mut expected = old.clone();
    let best = expected["spec_best"].as_i64().unwrap_or(0);
    expected["spec_best"] = json!(0);
    expected["legacy_spec_best"] = json!(best);
    expected["legacy_spec_version"] = json!(version);
    expected["unlocked"] = json!(7);
    expected["sector_bests"] = json!(vec![0; 12]);
    let mut tunes = old["upgrades"].clone();
    for row in tunes.as_array_mut().unwrap() {
        while row
            .as_array()
            .unwrap()
            .iter()
            .map(|x| x.as_i64().unwrap())
            .sum::<i64>()
            > 6
        {
            for n in (0..3).rev() {
                if row
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|x| x.as_i64().unwrap())
                    .sum::<i64>()
                    <= 6
                {
                    break;
                }
                let value = row[n].as_i64().unwrap();
                if value > 0 {
                    row[n] = json!(value - 1);
                }
            }
        }
    }
    expected["tunes"] = tunes;
    let mut first = 0;
    let mut chapters = 0;
    for n in 0..12 {
        if old["medals"][n].as_i64().unwrap() > 0 {
            first |= 1 << n;
        }
    }
    for c in 0..3 {
        if (c * 4..c * 4 + 4)
            .filter(|n| old["medals"][*n].as_i64().unwrap() > 0)
            .count()
            >= 3
        {
            chapters |= 1 << c;
        }
    }
    expected["first_clears"] = json!(first);
    expected["chapter_claims"] = json!(chapters);
    expected
}
fn command(app: &mut App, action: Value) -> Value {
    let s = app.view().unwrap();
    app.action(json!({"session_id":s["session"]["id"],"expected_block":s["session"]["block_hash"],"action":action})).unwrap()
}

#[test]
fn v13_origin_retains_licenses_inactive_purchased_parts_and_signed_history() {
    let a = tempfile::tempdir().unwrap();
    let b = tempfile::tempdir().unwrap();
    let mut old =
        legacy_v13::session::App::open(a.path(), legacy_v13::game::Kind::DriftRun).unwrap();
    for action in [
        json!({"type":"upgrade","vehicle":0,"choice":1}),
        json!({"type":"tune","vehicle":0,"levels":[0,0,0]}),
    ] {
        let state = old.view().unwrap();
        old.action(json!({"session_id":state["session"]["id"],"expected_block":state["session"]["block_hash"],"action":action})).unwrap();
    }
    let old_state = old.view().unwrap();
    let proof = old.export().unwrap();
    let mut next = App::open(b.path(), Kind::DriftRun).unwrap();
    let migrated = next.migrate_legacy(proof.clone()).unwrap();
    assert_eq!(migrated["game"]["career"], old_state["game"]["career"]);
    assert_eq!(migrated["game"]["career"]["unlocked"], 1);
    assert_eq!(migrated["game"]["career"]["upgrades"][0], json!([0, 1, 0]));
    assert_eq!(migrated["game"]["career"]["tunes"][0], json!([0, 0, 0]));
    assert_eq!(migrated["game"]["physics_version"], 14);
    command(
        &mut next,
        json!({"type":"race","mode":3,"vehicle":0,"gadget":0,"difficulty":0}),
    );
    command(
        &mut next,
        json!({"type":"ticks","inputs":vec![myelin_nightshift_v14::game::pack_input(0,0,0,100);120]}),
    );
    let export = next.export().unwrap();
    assert_eq!(verify_export(&export).unwrap()["verified"], true);
    assert!(legacy_v13::session::verify_export(&export).is_err());
    assert_eq!(export["origin"], proof);
    let mut bad = export.clone();
    bad["origin"]["authority"] = json!("00".repeat(33));
    assert!(verify_export(&bad).is_err());
    let final_state = next.view().unwrap();
    drop(next);
    assert_eq!(
        App::open(b.path(), Kind::DriftRun).unwrap().view().unwrap(),
        final_state
    );
    assert_eq!(old.view().unwrap(), old_state);
    assert_eq!(old.export().unwrap(), proof);
}

#[test]
fn nested_v12_v13_origin_retains_historical_record_provenance() {
    let a = tempfile::tempdir().unwrap();
    let b = tempfile::tempdir().unwrap();
    let c = tempfile::tempdir().unwrap();
    let mut v12 =
        legacy_v12::session::App::open(a.path(), legacy_v12::game::Kind::DriftRun).unwrap();
    let state = v12.view().unwrap();
    v12.action(json!({"session_id":state["session"]["id"],"expected_block":state["session"]["block_hash"],"action":{"type":"upgrade","vehicle":0,"choice":1}})).unwrap();
    let original = v12.export().unwrap();
    let mut v13 =
        legacy_v13::session::App::open(b.path(), legacy_v13::game::Kind::DriftRun).unwrap();
    v13.migrate_legacy(original.clone()).unwrap();
    let state = v13.view().unwrap();
    v13.action(json!({"session_id":state["session"]["id"],"expected_block":state["session"]["block_hash"],"action":{"type":"tune","vehicle":0,"levels":[0,0,0]}})).unwrap();
    let old_state = v13.view().unwrap();
    let mut v14 = App::open(c.path(), Kind::DriftRun).unwrap();
    let state = v14.migrate_legacy(v13.export().unwrap()).unwrap();
    assert_eq!(state["game"]["career"], old_state["game"]["career"]);
    assert_eq!(state["game"]["career"]["legacy_spec_version"], 12);
    let export = v14.export().unwrap();
    assert_eq!(export["origin"]["origin"], original);
    assert_eq!(verify_export(&export).unwrap()["verified"], true);
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
    let expected = migrated_career(&old_state["game"]["career"], 9);
    assert_eq!(migrated["game"]["career"], expected);
    assert_ne!(
        migrated["session"]["profile"],
        old_state["session"]["profile"]
    );
    assert_eq!(migrated["game"]["physics_version"], 14);
    assert_eq!(next.migrate_legacy(proof.clone()).unwrap(), migrated);
    let state = command(
        &mut next,
        json!({"type":"race","mode":1,"vehicle":0,"gadget":1,"difficulty":0}),
    );
    assert_eq!(state["game"]["career"]["credits"], 650);
    command(
        &mut next,
        json!({"type":"ticks","inputs":vec![myelin_nightshift_v14::game::pack_input(0,0,0,100);120]}),
    );
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
    let expected = migrated_career(&carried["game"]["career"], 9);
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
    let expected = migrated_career(&old.view().unwrap()["game"]["career"], 10);
    assert_eq!(new["game"]["career"], expected);
    command(
        &mut next,
        json!({"type":"race","mode":0,"vehicle":0,"gadget":0,"difficulty":0,"spec":1}),
    );
    command(
        &mut next,
        json!({"type":"ticks","inputs":vec![myelin_nightshift_v14::game::pack_input(0,0,0,100);3]}),
    );
    let export = next.export().unwrap();
    assert_eq!(export["origin"], proof);
    assert_eq!(verify_export(&export).unwrap()["verified"], true);
    assert!(legacy_v10::session::verify_export(&export).is_err());
}

#[test]
fn v11_live_race_origin_is_verified_and_frozen() {
    let old_dir = tempfile::tempdir().unwrap();
    let next_dir = tempfile::tempdir().unwrap();
    let mut old =
        legacy_v11::session::App::open(old_dir.path(), legacy_v11::game::Kind::DriftRun).unwrap();
    let before = old.view().unwrap();
    old.action(json!({"session_id":before["session"]["id"],"expected_block":before["session"]["block_hash"],"action":{"type":"upgrade","vehicle":0,"choice":1}})).unwrap();
    let before = old.view().unwrap();
    old.action(json!({"session_id":before["session"]["id"],"expected_block":before["session"]["block_hash"],"action":{"type":"ticks","inputs":[4207104,4207104]}})).unwrap();
    let proof = old.export().unwrap();
    let old_state = old.view().unwrap();
    let mut next = App::open(next_dir.path(), Kind::DriftRun).unwrap();
    let migrated = next.migrate_legacy(proof.clone()).unwrap();
    assert_eq!(
        migrated["game"]["career"],
        migrated_career(&old_state["game"]["career"], 11)
    );
    assert_eq!(migrated["game"]["physics_version"], 14);
    assert_eq!(migrated["game"]["speed"], 0);
    assert_eq!(old.view().unwrap(), old_state);
    command(
        &mut next,
        json!({"type":"race","mode":0,"vehicle":0,"gadget":0,"difficulty":0}),
    );
    command(
        &mut next,
        json!({"type":"ticks","inputs":vec![myelin_nightshift_v14::game::pack_input(0,0,0,100);120]}),
    );
    let export = next.export().unwrap();
    assert_eq!(export["origin"], proof);
    assert_eq!(verify_export(&export).unwrap()["verified"], true);
    assert!(legacy_v11::session::verify_export(&export).is_err());
    assert!(verify_export(&proof).is_err());
    let mut forged = export.clone();
    forged["origin"]["authority"] = json!("00".repeat(33));
    assert!(verify_export(&forged).is_err());
    let final_state = next.view().unwrap();
    drop(next);
    assert_eq!(
        App::open(next_dir.path(), Kind::DriftRun)
            .unwrap()
            .view()
            .unwrap(),
        final_state
    );
}

#[test]
fn v12_pedals_and_historical_pb_are_preserved_as_an_original_proof() {
    let a = tempfile::tempdir().unwrap();
    let b = tempfile::tempdir().unwrap();
    let mut old =
        legacy_v12::session::App::open(a.path(), legacy_v12::game::Kind::DriftRun).unwrap();
    let before = old.view().unwrap();
    old.action(json!({"session_id":before["session"]["id"],"expected_block":before["session"]["block_hash"],"action":{"type":"upgrade","vehicle":0,"choice":1}})).unwrap();
    let before = old.view().unwrap();
    old.action(json!({"session_id":before["session"]["id"],"expected_block":before["session"]["block_hash"],"action":{"type":"ticks","inputs":vec![legacy_v12::game::pack_input(0,0,0,100);120]}})).unwrap();
    let old_state = old.view().unwrap();
    let proof = old.export().unwrap();
    let mut next = App::open(b.path(), Kind::DriftRun).unwrap();
    let current = next.migrate_legacy(proof.clone()).unwrap();
    assert_eq!(
        current["game"]["career"],
        migrated_career(&old_state["game"]["career"], 12)
    );
    assert_eq!(current["game"]["physics_version"], 14);
    assert_eq!(old.view().unwrap(), old_state);
    assert_eq!(old.export().unwrap(), proof);
    command(
        &mut next,
        json!({"type":"tune","vehicle":0,"levels":[0,1,0]}),
    );
    let export = next.export().unwrap();
    assert_eq!(export["origin"], proof);
    assert_eq!(verify_export(&export).unwrap()["verified"], true);
    assert!(legacy_v12::session::verify_export(&export).is_err());
    let mut bad = export.clone();
    bad["origin"]["authority"] = json!("00".repeat(33));
    assert!(verify_export(&bad).is_err());
    let saved = next.view().unwrap();
    drop(next);
    assert_eq!(
        App::open(b.path(), Kind::DriftRun).unwrap().view().unwrap(),
        saved
    );
}
