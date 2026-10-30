fn main() {
    println!(
        "{}",
        hex::encode(
            myelin_nightshift_v14::session::profile(myelin_nightshift_v14::game::Kind::DriftRun)
                .commitment()
        )
    );
}
