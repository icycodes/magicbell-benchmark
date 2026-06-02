import json
import os
import time

import jwt
import requests


def get_required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def build_user_email(base_email: str, run_id: str) -> str:
    local, domain = base_email.split("@", 1)
    return f"{local}+jwt-python-{run_id}@{domain}"


def build_external_id(run_id: str) -> str:
    return f"user-jwt-python-{run_id}"


def upsert_user(project_token: str, api_key: str, external_id: str, email: str) -> None:
    url = "https://api.magicbell.com/v2/users"
    headers = {
        "Authorization": f"Bearer {project_token}",
        "X-MAGICBELL-API-KEY": api_key,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    payload = {
        "external_id": external_id,
        "email": email,
        "first_name": "JWT",
        "last_name": "Python",
    }
    response = requests.put(url, headers=headers, data=json.dumps(payload), timeout=30)
    response.raise_for_status()


def build_user_jwt_payload(email: str, external_id: str, api_key: str) -> dict:
    exp = int(time.time()) + 365 * 24 * 60 * 60
    return {
        "user_email": email,
        "user_external_id": external_id,
        "api_key": api_key,
        "exp": exp,
    }


def main() -> None:
    run_id = get_required_env("ZEALT_RUN_ID")
    base_email = get_required_env("MAGICBELL_EMAIL")
    project_token = get_required_env("MAGICBELL_PROJECT_TOKEN")
    api_key = get_required_env("MAGICBELL_API_KEY")
    secret_key = get_required_env("MAGICBELL_SECRET_KEY")

    user_email = build_user_email(base_email, run_id)
    external_id = build_external_id(run_id)

    upsert_user(project_token, api_key, external_id, user_email)

    payload = build_user_jwt_payload(user_email, external_id, api_key)
    token = jwt.encode(payload, secret_key, algorithm="HS256")

    output_path = "/home/user/myproject/output.log"
    with open(output_path, "w", encoding="utf-8") as handle:
        handle.write(f"User JWT: {token}\n")


if __name__ == "__main__":
    main()
