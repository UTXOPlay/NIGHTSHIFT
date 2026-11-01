fn main() {
    println!(
        "{}",
        hex::encode(
            myelin_nightshift_v15::session::profile(myelin_nightshift_v15::game::Kind::DriftRun)
                .commitment()
        )
    );
}
