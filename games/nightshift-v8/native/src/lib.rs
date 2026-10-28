// Frozen Season 8 verifier used only to validate a career origin for newer rules.
// The original game.rs, session.rs and Cargo.lock remain byte-for-byte unchanged.
pub mod game;
pub mod session;

pub fn verified_game(export: &serde_json::Value) -> session::AnyResult<game::Game> {
    session::verify_export(export)?;
    let kind: game::Kind = serde_json::from_value(export["game"].clone())?;
    let mut state = game::Game::new(kind);
    for block in export["blocks"].as_array().ok_or("Missing legacy blocks")? {
        let record = myelin_session::FinalisedBlockRecord::decode(&hex::decode(
            block.as_str().ok_or("Invalid legacy block")?,
        )?)?;
        state.apply(&serde_json::from_slice(&record.frame_input.payload)?)?;
    }
    Ok(state)
}
