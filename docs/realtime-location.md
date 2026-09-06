# Realtime location

CRM LIVE varsayılanı: workspace event `bach:live-updated` + 4 sn poll.

Fastify Socket.IO (`apps/api/src/realtime/socket.ts`):

- Auth: JWT. Room: `company:{cid}`.
- Client: `live:subscribe`.
- Events (`v: 1`): `location.updated`, `route.updated`, `geofence.entered`, `geofence.exited`, `driver.online`, `driver.offline`.

Payload’da secret token yoktur. Konum geçmişi görüntüleme `activity_logs` `live.history.view` ile yazılır.
