fn main() {
    println!(
        "{}",
        hex::encode(
            myelin_nightshift_v16::session::profile(myelin_nightshift_v16::game::Kind::DriftRun)
                .commitment()
        )
    );
}
