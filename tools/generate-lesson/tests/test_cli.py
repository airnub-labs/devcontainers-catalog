import json
import sys
import tempfile
import textwrap
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from generate_lesson import cli


class CLITests(unittest.TestCase):
    def test_parse_simple_yaml_roundtrip(self):
        text = textwrap.dedent(
            """
            root:
              child: value
              list:
                - item-one
                - item-two
            """
        )
        parsed = cli.parse_simple_yaml(text)
        self.assertEqual(parsed["root"]["child"], "value")
        self.assertEqual(parsed["root"]["list"], ["item-one", "item-two"])

    def test_partition_spec_fields(self):
        spec = {
            "base_preset": "full",
            "resources": {"cpu": "2"},
            "unknown_field": True,
        }
        unsupported, unknown = cli.partition_spec_fields(spec)
        self.assertEqual(unsupported, ("resources",))
        self.assertEqual(unknown, ("unknown_field",))

    def test_merge_services_includes_vars(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            artifacts = cli.merge_services(
                [{"name": "redis", "vars": {"REDIS_PASSWORD": "classroom"}}],
                tmp_path,
            )
            self.assertIn("redis", artifacts.names)
            self.assertEqual(artifacts.vars["redis"]["REDIS_PASSWORD"], "classroom")
            self.assertTrue((tmp_path / "services" / "redis").exists())

    def test_generate_aggregate_compose_applies_service_vars(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            artifacts = cli.merge_services(
                [{"name": "redis", "vars": {"REDIS_PASSWORD": "classroom"}}],
                tmp_path,
            )
            manifest = {"spec": {"emit_aggregate_compose": True}}
            compose_path = cli.generate_aggregate_compose(manifest, tmp_path, artifacts)
            self.assertIsNotNone(compose_path)
            content = compose_path.read_text(encoding="utf-8")
            self.assertIn("REDIS_PASSWORD", content)
            self.assertIn('"classroom"', content)

    def test_write_generated_repo_scaffold_includes_features_and_env(self):
        manifest = {
            "metadata": {"org": "acme", "course": "math", "lesson": "algebra"},
            "spec": {
                "base_preset": "full",
                "image_tag_strategy": "ubuntu-24.04",
                "features": {"ghcr.io/devcontainers/features/node": {"version": "20"}},
                "env": {"NODE_ENV": "development"},
            },
        }
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            cli.write_generated_repo_scaffold(manifest, tmp_path, "acme-math-algebra", None)
            devc_path = tmp_path / ".devcontainer" / "devcontainer.json"
            data = json.loads(devc_path.read_text(encoding="utf-8"))
            self.assertIn("features", data)
            self.assertIn("containerEnv", data)
            self.assertEqual(data["containerEnv"]["NODE_ENV"], "development")

    def test_write_stack_lock_collects_images(self):
        manifest = {
            "metadata": {"org": "acme", "course": "math", "lesson": "algebra"},
            "spec": {
                "base_preset": "full",
                "image_tag_strategy": "ubuntu-24.04",
                "services": [{"name": "redis"}],
            },
        }
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            artifacts = cli.merge_services(manifest["spec"].get("services"), tmp_path)
            lock_path = cli.write_stack_lock(manifest, tmp_path, artifacts)
            self.assertIsNotNone(lock_path)
            lock = json.loads(lock_path.read_text(encoding="utf-8"))
            self.assertIn("lesson-base", lock["images"])
            self.assertIn("lesson-runtime", lock["images"])
            self.assertIn("redis:redis", lock["images"])

    def test_write_starter_repo_metadata(self):
        spec = {"starter_repo": {"url": "https://example.com/repo.git", "path": "/workspace"}}
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            target = cli.write_starter_repo_metadata(spec, tmp_path)
            self.assertIsNotNone(target)
            payload = json.loads(Path(target).read_text(encoding="utf-8"))
            self.assertEqual(payload["url"], "https://example.com/repo.git")


if __name__ == "__main__":
    unittest.main()
