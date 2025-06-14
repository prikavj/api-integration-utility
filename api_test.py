import requests
import json
from datetime import datetime
import random
import string

API_BASE = "http://localhost:5001"  # Change to your backend container's exposed port if needed

def random_username():
    return "testuser_" + ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))

USERNAME = random_username()
PASSWORD = "testpass123"

ENDPOINTS = [
    {"name": "Register User", "method": "POST", "url": "/api/auth/register", "body": {"username": USERNAME, "password": PASSWORD}},
    {"name": "Login User", "method": "POST", "url": "/api/auth/login", "body": {"username": USERNAME, "password": PASSWORD}},
    {"name": "Get User Profile", "method": "GET", "url": "/api/auth/profile", "auth": True},
    {"name": "Get All People", "method": "GET", "url": "/api/person", "auth": True},
    {"name": "Create Person", "method": "POST", "url": "/api/person", "body": {"name": "Test User", "email": "test@example.com"}, "auth": True},
    {"name": "Get Person by ID", "method": "GET", "url": "/api/person/{personId}", "auth": True},
    {"name": "Update Person", "method": "PUT", "url": "/api/person/{personId}", "body": {"name": "Updated User", "email": "updated@example.com"}, "auth": True},
    {"name": "Get All Products", "method": "GET", "url": "/api/product", "auth": True},
    {"name": "Create Product", "method": "POST", "url": "/api/product", "body": {"name": "Test Product", "price": 10.0, "personId": "{personId}"}, "auth": True},
    {"name": "Get Product by ID", "method": "GET", "url": "/api/product/{productId}", "auth": True},
    {"name": "Update Product", "method": "PUT", "url": "/api/product/{productId}", "body": {"name": "Updated Product", "price": 20.0, "personId": "{personId}"}, "auth": True},
    {"name": "Delete Product", "method": "DELETE", "url": "/api/product/{productId}", "auth": True},
    {"name": "Delete Person", "method": "DELETE", "url": "/api/person/{personId}", "auth": True},
    {"name": "Health Check", "method": "GET", "url": "/api/health"}
]

results = []
context = {}
token = None

for ep in ENDPOINTS:
    url = API_BASE + ep["url"]
    method = ep["method"]
    headers = ep.get("headers", {})
    body = ep.get("body", {})
    use_auth = ep.get("auth", False)

    # Replace placeholders in URL and body for all known context keys
    for key, value in context.items():
        url = url.replace(f"{{{key}}}", str(value))
        if isinstance(body, dict):
            for k, v in body.items():
                if isinstance(v, str) and f"{{{key}}}" in v:
                    body[k] = v.replace(f"{{{key}}}", str(value))

    # Add Authorization header if needed
    if use_auth and token:
        headers = dict(headers)  # copy
        headers["Authorization"] = f"Bearer {token}"

    try:
        if method == "GET":
            resp = requests.get(url, headers=headers)
        elif method == "POST":
            resp = requests.post(url, json=body, headers=headers)
        elif method == "PUT":
            resp = requests.put(url, json=body, headers=headers)
        elif method == "DELETE":
            resp = requests.delete(url, headers=headers)
        else:
            continue

        # Accept 204 as pass for update/delete
        is_pass = resp.status_code in [200, 201] or (resp.status_code == 204 and method in ["PUT", "DELETE"])

        result = {
            "name": ep["name"],
            "method": method,
            "url": url,
            "status": resp.status_code,
            "response": resp.text[:200],  # Truncate for display
            "is_pass": is_pass
        }

        # Update context with response data if needed
        if resp.status_code in [200, 201]:
            try:
                data = resp.json()
                if ep["name"] == "Login User" and "token" in data:
                    token = data["token"]
                    context["token"] = token
                if ep["name"] == "Create Person" and "id" in data:
                    context["personId"] = data["id"]
                if ep["name"] == "Create Product" and "id" in data:
                    context["productId"] = data["id"]
            except:
                pass

    except Exception as e:
        result = {
            "name": ep["name"],
            "method": method,
            "url": url,
            "status": "ERROR",
            "response": str(e),
            "is_pass": False
        }
    results.append(result)

# Generate HTML report
html = """
<html>
<head>
    <title>API Test Results</title>
    <style>
        table {{ border-collapse: collapse; width: 100%; }}
        th, td {{ border: 1px solid #ccc; padding: 8px; }}
        th {{ background: #eee; }}
        .pass {{ background: #cfc; }}
        .fail {{ background: #fcc; }}
    </style>
</head>
<body>
    <h1>API Test Results - {date}</h1>
    <table>
        <tr>
            <th>Name</th>
            <th>Method</th>
            <th>URL</th>
            <th>Status</th>
            <th>Response (truncated)</th>
        </tr>
""".format(date=datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

for r in results:
    status_class = "pass" if r["is_pass"] else "fail"
    html += f"<tr class='{status_class}'><td>{r['name']}</td><td>{r['method']}</td><td>{r['url']}</td><td>{r['status']}</td><td><pre>{r['response']}</pre></td></tr>"

html += """
    </table>
</body>
</html>
"""

with open("api_test_results.html", "w") as f:
    f.write(html)

print("API test results written to api_test_results.html") 