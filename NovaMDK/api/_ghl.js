const BASE = process.env.GHL_API_BASE || "https://services.leadconnectorhq.com";
const TOKEN = process.env.GHL_API_TOKEN;
const LOCATION_ID = process.env.GHL_LOCATION_ID;
const VERSION = process.env.GHL_API_VERSION || "2021-07-28";

export const ghlConfigured = () => Boolean(TOKEN && LOCATION_ID);
const FIELD = {
  TREATMENT: "treatment",
  SEX_AT_BIRTH: "sex_at_birth",
  EMAIL_ADDRESS: "email_address",
};
const TREATMENT_FIELD_ID = "aUvylLMgR2BFDDjxKNm1";
const TREATMENT_SEPARATOR = "; ";
const TREATMENT_MAX_LENGTH = 500;
const SEX_AT_BIRTH = { 1: "Male", 2: "Female" };

async function ghlFetch(path, { method = "GET", body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Version: VERSION,
      Accept: "application/json",
      ...(body && { "Content-Type": "application/json" }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* error bodies aren't always JSON — fall through with the raw text */
  }

  if (!res.ok) {
    const err = new Error(data?.message || `GHL ${method} ${path} failed (${res.status})`);
    err.status = res.status;
    err.details = data ?? text;
    throw err;
  }
  return data;
}

/* GHL stores phone numbers in E.164; the intake modal collects them free-form. */
function toE164(raw) {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits ? `+${digits}` : null;
}

const clean = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);

// GET responses spell it `value`, upsert responses spell it `fieldValue`.
const treatmentOf = (contact) =>
  clean(
    (contact?.customFields || []).find((f) => f.id === TREATMENT_FIELD_ID)
      ?.value ??
      (contact?.customFields || []).find((f) => f.id === TREATMENT_FIELD_ID)
        ?.fieldValue
  );

// Append `next` unless it's already listed, dropping the oldest entries if the
// field would overflow.
function mergeTreatment(previous, next) {
  if (!next) return null;
  const list = previous ? previous.split(TREATMENT_SEPARATOR).map((s) => s.trim()).filter(Boolean) : [];
  if (list.includes(next)) return list.join(TREATMENT_SEPARATOR);
  list.push(next);
  while (list.length > 1 && list.join(TREATMENT_SEPARATOR).length > TREATMENT_MAX_LENGTH) list.shift();
  return list.join(TREATMENT_SEPARATOR);
}

export async function upsertContact({ patient = {}, treatment, tags = [], source } = {}) {
  const email = clean(patient.email);
  const phone = toE164(patient.phone_number);
  if (!email && !phone) throw new Error("A GHL contact needs at least an email or a phone number.");

  const address = patient.address || {};
  const customFields = [];
  const addField = (key, value) => value && customFields.push({ key, field_value: value });
  const nextTreatment = clean(treatment);
  addField(FIELD.SEX_AT_BIRTH, SEX_AT_BIRTH[Number(patient.gender)]);
  addField(FIELD.EMAIL_ADDRESS, email);

  const body = {
    locationId: LOCATION_ID,
    country: "US",
    ...(email && { email }),
    ...(phone && { phone }),
    ...(clean(patient.first_name) && { firstName: clean(patient.first_name) }),
    ...(clean(patient.last_name) && { lastName: clean(patient.last_name) }),
    ...(clean(patient.date_of_birth) && { dateOfBirth: clean(patient.date_of_birth) }),
    ...(clean(address.address) && { address1: clean(address.address) }),
    ...(clean(address.city_name) && { city: clean(address.city_name) }),
    ...(clean(address.state_name) && { state: clean(address.state_name) }),
    ...(clean(address.zip_code) && { postalCode: clean(address.zip_code) }),
    ...(clean(source) && { source: clean(source) }),
    ...(customFields.length && { customFields }),
  };

  const data = await ghlFetch("/contacts/upsert", { method: "POST", body });
  const contact = data?.contact || null;

  if (phone && contact && !contact.phone) {
    console.warn(`GHL saved contact ${contact.id} without its phone — that number already belongs to another contact.`);
  }

  if (contact?.id && nextTreatment) {
    const previous = treatmentOf(contact);
    const merged = mergeTreatment(previous, nextTreatment);
    if (merged && merged !== previous) {
      try {
        await ghlFetch(`/contacts/${contact.id}`, {
          method: "PUT",
          body: { customFields: [{ key: FIELD.TREATMENT, field_value: merged }] },
        });
      } catch (e) {
        console.error("GHL treatment update failed:", e.message);
      }
    }
  }

  const wanted = tags.filter(Boolean);
  if (contact?.id && wanted.length) {
    try {
      await ghlFetch(`/contacts/${contact.id}/tags`, { method: "POST", body: { tags: wanted } });
    } catch (e) {
      console.error("GHL tagging failed:", e.message);
    }
  }

  return contact;
}

