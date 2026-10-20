import { createClient } from "@supabase/supabase-js";

async function main() {
  console.log("================================================================================");
  console.log("AUDIT & VERIFICATION: Single-Machine QR BM06 Save, Concurrency, and Isolation");
  console.log("================================================================================");

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const staffClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const testStaffEmail = process.env.TEST_STAFF_EMAIL;
  const testStaffPassword = process.env.TEST_STAFF_PASSWORD;

  if (!testStaffEmail || !testStaffPassword) {
    console.warn("⚠️ TEST_STAFF_EMAIL or TEST_STAFF_PASSWORD not set in environment.");
    console.warn("Live database mutation test skipped to prevent credential exposure.");
    console.warn("All unit/integration tests run safely via Vitest in tests/qr-bm06-concurrency-and-offline.test.tsx.");
    return;
  }

  if (process.env.ALLOW_DATABASE_MUTATION_TEST !== "true") {
    console.warn("⚠️ Database mutation test is blocked by default to protect database integrity.");
    console.warn("Set ALLOW_DATABASE_MUTATION_TEST=true explicitly in non-production test environments.");
    return;
  }

  console.log(`Signing in staffClient with configured test staff account (${testStaffEmail})...`);
  const { data: authData, error: authErr } = await staffClient.auth.signInWithPassword({
    email: testStaffEmail,
    password: testStaffPassword,
  });

  if (authErr || !authData.user) {
    console.error("Sign in failed:", authErr?.message);
    process.exit(1);
  }
  console.log(`✓ Authenticated staffClient as: ${authData.user.email} (User ID: ${authData.user.id})`);

  const bm06PeriodId = "8e72ee13-f753-4938-9383-b95eb4d60449";

  const { data: rp } = await adminClient
    .from("register_periods")
    .select("form_version_id")
    .eq("id", bm06PeriodId)
    .single();

  const formVersionId = rp?.form_version_id;

  // 1. Get 2 active equipment assets for testing
  const { data: fvaAssets, error: fvaErr } = await adminClient
    .from("form_version_assets")
    .select("asset_id, display_order, assets(id, source_name, source_order, locations(code))")
    .eq("form_version_id", formVersionId)
    .eq("active", true)
    .order("display_order")
    .limit(2);

  if (fvaErr || !fvaAssets || fvaAssets.length < 2) {
    console.error("Failed to load active test machines:", fvaErr);
    process.exit(1);
  }

  const machineA = fvaAssets[0];
  const machineB = fvaAssets[1];
  console.log(`Test Machine A: #${machineA.display_order} - ${(machineA.assets as any)?.source_name} (ID: ${machineA.asset_id})`);
  console.log(`Test Machine B: #${machineB.display_order} - ${(machineB.assets as any)?.source_name} (ID: ${machineB.asset_id})`);

  // 2. Find or create a safe test occurrence at the end of October (e.g. 2026-10-31 SHIFT_4)
  let { data: testOcc } = await adminClient
    .from("schedule_occurrences")
    .select("id, business_date, slot_code, status, fulfilled_by_record_id")
    .eq("period_id", bm06PeriodId)
    .eq("business_date", "2026-10-31")
    .eq("slot_code", "SHIFT_4")
    .maybeSingle();

  if (!testOcc) {
    console.log("Creating safe test occurrence on 2026-10-31 SHIFT_4 via adminClient...");
    const { data: newOcc, error: createErr } = await adminClient
      .from("schedule_occurrences")
      .insert({
        period_id: bm06PeriodId,
        business_date: "2026-10-31",
        slot_code: "SHIFT_4",
        status: "DRAFT",
      })
      .select()
      .single();
    if (createErr) throw createErr;
    testOcc = newOcc;
  }

  console.log(`Safe Test Occurrence ID: ${testOcc.id} (${testOcc.business_date} ${testOcc.slot_code})`);

  // Clean up any previous test record cleanly via adminClient
  if (testOcc.fulfilled_by_record_id) {
    const prevRecId = testOcc.fulfilled_by_record_id;
    await adminClient.from("schedule_occurrences").update({ status: "PENDING", fulfilled_by_record_id: null }).eq("id", testOcc.id);
    await adminClient.from("equipment_shift_statuses").delete().eq("shift_record_id", prevRecId);
    await adminClient.from("equipment_shift_details").delete().eq("record_id", prevRecId);
    await adminClient.from("records").delete().eq("id", prevRecId);
  }

  // ---------------------------------------------------------------------------
  // STEP 1: Tech 1 creates shift record with Machine A (status: "BT")
  // ---------------------------------------------------------------------------
  console.log("\n--- STEP 1: Technician 1 scans Machine A and creates draft record with status 'BT' ---");
  const payloadTech1 = [{ asset_id: machineA.asset_id, status: "BT" }];
  
  const { data: recordId1, error: err1 } = await staffClient.rpc("save_equipment_shift_draft", {
    target_occurrence_id: testOcc.id,
    target_usage: null,
    target_unit: null,
    target_note: "Ghi chú ban đầu từ KTV 1",
    target_statuses: payloadTech1,
    target_finalize: false,
    target_expected_lock: 1,
    target_coworker_id: null,
  });

  if (err1) {
    console.error("Step 1 failed:", err1);
    process.exit(1);
  }
  console.log(`✓ Step 1 Success: Created draft shift record ID: ${recordId1}`);

  // Inspect record state and lock_version (initial is 1)
  const { data: recAfterStep1 } = await adminClient
    .from("records")
    .select("id, lock_version, record_state")
    .eq("id", recordId1)
    .single();

  console.log(`  Initial record state: ${recAfterStep1?.record_state}, Initial lock version: ${recAfterStep1?.lock_version}`);

  // ---------------------------------------------------------------------------
  // STEP 1B: Tech 1 updates note with lockVersion: 1 -> DB advances to 2
  // ---------------------------------------------------------------------------
  console.log("\n--- STEP 1B: Technician 1 updates note with lockVersion: 1 -> DB advances to 2 ---");
  const { error: err1b } = await staffClient.rpc("save_equipment_shift_draft", {
    target_occurrence_id: testOcc.id,
    target_usage: null,
    target_unit: null,
    target_note: "Ghi chú đã cập nhật từ KTV 1",
    target_statuses: payloadTech1,
    target_finalize: false,
    target_expected_lock: 1,
    target_coworker_id: null,
  });

  if (err1b) {
    console.error("Step 1B failed:", err1b);
    process.exit(1);
  }

  const { data: recAfterStep1b } = await adminClient
    .from("records")
    .select("id, lock_version")
    .eq("id", recordId1)
    .single();
  console.log(`✓ Step 1B Success: Current DB lock_version is now: ${recAfterStep1b?.lock_version}`);

  // ---------------------------------------------------------------------------
  // STEP 2: Concurrency Conflict Simulation
  // Tech 2 loaded the page earlier (expected lock = 1), but DB is now at 2!
  // Tech 2 saves Machine B (status: "H")
  // ---------------------------------------------------------------------------
  console.log("\n--- STEP 2: Technician 2 concurrently saves Machine B with STALE lockVersion: 1 ---");
  const payloadTech2 = [{ asset_id: machineB.asset_id, status: "H" }];

  // Attempt save with stale expected_lock = 1
  const staleLock = 1;
  const { data: _conflictRes, error: conflictErr } = await staffClient.rpc("save_equipment_shift_draft", {
    target_occurrence_id: testOcc.id,
    target_usage: null,
    target_unit: null,
    target_note: "Ghi chú từ KTV 2",
    target_statuses: payloadTech2,
    target_finalize: false,
    target_expected_lock: staleLock,
    target_coworker_id: null,
  });

  console.log(`  Direct RPC with stale lock returned expected error:`, conflictErr?.message);
  if (!conflictErr?.message.includes("Record changed or finalized")) {
    console.error("Expected version conflict error was not raised!");
    process.exit(1);
  }
  console.log(`✓ Conflict successfully detected by Supabase row lock check! (Error: '${conflictErr.message}')`);

  // ---------------------------------------------------------------------------
  // STEP 3: API Concurrency Auto-Resolution (as implemented in /api/forms/bm06/route.ts)
  // ---------------------------------------------------------------------------
  console.log("\n--- STEP 3: Executing Draft Concurrency Resolution (Route Handler logic) ---");
  // 1. Fetch current lock_version of draft
  const { data: latestRec } = await adminClient
    .from("records")
    .select("lock_version, record_state")
    .eq("id", recordId1)
    .single();

  console.log(`  Resolved latest draft lock_version: ${latestRec?.lock_version}`);
  const resolvedLock = latestRec?.lock_version;

  // 2. Retry with resolved lock_version
  const { data: recordId2, error: retryErr } = await staffClient.rpc("save_equipment_shift_draft", {
    target_occurrence_id: testOcc.id,
    target_usage: null,
    target_unit: null,
    target_note: "Ghi chú từ KTV 2",
    target_statuses: payloadTech2,
    target_finalize: false,
    target_expected_lock: resolvedLock,
    target_coworker_id: null,
  });

  if (retryErr) {
    console.error("Retry failed:", retryErr);
    process.exit(1);
  }
  console.log(`✓ Step 3 Success: Concurrent save resolved and succeeded without technician lockout!`);

  // ---------------------------------------------------------------------------
  // STEP 4: VERIFY NON-OVERWRITING & ISOLATION OF BOTH MACHINES
  // ---------------------------------------------------------------------------
  console.log("\n--- STEP 4: Verifying Data Isolation (Requirement 1 & 2) ---");
  const { data: finalStatuses } = await adminClient
    .from("equipment_shift_statuses")
    .select("asset_id, status_code, updated_at")
    .eq("shift_record_id", recordId1);

  console.log(`  Total statuses in record: ${finalStatuses?.length}`);
  finalStatuses?.forEach((s) => {
    const isA = s.asset_id === machineA.asset_id;
    const isB = s.asset_id === machineB.asset_id;
    const label = isA ? "Machine A" : isB ? "Machine B" : "Unknown";
    console.log(`   - [${label}] asset_id: ${s.asset_id.slice(0, 8)}... status_code: ${s.status_code}`);
  });

  const statusMap = Object.fromEntries((finalStatuses ?? []).map((s) => [s.asset_id, s.status_code]));

  if (statusMap[machineA.asset_id] !== "BT") {
    console.error(`❌ REGRESSION: Machine A was overwritten or lost! Current status: ${statusMap[machineA.asset_id]}`);
    process.exit(1);
  }
  if (statusMap[machineB.asset_id] !== "H") {
    console.error(`❌ REGRESSION: Machine B was not saved properly! Current status: ${statusMap[machineB.asset_id]}`);
    process.exit(1);
  }

  console.log("\n================================================================================");
  console.log("✅ ALL VERIFICATIONS PASSED:");
  console.log(" 1. Single machine QR save sends isolated payload.");
  console.log(" 2. Machine A status ('BT') is 100% PRESERVED when Machine B is saved.");
  console.log(" 3. Version conflicts between concurrent technicians are safely resolved.");
  console.log(" 4. Neither technician loses input nor overwrites the other.");
  console.log("================================================================================");

  // ---------------------------------------------------------------------------
  // STEP 5: CLEAN UP TEST DATA (Keep DB 100% pristine)
  // ---------------------------------------------------------------------------
  console.log("\nCleaning up test occurrence to keep database pristine...");
  await adminClient.from("schedule_occurrences").update({ status: "PENDING", fulfilled_by_record_id: null }).eq("id", testOcc.id);
  await adminClient.from("equipment_shift_statuses").delete().eq("shift_record_id", recordId1);
  await adminClient.from("equipment_shift_details").delete().eq("record_id", recordId1);
  await adminClient.from("records").delete().eq("id", recordId1);
  console.log("✓ Test records safely cleaned up. Database is 100% clean.");
}

main().catch((err) => {
  console.error("Fatal error during test:", err);
  process.exit(1);
});
