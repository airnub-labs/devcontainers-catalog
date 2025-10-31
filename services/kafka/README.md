# Kafka Fragment

This fragment provisions a single-node Apache Kafka 3.7 broker using KRaft mode (no external ZooKeeper). It is tuned for lessons that need to explore event streaming locally without the overhead of a multi-broker cluster.

## Compose Files

- `docker-compose.kafka-kraft.yml` — core Kafka broker with healthcheck and sensible defaults for development.
- `docker-compose.kafka-utils.yml` — optional kafkacat producer/consumer helpers for smoke-testing topics during workshops.

## Ports

- `9092` → Kafka plaintext listener (`PLAINTEXT://kafka:9092` inside the network, `localhost:9092` by default on the host)

## Usage Tips

- Uncomment the host listener block in the Compose file if you need to reach Kafka from tools running outside Docker (e.g., local IDEs).
- The broker auto-creates topics to streamline exercises; add explicit topic provisioning in production-focused lessons.
- When including the helper fragment, the sample producer publishes to `demo-topic` every few seconds so students can immediately read data from the matching consumer.

## Aggregate Compose

Add `kafka` to `spec.services` to bundle the broker (and optionally the helpers) into `aggregate.compose.yml`. The generator ensures the service name stays `kafka`, so manifests and application configs can reference it consistently.
