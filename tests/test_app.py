from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # ensure a known activity exists
    assert "Chess Club" in data


def test_signup_and_remove_participant():
    activity = "Chess Club"
    email = "testuser@example.com"

    # ensure clean state
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    # sign up
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200

    # verify via GET that participant was added
    resp2 = client.get("/activities")
    assert resp2.status_code == 200
    data = resp2.json()
    assert email in data[activity]["participants"]

    # remove
    resp = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp.status_code == 200

    # verify via GET that participant was removed
    resp3 = client.get("/activities")
    assert resp3.status_code == 200
    data2 = resp3.json()
    assert email not in data2[activity]["participants"]


def test_remove_missing_participant_returns_404():
    activity = "Chess Club"
    email = "not_in_list@example.com"

    # ensure absent
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    resp = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp.status_code == 404


def test_delete_from_nonexistent_activity_returns_404():
    resp = client.delete("/activities/NoSuchActivity/participants?email=x@x.com")
    assert resp.status_code == 404
import copy
import pytest
from fastapi.testclient import TestClient

from src import app as app_module


# Create a TestClient for the FastAPI app
client = TestClient(app_module.app)


# Snapshot of the initial activities (deepcopy to avoid mutation between tests)
ORIGINAL_ACTIVITIES = copy.deepcopy(app_module.activities)


@pytest.fixture(autouse=True)
def reset_activities():
    # Reset the in-memory activities dict before each test
    app_module.activities = copy.deepcopy(ORIGINAL_ACTIVITIES)
    yield
    app_module.activities = copy.deepcopy(ORIGINAL_ACTIVITIES)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()

    # Basic shape checks
    assert isinstance(data, dict)
    assert "Chess Club" in data
    assert isinstance(data["Chess Club"]["participants"], list)


def test_signup_for_activity():
    email = "test_student@example.com"
    # sign up the student for Chess Club
    resp = client.post("/activities/Chess%20Club/signup", params={"email": email})
    assert resp.status_code == 200
    json_data = resp.json()
    assert "Signed up" in json_data["message"]

    # verify participant was added
    resp2 = client.get("/activities")
    assert email in resp2.json()["Chess Club"]["participants"]


def test_remove_participant():
    # Ensure a participant exists first
    existing = ORIGINAL_ACTIVITIES["Programming Class"]["participants"][0]

    # remove the existing participant
    resp = client.delete("/activities/Programming%20Class/participants", params={"email": existing})
    assert resp.status_code == 200
    assert "Removed" in resp.json()["message"]

    # verify participant gone
    resp2 = client.get("/activities")
    assert existing not in resp2.json()["Programming Class"]["participants"]


def test_remove_nonexistent_participant_returns_404():
    resp = client.delete("/activities/Drama%20Club/participants", params={"email": "not@here.example"})
    assert resp.status_code == 404
