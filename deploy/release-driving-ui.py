"""NIGHTSHIFT V12 independent throttle cutover; preserve native data and the latest store.

Run on the deployment host. The release directory contains payload/dist,
payload/docs and payload/package.json. Private container configurations and
backups stay on that host, under a mode-0700 release directory.
"""
import copy
import http.client
import json
import os
import pathlib
import socket
import sqlite3
import subprocess
import sys
import tarfile
import time
import urllib.parse

ROOT = pathlib.Path(sys.argv[2]).resolve()
VERSION = json.loads((ROOT / "payload/package.json").read_text())["version"]
V12_DATA = pathlib.Path("/data/utxoplay/shared/nightshift-v12")
GAME, STORE = "myelin-nightshift-v8", "utxoplay-store"
RELEASE_ID = VERSION.replace(".", "-")
STAGE_GAME, STAGE_STORE = "nightshift-" + RELEASE_ID + "-stage", "nightshift-" + RELEASE_ID + "-store-stage"
ROOT.mkdir(parents=True, exist_ok=True)
ROOT.chmod(0o700)


def run(args):
    return subprocess.check_output(args).decode().strip()


def inspect(name):
    return json.loads(run(["docker", "inspect", name]))[0]


def private(name, data):
    p = ROOT / name
    p.write_text(json.dumps(data, indent=2))
    p.chmod(0o600)


class DockerConnection(http.client.HTTPConnection):
    def connect(self):
        self.sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        self.sock.connect("/var/run/docker.sock")


def docker_request(method, route, data=None):
    c = DockerConnection("localhost")
    try:
        c.request(method, "/v1.47" + route, None if data is None else json.dumps(data), {"Content-Type": "application/json"})
        response = c.getresponse()
        body = response.read()
        if response.status >= 300:
            raise RuntimeError("Docker operation failed: " + str(response.status) + " " + body.decode()[:250])
        return json.loads(body) if body else None
    finally:
        c.close()


def clone_spec(d, image, stage=False):
    spec = copy.deepcopy(d["Config"])
    spec["Image"] = image
    spec["HostConfig"] = copy.deepcopy(d["HostConfig"])
    # Container-local identities are regenerated; user-defined aliases remain.
    spec["Hostname"] = ""
    endpoints = {}
    for network, n in d["NetworkSettings"]["Networks"].items():
        endpoint = {}
        aliases = [a for a in n.get("Aliases") or [] if a not in [d["Id"], d["Id"][:12]]]
        if aliases and not stage:
            endpoint["Aliases"] = aliases
        if n.get("IPAMConfig") and not stage:
            endpoint["IPAMConfig"] = n["IPAMConfig"]
        endpoints[network] = endpoint
    spec["NetworkingConfig"] = {"EndpointsConfig": endpoints}
    if stage:
        spec["Labels"] = {k: v for k, v in (spec.get("Labels") or {}).items() if not k.startswith("com.docker.compose.")}
        spec["Labels"].update({"io.utxoplay.nightshift.release": str(ROOT), "io.utxoplay.nightshift.role": "staging"})
        spec["Env"] = [e for e in spec["Env"] if not e.split("=", 1)[0].startswith("VIRTUAL_")]
        spec["HostConfig"]["RestartPolicy"] = {"Name": "no", "MaximumRetryCount": 0}
    if d["Name"].lstrip("/") == GAME:
        spec["Cmd"] = ["node", "host/nightshift12.mjs"]
        spec["HostConfig"]["Memory"] = 1536 * 1024 * 1024
        spec["HostConfig"]["MemorySwap"] = 1536 * 1024 * 1024
    return spec


def env_set(spec, values):
    env = dict(e.split("=", 1) for e in spec["Env"])
    env.update(values)
    spec["Env"] = [k + "=" + v for k, v in env.items()]


def create(name, spec):
    docker_request("POST", "/containers/create?name=" + urllib.parse.quote(name), spec)
    run(["docker", "start", name])


def healthy(name):
    for _ in range(60):
        d = inspect(name)
        if d["State"].get("Health", {}).get("Status") == "healthy":
            return
        if not d["State"]["Running"]:
            raise RuntimeError(name + " stopped")
        time.sleep(1)
    raise RuntimeError(name + " health check timed out")



