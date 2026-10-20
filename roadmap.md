# Dokploy adoption

- [x] Fix Google OAuth dashboard access: public callback with sanitized destination; verified signed-out gate, restored-session workspace access and refresh. Google account-selection itself requires the user's retry.

- [x] Pin official source and record full screen coverage and license boundaries in DOKPLOY-COVERAGE.md.
- [x] Replace dashboard design and adopt light, dark and system themes.
- [x] Adapt existing IA, storage, API-key and account presentation; signed-in page rendering verified.
- [x] Remove simulated engine operations and measurements; refusal policy tests pass.
- [x] Add Dokploy navigation and configuration/service screens with truthful disconnected states.
- [ ] Import the legally reusable official Dokploy UI sources with provenance and no upstream credentials; adapt API-token presentation and identify payment-source availability.
- [ ] Replace remaining Dokploy-dependent infrastructure screens with independent integrations — requires a separately provisioned compute provider; existing external connection is transitional, not the target architecture.
- [x] Verify signed-in desktop/mobile page navigation, dark theme persistence and terminal help/Colab dialog controls; actual GPU training is outside verified scope.
- [x] Apply required dependency security update; latest harness build green after minimal error-prop typing fix.