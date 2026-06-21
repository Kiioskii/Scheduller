def test_generate_schedule_endpoint_runs_solver(client) -> None:
    response = client.post(
        "/internal/v1/schedules/generate",
        json={
            "year": 2026,
            "month": 6,
            "dayAssignments": [
                {"date": "2026-06-02", "shiftTemplateId": "1"},
            ],
            "holidays": [],
            "workers": [
                {
                    "id": "1",
                    "firstName": "Anna",
                    "lastName": "Nowak",
                    "role": "worker",
                    "priority": 5,
                    "checker": False,
                    "deleted": False,
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
                            "requiredWorkers": 1,
                            "start": "08:00",
                            "end": "16:00",
                            "weekdays": ["tuesday"],
                        }
                    ],
                }
            ],
            "workerDrafts": [],
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] in {"completed", "failed"}
    assert data["workerCount"] == 0
    assert data["assignmentCount"] == 0
    assert data["solverStatus"] == "infeasible"
    assert data["jobId"]