def build(kind, base, catalog=None):
    base_tag = "utxoplay/lighting-base-" + kind + ":" + base.removeprefix("sha256:")[:16]
    run(["docker", "tag", base, base_tag])
    if kind == "game":
        body = "COPY payload/dist/ /app/dist/\nCOPY payload/docs/ /app/docs/\nCOPY payload/host/ /app/host/\nCOPY payload/games/nightshift-v12/host.json /app/games/nightshift-v12/host.json\nCOPY payload/package.json payload/package-lock.json /app/\n"
    else:
        (ROOT / "catalog.json").write_text(json.dumps(catalog, indent=2) + "\n")
        body = "COPY catalog.json /app/server/catalog.json\n"
    dockerfile = ROOT / ("Dockerfile." + kind)
    dockerfile.write_text("FROM " + base_tag + "\n" + body + 'LABEL org.opencontainers.image.version="nightshift-' + VERSION + '"\n')
    tag = "utxoplay/" + kind + ":nightshift-presentation-" + VERSION
    with (ROOT / (kind + "-build.log")).open("w") as log:
        subprocess.run(["docker", "build", "-f", str(dockerfile), "-t", tag, str(ROOT)], stdout=log, stderr=subprocess.STDOUT, check=True)
    return inspect(tag)["Id"]


def catalog_from_store(label):
    p = ROOT / (label + ".json")
    run(["docker", "cp", STORE + ":/app/server/catalog.json", str(p)])
    before = json.loads(p.read_text())
    after = copy.deepcopy(before)
    entry=next(x for x in after if x["id"] == "drift-run")
    entry.update(json.loads((ROOT / "payload/docs/catalog-v12-patch.json").read_text()))
    entry["version"] = VERSION
    assert [x for x in before if x["id"] != "drift-run"] == [x for x in after if x["id"] != "drift-run"]
    return after


def stage():
    game, store = inspect(GAME), inspect(STORE)
    assert game["Image"] == "sha256:0ad44a55b89a783a8cb08ead6d460cbfef15694a72307e9e57dbfac9e7327fe7", "Rebase onto the current Nightshift release before staging"
    private("game-before.private.json", game)
    private("store-stage-base.private.json", store)
    game_image = build("game", game["Image"])
    store_image = build("store", store["Image"], catalog_from_store("catalog-stage-before"))
    for name, original, image in [(STAGE_GAME, game, game_image), (STAGE_STORE, store, store_image)]:
        spec = clone_spec(original, image, stage=True)
        spec["HostConfig"]["PortBindings"] = {} if name == STAGE_GAME else {"8790/tcp": [{"HostIp": "127.0.0.1", "HostPort": "18946"}]}
        isolated = set()

        def isolate_volume(source, target):
            if target not in ["/app/data", "/app/data-v9", "/app/data-v10", "/app/data-v11", "/app/data-v12"]:
                return source
            dest = ROOT / (name + "-" + target.rsplit("/", 1)[-1])
            dest.mkdir(exist_ok=True)
            os.chown(dest, 1000, 1000)
            if name == STAGE_STORE:
                src = sqlite3.connect("file:" + source + "/platform.sqlite?mode=ro", uri=True)
                dst = sqlite3.connect(str(dest / "platform.sqlite"))
                src.backup(dst)
                src.close()
                dst.close()
                os.chown(dest / "platform.sqlite", 1000, 1000)
            isolated.add(target)
            return str(dest)

        binds = spec["HostConfig"].get("Binds") or []
        updated = []
        for bind in binds:
            source, target, *flags = bind.split(":")
            source = isolate_volume(source, target)
            updated.append(":".join([source, target] + flags))
        spec["HostConfig"]["Binds"] = updated
        for mount in spec["HostConfig"].get("Mounts") or []:
            mount["Source"] = isolate_volume(mount["Source"], mount["Target"])
        assert isolated == ({"/app/data", "/app/data-v9", "/app/data-v10", "/app/data-v11", "/app/data-v12"} if name == STAGE_GAME else {"/app/data"}), "All writable game data must be isolated"
        if name == STAGE_GAME:
            env_set(spec, {"GAME_ORIGIN": "http://127.0.0.1:18946", **runtime_env()})
        else:
            env_set(spec, {"PUBLIC_ORIGIN": "http://127.0.0.1:18946", "MYELIN_DRIFT_RUN_URL": "http://" + STAGE_GAME + ":8080"})
        assert not any(e.startswith("VIRTUAL_") for e in spec["Env"])
        private(name + ".private.json", spec)
        create(name, spec)
        healthy(name)
    report = {"version": VERSION, "gameImage": game_image, "storeImage": store_image, "publicRegistrationExcluded": True}
    (ROOT / "stage.json").write_text(json.dumps(report, indent=2))
    print(json.dumps(report))


