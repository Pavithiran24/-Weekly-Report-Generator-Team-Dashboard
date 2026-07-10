from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_profile_route_requires_authentication() -> None:
    response = client.get("/api/auth/profile")
    assert response.status_code == 401


def test_dashboard_summary_route_requires_authentication() -> None:
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 401
