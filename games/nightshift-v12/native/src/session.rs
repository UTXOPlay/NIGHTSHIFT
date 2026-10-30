use crate::game::{Game, Kind, ID, MAX_ACTIONS};
use myelin_consensus::{
    Authority, CommitteeSigner, ConsensusKind, ConsensusModuleDescriptor, FinalityProof,
    MyelinBlock, ProofOfAuthority, ProofOfAuthorityConfig, SelectedConsensus,
};
use myelin_session::*;
use myelin_session_store_rocksdb::RocksSessionStore;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::{
    fs,
    io::Write,
    path::{Path, PathBuf},
    sync::Arc,
};

pub type AnyResult<T> = std::result::Result<T, Box<dyn std::error::Error + Send + Sync>>;
fn hash(bytes: &[u8]) -> Hash32 {
    *blake3::hash(bytes).as_bytes()
}
fn random() -> AnyResult<Hash32> {
    let mut b = [0; 32];
    getrandom::getrandom(&mut b).map_err(|e| e.to_string())?;
    Ok(b)
}
fn atomic(path: &Path, bytes: &[u8]) -> AnyResult<()> {
    let mut f = tempfile::NamedTempFile::new_in(path.parent().ok_or("missing parent")?)?;
    f.write_all(bytes)?;
    f.as_file().sync_all()?;
    f.persist(path)?;
    #[cfg(unix)]
    fs::File::open(path.parent().unwrap())?.sync_all()?;
    Ok(())
}
#[derive(Clone)]
struct Verifier(SelectedConsensus);
impl FinalityVerifier for Verifier {
    fn descriptor(&self) -> ConsensusModuleDescriptor {
        self.0.module_descriptor()
    }
    fn verify(
        &self,
        block: &MyelinBlock,
        proof: &FinalityProof,
    ) -> std::result::Result<VerifiedFinality, myelin_consensus::ConsensusError> {
        let f = self.0.finalise_with_proof(block.clone(), proof.clone())?;
        Ok(VerifiedFinality {
            block_hash: f.block_hash,
            consensus_module_commitment: self.0.module_commitment(),
        })
    }
}
fn verifier(public: [u8; 33]) -> AnyResult<Arc<Verifier>> {
    Ok(Arc::new(Verifier(SelectedConsensus::ProofOfAuthority(
        ProofOfAuthority::new(ProofOfAuthorityConfig {
            authorities: vec![Authority {
                id: ID.into(),
                public_key: public,
            }],
        })?,
    ))))
}
#[derive(Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct Executor {
    origin: Option<Hash32>,
    game: Game,
    actions: u64,
}
impl Executor {
    fn new(kind: Kind) -> Self {
        Self {
            origin: None,
            game: Game::new(kind),
            actions: 0,
        }
    }
    fn migrated(kind: Kind, origin: &Value) -> AnyResult<Self> {
        let old = verified_legacy_game(origin)?;
        let mut executor = Self::new(kind);
        executor.game.career = serde_json::from_value(old["career"].clone())?;
        executor.game.race_id = old["race_id"].as_i64().ok_or("Invalid legacy race_id")? as i32;
        executor.game.vehicle = old["vehicle"].as_i64().ok_or("Invalid legacy vehicle")? as i32;
        executor.game.mode = old["mode"].as_i64().ok_or("Invalid legacy mode")? as i32;
        executor.game.gadget = old["gadget"].as_i64().ok_or("Invalid legacy gadget")? as i32;
        executor.game.difficulty = old["difficulty"]
            .as_i64()
            .ok_or("Invalid legacy difficulty")? as i32;
        executor.game.validate()?;
        executor.origin = Some(hash(&serde_json::to_vec(origin)?));
        Ok(executor)
    }
    fn restore(bytes: &[u8]) -> myelin_session::Result<Self> {
        let e: Self =
            serde_json::from_slice(bytes).map_err(|e| SessionError::Execution(e.to_string()))?;
        e.game.validate().map_err(SessionError::Execution)?;
        if e.actions > MAX_ACTIONS {
            return Err(SessionError::Execution("Action limit".into()));
        }
        Ok(e)
    }
}
impl TransitionExecutor for Executor {
    fn state_root(&self) -> Hash32 {
        hash(&self.snapshot().expect("serializable game"))
    }
    fn snapshot(&self) -> std::result::Result<Vec<u8>, String> {
        serde_json::to_vec(self).map_err(|e| e.to_string())
    }
    fn execute_block(
        &mut self,
        height: u64,
        frame: &FrameInput,
        handoffs: &[SessionHandoff],
        txs: &[Vec<u8>],
    ) -> std::result::Result<ExecutionOutcome, String> {
        if !txs.is_empty()
            || !handoffs.is_empty()
            || height != self.actions
            || frame.start_position != self.actions
            || frame.end_position != self.actions + 1
            || frame.logical_time_start != self.actions
            || frame.logical_time_end != self.actions + 1
            || self.actions >= MAX_ACTIONS
        {
            return Err("Invalid application frame".into());
        }
        let action: Value = serde_json::from_slice(&frame.payload).map_err(|e| e.to_string())?;
        self.game.apply(&action)?;
        self.actions += 1;
        // Host-side application execution. No CKB scripts are executed; never invent VM cycles.
        Ok(ExecutionOutcome {
            ordered_cell_tx_commitments: vec![],
            data_commitments: vec![self.state_root()],
            outbox: vec![],
            cycles: 0,
        })
    }
}
pub fn profile(kind: Kind) -> ApplicationProfile {
    let mut program = blake3::Hasher::new();
    for b in [
        include_bytes!("../../../nightshift-v10/native/src/game.rs").as_slice(),
        include_bytes!("../../../nightshift-v10/native/src/session.rs").as_slice(),
        include_bytes!("../../../nightshift-v10/native/src/main.rs").as_slice(),
        include_bytes!("../../../nightshift-v10/native/src/lib.rs").as_slice(),
        include_bytes!("../../../nightshift-v10/native/Cargo.lock").as_slice(),
        include_bytes!("../../../nightshift-v11/native/src/game.rs").as_slice(),
        include_bytes!("../../../nightshift-v11/native/src/session.rs").as_slice(),
        include_bytes!("../../../nightshift-v11/native/src/main.rs").as_slice(),
        include_bytes!("../../../nightshift-v11/native/src/lib.rs").as_slice(),
        include_bytes!("../../../nightshift-v11/native/Cargo.lock").as_slice(),
        include_bytes!("../../../nightshift-v11/native/Cargo.toml").as_slice(),
        include_bytes!("game.rs").as_slice(),
        include_bytes!("session.rs").as_slice(),
        include_bytes!("../Cargo.lock").as_slice(),
        include_bytes!("main.rs").as_slice(),
        include_bytes!("lib.rs").as_slice(),
        include_bytes!("../Cargo.toml").as_slice(),
        include_bytes!("../../../nightshift-v9/native/Cargo.toml").as_slice(),
        include_bytes!("../../../nightshift-v9/native/Cargo.lock").as_slice(),
        include_bytes!("../../../nightshift-v9/native/src/game.rs").as_slice(),
        include_bytes!("../../../nightshift-v9/native/src/session.rs").as_slice(),
        include_bytes!("../../../nightshift-v9/native/src/main.rs").as_slice(),
        include_bytes!("../../../nightshift-v9/native/src/lib.rs").as_slice(),
        include_bytes!("../../../nightshift-v8/native/Cargo.toml").as_slice(),
        include_bytes!("../../../arcade/web/nightshift9-courses.json").as_slice(),
        include_bytes!("../../../nightshift-v8/native/src/game.rs").as_slice(),
        include_bytes!("../../../nightshift-v8/native/src/session.rs").as_slice(),
        include_bytes!("../../../nightshift-v8/native/src/lib.rs").as_slice(),
        include_bytes!("../../../nightshift-v8/native/Cargo.lock").as_slice(),
    ] {
        program.update(b);
    }
    ApplicationProfile {
        command_identity_required: false,
        application_id: format!("{ID}/{}", kind.id()),
        program_digest: *program.finalize().as_bytes(),
        input_schema_hash: hash(b"nightshift-v12-quantized-analogue-grip-and-sector-style-v1"),
        state_codec_hash: hash(b"nightshift-v12-grip-sectors-spec-origin-career-v1-json"),
        logical_time_policy_hash: hash(b"one-accepted-action-one-logical-tick"),
        entropy_policy_hash: hash(b"park-miller-fixed-seed-73129"),
        vm: ApplicationVmProfile {
            spawn_ipc_required: false,
        },
        resources: ApplicationResourceEnvelope {
            max_frame_inputs: 1,
            max_frame_input_bytes: 4096,
            max_frame_cycles: 1,
            max_logical_time_span: 1,
            max_inspect_query_bytes: 1024,
            max_inspect_result_bytes: 1000000,
        },
        court_profile_hash: hash(b"host-replay-only-no-ckb-court-or-settlement"),
        handoff_policy_hash: hash(b"no-handoffs"),
    }
}
type Chain = SessionChain<Executor, RocksSessionStore>;
pub struct App {
    chain: Chain,
    store: Arc<RocksSessionStore>,
    signer: CommitteeSigner,
    verifier: Arc<Verifier>,
    kind: Kind,
    dir: PathBuf,
    origin: Option<Value>,
}
impl App {
    pub fn open(dir: &Path, kind: Kind) -> AnyResult<Self> {
        fs::create_dir_all(dir)?;
        let store = Arc::new(RocksSessionStore::open(dir.join("sessions"))?);
        let key_path = dir.join("authority.key");
        let key = if key_path.exists() {
            fs::read(&key_path)?
                .try_into()
                .map_err(|_| "Invalid authority key")?
        } else {
            let k = random()?;
            atomic(&key_path, &k)?;
            k
        };
        let signer = CommitteeSigner::new(ID, key)?;
        let verifier = verifier(signer.ckb_public_key())?;
        let active = dir.join("active");
        let chain = if active.exists() {
            let id: Hash32 = hex::decode(fs::read_to_string(&active)?.trim())?
                .try_into()
                .map_err(|_| "Invalid session id")?;
            let audit =
                Chain::audit_recovery(id, &profile(kind), verifier.as_ref(), store.as_ref())?;
            let executor = Executor::restore(audit.state_snapshot())?;
            let chain = Chain::recover_audited(
                audit,
                &profile(kind),
                verifier.clone(),
                executor,
                store.clone(),
            )?;
            if let Some(end) = chain.head().finalised_height {
                chain.replay_range(0, end, Executor::restore)?;
            }
            chain
        } else {
            Self::create(store.clone(), verifier.clone(), dir, kind, None)?
        };
        let origin_path = dir.join(format!(
            "origin-{}.json",
            hex::encode(chain.head().session_id)
        ));
        let origin = if origin_path.exists() {
            Some(serde_json::from_slice::<Value>(&fs::read(origin_path)?)?)
        } else {
            None
        };
        let initial = if let Some(ref proof) = origin {
            Executor::migrated(kind, proof)?
        } else {
            Executor::new(kind)
        };
        if initial.state_root() != chain.config().initial_state_root {
            return Err("Career origin does not match genesis".into());
        }
        Ok(Self {
            dir: dir.to_path_buf(),
            origin,
            chain,
            store,
            signer,
            verifier,
            kind,
        })
    }
    fn create(
        store: Arc<RocksSessionStore>,
        verifier: Arc<Verifier>,
        dir: &Path,
        kind: Kind,
        origin: Option<&Value>,
    ) -> AnyResult<Chain> {
        let executor = if let Some(proof) = origin {
            Executor::migrated(kind, proof)?
        } else {
            Executor::new(kind)
        };
        let id = random()?;
        if let Some(proof) = origin {
            atomic(
                &dir.join(format!("origin-{}.json", hex::encode(id))),
                &serde_json::to_vec(proof)?,
            )?;
        }
        let d = verifier.descriptor();
        let config = SessionConfig {
            session_id: id,
            consensus_kind: ConsensusKind::ProofOfAuthority,
            consensus_config_commitment: d.config_commitment,
            consensus_module_commitment: d.commitment(),
            consensus_wal_schema_hash: d.wal_schema_hash,
            application_profile: profile(kind),
            initial_state_root: executor.state_root(),
            initial_input_position: 0,
            initial_logical_time: 0,
            initial_timestamp_ms: 0,
            predecessor: None,
            max_block_transactions: 1,
            max_block_bytes: 4096,
            max_future_drift_ms: 0,
        };
        let chain = Chain::create(config, verifier, executor, store)?;
        atomic(
            &dir.join("active"),
            hex::encode(chain.head().session_id).as_bytes(),
        )?;
        Ok(chain)
    }
    pub fn migrate_legacy(&mut self, proof: Value) -> AnyResult<Value> {
        if let Some(ref existing) = self.origin {
            if existing == &proof {
                return self.view();
            }
            return Err("A different career origin is already committed".into());
        }
        if self.chain.head().input_position != 0 {
            return Err("Career migration is only available before play".into());
        }
        let chain = Self::create(
            self.store.clone(),
            self.verifier.clone(),
            &self.dir,
            self.kind,
            Some(&proof),
        )?;
        self.chain = chain;
        self.origin = Some(proof);
        self.view()
    }
    pub fn new_game(&mut self) -> AnyResult<Value> {
        let state = self.view()?;
        self.action(json!({"session_id":state["session"]["id"],"expected_block":state["session"]["block_hash"],"action":{"type":"race","mode":state["game"]["mode"],"vehicle":state["game"]["vehicle"],"gadget":state["game"]["gadget"],"difficulty":state["game"]["difficulty"]}}))
    }
    pub fn view(&self) -> AnyResult<Value> {
        let h = self.chain.head();
        let (_, snapshot) = Chain::recovery_snapshot(self.store.as_ref(), h.session_id)?;
        let e = Executor::restore(&snapshot)?;
        Ok(
            json!({"game":e.game.view(),"session":{"id":hex::encode(h.session_id),"height":h.finalised_height,"actions":h.input_position,"state_root":hex::encode(h.state_root),"block_hash":hex::encode(h.block_hash),"profile":hex::encode(profile(self.kind).commitment()),"authority":hex::encode(self.signer.ckb_public_key()),"mode":"local-poa-host-replay","ckb_settled":false,"rules_version":12,"career_migrated":self.origin.is_some()}}),
        )
    }
    pub fn action(&mut self, body: Value) -> AnyResult<Value> {
        let object = body.as_object().ok_or("Expected object")?;
        if object.len() != 3
            || !["action", "expected_block", "session_id"]
                .iter()
                .all(|k| object.contains_key(*k))
        {
            return Err("Unknown or missing request field".into());
        }
        let head = self.chain.head();
        if body.get("expected_block").and_then(Value::as_str)
            != Some(hex::encode(head.block_hash).as_str())
            || body.get("session_id").and_then(Value::as_str)
                != Some(hex::encode(head.session_id).as_str())
        {
            return Err("Stale session. Refresh and try again.".into());
        }
        let action = body.get("action").ok_or("Missing action")?;
        let payload = serde_json::to_vec(action)?;
        let pos = head.input_position;
        let prepared = self.chain.prepare_block(BlockRequest {
            transactions: vec![],
            frame_input: FrameInput {
                commands: vec![],
                start_position: pos,
                end_position: pos + 1,
                logical_time_start: pos,
                logical_time_end: pos + 1,
                payload,
            },
            scheduler_commitment: hash(b"serial-game-actions"),
            data_commitments: vec![],
            timestamp_ms: pos + 1,
            local_now_ms: pos + 1,
            successor: None,
            handoffs: vec![],
            consume_handoffs: vec![],
        })?;
        let engine = match &self.verifier.0 {
            SelectedConsensus::ProofOfAuthority(e) => e,
            _ => unreachable!(),
        };
        let seal = engine.seal_from_signer(
            prepared.block().hash(),
            prepared.block().number,
            &self.signer,
        )?;
        self.chain
            .commit_finalised(prepared, FinalityProof::ProofOfAuthority(seal))?;
        self.view()
    }
    pub fn replay(&self) -> AnyResult<Value> {
        let Some(end) = self.chain.head().finalised_height else {
            return Ok(json!({"verified":true,"frames":0,"message":"Genesis only; play first."}));
        };
        let r = self.chain.replay_range(0, end, Executor::restore)?;
        Ok(
            json!({"verified":true,"frames":r.frame_count,"receipt_commitment":hex::encode(r.commitment()),"state_root":hex::encode(r.state_root_after),"receipt":r}),
        )
    }
    pub fn export(&self) -> AnyResult<Value> {
        let id = self.chain.head().session_id;
        let blocks = self
            .store
            .load_chain(id)?
            .iter()
            .map(|r| {
                let mut record = r.clone();
                record.state_snapshot.clear();
                record.encode().map(hex::encode)
            })
            .collect::<myelin_session::Result<Vec<_>>>()?;
        Ok(
            json!({"format":"myelin-game-session-1","application":ID,"game":self.kind,"authority":hex::encode(self.signer.ckb_public_key()),"config":hex::encode(self.chain.config().encode()?),"blocks":blocks,"head":hex::encode(self.chain.head().encode()?),"origin":self.origin}),
        )
    }
}
pub fn verify_export(v: &Value) -> AnyResult<Value> {
    if v["format"] != "myelin-game-session-1" || v["application"] != ID {
        return Err("Wrong export format or game".into());
    }
    let get = |key: &str| -> AnyResult<Vec<u8>> {
        Ok(hex::decode(v[key].as_str().ok_or("Missing export field")?)?)
    };
    let kind: Kind = serde_json::from_value(v["game"].clone())?;
    let cfg = SessionConfig::decode(&get("config")?)?;
    if cfg.application_profile != profile(kind) {
        return Err("Application artifact or rules do not match this build".into());
    }
    let public: [u8; 33] = get("authority")?
        .try_into()
        .map_err(|_| "Invalid public key")?;
    let verifier = verifier(public)?;
    let dir = tempfile::tempdir()?;
    let store = Arc::new(RocksSessionStore::open(dir.path().join("db"))?);
    let executor = if v["origin"].is_null() {
        Executor::new(kind)
    } else {
        Executor::migrated(kind, &v["origin"])?
    };
    let mut chain = Chain::create(cfg, verifier, executor, store)?;
    let blocks = v["blocks"].as_array().ok_or("Missing blocks")?;
    if blocks.len() > MAX_ACTIONS as usize {
        return Err("Too many blocks".into());
    }
    for bytes in blocks {
        let r =
            FinalisedBlockRecord::decode(&hex::decode(bytes.as_str().ok_or("Invalid block")?)?)?;
        if !r.state_snapshot.is_empty()
            && Executor::restore(&r.state_snapshot)?.state_root() != r.block.state_root_after
        {
            return Err("Invalid record snapshot".into());
        }
        if r.successor.is_some()
            || !r.issued_handoffs.is_empty()
            || !r.consumed_handoff_ids.is_empty()
        {
            return Err("Unexpected handoff".into());
        }
        let p = chain.prepare_block(BlockRequest {
            transactions: r.transactions,
            frame_input: r.frame_input,
            scheduler_commitment: r.block.scheduler_commitment,
            data_commitments: r.request_data_commitments,
            timestamp_ms: r.block.timestamp_ms,
            local_now_ms: r.block.timestamp_ms,
            successor: None,
            handoffs: vec![],
            consume_handoffs: vec![],
        })?;
        if p.block().hash() != r.block.hash() || p.frame() != &r.frame {
            return Err("Replayed execution does not match signed block".into());
        }
        chain.commit_finalised(p, r.proof)?;
    }
    if chain.head() != &SessionHead::decode(&get("head")?)? {
        return Err("Export head does not match replay".into());
    }
    Ok(
        json!({"verified":true,"frames":blocks.len(),"state_root":hex::encode(chain.head().state_root),"authority":hex::encode(public)}),
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    fn action() -> Value {
        json!({"type":"ticks","inputs":vec![crate::game::pack_input(0,0,0,100);10]})
    }
    #[test]
    fn signed_session_recovery_replay_and_tamper_rejection() {
        let dir = tempfile::tempdir().unwrap();
        let mut app = App::open(dir.path(), Kind::DriftRun).unwrap();
        let before = app.view().unwrap();
        let request = json!({"action":action(),"expected_block":before["session"]["block_hash"],"session_id":before["session"]["id"]});
        let after = app.action(request.clone()).unwrap();
        assert_ne!(
            before["session"]["state_root"],
            after["session"]["state_root"]
        );
        assert!(app.action(request).is_err());
        assert_eq!(app.replay().unwrap()["frames"], 1);
        let export = app.export().unwrap();
        assert_eq!(verify_export(&export).unwrap()["verified"], true);
        let mut tampered = export.clone();
        let mut bytes = hex::decode(tampered["blocks"][0].as_str().unwrap()).unwrap();
        let end = bytes.len() - 1;
        bytes[end] ^= 1;
        tampered["blocks"][0] = json!(hex::encode(bytes));
        assert!(verify_export(&tampered).is_err());
        drop(app);
        let app = App::open(dir.path(), Kind::DriftRun).unwrap();
        assert_eq!(app.view().unwrap(), after);
    }
    #[test]
    fn career_survives_new_and_restart() {
        let dir = tempfile::tempdir().unwrap();
        let mut app = App::open(dir.path(), Kind::DriftRun).unwrap();
        let before = app.view().unwrap();
        let after=app.action(json!({"session_id":before["session"]["id"],"expected_block":before["session"]["block_hash"],"action":{"type":"upgrade","vehicle":0,"choice":0}})).unwrap();
        assert_eq!(after["game"]["career"]["credits"], 550);
        let next = app.new_game().unwrap();
        assert_eq!(next["game"]["career"], after["game"]["career"]);
        assert_eq!(
            verify_export(&app.export().unwrap()).unwrap()["verified"],
            true
        );
        drop(app);
        assert_eq!(
            App::open(dir.path(), Kind::DriftRun)
                .unwrap()
                .view()
                .unwrap(),
            next
        );
    }
}

fn verified_legacy_game(proof: &Value) -> AnyResult<Value> {
    if proof["application"] == legacy_v8::game::ID {
        return Ok(serde_json::to_value(legacy_v8::verified_game(proof)?)?);
    }
    if proof["application"] == legacy_v9::game::ID {
        legacy_v9::session::verify_export(proof)?;
        let mut game = legacy_v9::game::Game::new(serde_json::from_value(proof["game"].clone())?);
        if !proof["origin"].is_null() {
            let old = verified_legacy_game(&proof["origin"])?;
            game.career = serde_json::from_value(old["career"].clone())?;
            game.race_id = old["race_id"].as_i64().ok_or("Legacy race")? as i32;
            game.vehicle = old["vehicle"].as_i64().ok_or("Legacy vehicle")? as i32;
            game.mode = old["mode"].as_i64().ok_or("Legacy mode")? as i32;
            game.gadget = old["gadget"].as_i64().ok_or("Legacy gadget")? as i32;
            game.difficulty = old["difficulty"].as_i64().ok_or("Legacy difficulty")? as i32;
        }
        for block in proof["blocks"].as_array().ok_or("Missing legacy blocks")? {
            let record = FinalisedBlockRecord::decode(&hex::decode(
                block.as_str().ok_or("Invalid legacy block")?,
            )?)?;
            game.apply(&serde_json::from_slice(&record.frame_input.payload)?)?;
        }
        return Ok(serde_json::to_value(game)?);
    }
    if proof["application"] == legacy_v11::game::ID {
        legacy_v11::session::verify_export(proof)?;
        let mut game = legacy_v11::game::Game::new(serde_json::from_value(proof["game"].clone())?);
        if !proof["origin"].is_null() {
            let old = verified_legacy_game(&proof["origin"])?;
            game.career = serde_json::from_value(old["career"].clone())?;
            game.race_id = old["race_id"].as_i64().ok_or("Legacy race")? as i32;
            game.vehicle = old["vehicle"].as_i64().ok_or("Legacy vehicle")? as i32;
            game.mode = old["mode"].as_i64().ok_or("Legacy mode")? as i32;
            game.gadget = old["gadget"].as_i64().ok_or("Legacy gadget")? as i32;
            game.difficulty = old["difficulty"].as_i64().ok_or("Legacy difficulty")? as i32;
        }
        for block in proof["blocks"].as_array().ok_or("Missing legacy blocks")? {
            let record = FinalisedBlockRecord::decode(&hex::decode(block.as_str().ok_or("Invalid legacy block")?)?)?;
            game.apply(&serde_json::from_slice(&record.frame_input.payload)?)?;
        }
        return Ok(serde_json::to_value(game)?);
    }
    if proof["application"] != legacy_v10::game::ID {
        return Err("Unsupported legacy application".into());
    }
    legacy_v10::session::verify_export(proof)?;
    let mut game = legacy_v10::game::Game::new(serde_json::from_value(proof["game"].clone())?);
    if !proof["origin"].is_null() {
        let old = verified_legacy_game(&proof["origin"])?;
        game.career = serde_json::from_value(old["career"].clone())?;
        game.race_id = old["race_id"].as_i64().ok_or("Legacy race")? as i32;
        game.vehicle = old["vehicle"].as_i64().ok_or("Legacy vehicle")? as i32;
        game.mode = old["mode"].as_i64().ok_or("Legacy mode")? as i32;
        game.gadget = old["gadget"].as_i64().ok_or("Legacy gadget")? as i32;
        game.difficulty = old["difficulty"].as_i64().ok_or("Legacy difficulty")? as i32;
    }
    for block in proof["blocks"].as_array().ok_or("Missing legacy blocks")? {
        let record = FinalisedBlockRecord::decode(&hex::decode(
            block.as_str().ok_or("Invalid legacy block")?,
        )?)?;
        game.apply(&serde_json::from_slice(&record.frame_input.payload)?)?;
    }
    Ok(serde_json::to_value(game)?)
}