def runtime_env():
    return {"GRIP_DATA_DIR":"/app/data-v11", "GRIP_BINARY":"/app/target/release/myelin-nightshift-v11", "DATA_DIR": "/app/data-v12", "RUNTIME_BINARY": "/app/target/release/myelin-nightshift-v12", "ROADBLOCK_DATA_DIR":"/app/data-v10", "ROADBLOCK_BINARY":"/app/target/release/myelin-nightshift-v10", "PREVIOUS_DATA_DIR": "/app/data-v9", "PREVIOUS_BINARY": "/app/target/release/myelin-nightshift-v9"}


def cutover():
    old_game, old_store = inspect(GAME), inspect(STORE)
    assert not any(e.startswith("RUNTIME_URL=") or e.startswith("PREVIOUS_RUNTIME_URL=") for e in old_game["Config"]["Env"]), "External runtimes need explicit routing"
    V12_DATA.mkdir(exist_ok=True)
    os.chown(V12_DATA,1000,1000)
    assert old_game["Image"] == json.loads((ROOT / "game-before.private.json").read_text())["Image"], "Concurrent game release"
    healthy(STAGE_GAME)
    healthy(STAGE_STORE)
    private("store-before.private.json", old_store)
    catalog = catalog_from_store("catalog-cutover-before")
    image = build("store", old_store["Image"], catalog)
    assert inspect(STORE)["Id"] == old_store["Id"], "Concurrent store replacement; rebase instead of overwriting"
    for mount in old_store["Mounts"]:
        if mount["Destination"] == "/app/data":
            src = sqlite3.connect("file:" + mount["Source"] + "/platform.sqlite?mode=ro", uri=True)
            dst = sqlite3.connect(str(ROOT / "platform-before.private.sqlite"))
            src.backup(dst)
            src.close()
            dst.close()
            (ROOT / "platform-before.private.sqlite").chmod(0o600)
    game_image = json.loads((ROOT / "stage.json").read_text())["gameImage"]
    changed = []
    try:
        for name, original, candidate in [(GAME, old_game, game_image), (STORE, old_store, image)]:
            assert inspect(name)["Id"] == original["Id"], "Concurrent container replacement; preserve the newer deployment"
            backup = name + "-before-nightshift-" + RELEASE_ID
            run(["docker", "stop", "-t", "15", name])
            run(["docker", "rename", name, backup])
            changed.append((name, backup))
            if name == GAME:
                with tarfile.open(ROOT / "native-before.private.tar.gz", "w:gz") as t:
                    for m in old_game["Mounts"]:
                        if m["Destination"] in ["/app/data", "/app/data-v9", "/app/data-v10", "/app/data-v11", "/app/data-v12"]:
                            t.add(m["Source"], arcname=m["Destination"].rsplit("/", 1)[-1])
                (ROOT / "native-before.private.tar.gz").chmod(0o600)
            spec = clone_spec(original, candidate)
            if name == GAME:
                env_set(spec,runtime_env())
            # This container is managed by this immutable release, not the old
            # compose path; retaining stale compose ownership invites rollback.
            spec["Labels"] = {k: v for k, v in (spec.get("Labels") or {}).items() if not k.startswith("com.docker.compose.")}
            spec["Labels"]["io.utxoplay.nightshift.release"] = str(ROOT)
            spec["Labels"]["io.utxoplay.nightshift.role"] = "production"
            private(name + "-production.private.json", spec)
            create(name, spec)
            healthy(name)
    except Exception:
        for name, backup in reversed(changed):
            subprocess.run(["docker", "rm", "-f", name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            run(["docker", "rename", backup, name])
            run(["docker", "start", name])
        raise
    report = {"version": VERSION, "gameImage": inspect(GAME)["Image"], "storeImage": inspect(STORE)["Image"], "otherCatalogEntriesPreserved": True, "legacyNativeVolumesPreserved": True, "v12DataIsolated": True}
    (ROOT / "deployment.json").write_text(json.dumps(report, indent=2))
    print(json.dumps(report))


def cleanup():
    for name in [STAGE_STORE, STAGE_GAME]:
        run(["docker", "rm", "-f", name])
    print("Removed only this release's two staging containers; backups retained")


{"stage": stage, "cutover": cutover, "cleanup": cleanup}[sys.argv[1]]()