// Which pipeline a visit lands in. Optional — with nothing set we take the
// location's first pipeline and its first stage, which is right for a location
// that only has one.
const PIPELINE_NAME = process.env.GHL_PIPELINE_NAME || null;
const STAGE_NAME = process.env.GHL_STAGE_NAME || null;

// Resolved once per warm function instance: pipeline ids never change between
// requests, and this saves a round trip on every visit.
let pipelineCache = null;

async function resolvePipeline() {
  if (pipelineCache) return pipelineCache;
  const data = await ghlFetch(`/opportunities/pipelines?locationId=${LOCATION_ID}`);
  const pipelines = data?.pipelines || [];
  const pipeline =
    (PIPELINE_NAME && pipelines.find((p) => p.name?.toLowerCase() === PIPELINE_NAME.toLowerCase())) ||
    pipelines[0];
  if (!pipeline) throw new Error("No GHL pipeline exists for this location — create one in Opportunities.");

  const stages = pipeline.stages || [];
  const stage =
    (STAGE_NAME && stages.find((s) => s.name?.toLowerCase() === STAGE_NAME.toLowerCase())) || stages[0];
  if (!stage) throw new Error(`GHL pipeline "${pipeline.name}" has no stages.`);

  pipelineCache = { pipelineId: pipeline.id, stageId: stage.id, label: `${pipeline.name} / ${stage.name}` };
  return pipelineCache;
}

/* One opportunity per visit, hanging off the single patient contact — this is
 * how repeat visits stay individually trackable without duplicating the person.
 * Deliberately separate from upsertContact: a patient who books twice is one
 * contact and two opportunities. */
export async function createVisitOpportunity({ contactId, treatment, value, source } = {}) {
  const name = clean(treatment);
  if (!contactId || !name) return null;

  const { pipelineId, stageId } = await resolvePipeline();
  const amount = Number(value) > 0 ? { monetaryValue: Number(value) } : null;

  try {
    const data = await ghlFetch("/opportunities/", {
      method: "POST",
      body: {
        locationId: LOCATION_ID,
        contactId,
        pipelineId,
        pipelineStageId: stageId,
        name,
        status: "open",
        ...amount,
        ...(clean(source) && { source: clean(source) }),
      },
    });
    return { opportunity: data?.opportunity || null, created: true };
  } catch (e) {
    // Unless the location allows duplicates, GHL caps a contact at one
    // opportunity per pipeline — regardless of status, so closing the old one
    // doesn't help. Rather than drop the visit, roll the existing record
    // forward to the new treatment. Per-visit history still survives in the
    // contact's Treatment list and its notes timeline.
    const existingId = e.details?.meta?.existingId;
    if (e.details?.code !== "OPPORTUNITY_NO_DUPLICATE" || !existingId) throw e;

    const data = await ghlFetch(`/opportunities/${existingId}`, {
      method: "PUT",
      body: { name, ...amount },
    });
    return { opportunity: data?.opportunity || null, created: false };
  }
}

export async function addContactNote(contactId, note) {
  const body = clean(note);
  if (!contactId || !body) return null;
  return ghlFetch(`/contacts/${contactId}/notes`, { method: "POST", body: { body } });
}
