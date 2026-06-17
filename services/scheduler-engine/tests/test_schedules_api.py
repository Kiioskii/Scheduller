def test_generate_schedule_endpoint_stub(client) -> None:
    response = client.post(
        "/internal/v1/schedules/generate",
        json={
            "year": 2026,
            "month": 6,
            "dayAssignments": [
                {"date": "2026-06-01", "shiftTemplateId": "1"},
            ],
            "holidays": [
                {
                    "id": "1",
                    "createdAt": "2026-01-01T00:00:00.000Z",
                    "name": "Boże Ciało",
                    "date": "2026-06-11",
                    "start": None,
                    "end": None,
                }
            ],
            "shiftTemplates": [
                {
                    "id": "1",
                    "name": "Zmiany standardowe",
                    "createdAt": "2026-01-01T00:00:00.000Z",
                    "shifts": [
                        {
                            "role": "worker",
                            "requiredWorkers": 2,
                            "start": "08:00",
                            "end": "16:00",
                            "weekdays": ["monday", "tuesday", "wednesday", "thursday", "friday"],
                        }
                    ],
                }
            ],
            "workerDrafts": [
                {
                    "draftId": "10",
                    "workerId": "42",
                    "fileName": "podklad.xlsx",
                    "contentBase64": "UEsDBAoAAAAAAA==",
                }
            ],
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "accepted"
    assert data["draftCount"] == 1
    assert data["holidayCount"] == 1
    assert data["jobId"]
    assert "not implemented" in data["message"].lower()
