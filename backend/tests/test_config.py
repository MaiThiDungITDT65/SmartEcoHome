import pytest
from app.config import Settings, get_settings


def test_default_config():
    settings = Settings()
    assert settings.HOST == "0.0.0.0"
    assert settings.PORT == 8000
    assert settings.TELEMETRY_TIMEOUT_SECONDS == 30.0
    assert settings.TIMEOUT_CHECK_INTERVAL_SECONDS == 1.0
    assert settings.TELEMETRY_API_KEY is None
    assert "http://localhost:3000" in settings.CORS_ORIGINS


def test_config_env_override(monkeypatch):
    monkeypatch.setenv("HOST", "127.0.0.1")
    monkeypatch.setenv("PORT", "9000")
    monkeypatch.setenv("TELEMETRY_TIMEOUT_SECONDS", "15.5")
    monkeypatch.setenv("TELEMETRY_API_KEY", "super-secret-key")
    monkeypatch.setenv("CORS_ORIGINS", '["http://myapp.local"]')

    settings = Settings()
    assert settings.HOST == "127.0.0.1"
    assert settings.PORT == 9000
    assert settings.TELEMETRY_TIMEOUT_SECONDS == 15.5
    assert settings.TELEMETRY_API_KEY == "super-secret-key"
    assert settings.CORS_ORIGINS == ["http://myapp.local"]
