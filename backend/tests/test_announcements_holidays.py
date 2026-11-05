# Announcements (Pengumuman) CRUD + auto_holidays settings regression tests
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
CREDS = {"username": "admin", "password": "Admin#PWetan2026"}


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json=CREDS)
    if r.status_code != 200:
        pytest.skip(f"login failed {r.status_code}")
    s.headers.update({"Authorization": f"Bearer {r.json()['token']}"})
    return s


@pytest.fixture(scope="module")
def created_ids(client):
    ids = []
    yield ids
    for i in ids:
        client.delete(f"{BASE_URL}/api/admin/res/announcements/{i}")


# Auth
def test_login_returns_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json=CREDS)
    assert r.status_code == 200
    assert r.json()["user"]["role"] == "admin"


def test_admin_list_requires_auth():
    r = requests.get(f"{BASE_URL}/api/admin/res/announcements")
    assert r.status_code == 401


# Announcement CRUD
def test_create_get_update_delete(client, created_ids):
    payload = {"title": "TEST_Pengumuman CRUD", "content": "Isi uji", "type": "Himbauan",
               "start_at": "2026-01-01T01:00:00.000Z", "end_at": "2099-01-01T00:00:00.000Z", "popup": True, "visible": True}
    r = client.post(f"{BASE_URL}/api/admin/res/announcements", json=payload)
    assert r.status_code == 200
    doc = r.json()
    assert isinstance(doc["id"], str) and "_id" not in doc
    created_ids.append(doc["id"])
    assert doc["title"] == payload["title"] and doc["start_at"] == payload["start_at"]

    lst = client.get(f"{BASE_URL}/api/admin/res/announcements").json()
    assert any(x["id"] == doc["id"] for x in lst)

    r = client.put(f"{BASE_URL}/api/admin/res/announcements/{doc['id']}", json={**doc, "title": "TEST_Updated"})
    assert r.status_code == 200 and r.json()["title"] == "TEST_Updated"
    lst = client.get(f"{BASE_URL}/api/admin/res/announcements").json()
    got = next(x for x in lst if x["id"] == doc["id"])
    assert got["title"] == "TEST_Updated" and got["start_at"] == payload["start_at"]

    pub = requests.get(f"{BASE_URL}/api/public/announcements").json()["items"]
    assert any(x["id"] == doc["id"] for x in pub)

    r = client.delete(f"{BASE_URL}/api/admin/res/announcements/{doc['id']}")
    assert r.status_code == 200
    created_ids.remove(doc["id"])
    lst = client.get(f"{BASE_URL}/api/admin/res/announcements").json()
    assert not any(x["id"] == doc["id"] for x in lst)
    r = client.delete(f"{BASE_URL}/api/admin/res/announcements/{doc['id']}")
    assert r.status_code == 404


# Hidden announcements excluded from public endpoint
def test_hidden_not_public(client, created_ids):
    r = client.post(f"{BASE_URL}/api/admin/res/announcements", json={"title": "TEST_hidden", "content": "x", "visible": False})
    created_ids.append(r.json()["id"])
    pub = requests.get(f"{BASE_URL}/api/public/announcements").json()["items"]
    assert not any(x["id"] == r.json()["id"] for x in pub)


# Public sort newest start_at first
def test_public_sort(client, created_ids):
    a = client.post(f"{BASE_URL}/api/admin/res/announcements", json={"title": "TEST_old", "content": "x", "start_at": "2026-01-01T00:00:00.000Z"}).json()
    b = client.post(f"{BASE_URL}/api/admin/res/announcements", json={"title": "TEST_new", "content": "x", "start_at": "2026-01-05T00:00:00.000Z"}).json()
    created_ids += [a["id"], b["id"]]
    pub = [x["id"] for x in requests.get(f"{BASE_URL}/api/public/announcements").json()["items"]]
    assert pub.index(b["id"]) < pub.index(a["id"])


# Validation: does backend reject empty title/content? (report only)
def test_create_without_title_rejected(client, created_ids):
    r = client.post(f"{BASE_URL}/api/admin/res/announcements", json={"content": ""})
    if r.status_code == 200:
        created_ids.append(r.json()["id"])
    assert r.status_code in (400, 422), "backend accepts announcement without title/content"


# auto_holidays settings persistence
def test_auto_holidays_settings_roundtrip(client):
    orig = requests.get(f"{BASE_URL}/api/public/settings").json().get("auto_holidays")
    try:
        nxt = {"enabled": True, "disabled": ["natal"], "overrides": {"hut-ri-2026-08-17": {"title": "TEST_x", "message": "m", "theme": "merah-putih"}},
               "custom": [{"cid": "testcid", "name": "TEST_Hari", "date": "2026-07-10", "yearly": True, "title": "", "message": "", "theme": "nasional"}]}
        r = client.put(f"{BASE_URL}/api/admin/settings", json={"auto_holidays": nxt})
        assert r.status_code == 200 and r.json()["auto_holidays"] == nxt
        assert requests.get(f"{BASE_URL}/api/public/settings").json()["auto_holidays"] == nxt
    finally:
        client.put(f"{BASE_URL}/api/admin/settings", json={"auto_holidays": orig})
    assert requests.get(f"{BASE_URL}/api/public/settings").json().get("auto_holidays") == orig


def test_settings_requires_auth():
    r = requests.put(f"{BASE_URL}/api/admin/settings", json={"auto_holidays": {}})
    assert r.status_code == 401
