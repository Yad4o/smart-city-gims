def test_register_and_login(client):
    res = client.post("/auth/register", json={
        "email": "newuser@test.com",
        "full_name": "New User",
        "password": "securepass"
    })
    assert res.status_code == 201
    assert res.json()["email"] == "newuser@test.com"

    res = client.post("/auth/login", json={"email": "newuser@test.com", "password": "securepass"})
    assert res.status_code == 200
    assert "access_token" in res.json()


def test_duplicate_register(client):
    client.post("/auth/register", json={"email": "dup@test.com", "full_name": "User", "password": "pass"})
    res = client.post("/auth/register", json={"email": "dup@test.com", "full_name": "User", "password": "pass"})
    assert res.status_code == 400


def test_wrong_password(client):
    client.post("/auth/register", json={"email": "a@test.com", "full_name": "A", "password": "correct"})
    res = client.post("/auth/login", json={"email": "a@test.com", "password": "wrong"})
    assert res.status_code == 401
