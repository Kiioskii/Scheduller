def test_podklad_template_endpoint(client) -> None:
    response = client.get("/internal/v1/files/podklad/template?year=2026&month=6")

    assert response.status_code == 200
    assert (
        response.headers["content-type"]
        == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    assert "PODK" in response.headers.get("content-disposition", "")
    assert response.content[:2] == b"PK"
    assert response.headers.get("x-file-name") == "PODKLAD 01.06-30.06 R.xlsx"
    assert "filename*=UTF-8" in response.headers.get("content-disposition", "")


def test_podklad_template_endpoint_with_holidays(client) -> None:
    response = client.get(
        "/internal/v1/files/podklad/template?year=2026&month=6&holiday_dates=2026-06-01,2026-06-15"
    )

    assert response.status_code == 200
    assert response.content[:2] == b"PK"
