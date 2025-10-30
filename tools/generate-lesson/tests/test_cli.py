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
        self.assertEqual(unsupported, tuple())
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
                "resources": {"cpu": "4", "memory": "16GB"},
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
            self.assertIn("hostRequirements", data)
            self.assertEqual(data["hostRequirements"]["cpus"], 4)
            self.assertEqual(data["hostRequirements"]["memory"], "16GB")

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

    def test_write_secrets_placeholders(self):
        spec = {"secrets_placeholders": ["API_KEY", "API_KEY", "  ", "TOKEN"]}
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            path = cli.write_secrets_placeholders(spec, tmp_path)
            self.assertIsNotNone(path)
            content = Path(path).read_text(encoding="utf-8")
            self.assertIn("API_KEY=", content)
            self.assertIn("TOKEN=", content)

    def test_write_generation_summary_includes_sections(self):
        manifest = {
            "metadata": {"org": "acme", "course": "math", "lesson": "algebra"},
            "spec": {
                "base_preset": "full",
                "image_tag_strategy": "ubuntu-24.04",
                "secrets_placeholders": ["API_KEY"],
                "resources": {"cpu": "8", "memory": "32GB"},
            },
        }
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            env_example = tmp_path / ".env.example-redis"
            env_example.write_text("", encoding="utf-8")
            services_readme = tmp_path / "README-SERVICES.md"
            services_readme.write_text("", encoding="utf-8")
            secrets_file = tmp_path / "secrets.placeholders.env"
            secrets_file.write_text("API_KEY=\n", encoding="utf-8")
            artifacts = cli.ServiceArtifacts(
                names=("redis",),
                fragments={"redis": tuple()},
                env_examples={"redis": env_example},
                vars={},
                missing=tuple(),
            )
            summary_path = cli.write_generation_summary(
                manifest,
                "acme-math-algebra",
                tmp_path,
                artifacts,
                secrets_file,
                services_readme,
            )
            summary = Path(summary_path).read_text(encoding="utf-8")
            self.assertIn("Secrets to Provide", summary)
            self.assertIn("Service Environment Files", summary)
            self.assertIn("Resource Guidance", summary)

    def test_cli_main_generates_artifacts_end_to_end(self):
        manifest_text = textwrap.dedent(
            """
            apiVersion: airnub.devcontainers/v1
            kind: LessonEnv
            metadata:
              org: acme
              course: math
              lesson: algebra
            spec:
              base_preset: full
              image_tag_strategy: ubuntu-24.04
              services:
                - name: redis
              secrets_placeholders:
                - REDIS_PASSWORD
              resources:
                cpu: "4"
                memory: 8GB
            """
        )
        with tempfile.TemporaryDirectory() as tmp:
            repo_root = Path(tmp) / "repo"
            repo_root.mkdir()
            services_dir = repo_root / "services" / "redis"
            services_dir.mkdir(parents=True)
            (services_dir / "docker-compose.redis.yml").write_text(
                textwrap.dedent(
                    """
                    services:
                      redis:
                        image: redis:7
                    """
                ).strip()
                + "\n",
                encoding="utf-8",
            )
            (services_dir / ".env.example").write_text("REDIS_PASSWORD=\n", encoding="utf-8")
            manifest_path = repo_root / "manifest.yaml"
            manifest_path.write_text(manifest_text, encoding="utf-8")

            original_root = cli.ROOT
            original_argv = sys.argv
            cli.ROOT = repo_root
            sys.argv = ["generate-lesson", "--manifest", str(manifest_path)]
            try:
                exit_code = cli.main()
            finally:
                cli.ROOT = original_root
                sys.argv = original_argv

            self.assertEqual(exit_code, 0)
            slug_dir = repo_root / "images" / "presets" / "generated" / "acme-math-algebra"
            self.assertTrue((slug_dir / "Dockerfile").exists())
            self.assertTrue((slug_dir / "secrets.placeholders.env").exists())
            self.assertTrue((slug_dir / "GENERATION_SUMMARY.md").exists())
            compose_path = slug_dir / "docker-compose.classroom.yml"
            self.assertTrue(compose_path.exists())
            summary_text = (slug_dir / "GENERATION_SUMMARY.md").read_text(encoding="utf-8")
            self.assertIn("REDIS_PASSWORD", summary_text)
            template_dir = repo_root / "templates" / "generated" / "acme-math-algebra"
            self.assertTrue((template_dir / ".devcontainer" / "devcontainer.json").exists())
            self.assertTrue((template_dir / "secrets.placeholders.env").exists())


if __name__ == "__main__":
    unittest.main()
