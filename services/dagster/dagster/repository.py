from dagster import Definitions, asset


@asset
def example_asset() -> str:
    """Sample Dagster asset to keep the webserver healthy."""
    return "ready"


defs = Definitions(assets=[example_asset])
