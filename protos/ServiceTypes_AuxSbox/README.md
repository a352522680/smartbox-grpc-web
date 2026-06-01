# ServiceTypes_AuxSbox

This folder defines the auxiliary telemetry gRPC interfaces for `package smt_iot.v1.aux`.

Services:
- `CncPlcService` exposes CNC identity, status, utilization, and status-history queries.
- `UtilityService` exposes facility discovery, utility usage queries, and the `0001001` dashboard payload.

Local shared types:
- `TCncTypes.proto` contains CNC enums and reusable CNC payload types.
- `TUtilityTypes.proto` contains utility usage request/response payload types used by the utility RPCs, including illumination-only energy tracking on `UtilityUsage`, `UtilityUsageByDay`, `UtilityUsageByMonth`, and `UtilityUsageByWorkYear`, facility-grouped daily dashboard usage, plus reference-workyear fields used by the specialized dashboard response.

External reuse:
- `ReusableTypes_Common/TIotStatus.proto` is the only reused repo type dependency.
