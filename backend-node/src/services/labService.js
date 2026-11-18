const repository = require("../repositories/labRepository");

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function httpError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function getAllRequests() {
  return repository.findAllRequests();
}

async function getRequestById(id) {
  if (!UUID_REGEX.test(id)) {
    throw httpError("Format ID tidak valid.");
  }

  const request = await repository.findRequestById(id);

  if (!request) {
    throw httpError("Permintaan lab tidak ditemukan.", 404);
  }

  const results = await repository.findResultsByRequestId(id);

  return {
    ...request,
    results,
  };
}

async function submitResult(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw httpError("Body request harus berupa JSON object.");
  }

  if (
    typeof data.lab_request_id !== "string" ||
    !UUID_REGEX.test(data.lab_request_id)
  ) {
    throw httpError("lab_request_id harus berupa UUID valid.");
  }

  if (
    typeof data.result_value !== "string" ||
    data.result_value.trim() === ""
  ) {
    throw httpError("result_value wajib diisi.");
  }

  for (const field of ["unit", "reference_range", "notes"]) {
    if (
      data[field] !== undefined &&
      data[field] !== null &&
      typeof data[field] !== "string"
    ) {
      throw httpError(`${field} harus berupa string.`);
    }
  }

  return repository.createResult(data);
}

module.exports = {
  getAllRequests,
  getRequestById,
  submitResult,
};
