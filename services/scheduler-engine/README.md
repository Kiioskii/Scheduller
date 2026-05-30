# scheduler-engine

Wewnętrzny serwis Python (FastAPI) wywoływany przez NestJS — nie jest wystawiany do frontendu.

## Struktura

```
src/scheduler_engine/
  main.py           # fabryka aplikacji FastAPI
  api/
    dependencies.py # auth wewnętrzny, wstrzykiwanie Settings
    router.py       # prefix /internal
    v1/             # wersjonowane endpointy
  core/
    config.py       # pydantic-settings
    logging.py
    middleware.py   # X-Request-Id
  schemas/          # modele Pydantic (kontrakty API)
  services/         # logika domenowa (solver, import, …)
tests/
```

Publiczny kontrakt dla NestJS: **`/internal/v1/*`**.

## Wymagania

- Python ≥ 3.12
- [uv](https://docs.astral.sh/uv/) (zalecane) lub pip

## Lokalny start

```bash
cd services/scheduler-engine
cp .env.example .env

# uv (zalecane)
uv venv && source .venv/bin/activate
uv pip install -e ".[dev]"
python -m scheduler_engine

# lub pip
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
python -m scheduler_engine
```

- Health: http://localhost:8000/internal/v1/health
- OpenAPI (tylko `ENVIRONMENT=development`): http://localhost:8000/docs

## Testy i lint

```bash
pytest
ruff check src tests
ruff format --check src tests
```

## Docker

Z roota repozytorium (razem z backendem i Redis):

```bash
docker compose up --build scheduler-engine
```

W dev overlay port `8000` jest mapowany na hosta.

## Integracja z NestJS

Backend powinien wołać ten serwis po URL z env (np. `SCHEDULER_ENGINE_URL=http://scheduler-engine:8000`).

Opcjonalnie ustaw `INTERNAL_API_KEY` w obu serwisach i wysyłaj nagłówek `X-Internal-Api-Key` z NestJS.

Propaguj `X-Request-Id` z requestu użytkownika, żeby łączyć logi między Nest a Pythonem.
