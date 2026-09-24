const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!base || !serviceKey) {
  console.error("REMOTE AUDIT FAILED: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(base)) {
  console.error("REMOTE AUDIT FAILED: invalid Supabase URL format");
  process.exit(1);
}
const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
async function get(path) {
  const response = await fetch(`${base}${path}`, { headers });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status} ${await response.text()}`);
  return response.json();
}
const [locations, equipment, versions, bm06Assets, profiles, scopes, authResponse] = await Promise.all([
  get("/rest/v1/locations?select=code&code=in.(SINH_HOA,MIEN_DICH,NUOC_TIEU,LY_TAM,NHAN_BENH_PHAM)"),
  get("/rest/v1/assets?select=source_order,locations(code)&asset_type=eq.LAB_EQUIPMENT&active=eq.true"),
  get("/rest/v1/form_template_versions?select=id,form_templates!inner(code)&status=eq.PUBLISHED"),
  get("/rest/v1/form_version_assets?select=asset_id,form_template_versions!inner(form_templates!inner(code))&form_template_versions.form_templates.code=eq.BM.06%2FQL.TRTB.01"),
  get("/rest/v1/profiles?select=user_id,business_role,active"),
  get("/rest/v1/user_scope_assignments?select=user_id,can_view,can_enter,active"),
  fetch(`${base}/auth/v1/admin/users?page=1&per_page=1`, { headers }).then(async response => {
    if (!response.ok) throw new Error(`/auth/v1/admin/users: HTTP ${response.status}`);
    return response.json();
  }),
]);
const users = Array.isArray(authResponse) ? authResponse : authResponse.users ?? [];
const areaCounts = Object.fromEntries(["SINH_HOA", "MIEN_DICH", "NUOC_TIEU", "LY_TAM"].map(code => [code, equipment.filter(item => item.locations?.code === code).length]));
const expectedCounts = { SINH_HOA: 9, MIEN_DICH: 8, NUOC_TIEU: 4, LY_TAM: 4 };
const failures = [];
if (locations.length !== 5) failures.push(`expected 5 operational locations, got ${locations.length}`);
if (equipment.length !== 25) failures.push(`expected 25 lab equipment rows, got ${equipment.length}`);
for (const [code, count] of Object.entries(expectedCounts)) if (areaCounts[code] !== count) failures.push(`${code}: expected ${count}, got ${areaCounts[code] ?? 0}`);
if (versions.length !== 6) failures.push(`expected 6 published form versions, got ${versions.length}`);
if (bm06Assets.length !== 25) failures.push(`expected 25 BM.06 snapshot assets, got ${bm06Assets.length}`);
if (users.length < 1) failures.push("no Supabase Auth user exists");
const activeProfiles = profiles.filter(profile => profile.active && ["DEPARTMENT_HEAD", "DOCTOR", "TECHNICIAN"].includes(profile.business_role));
const hasOperationalAccess = activeProfiles.some(profile => profile.business_role === "DEPARTMENT_HEAD") || scopes.some(scope => scope.active && scope.can_view && activeProfiles.some(profile => profile.user_id === scope.user_id));
if (!activeProfiles.length) failures.push("no active application profile with a valid business role exists");
if (!hasOperationalAccess) failures.push("no active department head or scoped business user exists");
if (failures.length) {
  console.error("REMOTE AUDIT FAILED:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, locations: locations.length, equipment: equipment.length, areaCounts, publishedVersions: versions.length, bm06SnapshotAssets: bm06Assets.length, authUsers: users.length, activeProfiles: activeProfiles.length, activeBusinessScopes: scopes.filter(scope => scope.active && scope.can_view).length }));
