use myelin_nightshift_v10::game::{Game,Kind,Body};
fn barrier(x:i32,y:i32)->Body {Body{id:x+1,x,y,vx:0,vy:0,tag:8,age:0,life:0,contact_cd:0}}
fn fixture()->Game {let mut g=Game::new(Kind::DriftRun);g.distance=5000;g.speed=0;for r in &mut g.rivals {r.finish=1;}g}
#[test]
fn an_unprotected_or_recovering_rival_hits_the_same_swept_static_envelope() {
 for recover in [0,45] {
  let mut g=fixture();let r=&mut g.rivals[0];r.finish=0;r.x=1000;r.target=1000;r.distance=6000;r.speed=2500;r.recover=recover;
  g.bodies.push(barrier(1000,-210));g.step(8);
  assert!(g.rivals[0].distance<=6015);assert!(g.rivals[0].speed<0);
  if recover==0 {assert_eq!(g.rivals[0].hp,1);}
 }
}
#[test]
fn traffic_cannot_cross_a_barrier_and_a_trailing_rival_keeps_its_physical_row() {
 let mut g=fixture();g.bodies.push(barrier(1000,-210));let mut car=barrier(1000,-170);car.id=3;car.tag=1;car.vy=25;g.bodies.push(car);g.step(8);
 let car=&g.bodies[1];assert!(g.distance+830-car.y<=6015);assert!(car.vy<=0);
 let mut g=fixture();g.distance=6500;let r=&mut g.rivals[0];r.finish=0;r.x=1000;r.target=1000;r.distance=6000;r.speed=1600;
 g.bodies.push(barrier(1000,1290));g.step(8);assert_eq!(g.bodies.iter().filter(|b|b.tag==8).count(),1);assert!(g.rivals[0].distance<=6015);
}
