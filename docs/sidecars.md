# Sidecar usage terms

Certain sidecars in the catalog bundle full desktop environments that are maintained by third parties. Instructors must review and accept the upstream usage terms before distributing classrooms that rely on these images. The catalog surfaces the same information in `catalog/sidecars.json` via the `usage` blocks and in generator outputs (`manifest.json`, README) so the reminder appears during planning and at delivery time.

| Sidecar ID | Summary | Upstream licence | Catalog guidance |
| --- | --- | --- | --- |
| `neko-chrome`, `neko-firefox` | WebRTC desktop sidecars maintained by m1k1o. | [github.com/m1k1o/neko/blob/master/LICENSE](https://github.com/m1k1o/neko/blob/master/LICENSE) | This page (`#neko-browser-sidecars`) |
| `kasm-chrome` | HTTPS desktop powered by Kasm Workspaces CE. | [kasmweb.com/kasm-workspaces-license](https://www.kasmweb.com/kasm-workspaces-license) | This page (`#kasm-chrome`) |
| `webtop` | LinuxServer.io browser desktop. | [github.com/linuxserver/docker-webtop#license](https://github.com/linuxserver/docker-webtop#license) | This page (`#linuxserver-webtop`) |

## Neko browser sidecars

Neko sidecars (`neko-chrome`, `neko-firefox`) stream a Chrome or Firefox desktop via WebRTC. They ship without default credentials—set `NEKO_*_PASSWORD` values before exposing the service. Review the upstream [licence](https://github.com/m1k1o/neko/blob/master/LICENSE) and confirm it aligns with your classroom distribution plan.

## Kasm Chrome

`kasm-chrome` uses the Kasm Workspaces Community Edition image. The upstream [licence](https://www.kasmweb.com/kasm-workspaces-license) governs redistribution. Accept the terms and set `KASM_VNC_PW` (no defaults) before inviting students.

## LinuxServer Webtop

The `webtop` sidecar runs LinuxServer.io's desktop image. Review their [licence summary](https://github.com/linuxserver/docker-webtop#license) and keep forwarded ports private by default.

---

**Reminder:** generator outputs (`manifest.json`, README) include these usage notes whenever a listed sidecar is selected, keeping instructors aware during planning and review.
